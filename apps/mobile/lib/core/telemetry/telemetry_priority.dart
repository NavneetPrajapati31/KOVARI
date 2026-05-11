enum TelemetryPriority {
  /// 🚨 Mission-critical events that must be reported immediately.
  /// Examples: App crashes, fatal errors, core payment failures.
  critical,

  /// ⚠️ High-importance events that impact user experience significantly.
  /// Examples: Authentication failures, network timeouts on primary actions.
  high,

  /// ✅ Standard operational events.
  /// Examples: Navigation, successful transactions, feature usage.
  normal,

  /// 📊 Low-priority background metrics.
  /// Examples: Scroll performance, cache hit rates, UI micro-interactions.
  low,

  /// 🛠️ Debug-only telemetry for detailed engineering diagnostics.
  /// Examples: Verbose logs, hydration task lifecycles, memory pressure.
  debug;

  /// Returns true if this priority should be reported in release builds.
  bool get isProduction => index <= TelemetryPriority.low.index;
}

class SamplingPolicies {
  /// Returns true if an event of this priority should be sampled.
  static bool shouldSample(TelemetryPriority priority, {bool isPressureHigh = false}) {
    if (priority == TelemetryPriority.critical || priority == TelemetryPriority.high) {
      return true; // Always 100%
    }

    if (isPressureHigh) {
      // Drop low and debug telemetry during pressure
      if (priority.index >= TelemetryPriority.low.index) return false;
      return true; // Keep normal and high
    }

    // Standard sampling
    switch (priority) {
      case TelemetryPriority.normal:
        return true; // 100% for now, can be adjusted to 0.25 if volume is high
      case TelemetryPriority.low:
        return true; // 100% for now, can be adjusted to 0.1
      case TelemetryPriority.debug:
        return false; // Debug is usually handled separately or dropped in release
      default:
        return true;
    }
  }
}
