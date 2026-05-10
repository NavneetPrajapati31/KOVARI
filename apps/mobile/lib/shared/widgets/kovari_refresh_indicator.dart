import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/services/haptic_service.dart';

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
    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () async {
        HapticService.medium();
        // Run the actual refresh and a minimum delay in parallel.
        await Future.wait([
          onRefresh(),
          Future.delayed(const Duration(milliseconds: 800)),
        ]);
      },
      child: child,
    );
  }
}
