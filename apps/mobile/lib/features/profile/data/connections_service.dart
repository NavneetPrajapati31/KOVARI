import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/utils/api_error_handler.dart';
import '../models/user_connection.dart';

class ConnectionsService {
  final ApiClient _apiClient;

  ConnectionsService(this._apiClient);

  /// GET /api/profile/[userId]/followers
  Future<List<UserConnection>> getFollowers(String userId) async {
    try {
      final response = await _apiClient.get(ApiEndpoints.followers(userId));
      if (response.statusCode == 200) {
        final List data = response.data as List;
        return data.map((json) => UserConnection.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      throw ApiErrorHandler.extractError(e);
    }
  }

  /// GET /api/profile/[userId]/following
  Future<List<UserConnection>> getFollowing(String userId) async {
    try {
      final response = await _apiClient.get(ApiEndpoints.following(userId));
      if (response.statusCode == 200) {
        final List data = response.data as List;
        return data.map((json) => UserConnection.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      throw ApiErrorHandler.extractError(e);
    }
  }

  /// POST /api/profile/[userId]/followers (Follow)
  Future<void> followUser(String userId) async {
    try {
      await _apiClient.post(ApiEndpoints.follow(userId));
    } catch (e) {
      throw ApiErrorHandler.extractError(e);
    }
  }

  /// DELETE /api/profile/[userId]/following (Unfollow)
  Future<void> unfollowUser(String userId) async {
    try {
      await _apiClient.delete(ApiEndpoints.unfollow(userId));
    } catch (e) {
      throw ApiErrorHandler.extractError(e);
    }
  }

  /// DELETE /api/profile/[userId]/followers (Remove follower)
  Future<void> removeFollower(String userId) async {
    try {
      await _apiClient.delete(ApiEndpoints.removeFollower(userId));
    } catch (e) {
      throw ApiErrorHandler.extractError(e);
    }
  }
}
