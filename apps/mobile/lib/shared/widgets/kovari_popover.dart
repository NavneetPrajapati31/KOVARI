import 'dart:ui' show ImageFilter;
import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/theme/motion_tokens.dart';

class KovariMenuAction {

  const KovariMenuAction({
    required this.icon,
    required this.label,
    required this.onTap,
    this.isDestructive = false,
    this.labelFontSize,
    this.iconSize,
  });
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool isDestructive;
  final double? labelFontSize;
  final double? iconSize;
}

class KovariPopover extends StatefulWidget {

  const KovariPopover({
    super.key,
    required this.child,
    required this.items,
    this.offset = const Offset(-154, 40),
    this.width = 170,
  });
  final Widget child;
  final List<KovariMenuAction> items;
  final Offset offset;
  final double width;

  @override
  State<KovariPopover> createState() => _KovariPopoverState();
}

class _KovariPopoverState extends State<KovariPopover> {
  OverlayEntry? _overlayEntry;
  final LayerLink _layerLink = LayerLink();

  @override
  void dispose() {
    _overlayEntry?.remove();
    _overlayEntry = null;
    super.dispose();
  }

  void _toggleMenu() {
    if (_overlayEntry != null) {
      _overlayEntry!.remove();
      _overlayEntry = null;
      if (mounted) setState(() {});
      return;
    }

    _overlayEntry = _createOverlayEntry();
    Overlay.of(context).insert(_overlayEntry!);
    if (mounted) setState(() {});
  }

  OverlayEntry _createOverlayEntry() => OverlayEntry(
      builder: (context) => Stack(
        children: [
          Positioned.fill(
            child: GestureDetector(
              onTap: _toggleMenu,
              behavior: HitTestBehavior.translucent,
              child: Container(color: Colors.transparent),
            ),
          ),
          Positioned(
            width: widget.width,
            child: CompositedTransformFollower(
              link: _layerLink,
              showWhenUnlinked: false,
              offset: widget.offset,
              child: Material(
                color: Colors.transparent,
                child: TweenAnimationBuilder<double>(
                  tween: Tween(begin: 0.0, end: 1.0),
                  duration: MotionTokens.slow,
                  curve: MotionTokens.spring,
                  builder: (context, value, child) => Opacity(
                      opacity: value.clamp(0.0, 1.0),
                      child: Transform.scale(
                        scale: 0.8 + (0.2 * value),
                        alignment: Alignment.topRight,
                        child: child,
                      ),
                    ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          color: Colors.transparent,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: AppColors.borderColor(context),
                          ),
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: widget.items.asMap().entries.map((entry) {
                            final idx = entry.key;
                            final action = entry.value;
                            final isLast = idx == widget.items.length - 1;

                            return Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                _buildMenuItem(action),
                                if (!isLast)
                                  Divider(
                                    height: 1,
                                    color: AppColors.borderColor(context),
                                  ),
                              ],
                            );
                          }).toList(),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );

  Widget _buildMenuItem(KovariMenuAction action) {
    final color = action.isDestructive
        ? AppColors.destructive
        : AppColors.text(context);
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          _toggleMenu();
          action.onTap();
        },
        splashColor: color.withValues(alpha: 0.05),
        highlightColor: color.withValues(alpha: 0.02),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Row(
            children: [
              Icon(
                action.icon,
                size: action.iconSize ?? 16,
                color: color.withValues(alpha: 0.7),
              ),
              const SizedBox(width: 12),
              Text(
                action.label,
                style: TextStyle(
                  fontSize: action.labelFontSize ?? 14,
                  fontWeight: FontWeight.w500,
                  color: color,
                  letterSpacing: -0.3,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) => CompositedTransformTarget(
      link: _layerLink,
      child: GestureDetector(onTap: _toggleMenu, child: widget.child),
    );
}
