import 'dart:ui' show ImageFilter;
import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class KovariMenuAction {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool isDestructive;
  final double? labelFontSize;
  final double? iconSize;

  const KovariMenuAction({
    required this.icon,
    required this.label,
    required this.onTap,
    this.isDestructive = false,
    this.labelFontSize,
    this.iconSize,
  });
}

class KovariPopover extends StatefulWidget {
  final Widget child;
  final List<KovariMenuAction> items;
  final Offset offset;
  final double width;

  const KovariPopover({
    super.key,
    required this.child,
    required this.items,
    this.offset = const Offset(-154, 40),
    this.width = 170,
  });

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
      setState(() {});
      return;
    }

    _overlayEntry = _createOverlayEntry();
    Overlay.of(context).insert(_overlayEntry!);
    setState(() {});
  }

  OverlayEntry _createOverlayEntry() {
    return OverlayEntry(
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
                  duration: const Duration(milliseconds: 200),
                  curve: Curves.easeOutBack,
                  builder: (context, value, child) {
                    return Opacity(
                      opacity: value.clamp(0.0, 1.0),
                      child: Transform.scale(
                        scale: value,
                        alignment: Alignment.topRight,
                        child: child,
                      ),
                    );
                  },
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.8),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.border, width: 1),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.08),
                          blurRadius: 15,
                          offset: const Offset(0, 4),
                        ),
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.04),
                          blurRadius: 20,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(14),
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
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
                                  const Divider(
                                    height: 1,
                                    color: AppColors.border,
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
  }

  Widget _buildMenuItem(KovariMenuAction action) {
    final color = action.isDestructive
        ? AppColors.destructive
        : AppColors.foreground;
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
  Widget build(BuildContext context) {
    return CompositedTransformTarget(
      link: _layerLink,
      child: GestureDetector(onTap: _toggleMenu, child: widget.child),
    );
  }
}
