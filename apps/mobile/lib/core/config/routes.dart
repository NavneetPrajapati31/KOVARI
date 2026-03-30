import 'package:flutter/material.dart';
import '../../features/onboarding/onboarding_screen.dart';

class AppRoutes {
  static const String onboarding = '/';
  static const String login = '/login';
  static const String home = '/home';

  static Map<String, WidgetBuilder> get routes {
    return {
      onboarding: (context) => const OnboardingScreen(),
      // Future routes will be added here
    };
  }
}
