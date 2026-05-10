import 'package:flutter/services.dart';
import '../config/interaction_config.dart';
import '../utils/app_logger.dart';

class HapticService {
  static Future<void> trigger(HapticType type) async {
    try {
      switch (type) {
        case HapticType.light:
          await HapticFeedback.lightImpact();
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
        case HapticType.success:
          // iOS Success pattern: light multi-tap
          await HapticFeedback.lightImpact();
          await Future.delayed(const Duration(milliseconds: 50));
          await HapticFeedback.lightImpact();
          break;
        case HapticType.error:
          // iOS Error pattern: heavy triple-tap + fallback vibration
          await HapticFeedback.vibrate();
          await HapticFeedback.heavyImpact();
          await Future.delayed(const Duration(milliseconds: 50));
          await HapticFeedback.heavyImpact();
          await Future.delayed(const Duration(milliseconds: 50));
          await HapticFeedback.heavyImpact();
          break;
        case HapticType.warning:
          await HapticFeedback.mediumImpact();
          await Future.delayed(const Duration(milliseconds: 100));
          await HapticFeedback.mediumImpact();
          break;
        case HapticType.rigid:
          await HapticFeedback.heavyImpact();
          break;
        case HapticType.soft:
          await HapticFeedback.selectionClick();
          break;
      }
    } catch (e) {
      AppLogger.e('HapticFeedback failed: $e');
    }
  }

  // Refined helpers
  static void light() => trigger(HapticType.light);
  static void medium() => trigger(HapticType.medium);
  static void heavy() => trigger(HapticType.heavy);
  static void selection() => trigger(HapticType.selection);
  static void success() => trigger(HapticType.success);
  static void error() => trigger(HapticType.error);
  static void warning() => trigger(HapticType.warning);
}
