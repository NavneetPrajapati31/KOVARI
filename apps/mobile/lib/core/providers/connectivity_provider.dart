import 'dart:async';
import 'package:flutter/widgets.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/env.dart';

enum ConnectionStatus { connected, limited, offline }

class ConnectivityState {
  final ConnectionStatus status;
  bool get isConnected => status != ConnectionStatus.offline;
  bool get isLimited => status == ConnectionStatus.limited;
  const ConnectivityState({required this.status});
}

class ConnectivityNotifier extends Notifier<ConnectivityState> with WidgetsBindingObserver {
  final Connectivity _connectivity = Connectivity();
  StreamSubscription? _subscription;
  Timer? _heartbeatTimer;
  final Dio _dio = Dio(BaseOptions(
    connectTimeout: const Duration(seconds: 5),
    receiveTimeout: const Duration(seconds: 5),
  ));

  @override
  ConnectivityState build() {
    WidgetsBinding.instance.addObserver(this);
    
    ref.onDispose(() {
      WidgetsBinding.instance.removeObserver(this);
      _subscription?.cancel();
      _heartbeatTimer?.cancel();
    });

    _init();
    return const ConnectivityState(status: ConnectionStatus.connected);
  }

  void _init() {
    _subscription = _connectivity.onConnectivityChanged.listen((results) {
      if (results.any((r) => r == ConnectivityResult.none)) {
        state = const ConnectivityState(status: ConnectionStatus.offline);
      } else {
        triggerHealthCheck();
      }
    });

    // Passive foreground heartbeat (5 minutes)
    _heartbeatTimer = Timer.periodic(const Duration(minutes: 5), (_) {
      if (state.isConnected && WidgetsBinding.instance.lifecycleState == AppLifecycleState.resumed) {
        triggerHealthCheck();
      }
    });
    
    triggerHealthCheck();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState appState) {
    if (appState == AppLifecycleState.resumed) {
      // 500ms delay to allow network hardware to wake up
      Future.delayed(const Duration(milliseconds: 500), () {
        triggerHealthCheck();
      });
    }
  }

  /// Triggers an immediate health check
  Future<void> triggerHealthCheck() async {
    try {
      final response = await _dio.get('${Env.apiBaseUrl}health');
      if (response.statusCode == 200) {
        if (!state.isConnected || state.isLimited) {
          state = const ConnectivityState(status: ConnectionStatus.connected);
        }
      } else {
        // Connected to network, but backend is unreachable / throwing errors -> limited
        if (state.status != ConnectionStatus.limited) {
          state = const ConnectivityState(status: ConnectionStatus.limited);
        }
      }
    } catch (_) {
      // DioError (timeout, connection refused)
      if (state.status != ConnectionStatus.offline) {
        state = const ConnectivityState(status: ConnectionStatus.offline);
      }
    }
  }
}

final connectivityProvider = NotifierProvider<ConnectivityNotifier, ConnectivityState>(() {
  return ConnectivityNotifier();
});
