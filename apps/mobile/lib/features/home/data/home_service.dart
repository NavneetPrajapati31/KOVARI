import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../models/home_data.dart';
import 'package:dio/dio.dart';

class HomeService {
  final ApiClient _apiClient;

  HomeService(this._apiClient);

  Future<HomeData> getHomeData() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.home);
      
      if (response.statusCode == 200) {
        final data = HomeData.fromJson(response.data);
        
        // Debug Logging (Fix 9)
        print("HOME API DATA: ${data.profile.name}");
        
        return data;
      } else {
        throw Exception("Failed to load home data");
      }
    } on DioException catch (e) {
      // Don't leak raw Dio errors (Fix 5)
      print("Home API Error: ${e.message}");
      throw Exception("Failed to load home data");
    } catch (e) {
      print("Unexpected Home Service Error: $e");
      throw Exception("Failed to load home data");
    }
  }
}
