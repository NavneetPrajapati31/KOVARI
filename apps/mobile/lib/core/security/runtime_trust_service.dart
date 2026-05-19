import 'package:flutter/foundation.dart';
import 'package:flutter_jailbreak_detection_plus/flutter_jailbreak_detection_plus.dart';
import 'package:mobile/core/utils/app_logger.dart';
import 'package:safe_device/safe_device.dart';

enum TrustLevel {
  trusted, // Zero risk detected
  suspicious, // Minor signals (e.g., emulator or dev mode)
  compromised, // Rooted, Jailbroken, or Hooked
}

class TrustScore {

  TrustScore({required this.score, required this.level, required this.signals});
  final double score; // 0.0 to 1.0
  final TrustLevel level;
  final List<String> signals;

  bool get isCompromised => level == TrustLevel.compromised;
}

class RuntimeTrustService {
  factory RuntimeTrustService() => _instance;
  RuntimeTrustService._internal();
  static final RuntimeTrustService _instance = RuntimeTrustService._internal();

  TrustScore? _cachedScore;

  /// 🧠 Evaluates the runtime environment and produces a TrustScore.
  Future<TrustScore> evaluate() async {
    final signals = <String>[];
    var penalty = 0.0;

    try {
      // 1. Jailbreak / Root Detection
      final isJailbroken = await FlutterJailbreakDetectionPlus.jailbroken;
      if (isJailbroken) {
        signals.add('jailbroken');
        penalty += 0.8;
      }

      // 2. Developer Mode / Debugger
      final isDevMode = await SafeDevice.isDevelopmentModeEnable;
      if (isDevMode && kReleaseMode) {
        signals.add('developer_mode_active');
        penalty += 0.2;
      }

      // 3. Emulator Detection
      final isRealDevice = await SafeDevice.isRealDevice;
      if (!isRealDevice) {
        signals.add('emulator_detected');
        penalty += 0.3;
      }

      // 4. Integrity Check (Basic)
      final isSafe = await SafeDevice.isSafeDevice;
      if (!isSafe) {
        signals.add('integrity_compromised');
        penalty += 0.5;
      }

      // 5. Debugger Check
      if (kReleaseMode && _isDebuggerAttached()) {
        signals.add('debugger_attached');
        penalty += 0.6;
      }
    } catch (e) {
      AppLogger.e('⚠️ [RuntimeTrustService] Evaluation failed: $e');
      signals.add('evaluation_failed');
      penalty += 0.1;
    }

    final finalScore = (1.0 - penalty).clamp(0.0, 1.0);
    var level = TrustLevel.trusted;

    if (finalScore < 0.4) {
      level = TrustLevel.compromised;
    } else if (finalScore < 0.8) {
      level = TrustLevel.suspicious;
    }

    _cachedScore = TrustScore(
      score: finalScore,
      level: level,
      signals: signals,
    );

    _logEvaluation(_cachedScore!);
    return _cachedScore!;
  }

  bool _isDebuggerAttached() {
    // Placeholder for native debugger check
    return kDebugMode;
  }

  void _logEvaluation(TrustScore score) {
    if (score.level != TrustLevel.trusted) {
      AppLogger.w(
        '🛡️ [RuntimeTrustService] Score: ${score.score.toStringAsFixed(2)} | '
        'Level: ${score.level.name} | Signals: ${score.signals.join(', ')}',
      );
    }
  }

  TrustScore? get currentScore => _cachedScore;
}
