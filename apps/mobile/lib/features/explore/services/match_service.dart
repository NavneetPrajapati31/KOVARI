import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../models/match_user.dart';

class MatchService {
  final ApiClient _apiClient;

  MatchService(this._apiClient);

  Future<({List<MatchUser> matches, bool hasMore})> getMatches({int page = 1, int limit = 20}) async {
    try {
      final response = await _apiClient.get('match-solo', queryParameters: {
        'page': page,
        'limit': limit,
      });

      if (response.statusCode == 200) {
        final data = response.data;
        if (data != null && data['success'] == true && data['matches'] != null) {
          final List matchesList = data['matches'];
          final bool hasMore = data['hasMore'] ?? false;
          return (
            matches: matchesList
                .where((m) => m != null)
                .map((m) => MatchUser.fromJson(m as Map<String, dynamic>))
                .toList(),
            hasMore: hasMore,
          );
        }
      }
      return (matches: <MatchUser>[], hasMore: false);
    } catch (e) {
      print('Error fetching matches: $e');
      return (matches: <MatchUser>[], hasMore: false);
    }
  }
}

final matchServiceProvider = Provider<MatchService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return MatchService(apiClient);
});
