import 'package:flutter/material.dart';

class AppTheme {
  // KOVARI Design System Colors
  static const Color primaryBlue = Color(0xFF1C4DFF);
  static const Color backgroundGray = Color(0xFFF9FAFB);
  static const Color surfaceWhite = Colors.white;
  static const Color textDark = Color(0xFF111827);
  static const Color textGray = Color(0xFF6B7280);

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryBlue,
        primary: primaryBlue,
        onPrimary: Colors.white,
        surface: backgroundGray,
      ),
      scaffoldBackgroundColor: backgroundGray,
      appBarTheme: const AppBarTheme(
        backgroundColor: surfaceWhite,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: textDark,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
        iconTheme: IconThemeData(color: textDark),
      ),
      textTheme: const TextTheme(
        headlineLarge: TextStyle(
          color: textDark,
          fontSize: 32,
          fontWeight: FontWeight.bold,
        ),
        bodyLarge: TextStyle(
          color: textDark,
          fontSize: 16,
        ),
        bodyMedium: TextStyle(
          color: textGray,
          fontSize: 14,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryBlue,
          foregroundColor: Colors.white,
          minimumSize: const Size(double.infinity, 52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 0,
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
