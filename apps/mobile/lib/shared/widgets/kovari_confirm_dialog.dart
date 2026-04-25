import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/theme/app_text_styles.dart';

void showKovariConfirmDialog({
  required BuildContext context,
  required String title,
  required String content,
  required String confirmLabel,
  required VoidCallback onConfirm,
  bool isDestructive = false,
  String cancelLabel = "Cancel",
}) {
  showGeneralDialog(
    context: context,
    barrierDismissible: true,
    barrierLabel: "Dismiss",
    barrierColor: Colors.black.withValues(alpha: 0.4), // Lighter barrier
    transitionDuration: const Duration(milliseconds: 200),
    pageBuilder: (context, anim1, anim2) => const SizedBox(),
    transitionBuilder: (context, anim1, anim2, child) {
      final curve = Curves.easeOutBack.transform(anim1.value);
      return Stack(
        children: [
          Positioned.fill(
            child: BackdropFilter(
              filter: ImageFilter.blur(
                sigmaX: 5 * anim1.value,
                sigmaY: 5 * anim1.value,
              ),
              child: Container(color: Colors.transparent),
            ),
          ),
          Transform.scale(
            scale: 0.85 + (0.15 * curve),
            child: Opacity(
              opacity: anim1.value,
              child: KovariConfirmDialog(
                title: title,
                content: content,
                confirmLabel: confirmLabel,
                onConfirm: onConfirm,
                isDestructive: isDestructive,
                cancelLabel: cancelLabel,
              ),
            ),
          ),
        ],
      );
    },
  );
}

class KovariConfirmDialog extends StatelessWidget {
  final String title;
  final String content;
  final String confirmLabel;
  final VoidCallback onConfirm;
  final bool isDestructive;
  final String cancelLabel;

  const KovariConfirmDialog({
    super.key,
    required this.title,
    required this.content,
    required this.confirmLabel,
    required this.onConfirm,
    this.isDestructive = false,
    this.cancelLabel = "Cancel",
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 45),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Material(
            color: AppColors.card,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
                  child: Column(
                    children: [
                      Text(
                        title,
                        textAlign: TextAlign.center,
                        style: AppTextStyles.bodyLarge.copyWith(
                          fontWeight: FontWeight.w600,
                          fontSize: 15,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        content,
                        textAlign: TextAlign.center,
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.mutedForeground,
                          fontSize: 13,
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
                Divider(height: 1, color: AppColors.border),
                Row(
                  children: [
                    Expanded(
                      child: _DialogAction(
                        label: cancelLabel,
                        onPressed: () => Navigator.pop(context),
                        isDefault: true,
                      ),
                    ),
                    Container(width: 1, height: 48, color: AppColors.border),
                    Expanded(
                      child: _DialogAction(
                        label: confirmLabel,
                        onPressed: () {
                          onConfirm();
                          Navigator.pop(context);
                        },
                        isDestructive: isDestructive,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _DialogAction extends StatelessWidget {
  final String label;
  final VoidCallback onPressed;
  final bool isDestructive;
  final bool isDefault;

  const _DialogAction({
    required this.label,
    required this.onPressed,
    this.isDestructive = false,
    this.isDefault = false,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onPressed,
      child: Container(
        height: 48,
        alignment: Alignment.center,
        child: Text(
          label,
          style: AppTextStyles.bodyMedium.copyWith(
            color: isDestructive ? AppColors.destructive : AppColors.primary,
            fontWeight: (isDestructive || !isDefault)
                ? FontWeight.w500
                : FontWeight.w500,
            fontSize: 15,
            letterSpacing: -0.3,
          ),
        ),
      ),
    );
  }
}
