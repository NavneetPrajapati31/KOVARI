import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../../theme/app_colors.dart';

class UserAvatarFallback extends StatelessWidget {
  final double size;
  final Color? iconColor;
  final Color? backgroundColor;

  const UserAvatarFallback({
    super.key,
    this.size = 40,
    this.iconColor,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: backgroundColor ?? AppColors.secondary,
        shape: BoxShape.circle,
      ),
      child: Center(
        child: SizedBox(
          width: size * 0.6,
          height: size * 0.6,
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
  }
}
