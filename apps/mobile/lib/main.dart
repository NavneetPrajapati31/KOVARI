import 'package:flutter/material.dart';
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
import 'core/config/routes.dart';
import 'shared/models/kovari_user.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'core/config/env.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Load environment variables
  const envFile = String.fromEnvironment('ENV_FILE', defaultValue: '.env.development');
  await dotenv.load(fileName: envFile);
  Env.validate();

  // Initialize Google Sign In (Required for 7.x+)
  await GoogleSignIn.instance.initialize(serverClientId: Env.googleClientId);

  final storage = LocalStorage();
  final apiClient = ApiClientFactory.create();

  // Initial token injection from secure storage
  final token = await storage.getAccessToken();
  if (token != null) {
    apiClient.setToken(token);
  }

  runApp(const ProviderScope(child: KovariApp()));
}

class KovariApp extends StatelessWidget {
  const KovariApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'KOVARI',
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.light,
      theme: AppTheme.lightTheme,
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
  KovariUser? _user;

  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    try {
      final storage = LocalStorage();
      final apiClient = ApiClientFactory.create();
      final authService = AuthService(apiClient, storage);

      final user = await authService.checkSession();

      if (mounted) {
        setState(() {
          _user = user;
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

    // If no user/session exists, go to LoginScreen
    if (_user == null) return const LoginScreen();

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
        child: Image.asset('assets/logo.png', width: 80, fit: BoxFit.contain),
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
      return const BrandedLoading();
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
