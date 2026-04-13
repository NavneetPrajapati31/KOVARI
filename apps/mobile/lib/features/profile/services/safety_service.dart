import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/utils/safe_parser.dart';
import '../models/safety_report.dart';

class SafetyService {
  final ApiClient _apiClient;

  SafetyService(this._apiClient);

  Future<List<SafetyReport>> fetchMyReports() async {
    final response = await _apiClient.get<List<SafetyReport>>(
      'reports/my-reports',
      parser: (data) {
        final List<dynamic> reportsJson =
            data is Map<String, dynamic> ? (data['reports'] ?? []) : [];
        return safeParseList(reportsJson, SafetyReport.fromJson);
      },
    );
    return response.data ?? [];
  }

  Future<List<SafetyTarget>> searchTargets(String type, String query) async {
    final response = await _apiClient.get<List<SafetyTarget>>(
      'reports/targets',
      queryParameters: {'type': type, 'q': query},
      parser: (data) {
        final List<dynamic> targetsJson =
            data is Map<String, dynamic> ? (data['targets'] ?? []) : [];
        return safeParseList(targetsJson, SafetyTarget.fromJson);
      },
    );
    return response.data ?? [];
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

    final response = await _apiClient.post<Map<String, dynamic>>(
      'flags',
      data: payload,
      parser: (data) => data is Map<String, dynamic> ? data : {},
    );
    return response.data ?? {};
  }
}

final safetyServiceProvider = Provider<SafetyService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return SafetyService(apiClient);
});
