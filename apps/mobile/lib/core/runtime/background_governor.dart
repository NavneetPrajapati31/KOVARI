import 'dart:async';

import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/navigation/deep_link_router.dart';
import 'package:mobile/core/providers/auth_provider.dart';
import 'package:mobile/core/realtime/realtime_coordinator.dart';
import 'package:mobile/core/realtime/socket_service.dart';
import 'package:mobile/core/runtime/runtime_scheduler.dart';
import 'package:mobile/core/utils/app_logger.dart';
import 'package:mobile/features/chat/providers/chat_runtime_providers.dart';
import 'package:mobile/features/chat/providers/chat_media_service.dart';

class BackgroundGovernor extends WidgetsBindingObserver {

  BackgroundGovernor(this._scheduler, this._ref);
  final RuntimeScheduler _scheduler;
  final Ref _ref;

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    switch (state) {
      case AppLifecycleState.paused:
      case AppLifecycleState.inactive:
        DeepLinkBridge.onAppPaused();
        _handleBackground();
        break;
      case AppLifecycleState.resumed:
        _handleForeground();
        unawaited(DeepLinkBridge.onAppResumed());
        break;
      default:
        break;
    }
  }

  void _handleBackground() {
    AppLogger.d('🌙 [BackgroundGovernor] App backgrounded. Suspending tasks.');
    
    // 1. Force extreme throttling in scheduler
    _scheduler.setScrollVelocity(50000); 
    
    // 2. Clear image cache to free memory for system
    PaintingBinding.instance.imageCache.clear();
    PaintingBinding.instance.imageCache.clearLiveImages();

    // 3. Leave active chat rooms so presence/FCM suppression reflects background state
    try {
      final activeChatId = _ref.read(activeConversationProvider);
      if (activeChatId != null) {
        _ref.read(realtimeCoordinatorProvider.notifier).leaveChat(activeChatId);
        _ref.read(activeConversationProvider.notifier).set(null);
      }
    } catch (e) {
      AppLogger.e('⚠️ [BackgroundGovernor] leaveChat on background failed', error: e);
    }

    // 4. Disconnect socket instantly for clean status updates and battery savings
    try {
      _ref.read(socketServiceProvider.notifier).disconnect();
    } catch (e) {
      AppLogger.e('⚠️ [BackgroundGovernor] Socket disconnection failed', error: e);
    }
  }

  void _handleForeground() {
    AppLogger.d('☀️ [BackgroundGovernor] App foregrounded. Resuming runtime.');

    try {
      _ref.read(authProvider.notifier).syncBanStatus();
    } catch (e) {
      AppLogger.e('⚠️ [BackgroundGovernor] Ban status sync failed', error: e);
    }
    
    // 1. Reset scheduler throttling gradually
    Future.delayed(const Duration(milliseconds: 500), () {
      _scheduler.setScrollVelocity(0);
    });

    // 2. Recover background uploads
    try {
      _ref.read(chatMediaServiceProvider).recoverBackgroundUploads();
    } catch (e) {
      AppLogger.e('⚠️ [BackgroundGovernor] Background upload recovery failed', error: e);
    }

    // 3. Reconnect socket instantly
    try {
      _ref.read(socketServiceProvider.notifier).reconnectWithToken();
    } catch (e) {
      AppLogger.e('⚠️ [BackgroundGovernor] Socket reconnection failed', error: e);
    }
  }
}
