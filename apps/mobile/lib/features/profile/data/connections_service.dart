import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/core/network/api_endpoints.dart';
import 'package:mobile/core/utils/api_error_handler.dart';
import 'package:mobile/core/utils/safe_parser.dart';
import 'package:mobile/features/profile/models/user_connection.dart';

class ConnectionsService {

  ConnectionsService(this._apiClient);
  final ApiClient _apiClient;

  /// GET /api/profile/[userId]/followers
  Future<List<UserConnection>> getFollowers(String userId, {int limit = 20, int offset = 0}) async {
    try {
      final response = await _apiClient.get<List<UserConnection>>(
        ApiEndpoints.followers(userId),
        queryParameters: {
          'limit': limit,
          'offset': offset,
        },
        parser: (data) => safeParseList(
          data is List ? data : <dynamic>[],
          UserConnection.fromJson,
        ),
      );
      return response.data ?? [];
    } catch (e) {
      throw ApiErrorHandler.extractError(e);
    }
  }

  /// GET /api/profile/[userId]/following
  Future<List<UserConnection>> getFollowing(String userId, {int limit = 20, int offset = 0}) async {
    try {
      final response = await _apiClient.get<List<UserConnection>>(
        ApiEndpoints.following(userId),
        queryParameters: {
          'limit': limit,
          'offset': offset,
        },
        parser: (data) => safeParseList(
          data is List ? data : <dynamic>[],
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
