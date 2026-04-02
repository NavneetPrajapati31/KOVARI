import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/common/skeleton.dart';

import '../../../notifications/screens/notifications_screen.dart';
import '../../../requests/screens/requests_screen.dart';

class HomeHeader extends StatelessWidget {
  final String firstName;
  final int unreadNotificationsCount;
  final bool isLoading;

  const HomeHeader({
    super.key,
    this.firstName = 'User',
    this.unreadNotificationsCount = 0,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          if (isLoading)
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Skeleton(width: 100, height: 16),
                const SizedBox(height: 4),
                const Skeleton(width: 160, height: 14),
              ],
            )
          else
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Hi, $firstName',
                  style: AppTextStyles.h3.copyWith(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                // const SizedBox(height: 2),
                Text(
                  'Welcome back to Kovari 👋🏻',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.mutedForeground,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          if (isLoading)
            const Skeleton(width: 64, height: 20)
          else
            Row(
              children: [
                _buildIconButton(
                  icon: LucideIcons.bell,
                  showBadge: unreadNotificationsCount > 0,
                  onTap: () {
                    Navigator.push(
                      context,
                      PageRouteBuilder(
                        pageBuilder: (context, animation, secondaryAnimation) =>
                            const NotificationsScreen(),
                        transitionsBuilder:
                            (context, animation, secondaryAnimation, child) {
                              const begin = Offset(1.0, 0.0);
                              const end = Offset.zero;
                              const curve = Curves.easeOutQuart;
                              var tween = Tween(
                                begin: begin,
                                end: end,
                              ).chain(CurveTween(curve: curve));
                              var offsetAnimation = animation.drive(tween);
                              return SlideTransition(
                                position: offsetAnimation,
                                child: child,
                              );
                            },
                        transitionDuration: const Duration(milliseconds: 350),
                      ),
                    );
                  },
                ),
                const SizedBox(width: AppSpacing.md),
                _buildIconButton(
                  icon: LucideIcons.heart,
                  onTap: () {
                    Navigator.push(
                      context,
                      PageRouteBuilder(
                        pageBuilder: (context, animation, secondaryAnimation) =>
                            const RequestsScreen(),
                        transitionsBuilder:
                            (context, animation, secondaryAnimation, child) {
                               const begin = Offset(1.0, 0.0);
                               const end = Offset.zero;
                               const curve = Curves.easeOutQuart;
                               var tween = Tween(
                                 begin: begin,
                                 end: end,
                               ).chain(CurveTween(curve: curve));
                               var offsetAnimation = animation.drive(tween);
                               return SlideTransition(
                                 position: offsetAnimation,
                                 child: child,
                               );
                            },
                        transitionDuration: const Duration(milliseconds: 350),
                      ),
                    );
                  },
                ),
              ],
            ),
        ],
      ),
    );
  }

  Widget _buildIconButton({
    required IconData icon,
    bool showBadge = false,
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Icon(icon, size: 20, color: AppColors.foreground),
          if (showBadge)
            Positioned(
              top: -1,
              right: -0.5,
              child: Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.background, width: 1.5),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
