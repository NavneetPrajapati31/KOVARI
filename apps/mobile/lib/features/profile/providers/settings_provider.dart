import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/settings_service.dart';
import '../../../core/network/api_client.dart';

final settingsServiceProvider = Provider<SettingsService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return SettingsService(apiClient);
});
