import 'dart:async';
import 'package:hive/hive.dart';
import 'runtime_trust_service.dart';
import '../utils/app_logger.dart';

class TrustState {
  final double persistentScore;
  final DateTime lastEvaluated;
  final int consecutiveTrustedPasses;

  TrustState({
    required this.persistentScore,
    required this.lastEvaluated,
    this.consecutiveTrustedPasses = 0,
  });

  Map<String, dynamic> toJson() => {
    'persistentScore': persistentScore,
    'lastEvaluated': lastEvaluated.toIso8601String(),
    'consecutiveTrustedPasses': consecutiveTrustedPasses,
  };

  factory TrustState.fromJson(Map<dynamic, dynamic> json) => TrustState(
    persistentScore: (json['persistentScore'] as num).toDouble(),
    lastEvaluated: DateTime.parse(json['lastEvaluated'] as String),
    consecutiveTrustedPasses: json['consecutiveTrustedPasses'] as int,
  );
}

class TrustStateMachine {
  static const String _boxName = 'security_trust_state';
  static const String _stateKey = 'current_state';

  late Box _box;
  bool _isInitialized = false;

  static final TrustStateMachine _instance = TrustStateMachine._internal();
  factory TrustStateMachine() => _instance;
  TrustStateMachine._internal();

  /// 🔐 Initializes the trust state machine with persistence.
  Future<void> init() async {
    _box = await Hive.openBox(_boxName);
    _isInitialized = true;
  }

  /// 📈 Updates the persistent trust state based on a new evaluation.
  Future<TrustScore> update(TrustScore instantScore) async {
    if (!_isInitialized) await init();

    final currentState = _getCurrentState();
    double newPersistentScore;
    int newPasses = currentState.consecutiveTrustedPasses;

    // 🛡️ Hysteresis & Decay Logic:
    // 1. If instant score is compromised (low), drop persistent score IMMEDIATELY.
    // 2. If instant score is trusted, build persistent score SLOWLY (requires consecutive passes).
    
    if (instantScore.level == TrustLevel.compromised) {
      newPersistentScore = instantScore.score;
      newPasses = 0;
    } else if (instantScore.score < currentState.persistentScore) {
      // Rapid drop for any regression
      newPersistentScore = instantScore.score;
      newPasses = 0;
    } else {
      // Slow climb: Only increase if we have enough consecutive passes
      newPasses++;
      if (newPasses >= 5) {
        newPersistentScore = (currentState.persistentScore + 0.05).clamp(0.0, 1.0);
      } else {
        newPersistentScore = currentState.persistentScore;
      }
    }

    final newState = TrustState(
      persistentScore: newPersistentScore,
      lastEvaluated: DateTime.now(),
      consecutiveTrustedPasses: newPasses,
    );

    await _box.put(_stateKey, newState.toJson());

    return TrustScore(
      score: newPersistentScore,
      level: _deriveLevel(newPersistentScore),
      signals: instantScore.signals,
    );
  }

  TrustState _getCurrentState() {
    final data = _box.get(_stateKey);
    if (data == null) {
      return TrustState(
        persistentScore: 1.0, // Default to trusted on first run
        lastEvaluated: DateTime.now(),
      );
    }
    return TrustState.fromJson(data);
  }

  TrustLevel _deriveLevel(double score) {
    if (score < 0.4) return TrustLevel.compromised;
    if (score < 0.8) return TrustLevel.suspicious;
    return TrustLevel.trusted;
  }
}
