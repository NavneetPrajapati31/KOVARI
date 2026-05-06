import 'package:flutter/services.dart';
import '../config/interaction_config.dart';
import '../utils/app_logger.dart';

class HapticService {
  static Future<void> trigger(HapticType type) async {
    try {
      switch (type) {
        case HapticType.light:
          await HapticFeedback.selectionClick();
          break;
        case HapticType.medium:
          await HapticFeedback.mediumImpact();
          break;
        case HapticType.heavy:
          await HapticFeedback.heavyImpact();
          break;
        case HapticType.selection:
          await HapticFeedback.selectionClick();
          break;
      }
    } catch (e) {
      AppLogger.e('HapticFeedback failed: $e');
    }
  }

  // Refined helpers to avoid "cheap" feel
  static void light() => trigger(HapticType.light);
  static void medium() => trigger(HapticType.medium);
  static void heavy() => trigger(HapticType.heavy);
  static void selection() => trigger(HapticType.selection);
}
