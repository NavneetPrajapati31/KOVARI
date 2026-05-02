import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/profile/models/user_profile.dart';
import 'auth_provider.dart';
import 'connectivity_provider.dart';
import '../network/api_client.dart';
import '../../features/onboarding/data/profile_service.dart';
import '../utils/app_logger.dart';

/// Notifier to manage the global profile state.
/// It watches [authStateProvider] to ensure it resets on logout.
class ProfileNotifier extends Notifier<UserProfile?> {
  @override
  UserProfile? build() {
    final user = ref.watch(authStateProvider);

    if (user == null) {
      return null;
    }

    // Auto-refresh when connectivity is restored
    ref.listen(connectivityProvider, (previous, next) {
      if (next.isOnline && previous?.status != ConnectionStatus.online) {
        if (state == null) {
          fetchProfile();
        }
      }
    });

    // If we have a user but no profile, or user ID mismatch, trigger fetch
    if (state == null || state?.userId != user.id) {
      Future.microtask(() => fetchProfile());
      // If mismatch, return null to show loading while we fetch
      if (state?.userId != user.id) return null;
    }

    return state;
  }

  // Allow setting the profile externally (e.g., during login or onboarding)
  void setProfile(UserProfile? profile) => state = profile;

  Future<void> fetchProfile() async {
    try {
      final apiClient = ref.read(apiClientProvider);
      final profileService = ProfileService(apiClient);
      final profileJson = await profileService.getCurrentProfile();

      if (profileJson != null) {
        state = UserProfile.fromJson(profileJson);
      }
    } catch (e) {
      AppLogger.e('Failed to fetch profile: $e');
    }
  }
}

/// Provider to hold the current user's profile metadata globally.
/// This is populated after onboarding or during app initialization.
final profileProvider = NotifierProvider<ProfileNotifier, UserProfile?>(
  ProfileNotifier.new,
);
