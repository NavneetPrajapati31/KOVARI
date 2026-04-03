import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/home_service.dart';
import '../models/home_data.dart';
import '../../../core/network/api_client.dart';
import '../../../core/providers/auth_provider.dart';

final homeServiceProvider = Provider<HomeService>((ref) {
  final apiClient = ApiClientFactory.create();
  return HomeService(apiClient);
});

final homeDataProvider = AsyncNotifierProvider<HomeDataNotifier, HomeData>(() {
  return HomeDataNotifier();
});

class HomeDataNotifier extends AsyncNotifier<HomeData> {
  @override
  Future<HomeData> build() async {
    // Watch auth state to trigger re-build on login/logout
    ref.watch(authStateProvider);
    
    return ref.read(homeServiceProvider).getHomeData();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => ref.read(homeServiceProvider).getHomeData());
  }
}
