import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/providers/auth_provider.dart';
import '../models/group.dart';
import '../data/group_service.dart';

final groupServiceProvider = Provider<GroupService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return GroupService(apiClient);
});

final myGroupsProvider = FutureProvider<List<GroupModel>>((ref) async {
  // Watch auth state to trigger re-build on login/logout
  ref.watch(authStateProvider);

  final service = ref.watch(groupServiceProvider);
  return service.getMyGroups();
});
