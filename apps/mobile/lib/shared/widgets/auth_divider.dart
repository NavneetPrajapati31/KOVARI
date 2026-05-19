import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/theme/app_text_styles.dart';

class AuthDivider extends StatelessWidget {
  const AuthDivider({super.key});

  @override
  Widget build(BuildContext context) => Padding(
      padding: const EdgeInsets.symmetric(vertical: 24.0),
      child: Row(
        children: [
          Expanded(child: Divider(color: AppColors.borderColor(context))),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Text(
              'OR',
              style: AppTextStyles.labelUppercase.copyWith(
                color: AppColors.text(context, isMuted: true),
              ),
            ),
          ),
          Expanded(child: Divider(color: AppColors.borderColor(context))),
        ],
      ),
    );
}
