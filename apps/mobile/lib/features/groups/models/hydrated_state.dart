import 'package:flutter/foundation.dart';

enum HydrationSource {
  initial,    // Empty/Initial state
  memory,     // Instant runtime snapshot
  disk,       // Hive/Persistence hit
  network,    // Fresh backend data
  stale,      // Expired but available fallback
  error,      // Failed to hydrate
}

@immutable
class HydratedState<T> {

  HydratedState({
    this.data,
    this.source = HydrationSource.initial,
    this.isHydrating = false,
    DateTime? lastModifiedAt,
    this.isOptimistic = false,
    this.lastUpdatedAt,
    this.error,
    this.version = 0,
  }) : lastModifiedAt = lastModifiedAt ?? DateTime.now();
  final T? data;
  final HydrationSource source;
  final bool isHydrating;
  final DateTime lastModifiedAt;
  final bool isOptimistic;
  final DateTime? lastUpdatedAt;
  final String? error;
  final int version;

  bool get hasData => data != null;
  bool get isStale => source == HydrationSource.stale;
  bool get isFromCache => source == HydrationSource.memory || source == HydrationSource.disk;

  HydratedState<T> copyWith({
    T? data,
    HydrationSource? source,
    bool? isHydrating,
    DateTime? lastModifiedAt,
    bool? isOptimistic,
    DateTime? lastUpdatedAt,
    String? error,
    int? version,
  }) => HydratedState<T>(
      data: data ?? this.data,
      source: source ?? this.source,
      isHydrating: isHydrating ?? this.isHydrating,
      lastModifiedAt: lastModifiedAt ?? this.lastModifiedAt,
      isOptimistic: isOptimistic ?? this.isOptimistic,
      lastUpdatedAt: lastUpdatedAt ?? this.lastUpdatedAt,
      error: error ?? this.error,
      version: version ?? this.version,
    );

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is HydratedState<T> &&
          runtimeType == other.runtimeType &&
          data == other.data &&
          source == other.source &&
          isHydrating == other.isHydrating &&
          version == other.version;

  @override
  int get hashCode =>
      Object.hash(data, source, isHydrating, version);
}
