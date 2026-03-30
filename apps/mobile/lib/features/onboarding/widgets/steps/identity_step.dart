import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../shared/widgets/text_input_field.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../providers/onboarding_provider.dart';

class IdentityStep extends ConsumerStatefulWidget {
  const IdentityStep({super.key});

  @override
  ConsumerState<IdentityStep> createState() => _IdentityStepState();
}

class _IdentityStepState extends ConsumerState<IdentityStep> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _firstController;
  late final TextEditingController _lastController;
  late final TextEditingController _userController;

  @override
  void initState() {
    super.initState();
    final state = ref.read(onboardingProvider);
    _firstController = TextEditingController(text: state.firstName);
    _lastController = TextEditingController(text: state.lastName);
    _userController = TextEditingController(text: state.username);
  }

  void _onNext() {
    if (_formKey.currentState!.validate()) {
      final state = ref.read(onboardingProvider);
      if (state.isUsernameAvailable == true && !state.isUsernameChecking) {
        ref.read(onboardingProvider.notifier).setStep(2);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please choose a valid and available username'),
            backgroundColor: AppColors.destructive,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(onboardingProvider);

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Form(
        key: _formKey,
        child: Column(
          children: [
            const SizedBox(height: AppSpacing.xl),
            Text(
              "Let's get started",
              style: AppTextStyles.h1,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              "Tell us about yourself to create your profile",
              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.mutedForeground),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.xxl),

            TextInputField(
              label: 'First Name',
              hintText: 'John',
              controller: _firstController,
              onChanged: (v) => ref.read(onboardingProvider.notifier).updateIdentity(first: v),
              validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
            ),
            const SizedBox(height: AppSpacing.md),

            TextInputField(
              label: 'Last Name',
              hintText: 'Doe',
              controller: _lastController,
              onChanged: (v) => ref.read(onboardingProvider.notifier).updateIdentity(last: v),
              validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
            ),
            const SizedBox(height: AppSpacing.md),

            TextInputField(
              label: 'Username',
              hintText: 'your_username',
              controller: _userController,
              onChanged: (v) => ref.read(onboardingProvider.notifier).updateIdentity(user: v),
              validator: (v) {
                if (v == null || v.isEmpty) return 'Required';
                if (v.length < 3) return 'Too short (min 3 chars)';
                if (!RegExp(r'^[a-zA-Z0-9_]+$').hasMatch(v)) {
                  return 'Letters, numbers, and underscores only';
                }
                return null;
              },
              suffixIcon: Padding(
                padding: const EdgeInsets.all(12),
                child: state.isUsernameChecking
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : (state.isUsernameAvailable == true
                        ? const Icon(LucideIcons.check, color: Colors.green, size: 18)
                        : (state.isUsernameAvailable == false
                            ? const Icon(LucideIcons.circleAlert, color: AppColors.destructive, size: 18)
                            : null)),
              ),
            ),
            
            const SizedBox(height: AppSpacing.xxl),
            PrimaryButton(
              text: 'Continue',
              onPressed: _onNext,
              icon: LucideIcons.chevronRight,
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _firstController.dispose();
    _lastController.dispose();
    _userController.dispose();
    super.dispose();
  }
}
