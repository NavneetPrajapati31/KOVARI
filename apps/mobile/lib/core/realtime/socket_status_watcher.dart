import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/providers/status_overlay_provider.dart';
import 'package:mobile/core/realtime/socket_service.dart';
import 'package:mobile/core/realtime/socket_state.dart';

/// Watches [SocketState] and surfaces connectivity updates through the
/// app-wide [DynamicStatusOverlay] — the same pill used for offline / syncing
/// states everywhere else in the app.
///
/// Mount this once in [runtimeInitProvider]. It self-manages; no widget-level
/// wiring needed.
final socketStatusWatcherProvider = Provider<void>((ref) {
  Timer? connectingTimer;

  void hidePill() {
    ref.read(statusOverlayProvider.notifier).hideAll();
  }

  ref.listen<SocketState>(socketServiceProvider, (previous, next) {
    if (next == previous) return;

    // Always hide previous transient pills when state changes
    hidePill();
    connectingTimer?.cancel();

    switch (next) {
      case SocketState.connected:
        // Only celebrate reconnection — no noise at cold start.
        if (previous == SocketState.recovering ||
            previous == SocketState.degraded ||
            previous == SocketState.error ||
            previous == SocketState.disconnected) {
          ref
              .read(statusOverlayProvider.notifier)
              .show(
                message: 'Connected',
                type: StatusType.success,
                duration: const Duration(seconds: 2),
              );
        }

      case SocketState.connecting || SocketState.authenticating:
        connectingTimer = Timer(const Duration(milliseconds: 500), () {
          ref
              .read(statusOverlayProvider.notifier)
              .show(
                message: 'Connecting to chat…',
                type: StatusType.syncing,
                duration: const Duration(
                  hours: 1,
                ), // Dismissed manually on state change
              );
        });

      case SocketState.recovering:
        ref
            .read(statusOverlayProvider.notifier)
            .show(
              message: 'Reconnecting…',
              type: StatusType.syncing,
              duration: const Duration(hours: 1),
            );

      case SocketState.degraded:
        ref
            .read(statusOverlayProvider.notifier)
            .show(
              message: 'Chat connection degraded',
              type: StatusType.degraded,
              duration: const Duration(hours: 1),
            );

      case SocketState.rateLimited:
        ref
            .read(statusOverlayProvider.notifier)
            .show(
              message: 'Chat connection limited',
              type: StatusType.degraded,
              duration: const Duration(hours: 1),
            );

      case SocketState.error:
        ref
            .read(statusOverlayProvider.notifier)
            .show(
              message: 'Chat connection failed',
              type: StatusType.error,
              duration: const Duration(seconds: 6),
            );

      case SocketState.disconnected:
        // Only surface if previously connected — avoids noise at startup.
        if (previous == SocketState.connected) {
          hidePill();
          ref
              .read(statusOverlayProvider.notifier)
              .show(message: 'Chat disconnected', type: StatusType.offline);
        }
    }
  });
});
