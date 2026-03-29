import 'package:flutter/material.dart';
import 'core/theme/app_theme.dart';
import 'core/config/routes.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const KovariApp());
}

class KovariApp extends StatelessWidget {
  const KovariApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Kovari',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.light,
      initialRoute: AppRoutes.onboarding,
      routes: AppRoutes.routes,
    );
  }
}
