import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/theme/app_text_styles.dart';

class KovariGroupContainer extends StatelessWidget {
  final List<Widget> children;
  final EdgeInsetsGeometry? padding;
  final Color? backgroundColor;

  const KovariGroupContainer({
    super.key,
    required this.children,
    this.padding,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: backgroundColor ?? AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: List.generate(children.length, (index) {
          if (index == children.length - 1) return children[index];
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              children[index],
              const Divider(height: 1, color: AppColors.border),
            ],
          );
        }),
      ),
    );
  }
}

class KovariSection extends StatelessWidget {
  final String? title;
  final List<Widget> children;
  final EdgeInsetsGeometry? padding;

  const KovariSection({
    super.key,
    this.title,
    required this.children,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: padding ?? const EdgeInsets.only(top: 0, bottom: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (title != null)
            Padding(
              padding: const EdgeInsets.only(
                left: 10,
                right: 20,
                bottom: 10,
                top: 8,
              ),
              child: Text(
                title!.toUpperCase(),
                style: AppTextStyles.bodySmall.copyWith(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: AppColors.mutedForeground,
                  letterSpacing: 1,
                ),
              ),
            ),
          const SizedBox(height: 2),
          KovariGroupContainer(children: children),
        ],
      ),
    );
  }
}

class KovariListRow extends StatelessWidget {
  final IconData? icon;
  final Color? iconColor;
  final String label;
  final String? subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;
  final Color? labelColor;

  const KovariListRow({
    super.key,
    this.icon,
    this.iconColor,
    required this.label,
    this.subtitle,
    this.trailing,
    this.onTap,
    this.labelColor,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            highlightColor: Colors.black.withValues(alpha: 0.05),
            splashColor: Colors.black.withValues(alpha: 0.03),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  if (icon != null) ...[
                    Container(
                      padding: const EdgeInsets.all(6),
                      child: Icon(
                        icon,
                        size: 18,
                        color: iconColor ?? AppColors.primary,
                      ),
                    ),
                    const SizedBox(width: 10),
                  ],
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          label,
                          style: AppTextStyles.bodyMedium.copyWith(
                            fontWeight: FontWeight.w500,
                            fontSize: 15,
                            color: labelColor ?? AppColors.foreground,
                          ),
                        ),
                      ],
                    ),
                  ),
                  trailing ??
                      const Icon(
                        LucideIcons.chevronRight,
                        size: 18,
                        color: AppColors.mutedForeground,
                      ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
