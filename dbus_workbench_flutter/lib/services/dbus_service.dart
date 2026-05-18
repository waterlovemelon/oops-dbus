import 'package:dbus/dbus.dart';
import 'package:xml/xml.dart';
import '../models/dbus_member_info.dart';
import '../models/dbus_service_info.dart';

class DbusService {
  DBusClient? _sessionClient;
  DBusClient? _systemClient;

  DBusClient _getClient(BusType busType) {
    if (busType == BusType.session) {
      _sessionClient ??= DBusClient.session();
      return _sessionClient!;
    } else {
      _systemClient ??= DBusClient.system();
      return _systemClient!;
    }
  }

  // List all D-Bus service names
  Future<List<String>> listServices(BusType busType) async {
    final client = _getClient(busType);
    final dbus = DBusRemoteObject(
      client,
      name: 'org.freedesktop.DBus',
      path: DBusObjectPath('/org/freedesktop/DBus'),
    );
    final result = await dbus.callMethod(
      'org.freedesktop.DBus',
      'ListNames',
      [],
      replySignature: DBusSignature('as'),
    );
    final names = (result.returnValues[0] as DBusArray)
        .children
        .map((v) => (v as DBusString).value)
        .toList();
    // Filter out names starting with ':' (unique connections) and 'org.freedesktop.DBus'
    return names
        .where((n) => !n.startsWith(':') && n != 'org.freedesktop.DBus')
        .toList()
      ..sort();
  }

  // Introspect a service and return all members as a flat list
  Future<List<DbusMemberInfo>> introspectServiceMembers(
    String serviceName,
    BusType busType,
  ) async {
    final client = _getClient(busType);
    final members = <DbusMemberInfo>[];
    await _introspectPath(client, serviceName, '/', members);
    return members;
  }

  // Recursively introspect a path
  Future<void> _introspectPath(
    DBusClient client,
    String serviceName,
    String path,
    List<DbusMemberInfo> members,
  ) async {
    try {
      final remote = DBusRemoteObject(
        client,
        name: serviceName,
        path: DBusObjectPath(path),
      );
      final result = await remote.callMethod(
        'org.freedesktop.DBus.Introspectable',
        'Introspect',
        [],
      );
      final xml = (result.returnValues[0] as DBusString).value;
      final doc = XmlDocument.parse(xml);
      final root = doc.rootElement;

      // Parse interfaces
      for (final iface in root.findElements('interface')) {
        final ifaceName = iface.getAttribute('name') ?? '';
        if (ifaceName.startsWith('org.freedesktop.DBus.')) continue;

        // Parse methods
        for (final method in iface.findElements('method')) {
          final methodName = method.getAttribute('name') ?? '';
          final inArgs = <String>[];
          final outArgs = <String>[];
          String annotation = '';

          for (final arg in method.findElements('arg')) {
            final direction = arg.getAttribute('direction') ?? 'in';
            final type = arg.getAttribute('type') ?? '';
            if (direction == 'in') {
              inArgs.add(type);
            } else {
              outArgs.add(type);
            }
          }

          for (final ann in method.findElements('annotation')) {
            if (ann.getAttribute('name') == 'org.freedesktop.DBus.Deprecated') {
              annotation = 'deprecated';
            }
          }

          members.add(DbusMemberInfo(
            id: '$path|$ifaceName|method|$methodName',
            name: methodName,
            type: 'method',
            interfaceName: ifaceName,
            path: path,
            signature: inArgs.join(''),
            returnType: outArgs.join(''),
            annotation: annotation,
          ));
        }

        // Parse signals
        for (final signal in iface.findElements('signal')) {
          final signalName = signal.getAttribute('name') ?? '';
          final args = signal
              .findElements('arg')
              .map((a) => a.getAttribute('type') ?? '')
              .join('');

          members.add(DbusMemberInfo(
            id: '$path|$ifaceName|signal|$signalName',
            name: signalName,
            type: 'signal',
            interfaceName: ifaceName,
            path: path,
            signature: args,
            returnType: '',
            annotation: '',
          ));
        }

        // Parse properties
        for (final prop in iface.findElements('property')) {
          final propName = prop.getAttribute('name') ?? '';
          final propType = prop.getAttribute('type') ?? '';
          final access = prop.getAttribute('access') ?? 'read';

          members.add(DbusMemberInfo(
            id: '$path|$ifaceName|property|$propName',
            name: propName,
            type: 'property',
            interfaceName: ifaceName,
            path: path,
            signature: propType,
            returnType: '',
            annotation: access,
          ));
        }
      }

      // Recurse into child nodes
      for (final node in root.findElements('node')) {
        final childName = node.getAttribute('name') ?? '';
        if (childName.isNotEmpty) {
          final childPath =
              path == '/' ? '/$childName' : '$path/$childName';
          await _introspectPath(client, serviceName, childPath, members);
        }
      }
    } catch (e) {
      // Skip paths that can't be introspected
    }
  }

  // Invoke a D-Bus method
  Future<dynamic> invokeMethod(
    String serviceName,
    String path,
    String interfaceName,
    String methodName,
    List<dynamic> arguments,
    BusType busType,
  ) async {
    final client = _getClient(busType);
    final remote = DBusRemoteObject(
      client,
      name: serviceName,
      path: DBusObjectPath(path),
    );
    final dbusArgs = arguments.map((a) => _toDbusValue(a)).toList();
    final result =
        await remote.callMethod(interfaceName, methodName, dbusArgs);
    if (result.returnValues.isEmpty) return null;
    if (result.returnValues.length == 1) {
      return _fromDbusValue(result.returnValues[0]);
    }
    return result.returnValues.map((v) => _fromDbusValue(v)).toList();
  }

  // Subscribe to a D-Bus signal
  Stream<Map<String, dynamic>> subscribeSignal(
    String serviceName,
    String path,
    String interfaceName,
    String signalName,
    BusType busType,
  ) {
    final client = _getClient(busType);

    return DBusSignalStream(
          client,
          sender: serviceName,
          interface: interfaceName,
          name: signalName,
          path: DBusObjectPath(path),
        )
        .map((signal) {
      final now = DateTime.now();
      final timeStr =
          '${now.hour.toString().padLeft(2, '0')}:'
          '${now.minute.toString().padLeft(2, '0')}:'
          '${now.second.toString().padLeft(2, '0')}';
      final payload = signal.values.isNotEmpty
          ? _fromDbusValue(signal.values[0]).toString()
          : '';
      return {
        'time': timeStr,
        'topic': '$interfaceName.$signalName',
        'sender': serviceName,
        'payload': payload,
      };
    });
  }

  // Convert Dart values to DBusValue
  DBusValue _toDbusValue(dynamic value) {
    if (value is String) return DBusString(value);
    if (value is int) return DBusInt32(value);
    if (value is double) return DBusDouble(value);
    if (value is bool) return DBusBoolean(value);
    return DBusString(value.toString());
  }

  // Convert DBusValue to Dart values
  dynamic _fromDbusValue(DBusValue value) {
    if (value is DBusString) return value.value;
    if (value is DBusBoolean) return value.value;
    if (value is DBusInt16) return value.value;
    if (value is DBusInt32) return value.value;
    if (value is DBusInt64) return value.value;
    if (value is DBusByte) return value.value;
    if (value is DBusUint16) return value.value;
    if (value is DBusUint32) return value.value;
    if (value is DBusUint64) return value.value;
    if (value is DBusDouble) return value.value;
    if (value is DBusArray) {
      return value.children.map((c) => _fromDbusValue(c)).toList();
    }
    if (value is DBusDict) {
      return value.children
          .map((k, v) => MapEntry(_fromDbusValue(k), _fromDbusValue(v)));
    }
    if (value is DBusStruct) {
      return value.children.map((c) => _fromDbusValue(c)).toList();
    }
    if (value is DBusVariant) return _fromDbusValue(value.value);
    return value.toString();
  }

  // Parse D-Bus type signature and convert string input to proper type
  static dynamic convertValue(String signature, String input) {
    if (signature.isEmpty) return input;
    switch (signature[0]) {
      case 's':
      case 'o':
      case 'g':
        return input;
      case 'b':
        return input.toLowerCase() == 'true' ||
            input == '1' ||
            input.toLowerCase() == 'yes';
      case 'y':
        return int.tryParse(input) ?? 0;
      case 'n':
      case 'q':
      case 'i':
      case 'h':
        return int.tryParse(input) ?? 0;
      case 'u':
        return int.tryParse(input) ?? 0;
      case 't':
        return int.tryParse(input) ?? 0;
      case 'x':
        return int.tryParse(input) ?? 0;
      case 'd':
        return double.tryParse(input) ?? 0.0;
      default:
        return input;
    }
  }

  void dispose() {
    _sessionClient?.close();
    _systemClient?.close();
  }
}
