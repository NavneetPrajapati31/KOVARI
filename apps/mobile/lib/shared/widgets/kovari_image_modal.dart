import 'dart:ui' show ImageFilter;
import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/common/user_avatar_fallback.dart';

class KovariImageModal extends StatelessWidget {
  final String imageUrl;

  const KovariImageModal({super.key, required this.imageUrl});

  static void show(BuildContext context, String imageUrl) {
    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Close',
      barrierColor: Colors.black.withValues(alpha: 0.6),
      transitionDuration: const Duration(milliseconds: 200),
      pageBuilder: (context, animation, secondaryAnimation) {
        return KovariImageModal(imageUrl: imageUrl);
      },
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
        onTap: () => Navigator.pop(context),
        behavior: HitTestBehavior.opaque,
        child: Center(
          child: Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.black.withValues(alpha: 0.1),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  blurRadius: 20,
                  spreadRadius: 2,
                ),
              ],
            ),
            child: ClipOval(
              child: Image.network(
                imageUrl,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) =>
                    UserAvatarFallback(
                      size: size,
                      backgroundColor: AppColors.secondary,
                    ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
