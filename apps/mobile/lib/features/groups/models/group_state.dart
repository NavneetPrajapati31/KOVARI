import '../models/group.dart';

class GroupState {
  final List<GroupModel> groups;
  final bool isLoading;
  final bool isStale;
  final String? error;

  GroupState({
    this.groups = const [],
    this.isLoading = false,
    this.isStale = false,
    this.error,
  });

  GroupState copyWith({
    List<GroupModel>? groups,
    bool? isLoading,
    bool? isStale,
    String? error,
  }) {
    return GroupState(
      groups: groups ?? this.groups,
      isLoading: isLoading ?? this.isLoading,
      isStale: isStale ?? this.isStale,
      error: error,
    );
  }
}
