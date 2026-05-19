import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golden_toolkit/golden_toolkit.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:mobile/shared/widgets/primary_button.dart';

void main() {
  group('PrimaryButton Goldens', () {
    testGoldens('PrimaryButton - Various States', (tester) async {
      final builder = GoldenBuilder.grid(columns: 2, widthToHeightRatio: 2)
        ..addScenario('Idle', const PrimaryButton(text: 'Submit'))
        ..addScenario(
          'Success',
          const PrimaryButton(text: 'Submit', isSuccess: true),
        )
        ..addScenario(
          'Error',
          const PrimaryButton(text: 'Submit', isError: true),
        )
        ..addScenario(
          'With Icon',
          const PrimaryButton(text: 'Explore', icon: LucideIcons.compass),
        )
        ..addScenario(
          'Destructive',
          const PrimaryButton(text: 'Delete', isDestructive: true),
        )
        ..addScenario('Disabled', const PrimaryButton(text: 'Disabled'));

      await tester.pumpWidgetBuilder(
        builder.build(),
        wrapper: (child) => MaterialApp(
          debugShowCheckedModeBanner: false,
          home: Scaffold(body: Center(child: child)),
        ),
      );

      await screenMatchesGolden(
        tester,
        'primary_button_states',
        autoHeight: true,
      );
    });
  });
}
