import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/services/auth_service.dart';
import '../../core/network/api_client.dart';
import '../../core/services/local_storage.dart';
import '../../shared/models/kovari_user.dart';

/// Notifier to manage the global authentication state
class AuthStateNotifier extends Notifier<KovariUser?> {
  @override
  KovariUser? build() => null;

  void setUser(KovariUser? user) => state = user;

  Future<void> logout() async {
    final storage = LocalStorage();
    final apiClient = ApiClientFactory.create();
    final authService = AuthService(apiClient, storage);

    // 1. Perform backend & storage logout
    await authService.logout();

    // 2. Reset state (this triggers reactive invalidation of dependent providers)
    state = null;
  }
}

/// Global provider to track the current authenticated user.
/// null = Logged Out
/// not null = Logged In
final authStateProvider =
    NotifierProvider<AuthStateNotifier, KovariUser?>(AuthStateNotifier.new);

/// Specialized provider for logout actions that handles coordinated clearing
final logoutProvider = Provider((ref) => () => ref.read(authStateProvider.notifier).logout());
