import 'package:mobile/features/groups/models/group.dart';

class GroupState {

  GroupState({
    this.groups = const [],
    this.isLoading = false,
    this.isStale = false,
    this.error,
  });
  final List<GroupModel> groups;
  final bool isLoading;
  final bool isStale;
  final String? error;

  GroupState copyWith({
    List<GroupModel>? groups,
    bool? isLoading,
    bool? isStale,
    String? error,
  }) => GroupState(
      groups: groups ?? this.groups,
      isLoading: isLoading ?? this.isLoading,
      isStale: isStale ?? this.isStale,
      error: error,
    );
}
