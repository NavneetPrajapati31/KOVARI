import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../cache/local_cache.dart';
import '../providers/cache_provider.dart';
import '../providers/connectivity_provider.dart';
import '../utils/app_logger.dart';
import 'api_client.dart';

enum SyncStatus { idle, syncing, error }

class SyncEngine {
  final Ref _ref;
  final LocalCache _cache;
  final ApiClient _apiClient;

  SyncEngine(this._ref)
      : _cache = _ref.read(localCacheProvider),
        _apiClient = _ref.read(apiClientProvider);

  /// Performs a Stale-While-Revalidate fetch.
  /// 1. Immediately returns cached data if available.
  /// 2. Triggers a background fetch to update the cache.
  /// 3. If network fails, the caller already has the cached data.
  Future<T?> swrFetch<T>({
    required String path,
    required T Function(dynamic) parser,
    Map<String, dynamic>? queryParameters,
    Duration ttl = const Duration(hours: 1),
    Function(T data)? onUpdate,
  }) async {
    // 1. Try Cache First
    final cached = _cache.get(path, params: queryParameters);
    if (cached != null) {
      AppLogger.d('📦 [SWR] Cache hit for $path');
      final data = parser(cached.data is Map && (cached.data as Map).containsKey('data') 
          ? (cached.data as Map)['data'] 
          : cached.data);
      
      // Trigger background refresh if online
      if (_ref.read(connectivityProvider).isOnline) {
        _backgroundFetch(path, parser, queryParameters, ttl, onUpdate);
      }
      
      return data;
    }

    // 2. If no cache, perform standard fetch
    AppLogger.d('🌐 [SWR] No cache for $path, performing initial fetch');
    final response = await _apiClient.get(
      path,
      queryParameters: queryParameters,
      parser: parser,
      ttl: ttl,
    );

    if (response.success && response.data != null) {
      return response.data;
    }
    
    return null;
  }

  void _backgroundFetch<T>(
    String path,
    T Function(dynamic) parser,
    Map<String, dynamic>? queryParameters,
    Duration ttl,
    Function(T data)? onUpdate,
  ) {
    // Silent background update
    unawaited(() async {
      try {
        final response = await _apiClient.get(
          path,
          queryParameters: queryParameters,
          parser: parser,
          ttl: ttl,
          ignoreCache: true, // Force network fetch
        );

        if (response.success) {
          final data = response.data;
          if (data != null) {
            AppLogger.d('🔄 [SWR] Background refresh successful for $path');
            onUpdate?.call(data);
          }
        }
      } catch (e) {
        AppLogger.w('⚠️ [SWR] Background refresh failed for $path: $e');
      }
    }());
  }

  /// Explicitly syncs a set of critical resources
  Future<void> syncCriticalData() async {
    AppLogger.i('🚀 SyncEngine: Starting critical data sync...');
    // Add logic to sync profile, matches, groups etc.
  }
}

final syncEngineProvider = Provider<SyncEngine>((ref) {
  return SyncEngine(ref);
});
