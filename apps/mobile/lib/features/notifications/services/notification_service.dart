import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../models/notification_model.dart';

class NotificationService {
  final ApiClient _apiClient;

  NotificationService(this._apiClient);

  Future<List<NotificationModel>> fetchNotifications({
    int limit = 50,
    int offset = 0,
    bool unreadOnly = false,
  }) async {
    final response = await _apiClient.get(
      ApiEndpoints.notifications,
      queryParameters: {
        'limit': limit,
        'offset': offset,
        if (unreadOnly) 'unreadOnly': true,
      },
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = response.data['notifications'] ?? [];
      return data.map((json) => NotificationModel.fromJson(json)).toList();
    } else {
      throw Exception('Failed to fetch notifications');
    }
  }

  Future<int> fetchUnreadCount() async {
    final response = await _apiClient.get(ApiEndpoints.notificationsUnreadCount);
    if (response.statusCode == 200) {
      return response.data['count'] ?? 0;
    } else {
      throw Exception('Failed to fetch unread count');
    }
  }

  Future<void> markAsRead(String notificationId) async {
    final response = await _apiClient.patch(
      ApiEndpoints.notificationMarkRead(notificationId),
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to mark notification as read');
    }
  }

  Future<int> markAllAsRead() async {
    final response = await _apiClient.post(ApiEndpoints.notificationsMarkAllRead);
    if (response.statusCode == 200) {
      return response.data['updatedCount'] ?? 0;
    } else {
      throw Exception('Failed to mark all notifications as read');
    }
  }
}
