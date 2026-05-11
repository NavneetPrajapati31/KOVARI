import 'runtime_trust_service.dart';
import '../utils/app_logger.dart';

enum SecurityAction {
  allow,           // Proceed normally
  warn,            // Allow but log and potentially warn user
  throttle,        // Slow down mutations and background tasks
  quarantine,      // Disable high-risk features (payments, joins)
  lockdown,        // Mandatory re-authentication or block access
}

class SecurityPolicyEngine {
  static final SecurityPolicyEngine _instance = SecurityPolicyEngine._internal();
  factory SecurityPolicyEngine() => _instance;
  SecurityPolicyEngine._internal();

  /// ⚖️ Determines the appropriate action based on the current TrustScore.
  SecurityAction evaluateAction(TrustScore score) {
    // 1. Critical Compromise: Immediate Lockdown
    if (score.level == TrustLevel.compromised) {
      AppLogger.e('🚨 [SecurityPolicyEngine] CRITICAL COMPROMISE detected. Enforcing LOCKDOWN.');
      return SecurityAction.lockdown;
    }

    // 2. High Risk Signals: Quarantine
    if (score.score < 0.6) {
      AppLogger.w('🛡️ [SecurityPolicyEngine] HIGH RISK detected. Enforcing QUARANTINE.');
      return SecurityAction.quarantine;
    }

    // 3. Suspicious Environment: Throttle
    if (score.level == TrustLevel.suspicious) {
      AppLogger.w('🛡️ [SecurityPolicyEngine] SUSPICIOUS environment detected. Enforcing THROTTLE.');
      return SecurityAction.throttle;
    }

    // 4. Minor Signals: Warn
    if (score.score < 1.0) {
      return SecurityAction.warn;
    }

    return SecurityAction.allow;
  }

  /// 🛡️ Checks if a specific feature is allowed under current policy.
  bool isFeatureAllowed(String featureName, TrustScore score) {
    final action = evaluateAction(score);

    switch (action) {
      case SecurityAction.lockdown:
        return false;
      case SecurityAction.quarantine:
        // List of sensitive features that are quarantined
        const sensitiveFeatures = {'join_group', 'create_group', 'edit_profile', 'send_invite'};
        return !sensitiveFeatures.contains(featureName);
      default:
        return true;
    }
  }
}
