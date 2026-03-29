import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/main.dart';

void main() {
  testWidgets('App starts with KOVARI onboarding screen', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const KovariApp());

    // Verify that our brand name is present.
    expect(find.text('KOVARI'), findsOneWidget);
    expect(find.text('Social SaaS for the Future'), findsOneWidget);
  });
}
