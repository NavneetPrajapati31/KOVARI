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

class AppShellScreen extends ConsumerWidget {
  const AppShellScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentIndex = ref.watch(appShellIndexProvider);
    final isOffline = ref.watch(connectivityProvider.select((s) => s.isOffline));
    final isDegraded = ref.watch(connectivityProvider.select((s) => s.isDegraded));

    return Scaffold(
      body: Column(
        children: [
          if (isOffline)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 4),
              color: Colors.red,
              child: const Text(
                'No Internet Connection',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
              ),
            )
          else if (isDegraded)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 4),
              color: Colors.orange,
              child: const Text(
                'Connecting...',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
              ),
            ),
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
