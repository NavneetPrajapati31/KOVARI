import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../shared/widgets/primary_button.dart';

class SuccessStep extends ConsumerWidget {
  const SuccessStep({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: AppSpacing.md),
          // Success Checkmark Circle
          Container(
            width: 64,
            height: 64,
            decoration: const BoxDecoration(
              color: AppColors.primary,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.check_rounded,
              size: 28,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          Text(
            "Welcome aboard! 🎉",
            style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w600),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            "Your profile has been successfully created. You're all set to get started!",
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.mutedForeground,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.xl),
          PrimaryButton(
            text: 'Get Started',
            onPressed: () {
              // Future: Navigate to Dashboard
              Navigator.of(context).pushReplacementNamed('/dashboard');
            },
          ),
          const SizedBox(height: AppSpacing.lg),
        ],
      ),
    );
  }
}
