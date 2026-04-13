import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/models/api_response.dart';
import '../../../core/providers/contract_provider.dart';
import '../../../core/utils/safe_parser.dart';
import '../models/explore_state.dart';
import '../models/match_result.dart';
import '../models/match_user.dart';

class ExploreService {
  final ApiClient _apiClient;
  final Ref _ref;

  ExploreService(this._apiClient, this._ref);

  Future<void> createSession(SearchData searchData, String userId) async {
    final Map<String, dynamic> payload = {
      'userId': userId,
      'destinationName': searchData.destination,
      'budget': searchData.budget,
      'startDate': searchData.startDate.toIso8601String().split('T')[0],
      'endDate': searchData.endDate.toIso8601String().split('T')[0],
      'travelMode': searchData.travelMode == TravelMode.solo ? 'solo' : 'group',
    };

    if (searchData.destinationDetails != null) {
      payload['destination'] = {
        'name':
            searchData.destinationDetails!['formatted'] ??
            searchData.destination,
        'lat': searchData.destinationDetails!['lat'],
        'lon': searchData.destinationDetails!['lon'],
        'city': searchData.destinationDetails!['city'],
        'country': searchData.destinationDetails!['country'],
      };
    }

    // Fire-and-forget: session creation failure is non-critical
    await _apiClient.post<void>(
      ApiEndpoints.exploreSession,
      data: payload,
      parser: (_) {},
    );
  }

  Future<MatchResult> matchSolo(
    String userId,
    ExploreFilters filters,
  ) async {
    final queryParams = <String, dynamic>{
      'userId': userId,
      'ageMin': filters.ageRange[0].toString(),
      'ageMax': filters.ageRange[1].toString(),
      'gender': filters.gender,
      'personality': filters.personality,
      'smoking': filters.smoking.toLowerCase(),
      'drinking': filters.drinking.toLowerCase(),
      'nationality': filters.nationality,
    };

    if (filters.interests.isNotEmpty) {
      queryParams['interests'] = filters.interests.join(',');
    }
    if (filters.languages.isNotEmpty) {
      queryParams['languages'] = filters.languages.join(',');
    }

    final response = await _apiClient.get<MatchResult>(
      ApiEndpoints.matchSolo,
      queryParameters: queryParams,
      parser: (data) {
        if (data is! Map<String, dynamic>) return MatchResult.empty();
        final rawList = data['matches'] ?? data['data'] ?? [];
        return MatchResult(
          matches: safeParseList<MatchUser>(rawList, MatchUser.fromJson),
          hasMore: data['hasMore'] as bool? ?? false,
          totalCount: data['total'] as int? ?? 0,
        );
      },
    );

    _updateContractState(response.meta);

    return response.data ?? MatchResult.empty();
  }

  Future<MatchResult> matchGroups(
    String userId,
    SearchData searchData,
    ExploreFilters filters,
  ) async {
    final Map<String, dynamic> payload = {
      'userId': userId,
      'destination': searchData.destination,
      'budget': searchData.budget,
      'startDate': searchData.startDate.toIso8601String().split('T')[0],
      'endDate': searchData.endDate.toIso8601String().split('T')[0],
      'ageMin': filters.ageRange[0],
      'ageMax': filters.ageRange[1],
      'languages': filters.languages,
      'interests': filters.interests,
      'smoking': filters.smoking == 'Yes',
      'drinking': filters.drinking == 'Yes',
      'nationality': filters.nationality != 'Any'
          ? filters.nationality
          : 'Unknown',
    };

    if (searchData.destinationDetails != null) {
      payload['lat'] = searchData.destinationDetails!['lat'];
      payload['lon'] = searchData.destinationDetails!['lon'];
    }

    final response = await _apiClient.post<MatchResult>(
      ApiEndpoints.matchGroups,
      data: payload,
      parser: (data) {
        if (data is! Map<String, dynamic>) return MatchResult.empty();
        final rawList = data['groups'] ?? data['data'] ?? [];
        return MatchResult(
          matches: safeParseList<MatchUser>(rawList, MatchUser.fromJson),
          hasMore: data['hasMore'] as bool? ?? false,
          totalCount: data['total'] as int? ?? 0,
        );
      },
    );

    _updateContractState(response.meta);

    return response.data ?? MatchResult.empty();
  }

  Future<void> sendInterest({
    required String fromUserId,
    String? toUserId,
    String? toGroupId,
    required String destinationId,
    required bool isSolo,
  }) async {
    final Map<String, dynamic> payload = {
      'fromUserId': fromUserId,
      'destinationId': destinationId,
    };
    if (isSolo) {
      payload['toUserId'] = toUserId!;
    } else {
      payload['toGroupId'] = toGroupId!;
    }
    await _apiClient.post<void>(
      ApiEndpoints.exploreInterest,
      data: payload,
      parser: (_) {},
    );
  }

  Future<void> skipMatch({
    required String skipperId,
    String? skippedUserId,
    String? skippedGroupId,
    required String destinationId,
    required bool isSolo,
  }) async {
    final Map<String, dynamic> payload = {
      'skipperId': skipperId,
      'destinationId': destinationId,
      'type': isSolo ? 'solo' : 'group',
    };
    if (isSolo) {
      payload['skippedUserId'] = skippedUserId!;
    } else {
      payload['toGroupId'] = skippedGroupId!;
    }
    await _apiClient.post<void>(
      ApiEndpoints.exploreSkip,
      data: payload,
      parser: (_) {},
    );
  }

  Future<void> reportMatch({
    required String reporterId,
    String? reportedUserId,
    String? reportedGroupId,
    required String reason,
    required bool isSolo,
  }) async {
    final Map<String, dynamic> payload = {
      'reporterId': reporterId,
      'reason': reason,
      'type': isSolo ? 'solo' : 'group',
    };
    if (isSolo) {
      payload['reportedUserId'] = reportedUserId!;
    } else {
      payload['reportedGroupId'] = reportedGroupId!;
    }
    await _apiClient.post<void>(
      ApiEndpoints.exploreReport,
      data: payload,
      parser: (_) {},
    );
  }

  void _updateContractState(ApiMeta meta) {
    _ref.read(contractStateProvider.notifier).update(meta.contractState);
  }
}

final exploreServiceProvider = Provider<ExploreService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return ExploreService(apiClient, ref);
});
