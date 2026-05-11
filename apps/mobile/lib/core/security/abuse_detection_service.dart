import 'dart:async';
import 'package:mobile/core/utils/app_logger.dart';

class BehavioralSignal {

  BehavioralSignal({
    required this.type,
    required this.intensity,
    required this.timestamp,
  });
  final String type;
  final double intensity; // 0.0 to 1.0
  final DateTime timestamp;
}

class AbuseDetectionService {
  factory AbuseDetectionService() => _instance;
  AbuseDetectionService._internal();
  static final AbuseDetectionService _instance = AbuseDetectionService._internal();

  final _signalController = StreamController<BehavioralSignal>.broadcast();
  Stream<BehavioralSignal> get signals => _signalController.stream;

  final Map<String, List<DateTime>> _mutationTimestamps = {};

  /// 🕵️‍♂️ Logs a raw gesture/interaction for behavioral analysis.
  void recordInteraction(String type, double velocity) {
    // Detect impossible swipe velocity (Potential automation)
    if (velocity > 10000.0) {
      _emitSignal('impossible_velocity', 0.8);
    }
  }

  /// ⚡ Tracks mutation frequency to detect "Storms" or Bot activity.
  void recordMutation(String endpoint) {
    final now = DateTime.now();
    final timestamps = _mutationTimestamps.putIfAbsent(endpoint, () => []);
    
    timestamps.add(now);
    
    // Cleanup old timestamps (last 60 seconds)
    timestamps.removeWhere((t) => now.difference(t).inSeconds > 60);

    if (timestamps.length > 10) {
      _emitSignal('mutation_storm', (timestamps.length / 20).clamp(0.0, 1.0));
      AppLogger.w('⚠️ [AbuseDetection] Mutation storm detected for $endpoint!');
    }
  }

  void _emitSignal(String type, double intensity) {
    _signalController.add(BehavioralSignal(
      type: type,
      intensity: intensity,
      timestamp: DateTime.now(),
    ));
  }

  void dispose() {
    _signalController.close();
  }
}
