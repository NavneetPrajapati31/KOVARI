import 'dart:convert';
import 'package:hive/hive.dart';
import '../utils/app_logger.dart';

class CacheEntry {
  final dynamic data;
  final DateTime timestamp;
  final Duration ttl;
  final int version;

  CacheEntry({
    required this.data,
    required this.timestamp,
    required this.ttl,
    required this.version,
  });

  bool get isExpired => DateTime.now().isAfter(timestamp.add(ttl));

  Map<String, dynamic> toJson() => {
        'data': data,
        'timestamp': timestamp.toIso8601String(),
        'ttl': ttl.inSeconds,
        'version': version,
      };

  factory CacheEntry.fromJson(Map<String, dynamic> json) => CacheEntry(
        data: json['data'],
        timestamp: DateTime.parse(json['timestamp']),
        ttl: Duration(seconds: json['ttl']),
        version: json['version'] ?? 0,
      );
}

class LocalCache {
  static const String _boxName = 'api_cache_v1';
  static const int _currentVersion = 1;
  static const int _maxEntries = 100; // LRU limit

  static Box<String>? _box;
  final Map<String, CacheEntry> _memoryCache = {};

  Future<void> init() async {
    try {
      _box = await Hive.openBox<String>(_boxName);
      AppLogger.i('LocalCache initialized with ${_box?.length} entries');
      _checkVersion();
    } catch (e) {
      AppLogger.e('Failed to initialize Hive box: $e');
      await Hive.deleteBoxFromDisk(_boxName);
      _box = await Hive.openBox<String>(_boxName);
    }
  }

  void _checkVersion() {
    final storedVersion = _box?.get('__cache_version_key__');
    if (storedVersion == null || int.tryParse(storedVersion) != _currentVersion) {
      AppLogger.w('Cache version mismatch. Clearing cache...');
      clearAll();
      _box?.put('__cache_version_key__', _currentVersion.toString());
    }
  }

  String _generateKey(String endpoint, Map<String, dynamic>? params) {
    if (params == null || params.isEmpty) return endpoint;
    final sortedParams = Map.fromEntries(
      params.entries.toList()..sort((a, b) => a.key.compareTo(b.key)),
    );
    return '$endpoint:${jsonEncode(sortedParams)}';
  }

  Future<void> set(
    String endpoint,
    dynamic data, {
    Map<String, dynamic>? params,
    Duration ttl = const Duration(hours: 1),
  }) async {
    final key = _generateKey(endpoint, params);
    final entry = CacheEntry(
      data: data,
      timestamp: DateTime.now(),
      ttl: ttl,
      version: _currentVersion,
    );

    _memoryCache[key] = entry;
    
    try {
      if (_box != null) {
        // LRU Eviction
        if (_box!.length >= _maxEntries && !_box!.containsKey(key)) {
          final oldestKey = _box!.keys.firstWhere((k) => k != '__cache_version_key__');
          await _box!.delete(oldestKey);
        }
        await _box!.put(key, jsonEncode(entry.toJson()));
      }
    } catch (e) {
      AppLogger.e('Failed to save to Hive: $e');
    }
  }

  CacheEntry? get(String endpoint, {Map<String, dynamic>? params}) {
    final key = _generateKey(endpoint, params);

    // 1. Memory Cache
    if (_memoryCache.containsKey(key)) {
      final entry = _memoryCache[key]!;
      if (!entry.isExpired) return entry;
      _memoryCache.remove(key);
    }

    // 2. Disk Cache
    try {
      final stored = _box?.get(key);
      if (stored != null) {
        final entry = CacheEntry.fromJson(jsonDecode(stored));
        if (!entry.isExpired && entry.version == _currentVersion) {
          _memoryCache[key] = entry;
          return entry;
        } else {
          _box?.delete(key);
        }
      }
    } catch (e) {
      AppLogger.e('Failed to read from Hive: $e');
      _box?.delete(key);
    }

    return null;
  }

  Future<void> invalidate(String endpoint, {Map<String, dynamic>? params}) async {
    final key = _generateKey(endpoint, params);
    _memoryCache.remove(key);
    await _box?.delete(key);
  }

  Future<void> clearAll() async {
    _memoryCache.clear();
    await _box?.clear();
    await _box?.put('__cache_version_key__', _currentVersion.toString());
  }
}
