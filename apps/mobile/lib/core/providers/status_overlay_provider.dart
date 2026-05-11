import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

enum StatusType {
  success,
  error,
  info,
  syncing,
  degraded,
  offline;

  IconData get defaultIcon {
    switch (this) {
      case StatusType.success:
        return LucideIcons.circleCheck;
      case StatusType.error:
        return LucideIcons.circleAlert;
      case StatusType.info:
        return LucideIcons.info;
      case StatusType.syncing:
        return LucideIcons.refreshCw;
      case StatusType.degraded:
        return LucideIcons.triangleAlert;
      case StatusType.offline:
        return LucideIcons.wifiOff;
    }
  }

  Color? get defaultAccentColor {
    switch (this) {
      case StatusType.success:
        return const Color(0xFF34C759); // Apple Success Green
      case StatusType.error:
        return const Color(0xFFFF3B30); // Apple Error Red
      case StatusType.info:
        return const Color(0xFF0A84FF); // Apple Info Blue
      case StatusType.syncing:
        return const Color(0xFF0A84FF);
      case StatusType.degraded:
        return const Color(0xFFFF9F0A); // Apple Warning Orange
      case StatusType.offline:
        return const Color(0xFF64748B); // Muted Gray
    }
  }
}

class StatusMessage {

  StatusMessage({
    required this.message,
    this.type = StatusType.info,
    this.customIcon,
    this.duration = const Duration(seconds: 4),
    this.onAction,
    this.actionLabel,
  }) : timestamp = DateTime.now();
  final String message;
  final StatusType type;
  final IconData? customIcon;
  final Duration duration;
  final VoidCallback? onAction;
  final String? actionLabel;
  final DateTime timestamp;
}

class StatusOverlayNotifier extends Notifier<List<StatusMessage>> {
  @override
  List<StatusMessage> build() => [];

  void show({
    required String message,
    StatusType type = StatusType.info,
    IconData? customIcon,
    Duration duration = const Duration(seconds: 4),
    VoidCallback? onAction,
    String? actionLabel,
  }) {
    final status = StatusMessage(
      message: message,
      type: type,
      customIcon: customIcon,
      duration: duration,
      onAction: onAction,
      actionLabel: actionLabel,
    );

    // Add to state, limit to top 10 for deep stacking
    final currentMessages = List<StatusMessage>.from(state);
    currentMessages.insert(0, status);
    if (currentMessages.length > 10) {
      currentMessages.removeLast();
    }
    state = currentMessages;

    // Auto-hide after duration
    Future.delayed(duration, () {
      state = state.where((m) => m.timestamp != status.timestamp).toList();
    });
  }

  void hide(DateTime timestamp) {
    state = state.where((m) => m.timestamp != timestamp).toList();
  }

  void clear() => state = [];

  // Convenience methods
  void success(String message) =>
      show(message: message, type: StatusType.success);
  void error(String message) => show(message: message, type: StatusType.error);
  void info(String message) => show(message: message);
}

final statusOverlayProvider =
    NotifierProvider<StatusOverlayNotifier, List<StatusMessage>>(
      StatusOverlayNotifier.new,
    );
