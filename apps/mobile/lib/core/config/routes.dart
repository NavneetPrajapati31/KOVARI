import 'package:flutter/material.dart';
import '../../features/onboarding/screens/onboarding_screen.dart';
import '../../features/home/screens/home_screen.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/sign_up_screen.dart';
import '../../features/auth/screens/forgot_password_screen.dart' as auth_forgot;
import '../../features/notifications/screens/notifications_screen.dart';

class AppRoutes {
  static const String onboarding = '/onboarding';
  static const String login = '/login';
  static const String signUp = '/sign-up';
  static const String home = '/home';
  static const String notifications = '/notifications';
  static const String forgotPassword = '/forgot-password';

  static Map<String, WidgetBuilder> get routes {
    return {
      login: (context) => const LoginScreen(),
      signUp: (context) => const SignUpScreen(),
      onboarding: (context) => const OnboardingScreen(),
      home: (context) => const HomeScreen(),
      notifications: (context) => const NotificationsScreen(),
      forgotPassword: (context) => const auth_forgot.ForgotPasswordScreen(),
    };
  }
}
