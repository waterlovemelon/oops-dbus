import 'dbus_member_info.dart';

/// Groups all members belonging to a single D-Bus interface at a given path.
class DbusInterfaceInfo {
  /// The interface name, e.g. "org.freedesktop.DBus.Properties".
  final String name;

  /// The object path this interface is published on.
  final String path;

  /// Methods declared on this interface.
  final List<DbusMemberInfo> methods;

  /// Signals declared on this interface.
  final List<DbusMemberInfo> signals;

  /// Properties declared on this interface.
  final List<DbusMemberInfo> properties;

  const DbusInterfaceInfo({
    required this.name,
    required this.path,
    this.methods = const [],
    this.signals = const [],
    this.properties = const [],
  });

  /// All members across all categories.
  List<DbusMemberInfo> get allMembers => [...methods, ...signals, ...properties];

  @override
  String toString() => 'DbusInterfaceInfo($name, path=$path, '
      '${methods.length}m, ${signals.length}s, ${properties.length}p)';
}
