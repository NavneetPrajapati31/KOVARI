// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'routes.dart';

// **************************************************************************
// GoRouterGenerator
// **************************************************************************

List<RouteBase> get $appRoutes => [
  $appShellRouteData,
  $createGroupRouteData,
  $groupDetailsRouteData,
  $groupInviteRouteData,
  $editProfileRouteData,
  $settingsRouteData,
  $safetyRouteData,
  $myReportsRouteData,
  $reportTargetSearchRouteData,
  $submitReportRouteData,
  $connectionsRouteData,
  $loginRouteData,
  $onboardingRouteData,
  $bannedRouteData,
  $resetPasswordRouteData,
  $signUpRouteData,
  $verifyEmailRouteData,
  $forgotPasswordRouteData,
  $searchRouteData,
  $notificationsRouteData,
  $requestsRouteData,
  $publicProfileRouteData,
];

RouteBase get $appShellRouteData => StatefulShellRouteData.$route(
  factory: $AppShellRouteDataExtension._fromState,
  branches: [
    StatefulShellBranchData.$branch(
      routes: [
        GoRouteData.$route(path: '/', factory: $HomeRouteData._fromState),
      ],
    ),
    StatefulShellBranchData.$branch(
      routes: [
        GoRouteData.$route(
          path: '/explore',
          factory: $ExploreRouteData._fromState,
        ),
      ],
    ),
    StatefulShellBranchData.$branch(
      routes: [
        GoRouteData.$route(path: '/chat', factory: $ChatRouteData._fromState),
      ],
    ),
    StatefulShellBranchData.$branch(
      routes: [
        GoRouteData.$route(
          path: '/groups',
          factory: $GroupsRouteData._fromState,
        ),
      ],
    ),
    StatefulShellBranchData.$branch(
      routes: [
        GoRouteData.$route(
          path: '/profile',
          factory: $ProfileRouteData._fromState,
        ),
      ],
    ),
  ],
);

extension $AppShellRouteDataExtension on AppShellRouteData {
  static AppShellRouteData _fromState(GoRouterState state) =>
      const AppShellRouteData();
}

mixin $HomeRouteData on GoRouteData {
  static HomeRouteData _fromState(GoRouterState state) => const HomeRouteData();

  @override
  String get location => GoRouteData.$location('/');

  @override
  void go(BuildContext context) => context.go(location);

  @override
  Future<T?> push<T>(BuildContext context) => context.push<T>(location);

  @override
  void pushReplacement(BuildContext context) =>
      context.pushReplacement(location);

  @override
  void replace(BuildContext context) => context.replace(location);
}

mixin $ExploreRouteData on GoRouteData {
  static ExploreRouteData _fromState(GoRouterState state) =>
      const ExploreRouteData();

  @override
  String get location => GoRouteData.$location('/explore');

  @override
  void go(BuildContext context) => context.go(location);

  @override
  Future<T?> push<T>(BuildContext context) => context.push<T>(location);

  @override
  void pushReplacement(BuildContext context) =>
      context.pushReplacement(location);

  @override
  void replace(BuildContext context) => context.replace(location);
}

mixin $ChatRouteData on GoRouteData {
  static ChatRouteData _fromState(GoRouterState state) => const ChatRouteData();

  @override
  String get location => GoRouteData.$location('/chat');

  @override
  void go(BuildContext context) => context.go(location);

  @override
  Future<T?> push<T>(BuildContext context) => context.push<T>(location);

  @override
  void pushReplacement(BuildContext context) =>
      context.pushReplacement(location);

  @override
  void replace(BuildContext context) => context.replace(location);
}

mixin $GroupsRouteData on GoRouteData {
  static GroupsRouteData _fromState(GoRouterState state) =>
      const GroupsRouteData();

  @override
  String get location => GoRouteData.$location('/groups');

  @override
  void go(BuildContext context) => context.go(location);

  @override
  Future<T?> push<T>(BuildContext context) => context.push<T>(location);

  @override
  void pushReplacement(BuildContext context) =>
      context.pushReplacement(location);

  @override
  void replace(BuildContext context) => context.replace(location);
}

mixin $ProfileRouteData on GoRouteData {
  static ProfileRouteData _fromState(GoRouterState state) =>
      const ProfileRouteData();

  @override
  String get location => GoRouteData.$location('/profile');

  @override
  void go(BuildContext context) => context.go(location);

  @override
  Future<T?> push<T>(BuildContext context) => context.push<T>(location);

  @override
  void pushReplacement(BuildContext context) =>
      context.pushReplacement(location);

  @override
  void replace(BuildContext context) => context.replace(location);
}

RouteBase get $createGroupRouteData => GoRouteData.$route(
  path: '/groups/create',
  factory: $CreateGroupRouteData._fromState,
);

mixin $CreateGroupRouteData on GoRouteData {
  static CreateGroupRouteData _fromState(GoRouterState state) =>
      const CreateGroupRouteData();

  @override
  String get location => GoRouteData.$location('/groups/create');

  @override
  void go(BuildContext context) => context.go(location);

  @override
  Future<T?> push<T>(BuildContext context) => context.push<T>(location);

  @override
  void pushReplacement(BuildContext context) =>
      context.pushReplacement(location);

  @override
  void replace(BuildContext context) => context.replace(location);
}

RouteBase get $groupDetailsRouteData => GoRouteData.$route(
  path: '/groups/:groupId',
  factory: $GroupDetailsRouteData._fromState,
);

mixin $GroupDetailsRouteData on GoRouteData {
  static GroupDetailsRouteData _fromState(GoRouterState state) =>
      GroupDetailsRouteData(groupId: state.pathParameters['groupId']!);

  GroupDetailsRouteData get _self => this as GroupDetailsRouteData;

  @override
  String get location =>
      GoRouteData.$location('/groups/${Uri.encodeComponent(_self.groupId)}');

  @override
  void go(BuildContext context) => context.go(location);

  @override
  Future<T?> push<T>(BuildContext context) => context.push<T>(location);

  @override
  void pushReplacement(BuildContext context) =>
      context.pushReplacement(location);

  @override
  void replace(BuildContext context) => context.replace(location);
}

RouteBase get $groupInviteRouteData => GoRouteData.$route(
  path: '/groups/invite/:token',
  factory: $GroupInviteRouteData._fromState,
);

mixin $GroupInviteRouteData on GoRouteData {
  static GroupInviteRouteData _fromState(GoRouterState state) =>
      GroupInviteRouteData(token: state.pathParameters['token']!);

  GroupInviteRouteData get _self => this as GroupInviteRouteData;

  @override
  String get location => GoRouteData.$location(
    '/groups/invite/${Uri.encodeComponent(_self.token)}',
  );

  @override
  void go(BuildContext context) => context.go(location);

  @override
  Future<T?> push<T>(BuildContext context) => context.push<T>(location);

  @override
  void pushReplacement(BuildContext context) =>
      context.pushReplacement(location);

  @override
  void replace(BuildContext context) => context.replace(location);
}

RouteBase get $editProfileRouteData => GoRouteData.$route(
  path: '/profile/edit',
  factory: $EditProfileRouteData._fromState,
);

mixin $EditProfileRouteData on GoRouteData {
  static EditProfileRouteData _fromState(GoRouterState state) =>
      const EditProfileRouteData();

  @override
  String get location => GoRouteData.$location('/profile/edit');

  @override
  void go(BuildContext context) => context.go(location);

  @override
  Future<T?> push<T>(BuildContext context) => context.push<T>(location);

  @override
  void pushReplacement(BuildContext context) =>
      context.pushReplacement(location);

  @override
  void replace(BuildContext context) => context.replace(location);
}

RouteBase get $settingsRouteData => GoRouteData.$route(
  path: '/profile/settings',
  factory: $SettingsRouteData._fromState,
);

mixin $SettingsRouteData on GoRouteData {
  static SettingsRouteData _fromState(GoRouterState state) =>
      const SettingsRouteData();

  @override
  String get location => GoRouteData.$location('/profile/settings');

  @override
  void go(BuildContext context) => context.go(location);

  @override
  Future<T?> push<T>(BuildContext context) => context.push<T>(location);

  @override
  void pushReplacement(BuildContext context) =>
      context.pushReplacement(location);

  @override
  void replace(BuildContext context) => context.replace(location);
}

RouteBase get $safetyRouteData => GoRouteData.$route(
  path: '/profile/safety',
  factory: $SafetyRouteData._fromState,
);

mixin $SafetyRouteData on GoRouteData {
  static SafetyRouteData _fromState(GoRouterState state) =>
      const SafetyRouteData();

  @override
  String get location => GoRouteData.$location('/profile/safety');

  @override
  void go(BuildContext context) => context.go(location);

  @override
  Future<T?> push<T>(BuildContext context) => context.push<T>(location);

  @override
  void pushReplacement(BuildContext context) =>
      context.pushReplacement(location);

  @override
  void replace(BuildContext context) => context.replace(location);
}

RouteBase get $myReportsRouteData => GoRouteData.$route(
  path: '/profile/reports',
  factory: $MyReportsRouteData._fromState,
);

mixin $MyReportsRouteData on GoRouteData {
  static MyReportsRouteData _fromState(GoRouterState state) =>
      const MyReportsRouteData();

  @override
  String get location => GoRouteData.$location('/profile/reports');

  @override
  void go(BuildContext context) => context.go(location);

  @override
  Future<T?> push<T>(BuildContext context) => context.push<T>(location);

  @override
  void pushReplacement(BuildContext context) =>
      context.pushReplacement(location);

  @override
  void replace(BuildContext context) => context.replace(location);
}

RouteBase get $reportTargetSearchRouteData => GoRouteData.$route(
  path: '/profile/reports/search',
  factory: $ReportTargetSearchRouteData._fromState,
);

mixin $ReportTargetSearchRouteData on GoRouteData {
  static ReportTargetSearchRouteData _fromState(GoRouterState state) =>
      ReportTargetSearchRouteData(
        targetType: state.uri.queryParameters['target-type']!,
      );

  ReportTargetSearchRouteData get _self => this as ReportTargetSearchRouteData;

  @override
  String get location => GoRouteData.$location(
    '/profile/reports/search',
    queryParams: {'target-type': _self.targetType},
  );

  @override
  void go(BuildContext context) => context.go(location);

  @override
  Future<T?> push<T>(BuildContext context) => context.push<T>(location);

  @override
  void pushReplacement(BuildContext context) =>
      context.pushReplacement(location);

  @override
  void replace(BuildContext context) => context.replace(location);
}

RouteBase get $submitReportRouteData => GoRouteData.$route(
  path: '/profile/reports/submit/:targetId',
  factory: $SubmitReportRouteData._fromState,
);

mixin $SubmitReportRouteData on GoRouteData {
  static SubmitReportRouteData _fromState(GoRouterState state) =>
      SubmitReportRouteData(
        targetId: state.pathParameters['targetId']!,
        targetType: state.uri.queryParameters['target-type']!,
        targetName: state.uri.queryParameters['target-name']!,
      );

  SubmitReportRouteData get _self => this as SubmitReportRouteData;

  @override
  String get location => GoRouteData.$location(
    '/profile/reports/submit/${Uri.encodeComponent(_self.targetId)}',
    queryParams: {
      'target-type': _self.targetType,
      'target-name': _self.targetName,
    },
  );

  @override
  void go(BuildContext context) => context.go(location);

  @override
  Future<T?> push<T>(BuildContext context) => context.push<T>(location);

  @override
  void pushReplacement(BuildContext context) =>
      context.pushReplacement(location);

  @override
  void replace(BuildContext context) => context.replace(location);
}

RouteBase get $connectionsRouteData => GoRouteData.$route(
  path: '/user/:userId/connections',
  factory: $ConnectionsRouteData._fromState,
);

mixin $ConnectionsRouteData on GoRouteData {
  static ConnectionsRouteData _fromState(GoRouterState state) =>
      ConnectionsRouteData(
        userId: state.pathParameters['userId']!,
        username: state.uri.queryParameters['username']!,
        initialTab: state.uri.queryParameters['initial-tab'],
      );

  ConnectionsRouteData get _self => this as ConnectionsRouteData;

  @override
  String get location => GoRouteData.$location(
    '/user/${Uri.encodeComponent(_self.userId)}/connections',
    queryParams: {
      'username': _self.username,
      if (_self.initialTab != null) 'initial-tab': _self.initialTab,
    },
  );

  @override
  void go(BuildContext context) => context.go(location);

  @override
  Future<T?> push<T>(BuildContext context) => context.push<T>(location);

  @override
  void pushReplacement(BuildContext context) =>
      context.pushReplacement(location);

  @override
  void replace(BuildContext context) => context.replace(location);
}

RouteBase get $loginRouteData =>
    GoRouteData.$route(path: '/login', factory: $LoginRouteData._fromState);

mixin $LoginRouteData on GoRouteData {
  static LoginRouteData _fromState(GoRouterState state) =>
      const LoginRouteData();

  @override
  String get location => GoRouteData.$location('/login');

  @override
  void go(BuildContext context) => context.go(location);

  @override
  Future<T?> push<T>(BuildContext context) => context.push<T>(location);

  @override
  void pushReplacement(BuildContext context) =>
      context.pushReplacement(location);

  @override
  void replace(BuildContext context) => context.replace(location);
}

RouteBase get $onboardingRouteData => GoRouteData.$route(
  path: '/onboarding',
  factory: $OnboardingRouteData._fromState,
);

mixin $OnboardingRouteData on GoRouteData {
  static OnboardingRouteData _fromState(GoRouterState state) =>
      const OnboardingRouteData();

  @override
  String get location => GoRouteData.$location('/onboarding');

  @override
  void go(BuildContext context) => context.go(location);

  @override
  Future<T?> push<T>(BuildContext context) => context.push<T>(location);

  @override
  void pushReplacement(BuildContext context) =>
      context.pushReplacement(location);

  @override
  void replace(BuildContext context) => context.replace(location);
}

RouteBase get $bannedRouteData =>
    GoRouteData.$route(path: '/banned', factory: $BannedRouteData._fromState);

mixin $BannedRouteData on GoRouteData {
  static BannedRouteData _fromState(GoRouterState state) =>
      const BannedRouteData();

  @override
  String get location => GoRouteData.$location('/banned');

  @override
  void go(BuildContext context) => context.go(location);

  @override
  Future<T?> push<T>(BuildContext context) => context.push<T>(location);

  @override
  void pushReplacement(BuildContext context) =>
      context.pushReplacement(location);

  @override
  void replace(BuildContext context) => context.replace(location);
}

RouteBase get $resetPasswordRouteData => GoRouteData.$route(
  path: '/reset-password',
  factory: $ResetPasswordRouteData._fromState,
);

mixin $ResetPasswordRouteData on GoRouteData {
  static ResetPasswordRouteData _fromState(GoRouterState state) =>
      ResetPasswordRouteData(token: state.uri.queryParameters['token']);

  ResetPasswordRouteData get _self => this as ResetPasswordRouteData;

  @override
  String get location => GoRouteData.$location(
    '/reset-password',
    queryParams: {if (_self.token != null) 'token': _self.token},
  );

  @override
  void go(BuildContext context) => context.go(location);

  @override
  Future<T?> push<T>(BuildContext context) => context.push<T>(location);

  @override
  void pushReplacement(BuildContext context) =>
      context.pushReplacement(location);

  @override
  void replace(BuildContext context) => context.replace(location);
}

RouteBase get $signUpRouteData =>
    GoRouteData.$route(path: '/sign-up', factory: $SignUpRouteData._fromState);

mixin $SignUpRouteData on GoRouteData {
  static SignUpRouteData _fromState(GoRouterState state) =>
      const SignUpRouteData();

  @override
  String get location => GoRouteData.$location('/sign-up');

  @override
  void go(BuildContext context) => context.go(location);

  @override
  Future<T?> push<T>(BuildContext context) => context.push<T>(location);

  @override
  void pushReplacement(BuildContext context) =>
      context.pushReplacement(location);

  @override
  void replace(BuildContext context) => context.replace(location);
}

RouteBase get $verifyEmailRouteData => GoRouteData.$route(
  path: '/verify-email',
  factory: $VerifyEmailRouteData._fromState,
);

mixin $VerifyEmailRouteData on GoRouteData {
  static VerifyEmailRouteData _fromState(GoRouterState state) =>
      VerifyEmailRouteData(email: state.uri.queryParameters['email']!);

  VerifyEmailRouteData get _self => this as VerifyEmailRouteData;

  @override
  String get location => GoRouteData.$location(
    '/verify-email',
    queryParams: {'email': _self.email},
  );

  @override
  void go(BuildContext context) => context.go(location);

  @override
  Future<T?> push<T>(BuildContext context) => context.push<T>(location);

  @override
  void pushReplacement(BuildContext context) =>
      context.pushReplacement(location);

  @override
  void replace(BuildContext context) => context.replace(location);
}

RouteBase get $forgotPasswordRouteData => GoRouteData.$route(
  path: '/forgot-password',
  factory: $ForgotPasswordRouteData._fromState,
);

mixin $ForgotPasswordRouteData on GoRouteData {
  static ForgotPasswordRouteData _fromState(GoRouterState state) =>
      const ForgotPasswordRouteData();

  @override
  String get location => GoRouteData.$location('/forgot-password');

  @override
  void go(BuildContext context) => context.go(location);

  @override
  Future<T?> push<T>(BuildContext context) => context.push<T>(location);

  @override
  void pushReplacement(BuildContext context) =>
      context.pushReplacement(location);

  @override
  void replace(BuildContext context) => context.replace(location);
}

RouteBase get $searchRouteData =>
    GoRouteData.$route(path: '/search', factory: $SearchRouteData._fromState);

mixin $SearchRouteData on GoRouteData {
  static SearchRouteData _fromState(GoRouterState state) =>
      const SearchRouteData();

  @override
  String get location => GoRouteData.$location('/search');

  @override
  void go(BuildContext context) => context.go(location);

  @override
  Future<T?> push<T>(BuildContext context) => context.push<T>(location);

  @override
  void pushReplacement(BuildContext context) =>
      context.pushReplacement(location);

  @override
  void replace(BuildContext context) => context.replace(location);
}

RouteBase get $notificationsRouteData => GoRouteData.$route(
  path: '/notifications',
  factory: $NotificationsRouteData._fromState,
);

mixin $NotificationsRouteData on GoRouteData {
  static NotificationsRouteData _fromState(GoRouterState state) =>
      const NotificationsRouteData();

  @override
  String get location => GoRouteData.$location('/notifications');

  @override
  void go(BuildContext context) => context.go(location);

  @override
  Future<T?> push<T>(BuildContext context) => context.push<T>(location);

  @override
  void pushReplacement(BuildContext context) =>
      context.pushReplacement(location);

  @override
  void replace(BuildContext context) => context.replace(location);
}

RouteBase get $requestsRouteData => GoRouteData.$route(
  path: '/requests',
  factory: $RequestsRouteData._fromState,
);

mixin $RequestsRouteData on GoRouteData {
  static RequestsRouteData _fromState(GoRouterState state) =>
      const RequestsRouteData();

  @override
  String get location => GoRouteData.$location('/requests');

  @override
  void go(BuildContext context) => context.go(location);

  @override
  Future<T?> push<T>(BuildContext context) => context.push<T>(location);

  @override
  void pushReplacement(BuildContext context) =>
      context.pushReplacement(location);

  @override
  void replace(BuildContext context) => context.replace(location);
}

RouteBase get $publicProfileRouteData => GoRouteData.$route(
  path: '/user/:userId',
  factory: $PublicProfileRouteData._fromState,
);

mixin $PublicProfileRouteData on GoRouteData {
  static PublicProfileRouteData _fromState(GoRouterState state) =>
      PublicProfileRouteData(userId: state.pathParameters['userId']!);

  PublicProfileRouteData get _self => this as PublicProfileRouteData;

  @override
  String get location =>
      GoRouteData.$location('/user/${Uri.encodeComponent(_self.userId)}');

  @override
  void go(BuildContext context) => context.go(location);

  @override
  Future<T?> push<T>(BuildContext context) => context.push<T>(location);

  @override
  void pushReplacement(BuildContext context) =>
      context.pushReplacement(location);

  @override
  void replace(BuildContext context) => context.replace(location);
}
