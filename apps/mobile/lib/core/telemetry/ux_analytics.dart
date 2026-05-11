import 'package:mobile/core/telemetry/event_schema_registry.dart';
import 'package:mobile/core/telemetry/telemetry_priority.dart';
import 'package:mobile/core/telemetry/telemetry_service.dart';
import 'package:uuid/uuid.dart';

class UXAnalytics {
  factory UXAnalytics() => _instance;
  UXAnalytics._internal();
  static final UXAnalytics _instance = UXAnalytics._internal();

  String? _currentJourneyId;

  void startJourney(String name) {
    _currentJourneyId = '${name}_${const Uuid().v4()}';
    TelemetryService().logEvent(
      'journey_started',
      journeyId: _currentJourneyId,
      parameters: {'journey_name': name},
    );
  }

  void logStep(String name, {Map<String, dynamic>? params}) {
    TelemetryService().logEvent(
      name,
      journeyId: _currentJourneyId,
      parameters: params,
    );
  }

  /// 🔐 Auth Funnel
  void logAuthStarted(String method) => 
      logStep(EventSchemaRegistry.authStarted, params: {'method': method});
      
  void logAuthSuccess(String method) => 
      logStep(EventSchemaRegistry.authSuccess, params: {'method': method});
      
  void logAuthFailure(String method, String code) => 
      logStep(EventSchemaRegistry.authFailure, params: {'method': method, 'error_code': code});

  /// 🧩 Matching Funnel
  void logExploreViewed(String groupId) => 
      logStep(EventSchemaRegistry.exploreCardViewed, params: {'group_id': groupId});
      
  void logExploreSwiped(String groupId, String direction) => 
      logStep(EventSchemaRegistry.exploreCardSwiped, params: {'group_id': groupId, 'direction': direction});

  /// 📉 UX Friction tracking
  void logRageTap(String elementId) {
    TelemetryService().logEvent(
      'ux_rage_tap',
      priority: TelemetryPriority.high,
      parameters: {'element_id': elementId},
    );
  }

  void logScrollAbandonment(String screenName, double percent) {
    TelemetryService().logEvent(
      'ux_scroll_abandonment',
      priority: TelemetryPriority.low,
      parameters: {'screen': screenName, 'scroll_percent': percent},
    );
  }
}
