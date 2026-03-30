import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../../shared/widgets/text_input_field.dart';
import '../../../../shared/widgets/location_autocomplete.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_radius.dart';
import '../../providers/onboarding_provider.dart';

class LocationJobStep extends ConsumerWidget {
  const LocationJobStep({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(onboardingProvider);
    final jobOptions = ["Student", "Professional", "Freelancer", "Digital Nomad", "Other"];

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Column(
        children: [
          const SizedBox(height: AppSpacing.xl),
          Text(
            "Where are you from?",
            style: AppTextStyles.h1,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            "Help us connect you locally",
            style: AppTextStyles.bodyMedium.copyWith(color: AppColors.mutedForeground),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.xxl),

          // Geoapify-powered Autocomplete
          LocationAutocomplete(
            label: 'Current Location',
            initialValue: state.location,
            onSelect: (result) {
              ref.read(onboardingProvider.notifier).updateLocationJob(loc: result.formatted);
            },
          ),
          const SizedBox(height: AppSpacing.md),

          TextInputField(
            label: 'Nationality',
            hintText: 'e.g. Indian, American...',
            // Using a Key to force rebuild when state updates if necessary, 
            // but controller is managed by the widget for simple parity here
            onChanged: (v) => ref.read(onboardingProvider.notifier).updateLocationJob(nation: v),
          ),
          const SizedBox(height: AppSpacing.md),

          // Job Type Selector mirroring web dropdown style
          Align(
            alignment: Alignment.centerLeft,
            child: Text('What do you do?', style: AppTextStyles.label),
          ),
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
                value: state.jobType,
                isExpanded: true,
                icon: const Icon(LucideIcons.chevronDown, size: 16, color: AppColors.mutedForeground),
                hint: Text(
                  'Select Job Type', 
                  style: AppTextStyles.bodyMedium.copyWith(color: AppColors.mutedForeground),
                ),
                items: jobOptions.map((opt) {
                  return DropdownMenuItem(
                    value: opt,
                    child: Text(opt, style: AppTextStyles.bodyMedium),
                  );
                }).toList(),
                onChanged: (v) => ref.read(onboardingProvider.notifier).updateLocationJob(job: v),
              ),
            ),
          ),

          const SizedBox(height: AppSpacing.xxl),
          PrimaryButton(
            text: 'Continue',
            onPressed: (state.location != null && state.nationality != null && state.jobType != null)
                ? () {
                    if (state.location!.isEmpty || state.nationality!.isEmpty || state.jobType!.isEmpty) {
                       return;
                    }
                    ref.read(onboardingProvider.notifier).setStep(5);
                  }
                : null,
            icon: LucideIcons.chevronRight,
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: () => ref.read(onboardingProvider.notifier).setStep(3),
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
