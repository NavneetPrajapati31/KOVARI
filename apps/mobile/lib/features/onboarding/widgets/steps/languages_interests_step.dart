import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../../shared/widgets/secondary_button.dart';
import '../../../../shared/widgets/select_chip.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../providers/onboarding_provider.dart';

class LanguagesInterestsStep extends ConsumerWidget {
  const LanguagesInterestsStep({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(onboardingProvider);

    final languageOptions = [
      "English",
      "Hindi",
      "Bengali",
      "Telugu",
      "Marathi",
      "Tamil",
      "Gujarati",
      "Urdu",
      "Kannada",
      "Malayalam",
      "Punjabi",
    ];

    final interestOptions = [
      // Travel & Adventure
      "Travel",
      "Hiking",
      "Camping",
      "Backpacking",
      "Surfing",
      "Skiing",
      "Rock Climbing",

      // Food & Drink
      "Food",
      "Cooking",
      "Wine",
      "Coffee",
      "Brunch",

      // Fitness & Wellness
      "Fitness",
      "Yoga",
      "Running",
      "Cycling",
      "Dance",

      // Sports
      "Sports",
      "Football",
      "Basketball",
      "Tennis",

      // Arts & Culture
      "Art",
      "Photography",
      "Museums",
      "Concerts",
      "Festivals",

      // Music
      "Music",
      "Live Music",

      // Entertainment
      "Movies",
      "Netflix",
      "Podcasts",

      // Reading & Learning
      "Reading",
      "Books",

      // Social & Causes
      "Volunteering",

      // Lifestyle
      "Fashion",

      // Pets & Animals
      "Dogs",
      "Cats",

      // Nightlife
      "Nightlife",
      "Bars",
    ];

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Column(
        children: [
          const SizedBox(height: AppSpacing.sm),
          Text(
            "Interests & Languages",
            style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w600),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 6),
          Text(
            "Select what you like and speak",
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.mutedForeground,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.lg),

          // Languages Section
          Align(
            alignment: Alignment.centerLeft,
            child: Text('Languages', style: AppTextStyles.label),
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: Wrap(
              spacing: 8,
              runSpacing: 10,
              children: languageOptions.map((lang) {
                return SelectChip(
                  label: lang,
                  isSelected: state.languages.contains(lang),
                  onTap: () => ref
                      .read(onboardingProvider.notifier)
                      .toggleLanguage(lang),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: AppSpacing.md),

          // Interests Section mirroring web's SelectChip layout
          Align(
            alignment: Alignment.centerLeft,
            child: Text('Interests', style: AppTextStyles.label),
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: Wrap(
              spacing: 8,
              runSpacing: 10,
              children: interestOptions.map((interest) {
                return SelectChip(
                  label: interest,
                  isSelected: state.interests.contains(interest),
                  onTap: () => ref
                      .read(onboardingProvider.notifier)
                      .toggleInterest(interest),
                );
              }).toList(),
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
                      ref.read(onboardingProvider.notifier).setStep(4),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: PrimaryButton(
                  text: 'Continue',
                  onPressed:
                      (state.languages.isNotEmpty && state.interests.isNotEmpty)
                      ? () => ref.read(onboardingProvider.notifier).setStep(6)
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
