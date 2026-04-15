import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../../theme/app_colors.dart';

class UserAvatarFallback extends StatelessWidget {
  final double? size;
  final Color? iconColor;
  final Color? backgroundColor;
  final String? name;
  final BoxShape shape;
  final BorderRadius? borderRadius;
  final double? fontSize;

  const UserAvatarFallback({
    super.key,
    this.size,
    this.iconColor,
    this.backgroundColor,
    this.name,
    this.shape = BoxShape.circle,
    this.borderRadius,
    this.fontSize,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        // Use the smaller of available dimensions for internal scaling
        // fallback to a reasonable default (40) if constraints are infinite
        final double width = constraints.maxWidth != double.infinity
            ? constraints.maxWidth
            : (size ?? 40);
        final double height = constraints.maxHeight != double.infinity
            ? constraints.maxHeight
            : (size ?? 40);

        final double effectiveSize = (size != null && size != double.infinity)
            ? size!
            : (width < height ? width : height);

        return Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            color: backgroundColor ?? AppColors.secondary,
            shape: shape,
            borderRadius: borderRadius,
          ),
          child: Center(
            child: (name != null && name!.isNotEmpty)
                ? Text(
                    name![0].toUpperCase(),
                    style: TextStyle(
                      color: iconColor ?? AppColors.mutedForeground,
                      fontSize: fontSize ?? (effectiveSize * 0.45),
                      fontWeight: FontWeight.bold,
                    ),
                  )
                : SizedBox(
                    width: effectiveSize * 0.6,
                    height: effectiveSize * 0.6,
                    child: SvgPicture.string(
                      '''
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="8" r="4" fill="currentColor" />
  <rect x="4" y="14" width="16" height="6" rx="3" fill="currentColor" />
</svg>
''',
                      colorFilter: ColorFilter.mode(
                        iconColor ?? const Color(0xFF9CA3AF),
                        BlendMode.srcIn,
                      ),
                    ),
                  ),
          ),
        );
      },
    );
  }
}
