import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'skeleton.dart';

class KovariImage extends StatelessWidget {
  final String imageUrl;
  final double? width;
  final double? height;
  final BoxFit fit;
  final BorderRadius? borderRadius;

  const KovariImage({
    super.key,
    required this.imageUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    if (imageUrl.isEmpty) {
      return Skeleton(width: width, height: height, borderRadius: borderRadius);
    }

    return CachedNetworkImage(
      key: key,
      imageUrl: imageUrl,
      cacheKey: imageUrl, // Absolute Identity
      fit: fit,
      width: width,
      height: height,
      // Memory cache optimization: limiting resolution to 600px ensures
      // instantaneous decoding on return, preventing the "flicker" of high-res files.
      memCacheWidth: 600,

      // The imageBuilder pattern pins the ready image to the UI,
      // preventing any fallback to placeholder during the rebuild phase.
      imageBuilder: (context, imageProvider) => Container(
        decoration: BoxDecoration(
          borderRadius: borderRadius,
          image: DecorationImage(image: imageProvider, fit: fit),
        ),
      ),

      placeholder: (context, url) =>
          Skeleton(width: width, height: height, borderRadius: borderRadius),
      errorWidget: (context, url, error) => Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: Colors.grey[200],
          borderRadius: borderRadius,
        ),
        child: const Icon(Icons.error_outline, color: Colors.grey),
      ),

      // Instant-Swap Configuration
      useOldImageOnUrlChange: true,
      filterQuality: FilterQuality.low,
      fadeOutDuration: Duration.zero,
      fadeInDuration: Duration.zero,
    );
  }
}
