/// Represents a single D-Bus member (method, signal, or property).
class DbusMemberInfo {
  /// Composite key: "path|interface|type|name".
  final String id;

  /// The member name, e.g. "Get", "PropertiesChanged".
  final String name;

  /// One of "method", "signal", "property".
  final String type;

  /// The D-Bus interface this member belongs to.
  final String interfaceName;

  /// The object path this member belongs to.
  final String path;

  /// D-Bus type signature for inputs (method arguments or signal arguments).
  final String signature;

  /// D-Bus type signature for outputs (methods only, empty for signals/properties).
  final String returnType;

  /// Annotation string: "deprecated", "readonly", "readwrite", or "writeonly".
  /// Empty if none.
  final String annotation;

  const DbusMemberInfo({
    required this.id,
    required this.name,
    required this.type,
    required this.interfaceName,
    required this.path,
    this.signature = '',
    this.returnType = '',
    this.annotation = '',
  });

  /// Creates a [DbusMemberInfo] from a [Map], e.g. from interop or serialization.
  factory DbusMemberInfo.fromMap(Map<String, dynamic> map) {
    return DbusMemberInfo(
      id: map['id'] as String,
      name: map['name'] as String,
      type: map['type'] as String,
      interfaceName: map['interfaceName'] as String,
      path: map['path'] as String,
      signature: (map['signature'] as String?) ?? '',
      returnType: (map['returnType'] as String?) ?? '',
      annotation: (map['annotation'] as String?) ?? '',
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is DbusMemberInfo &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() =>
      'DbusMemberInfo($type: $interfaceName.$name, path=$path)';
}
