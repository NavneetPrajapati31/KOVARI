import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class KovariRefreshIndicator extends StatelessWidget {
  final Widget child;
  final RefreshCallback onRefresh;

  const KovariRefreshIndicator({
    super.key,
    required this.child,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return RefreshIndicator(
      onRefresh: onRefresh,
      color: AppColors.primary,
      backgroundColor: isDark ? AppColors.cardDark : Colors.white,
      strokeWidth: 2.5,
      displacement: 40,
      edgeOffset: 0,
      triggerMode: RefreshIndicatorTriggerMode.anywhere,
      child: child,
    );
  }
}
