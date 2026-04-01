import 'package:flutter_riverpod/legacy.dart';

/// Provider to manage the current active tab index in the App Shell
final appShellIndexProvider = StateProvider<int>((ref) => 0);
