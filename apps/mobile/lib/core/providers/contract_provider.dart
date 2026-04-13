import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/api_response.dart';

/// 🌐 Global Contract State Notifier
///
/// Tracks the latest API contract health app-wide using the Riverpod 3.x pattern.
///
/// Usage in UI:
///   final state = ref.watch(contractStateProvider);
///   if (state == ContractState.degraded) { showBanner(); }
///
/// Usage in service (to update):
///   ref.read(contractStateProvider.notifier).update(ContractState.degraded);
class ContractStateNotifier extends Notifier<ContractState> {
  @override
  ContractState build() => ContractState.clean;

  void update(ContractState newState) {
    if (state != newState) state = newState;
  }

  void updateFromMeta(ApiMeta meta) {
    if (state != meta.contractState) state = meta.contractState;
  }
}

final contractStateProvider =
    NotifierProvider<ContractStateNotifier, ContractState>(
  ContractStateNotifier.new,
);
