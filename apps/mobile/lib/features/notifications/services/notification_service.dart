import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/core/network/api_endpoints.dart';
import 'package:mobile/core/utils/app_logger.dart';
import 'package:mobile/features/notifications/models/notification_model.dart';

class NotificationService {

  NotificationService(this._apiClient);
  final ApiClient _apiClient;

  Future<List<NotificationModel>> fetchNotifications({
    int page = 1,
    int limit = 20,
    bool unreadOnly = false,
    bool ignoreCache = false,
  }) async {
    final offset = (page - 1) * limit;
    final response = await _apiClient.get<List<NotificationModel>>(
      ApiEndpoints.notifications,
      queryParameters: {
        'limit': limit,
        'offset': offset,
        if (unreadOnly) 'unreadOnly': true,
      },
      parser: parseNotifications,
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
    return actualData.map((e) => NotificationModel.fromJson(e as Map<String, dynamic>)).toList();
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
