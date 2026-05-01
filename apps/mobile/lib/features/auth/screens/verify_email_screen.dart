import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/providers/auth_provider.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../../shared/widgets/text_input_field.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/services/local_storage.dart';
import '../../../core/network/api_client.dart';
import '../../../core/utils/api_error_handler.dart';
import '../services/auth_service.dart';
import 'package:dio/dio.dart';

class VerifyEmailScreen extends ConsumerStatefulWidget {
  final String email;

  const VerifyEmailScreen({super.key, required this.email});

  @override
  ConsumerState<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends ConsumerState<VerifyEmailScreen> {
  final _codeController = TextEditingController();
  bool _isLoading = false;
  String? _successMessage;
  int _resendCooldown = 60;
  Timer? _cooldownTimer;
  final _cancelToken = CancelToken();

  @override
  void initState() {
    super.initState();
    _startCooldownTimer();
  }

  void _startCooldownTimer() {
    _resendCooldown = 60;
    _cooldownTimer?.cancel();
    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_resendCooldown > 0) {
        setState(() => _resendCooldown--);
      } else {
        _cooldownTimer?.cancel();
      }
    });
  }

  @override
  void dispose() {
    _cancelToken.cancel('VerifyEmailScreen disposed');
    _codeController.dispose();
    _cooldownTimer?.cancel();
    super.dispose();
  }

  Future<void> _handleVerify() async {
    final code = _codeController.text.trim();

    if (code.length != 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter the 6-digit code')),
      );
      return;
    }

    setState(() {
      _isLoading = true;
      _successMessage = null;
    });

    try {
      final authService = ref.read(authServiceProvider);
      final user = await authService.verifyOtp(widget.email, code, cancelToken: _cancelToken);

      if (mounted) {
        ref.read(authProvider.notifier).setUser(user);
        // Navigator logic is handled by authProvider listener in main.dart or AuthWrapper
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

  Future<void> _handleResend() async {
    setState(() {
      _isLoading = true;
      _successMessage = null;
    });

    try {
      final authService = ref.read(authServiceProvider);
      await authService.resendOtp(widget.email, cancelToken: _cancelToken);

      if (mounted) {
        setState(() {
          _isLoading = false;
          _successMessage = "Verification code resent!";
        });
        _startCooldownTimer();
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
            padding: const EdgeInsets.symmetric(horizontal: 18),
            child: Column(
              children: [
                // Auth Card (Web Parity)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 32,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.card,
                    borderRadius: AppRadius.extraLarge,
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    children: [
                      // Mail Icon
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.mail_outline,
                          color: AppColors.primary,
                          size: 24,
                        ),
                      ),
                      const SizedBox(height: 24),

                      Text('Verify your email', style: AppTextStyles.h3),
                      const SizedBox(height: 8),
                      Text(
                        "We've sent a 6-digit code to ${widget.email}. Please enter it below.",
                        textAlign: TextAlign.center,
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: AppColors.mutedForeground,
                        ),
                      ),
                      const SizedBox(height: 32),

                      if (_successMessage != null) ...[
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.green.withValues(alpha: 0.1),
                            borderRadius: AppRadius.medium,
                            border: Border.all(
                              color: Colors.green.withValues(alpha: 0.2),
                            ),
                          ),
                          child: Text(
                            _successMessage!,
                            style: AppTextStyles.bodySmall.copyWith(
                              color: Colors.green,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                        const SizedBox(height: 20),
                      ],

                      TextInputField(
                        label: 'Verification Code',
                        controller: _codeController,
                        hintText: 'Enter 6-digit code',
                        keyboardType: TextInputType.number,
                        maxLength: 6,
                      ),
                      const SizedBox(height: 12),

                      PrimaryButton(
                        text: _isLoading ? 'Verifying...' : 'Verify Email',
                        onPressed: _isLoading ? null : _handleVerify,
                        isLoading: _isLoading,
                      ),

                      const SizedBox(height: 24),

                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            "Didn't receive the code? ",
                            style: AppTextStyles.bodySmall.copyWith(
                              color: AppColors.mutedForeground,
                            ),
                          ),
                          TextButton(
                            onPressed: (_isLoading || _resendCooldown > 0)
                                ? null
                                : _handleResend,
                            style: TextButton.styleFrom(
                              padding: EdgeInsets.zero,
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                            child: Text(
                              _resendCooldown > 0
                                  ? 'Resend in ${_resendCooldown}s'
                                  : 'Resend',
                              style: AppTextStyles.bodySmall.copyWith(
                                color: (_isLoading || _resendCooldown > 0)
                                    ? AppColors.mutedForeground
                                    : AppColors.primary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
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
