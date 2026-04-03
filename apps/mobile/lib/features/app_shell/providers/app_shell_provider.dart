import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/auth_provider.dart';

/// Notifier to manage the current active tab index in the App Shell.
/// It watches [authStateProvider] to ensure it resets to the first tab (Home) on login/logout.
class AppShellIndexNotifier extends Notifier<int> {
  @override
  int build() {
    ref.watch(authStateProvider);
    return 0;
  }

  void setIndex(int index) => state = index;
}

/// Provider to manage the current active tab index in the App Shell.
final appShellIndexProvider = NotifierProvider<AppShellIndexNotifier, int>(
  AppShellIndexNotifier.new,
);
