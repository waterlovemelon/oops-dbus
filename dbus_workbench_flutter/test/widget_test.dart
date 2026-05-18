import 'package:flutter_test/flutter_test.dart';
import 'package:dbus_workbench/main.dart';

void main() {
  testWidgets('App launches without crashing', (WidgetTester tester) async {
    await tester.pumpWidget(const DbusWorkbenchApp());
    expect(find.text('DBus Workbench'), findsOneWidget);
  });
}
