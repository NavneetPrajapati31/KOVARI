import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/features/profile/data/settings_service.dart';

final settingsServiceProvider = Provider<SettingsService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return SettingsService(apiClient);
});
