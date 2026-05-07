import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/common/skeleton.dart';
import '../../../../shared/widgets/app_card.dart';

class StatCard extends StatelessWidget {
  final String title;
  final String value;
  final bool isLoading;

  const StatCard({
    super.key,
    required this.title,
    required this.value,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(16),
      interactive: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            title,
            style: AppTextStyles.label.copyWith(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: AppColors.text(context, isMuted: true),
            ),
          ),
          const SizedBox(height: 2),
          if (isLoading)
            const Column(
              children: [
                SizedBox(height: 4),
                Skeleton(width: 80, height: 14),
              ],
            )
          else
            Text(
              value,
              style: AppTextStyles.bodyMedium.copyWith(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.text(context),
              ),
            ),
        ],
      ),
    );
  }
}
