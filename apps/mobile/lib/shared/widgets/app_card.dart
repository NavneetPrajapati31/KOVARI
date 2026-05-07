import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_radius.dart';
import 'interactive_wrapper.dart';
import '../../core/config/interaction_config.dart';

class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final Color? backgroundColor;
  final double? width;
  final double? height;
  final VoidCallback? onTap;
  final bool interactive;
  final BorderRadius? borderRadius;
  final EdgeInsetsGeometry? margin;
  final BoxBorder? border;
  final List<BoxShadow>? boxShadow;

  const AppCard({
    super.key,
    required this.child,
    this.padding,
    this.backgroundColor,
    this.width,
    this.height,
    this.onTap,
    this.interactive = true,
    this.borderRadius,
    this.margin,
    this.border,
    this.boxShadow,
  });

  @override
  Widget build(BuildContext context) {
    Widget card = Container(
      width: width,
      height: height,
      margin: margin,
      padding: padding ?? const EdgeInsets.all(16),
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: backgroundColor ?? AppColors.surface(context, level: 1),
        borderRadius: borderRadius ?? AppRadius.large,
        border: border ?? Border.all(color: AppColors.borderColor(context)),
        boxShadow: boxShadow ??
            [
              BoxShadow(
                color: Colors.black.withValues(
                  alpha: Theme.of(context).brightness == Brightness.dark
                      ? 0.2
                      : 0.03,
                ),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
      ),
      child: child,
    );

    if (onTap != null && interactive) {
      return InteractiveWrapper(
        onPressed: onTap,
        hapticType: HapticType.selection,
        child: card,
      );
    }

    return card;
  }
}
