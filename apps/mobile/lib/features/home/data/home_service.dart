import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../models/home_data.dart';

class HomeService {
  final ApiClient _apiClient;

  HomeService(this._apiClient);

  Future<HomeData> getHomeData() async {
    final response = await _apiClient.get<HomeData>(
      ApiEndpoints.home,
      parser: (data) => HomeData.fromJson(data),
    );

    if (response.success && response.data != null) {
      return response.data!;
    }

    throw Exception(response.error?.message ?? "Failed to load home data");
  }
}
