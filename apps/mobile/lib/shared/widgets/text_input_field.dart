import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';

class TextInputField extends StatelessWidget {
  final String label;
  final String? initialValue;
  final String? hintText;
  final String? errorText;
  final bool obscureText;
  final TextEditingController? controller;
  final TextInputType keyboardType;
  final Widget? suffixIcon;
  final Widget? prefixIcon;
  final ValueChanged<String>? onChanged;
  final FormFieldValidator<String>? validator;
  final int maxLines;
  final int? maxLength;
  final FocusNode? focusNode;
  final Color? fillColor;
  final double? height;
  final BoxConstraints? prefixIconConstraints;
  final EdgeInsetsGeometry? contentPadding;

  const TextInputField({
    super.key,
    required this.label,
    this.initialValue,
    this.hintText,
    this.errorText,
    this.obscureText = false,
    this.controller,
    this.keyboardType = TextInputType.text,
    this.suffixIcon,
    this.prefixIcon,
    this.onChanged,
    this.validator,
    this.maxLines = 1,
    this.maxLength,
    this.focusNode,
    this.fillColor,
    this.height,
    this.prefixIconConstraints,
    this.contentPadding,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.only(left: 4),
            child: Text(
              label,
              style: AppTextStyles.label.copyWith(
                color: AppColors.mutedForeground,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const SizedBox(height: 6),
        ],
        TextFormField(
          initialValue: initialValue,
          controller: controller,
          focusNode: focusNode,
          obscureText: obscureText,
          keyboardType: keyboardType,
          onChanged: onChanged,
          validator: validator,
          maxLines: maxLines,
          maxLength: maxLength,
          style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w500),
          decoration: InputDecoration(
            counterText: "", // Hide character counter for cleaner aesthetic
            hintText: hintText,
            prefixIcon: prefixIcon,
            suffixIcon: suffixIcon,
            prefixIconConstraints:
                prefixIconConstraints ??
                BoxConstraints(
                  minWidth: 40,
                  minHeight: height ?? 40,
                  maxHeight: height ?? 40,
                ),
            suffixIconConstraints: BoxConstraints(
              minWidth: 40,
              minHeight: height ?? 40,
              maxHeight: height ?? 40,
            ),
            errorText: errorText,
            isDense: true,
            contentPadding:
                contentPadding ??
                const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            filled: true,
            fillColor: fillColor ?? AppColors.background,
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.border),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.border),
            ),
            hintStyle: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.mutedForeground,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ],
    );
  }
}
