import 'package:flutter/widgets.dart';
import 'package:mobile/core/runtime/replay_engine.dart';
import 'package:mobile/core/runtime/runtime_scheduler.dart';
import 'package:mobile/core/utils/app_logger.dart';

class BackgroundGovernor extends WidgetsBindingObserver {

  BackgroundGovernor(this._scheduler, this._replayEngine);
  final RuntimeScheduler _scheduler;
  final ReplayEngine _replayEngine;

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    switch (state) {
      case AppLifecycleState.paused:
      case AppLifecycleState.inactive:
        _handleBackground();
        break;
      case AppLifecycleState.resumed:
        _handleForeground();
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
    
    // 3. Flush ReplayEngine to disk
    // _replayEngine.flush(); // Assuming flush exists or just ensure persistence is called
  }

  void _handleForeground() {
    AppLogger.d('☀️ [BackgroundGovernor] App foregrounded. Resuming runtime.');
    
    // 1. Reset scheduler throttling gradually
    Future.delayed(const Duration(milliseconds: 500), () {
      _scheduler.setScrollVelocity(0);
    });
    
    // 2. Trigger re-hydration for active entities
    // This is handled by Riverpod's provider lifecycle usually, 
    // but we could trigger a refresh here if needed.
  }
}
