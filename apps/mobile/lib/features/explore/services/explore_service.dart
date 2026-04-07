import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../models/explore_state.dart';

class ExploreService {
  final ApiClient _apiClient;

  ExploreService(this._apiClient);

  Future<void> createSession(SearchData searchData, String userId) async {
    final payload = {
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

    await _apiClient.post(ApiEndpoints.exploreSession, data: payload);
  }

  Future<List<dynamic>> matchSolo(String userId, ExploreFilters filters) async {
    final queryParams = {
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

    final response = await _apiClient.get(
      ApiEndpoints.matchSolo,
      queryParameters: queryParams,
    );

    if (response.data is List) {
      return response.data as List<dynamic>;
    } else if (response.data is Map && response.data['matches'] != null) {
      return response.data['matches'] as List<dynamic>;
    }

    return [];
  }

  Future<List<dynamic>> matchGroups(
    String userId,
    SearchData searchData,
    ExploreFilters filters,
  ) async {
    final payload = {
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

    final response = await _apiClient.post(
      ApiEndpoints.matchGroups,
      data: payload,
    );
    return (response.data['groups'] ?? []) as List<dynamic>;
  }

  Future<void> sendInterest({
    required String fromUserId,
    String? toUserId,
    String? toGroupId,
    required String destinationId,
    required bool isSolo,
  }) async {
    final payload = {'fromUserId': fromUserId, 'destinationId': destinationId};

    if (isSolo) {
      payload['toUserId'] = toUserId!;
    } else {
      payload['toGroupId'] = toGroupId!;
    }

    await _apiClient.post(
      isSolo
          ? ApiEndpoints.exploreInterest
          : ApiEndpoints.exploreInterest, // Adjust if different
      data: payload,
    );
  }

  Future<void> skipMatch({
    required String skipperId,
    String? skippedUserId,
    String? skippedGroupId,
    required String destinationId,
    required bool isSolo,
  }) async {
    final payload = {
      'skipperId': skipperId,
      'destinationId': destinationId,
      'type': isSolo ? 'solo' : 'group',
    };

    if (isSolo) {
      payload['skippedUserId'] = skippedUserId!;
    } else {
      // payload['skippedGroupId'] = skippedGroupId!; // Adjust if backend expects this
      payload['toGroupId'] = skippedGroupId!;
    }

    await _apiClient.post(ApiEndpoints.exploreSkip, data: payload);
  }

  Future<void> reportMatch({
    required String reporterId,
    String? reportedUserId,
    String? reportedGroupId,
    required String reason,
    required bool isSolo,
  }) async {
    final payload = {
      'reporterId': reporterId,
      'reason': reason,
      'type': isSolo ? 'solo' : 'group',
    };

    if (isSolo) {
      payload['reportedUserId'] = reportedUserId!;
    } else {
      payload['reportedGroupId'] = reportedGroupId!;
    }

    await _apiClient.post(ApiEndpoints.exploreReport, data: payload);
  }
}

final exploreServiceProvider = Provider<ExploreService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return ExploreService(apiClient);
});
