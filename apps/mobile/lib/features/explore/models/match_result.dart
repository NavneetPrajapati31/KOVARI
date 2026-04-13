import 'match_user.dart';

/// ⚡ Result wrapper for explore matches with pagination metadata.
class MatchResult {
  final List<MatchUser> matches;
  final bool hasMore;
  final int totalCount;

  MatchResult({
    required this.matches,
    this.hasMore = false,
    this.totalCount = 0,
  });

  /// Empty fallback result
  factory MatchResult.empty() => MatchResult(matches: []);
}
