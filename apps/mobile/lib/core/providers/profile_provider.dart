import 'package:flutter_riverpod/legacy.dart';

/// Provider to hold the current user's profile metadata globally.
/// This is populated after onboarding or during app initialization.
final profileProvider = StateProvider<Map<String, dynamic>?>((ref) => null);
