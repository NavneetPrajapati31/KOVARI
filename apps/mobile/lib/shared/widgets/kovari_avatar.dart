import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/theme/app_colors.dart';

class KovariAvatar extends StatelessWidget {
  final String? imageUrl;
  final double size;
  final bool isSelected;
  final String? fullName;

  const KovariAvatar({
    super.key,
    required this.imageUrl,
    this.size = 24.0,
    this.isSelected = false,
    this.fullName,
  });

  @override
  Widget build(BuildContext context) {
    // If we definitely have no URL, just show fallback
    if (imageUrl == null || imageUrl!.isEmpty) {
      return _buildFallback();
    }

    // Otherwise, stack the image on top of the fallback
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          _buildFallback(),
          ClipOval(
            child: Image.network(
              imageUrl!,
              width: size,
              height: size,
              fit: BoxFit.cover,
              // frameBuilder ensures we only show the image once the first frame is ready
              frameBuilder: (context, child, frame, wasSynchronouslyLoaded) {
                if (wasSynchronouslyLoaded || frame != null) {
                  return child;
                }
                // While still loading the first frame, show nothing (fallback is already underneath)
                return const SizedBox.shrink();
              },
              errorBuilder: (context, error, stackTrace) {
                return _buildFallback();
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFallback() {
    return Container(
      width: size,
      height: size,
      decoration: const BoxDecoration(
        color: AppColors.secondary,
        shape: BoxShape.circle,
      ),
      padding: EdgeInsets.all(size * 0.2), // Matches web's 3/5 size for icon
      child: Icon(
        LucideIcons.userRound,
        size: size * 0.6,
        color: AppColors.foreground,
      ),
    );
  }
}
