import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/utils/safe_parser.dart';
import '../models/notification_model.dart';

class NotificationService {
  final ApiClient _apiClient;

  NotificationService(this._apiClient);

  Future<List<NotificationModel>> fetchNotifications({
    int limit = 50,
    int offset = 0,
    bool unreadOnly = false,
  }) async {
    final response = await _apiClient.get<List<NotificationModel>>(
      ApiEndpoints.notifications,
      queryParameters: {
        'limit': limit,
        'offset': offset,
        if (unreadOnly) 'unreadOnly': true,
      },
      parser: (data) {
        final List<dynamic> rawList =
            data is Map<String, dynamic> ? (data['notifications'] ?? []) : [];
        return safeParseList(rawList, NotificationModel.fromJson);
      },
    );

    return response.data ?? [];
  }

  Future<int> fetchUnreadCount() async {
    final response = await _apiClient.get<int>(
      ApiEndpoints.notificationsUnreadCount,
      parser: (data) {
        if (data is Map<String, dynamic>) {
          return data['count'] as int? ?? 0;
        }
        return 0;
      },
    );
    return response.data ?? 0;
  }

  Future<void> markAsRead(String notificationId) async {
    final response = await _apiClient.patch<void>(
      ApiEndpoints.notificationMarkRead(notificationId),
      parser: (_) {},
    );

    if (!response.success) {
      throw Exception('Failed to mark notification as read');
    }
  }

  Future<int> markAllAsRead() async {
    final response = await _apiClient.post<int>(
      ApiEndpoints.notificationsMarkAllRead,
      parser: (data) {
        if (data is Map<String, dynamic>) {
          return data['updatedCount'] as int? ?? 0;
        }
        return 0;
      },
    );
    return response.data ?? 0;
  }
}
