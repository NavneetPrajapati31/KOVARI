import 'dart:async';
import 'package:golden_toolkit/golden_toolkit.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile/core/theme/app_text_styles.dart';

Future<void> testExecutable(FutureOr<void> Function() testMain) async {
  GoogleFonts.config.allowRuntimeFetching = false;
  AppTextStyles.useSystemFont = true;
  
  return GoldenToolkit.runWithConfiguration(
    () async {
      await testMain();
    },
    config: GoldenToolkitConfiguration(
      // Default devices for golden tests
      defaultDevices: const [
        Device.phone,
        Device.iphone11,
        Device.tabletPortrait,
        Device.tabletLandscape,
      ],
    ),
  );
}
