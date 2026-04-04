import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../models/safety_report.dart';

class SafetyService {
  final ApiClient _apiClient;

  SafetyService(this._apiClient);

  Future<List<SafetyReport>> fetchMyReports() async {
    final response = await _apiClient.get('reports/my-reports');
    final List<dynamic> reportsJson = response.data['reports'] ?? [];
    return reportsJson.map((json) => SafetyReport.fromJson(json)).toList();
  }

  Future<List<SafetyTarget>> searchTargets(String type, String query) async {
    final response = await _apiClient.get(
      'reports/targets',
      queryParameters: {'type': type, 'q': query},
    );
    final List<dynamic> targetsJson = response.data['targets'] ?? [];
    return targetsJson.map((json) => SafetyTarget.fromJson(json)).toList();
  }

  Future<Map<String, dynamic>> submitReport({
    required String targetType,
    required String targetId,
    required String reason,
    String? evidenceUrl,
    String? evidencePublicId,
  }) async {
    final payload = {
      'targetType': targetType,
      'targetId': targetId,
      'reason': reason,
      'evidenceUrl': evidenceUrl,
      'evidencePublicId': evidencePublicId,
    };

    final response = await _apiClient.post('flags', data: payload);
    return response.data;
  }
}

final safetyServiceProvider = Provider<SafetyService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return SafetyService(apiClient);
});
