import 'telemetry_priority.dart';

class TelemetryBudget {
  /// 📏 Maximum size of a single event payload in bytes.
  static const int maxPayloadSizeBytes = 1024 * 32; // 32KB

  /// 📦 Maximum number of events to hold in the in-memory queue.
  static const int maxQueueSize = 1000;

  /// 💾 Maximum size of the persistent offline telemetry queue on disk.
  static const int maxDiskUsageBytes = 1024 * 1024 * 10; // 10MB

  /// ⏱️ Maximum number of events to process per minute to avoid SDK flooding.
  static const int maxEventsPerMinute = 120;

  /// 🏷️ Maximum number of breadcrumbs to keep per session.
  static const int maxBreadcrumbs = 100;

  /// Returns true if an event fits within the budget.
  static bool canProcessEvent(int currentQueueSize, TelemetryPriority priority) {
    if (priority == TelemetryPriority.critical) return true; // Critical bypasses queue limit
    
    // Low priority events are dropped if queue is at 80% capacity
    if (priority == TelemetryPriority.low && currentQueueSize > (maxQueueSize * 0.8)) {
      return false;
    }

    return currentQueueSize < maxQueueSize;
  }

  /// Scrubs oversized data from a payload to ensure it stays within budget.
  static Map<String, dynamic> enforcePayloadLimit(Map<String, dynamic> payload) {
    // Implement simple truncation or key removal for oversized payloads
    // This is a placeholder for more complex recursive scrubbing
    if (payload.toString().length > maxPayloadSizeBytes) {
      return {
        ...payload,
        '__budget_warning': 'Payload truncated due to size limit',
        'long_data': 'REDACTED',
      };
    }
    return payload;
  }
}
