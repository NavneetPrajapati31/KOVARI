import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/navigation/routes.dart';
import 'package:mobile/core/providers/auth_provider.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/theme/app_text_styles.dart';
import 'package:mobile/core/utils/api_error_handler.dart';
import 'package:mobile/features/auth/services/auth_service.dart';
import 'package:mobile/shared/widgets/app_card.dart';
import 'package:mobile/shared/widgets/auth_divider.dart';
import 'package:mobile/shared/widgets/auth_social_button.dart';
import 'package:mobile/shared/widgets/kovari_snackbar.dart';
import 'package:mobile/shared/widgets/primary_button.dart';
import 'package:mobile/shared/widgets/text_input_field.dart';

class SignUpScreen extends ConsumerStatefulWidget {
  const SignUpScreen({super.key});

  @override
  ConsumerState<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends ConsumerState<SignUpScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isLoading = false;
  final _cancelToken = CancelToken();

  @override
  void dispose() {
    _cancelToken.cancel('SignUpScreen disposed');
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleSignUp() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      KovariSnackbar.info(context, 'Please enter email and password');
      return;
    }

    if (password != _confirmPasswordController.text) {
      KovariSnackbar.error(context, "Passwords don't match");
      return;
    }

    setState(() => _isLoading = true);

    try {
      final authService = ref.read(authServiceProvider);
      final result = await authService.registerWithEmail(
        email,
        password,
        cancelToken: _cancelToken,
      );

      if (mounted) {
        if (result['verificationRequired'] == true) {
          setState(() => _isLoading = false);
          VerifyEmailRouteData(email: email).go(context);
        } else {
          final user = authService.parseAuthResponse(result);
          ref.read(authProvider.notifier).setUser(user);
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        KovariSnackbar.error(context, ApiErrorHandler.extractError(e));
      }
    }
  }

  Future<void> _handleGoogleLogin() async {
    setState(() => _isLoading = true);

    try {
      final authService = ref.read(authServiceProvider);
      final user = await authService.loginWithGoogle(cancelToken: _cancelToken);

      if (mounted) {
        ref.read(authProvider.notifier).setUser(user);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        KovariSnackbar.error(context, ApiErrorHandler.extractError(e));
      }
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
      backgroundColor: AppColors.backgroundColor(context),
      body: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Container(
          width: double.infinity,
          constraints: BoxConstraints(
            minHeight: MediaQuery.of(context).size.height,
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo
                  Image.asset(
                    Theme.of(context).brightness == Brightness.dark
                        ? 'assets/logo_dark.webp'
                        : 'assets/logo.webp',
                    height: 20,
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) => Text(
                      'KOVARI',
                      style: AppTextStyles.h1.copyWith(
                        letterSpacing: 4,
                        fontSize: 28,
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Auth Card
                  AppCard(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 24,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Join Kovari',
                          style: AppTextStyles.h3.copyWith(
                            color: AppColors.text(context),
                          ),
                        ),
                        // const SizedBox(height: 4),
                        Text(
                          'Create your account to get started',
                          style: AppTextStyles.bodyMedium.copyWith(
                            color: AppColors.text(context, isMuted: true),
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Social Buttons
                        AuthSocialButton(
                          text: 'Continue with Google',
                          icon: Image.asset(
                            'assets/google_logo.png',
                            height: 16,
                            width: 16,
                          ),
                          onPressed: _isLoading ? null : _handleGoogleLogin,
                        ),

                        const AuthDivider(),

                        // Form
                        TextInputField(
                          label: 'Email',
                          controller: _emailController,
                          hintText: 'example@example.com',
                          keyboardType: TextInputType.emailAddress,
                          height: 40,
                        ),
                        const SizedBox(height: 16),
                        TextInputField(
                          label: 'Password',
                          controller: _passwordController,
                          hintText: 'Enter password',
                          obscureText: true,
                          height: 40,
                        ),
                        const SizedBox(height: 16),
                        TextInputField(
                          label: 'Confirm Password',
                          controller: _confirmPasswordController,
                          hintText: 'Confirm password',
                          obscureText: true,
                          height: 40,
                        ),

                        const SizedBox(height: 20),

                        // Submit
                        PrimaryButton(
                          text: _isLoading
                              ? 'Creating account...'
                              : 'Create account',
                          onPressed: _isLoading ? null : _handleSignUp,
                          isLoading: _isLoading,
                          height: 40,
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Footer Toggle
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Already have an account? ',
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.text(context, isMuted: true),
                        ),
                      ),
                      TextButton(
                        onPressed: () => const LoginRouteData().go(context),
                        style: TextButton.styleFrom(
                          padding: EdgeInsets.zero,
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: Text(
                          'Log in',
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.text(context),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
}
