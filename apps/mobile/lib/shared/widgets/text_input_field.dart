import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/theme/app_radius.dart';

class TextInputField extends StatelessWidget {
  final String label;
  final String? initialValue;
  final String? hintText;
  final String? errorText;
  final bool obscureText;
  final TextEditingController? controller;
  final TextInputType keyboardType;
  final Widget? suffixIcon;
  final ValueChanged<String>? onChanged;
  final FormFieldValidator<String>? validator;
  final int maxLines;
  final FocusNode? focusNode;

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
    this.onChanged,
    this.validator,
    this.maxLines = 1,
    this.focusNode,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 0),
          child: Text(
            label,
            style: AppTextStyles.label.copyWith(
              color: AppColors.mutedForeground,
            ),
          ),
        ),
        const SizedBox(height: 4),
        TextFormField(
          initialValue: initialValue,
          controller: controller,
          focusNode: focusNode,
          obscureText: obscureText,
          keyboardType: keyboardType,
          onChanged: onChanged,
          validator: validator,
          maxLines: maxLines,
          style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w500),
          decoration: InputDecoration(
            hintText: hintText,
            suffixIcon: suffixIcon,
            suffixIconConstraints: const BoxConstraints(
              minWidth: 0,
              minHeight: 0,
            ),
            errorText: errorText,
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 12,
              vertical: 10,
            ),
            filled: true,
            fillColor: AppColors.background,
            enabledBorder: OutlineInputBorder(
              borderRadius: AppRadius.large,
              borderSide: const BorderSide(color: AppColors.border),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: AppRadius.large,
              borderSide: const BorderSide(
                color: AppColors.primary,
                width: 1.5,
              ),
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
