import 'package:flutter/material.dart';
import 'package:mobile/core/services/haptic_service.dart';
import 'package:mobile/core/theme/app_colors.dart';

class KovariRefreshIndicator extends StatelessWidget {

  const KovariRefreshIndicator({
    super.key,
    required this.child,
    required this.onRefresh,
  });
  final Widget child;
  final RefreshCallback onRefresh;

  @override
  Widget build(BuildContext context) => RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () async {
        HapticService.medium();
        // Run the actual refresh and a minimum delay in parallel.
        await Future.wait([
          onRefresh(),
          Future<void>.delayed(const Duration(milliseconds: 800)),
        ]);
      },
      child: child,
    );
}
