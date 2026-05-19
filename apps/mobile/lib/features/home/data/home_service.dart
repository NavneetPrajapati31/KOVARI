import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/core/network/api_endpoints.dart';
import 'package:mobile/features/home/models/home_data.dart';

class HomeService {
  HomeService(this._apiClient);
  final ApiClient _apiClient;

  Future<HomeData> getHomeData({bool ignoreCache = false}) async {
    final response = await _apiClient.get<HomeData>(
      ApiEndpoints.home,
      parser: parseHomeData,
      ignoreCache: ignoreCache,
    );

    if (response.success && response.data != null) {
      return response.data!;
    }

    throw Exception(response.error?.message ?? 'Failed to load home data');
  }

  HomeData parseHomeData(dynamic data) {
    // Standard response envelope handling
    final actualData = (data is Map && data.containsKey('data'))
        ? data['data']
        : data;
    return HomeData.fromJson(actualData as Map<String, dynamic>);
  }
}
