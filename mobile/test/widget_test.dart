import 'package:flutter_test/flutter_test.dart';

import 'package:getse_mobile/main.dart';

void main() {
  testWidgets('App launches successfully to Splash Screen', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const GetseMobileApp());

    // Verify that the splash screen shows 'GETSE'.
    expect(find.text('GETSE'), findsOneWidget);
    
    // Wait for the splash screen timer to finish so the test framework doesn't complain about pending timers.
    await tester.pumpAndSettle(const Duration(seconds: 2));
  });
}
