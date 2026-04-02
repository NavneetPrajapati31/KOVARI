import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/theme/app_radius.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

class SelectField<T> extends StatefulWidget {
  final String label;
  final T? value;
  final String hintText;
  final List<T> options;
  final String Function(T) itemLabelBuilder;
  final ValueChanged<T?>? onChanged;
  final String? errorText;
  final Color? fillColor;

  const SelectField({
    super.key,
    required this.label,
    required this.value,
    required this.hintText,
    required this.options,
    required this.itemLabelBuilder,
    this.onChanged,
    this.errorText,
    this.fillColor,
  });

  @override
  State<SelectField<T>> createState() => _SelectFieldState<T>();
}

class _SelectFieldState<T> extends State<SelectField<T>> {
  final MenuController _controller = MenuController();

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.label,
              style: AppTextStyles.label.copyWith(
                color: AppColors.mutedForeground,
              ),
            ),
            const SizedBox(height: 4),
            MenuAnchor(
              controller: _controller,
              style: MenuStyle(
                backgroundColor: WidgetStateProperty.all(Colors.white),
                elevation: WidgetStateProperty.all(8),
                shadowColor: WidgetStateProperty.all(
                  Colors.black.withValues(alpha: 0.1),
                ),
                shape: WidgetStateProperty.all(
                  RoundedRectangleBorder(
                    borderRadius: AppRadius.large,
                    side: const BorderSide(color: AppColors.border, width: 0.5),
                  ),
                ),
                padding: WidgetStateProperty.all(const EdgeInsets.all(8)),
                // Force menu to match trigger width
                minimumSize: WidgetStateProperty.all(
                  Size(constraints.maxWidth, 0),
                ),
                maximumSize: WidgetStateProperty.all(
                  Size(constraints.maxWidth, 400),
                ),
              ),
              alignmentOffset: const Offset(0, 4),
              menuChildren: widget.options.map((option) {
                final isSelected = widget.value == option;
                return MenuItemButton(
                  onPressed: () => widget.onChanged?.call(option),
                  style: MenuItemButton.styleFrom(
                    backgroundColor: isSelected
                        ? AppColors.primaryLight
                        : Colors.transparent,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.all(Radius.circular(12)),
                    ),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 16,
                    ),
                    visualDensity: const VisualDensity(
                      horizontal: 0,
                      vertical: -2,
                    ),
                    // Fix: Explicitly reduce height and density to remove spacing
                    minimumSize: Size(constraints.maxWidth - 16, 32),
                  ),
                  child: Text(
                    widget.itemLabelBuilder(option),
                    style: AppTextStyles.bodyMedium.copyWith(
                      fontWeight: isSelected
                          ? FontWeight.w600
                          : FontWeight.w400,
                      color: isSelected
                          ? AppColors.primary
                          : AppColors.mutedForeground,
                    ),
                  ),
                );
              }).toList(),
              builder: (context, controller, child) {
                return InkWell(
                  onTap: () {
                    if (controller.isOpen) {
                      controller.close();
                    } else {
                      controller.open();
                    }
                  },
                  borderRadius: AppRadius.large,
                  child: Container(
                    height: 40,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color: widget.fillColor ?? AppColors.background,
                      borderRadius: BorderRadius.all(Radius.circular(12)),
                      border: Border.all(
                        color: widget.errorText != null
                            ? AppColors.destructive
                            : AppColors.border,
                        width: 1,
                      ),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            widget.value != null
                                ? widget.itemLabelBuilder(widget.value as T)
                                : widget.hintText,
                            style: AppTextStyles.bodyMedium.copyWith(
                              color: widget.value != null
                                  ? AppColors.foreground
                                  : AppColors.mutedForeground,
                              fontWeight: FontWeight.w500,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Icon(
                          controller.isOpen
                              ? LucideIcons.chevronUp
                              : LucideIcons.chevronDown,
                          size: 16,
                          color: AppColors.mutedForeground,
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
            if (widget.errorText != null) ...[
              const SizedBox(height: 4),
              Text(
                widget.errorText!,
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.destructive,
                ),
              ),
            ],
          ],
        );
      },
    );
  }
}
