import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:mobile/features/home/models/home_state.dart';
import '../data/home_service.dart';
import '../models/home_data.dart';
import '../../../core/network/api_client.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/cache_provider.dart';
import '../../../core/network/api_endpoints.dart';

final homeServiceProvider = Provider<HomeService>((ref) {
  final apiClient = ref.read(apiClientProvider);
  return HomeService(apiClient);
});

final homeDataProvider = StateNotifierProvider<HomeDataNotifier, HomeState>((
  ref,
) {
  ref.watch(authStateProvider);
  return HomeDataNotifier(ref);
});

class HomeDataNotifier extends StateNotifier<HomeState> {
  final Ref _ref;
  HomeDataNotifier(this._ref) : super(HomeState()) {
    _init();
  }

  Future<void> _init() async {
    await refresh(isInitial: true);
  }

  Future<void> refresh({bool isInitial = false}) async {
    final cache = _ref.read(localCacheProvider);
    final service = _ref.read(homeServiceProvider);

    // 1. Try Cache First
    final cached = cache.get(ApiEndpoints.home);
    if (cached != null) {
      state = state.copyWith(
        data: service.parseHomeData(cached.data),
        isStale: true,
        isLoading:
            isInitial, // Only show main loading if we don't have cached data yet
      );
    } else {
      state = state.copyWith(isLoading: true);
    }

    // 2. Fetch Fresh Data
    try {
      final freshData = await service.getHomeData();
      state = state.copyWith(
        data: freshData,
        isStale: false,
        isLoading: false,
        error: null,
      );
    } catch (e) {
      if (state.data == null) {
        state = state.copyWith(error: e.toString(), isLoading: false);
      } else {
        // We have cached data, just clear stale/loading and maybe show a snackbar (handled in UI)
        state = state.copyWith(isStale: false, isLoading: false);
      }
    }
  }
}
