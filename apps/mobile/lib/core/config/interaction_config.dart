class InteractionConfig {
  // Press Scaling
  static const double pressScale = 0.97;
  static const Duration pressDuration = Duration(milliseconds: 150);

  // Animation Durations
  static const Duration fast = Duration(milliseconds: 120);
  static const Duration normal = Duration(milliseconds: 200);
  static const Duration medium = Duration(milliseconds: 250);
  static const Duration slow = Duration(milliseconds: 300);

  // Haptics (Vibration intensity)
  static const double lightIntensity = 0.3;
  static const double mediumIntensity = 0.6;
  static const double heavyIntensity = 0.9;
}

enum HapticType {
  light,     // Small button tap
  medium,    // Standard action
  heavy,     // Major action/Impact
  selection, // Subtle tick (tab switch, slider)
  success,   // Multi-tap success (form submit)
  error,     // Multi-tap error/warning
  warning,   // Attention required
  rigid,     // Heavy button press
  soft       // Soft surface tap
}
