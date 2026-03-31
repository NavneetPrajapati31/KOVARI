import 'package:mobile/core/services/local_storage.dart';

class TokenService {
  final LocalStorage _localStorage = LocalStorage();

  Future<String?> getToken() async {
    return await _localStorage.getToken();
  }

  Future<void> saveToken(String token) async {
    await _localStorage.saveToken(token);
  }

  Future<void> clearToken() async {
    await _localStorage.clear();
  }
}
