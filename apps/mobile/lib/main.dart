import 'package:flutter/material.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:flutter/foundation.dart' show kIsWeb, kReleaseMode;
import 'dart:ui';
import 'package:sentry_flutter/sentry_flutter.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'core/utils/app_logger.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/profile/models/user_profile.dart';
import 'features/app_shell/screens/app_shell_screen.dart';
import 'features/onboarding/screens/onboarding_screen.dart';
import 'core/network/api_client.dart';
import 'core/theme/app_colors.dart';
import 'features/onboarding/data/profile_service.dart';
import 'dart:async';
import 'package:app_links/app_links.dart';
import 'core/config/routes.dart';
import 'features/groups/screens/group_invite_screen.dart';
import 'features/auth/screens/reset_password_screen.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'core/config/env.dart';
import 'features/auth/screens/banned_screen.dart';
import 'shared/widgets/dynamic_status_overlay.dart';

import 'core/providers/auth_provider.dart';
import 'core/providers/profile_provider.dart';
import 'core/providers/cache_provider.dart';
import 'core/network/mutation_queue.dart';
import 'core/providers/theme_provider.dart';
import 'core/runtime/runtime_init.dart';

late final ProviderContainer globalProviderContainer;

void main() {
  runZonedGuarded(
    () async {
      WidgetsBinding widgetsBinding = WidgetsFlutterBinding.ensureInitialized();
      FlutterNativeSplash.preserve(widgetsBinding: widgetsBinding);

      // Initialize Hive
      try {
        await Hive.initFlutter();
        await Hive.openBox('settings');
        AppLogger.i('Hive initialized successfully');
      } catch (e) {
        AppLogger.e('Hive initialization failed: $e');
      }

      // Global Error Handlers
      FlutterError.onError = (FlutterErrorDetails details) {
        if (kReleaseMode) {
          Sentry.captureException(details.exception, stackTrace: details.stack);
        } else {
          FlutterError.presentError(details);
        }
        AppLogger.e(
          'FlutterError: ${details.exception}',
          stackTrace: details.stack,
          reportToSentry: false,
        );
      };

      PlatformDispatcher.instance.onError = (error, stack) {
        if (kReleaseMode) {
          Sentry.captureException(error, stackTrace: stack);
        }
        AppLogger.e(
          'PlatformDispatcherError: $error',
          stackTrace: stack,
          reportToSentry: false,
        );
        return true;
      };

      // Custom Error Widget
      ErrorWidget.builder = (FlutterErrorDetails details) {
        if (kReleaseMode) {
          return Scaffold(
            backgroundColor: AppColors.background,
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.warning_rounded,
                    color: AppColors.primary,
                    size: 64,
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Oops! Something went wrong.',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppColors.foreground,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'We are working to fix it.',
                    style: TextStyle(color: AppColors.mutedForeground),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () {},
                    child: const Text('Return Home'),
                  ),
                ],
              ),
            ),
          );
        }
        return ErrorWidget(details.exception);
      };

      // Load environment variables
      const envFile = String.fromEnvironment(
        'ENV_FILE',
        defaultValue: '.env.development',
      );
      try {
        await dotenv.load(fileName: envFile);
        AppLogger.i('Loaded environment from $envFile');
      } catch (e) {
        AppLogger.w(
          'Dotenv failed to load $envFile: $e. Falling back to dart-define.',
        );
      }

      try {
        Env.validate();
      } catch (e) {
        AppLogger.e('Environment validation failed: $e');
        // We continue to runApp so the user can see an error widget instead of a hang
      }

      // Initialize Google Sign In
      try {
        AppLogger.d('Initializing Google Sign-In (isWeb: $kIsWeb)...');
        await GoogleSignIn.instance.initialize(
          clientId: kIsWeb ? Env.googleClientId : null,
          serverClientId: kIsWeb ? null : Env.googleClientId,
        );
        AppLogger.i('Google Sign-In initialized successfully.');
      } catch (e) {
        AppLogger.e('Google Sign-In initialization failed: $e');
      }

      final container = ProviderContainer();
      globalProviderContainer = container;
      try {
        await container.read(cacheInitProvider.future);
        await container.read(mutationQueueInitProvider.future);

        // 🚀 [Critical Runtime Path] Initialize Persistent Runtime
        await container.read(runtimeInitProvider.future);

        // Start background cache maintenance
        Timer.periodic(const Duration(minutes: 15), (_) {
          container.read(localCacheProvider).cleanupExpired();
        });
      } catch (e) {
        AppLogger.e('Initialization failed: $e');
      }

      final sentryDsn = Env.sentryDsn;
      if (sentryDsn != null && sentryDsn.isNotEmpty) {
        await SentryFlutter.init(
          (options) {
            options.dsn = sentryDsn;
            options.tracesSampleRate = 1.0;
          },
          appRunner: () => runApp(
            UncontrolledProviderScope(
              container: container,
              child: const KovariApp(),
            ),
          ),
        );
      } else {
        AppLogger.w('Sentry DSN not found. Running without Sentry.');
        runApp(
          UncontrolledProviderScope(
            container: container,
            child: const KovariApp(),
          ),
        );
      }
    },
    (error, stackTrace) {
      AppLogger.e(
        'Uncaught Zone Error: $error',
        stackTrace: stackTrace,
        reportToSentry: true,
      );

      if (kReleaseMode) {
        Sentry.captureException(error, stackTrace: stackTrace);
      }
    },
  );
}

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

class KovariApp extends ConsumerStatefulWidget {
  const KovariApp({super.key});

  @override
  ConsumerState<KovariApp> createState() => _KovariAppState();
}

class _KovariAppState extends ConsumerState<KovariApp> {
  late AppLinks _appLinks;
  StreamSubscription<Uri>? _linkSubscription;

  @override
  void initState() {
    super.initState();
    _initDeepLinks();
  }

  @override
  void dispose() {
    _linkSubscription?.cancel();
    super.dispose();
  }

  void _initDeepLinks() {
    _appLinks = AppLinks();
    _linkSubscription = _appLinks.uriLinkStream.listen(_handleDeepLink);
    _appLinks.getInitialLink().then((uri) {
      if (uri != null) _handleDeepLink(uri);
    });
  }

  void _handleDeepLink(Uri uri) {
    debugPrint('🔗 Deep Link received: $uri');
    final segments = uri.pathSegments;
    bool isResetPath =
        uri.path.contains('forgot-password') || uri.host == 'reset-password';
    bool isInvitePath =
        (segments.isNotEmpty && segments.first == 'invite') ||
        uri.host == 'invite';
    String? resetToken = uri.queryParameters['token'];

    if (isResetPath && resetToken != null) {
      Future.delayed(const Duration(milliseconds: 500), () {
        navigatorKey.currentState?.push(
          MaterialPageRoute(
            builder: (context) => ResetPasswordScreen(token: resetToken),
          ),
        );
      });
    } else if (isInvitePath) {
      final inviteToken = uri.host == 'invite' ? segments.first : segments[1];
      Future.delayed(const Duration(milliseconds: 500), () {
        navigatorKey.currentState?.push(
          MaterialPageRoute(
            builder: (context) => GroupInviteScreen(token: inviteToken),
          ),
        );
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Kovari',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ref.watch(themeProvider),
      navigatorKey: navigatorKey,
      routes: AppRoutes.routes,
      builder: (context, child) {
        return GestureDetector(
          onTap: () => FocusManager.instance.primaryFocus?.unfocus(),
          child: NotificationListener<ScrollNotification>(
            onNotification: (notification) {
              if (notification is ScrollUpdateNotification &&
                  notification.dragDetails != null) {
                FocusManager.instance.primaryFocus?.unfocus();
              }
              return false;
            },
            child: ScrollConfiguration(
              behavior: const BouncingScrollBehavior(),
              child: Stack(children: [child!, const DynamicStatusOverlay()]),
            ),
          ),
        );
      },
      home: const AuthWrapper(),
    );
  }
}

class AuthWrapper extends ConsumerStatefulWidget {
  const AuthWrapper({super.key});

  @override
  ConsumerState<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends ConsumerState<AuthWrapper> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(authProvider.notifier).init();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);

    if (auth.isBootstrapping) {
      return const SizedBox.shrink(); // Native splash stays until remove() is called
    }

    if (!auth.isAuthenticated) {
      FlutterNativeSplash.remove();
      return const LoginScreen();
    }

    final user = auth.user;
    if (user != null && user.banned) {
      if (user.banExpiresAt != null) {
        final expiresAt = DateTime.parse(user.banExpiresAt!).toLocal();
        if (expiresAt.isAfter(DateTime.now())) {
          FlutterNativeSplash.remove();
          return BannedScreen(user: user);
        }
      } else {
        FlutterNativeSplash.remove();
        return BannedScreen(user: user);
      }
    }

    return const AuthHandler();
  }
}

class AuthHandler extends ConsumerStatefulWidget {
  const AuthHandler({super.key});

  @override
  ConsumerState<AuthHandler> createState() => _AuthHandlerState();
}

class _AuthHandlerState extends ConsumerState<AuthHandler> {
  bool _isSyncing = true;
  bool _needsOnboarding = false;

  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    try {
      final apiClient = ref.read(apiClientProvider);
      final profileService = ProfileService(apiClient);
      final profileJson = await profileService.getCurrentProfile(
        ignoreCache: false,
      );

      AppLogger.d('🔍 [AUTH] Profile fetch result: $profileJson');

      if (mounted) {
        if (profileJson != null &&
            (profileJson['onboardingCompleted'] == true ||
                (profileJson['username'] as String? ?? '').isNotEmpty)) {
          final userProfile = UserProfile.fromJson(profileJson);
          ref.read(profileProvider.notifier).setProfile(userProfile);
        }

        final needsOnboarding =
            profileJson == null ||
            (profileJson['onboardingCompleted'] != true &&
                (profileJson['username'] as String? ?? '').isEmpty);

        if (needsOnboarding) {
          AppLogger.w(
            '🚩 [AUTH] Redirecting to Onboarding. Reason: ${profileJson == null ? 'Profile is NULL' : 'Incomplete: completed=${profileJson['onboardingCompleted']}, username="${profileJson['username']}"'}',
          );
        } else {
          AppLogger.i('✅ [AUTH] Onboarding verified. Proceeding to AppShell.');
        }

        setState(() {
          _isSyncing = false;
          _needsOnboarding = needsOnboarding;
        });

        // 🚀 Remove splash ONLY when we know where to land
        FlutterNativeSplash.remove();
      }
    } catch (e) {
      AppLogger.e('⚠️ [AUTH] Initialization error: $e');
      if (mounted) {
        setState(() {
          _isSyncing = false;
          _needsOnboarding = false;
        });
        FlutterNativeSplash.remove();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isSyncing) return const SizedBox.shrink();

    if (_needsOnboarding) {
      return const OnboardingScreen();
    }
    return const AppShellScreen();
  }
}

class BouncingScrollBehavior extends ScrollBehavior {
  const BouncingScrollBehavior();

  @override
  ScrollPhysics getScrollPhysics(BuildContext context) {
    return const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics());
  }
}
