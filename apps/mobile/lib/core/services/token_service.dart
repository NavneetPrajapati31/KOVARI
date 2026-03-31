import '../services/storage/local_storage.dart';

class TokenService {
  static Future<String?> getToken() async {
    return await LocalStorage.getToken();
  }
}