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

        // 🏛️ Handle standardized { success, data: { matches: [...] } }
        final envelope = data['data'] ?? data;
        final rawList = envelope['matches'] ?? envelope['data'] ?? [];
        final hasMore = envelope['hasMore'] as bool? ?? false;
        final total = envelope['total'] as int? ?? 0;

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
    Map<String, dynamic>? filters,
  }) async {
    final response = await _apiClient.post<MatchResult>(
      'match-groups',
      data: {
        'page': page,
        'limit': limit,
        if (filters != null) ...filters,
      },
      parser: (data) {
        if (data is! Map<String, dynamic>) return MatchResult.empty();

        // 🏛️ Handle standardized { success, data: { groups: [...] } }
        final envelope = data['data'] ?? data;
        final rawList = envelope['groups'] ?? envelope['data'] ?? [];
        final hasMore = envelope['hasMore'] as bool? ?? false;
        final total = envelope['total'] as int? ?? 0;

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
