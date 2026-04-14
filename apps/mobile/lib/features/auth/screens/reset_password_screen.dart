import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../../shared/widgets/text_input_field.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/services/local_storage.dart';
import '../../../core/network/api_client.dart';
import '../../../core/utils/api_error_handler.dart';
import '../services/auth_service.dart';

class ResetPasswordScreen extends ConsumerStatefulWidget {
  final String token;

  const ResetPasswordScreen({super.key, required this.token});

  @override
  ConsumerState<ResetPasswordScreen> createState() =>
      _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends ConsumerState<ResetPasswordScreen> {
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isLoading = false;
  bool _isSuccess = false;

  @override
  void dispose() {
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
      final authService = AuthService(
        ApiClientFactory.create(),
        LocalStorage(),
      );
      await authService.resetPassword(widget.token, newPassword);

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
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.foreground),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
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

                // Auth Card
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 24,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.card,
                    borderRadius: AppRadius.extraLarge,
                    border: Border.all(color: AppColors.border),
                  ),
                  child: _isSuccess ? _buildSuccessState() : _buildFormState(),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFormState() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Create New Password', style: AppTextStyles.h3),
        const SizedBox(height: 4),
        Text(
          'Your new password must be securely strong.',
          style: AppTextStyles.bodyMedium.copyWith(
            color: AppColors.mutedForeground,
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
  }

  Widget _buildSuccessState() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // const Icon(Icons.check, size: 30, color: AppColors.primary),
        // const SizedBox(height: 16),
        Text('Password Reset', style: AppTextStyles.h3),
        const SizedBox(height: 8),
        Text(
          'Your password has been successfully reset. Click below to log in.',
          textAlign: TextAlign.center,
          style: AppTextStyles.bodyMedium.copyWith(
            color: AppColors.mutedForeground,
          ),
        ),
        const SizedBox(height: 16),
        PrimaryButton(
          text: 'Proceed to Login',
          onPressed: () {
            Navigator.of(
              context,
            ).pushNamedAndRemoveUntil('/login', (route) => false);
          },
        ),
      ],
    );
  }
}
