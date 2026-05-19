import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/navigation/routes.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/theme/app_text_styles.dart';
import 'package:mobile/core/utils/api_error_handler.dart';
import 'package:mobile/features/auth/services/auth_service.dart';
import 'package:mobile/shared/widgets/app_card.dart';
import 'package:mobile/shared/widgets/primary_button.dart';
import 'package:mobile/shared/widgets/text_input_field.dart';

class ResetPasswordScreen extends ConsumerStatefulWidget {

  const ResetPasswordScreen({super.key, required this.token});
  final String token;

  @override
  ConsumerState<ResetPasswordScreen> createState() =>
      _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends ConsumerState<ResetPasswordScreen> {
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isLoading = false;
  bool _isSuccess = false;
  final _cancelToken = CancelToken();

  @override
  void dispose() {
    _cancelToken.cancel('ResetPasswordScreen disposed');
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleReset() async {
    final newPassword = _passwordController.text;
    final confirmPassword = _confirmPasswordController.text;

    if (newPassword.isEmpty || confirmPassword.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Please fill all fields')));
      return;
    }

    if (newPassword != confirmPassword) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Passwords do not match')));
      return;
    }

    if (newPassword.length < 8) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Password must be at least 8 characters')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final authService = ref.read(authServiceProvider);
      await authService.resetPassword(
        widget.token,
        newPassword,
        cancelToken: _cancelToken,
      );

      if (mounted) {
        setState(() {
          _isLoading = false;
          _isSuccess = true;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(ApiErrorHandler.extractError(e)),
            backgroundColor: AppColors.destructive,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: AppColors.text(context)),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 24),
            child: Column(
              children: [
                // Logo
                // Image.asset(
                //   'assets/logo.webp',
                //   height: 20,
                //   fit: BoxFit.contain,
                //   errorBuilder: (context, error, stackTrace) => Text(
                //     'KOVARI',
                //     style: AppTextStyles.h1.copyWith(
                //       letterSpacing: 4,
                //       fontSize: 28,
                //     ),
                //   ),
                // ),
                // const SizedBox(height: 32),
                AppCard(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 24,
                  ),
                  child: _isSuccess ? _buildSuccessState() : _buildFormState(),
                ),
              ],
            ),
          ),
        ),
      ),
    );

  Widget _buildFormState() => Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Create New Password', style: AppTextStyles.h3),
        const SizedBox(height: 4),
        Text(
          'Your new password must be securely strong.',
          style: AppTextStyles.bodyMedium.copyWith(
            color: AppColors.text(context, isMuted: true),
          ),
        ),
        const SizedBox(height: 24),

        TextInputField(
          label: 'New Password',
          controller: _passwordController,
          hintText: 'Minimum 8 characters',
          obscureText: true,
        ),
        const SizedBox(height: 16),
        TextInputField(
          label: 'Confirm Password',
          controller: _confirmPasswordController,
          hintText: 'Retype new password',
          obscureText: true,
        ),

        const SizedBox(height: 16),

        PrimaryButton(
          text: _isLoading ? 'Resetting...' : 'Reset Password',
          onPressed: _isLoading ? null : _handleReset,
          isLoading: _isLoading,
        ),
      ],
    );

  Widget _buildSuccessState() => Column(
      children: [
        // const Icon(Icons.check, size: 30, color: AppColors.primary),
        // const SizedBox(height: 16),
        Text('Password Reset', style: AppTextStyles.h3),
        const SizedBox(height: 8),
        Text(
          'Your password has been successfully reset. Click below to log in.',
          textAlign: TextAlign.center,
          style: AppTextStyles.bodyMedium.copyWith(
            color: AppColors.text(context, isMuted: true),
          ),
        ),
        const SizedBox(height: 16),
        PrimaryButton(
          text: 'Proceed to Login',
          onPressed: () {
            const LoginRouteData().go(context);
          },
        ),
      ],
    );
}
