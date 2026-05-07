import '../models/notification_model.dart';

class NotificationState {
  final List<NotificationModel> notifications;
  final bool isLoading;
  final bool isStale;
  final String? error;
  final int page;
  final bool hasMore;
  final bool isFetchingNextPage;

  NotificationState({
    this.notifications = const [],
    this.isLoading = false,
    this.isStale = false,
    this.error,
    this.page = 1,
    this.hasMore = true,
    this.isFetchingNextPage = false,
  });

  NotificationState copyWith({
    List<NotificationModel>? notifications,
    bool? isLoading,
    bool? isStale,
    String? error,
    int? page,
    bool? hasMore,
    bool? isFetchingNextPage,
  }) {
    return NotificationState(
      notifications: notifications ?? this.notifications,
      isLoading: isLoading ?? this.isLoading,
      isStale: isStale ?? this.isStale,
      error: error,
      page: page ?? this.page,
      hasMore: hasMore ?? this.hasMore,
      isFetchingNextPage: isFetchingNextPage ?? this.isFetchingNextPage,
    );
  }
}
