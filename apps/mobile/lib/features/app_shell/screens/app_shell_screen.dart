import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../home/screens/home_screen.dart';
import '../../explore/screens/explore_screen.dart';
import '../../chat/screens/chat_inbox_screen.dart';
import '../../community/screens/community_screen.dart';
import '../widgets/profile_tab.dart';
import '../../../shared/widgets/kovari_bottom_nav.dart';
import '../providers/app_shell_provider.dart';

class AppShellScreen extends ConsumerWidget {
  const AppShellScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentIndex = ref.watch(appShellIndexProvider);

    return Scaffold(
      body: IndexedStack(
        index: currentIndex,
        children: const [
          HomeScreen(),
          ExploreScreen(),
          ChatInboxScreen(),
          CommunityScreen(),
          ProfileTab(),
        ],
      ),
      bottomNavigationBar: KovariBottomNav(
        currentIndex: currentIndex,
        onTap: (index) {
          ref.read(appShellIndexProvider.notifier).state = index;
        },
      ),
    );
  }
}
