import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';

class SecondaryButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final IconData? icon;
  final double height;
  final double? width;

  const SecondaryButton({
    super.key,
    this.text = '',
    this.onPressed,
    this.isLoading = false,
    this.icon,
    this.height = 40.0,
    this.width,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      width: width,
      child: OutlinedButton(
        onPressed: isLoading ? null : onPressed,
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: AppColors.border),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: EdgeInsets.zero,
          backgroundColor: AppColors.background,
          elevation: 0,
          shadowColor: Colors.transparent,
          foregroundColor: AppColors.foreground,
        ),
        child: isLoading
            ? const SizedBox(
                height: 16,
                width: 16,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    AppColors.mutedForeground,
                  ),
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (icon != null)
                    Icon(icon, size: 16, color: AppColors.foreground),
                  if (text.isNotEmpty) ...[
                    if (icon != null) const SizedBox(width: 8),
                    Text(
                      text,
                      style: AppTextStyles.button.copyWith(
                        color: AppColors.foreground,
                      ),
                    ),
                  ],
                ],
              ),
      ),
    );
  }
}
