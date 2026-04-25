import 'package:flutter/material.dart';
import '../../core/widgets/common/user_avatar_fallback.dart';
import '../../core/widgets/common/kovari_image.dart';

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
          KovariImage(
            imageUrl: imageUrl!,
            width: size,
            height: size,
            fit: BoxFit.cover,
            borderRadius: BorderRadius.circular(size),
            fadeInDuration: const Duration(milliseconds: 500),
            fadeOutDuration: const Duration(milliseconds: 500),
            placeholder:
                const SizedBox.shrink(), // Fallback is already underneath
          ),
        ],
      ),
    );
  }

  Widget _buildFallback() {
    return UserAvatarFallback(size: size, name: fullName);
  }
}
