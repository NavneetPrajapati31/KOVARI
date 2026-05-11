import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../home/screens/home_screen.dart';
import '../../explore/screens/explore_screen.dart';
import '../../chat/screens/chat_inbox_screen.dart';
import '../../groups/screens/groups_screen.dart';
import '../widgets/profile_tab.dart';
import '../../../shared/widgets/kovari_bottom_nav.dart';
import '../providers/app_shell_provider.dart';
import '../../../core/providers/connectivity_provider.dart';
import '../../../core/providers/nav_provider.dart';
import '../../../core/utils/app_logger.dart';
import '../../home/providers/home_provider.dart';

class AppShellScreen extends ConsumerStatefulWidget {
  const AppShellScreen({super.key});

  @override
  ConsumerState<AppShellScreen> createState() => _AppShellScreenState();
}

class _AppShellScreenState extends ConsumerState<AppShellScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(navBarVisibilityProvider.notifier).show();
    });
  }

  @override
  void dispose() {
    // Note: This might not run if the app is killed, but fine for navigation
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // Check if we can still read ref (might be disposed)
      try {
        ref.read(navBarVisibilityProvider.notifier).hide();
      } catch (_) {}
    });
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final currentIndex = ref.watch(appShellIndexProvider);

    // Global connectivity listener
    ref.listen(connectivityProvider, (previous, next) {
      if (next.isOnline && previous?.isOnline == false) {
        AppLogger.i('🌐 Connectivity restored in AppShell. Refreshing current data...');
        ref.read(homeDataProvider.notifier).refresh(isSilent: true);
      }
    });

    return Scaffold(
      body: Stack(
        children: [
          Positioned.fill(
            child: IndexedStack(
              index: currentIndex,
              children: const [
                HomeScreen(),
                ExploreScreen(),
                ChatInboxScreen(),
                GroupsScreen(),
                ProfileTab(),
              ],
            ),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: KovariBottomNav(
              currentIndex: currentIndex,
              onTap: (index) {
                ref.read(appShellIndexProvider.notifier).setIndex(index);
              },
            ),
          ),
        ],
      ),
    );
  }
}
