import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:flutter/material.dart';
import 'core/config/env.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/home/screens/home_screen.dart';
import 'features/auth/services/auth_service.dart';
import 'core/network/api_client.dart';
import 'core/services/local_storage.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/app_colors.dart';
import 'core/config/routes.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final storage = LocalStorage();
  final apiClient = ApiClientFactory.create();

  // Initial token injection from secure storage
  final token = await storage.getToken();
  if (token != null) {
    apiClient.setToken(token);
  }

  runApp(
    ProviderScope(
      child: MaterialApp(
        title: 'KOVARI',
        debugShowCheckedModeBanner: false,
        themeMode: ThemeMode.light,
        theme: AppTheme.lightTheme,
        routes: AppRoutes.routes,
        home: ClerkAuth(
          config: ClerkAuthConfig(publishableKey: Env.clerkPublishableKey),
          child: const KovariApp(),
        ),
      ),
    ),
  );
}

class KovariApp extends StatelessWidget {
  const KovariApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        const BrandedLoading(),
        Theme(
          data: Theme.of(context).copyWith(
            progressIndicatorTheme: const ProgressIndicatorThemeData(
              color: Colors.transparent,
            ),
          ),
          child: ClerkAuthBuilder(
            signedInBuilder: (context, authState) => const AuthHandler(),
            signedOutBuilder: (context, authState) => const LoginScreen(),
          ),
        ),
      ],
    );
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

class AuthHandler extends StatefulWidget {
  const AuthHandler({super.key});

  @override
  State<AuthHandler> createState() => _AuthHandlerState();
}

class _AuthHandlerState extends State<AuthHandler> {
  bool _isSyncing = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    // Synchronization must happen after the first frame to ensure context is valid
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initializeApp();
    });
  }

  Future<void> _initializeApp() async {
    try {
      final authState = ClerkAuth.of(context, listen: false);
      final authService = AuthService(
        ApiClientFactory.create(),
        LocalStorage(),
        authState,
      );

      // Step 1: Ensure ApiClient has the latest Clerk token
      await authService.refreshSessionToken();

      // Step 2: Critical Sync (ensure backend knows this user)
      await authService.legacySyncUser();

      if (mounted) {
        setState(() => _isSyncing = false);
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
                  'Sync Failed',
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
                  child: const Text('Retry Synchronization'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return const HomeScreen();
  }
}
