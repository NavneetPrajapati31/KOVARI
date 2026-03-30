import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../../../core/services/local_storage.dart';
import '../../../core/network/api_client.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 48.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text(
                  'KOVARI',
                  style: TextStyle(
                    fontSize: 36,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 8,
                    color: Colors.black,
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.black,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 64),
                const Text(
                  'Welcome to the future of identity.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 48),
                // Clerk authentication provides the sign-in/up UI components
                const SizedBox(
                  width: double.infinity,
                  child: ClerkAuthentication(),
                ),
                const SizedBox(height: 32),
                const Text(
                  'Securely powered by Clerk',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.black26,
                    fontStyle: FontStyle.italic,
                  ),
                ),
                const SizedBox(height: 32),
                ElevatedButton(
                  onPressed: () async {
                    // TEMP TEST (IMPORTANT)
                    // 1. Simulate login (mock Clerk for now)
                    final authState = ClerkAuth.of(context, listen: false);
                    final String clerkUserId = authState.user?.id ?? 'mock_clerk_id_from_temp_tester_123';
                    
                    final authService = AuthService(
                      ApiClientFactory.create(),
                      LocalStorage(),
                      authState,
                    );
                    
                    try {
                      debugPrint('--- DAY-1 TEST FLOW ---');
                      debugPrint('clerkUserId: $clerkUserId');
                      
                      // 3. Call syncUser() & 4. Get UUID
                      final uuid = await authService.syncUser(clerkUserId);
                      
                      // 5. Save UUID + clerkId
                      await LocalStorage.saveUserIds(clerkUserId, uuid);
                      
                      // 6. Print it
                      debugPrint('Sync Success! Saved uuid: $uuid && clerkUserId: $clerkUserId');
                      debugPrint('-----------------------');
                      
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Flow Tested! UUID: $uuid')));
                      }
                    } catch (e) {
                       debugPrint('Test Flow Error: $e');
                       if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                      }
                    }
                  },
                  child: const Text('TEMP TEST: SYNC USER'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
