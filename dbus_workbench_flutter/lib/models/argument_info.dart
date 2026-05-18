/// Describes a single argument of a D-Bus method call.
///
/// [value] is mutable so the user can fill in values before invoking.
class ArgumentInfo {
  /// Argument name from introspection metadata, e.g. "destination".
  final String name;

  /// D-Bus type signature, e.g. "s", "a{sv}".
  final String signature;

  /// Argument direction. Currently always "input" since outputs are
  /// determined by the method's return type signature.
  final String type;

  /// User-supplied value for this argument. Mutable so it can be edited
  /// in the UI before the method is invoked.
  String value;

  ArgumentInfo({
    required this.name,
    required this.signature,
    this.type = 'input',
    this.value = '',
  });

  @override
  String toString() => 'ArgumentInfo($name: $signature, value=$value)';
}
