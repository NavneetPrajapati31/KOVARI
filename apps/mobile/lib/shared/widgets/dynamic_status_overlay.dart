import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/theme/app_colors.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/connectivity_provider.dart';
import '../../core/auth/session_manager.dart';

class DynamicStatusOverlay extends ConsumerStatefulWidget {
  const DynamicStatusOverlay({super.key});

  @override
  ConsumerState<DynamicStatusOverlay> createState() =>
      _DynamicStatusOverlayState();
}

class _DynamicStatusOverlayState extends ConsumerState<DynamicStatusOverlay> {
  Timer? _syncTimer;
  bool _showRetry = false;

  @override
  void dispose() {
    _syncTimer?.cancel();
    super.dispose();
  }

  void _resetTimer() {
    _syncTimer?.cancel();
    _showRetry = false;
    final sessionManager = ref.read(sessionManagerProvider);
    _syncTimer = Timer(sessionManager.adaptiveTimeout, () {
      if (mounted) setState(() => _showRetry = true);
    });
  }

  @override
  Widget build(BuildContext context) {
    final connectivity = ref.watch(connectivityProvider);
    final auth = ref.watch(authProvider);

    // Manage timer based on refreshing state
    if (auth.isRefreshing) {
      if (_syncTimer == null) _resetTimer();
    } else {
      _syncTimer?.cancel();
      _syncTimer = null;
      _showRetry = false;
    }

    // Determine the current state and priority
    Widget? statusWidget;
    Color? accentColor;

    if (!connectivity.isOnline) {
      accentColor = AppColors.destructive;
      statusWidget = _StatusPillContent(
        key: const ValueKey('offline'),
        icon: LucideIcons.wifiOff,
        label: 'Offline',
        accentColor: accentColor,
      );
    } else if (auth.isRefreshing) {
      accentColor = const Color(0xFF0A84FF); // Apple System Blue
      statusWidget = _StatusPillContent(
        key: const ValueKey('syncing'),
        isSpinning: true,
        icon: LucideIcons.refreshCw,
        label: _showRetry ? 'Retry Sync' : 'Syncing',
        accentColor: accentColor,
        onTap: _showRetry ? () => ref.read(authProvider.notifier).init() : null,
      );
    } else if (auth.isDegraded) {
      accentColor = const Color(0xFFFF9F0A); // Apple System Orange
      statusWidget = _StatusPillContent(
        key: const ValueKey('degraded'),
        icon: LucideIcons.triangleAlert,
        label: 'Degraded',
        accentColor: accentColor,
      );
    }

    final isVisible = statusWidget != null;

    return AnimatedPositioned(
      duration: const Duration(milliseconds: 600),
      curve: Curves.easeOutBack,
      top: isVisible ? MediaQuery.of(context).padding.top + 8 : -120,
      left: 0,
      right: 0,
      child: Center(
        child: Material(
          color: Colors.transparent,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 400),
            curve: Curves.easeOutExpo,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            decoration: BoxDecoration(
              color: AppColors.isDark(context)
                  ? const Color(0xFF000000)
                  : Colors.white,
              borderRadius: BorderRadius.circular(30),
              border: Border.all(
                color: AppColors.isDark(context)
                    ? Colors.white.withValues(alpha: 0.08)
                    : Colors.black.withValues(alpha: 0.05),
                width: 0.8,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(
                    alpha: AppColors.isDark(context) ? 0.65 : 0.12,
                  ),
                  blurRadius: 35,
                  spreadRadius: 2,
                  offset: const Offset(0, 14),
                ),
                if (isVisible)
                  BoxShadow(
                    color: (accentColor ?? Colors.white).withValues(
                      alpha: AppColors.isDark(context) ? 0.12 : 0.08,
                    ),
                    blurRadius: 24,
                    spreadRadius: -2,
                  ),
              ],
            ),
            child: IntrinsicWidth(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 400),
                reverseDuration: const Duration(milliseconds: 200),
                transitionBuilder: (child, animation) {
                  return FadeTransition(
                    opacity: CurvedAnimation(
                      parent: animation,
                      curve: Curves.easeOut,
                    ),
                    child: ScaleTransition(
                      scale: Tween<double>(begin: 0.9, end: 1.0).animate(
                        CurvedAnimation(
                          parent: animation,
                          curve: Curves.easeOutBack,
                        ),
                      ),
                      child: child,
                    ),
                  );
                },
                child: statusWidget ?? const SizedBox.shrink(),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _StatusPillContent extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color accentColor;
  final bool isSpinning;
  final VoidCallback? onTap;

  const _StatusPillContent({
    super.key,
    required this.icon,
    required this.label,
    required this.accentColor,
    this.isSpinning = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _buildIcon(),
          const SizedBox(width: 14),
          Text(
            label,
            style: TextStyle(
              color: AppColors.isDark(context) ? Colors.white : Colors.black,
              fontSize: 15, // Prominent presence
              fontWeight: FontWeight.w700, // Bold for clarity
              letterSpacing: -0.3, // Authentic Apple tracking
              decoration: TextDecoration.none,
            ),
          ),
          if (onTap != null) ...[
            const SizedBox(width: 8),
            Icon(
              LucideIcons.chevronRight,
              size: 16,
              color: (AppColors.isDark(context) ? Colors.white : Colors.black)
                  .withValues(alpha: 0.5),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildIcon() {
    if (isSpinning) {
      return SizedBox(
        width: 14,
        height: 14,
        child: CircularProgressIndicator(
          strokeWidth: 2.5, // Thicker for premium feel
          valueColor: AlwaysStoppedAnimation<Color>(accentColor),
        ),
      );
    }

    return Icon(
      icon,
      size: 18, // Balanced with 15px bold text
      color: accentColor,
    );
  }
}
