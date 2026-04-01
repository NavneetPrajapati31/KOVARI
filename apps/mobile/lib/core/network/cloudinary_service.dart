import 'dart:io';
import 'package:dio/dio.dart';
import 'api_client.dart';
import 'api_endpoints.dart';

class CloudinaryService {
  final ApiClient _apiClient;
  final Dio _cloudinaryDio;

  CloudinaryService(this._apiClient) : _cloudinaryDio = Dio();

  /// Gets a signed upload signature from the backend
  Future<Map<String, dynamic>> _getSignature(String folder) async {
    try {
      final response = await _apiClient.post(
        ApiEndpoints.cloudinarySign,
        data: {'folder': folder},
      );

      if (response.statusCode == 200) {
        return response.data as Map<String, dynamic>;
      }
      throw Exception('Failed to get Cloudinary signature');
    } catch (e) {
      rethrow;
    }
  }

  /// Uploads an image file to Cloudinary using a signed request
  Future<String> uploadImage(File file, {String folder = 'kovari-profiles'}) async {
    try {
      // 1. Get signature from our backend
      final signData = await _getSignature(folder);
      
      final String signature = signData['signature'];
      final int timestamp = signData['timestamp'];
      final String apiKey = signData['api_key'];
      final String cloudName = signData['cloud_name'];
      final String targetFolder = signData['folder'];

      // 2. Prepare multipart data for Cloudinary
      final fileName = file.path.split('/').last;
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(file.path, filename: fileName),
        'api_key': apiKey,
        'timestamp': timestamp.toString(),
        'signature': signature,
        'folder': targetFolder,
      });

      // 3. Post directly to Cloudinary
      final uploadUrl = 'https://api.cloudinary.com/v1_1/$cloudName/image/upload';
      final response = await _cloudinaryDio.post(
        uploadUrl,
        data: formData,
        onSendProgress: (sent, total) {
          // Optional: Add progress tracking if needed
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = response.data as Map<String, dynamic>;
        return data['secure_url'] as String;
      }
      
      throw Exception('Cloudinary upload failed with status ${response.statusCode}');
    } catch (e) {
      if (e is DioException) {
        final errorMsg = e.response?.data?['error']?['message'] ?? e.message;
        throw Exception('Cloudinary Upload Error: $errorMsg');
      }
      rethrow;
    }
  }
}
