import 'package:flutter/material.dart';

class OnboardingScreen extends StatelessWidget {
  const OnboardingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'KOVARI',
              style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                    letterSpacing: 4,
                    fontWeight: FontWeight.w900,
                  ),
            ),
            const SizedBox(height: 16),
            Text(
              'Social SaaS for the Future',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
      ),
    );
  }
}
