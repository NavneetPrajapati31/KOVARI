import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../cache/local_cache.dart';

final localCacheProvider = Provider<LocalCache>((ref) {
  return LocalCache();
});

// Helper to initialize cache during app startup
final cacheInitProvider = FutureProvider<void>((ref) async {
  final cache = ref.read(localCacheProvider);
  await cache.init();
});
