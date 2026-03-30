import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:flutter/material.dart';
import '../../auth/services/auth_service.dart';
import '../../../services/api/api_client.dart';
import '../../../services/storage/local_storage.dart';
import '../../auth/screens/login_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authState = ClerkAuth.of(context);
    final authService = AuthService(
      ApiClientFactory.create(), 
      LocalStorage(),
      authState,
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text('KOVARI'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await authService.logout();
              if (context.mounted) {
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
              }
            },
          ),
        ],
      ),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.check_circle_outline, color: Colors.green, size: 64),
            SizedBox(height: 24),
            Text(
              'Session Verified!',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 8),
            Text(
              'Your Clerk and Supabase accounts are synced.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }
}
