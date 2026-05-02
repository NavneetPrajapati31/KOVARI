import 'dart:async';
import 'dart:math';
import 'dart:ui';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../utils/app_logger.dart';
import '../network/request_priority.dart';

class SessionManager {
  bool _isAuthenticated = false;
  bool _isRefreshing = false;
  bool _isDegraded = false;
  bool _isLoggingOut = false;
  bool _disableRefresh = false;

  int _waitersCount = 0;
  int _failedRefreshCount = 0;
  DateTime? _lastRefreshFailure;

  final Set<CancelToken> _activeTokens = {};
  Completer<void>? _refreshCompleter;
  Future<void>? _healthCheckFuture;
  VoidCallback? _onStateChanged;

  // Latency & Adaptive UI
  double _avgLatencyMs = 300;

  // Getters
  bool get isAuthenticated => _isAuthenticated;
  bool get isRefreshing => _isRefreshing;
  bool get isDegraded => _isDegraded;
  bool get isLoggingOut => _isLoggingOut;
  bool get disableRefresh => _disableRefresh;
  bool get isUnderStress => _waitersCount > 40 || _failedRefreshCount >= 3;

  double get avgLatencyMs => _avgLatencyMs;
  Duration get adaptiveTimeout => Duration(
    milliseconds: max(2000, (_avgLatencyMs * 2).toInt()).clamp(2000, 5000),
  );

  bool get isCircuitOpen {
    if (_failedRefreshCount < 3) return false;
    if (_lastRefreshFailure == null) return false;

    // Half-Open logic: allow 1 request after cooldown
    final jitter = Random().nextInt(500);
    final cooldown = Duration(milliseconds: 5000 + jitter);
    final elapsed = DateTime.now().difference(_lastRefreshFailure!);

    // If cooldown passed and no current active refresh, allow 1 probe
    if (elapsed > cooldown && !_isRefreshing) return false;

    return true;
  }

  void setOnStateChanged(VoidCallback cb) => _onStateChanged = cb;

  void setAuthenticated(bool val) {
    _isAuthenticated = val;
    _onStateChanged?.call();
  }

  void setDegraded(bool val) {
    if (_isDegraded == val) return;
    _isDegraded = val;
    _onStateChanged?.call();
  }

  void setLoggingOut(bool val) {
    _isLoggingOut = val;
    _onStateChanged?.call();
  }

  void setDisableRefresh(bool val) {
    _disableRefresh = val;
    _onStateChanged?.call();
  }

  /// Adaptive Waiter Fairness: Polls for refresh completion
  Future<void> waitForRefresh({
    RequestPriority priority = RequestPriority.medium,
  }) async {
    if (_refreshCompleter == null) return;

    // Low priority requests queue during stress
    if (isUnderStress && priority == RequestPriority.low) {
      AppLogger.d('Queuing low-priority request during stress');
      while (isUnderStress) {
        await Future.delayed(const Duration(seconds: 1));
      }
    }

    _waitersCount++;
    try {
      if (_waitersCount > 50) {
        // Soft Cap Grace Period
        await Future.delayed(const Duration(milliseconds: 150));
        if (_refreshCompleter == null) return;
        throw TooManyRequestsException('System under heavy load');
      }

      // Adaptive Loop: poll every 50ms for max 500ms (10 attempts)
      int attempts = 0;
      while (_refreshCompleter != null && attempts < 10) {
        await Future.delayed(const Duration(milliseconds: 50));
        attempts++;
      }

      if (_refreshCompleter != null) {
        await _refreshCompleter!.future.timeout(
          const Duration(seconds: 10),
          onTimeout: () => throw RefreshTimeoutException(),
        );
      }
    } finally {
      _waitersCount = max(0, _waitersCount - 1);
    }
  }

  /// Single-Flight Health Check
  Future<void> performHealthCheck(Future<void> Function() pingTask) async {
    if (_healthCheckFuture != null) return _healthCheckFuture;

    _healthCheckFuture = pingTask().whenComplete(
      () => _healthCheckFuture = null,
    );
    return _healthCheckFuture;
  }

  void recordLatency(int ms) {
    if (ms <= 0) return;
    _avgLatencyMs = (_avgLatencyMs * 0.8) + (ms * 0.2);
  }

  void startRefreshing() {
    _isRefreshing = true;
    _refreshCompleter = Completer<void>();
    _onStateChanged?.call();
  }

  void completeRefresh() {
    _isRefreshing = false;
    _failedRefreshCount = 0;
    _lastRefreshFailure = null;
    if (_refreshCompleter != null && !_refreshCompleter!.isCompleted) {
      _refreshCompleter!.complete();
    }
    _refreshCompleter = null;
    _onStateChanged?.call();
  }

  void failRefresh(dynamic error) {
    _isRefreshing = false;
    _failedRefreshCount++;
    _lastRefreshFailure = DateTime.now();

    if (_refreshCompleter != null && !_refreshCompleter!.isCompleted) {
      _refreshCompleter!.completeError(error);
    }
    _refreshCompleter = null;
    _onStateChanged?.call();
  }

  /// Deadlock-proof waiter clearing
  void clearWaiters(dynamic error) {
    if (_refreshCompleter != null && !_refreshCompleter!.isCompleted) {
      _refreshCompleter!.completeError(error);
    }
    _refreshCompleter = null;
  }

  bool shouldCooldown() {
    if (_lastRefreshFailure == null) return false;
    final cooldownMs = min(pow(2, _failedRefreshCount) * 1000, 8000).toInt();
    final elapsed = DateTime.now()
        .difference(_lastRefreshFailure!)
        .inMilliseconds;
    return elapsed < cooldownMs;
  }

  // --- Cancel Token Management ---

  void registerToken(CancelToken token) {
    _activeTokens.add(token);
  }

  void unregisterToken(CancelToken token) {
    _activeTokens.remove(token);
  }

  void cancelAllRequests(String reason) {
    // Use a copy to prevent concurrent modification
    final tokens = Set<CancelToken>.from(_activeTokens);
    for (final token in tokens) {
      if (!token.isCancelled) {
        token.cancel(reason);
      }
    }
    _activeTokens.clear();
  }

  // --- Binary / Large Payload Guards ---

  bool isBinaryPayload(dynamic data) {
    if (data == null) return false;
    return data is FormData ||
        data is Stream ||
        data is List<int> || // Includes Uint8List
        data.runtimeType.toString().contains('MultipartFile');
  }

  // --- Metrics ---

  int get waitersCount => _waitersCount;
}

// Custom Exceptions
class RefreshTimeoutException implements Exception {
  final String message = "Token refresh timed out";
}

class TooManyRequestsException implements Exception {
  final String message;
  TooManyRequestsException(this.message);
}

class DegradedModeException implements Exception {
  final String message = "App is in offline mode. Changes cannot be saved.";
}

class AuthFailure implements Exception {
  final String reason;
  AuthFailure(this.reason);

  static const SEVERE_EXPIRY = "SEVERE_EXPIRY";
  static const REFRESH_DISABLED = "REFRESH_DISABLED";
  static const INVALID_TOKEN = "INVALID_TOKEN";
}

final sessionManagerProvider = Provider((ref) => SessionManager());
