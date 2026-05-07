import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';

class ThemeNotifier extends Notifier<ThemeMode> {
  static const String _boxName = 'settings';
  static const String _key = 'theme_mode';

  @override
  ThemeMode build() {
    // Initial sync load from Hive
    final box = Hive.box(_boxName);
    final index = box.get(_key, defaultValue: ThemeMode.system.index);
    return ThemeMode.values[index];
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    state = mode;
    final box = Hive.box(_boxName);
    await box.put(_key, mode.index);
  }
}

final themeProvider = NotifierProvider<ThemeNotifier, ThemeMode>(() {
  return ThemeNotifier();
});
