class InteractionConfig {
  // Press Scaling
  static const double pressScale = 0.97;
  static const Duration pressDuration = Duration(milliseconds: 150);

  // Animation Durations
  static const Duration fast = Duration(milliseconds: 120);
  static const Duration normal = Duration(milliseconds: 200);
  static const Duration slow = Duration(milliseconds: 300);

  // Haptics (Vibration intensity)
  static const double lightIntensity = 0.3;
  static const double mediumIntensity = 0.6;
  static const double heavyIntensity = 0.9;
}

enum HapticType {
  light,    // Tap, toggle
  medium,   // Success, selection
  heavy,    // Destructive, error
  selection // Subtle tick
}
