import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:leak_tracker_flutter_testing/leak_tracker_flutter_testing.dart';
import 'package:mobile/shared/widgets/primary_button.dart';

void main() {
  LeakTesting.settings = LeakTesting.settings.withIgnored(
    allNotDisposed: true, // We focus on leaks first, then non-disposal
  );

  group('Runtime Leak Detection', () {
    testWidgets('PrimaryButton does not leak memory', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PrimaryButton(
              text: 'Leak Test',
              onPressed: () {},
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      
      // Navigate away to trigger disposal
      await tester.pumpWidget(const SizedBox.shrink());
      await tester.pumpAndSettle();
    });
  });
}
