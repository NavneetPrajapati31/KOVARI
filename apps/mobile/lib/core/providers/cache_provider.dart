import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/cache/local_cache.dart';

final localCacheProvider = Provider<LocalCache>((ref) => LocalCache());

// Helper to initialize cache during app startup
final cacheInitProvider = FutureProvider<void>((ref) async {
  final cache = ref.read(localCacheProvider);
  await cache.init();
});
