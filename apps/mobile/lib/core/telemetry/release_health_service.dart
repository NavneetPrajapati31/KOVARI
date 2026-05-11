import 'telemetry_service.dart';
import 'telemetry_priority.dart';

class ReleaseHealthService {
  static final ReleaseHealthService _instance = ReleaseHealthService._internal();
  factory ReleaseHealthService() => _instance;
  ReleaseHealthService._internal();

  int _retryCount = 0;
  bool _isInDegradedMode = false;

  void reportAuthRecoverySuccess() {
    TelemetryService().logEvent(
      'release_health_auth_recovery',
      priority: TelemetryPriority.normal,
      parameters: {'status': 'success'},
    );
  }

  void reportRetryStorm(int count) {
    if (count > 10) {
      TelemetryService().logEvent(
        'release_health_retry_storm',
        priority: TelemetryPriority.high,
        parameters: {'count': count},
      );
    }
  }

  void setDegradedMode(bool active) {
    if (_isInDegradedMode != active) {
      _isInDegradedMode = active;
      TelemetryService().logEvent(
        'release_health_degraded_mode_transition',
        priority: TelemetryPriority.critical,
        parameters: {'is_active': active},
      );
    }
  }

  /// 🏥 High-level health check emitted once per session
  void reportSessionStart() {
    TelemetryService().logEvent(
      'release_health_session_start',
      priority: TelemetryPriority.normal,
    );
  }
}
