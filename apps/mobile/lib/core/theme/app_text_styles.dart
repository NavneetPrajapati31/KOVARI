import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

class AppTextStyles {
  static TextStyle get base => GoogleFonts.manrope(color: AppColors.foreground);

  // Headings
  static TextStyle get h1 => base.copyWith(
    fontSize: 24,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.5,
  );

  static TextStyle get h2 => base.copyWith(
    fontSize: 20,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.4,
  );

  static TextStyle get h3 =>
      base.copyWith(fontSize: 16, fontWeight: FontWeight.w600);

  // Body
  static TextStyle get bodyLarge =>
      base.copyWith(fontSize: 16, fontWeight: FontWeight.w400);

  static TextStyle get bodyMedium =>
      base.copyWith(fontSize: 14, fontWeight: FontWeight.w400);

  static TextStyle get bodySmall =>
      base.copyWith(fontSize: 12, fontWeight: FontWeight.w400);

  // UI Elements
  static TextStyle get button =>
      base.copyWith(fontSize: 14, fontWeight: FontWeight.w600);

  static TextStyle get label => base.copyWith(
    fontSize: 12,
    fontWeight: FontWeight.w500,
    color: AppColors.mutedForeground,
  );

  static TextStyle get labelUppercase => base.copyWith(
    fontSize: 10,
    fontWeight: FontWeight.w600,
    letterSpacing: 1.2,
    color: AppColors.mutedForeground.withValues(alpha: 0.7),
  );
}
