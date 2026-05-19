import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/auth/session_manager.dart';
import 'package:mobile/core/auth/token_storage.dart';
import 'package:mobile/core/config/env.dart';
import 'package:mobile/core/network/api_endpoints.dart';
import 'package:mobile/core/providers/cache_provider.dart';
import 'package:mobile/core/providers/connectivity_provider.dart';
import 'package:mobile/core/utils/app_logger.dart';

class AuthRepository {

  AuthRepository(this._storage, this._sessionManager, this._ref)
    : _refreshDio = Dio(
        BaseOptions(
          baseUrl: Env.apiBaseUrl,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
        ),
      );
  final TokenStorage _storage;
  final SessionManager _sessionManager;
  final Ref _ref;

  int _recoveryAttempts = 0;
  final Dio _refreshDio;

  /// Single-flight Refresh with deterministic recovery
  Future<void> refreshToken({String? requestId}) async {
    // 1. Global Single-Flight Guard
    if (_sessionManager.isRefreshing) {
      await _sessionManager.waitForRefresh();
      return;
    }

    // 2. Blacklist Guard
    if (_sessionManager.disableRefresh) {
      throw AuthFailure(AuthFailure.refreshDisabled);
    }

    // 3. Cooldown & Circuit Breaker Guard
    if (_sessionManager.isCircuitOpen) {
      AppLogger.w('[$requestId] Refresh blocked: Circuit Breaker is OPEN');
      throw AuthFailure('CIRCUIT_OPEN');
    }

    if (_sessionManager.shouldCooldown()) {
      AppLogger.w('[$requestId] Refresh blocked by cooldown window');
      return;
    }

    // 4. Severe Expiry Override
    if (await _storage.isSeverelyExpired()) {
      AppLogger.w('[$requestId] Session severely expired. Forcing logout.');
      _sessionManager.clearWaiters(AuthFailure(AuthFailure.severeExpiry));
      await logout(reason: 'SEVERE_EXPIRY');
      throw AuthFailure(AuthFailure.severeExpiry);
    }

    _sessionManager.startRefreshing();
    final startTime = DateTime.now();
    final waitersAtStart = _sessionManager.waitersCount;

    try {
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken == null) throw AuthFailure(AuthFailure.invalidToken);

      // 4.5 Connectivity Health Check (Fast Ping with Single-Flight Deduplication)
      if (requestId != 'BOOTSTRAP-REFRESH') {
        try {
          await _sessionManager.performHealthCheck(() async {
            await _refreshDio.get<dynamic>('health').timeout(const Duration(seconds: 2));
          });
        } catch (e) {
          AppLogger.w(
            '[$requestId] Connectivity check failed. Skipping refresh.',
          );
          _sessionManager.setDegraded(true);
          throw AuthFailure('OFFLINE');
        }
      }

      AppLogger.i(
        '🚀 [$requestId] Initiating token refresh (waiters: $waitersAtStart)',
      );

      final response = await _refreshDio
          .post<dynamic>(ApiEndpoints.refresh, data: {'refreshToken': refreshToken})
          .timeout(
            const Duration(seconds: 10),
            onTimeout: () {
              throw RefreshTimeoutException();
            },
          );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = response.data['data'] ?? response.data;
        final newAccess = data['accessToken'] as String;
        final newRefresh = data['refreshToken'] as String;
        final expiry =
            data['expiry'] as int? ??
            (DateTime.now().millisecondsSinceEpoch + 3600000);

        // Atomic Token Write Guard
        if (_sessionManager.isLoggingOut || !_sessionManager.isAuthenticated) {
          AppLogger.w(
            '[$requestId] Discarding refresh result: session invalid/logout in progress',
          );
          _sessionManager.completeRefresh();
          return;
        }

        await _storage.saveTokens(
          accessToken: newAccess,
          refreshToken: newRefresh,
          expiryTimestamp: expiry,
        );

        _recoveryAttempts = 0; // Successful refresh resets budget
        _sessionManager.completeRefresh();
        _sessionManager.setDegraded(false);

        final duration = DateTime.now().difference(startTime).inMilliseconds;
        AppLogger.i(
          '✅ [$requestId] Refresh successful ($duration ms, waiters handled: $waitersAtStart)',
        );
      } else if (response.statusCode == 401 || response.statusCode == 403) {
        throw AuthFailure(AuthFailure.invalidToken);
      } else {
        throw DioException(
          requestOptions: response.requestOptions,
          response: response,
          type: DioExceptionType.badResponse,
        );
      }
    } catch (e) {
      final duration = DateTime.now().difference(startTime).inMilliseconds;
      AppLogger.e('❌ [$requestId] Refresh failed after $duration ms', error: e);

      if (e is AuthFailure ||
          (e is DioException &&
              (e.response?.statusCode == 401 ||
                  e.response?.statusCode == 403))) {
        _sessionManager.failRefresh(e);
        await logout(reason: 'REFRESH_FAILURE');
      } else {
        // Network or Transient Error -> Enter Degraded Mode
        _sessionManager.failRefresh(e);
        _sessionManager.setDegraded(true);
      }
      rethrow;
    }
  }

  /// Reset recovery attempts on successful authenticated API response
  void resetRecoveryBudget() {
    if (_recoveryAttempts != 0) {
      AppLogger.d('Resetting recovery attempts budget');
      _recoveryAttempts = 0;
    }
  }

  Future<void> logout({String? reason}) async {
    if (_sessionManager.isLoggingOut) return;

    AppLogger.i('🚪 Initiating logout. Reason: ${reason ?? "User requested"}');
    _sessionManager.setLoggingOut(true);

    try {
      _sessionManager.cancelAllRequests('Logout initiated');
      _sessionManager.setAuthenticated(false);
      _sessionManager.setDegraded(false);
      _sessionManager.setDisableRefresh(true); // Permanent block until login

      // Best effort server logout
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken != null) {
        unawaited(
          _refreshDio
              .post<dynamic>(ApiEndpoints.logout, data: {'refreshToken': refreshToken})
              .timeout(const Duration(seconds: 2))
              .catchError(
                (_) => Response<dynamic>(requestOptions: RequestOptions()),
              ),
        );
      }

      await _storage.clear();
      await _ref.read(localCacheProvider).clearAll();
    } finally {
      _sessionManager.setLoggingOut(false);
    }
  }

  /// Automated Offline Recovery
  void setupRecoveryListener() {
    _ref.listen(connectivityProvider, (previous, next) {
      if (next.isOnline && previous?.status != ConnectionStatus.online) {
        // Connectivity Restored or Backend Reachable again
        _sessionManager.setDegraded(false);

        if (_sessionManager.isDegraded && _recoveryAttempts < 3) {
          AppLogger.i(
            '🌐 Connectivity restored. Triggering auto-refresh recovery.',
          );
          // Add jitter to avoid thundering herd
          unawaited(Future<void>.delayed(
            Duration(milliseconds: 300 + (DateTime.now().millisecond % 300)),
            () {
              _recoveryAttempts++;
              unawaited(refreshToken(requestId: 'RECOVERY-AUTO'));
            },
          ));
        } else if (_recoveryAttempts >= 3) {
          AppLogger.w('Recovery attempts exhausted. Manual login required.');
          logout(reason: 'RECOVERY_EXHAUSTED');
        }
      }
    });
  }

  /// Session Bootstrap Lock
  Future<void> ensureSessionReady() async {
    final startTime = DateTime.now();
    try {
      final accessToken = await _storage.getAccessToken();
      final hasTokens = accessToken != null;
      
      AppLogger.d('🔍 [Bootstrap] Checking tokens... Found: $hasTokens');

      if (!hasTokens) {
        _sessionManager.setAuthenticated(false);
        return;
      }

      if (await _storage.isSeverelyExpired()) {
        AppLogger.w('🔍 [Bootstrap] Tokens found but severely expired.');
        await logout(reason: 'BOOTSTRAP_SEVERE_EXPIRY');
        return;
      }

      // If expiring soon, try a silent refresh
      if (await _storage.isExpiringSoon()) {
        AppLogger.i('🔍 [Bootstrap] Tokens expiring soon. Attempting silent refresh...');
        try {
          await refreshToken(
            requestId: 'BOOTSTRAP-REFRESH',
          ).timeout(const Duration(seconds: 5));
        } catch (e) {
          AppLogger.w(
            'Bootstrap refresh failed/timed out ($e). Entering degraded mode.',
          );
          _sessionManager.setDegraded(true);
        }
      }

      AppLogger.i('🔍 [Bootstrap] Session validated. Marking authenticated.');
      _sessionManager.setAuthenticated(true);
    } finally {
      final duration = DateTime.now().difference(startTime).inMilliseconds;
      AppLogger.i('⏱️ Session bootstrap complete ($duration ms)');
    }
  }
}

final authRepositoryProvider = Provider((ref) {
  final storage = TokenStorage();
  final session = ref.watch(sessionManagerProvider);
  final repo = AuthRepository(storage, session, ref);
  repo.setupRecoveryListener();
  return repo;
});
