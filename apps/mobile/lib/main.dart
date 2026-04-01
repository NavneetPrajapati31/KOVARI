import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/home/screens/home_screen.dart';
import 'features/onboarding/screens/onboarding_screen.dart';
import 'features/auth/services/auth_service.dart';
import 'core/network/api_client.dart';
import 'core/services/local_storage.dart';
import 'core/theme/app_colors.dart';
import 'features/onboarding/data/profile_service.dart';
import 'dart:async';
import 'package:app_links/app_links.dart';
import 'core/config/routes.dart';
import 'features/auth/screens/reset_password_screen.dart';
// KovariUser import removed as it is now managed via authStateProvider
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'core/config/env.dart';

import 'core/providers/auth_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Load environment variables
  const envFile = String.fromEnvironment(
    'ENV_FILE',
    defaultValue: '.env.development',
  );
  await dotenv.load(fileName: envFile);
  Env.validate();

  // Initialize Google Sign In (Required for 7.x+)
  try {
    await GoogleSignIn.instance.initialize(
      clientId: Env.googleClientId, // fixes Chrome error
      serverClientId: kIsWeb ? null : Env.googleClientId,
    );
  } catch (e) {
    debugPrint('Google Sign-In initialization failed or unsupported: $e');
  }

  runApp(const ProviderScope(child: KovariApp()));
}

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

class KovariApp extends StatefulWidget {
  const KovariApp({super.key});

  @override
  State<KovariApp> createState() => _KovariAppState();
}

class _KovariAppState extends State<KovariApp> {
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

    _linkSubscription = _appLinks.uriLinkStream.listen((uri) {
      _handleDeepLink(uri);
    });

    _appLinks.getInitialLink().then((uri) {
      if (uri != null) {
        _handleDeepLink(uri);
      }
    });
  }

  void _handleDeepLink(Uri uri) {
    debugPrint('🔗 Deep Link received: $uri');
    
    // Support both HTTPS (Universal Links) and Custom Scheme (Fallback)
    bool isResetPath = uri.path.contains('forgot-password') || 
                      uri.host == 'reset-password';
    
    String? token = uri.queryParameters['token'];

    if (isResetPath && token != null) {
      // Delay navigation to let the app route system/MaterialApp mount first
      Future.delayed(const Duration(milliseconds: 500), () {
        if (navigatorKey.currentState != null) {
          navigatorKey.currentState?.push(
            MaterialPageRoute(
              builder: (context) => ResetPasswordScreen(token: token),
            ),
          );
        } else {
          debugPrint('❌ Navigator is not ready for deep link navigation');
        }
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
  bool _checkedStatus = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkAuth();
    });
  }

  Future<void> _checkAuth() async {
    try {
      final storage = LocalStorage();
      final apiClient = ApiClientFactory.create();

      // Wire up global logout listener (Case 10: Force Logout)
      apiClient.setOnLogout(() {
        if (mounted) {
          ref.read(authStateProvider.notifier).state = null;
        }
      });

      final authService = AuthService(apiClient, storage);
      final user = await authService.checkSession();

      if (mounted) {
        ref.read(authStateProvider.notifier).state = user;
        setState(() {
          _checkedStatus = true;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _checkedStatus = true;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_checkedStatus) return const BrandedLoading();

    final user = ref.watch(authStateProvider);

    // If no user/session exists, go to LoginScreen
    if (user == null) return const LoginScreen();

    // If session exists, let AuthHandler handle profile/onboarding logic
    return const AuthHandler();
  }
}

class BrandedLoading extends StatelessWidget {
  const BrandedLoading({super.key});

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

class SimpleLoading extends StatelessWidget {
  const SimpleLoading({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: SizedBox(
          width: 24,
          height: 24,
          child: CircularProgressIndicator(
            color: AppColors.primary,
            strokeWidth: 3, // Slightly thinner for the smaller size
          ),
        ),
      ),
    );
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
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initializeApp();
    });
  }

  Future<void> _initializeApp() async {
    try {
      final apiClient = ApiClientFactory.create();

      // Since checkSession already set the token in main() or AuthWrapper,
      // we just need to verify the profile.
      final profileService = ProfileService(apiClient);
      final profile = await profileService.getCurrentProfile();

      if (mounted) {
        setState(() {
          _isSyncing = false;
          _needsOnboarding = profile == null;
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
    if (_isSyncing) {
      return const SimpleLoading();
    }

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

    return _needsOnboarding ? const OnboardingScreen() : const HomeScreen();
  }
}
