import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/theme/app_radius.dart';
import '../providers/onboarding_provider.dart';
import '../widgets/steps/identity_step.dart';
import '../widgets/steps/media_bio_step.dart';
import '../widgets/steps/gender_birth_step.dart';
import '../widgets/steps/location_job_step.dart';
import '../widgets/steps/languages_interests_step.dart';
import '../widgets/steps/lifestyle_step.dart';
import '../widgets/steps/policy_step.dart';
import '../widgets/steps/success_step.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final PageController _pageController = PageController();

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(onboardingProvider);
    final totalSteps = 8;

    // Synchronize PageView with currentStep state
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_pageController.hasClients &&
          _pageController.page?.round() != (state.currentStep - 1)) {
        _pageController.animateToPage(
          state.currentStep - 1,
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeInOut,
        );
      }
    });

    // List of steps to render dynamically
    final List<Widget> steps = const [
      IdentityStep(),
      MediaBioStep(),
      GenderBirthStep(),
      LocationJobStep(),
      LanguagesInterestsStep(),
      LifestyleStep(),
      PolicyStep(),
      SuccessStep(),
    ];

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            child: Container(
              margin: const EdgeInsets.symmetric(
                horizontal: AppSpacing.md,
                vertical: AppSpacing.xl,
              ),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: AppRadius.large,
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Progress Indicator (Step X of Y)
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.lg,
                      vertical: AppSpacing.lg,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Step ${state.currentStep} of $totalSteps',
                          style: AppTextStyles.label.copyWith(
                            fontWeight: FontWeight.w500,
                            color: AppColors.mutedForeground,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: List.generate(
                            totalSteps,
                            (index) => Expanded(
                              child: Container(
                                height: 6,
                                margin: EdgeInsets.only(
                                  right: index == totalSteps - 1 ? 0 : 4,
                                ),
                                decoration: BoxDecoration(
                                  color: (index + 1) <= state.currentStep
                                      ? AppColors.primary
                                      : AppColors.border,
                                  borderRadius: BorderRadius.circular(3),
                                ),
                              ),
                            ),
                          ).toList(),
                        ),
                      ],
                    ),
                  ),

                  // Dynamic Height Step Container
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 300),
                    child: KeyedSubtree(
                      key: ValueKey('step_${state.currentStep}'),
                      child: steps[state.currentStep - 1],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }
}
