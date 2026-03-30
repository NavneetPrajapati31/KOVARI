import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../providers/onboarding_provider.dart';

class PolicyStep extends ConsumerWidget {
  const PolicyStep({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(onboardingProvider);

    return Padding(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        children: [
          const SizedBox(height: AppSpacing.xl),
          const Icon(LucideIcons.circleCheckBig, size: 64, color: AppColors.accent),
          const SizedBox(height: AppSpacing.lg),
          Text(
            "Almost there!",
            style: AppTextStyles.h1,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            "Please review and accept our policies to join the community.",
            style: AppTextStyles.bodyMedium.copyWith(color: AppColors.mutedForeground),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.xxl),

          AppCard(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              children: [
                _buildPolicyItem(
                  context: context,
                  title: 'Terms of Service',
                  onTap: () {}, // Future: Open policies link
                ),
                const Divider(height: 24, color: AppColors.border),
                _buildPolicyItem(
                  context: context,
                  title: 'Privacy Policy',
                  onTap: () {}, 
                ),
                const Divider(height: 24, color: AppColors.border),
                _buildPolicyItem(
                  context: context,
                  title: 'Community Guidelines',
                  onTap: () {},
                ),
              ],
            ),
          ),
          
          const Spacer(),
          
          Row(
            children: [
              Checkbox(
                value: state.policyAccepted,
                onChanged: (v) => ref.read(onboardingProvider.notifier).setPolicyAccepted(v ?? false),
                activeColor: AppColors.primary,
              ),
              Expanded(
                child: Text(
                  'I agree to all terms and policies mentioned above.',
                  style: AppTextStyles.bodySmall.copyWith(color: AppColors.foreground),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          PrimaryButton(
            text: 'Complete Profile',
            isLoading: state.isSubmitting,
            onPressed: state.policyAccepted
                ? () async {
                    final success = await ref.read(onboardingProvider.notifier).submit();
                    if (success && context.mounted) {
                      // Final success state (Step 8 equivalent in web)
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Profile completed successfully!'),
                          backgroundColor: AppColors.accent,
                        ),
                      );
                      // In a real app, navigate to home
                    } else if (state.errorMessage != null && context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(state.errorMessage!),
                          backgroundColor: AppColors.destructive,
                        ),
                      );
                    }
                  }
                : null,
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: () => ref.read(onboardingProvider.notifier).setStep(6),
            child: Text(
              'Back',
              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.mutedForeground),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPolicyItem({
    required BuildContext context,
    required String title,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w500)),
          const Icon(LucideIcons.chevronRight, size: 16, color: AppColors.mutedForeground),
        ],
      ),
    );
  }
}
