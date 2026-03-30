import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:flutter/material.dart';

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
              ],
            ),
          ),
        ),
      ),
    );
  }
}
