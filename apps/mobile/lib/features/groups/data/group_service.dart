import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../models/group.dart';

class GroupService {
  final ApiClient _apiClient;

  GroupService(this._apiClient);

  Future<List<Group>> getMyGroups() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.myGroups);
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] as List<dynamic>;
        return data.map((json) => Group.fromJson(json as Map<String, dynamic>)).toList();
      }
      return [];
    } catch (e) {
      print('Error fetching my groups: $e');
      rethrow;
    }
  }
}
