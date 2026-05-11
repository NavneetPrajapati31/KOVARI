import 'dart:ui' show ImageFilter;

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/widgets/common/user_avatar_fallback.dart';

class KovariImageModal extends StatelessWidget {

  const KovariImageModal({super.key, required this.imageUrl});
  final String imageUrl;

  static void show(BuildContext context, String imageUrl) {
    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Close',
      barrierColor: Colors.black.withValues(alpha: 0.6),
      pageBuilder: (context, animation, secondaryAnimation) => KovariImageModal(imageUrl: imageUrl),
      transitionBuilder: (context, animation, secondaryAnimation, child) {
        final curve = Curves.easeOutBack.transform(animation.value);

        return Stack(
          children: [
            Positioned.fill(
              child: BackdropFilter(
                filter: ImageFilter.blur(
                  sigmaX: 5 * animation.value,
                  sigmaY: 5 * animation.value,
                ),
                child: Container(color: Colors.transparent),
              ),
            ),
            Transform.scale(
              scale: 0.85 + (0.15 * curve),
              child: Opacity(opacity: animation.value, child: child),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size.width * 0.7;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: GestureDetector(
        onTap: () => context.pop(),
        behavior: HitTestBehavior.opaque,
        child: Center(
          child: Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.surface(context, level: 2),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  blurRadius: 20,
                  spreadRadius: 2,
                ),
              ],
            ),
            child: ClipOval(
              child: CachedNetworkImage(
                imageUrl: imageUrl,
                fit: BoxFit.cover,
                errorWidget: (context, url, error) => UserAvatarFallback(
                  size: size,
                  backgroundColor: AppColors.surface(context, level: 1),
                ),
                placeholder: (context, url) => Container(
                  color: AppColors.surface(context, level: 1),
                  child: const Center(
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
