import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/profile/models/user_profile.dart';
import 'auth_provider.dart';

/// Notifier to manage the global profile state.
/// It watches [authStateProvider] to ensure it resets on logout.
class ProfileNotifier extends Notifier<UserProfile?> {
  @override
  UserProfile? build() {
    ref.watch(authStateProvider);
    return null;
  }

  // Allow setting the profile externally (e.g., during login or onboarding)
  void setProfile(UserProfile? profile) => state = profile;
}

/// Provider to hold the current user's profile metadata globally.
/// This is populated after onboarding or during app initialization.
final profileProvider =
    NotifierProvider<ProfileNotifier, UserProfile?>(ProfileNotifier.new);
