import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/utils/api_error_handler.dart';
import '../../../core/utils/safe_parser.dart';
import '../models/user_connection.dart';

class ConnectionsService {
  final ApiClient _apiClient;

  ConnectionsService(this._apiClient);

  /// GET /api/profile/[userId]/followers
  Future<List<UserConnection>> getFollowers(String userId) async {
    try {
      final response = await _apiClient.get<List<UserConnection>>(
        ApiEndpoints.followers(userId),
        parser: (data) => safeParseList(
          data is List ? data : [],
          UserConnection.fromJson,
        ),
      );
      return response.data ?? [];
    } catch (e) {
      throw ApiErrorHandler.extractError(e);
    }
  }

  /// GET /api/profile/[userId]/following
  Future<List<UserConnection>> getFollowing(String userId) async {
    try {
      final response = await _apiClient.get<List<UserConnection>>(
        ApiEndpoints.following(userId),
        parser: (data) => safeParseList(
          data is List ? data : [],
          UserConnection.fromJson,
        ),
      );
      return response.data ?? [];
    } catch (e) {
      throw ApiErrorHandler.extractError(e);
    }
  }

  /// POST /api/profile/[userId]/followers (Follow)
  Future<void> followUser(String userId) async {
    try {
      final response = await _apiClient.post<void>(
        ApiEndpoints.follow(userId),
        parser: (_) {},
      );
      if (!response.success) {
        throw Exception('Failed to follow user');
      }
    } catch (e) {
      throw ApiErrorHandler.extractError(e);
    }
  }

  /// DELETE /api/profile/[userId]/following (Unfollow)
  Future<void> unfollowUser(String userId) async {
    try {
      final response = await _apiClient.delete<void>(
        ApiEndpoints.unfollow(userId),
        parser: (_) {},
      );
      if (!response.success) {
        throw Exception('Failed to unfollow user');
      }
    } catch (e) {
      throw ApiErrorHandler.extractError(e);
    }
  }

  /// DELETE /api/profile/[userId]/followers (Remove follower)
  Future<void> removeFollower(String userId) async {
    try {
      final response = await _apiClient.delete<void>(
        ApiEndpoints.removeFollower(userId),
        parser: (_) {},
      );
      if (!response.success) {
        throw Exception('Failed to remove follower');
      }
    } catch (e) {
      throw ApiErrorHandler.extractError(e);
    }
  }
}
