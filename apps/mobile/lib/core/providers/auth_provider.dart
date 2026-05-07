import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../auth/auth_repository.dart';
import '../auth/session_manager.dart';
import '../auth/token_storage.dart';
import '../../shared/models/kovari_user.dart';
import 'dart:convert';

class AuthState {
  final KovariUser? user;
  final bool isAuthenticated;
  final bool isDegraded;
  final bool isRefreshing;
  final bool isBootstrapping;

  AuthState({
    this.user,
    this.isAuthenticated = false,
    this.isDegraded = false,
    this.isRefreshing = false,
    this.isBootstrapping = true,
  });

  AuthState copyWith({
    KovariUser? user,
    bool? isAuthenticated,
    bool? isDegraded,
    bool? isRefreshing,
    bool? isBootstrapping,
  }) {
    return AuthState(
      user: user ?? this.user,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isDegraded: isDegraded ?? this.isDegraded,
      isRefreshing: isRefreshing ?? this.isRefreshing,
      isBootstrapping: isBootstrapping ?? this.isBootstrapping,
    );
  }
}

class AuthNotifier extends Notifier<AuthState> {
  @override
  AuthState build() {
    // We don't initialize here because we need to await ensureSessionReady
    // The main app will call init()
    return AuthState();
  }

  Future<void> init() async {
    final repo = ref.read(authRepositoryProvider);
    final session = ref.read(sessionManagerProvider);
    final storage = TokenStorage();

    // Single source of truth sync
    session.setOnStateChanged(syncSessionState);

    await repo.ensureSessionReady();

    final userJson = await storage.getUserData();
    KovariUser? user;
    if (userJson != null) {
      try {
        user = KovariUser.fromJson(jsonDecode(userJson));
      } catch (_) {}
    }

    state = state.copyWith(
      user: user,
      isAuthenticated: session.isAuthenticated,
      isDegraded: session.isDegraded,
      isRefreshing: session.isRefreshing,
      isBootstrapping: false,
    );
  }

  void setUser(KovariUser? user) {
    state = state.copyWith(user: user, isAuthenticated: user != null);
  }

  Future<void> logout() async {
    final repo = ref.read(authRepositoryProvider);
    await repo.logout(reason: 'USER_INITIATED');
    state = AuthState(isBootstrapping: false);
  }

  void syncSessionState() {
    final session = ref.read(sessionManagerProvider);
    if (state.isDegraded != session.isDegraded || 
        state.isRefreshing != session.isRefreshing ||
        state.isAuthenticated != session.isAuthenticated) {
      state = state.copyWith(
        isDegraded: session.isDegraded,
        isRefreshing: session.isRefreshing,
        isAuthenticated: session.isAuthenticated,
      );
    }
  }
}

final authProvider = NotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);

/// Legacy compatibility provider if needed
final authStateProvider = Provider<KovariUser?>((ref) => ref.watch(authProvider).user);

final logoutProvider = Provider((ref) => () => ref.read(authProvider.notifier).logout());
