import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:intl/intl.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_radius.dart';
import '../../providers/onboarding_provider.dart';

class GenderBirthStep extends ConsumerWidget {
  const GenderBirthStep({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(onboardingProvider);
    final genderOptions = ["Male", "Female", "Other", "Prefer not to say"];

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Column(
        children: [
          const SizedBox(height: AppSpacing.xl),
          Text(
            "About you",
            style: AppTextStyles.h1,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            "Select your gender and date of birth",
            style: AppTextStyles.bodyMedium.copyWith(color: AppColors.mutedForeground),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.xxl),

          // Gender Selection with parity formatting
          Align(
            alignment: Alignment.centerLeft,
            child: Text('Gender', style: AppTextStyles.label),
          ),
          const SizedBox(height: 8),
          Column(
            children: genderOptions.map((opt) {
              final isSelected = state.gender == opt;
              return Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: InkWell(
                  onTap: () => ref.read(onboardingProvider.notifier).updateGenderBirth(gender: opt),
                  borderRadius: AppRadius.defaultRadius,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: isSelected ? AppColors.primaryLight : Colors.white,
                      borderRadius: AppRadius.defaultRadius,
                      border: Border.all(
                        color: isSelected ? AppColors.primary : AppColors.border,
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          opt,
                          style: AppTextStyles.bodyMedium.copyWith(
                            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                            color: isSelected ? AppColors.primary : AppColors.foreground,
                          ),
                        ),
                        if (isSelected) const Icon(LucideIcons.check, size: 16, color: AppColors.primary),
                      ],
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: AppSpacing.lg),

          // Birthday Selection mirroring web date picker
          Align(
            alignment: Alignment.centerLeft,
            child: Text('Birthday', style: AppTextStyles.label),
          ),
          const SizedBox(height: 8),
          InkWell(
            onTap: () async {
              final picked = await showDatePicker(
                context: context,
                initialDate: state.birthday ?? DateTime.now().subtract(const Duration(days: 365 * 18)),
                firstDate: DateTime(1900),
                lastDate: DateTime.now(),
                builder: (context, child) {
                  return Theme(
                    data: Theme.of(context).copyWith(
                      colorScheme: ColorScheme.light(
                        primary: AppColors.primary,
                        onPrimary: Colors.white,
                        onSurface: AppColors.foreground,
                      ),
                    ),
                    child: child!,
                  );
                },
              );
              if (picked != null) {
                ref.read(onboardingProvider.notifier).updateGenderBirth(birthday: picked);
              }
            },
            borderRadius: AppRadius.defaultRadius,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: AppRadius.defaultRadius,
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    state.birthday == null ? 'Select Date' : DateFormat('dd MMM yyyy').format(state.birthday!),
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: state.birthday == null ? AppColors.mutedForeground : AppColors.foreground,
                    ),
                  ),
                  const Icon(LucideIcons.calendar, size: 18, color: AppColors.mutedForeground),
                ],
              ),
            ),
          ),

          const SizedBox(height: AppSpacing.xxl),
          PrimaryButton(
            text: 'Continue',
            onPressed: (state.gender != null && state.birthday != null)
                ? () {
                    final today = DateTime.now();
                    var age = today.year - state.birthday!.year;
                    if (today.month < state.birthday!.month || (today.month == state.birthday!.month && today.day < state.birthday!.day)) {
                      age--;
                    }
                    if (age < 18) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('You must be at least 18 years old'),
                          backgroundColor: AppColors.destructive,
                        ),
                      );
                      return;
                    }
                    ref.read(onboardingProvider.notifier).setStep(4);
                  }
                : null,
            icon: LucideIcons.chevronRight,
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: () => ref.read(onboardingProvider.notifier).setStep(2),
            child: Text(
              'Back',
              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.mutedForeground),
            ),
          ),
        ],
      ),
    );
  }
}
