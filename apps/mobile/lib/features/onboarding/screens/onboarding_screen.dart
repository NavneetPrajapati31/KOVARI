import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/providers/auth_provider.dart';
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
import 'package:flutter/foundation.dart';
import '../../../core/network/api_client.dart';
import '../../../core/services/local_storage.dart';
import '../../../core/config/routes.dart';
import '../../auth/services/auth_service.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final PageController _pageController = PageController();

  Future<void> _handleDevReset() async {
    await ref.read(authProvider.notifier).logout();

    if (mounted) {
      Navigator.of(
        context,
      ).pushNamedAndRemoveUntil(AppRoutes.login, (route) => false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(onboardingProvider);
    const totalSteps = 7;
    final isComplete = state.currentStep > totalSteps;

    // Synchronize PageView with currentStep state (only for active steps)
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!isComplete &&
          _pageController.hasClients &&
          _pageController.page?.round() != (state.currentStep - 1)) {
        _pageController.animateToPage(
          state.currentStep - 1,
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeInOut,
        );
      }
    });

    // List of active onboarding steps
    final List<Widget> steps = const [
      IdentityStep(),
      MediaBioStep(),
      GenderBirthStep(),
      LocationJobStep(),
      LanguagesInterestsStep(),
      LifestyleStep(),
      PolicyStep(),
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
                borderRadius: AppRadius.extraLarge,
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Progress Indicator (Step X of Y) - Only shown during active steps
                  if (!isComplete)
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.lg,
                        vertical: AppSpacing.lg,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          GestureDetector(
                            onLongPress: () {
                              if (kDebugMode) {
                                showDialog(
                                  context: context,
                                  builder: (context) => AlertDialog(
                                    title: const Text('Dev Reset'),
                                    content: const Text(
                                      'Clear session and return to Login? (Dev only)',
                                    ),
                                    actions: [
                                      TextButton(
                                        onPressed: () => Navigator.pop(context),
                                        child: const Text('Cancel'),
                                      ),
                                      TextButton(
                                        onPressed: () {
                                          Navigator.pop(context);
                                          _handleDevReset();
                                        },
                                        child: const Text(
                                          'Reset',
                                          style: TextStyle(
                                            color: Colors.red,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              }
                            },
                            child: Text(
                              'Step ${state.currentStep} of $totalSteps',
                              style: AppTextStyles.label.copyWith(
                                fontWeight: FontWeight.w500,
                                color: AppColors.mutedForeground,
                              ),
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
                      child: isComplete
                          ? const SuccessStep()
                          : steps[state.currentStep - 1],
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
