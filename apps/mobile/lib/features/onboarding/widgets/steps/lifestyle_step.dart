import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_radius.dart';
import '../../providers/onboarding_provider.dart';

class LifestyleStep extends ConsumerWidget {
  const LifestyleStep({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(onboardingProvider);

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Column(
        children: [
          const SizedBox(height: AppSpacing.xl),
          Text(
            "Lifestyle & Habits",
            style: AppTextStyles.h1,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            "Final details for better matching",
            style: AppTextStyles.bodyMedium.copyWith(color: AppColors.mutedForeground),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.xxl),

          _buildSelect(
            label: 'Religion',
            value: state.religion,
            options: ["Christianity", "Islam", "Hinduism", "Buddhism", "Judaism", "Sikhism", "Atheist", "Other"],
            onChanged: (v) => ref.read(onboardingProvider.notifier).updateLifestyle(religion: v),
          ),
          const SizedBox(height: AppSpacing.md),

          _buildSelect(
            label: 'Smoking',
            value: state.smoking,
            options: ["Yes", "No", "Occasionally", "Socially"],
            onChanged: (v) => ref.read(onboardingProvider.notifier).updateLifestyle(smoking: v),
          ),
          const SizedBox(height: AppSpacing.md),

          _buildSelect(
            label: 'Drinking',
            value: state.drinking,
            options: ["Yes", "No", "Occasionally", "Socially"],
            onChanged: (v) => ref.read(onboardingProvider.notifier).updateLifestyle(drinking: v),
          ),
          const SizedBox(height: AppSpacing.md),

          _buildSelect(
            label: 'Personality',
            value: state.personality,
            options: ["Introvert", "Extrovert", "Ambivert"],
            onChanged: (v) => ref.read(onboardingProvider.notifier).updateLifestyle(personality: v),
          ),
          const SizedBox(height: AppSpacing.md),

          _buildSelect(
            label: 'Food Preference',
            value: state.foodPreference,
            options: ["Vegetarian", "Vegan", "Non-vegetarian", "Halal"],
            onChanged: (v) => ref.read(onboardingProvider.notifier).updateLifestyle(food: v),
          ),

          const SizedBox(height: AppSpacing.xxl),
          PrimaryButton(
            text: 'Continue',
            onPressed: (state.religion != null && state.smoking != null && state.personality != null)
                ? () => ref.read(onboardingProvider.notifier).setStep(7)
                : null,
            icon: LucideIcons.chevronRight,
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: () => ref.read(onboardingProvider.notifier).setStep(5),
            child: Text(
              'Back',
              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.mutedForeground),
            ),
          ),
           const SizedBox(height: AppSpacing.xxl),
        ],
      ),
    );
  }

  Widget _buildSelect({
    required String label,
    required String? value,
    required List<String> options,
    required ValueChanged<String> onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTextStyles.label),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          height: 48,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: AppRadius.defaultRadius,
            border: Border.all(color: AppColors.border),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: value,
              isExpanded: true,
              icon: const Icon(LucideIcons.chevronDown, size: 16, color: AppColors.mutedForeground),
              hint: Text(
                'Select $label', 
                style: AppTextStyles.bodyMedium.copyWith(color: AppColors.mutedForeground),
              ),
              items: options.map((opt) {
                return DropdownMenuItem(
                  value: opt,
                  child: Text(opt, style: AppTextStyles.bodyMedium),
                );
              }).toList(),
              onChanged: (v) {
                if (v != null) onChanged(v);
              },
            ),
          ),
        ),
      ],
    );
  }
}
