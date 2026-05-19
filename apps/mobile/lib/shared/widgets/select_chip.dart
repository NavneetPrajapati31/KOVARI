import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/theme/app_radius.dart';
import 'package:mobile/core/theme/app_text_styles.dart';

class SelectChip extends StatelessWidget {

  const SelectChip({
    super.key,
    required this.label,
    required this.isSelected,
    required this.onTap,
    this.fillColor,
  });
  final String label;
  final bool isSelected;
  final VoidCallback onTap;
  final Color? fillColor;

  @override
  Widget build(BuildContext context) => GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withValues(alpha: 0.1)
              : (fillColor ?? AppColors.surface(context, level: 2)),
          borderRadius: AppRadius.extraLarge,
          border: Border.all(color: AppColors.borderColor(context)),
        ),
        child: Text(
          label,
          style: AppTextStyles.bodySmall.copyWith(
            color: isSelected ? AppColors.primary : AppColors.text(context),
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
          ),
        ),
      ),
    );
}
