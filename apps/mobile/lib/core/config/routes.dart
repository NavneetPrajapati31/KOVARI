import 'package:flutter/material.dart';
import '../../features/onboarding/presentation/onboarding_screen.dart';

class AppRoutes {
  static const String onboarding = '/';
  
  // Future routes
  static const String login = '/login';
  static const String home = '/home';

  static Map<String, WidgetBuilder> get routes {
    return {
      onboarding: (context) => const OnboardingScreen(),
      // Add more routes as features are implemented
    };
  }
}
