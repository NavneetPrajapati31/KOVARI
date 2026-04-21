import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';

class KovariSwitchTile extends StatelessWidget {
  final String label;
  final String? subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;
  final EdgeInsetsGeometry? margin;
  final Color? fillColor;
  final TextStyle? subtitleStyle;
  final TextStyle? titleStyle;

  const KovariSwitchTile({
    super.key,
    required this.label,
    this.subtitle,
    required this.value,
    required this.onChanged,
    this.margin,
    this.fillColor,
    this.subtitleStyle,
    this.titleStyle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin ?? const EdgeInsets.only(bottom: 18),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: fillColor ?? AppColors.background,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border, width: 1),
        boxShadow: [
          BoxShadow(
            // ignore: deprecated_member_use
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  label,
                  style: titleStyle ?? AppTextStyles.bodyMedium.copyWith(
                    fontWeight: FontWeight.w500,
                    color: AppColors.foreground,
                  ),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    subtitle!,
                    style:
                        subtitleStyle ??
                        AppTextStyles.bodySmall.copyWith(
                          fontSize: 12,
                          color: AppColors.mutedForeground,
                        ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 12),
          SizedBox(
            width: 48, // 51 * 0.65 approx
            height: 26, // 31 * 0.65 approx
            child: Transform.scale(
              scale: 0.65,
              alignment: Alignment.centerRight,
              child: CupertinoSwitch(
                value: value,
                onChanged: onChanged,
                activeTrackColor: AppColors.primary,
                inactiveTrackColor: AppColors.secondary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
