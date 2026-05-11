import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/theme/app_text_styles.dart';
import 'package:mobile/core/widgets/skeletons/kovari_skeletons.dart';
import 'package:mobile/shared/widgets/app_card.dart';

class StatCard extends StatelessWidget {

  const StatCard({
    super.key,
    required this.title,
    required this.value,
    this.isLoading = false,
  });
  final String title;
  final String value;
  final bool isLoading;

  @override
  Widget build(BuildContext context) => AppCard(
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
