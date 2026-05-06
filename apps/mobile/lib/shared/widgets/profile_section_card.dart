import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import 'app_card.dart';

class ProfileSectionCard extends StatelessWidget {
  final String title;
  final String? subtitle;
  final List<Widget> children;
  final EdgeInsets? padding;

  const ProfileSectionCard({
    super.key,
    required this.title,
    this.subtitle,
    required this.children,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(
            left: AppSpacing.sm,
            bottom: AppSpacing.md,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title.toUpperCase(),
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.5,
                  color: AppColors.text(context, isMuted: true),
                ),
              ),
              if (subtitle != null) ...[
                const SizedBox(height: 2),
                Text(
                  subtitle!,
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.text(context, isMuted: true),
                  ),
                ),
              ],
            ],
          ),
        ),
        AppCard(
          width: double.infinity,
          padding: padding ?? const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: children,
          ),
        ),
      ],
    );
  }
}
