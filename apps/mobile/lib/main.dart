import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:flutter/material.dart';
import 'core/config/env.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/home/screens/home_screen.dart';
import 'features/auth/services/auth_service.dart';
import 'services/api/api_client.dart';
import 'services/storage/local_storage.dart';

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
    ClerkAuth(
      config: ClerkAuthConfig(publishableKey: Env.clerkPublishableKey),
      child: const KovariApp(),
    ),
  );
}

class KovariApp extends StatelessWidget {
  const KovariApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'KOVARI',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: ClerkAuthBuilder(
        signedInBuilder: (context, authState) {
          return const AuthHandler();
        },
        signedOutBuilder: (context, authState) {
          return const LoginScreen();
        },
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
      await authService.syncUser();

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
      return const Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(color: Colors.black),
              SizedBox(height: 24),
              Text(
                'Synchronizing KOVARI Profile...',
                style: TextStyle(
                  fontWeight: FontWeight.w500,
                  color: Colors.grey,
                ),
              ),
            ],
          ),
        ),
      );
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
