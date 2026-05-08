import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'runtime_coordinator.dart';
import 'background_governor.dart';
import 'package:flutter/widgets.dart';

final runtimeInitProvider = FutureProvider<void>((ref) async {
  final replayEngine = ref.read(replayEngineProvider);
  await replayEngine.init();

  final scheduler = ref.read(runtimeSchedulerProvider);
  final governor = BackgroundGovernor(scheduler, replayEngine);
  WidgetsBinding.instance.addObserver(governor);

  ref.onDispose(() => WidgetsBinding.instance.removeObserver(governor));
});
