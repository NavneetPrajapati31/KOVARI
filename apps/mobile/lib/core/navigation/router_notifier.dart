import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../providers/profile_provider.dart';
import '../utils/app_logger.dart';

/// 🧭 [RouterNotifier] - The central guard for Kovari Navigation.
/// It listens to authentication and profile states to trigger precise redirections.
class RouterNotifier extends ChangeNotifier {
  final Ref _ref;
  bool _isFirstSync = true;

  RouterNotifier(this._ref) {
    // 🎧 Listen to Auth State
    _ref.listen(authProvider, (_, __) => notifyListeners());
    
    // 🎧 Listen to Profile State (for Onboarding Guard)
    _ref.listen(profileProvider, (_, __) {
      if (_isFirstSync) {
        _isFirstSync = false;
        return;
      }
      notifyListeners();
    });
  }

  /// 🛡️ The master redirection logic for the entire app.
  String? redirect(BuildContext context, GoRouterState state) {
    final auth = _ref.read(authProvider);
    final profile = _ref.read(profileProvider);

    // 1. Wait for bootstrapping (Splash screen handled by main.dart/NativeSplash)
    if (auth.isBootstrapping) return null;

    final bool loggingIn = state.matchedLocation == '/login';

    // 2. Auth Guard
    if (!auth.isAuthenticated) {
      return loggingIn ? null : '/login';
    }

    // 3. Ban Guard
    if (auth.user?.banned == true) {
      return state.matchedLocation == '/banned' ? null : '/banned';
    }

    // 4. Onboarding Guard
    // Note: We only redirect to onboarding if the profile is loaded and the username is missing
    final bool isProfileComplete = (profile?.username ?? '').isNotEmpty;
    
    if (!isProfileComplete && profile != null) {
      // Don't loop if already on onboarding
      if (state.matchedLocation == '/onboarding') return null;
      
      AppLogger.w('🚩 [Router] Guard: Redirecting to Onboarding');
      return '/onboarding';
    }

    // 5. Redirection from Login if already authenticated
    if (loggingIn) {
      return '/';
    }

    // 6. No redirection needed
    return null;
  }
}

final routerNotifierProvider = Provider<RouterNotifier>((ref) => RouterNotifier(ref));
