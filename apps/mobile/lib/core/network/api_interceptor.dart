import 'package:mobile/core/services/token_service.dart';

class ApiInterceptor {
  final TokenService _tokenService = TokenService();
  Future<Map<String, String>> getHeaders() async {
    final token = await _tokenService.getToken();

    return {
      "Content-Type": "application/json",
      if (token != null) "Authorization": "Bearer $token",
    };
  }
}
