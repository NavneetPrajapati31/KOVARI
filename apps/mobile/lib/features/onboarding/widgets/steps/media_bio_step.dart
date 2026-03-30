import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../shared/widgets/text_input_field.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../../shared/widgets/secondary_button.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../providers/onboarding_provider.dart';

class MediaBioStep extends ConsumerStatefulWidget {
  const MediaBioStep({super.key});

  @override
  ConsumerState<MediaBioStep> createState() => _MediaBioStepState();
}

class _MediaBioStepState extends ConsumerState<MediaBioStep> {
  late final TextEditingController _bioController;

  @override
  void initState() {
    super.initState();
    _bioController = TextEditingController(
      text: ref.read(onboardingProvider).bio,
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(onboardingProvider);

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Column(
        children: [
          const SizedBox(height: AppSpacing.sm),
          Text(
            "Profile picture",
            style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w600),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 6),
          Text(
            "Add a photo and short bio",
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.mutedForeground,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.lg),

          // Avatar Selector mirroring web UX
          GestureDetector(
            onTap: () {
              // Placeholder for image picker functionality
            },
            child: Stack(
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: AppColors.secondary,
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.border, width: 2),
                    image: state.profilePicUrl != null
                        ? DecorationImage(
                            image: NetworkImage(state.profilePicUrl!),
                            fit: BoxFit.cover,
                          )
                        : null,
                  ),
                  child: state.profilePicUrl == null
                      ? const Icon(
                          LucideIcons.userRound,
                          size: 28,
                          color: AppColors.mutedForeground,
                        )
                      : null,
                ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      LucideIcons.scanFace,
                      color: Colors.white,
                      size: 16,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),

          TextInputField(
            label: 'Bio',
            hintText: 'Tell us about your travel style...',
            controller: _bioController,
            maxLines: 4,
            onChanged: (v) =>
                ref.read(onboardingProvider.notifier).updateMediaBio(bio: v),
          ),

          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(
                child: SecondaryButton(
                  text: 'Back',
                  icon: LucideIcons.chevronLeft,
                  onPressed: () =>
                      ref.read(onboardingProvider.notifier).setStep(1),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: PrimaryButton(
                  text: 'Continue',
                  onPressed: () =>
                      ref.read(onboardingProvider.notifier).setStep(3),
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

  @override
  void dispose() {
    _bioController.dispose();
    super.dispose();
  }
}
