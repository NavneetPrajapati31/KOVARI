import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../../shared/widgets/secondary_button.dart';
import '../../../../shared/widgets/text_input_field.dart';
import '../../../../shared/widgets/location_autocomplete.dart';
import '../../../../shared/widgets/nationality_autocomplete.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../providers/onboarding_provider.dart';

class LocationJobStep extends ConsumerWidget {
  const LocationJobStep({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(onboardingProvider);

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Column(
        children: [
          const SizedBox(height: AppSpacing.sm),
          Text(
            "Where are you from?",
            style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w600),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 6),
          Text(
            "Help us connect you locally",
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.mutedForeground,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.lg),

          // Geoapify-powered Autocomplete
          LocationAutocomplete(
            label: 'Current Location',
            initialValue: state.location,
            onSelect: (result) {
              ref
                  .read(onboardingProvider.notifier)
                  .updateLocationJob(loc: result.formatted, details: result);
            },
          ),
          const SizedBox(height: AppSpacing.md),

          // Searchable Nationality
          NationalityAutocomplete(
            label: 'Nationality',
            initialValue: state.nationality,
            onSelect: (v) => ref
                .read(onboardingProvider.notifier)
                .updateLocationJob(nation: v),
          ),
          const SizedBox(height: AppSpacing.md),

          // Modern Job Type (Free Text as per Web)
          TextInputField(
            label: 'What do you do?',
            initialValue: state.jobType,
            hintText: 'e.g. Software Engineer, Designer...',
            onChanged: (v) =>
                ref.read(onboardingProvider.notifier).updateLocationJob(job: v),
          ),

          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(
                child: SecondaryButton(
                  text: 'Back',
                  icon: LucideIcons.chevronLeft,
                  onPressed: () =>
                      ref.read(onboardingProvider.notifier).setStep(3),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: PrimaryButton(
                  text: 'Continue',
                  onPressed:
                      (state.location != null &&
                          state.nationality != null &&
                          state.jobType != null &&
                          state.location!.isNotEmpty &&
                          state.nationality!.isNotEmpty &&
                          state.jobType!.isNotEmpty)
                      ? () => ref.read(onboardingProvider.notifier).setStep(5)
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
