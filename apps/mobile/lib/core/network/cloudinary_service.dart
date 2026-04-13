import 'dart:io';
import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class CloudinaryService {
  final ApiClient _apiClient;
  final Dio _cloudinaryDio;

  CloudinaryService(this._apiClient) : _cloudinaryDio = Dio();

  /// Gets a signed upload signature from the backend
  Future<Map<String, dynamic>> _getSignature(String folder) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      ApiEndpoints.cloudinarySign,
      data: {'folder': folder},
      parser: (data) => data as Map<String, dynamic>,
    );

    if (response.success && response.data != null) {
      return response.data!;
    }
    throw Exception(
      response.error?.message ?? 'Failed to get Cloudinary signature',
    );
  }

  /// Uploads an image file to Cloudinary using a signed request
  Future<Map<String, dynamic>> uploadImage(File file, {String folder = 'kovari-profiles'}) async {
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
        return response.data as Map<String, dynamic>;
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

final cloudinaryServiceProvider = Provider<CloudinaryService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return CloudinaryService(apiClient);
});
