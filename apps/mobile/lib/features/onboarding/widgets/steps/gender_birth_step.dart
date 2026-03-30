import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:intl/intl.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../../shared/widgets/secondary_button.dart';
import '../../../../shared/widgets/select_field.dart';
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
          const SizedBox(height: AppSpacing.sm),
          Text(
            "About you",
            style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w600),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 6),
          Text(
            "Select your gender and date of birth",
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.mutedForeground,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.lg),

          // Modern Gender Dropdown Selection
          SelectField<String>(
            label: 'Gender',
            value: state.gender,
            hintText: 'Select gender',
            options: genderOptions,
            itemLabelBuilder: (v) => v,
            onChanged: (v) => ref
                .read(onboardingProvider.notifier)
                .updateGenderBirth(gender: v),
          ),
          const SizedBox(height: AppSpacing.md),

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
                initialDate:
                    state.birthday ??
                    DateTime.now().subtract(const Duration(days: 365 * 18)),
                firstDate: DateTime(1900),
                lastDate: DateTime.now(),
                builder: (context, child) {
                  return Theme(
                    data: Theme.of(context).copyWith(
                      colorScheme: const ColorScheme.light(
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
                ref
                    .read(onboardingProvider.notifier)
                    .updateGenderBirth(birthday: picked);
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
                    state.birthday == null
                        ? 'Select Date'
                        : DateFormat('dd MMM yyyy').format(state.birthday!),
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: state.birthday == null
                          ? AppColors.mutedForeground
                          : AppColors.foreground,
                    ),
                  ),
                  const Icon(
                    LucideIcons.calendar,
                    size: 18,
                    color: AppColors.mutedForeground,
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(
                child: SecondaryButton(
                  text: 'Back',
                  icon: LucideIcons.chevronLeft,
                  onPressed: () =>
                      ref.read(onboardingProvider.notifier).setStep(2),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: PrimaryButton(
                  text: 'Continue',
                  onPressed: (state.gender != null && state.birthday != null)
                      ? () {
                          final today = DateTime.now();
                          var age = today.year - state.birthday!.year;
                          if (today.month < state.birthday!.month ||
                              (today.month == state.birthday!.month &&
                                  today.day < state.birthday!.day)) {
                            age--;
                          }
                          if (age < 18) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                  'You must be at least 18 years old',
                                ),
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
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
        ],
      ),
    );
  }
}
