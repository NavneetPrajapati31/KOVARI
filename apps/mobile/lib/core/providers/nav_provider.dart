import 'package:flutter_riverpod/flutter_riverpod.dart';

class NavBarVisibilityNotifier extends Notifier<bool> {
  @override
  bool build() => false; // Default to false, AppShell will set it to true

  void show() => state = true;
  void hide() => state = false;
  void setVisible(bool visible) => state = visible;
}

final navBarVisibilityProvider =
    NotifierProvider<NavBarVisibilityNotifier, bool>(
      NavBarVisibilityNotifier.new,
    );
