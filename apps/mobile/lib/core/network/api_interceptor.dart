import '../services/token_service.dart';

class ApiInterceptor {
  static Future<Map<String, String>> getHeaders() async {
    final token = await TokenService.getToken();

    return {
      "Content-Type": "application/json",
      if (token != null) "Authorization": "Bearer $token",
    };
  }
}