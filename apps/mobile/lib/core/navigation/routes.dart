import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/features/auth/screens/reset_password_screen.dart';
import 'package:mobile/features/onboarding/screens/onboarding_screen.dart';
import '../../features/home/screens/home_screen.dart';
import '../../features/explore/screens/explore_screen.dart';
import '../../features/chat/screens/chat_inbox_screen.dart';
import '../../features/groups/screens/groups_screen.dart';
import '../../features/groups/screens/group_details_screen.dart';
import '../../features/app_shell/widgets/profile_tab.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/banned_screen.dart';
import '../../features/onboarding/screens/onboarding_screen.dart';
import '../../features/app_shell/screens/app_shell_screen.dart';
import '../../features/auth/screens/verify_email_screen.dart';
import '../../features/auth/screens/sign_up_screen.dart';
import '../../features/notifications/screens/notifications_screen.dart';
import '../../features/requests/screens/requests_screen.dart';
import '../../features/profile/screens/public_profile_screen.dart';
import '../../features/profile/screens/connections_screen.dart';

part 'routes.g.dart';

/// 🌍 [ShellBranch] - The foundation for persistent tab state.
/// Each branch maintains its own Navigator stack.

@TypedStatefulShellRoute<AppShellRouteData>(
  branches: [
    TypedStatefulShellBranch<HomeBranchData>(
      routes: [TypedGoRoute<HomeRouteData>(path: '/')],
    ),
    TypedStatefulShellBranch<ExploreBranchData>(
      routes: [TypedGoRoute<ExploreRouteData>(path: '/explore')],
    ),
    TypedStatefulShellBranch<ChatBranchData>(
      routes: [TypedGoRoute<ChatRouteData>(path: '/chat')],
    ),
    TypedStatefulShellBranch<GroupsBranchData>(
      routes: [
        TypedGoRoute<GroupsRouteData>(
          path: '/groups',
          routes: [TypedGoRoute<GroupDetailsRouteData>(path: ':groupId')],
        ),
      ],
    ),
    TypedStatefulShellBranch<ProfileBranchData>(
      routes: [TypedGoRoute<ProfileRouteData>(path: '/profile')],
    ),
  ],
)
class AppShellRouteData extends StatefulShellRouteData {
  const AppShellRouteData();

  @override
  Widget builder(
    BuildContext context,
    GoRouterState state,
    StatefulNavigationShell navigationShell,
  ) {
    return AppShellScreen(navigationShell: navigationShell);
  }
}

// Branches
class HomeBranchData extends StatefulShellBranchData {
  const HomeBranchData();
}

class ExploreBranchData extends StatefulShellBranchData {
  const ExploreBranchData();
}

class ChatBranchData extends StatefulShellBranchData {
  const ChatBranchData();
}

class GroupsBranchData extends StatefulShellBranchData {
  const GroupsBranchData();
}

class ProfileBranchData extends StatefulShellBranchData {
  const ProfileBranchData();
}

// Leaf Routes
class HomeRouteData extends GoRouteData with $HomeRouteData {
  const HomeRouteData();
  @override
  Widget build(BuildContext context, GoRouterState state) => const HomeScreen();
}

class ExploreRouteData extends GoRouteData with $ExploreRouteData {
  const ExploreRouteData();
  @override
  Widget build(BuildContext context, GoRouterState state) =>
      const ExploreScreen();
}

class ChatRouteData extends GoRouteData with $ChatRouteData {
  const ChatRouteData();
  @override
  Widget build(BuildContext context, GoRouterState state) =>
      const ChatInboxScreen();
}

class GroupsRouteData extends GoRouteData with $GroupsRouteData {
  const GroupsRouteData();
  @override
  Widget build(BuildContext context, GoRouterState state) =>
      const GroupsScreen();
}

class GroupDetailsRouteData extends GoRouteData with $GroupDetailsRouteData {
  final String groupId;
  const GroupDetailsRouteData({required this.groupId});

  @override
  Widget build(BuildContext context, GoRouterState state) =>
      GroupDetailsScreen(groupId: groupId);
}

class ProfileRouteData extends GoRouteData with $ProfileRouteData {
  const ProfileRouteData();
  @override
  Widget build(BuildContext context, GoRouterState state) => const ProfileTab();
}

// 🛡️ [Top Level Routes] - Non-Shell Screens
@TypedGoRoute<LoginRouteData>(path: '/login')
class LoginRouteData extends GoRouteData with $LoginRouteData {
  const LoginRouteData();
  @override
  Widget build(BuildContext context, GoRouterState state) =>
      const LoginScreen();
}

@TypedGoRoute<OnboardingRouteData>(path: '/onboarding')
class OnboardingRouteData extends GoRouteData with $OnboardingRouteData {
  const OnboardingRouteData();
  @override
  Widget build(BuildContext context, GoRouterState state) =>
      const OnboardingScreen();
}

@TypedGoRoute<BannedRouteData>(path: '/banned')
class BannedRouteData extends GoRouteData with $BannedRouteData {
  const BannedRouteData();
  @override
  Widget build(BuildContext context, GoRouterState state) =>
      const BannedScreen();
}

@TypedGoRoute<ResetPasswordRouteData>(path: '/reset-password')
class ResetPasswordRouteData extends GoRouteData with $ResetPasswordRouteData {
  final String? token;
  const ResetPasswordRouteData({this.token});

  @override
  Widget build(BuildContext context, GoRouterState state) =>
      ResetPasswordScreen(token: token ?? '');
}

@TypedGoRoute<SignUpRouteData>(path: '/sign-up')
class SignUpRouteData extends GoRouteData with $SignUpRouteData {
  const SignUpRouteData();
  @override
  Widget build(BuildContext context, GoRouterState state) =>
      const SignUpScreen();
}

@TypedGoRoute<VerifyEmailRouteData>(path: '/verify-email')
class VerifyEmailRouteData extends GoRouteData with $VerifyEmailRouteData {
  final String email;
  const VerifyEmailRouteData({required this.email});

  @override
  Widget build(BuildContext context, GoRouterState state) =>
      VerifyEmailScreen(email: email);
}

// 🔔 [Overlay Routes] - Slide over the shell without affecting bottom nav
@TypedGoRoute<NotificationsRouteData>(path: '/notifications')
class NotificationsRouteData extends GoRouteData with $NotificationsRouteData {
  const NotificationsRouteData();
  @override
  Widget build(BuildContext context, GoRouterState state) =>
      const NotificationsScreen();
}

@TypedGoRoute<RequestsRouteData>(path: '/requests')
class RequestsRouteData extends GoRouteData with $RequestsRouteData {
  const RequestsRouteData();
  @override
  Widget build(BuildContext context, GoRouterState state) =>
      const RequestsScreen();
}

@TypedGoRoute<PublicProfileRouteData>(path: '/user/:userId')
class PublicProfileRouteData extends GoRouteData with $PublicProfileRouteData {
  final String userId;
  const PublicProfileRouteData({required this.userId});

  @override
  Widget build(BuildContext context, GoRouterState state) =>
      PublicProfileScreen(userId: userId);
}

@TypedGoRoute<ConnectionsRouteData>(path: '/user/:userId/connections')
class ConnectionsRouteData extends GoRouteData with $ConnectionsRouteData {
  final String userId;
  final String username;
  final String? initialTab;
  const ConnectionsRouteData({
    required this.userId,
    required this.username,
    this.initialTab,
  });

  @override
  Widget build(BuildContext context, GoRouterState state) => ConnectionsScreen(
    userId: userId,
    username: username,
    initialTab: initialTab ?? 'followers',
  );
}
