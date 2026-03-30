import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../../shared/widgets/secondary_button.dart';
import '../../../../shared/widgets/select_field.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/theme/app_spacing.dart';
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
          const SizedBox(height: AppSpacing.sm),
          Text(
            "Lifestyle & Habits",
            style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w600),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 6),
          Text(
            "Final details for better matching",
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.mutedForeground,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.lg),

          SelectField<String>(
            label: 'Religion',
            value: state.religion,
            hintText: 'Select Religion',
            options: const [
              "Christianity",
              "Islam",
              "Hinduism",
              "Buddhism",
              "Judaism",
              "Sikhism",
              "Atheist",
              "Other",
            ],
            itemLabelBuilder: (v) => v,
            onChanged: (v) => ref
                .read(onboardingProvider.notifier)
                .updateLifestyle(religion: v),
          ),
          const SizedBox(height: AppSpacing.md),

          SelectField<String>(
            label: 'Smoking',
            value: state.smoking,
            hintText: 'Select Smoking',
            options: const ["Yes", "No", "Occasionally", "Socially"],
            itemLabelBuilder: (v) => v,
            onChanged: (v) => ref
                .read(onboardingProvider.notifier)
                .updateLifestyle(smoking: v),
          ),
          const SizedBox(height: AppSpacing.md),

          SelectField<String>(
            label: 'Drinking',
            value: state.drinking,
            hintText: 'Select Drinking',
            options: const ["Yes", "No", "Occasionally", "Socially"],
            itemLabelBuilder: (v) => v,
            onChanged: (v) => ref
                .read(onboardingProvider.notifier)
                .updateLifestyle(drinking: v),
          ),
          const SizedBox(height: AppSpacing.md),

          SelectField<String>(
            label: 'Personality',
            value: state.personality,
            hintText: 'Select Personality',
            options: const ["Introvert", "Extrovert", "Ambivert"],
            itemLabelBuilder: (v) => v,
            onChanged: (v) => ref
                .read(onboardingProvider.notifier)
                .updateLifestyle(personality: v),
          ),
          const SizedBox(height: AppSpacing.md),

          SelectField<String>(
            label: 'Food Preference',
            value: state.foodPreference,
            hintText: 'Select Food Preference',
            options: const ["Vegetarian", "Vegan", "Non-vegetarian", "Halal"],
            itemLabelBuilder: (v) => v,
            onChanged: (v) =>
                ref.read(onboardingProvider.notifier).updateLifestyle(food: v),
          ),

          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(
                child: SecondaryButton(
                  text: 'Back',
                  icon: LucideIcons.chevronLeft,
                  onPressed: () =>
                      ref.read(onboardingProvider.notifier).setStep(5),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: PrimaryButton(
                  text: 'Continue',
                  onPressed:
                      (state.religion != null &&
                          state.smoking != null &&
                          state.personality != null)
                      ? () => ref.read(onboardingProvider.notifier).setStep(7)
                      : null,
                  icon: LucideIcons.chevronRight,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
        ],
      ),
    );
  }
}
