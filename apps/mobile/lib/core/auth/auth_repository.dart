import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'token_storage.dart';
import 'session_manager.dart';
import '../network/api_endpoints.dart';
import '../config/env.dart';
import '../utils/app_logger.dart';
import '../providers/connectivity_provider.dart';

class AuthRepository {
  final TokenStorage _storage;
  final SessionManager _sessionManager;
  final Ref _ref;

  int _recoveryAttempts = 0;
  final Dio _refreshDio;

  AuthRepository(this._storage, this._sessionManager, this._ref)
    : _refreshDio = Dio(
        BaseOptions(
          baseUrl: Env.apiBaseUrl,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
        ),
      );

  /// Single-flight Refresh with deterministic recovery
  Future<void> refreshToken({String? requestId}) async {
    // 1. Global Single-Flight Guard
    if (_sessionManager.isRefreshing) {
      await _sessionManager.waitForRefresh();
      return;
    }

    // 2. Blacklist Guard
    if (_sessionManager.disableRefresh) {
      throw AuthFailure(AuthFailure.REFRESH_DISABLED);
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
      _sessionManager.clearWaiters(AuthFailure(AuthFailure.SEVERE_EXPIRY));
      await logout(reason: 'SEVERE_EXPIRY');
      throw AuthFailure(AuthFailure.SEVERE_EXPIRY);
    }

    _sessionManager.startRefreshing();
    final startTime = DateTime.now();
    final waitersAtStart = _sessionManager.waitersCount;

    try {
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken == null) throw AuthFailure(AuthFailure.INVALID_TOKEN);

      // 4.5 Connectivity Health Check (Fast Ping with Single-Flight Deduplication)
      if (requestId != 'BOOTSTRAP-REFRESH') {
        try {
          await _sessionManager.performHealthCheck(() async {
            await _refreshDio.get('health').timeout(const Duration(seconds: 2));
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
          .post(ApiEndpoints.refresh, data: {'refreshToken': refreshToken})
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

        final duration = DateTime.now().difference(startTime).inMilliseconds;
        AppLogger.i(
          '✅ [$requestId] Refresh successful ($duration ms, waiters handled: $waitersAtStart)',
        );
      } else if (response.statusCode == 401 || response.statusCode == 403) {
        throw AuthFailure(AuthFailure.INVALID_TOKEN);
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
              .post(ApiEndpoints.logout, data: {'refreshToken': refreshToken})
              .timeout(const Duration(seconds: 2))
              .catchError(
                (_) => Response(requestOptions: RequestOptions(path: '')),
              ),
        );
      }

      await _storage.clear();
    } finally {
      _sessionManager.setLoggingOut(false);
    }
  }

  /// Automated Offline Recovery
  void setupRecoveryListener() {
    _ref.listen(connectivityProvider, (previous, next) {
      if (next.isConnected && previous?.status == ConnectionStatus.offline) {
        // Connectivity Restored
        if (_sessionManager.isDegraded && _recoveryAttempts < 3) {
          AppLogger.i(
            '🌐 Connectivity restored. Triggering auto-refresh recovery.',
          );
          // Add jitter to avoid thundering herd
          Future.delayed(
            Duration(milliseconds: 300 + (DateTime.now().millisecond % 300)),
            () {
              _recoveryAttempts++;
              refreshToken(requestId: 'RECOVERY-AUTO');
            },
          );
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
      final hasTokens = await _storage.getAccessToken() != null;
      if (!hasTokens) {
        _sessionManager.setAuthenticated(false);
        return;
      }

      if (await _storage.isSeverelyExpired()) {
        await logout(reason: 'BOOTSTRAP_SEVERE_EXPIRY');
        return;
      }

      // If expiring soon, try a silent refresh
      if (await _storage.isExpiringSoon()) {
        try {
          await refreshToken(
            requestId: 'BOOTSTRAP-REFRESH',
          ).timeout(const Duration(seconds: 5));
        } catch (e) {
          AppLogger.w(
            'Bootstrap refresh failed/timed out. Entering degraded mode.',
          );
          _sessionManager.setDegraded(true);
        }
      }

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
