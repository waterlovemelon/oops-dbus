/// The kind of node in the service explorer tree.
enum TreeNodeType {
  path,
  interface,
  methodGroup,
  signalGroup,
  propertyGroup,
  method,
  signal,
  property,
}

/// A single node in the hierarchical service explorer tree.
///
/// The tree is flat (stored in a list) and uses [parentId] to express
/// hierarchy. Rendering code walks the list and indents based on [depth].
class TreeNode {
  /// Unique identifier for this node.
  final String id;

  /// The id of the parent node, or empty string for root nodes.
  final String parentId;

  /// Display label shown in the explorer.
  final String label;

  /// What kind of tree node this is.
  final TreeNodeType type;

  /// Indentation depth (0 for top-level paths).
  final int depth;

  /// Whether this node can be expanded to show children.
  final bool expandable;

  /// Arbitrary data associated with this node (e.g. the underlying
  /// [DbusMemberInfo] or [DbusInterfaceInfo]).
  final Map<String, dynamic> data;

  const TreeNode({
    required this.id,
    required this.parentId,
    required this.label,
    required this.type,
    this.depth = 0,
    this.expandable = false,
    this.data = const {},
  });

  /// Whether this node is a category group (methods, signals, or properties).
  bool get isGroup =>
      type == TreeNodeType.methodGroup ||
      type == TreeNodeType.signalGroup ||
      type == TreeNodeType.propertyGroup;

  /// Whether this node represents an actual D-Bus member.
  bool get isMember =>
      type == TreeNodeType.method ||
      type == TreeNodeType.signal ||
      type == TreeNodeType.property;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TreeNode &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() => 'TreeNode($type: $label, depth=$depth)';
}
