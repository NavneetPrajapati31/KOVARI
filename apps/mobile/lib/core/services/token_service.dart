import 'local_storage.dart';

class TokenService {
  final LocalStorage _localStorage = LocalStorage();

  Future<String?> getToken() async {
    return await _localStorage.getAccessToken();
  }

  Future<String?> getRefreshToken() async {
    return await _localStorage.getRefreshToken();
  }

  Future<void> saveToken(String token) async {
    await _localStorage.saveAccessToken(token);
  }

  Future<void> saveRefreshToken(String token) async {
    await _localStorage.saveRefreshToken(token);
  }

  Future<void> clearToken() async {
    await _localStorage.clear();
  }
}
