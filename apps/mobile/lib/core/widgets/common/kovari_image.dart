import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'skeleton.dart';

class KovariImage extends StatelessWidget {
  final String imageUrl;
  final double? width;
  final double? height;
  final BoxFit fit;
   final BorderRadius? borderRadius;
  final Widget? placeholder;
  final Duration fadeInDuration;
  final Duration fadeOutDuration;

  const KovariImage({
    super.key,
    required this.imageUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.borderRadius,
    this.placeholder,
    this.fadeInDuration = const Duration(milliseconds: 500),
    this.fadeOutDuration = Duration.zero,
  });

  @override
  Widget build(BuildContext context) {
    if (imageUrl.isEmpty) {
      return Skeleton(width: width, height: height, borderRadius: borderRadius);
    }

    return ClipRRect(
      borderRadius: borderRadius ?? BorderRadius.zero,
      child: CachedNetworkImage(
        key: key,
        imageUrl: imageUrl,
        cacheKey: imageUrl,
        fit: fit,
        width: width,
        height: height,
        memCacheWidth: 600,
        placeholder: (context, url) =>
            placeholder ??
            Skeleton(width: width, height: height, borderRadius: borderRadius),
        errorWidget: (context, url, error) => Container(
          width: width,
          height: height,
          decoration: BoxDecoration(
            color: Colors.grey[200],
          ),
          child: const Icon(Icons.error_outline, color: Colors.grey),
        ),
        useOldImageOnUrlChange: true,
        fadeOutDuration: fadeOutDuration,
        fadeInDuration: fadeInDuration,
      ),
    );
  }
}
