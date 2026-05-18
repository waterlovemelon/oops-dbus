import 'dbus_interface_info.dart';

/// Which bus a service is connected to.
enum BusType {
  session,
  system,
}

/// Represents a discovered D-Bus service with its full introspection data.
class DbusServiceInfo {
  /// The well-known bus name, e.g. "org.freedesktop.DBus".
  final String name;

  /// A unique identifier (typically the bus name itself).
  final String id;

  /// Whether this service was found on the session or system bus.
  final BusType busType;

  /// All introspected interfaces for this service.
  final List<DbusInterfaceInfo> interfaces;

  const DbusServiceInfo({
    required this.name,
    required this.id,
    required this.busType,
    this.interfaces = const [],
  });

  /// Total number of members across all interfaces.
  int get memberCount =>
      interfaces.fold(0, (sum, iface) => sum + iface.allMembers.length);

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is DbusServiceInfo &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          busType == other.busType;

  @override
  int get hashCode => Object.hash(id, busType);

  @override
  String toString() =>
      'DbusServiceInfo($name, bus=$busType, ${interfaces.length} interfaces)';
}
