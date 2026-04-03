import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';

class PrimaryButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final IconData? icon;
  final double? height;
  final double width;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final bool isDestructive;

  const PrimaryButton({
    super.key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
    this.icon,
    this.height = 40.0,
    this.width = double.infinity,
    this.backgroundColor,
    this.foregroundColor,
    this.isDestructive = false,
  });

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: isLoading ? null : onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor:
            backgroundColor ??
            (isDestructive ? AppColors.destructive : AppColors.primary),
        foregroundColor: foregroundColor ?? AppColors.primaryForeground,
        minimumSize: Size(width, height!),
        disabledBackgroundColor:
            (isDestructive ? AppColors.destructive : AppColors.primary)
                .withValues(alpha: 0.6),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 0,
        shadowColor: Colors.transparent,
      ),
      child: isLoading
          ? const SizedBox(
              height: 16,
              width: 16,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
              ),
            )
          : Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  text,
                  style: AppTextStyles.button.copyWith(
                    color: foregroundColor ?? AppColors.primaryForeground,
                  ),
                ),
                if (icon != null) ...[
                  const SizedBox(width: 8),
                  Icon(
                    icon,
                    size: 18,
                    color: foregroundColor ?? AppColors.primaryForeground,
                  ),
                ],
              ],
            ),
    );
  }
}
