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

import 'core/providers/auth_provider.dart';
import 'core/providers/profile_provider.dart';
import 'core/providers/connectivity_provider.dart';
import 'core/providers/cache_provider.dart';
import 'core/auth/session_manager.dart';

void main() {
  runZonedGuarded(
    () async {
      WidgetsBinding widgetsBinding = WidgetsFlutterBinding.ensureInitialized();
      FlutterNativeSplash.preserve(widgetsBinding: widgetsBinding);

      // Initialize Hive
      try {
        await Hive.initFlutter();
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
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'We are working to fix it.',
                    style: TextStyle(color: AppColors.mutedForeground),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                    ),
                    child: const Text(
                      'Return Home',
                      style: TextStyle(color: Colors.white),
                    ),
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
      try {
        await container.read(cacheInitProvider.future);
      } catch (e) {
        AppLogger.e('Cache initialization failed: $e');
      }

      final sentryDsn = Env.sentryDsn;
      if (sentryDsn != null && sentryDsn.isNotEmpty) {
        await SentryFlutter.init((options) {
          options.dsn = sentryDsn;
          options.tracesSampleRate = 1.0;
        }, appRunner: () => runApp(UncontrolledProviderScope(container: container, child: const KovariApp())));
      } else {
        AppLogger.w('Sentry DSN not found. Running without Sentry.');
        runApp(UncontrolledProviderScope(container: container, child: const KovariApp()));
      }
    },
    (error, stackTrace) {
      AppLogger.e(
        'Uncaught Zone Error: $error',
        stackTrace: stackTrace,
        reportToSentry: false,
      );
      // Ensure app runs even on zone errors during startup
      try {
        runApp(const ProviderScope(child: KovariApp()));
      } catch (_) {}

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
      title: 'KOVARI',
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.light,
      theme: AppTheme.lightTheme,
      navigatorKey: navigatorKey,
      routes: AppRoutes.routes,
      builder: (context, child) {
        return Stack(children: [child!, const GlobalStatusOverlay()]);
      },
      home: const AuthWrapper(),
    );
  }
}

class GlobalStatusOverlay extends ConsumerStatefulWidget {
  const GlobalStatusOverlay({super.key});

  @override
  ConsumerState<GlobalStatusOverlay> createState() =>
      _GlobalStatusOverlayState();
}

class _GlobalStatusOverlayState extends ConsumerState<GlobalStatusOverlay> {
  Timer? _syncTimer;
  bool _showRetry = false;

  @override
  void dispose() {
    _syncTimer?.cancel();
    super.dispose();
  }

  void _resetTimer() {
    _syncTimer?.cancel();
    _showRetry = false;
    final sessionManager = ref.read(sessionManagerProvider);
    _syncTimer = Timer(sessionManager.adaptiveTimeout, () {
      if (mounted) setState(() => _showRetry = true);
    });
  }

  @override
  Widget build(BuildContext context) {
    final connectivity = ref.watch(connectivityProvider);
    final auth = ref.watch(authProvider);

    debugPrint(
      '🎨 [UI] Overlay Rebuild - Connectivity: ${connectivity.status.name}, Auth: (degraded: ${auth.isDegraded}, refreshing: ${auth.isRefreshing})',
    );

    // Manage timer based on refreshing state
    if (auth.isRefreshing) {
      if (_syncTimer == null) _resetTimer();
    } else {
      _syncTimer?.cancel();
      _syncTimer = null;
      _showRetry = false;
    }

    if (!auth.isDegraded && !auth.isRefreshing && connectivity.isOnline) {
      return const SizedBox.shrink();
    }

    return Positioned.fill(
      key: ValueKey(
        'overlay_${connectivity.status.name}_${auth.isDegraded}_${auth.isRefreshing}',
      ),
      child: Stack(
        children: [
          if (!connectivity.isOnline)
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: Material(
                color: connectivity.isOffline
                    ? Colors.red.shade600
                    : Colors.amber.shade900,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    vertical: 8,
                    horizontal: 16,
                  ),
                  child: SafeArea(
                    bottom: false,
                    child: Text(
                      connectivity.isOffline
                          ? 'No internet connection'
                          : 'Server unreachable',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          if (auth.isDegraded || auth.isRefreshing)
            Positioned(
              top:
                  MediaQuery.of(context).padding.top +
                  (!connectivity.isOnline ? 45 : 10),
              left: 20,
              right: 20,
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: _showRetry
                      ? () => ref.read(authProvider.notifier).init()
                      : null,
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: auth.isDegraded
                          ? Colors.amber.shade800
                          : AppColors.primary,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.2),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white.withOpacity(
                              _showRetry ? 0.5 : 1,
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            _showRetry
                                ? 'Connection slow. Tap to retry.'
                                : (auth.isDegraded
                                      ? 'Degraded Mode: Reconnecting...'
                                      : 'Syncing...'),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (_showRetry)
                          const Icon(
                            Icons.refresh,
                            color: Colors.white,
                            size: 14,
                          ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
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
      return const BrandedLoading();
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
  String? _error;

  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    try {
      final apiClient = ref.read(apiClientProvider);
      final profileService = ProfileService(apiClient);
      final profileJson = await profileService.getCurrentProfile(ignoreCache: true);

      if (mounted) {
        if (profileJson != null &&
            (profileJson['onboardingCompleted'] == true ||
                (profileJson['username'] as String? ?? '').isNotEmpty)) {
          final userProfile = UserProfile.fromJson(profileJson);
          ref.read(profileProvider.notifier).setProfile(userProfile);
        }

        setState(() {
          _isSyncing = false;
          _needsOnboarding = profileJson == null ||
              (profileJson['onboardingCompleted'] != true &&
                  (profileJson['username'] as String? ?? '').isEmpty);
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSyncing = false;
          _error = e.toString();
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(connectivityProvider, (previous, next) {
      if (next.isOnline && _error != null) {
        AppLogger.i('🌐 Connectivity restored. Retrying initialization...');
        if (mounted) {
          setState(() {
            _isSyncing = true;
            _error = null;
          });
          _initializeApp();
        }
      }
    });

    if (_isSyncing) return const BrandedLoading();

    if (_error != null) {
      return Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, color: Colors.red, size: 48),
                const SizedBox(height: 16),
                const Text(
                  'Initialization Failed',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(_error!, textAlign: TextAlign.center),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () {
                    setState(() {
                      _isSyncing = true;
                      _error = null;
                    });
                    _initializeApp();
                  },
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    FlutterNativeSplash.remove();
    return _needsOnboarding ? const OnboardingScreen() : const AppShellScreen();
  }
}

class BrandedLoading extends StatefulWidget {
  const BrandedLoading({super.key});

  @override
  State<BrandedLoading> createState() => _BrandedLoadingState();
}

class _BrandedLoadingState extends State<BrandedLoading> {
  @override
  void initState() {
    super.initState();
    FlutterNativeSplash.remove();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: Image.asset('assets/logo.png', width: 140, fit: BoxFit.contain),
      ),
    );
  }
}
