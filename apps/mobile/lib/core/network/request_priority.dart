enum RequestPriority {
  /// Mutations or critical user actions (POST, PUT, DELETE)
  high,

  /// Standard data fetches (GET)
  medium,

  /// Background sync, analytics, or non-critical logs
  low,
}
