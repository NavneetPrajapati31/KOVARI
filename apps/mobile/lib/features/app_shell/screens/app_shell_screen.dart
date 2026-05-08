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
import '../../../core/utils/app_logger.dart';
import '../../home/providers/home_provider.dart';

class AppShellScreen extends ConsumerWidget {
  const AppShellScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentIndex = ref.watch(appShellIndexProvider);

    // Global connectivity listener to refresh data when connection is restored
    ref.listen(connectivityProvider, (previous, next) {
      if (next.isOnline && previous?.isOnline == false) {
        AppLogger.i(
          '🌐 Connectivity restored in AppShell. Refreshing current data...',
        );
        // Refresh home data automatically
        ref.read(homeDataProvider.notifier).refresh(isSilent: true);
      }
    });

    return Scaffold(
      body: Column(
        children: [
          Expanded(
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
        ],
      ),
      bottomNavigationBar: KovariBottomNav(
        currentIndex: currentIndex,
        onTap: (index) {
          ref.read(appShellIndexProvider.notifier).setIndex(index);
        },
      ),
    );
  }
}
