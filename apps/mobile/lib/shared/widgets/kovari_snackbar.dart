import 'package:flutter/material.dart';
import 'package:mobile/core/providers/status_overlay_provider.dart';
import 'package:mobile/main.dart';

enum SnackbarType { success, error, info }

class KovariSnackbar {
  static void show(
    BuildContext context, {
    required String message,
    SnackbarType type = SnackbarType.info,
    Duration duration = const Duration(seconds: 4),
    VoidCallback? onAction,
    String? actionLabel,
  }) {
    final statusType = _mapType(type);
    globalProviderContainer.read(statusOverlayProvider.notifier).show(
          message: message,
          type: statusType,
          duration: duration,
          onAction: onAction,
          actionLabel: actionLabel,
        );
  }

  static StatusType _mapType(SnackbarType type) {
    switch (type) {
      case SnackbarType.success:
        return StatusType.success;
      case SnackbarType.error:
        return StatusType.error;
      case SnackbarType.info:
        return StatusType.info;
    }
  }

  // --- Convenience Methods ---

  static void success(BuildContext context, String message) {
    show(context, message: message, type: SnackbarType.success);
  }

  static void error(BuildContext context, String message) {
    show(context, message: message, type: SnackbarType.error);
  }

  static void info(BuildContext context, String message) {
    show(context, message: message);
  }
}
