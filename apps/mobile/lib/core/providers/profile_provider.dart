import 'package:flutter_riverpod/legacy.dart';
import '../../features/profile/models/user_profile.dart';

/// Provider to hold the current user's profile metadata globally.
/// This is populated after onboarding or during app initialization.
final profileProvider = StateProvider<UserProfile?>((ref) => null);
