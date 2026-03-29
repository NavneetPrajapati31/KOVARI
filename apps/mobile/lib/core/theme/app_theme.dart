import 'package:flutter/material.dart';

class AppTheme {
  // Brand colors from dev-theme.css
  static const Color primaryColor = Color(0xFF1C4DFF); // iOS System Blue
  static const Color primaryLight = Color(0xFFE4EAFF);
  static const Color backgroundColor = Color(0xFFF9FAFB); // Soft White
  static const Color foregroundColor = Color(0xFF1C1C1E); // Near Black

  static const Color secondaryColor = Color(
    0xFFF2F2F7,
  ); // iOS Secondary System Background
  static const Color accentColor = Color(0xFF34C759); // iOS Green
  static const Color destructiveColor = Color(0xFFF31260);

  static const Color borderColor = Color(0xFFE5E7EB);
  static const Color mutedColor = Color(0xFFD1D5DB);
  static const Color mutedForegroundColor = Color(0xFF4B5563);

  static const Color surfaceColor = Colors.white;

  // Text colors
  static const Color textPrimary = foregroundColor;
  static const Color textSecondary = mutedForegroundColor;

  static const Color darkBackgroundColor = Color(0xFF0F172A); // Slate-900
  static const Color darkSurfaceColor = Color(0xFF1E293B); // Slate-800
  static const Color darkTextPrimary = Color(0xFFF1F5F9);
  static const Color darkTextSecondary = Color(0xFF94A3B8);

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      primaryColor: primaryColor,
      scaffoldBackgroundColor: backgroundColor,
      colorScheme: ColorScheme.light(
        primary: primaryColor,
        secondary: secondaryColor,
        surface: surfaceColor,
        onPrimary: Colors.white,
        onSurface: textPrimary,
        error: destructiveColor,
      ),
      textTheme: const TextTheme(
        headlineLarge: TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: textPrimary,
          letterSpacing: -1,
        ),
        headlineMedium: TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.w600,
          color: textPrimary,
          letterSpacing: -0.5,
        ),
        bodyLarge: TextStyle(fontSize: 16, color: textPrimary),
        bodyMedium: TextStyle(fontSize: 14, color: textSecondary),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8), // matching 0.5rem
          ),
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      primaryColor: primaryColor,
      scaffoldBackgroundColor: darkBackgroundColor,
      colorScheme: ColorScheme.dark(
        primary: primaryColor,
        secondary: secondaryColor,
        surface: darkSurfaceColor,
        onPrimary: Colors.white,
        onSurface: darkTextPrimary,
        error: destructiveColor,
      ),
      textTheme: const TextTheme(
        headlineLarge: TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: darkTextPrimary,
          letterSpacing: -1,
        ),
        headlineMedium: TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.w600,
          color: darkTextPrimary,
          letterSpacing: -0.5,
        ),
        bodyLarge: TextStyle(fontSize: 16, color: darkTextPrimary),
        bodyMedium: TextStyle(fontSize: 14, color: darkTextSecondary),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8), // matching 0.5rem
          ),
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
    );
  }
}
