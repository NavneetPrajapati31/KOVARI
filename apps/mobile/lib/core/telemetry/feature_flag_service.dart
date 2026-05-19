import 'package:mobile/core/telemetry/telemetry_service.dart';

class FeatureFlagService {
  factory FeatureFlagService() => _instance;
  FeatureFlagService._internal();
  static final FeatureFlagService _instance = FeatureFlagService._internal();

  final Map<String, dynamic> _flags = {
    'new_matching_algorithm': true,
    'premium_itinerary_ui': false,
    'chat_bubbles_v2': true,
  };

  final Set<String> _exposedExperiments = {};

  bool isEnabled(String featureName) => (_flags[featureName] as bool?) ?? false;

  /// 🧪 Logs exposure to an experiment.
  /// Only logs once per session per experiment to avoid spam.
  void logExposure(String experimentId) {
    if (_exposedExperiments.contains(experimentId)) return;

    _exposedExperiments.add(experimentId);
    TelemetryService().logEvent(
      'experiment_exposed',
      parameters: {
        'experiment_id': experimentId,
        'variant': _flags[experimentId]?.toString() ?? 'control',
      },
    );
  }

  Map<String, dynamic> get activeFlags => Map.unmodifiable(_flags);
}
