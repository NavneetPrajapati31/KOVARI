import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/providers/contract_provider.dart';
import '../../../core/utils/safe_parser.dart';
import '../models/match_result.dart';
import '../models/match_user.dart';

/// 🛡️ Match Service — typed, safe, crash-proof
///
/// Returns only typed models to UI providers.
/// Errors, timeouts, and malformed data are absorbed here.
class MatchService {
  final ApiClient _apiClient;
  final Ref _ref;

  MatchService(this._apiClient, this._ref);

  Future<MatchResult> getMatches({int page = 1, int limit = 20}) async {
    final response = await _apiClient.get<MatchResult>(
      'match-solo',
      queryParameters: {'page': page, 'limit': limit},
      parser: (data) {
        if (data is! Map<String, dynamic>) return MatchResult.empty();

        final rawList = data['matches'] ?? data['data'] ?? [];
        final hasMore = data['hasMore'] as bool? ?? false;
        final total = data['total'] as int? ?? 0;

        return MatchResult(
          matches: safeParseList<MatchUser>(rawList, MatchUser.fromJson),
          hasMore: hasMore,
          totalCount: total,
        );
      },
    );

    _ref
        .read(contractStateProvider.notifier)
        .update(response.meta.contractState);

    return response.data ?? MatchResult.empty();
  }

  Future<MatchResult> getGroupMatches({
    int page = 1,
    int limit = 20,
  }) async {
    final response = await _apiClient.get<MatchResult>(
      'match-groups',
      queryParameters: {'page': page, 'limit': limit},
      parser: (data) {
        if (data is! Map<String, dynamic>) return MatchResult.empty();

        final rawList = data['groups'] ?? data['data'] ?? [];
        final hasMore = data['hasMore'] as bool? ?? false;
        final total = data['total'] as int? ?? 0;

        return MatchResult(
          matches: safeParseList<MatchUser>(rawList, MatchUser.fromJson),
          hasMore: hasMore,
          totalCount: total,
        );
      },
    );

    _ref
        .read(contractStateProvider.notifier)
        .update(response.meta.contractState);

    return response.data ?? MatchResult.empty();
  }
}

final matchServiceProvider = Provider<MatchService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return MatchService(apiClient, ref);
});
