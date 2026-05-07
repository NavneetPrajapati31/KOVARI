import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/profile/models/user_profile.dart';
import 'auth_provider.dart';
import 'connectivity_provider.dart';
import '../utils/app_logger.dart';
import '../network/sync_engine.dart';
import '../providers/cache_provider.dart';
import '../network/api_endpoints.dart';

class ProfileNotifier extends Notifier<UserProfile?> {
  @override
  UserProfile? build() {
    final user = ref.watch(authStateProvider);

    if (user == null) return null;

    // 1. Instant Boot: Try to return cached profile immediately
    final cache = ref.read(localCacheProvider);
    final cachedData = cache.getProfile();
    if (cachedData != null && state == null) {
      final cachedProfile = UserProfile.fromJson(cachedData);
      if (cachedProfile.userId == user.id) {
        state = cachedProfile;
        AppLogger.d('🚀 [BOOT] Profile loaded from cache instantly');
      }
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
      final syncEngine = ref.read(syncEngineProvider);
      final cache = ref.read(localCacheProvider);
      
      await syncEngine.swrFetch<UserProfile?>(
        path: ApiEndpoints.currentProfile,
        parser: (data) {
          if (data is! Map<String, dynamic>) return null;
          final actualData = (data['profile'] as Map<String, dynamic>?) ?? data;
          return UserProfile.fromJson(actualData);
        },
        onUpdate: (profile) {
          if (profile != null) {
            state = profile;
            cache.setProfile(profile.toJson());
          }
        },
      );
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
