import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/utils/app_logger.dart';
import '../models/notification_model.dart';

class NotificationService {
  final ApiClient _apiClient;

  NotificationService(this._apiClient);

  Future<List<NotificationModel>> fetchNotifications({
    int limit = 50,
    int offset = 0,
    bool unreadOnly = false,
    bool ignoreCache = false,
  }) async {
    final response = await _apiClient.get<List<NotificationModel>>(
      ApiEndpoints.notifications,
      queryParameters: {
        'limit': limit,
        'offset': offset,
        if (unreadOnly) 'unreadOnly': true,
      },
      parser: (data) => parseNotifications(data),
      ignoreCache: ignoreCache,
    );

    return response.data ?? [];
  }

  List<NotificationModel> parseNotifications(dynamic data) {
    AppLogger.d('🔔 [NOTIFICATIONS] Raw data received: $data');

    dynamic actualData = data;

    if (actualData is Map) {
      if (actualData.containsKey('notifications')) {
        actualData = actualData['notifications'];
      } else if (actualData.containsKey('data')) {
        actualData = actualData['data'];
        if (actualData is Map && actualData.containsKey('notifications')) {
          actualData = actualData['notifications'];
        }
      }
    }

    if (actualData is! List) {
      AppLogger.w(
        '🔔 [NOTIFICATIONS] Expected list but got: ${actualData?.runtimeType}',
      );
      return [];
    }
    return actualData.map((e) => NotificationModel.fromJson(e)).toList();
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
