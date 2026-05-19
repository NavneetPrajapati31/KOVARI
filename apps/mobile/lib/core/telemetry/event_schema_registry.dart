class EventSchemaRegistry {
  /// 🏷️ Core Event Names
  static const String authStarted = 'auth_started';
  static const String authSuccess = 'auth_success';
  static const String authFailure = 'auth_failure';

  static const String exploreCardViewed = 'explore_card_viewed_v2';
  static const String exploreCardSwiped = 'explore_card_swiped_v2';
  static const String matchCreated = 'match_created_v2';

  static const String apiLatency = 'api_latency_v1';
  static const String hydrationTask = 'hydration_task_v1';
  static const String pressureTransition = 'pressure_transition_v1';

  /// 📜 Mandatory Parameters for specific events
  static const Map<String, List<String>> mandatoryParams = {
    authStarted: ['method'],
    authFailure: ['method', 'error_code'],
    exploreCardSwiped: ['group_id', 'direction'],
    apiLatency: ['endpoint', 'duration_ms', 'status_code'],
  };

  /// 🛡️ Validates an event against the registry.
  /// Returns null if valid, or an error message if invalid.
  static String? validate(String name, Map<String, dynamic> params) {
    // Check if event is registered
    if (!_isRegistered(name)) {
      return 'Event "$name" is not registered in EventSchemaRegistry.';
    }

    // Check mandatory parameters
    final required = mandatoryParams[name];
    if (required != null) {
      for (final param in required) {
        if (!params.containsKey(param) || params[param] == null) {
          return 'Event "$name" is missing mandatory parameter "$param".';
        }
      }
    }

    return null;
  }

  static bool _isRegistered(String name) {
    // Simple check against known constants
    final knownEvents = {
      authStarted, authSuccess, authFailure,
      exploreCardViewed, exploreCardSwiped, matchCreated,
      apiLatency, hydrationTask, pressureTransition,
      'screen_view', 'experiment_exposed', 'runtime_freeze_detected'
    };
    return knownEvents.contains(name);
  }
}
