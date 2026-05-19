import 'package:mobile/core/telemetry/telemetry_priority.dart';
import 'package:mobile/core/telemetry/telemetry_service.dart';

class ReleaseHealthService {
  factory ReleaseHealthService() => _instance;
  ReleaseHealthService._internal();
  static final ReleaseHealthService _instance = ReleaseHealthService._internal();

  final int _retryCount = 0;
  bool _isInDegradedMode = false;

  void reportAuthRecoverySuccess() {
    TelemetryService().logEvent(
      'release_health_auth_recovery',
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
    );
  }
}
