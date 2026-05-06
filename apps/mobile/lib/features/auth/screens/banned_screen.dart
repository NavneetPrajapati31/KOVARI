import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../shared/models/kovari_user.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../../shared/widgets/secondary_button.dart';
import '../../../shared/widgets/app_card.dart';

class BannedScreen extends ConsumerWidget {
  final KovariUser user;

  const BannedScreen({super.key, required this.user});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bool isSuspended = user.banExpiresAt != null;
    final String title = isSuspended ? "Account suspended" : "Account banned";
    final String message = isSuspended
        ? "Your account is temporarily suspended due to a violation of our terms of service."
        : "Your account is permanently banned due to a violation of our terms of service.";

    return Scaffold(
      body: Stack(
        children: [
          // Background Glow for premium feel (matching web destructive/5 blur)
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 24,
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Branding Logo
                    Image.asset(
                      Theme.of(context).brightness == Brightness.dark
                          ? 'assets/logo_dark.webp'
                          : 'assets/logo.webp',
                      height: 20,
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) => Text(
                        'KOVARI',
                        style: AppTextStyles.h1.copyWith(
                          letterSpacing: 4,
                          fontSize: 28,
                        ),
                      ),
                    ),
                    const SizedBox(height: 30),

                    // The Card
                    AppCard(
                      width: double.infinity,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Padding(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 24,
                              vertical: 24,
                            ),
                            child: Column(
                              children: [
                                // Text Content
                                Text(
                                  title,
                                  style: AppTextStyles.h1.copyWith(
                                    color: AppColors.text(context),
                                    fontSize: 18,
                                    fontWeight: FontWeight.w600,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                                const SizedBox(height: 16),
                                ConstrainedBox(
                                  constraints: const BoxConstraints(
                                    maxWidth: 300,
                                  ),
                                  child: Text(
                                    message,
                                    style: AppTextStyles.bodyMedium.copyWith(
                                      color: AppColors.text(
                                        context,
                                        isMuted: true,
                                      ),
                                      height: 1.5,
                                      fontSize: 14.5,
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                ),
                                SizedBox(height: isSuspended ? 0 : 12),
                                // Expiration Box (for suspensions)
                                if (isSuspended &&
                                    user.banExpiresAt != null) ...[
                                  const SizedBox(height: 22),
                                  Container(
                                    width: double.infinity,
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 16,
                                      vertical: 14,
                                    ),
                                    decoration: BoxDecoration(
                                      color: AppColors.surface(context),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(
                                        color: AppColors.borderColor(context),
                                      ),
                                    ),
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          "Suspension active until",
                                          style: AppTextStyles.bodyMedium
                                              .copyWith(
                                                fontWeight: FontWeight.w600,
                                                color: AppColors.text(context),
                                              ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          DateFormat(
                                            'MMM d, yyyy • hh:mm a',
                                          ).format(
                                            DateTime.parse(
                                              user.banExpiresAt!,
                                            ).toLocal(),
                                          ),
                                          style: AppTextStyles.bodyMedium
                                              .copyWith(
                                                fontSize: 14,
                                                color: AppColors.text(
                                                  context,
                                                  isMuted: true,
                                                ),
                                                letterSpacing: -0.5,
                                              ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],

                                const SizedBox(height: 10),

                                // Action Buttons
                                SecondaryButton(
                                  text: "Contact Support",
                                  icon: LucideIcons.mail,
                                  height: 44,
                                  onPressed: () => _launchMail(context),
                                ),
                                const SizedBox(height: 8),
                                PrimaryButton(
                                  text: "Sign Out",
                                  height: 44,
                                  onPressed: () =>
                                      ref.read(authProvider.notifier).logout(),
                                ),
                              ],
                            ),
                          ),

                          // Footer
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            decoration: BoxDecoration(
                              border: Border(
                                top: BorderSide(
                                  color: AppColors.borderColor(context),
                                ),
                              ),
                            ),
                            child: Center(
                              child: Text.rich(
                                TextSpan(
                                  text: "Review our ",
                                  style: AppTextStyles.bodySmall.copyWith(
                                    color: AppColors.text(
                                      context,
                                      isMuted: true,
                                    ),
                                  ),
                                  children: [
                                    WidgetSpan(
                                      alignment: PlaceholderAlignment.baseline,
                                      baseline: TextBaseline.alphabetic,
                                      child: GestureDetector(
                                        onTap: () => _launchUrl(
                                          context,
                                          "https://kovari.in/community-guidelines",
                                        ),
                                        child: Container(
                                          padding: const EdgeInsets.only(
                                            bottom: 0.5,
                                          ),
                                          decoration: const BoxDecoration(
                                            border: Border(
                                              bottom: BorderSide(
                                                color:
                                                    AppColors.mutedForeground,
                                                width: 0.8,
                                              ),
                                            ),
                                          ),
                                          child: Text(
                                            "Community Guidelines",
                                            style: AppTextStyles.bodySmall
                                                .copyWith(
                                                  color: AppColors.text(
                                                    context,
                                                    isMuted: true,
                                                  ),
                                                ),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _launchUrl(BuildContext context, String url) async {
    final Uri uri = Uri.parse(url);
    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text("Could not open link")));
      }
    }
  }

  Future<void> _launchMail(BuildContext context) async {
    final Uri emailLaunchUri = Uri(
      scheme: 'mailto',
      path: 'support@kovari.in',
      query: 'subject=Account Restricted&body=Hello Support Team,',
    );
    try {
      if (await canLaunchUrl(emailLaunchUri)) {
        await launchUrl(emailLaunchUri);
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Could not open mail app")),
        );
      }
    }
  }
}
