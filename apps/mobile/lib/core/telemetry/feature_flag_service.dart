import 'telemetry_service.dart';
import 'telemetry_priority.dart';

class FeatureFlagService {
  static final FeatureFlagService _instance = FeatureFlagService._internal();
  factory FeatureFlagService() => _instance;
  FeatureFlagService._internal();

  final Map<String, dynamic> _flags = {
    'new_matching_algorithm': true,
    'premium_itinerary_ui': false,
    'chat_bubbles_v2': true,
  };

  final Set<String> _exposedExperiments = {};

  bool isEnabled(String featureName) {
    return _flags[featureName] ?? false;
  }

  /// 🧪 Logs exposure to an experiment.
  /// Only logs once per session per experiment to avoid spam.
  void logExposure(String experimentId) {
    if (_exposedExperiments.contains(experimentId)) return;

    _exposedExperiments.add(experimentId);
    TelemetryService().logEvent(
      'experiment_exposed',
      priority: TelemetryPriority.normal,
      parameters: {
        'experiment_id': experimentId,
        'variant': _flags[experimentId]?.toString() ?? 'control',
      },
    );
  }

  Map<String, dynamic> get activeFlags => Map.unmodifiable(_flags);
}
