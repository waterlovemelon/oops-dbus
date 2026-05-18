import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../models/tree_node.dart';
import '../theme/app_theme.dart';

/// Left sidebar showing the D-Bus service explorer tree.
///
/// Displays a header with the "Explorer" title and a service count or
/// "Filtered" badge, followed by a scrollable list of services. Each
/// service can be expanded to reveal its hierarchical tree of paths,
/// interfaces, groups, and members.
class ServiceTreePane extends StatelessWidget {
  const ServiceTreePane({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AppState>(
      builder: (context, state, _) {
        final filtered = state.filteredServices;
        final isFiltered = state.filterText.isNotEmpty;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // -- Header --
            _ExplorerHeader(
              count: filtered.length,
              isFiltered: isFiltered,
            ),
            const Divider(height: 1),
            // -- Service list --
            Expanded(
              child: filtered.isEmpty
                  ? _EmptyState(
                      icon: isFiltered ? Icons.search_off : Icons.dns_outlined,
                      message: isFiltered
                          ? 'No services match the filter'
                          : 'No services found',
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.only(bottom: 16),
                      itemCount: filtered.length,
                      itemBuilder: (context, index) {
                        final serviceName = filtered[index];
                        final isSelected =
                            serviceName == state.selectedServiceName;
                        return _ServiceItem(
                          serviceName: serviceName,
                          isSelected: isSelected,
                          state: state,
                        );
                      },
                    ),
            ),
          ],
        );
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

class _ExplorerHeader extends StatelessWidget {
  final int count;
  final bool isFiltered;

  const _ExplorerHeader({required this.count, required this.isFiltered});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
      child: Row(
        children: [
          Icon(
            Icons.account_tree_outlined,
            size: 18,
            color: theme.colorScheme.primary,
          ),
          const SizedBox(width: 8),
          Text(
            'Explorer',
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w600,
              letterSpacing: 0.2,
            ),
          ),
          const Spacer(),
          if (isFiltered)
            _CountBadge(
              label: 'Filtered',
              color: AppTheme.accentColor,
            )
          else
            _CountBadge(
              label: '$count',
              color: theme.colorScheme.outline,
            ),
        ],
      ),
    );
  }
}

class _CountBadge extends StatelessWidget {
  final String label;
  final Color color;

  const _CountBadge({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha:0.1),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w500,
          color: color,
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Service item (expandable to show tree)
// ---------------------------------------------------------------------------

class _ServiceItem extends StatelessWidget {
  final String serviceName;
  final bool isSelected;
  final AppState state;

  const _ServiceItem({
    required this.serviceName,
    required this.isSelected,
    required this.state,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final primaryFg = theme.colorScheme.primary;
    final defaultFg = theme.colorScheme.onSurface;
    final mutedFg = theme.colorScheme.onSurfaceVariant;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        // -- Service row --
        InkWell(
          onTap: () => state.selectService(serviceName),
          borderRadius: BorderRadius.circular(6),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
            child: Row(
              children: [
                AnimatedRotation(
                  turns: isSelected ? 0.25 : 0,
                  duration: const Duration(milliseconds: 200),
                  curve: Curves.easeInOut,
                  child: Icon(
                    Icons.chevron_right,
                    size: 18,
                    color: isSelected ? primaryFg : mutedFg,
                  ),
                ),
                const SizedBox(width: 2),
                // Color dot for service
                Container(
                  width: 6,
                  height: 6,
                  decoration: BoxDecoration(
                    color: isSelected ? primaryFg : mutedFg.withValues(alpha:0.5),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    serviceName,
                    style: TextStyle(
                      fontFamily: 'monospace',
                      fontFamilyFallback: const ['Consolas', 'Courier New'],
                      fontSize: 12.5,
                      fontWeight:
                          isSelected ? FontWeight.w600 : FontWeight.w400,
                      color: isSelected ? primaryFg : defaultFg,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        ),
        // -- Tree nodes (animated height) --
        AnimatedSize(
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeInOut,
          alignment: Alignment.topCenter,
          child: isSelected
              ? _TreeNodesList(
                  nodes: state.visibleTreeNodes,
                  selectedMemberId: state.selectedMemberId,
                  expandedNodeIds: state.expandedNodeIds,
                  isLoading: state.isLoading,
                  onToggle: state.toggleTreeNode,
                  onSelect: state.selectMember,
                )
              : const SizedBox.shrink(),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Tree nodes list
// ---------------------------------------------------------------------------

class _TreeNodesList extends StatelessWidget {
  final List<TreeNode> nodes;
  final String selectedMemberId;
  final Set<String> expandedNodeIds;
  final bool isLoading;
  final void Function(String nodeId) onToggle;
  final void Function(String nodeId) onSelect;

  const _TreeNodesList({
    required this.nodes,
    required this.selectedMemberId,
    required this.expandedNodeIds,
    required this.isLoading,
    required this.onToggle,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    // Loading state
    if (nodes.isEmpty && isLoading) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 16),
        child: Center(
          child: SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ),
      );
    }

    // Empty tree
    if (nodes.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 12, horizontal: 24),
        child: Text(
          'No members',
          style: TextStyle(fontSize: 12, fontStyle: FontStyle.italic),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        for (final node in nodes)
          _TreeNodeTile(
            node: node,
            isSelected: node.id == selectedMemberId,
            isExpanded: expandedNodeIds.contains(node.id),
            onTap: () {
              if (node.expandable) {
                onToggle(node.id);
              } else if (node.isMember || node.isGroup) {
                onSelect(node.id);
              }
            },
          ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Individual tree node tile
// ---------------------------------------------------------------------------

class _TreeNodeTile extends StatelessWidget {
  final TreeNode node;
  final bool isSelected;
  final bool isExpanded;
  final VoidCallback onTap;

  const _TreeNodeTile({
    required this.node,
    required this.isSelected,
    required this.isExpanded,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final indent = 12.0 + node.depth * 18.0;
    final dotColor = _dotColorForType(node.type);
    final showArrow = node.expandable;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(4),
      child: Container(
        decoration: BoxDecoration(
          color: isSelected
              ? theme.colorScheme.primaryContainer.withValues(alpha:0.25)
              : Colors.transparent,
          border: isSelected
              ? Border(
                  left: BorderSide(
                    color: theme.colorScheme.primary,
                    width: 3,
                  ),
                )
              : null,
        ),
        padding: EdgeInsets.only(
          left: indent + (isSelected ? 0 : 3), // compensate for border width
          right: 12,
          top: 4,
          bottom: 4,
        ),
        child: Row(
          children: [
            // Expand / collapse arrow
            if (showArrow)
              AnimatedRotation(
                turns: isExpanded ? 0.25 : 0,
                duration: const Duration(milliseconds: 150),
                curve: Curves.easeInOut,
                child: Icon(
                  Icons.chevron_right,
                  size: 14,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              )
            else
              const SizedBox(width: 14),
            const SizedBox(width: 4),
            // Color-coded indicator dot
            Container(
              width: 7,
              height: 7,
              decoration: BoxDecoration(
                color: dotColor,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 6),
            // Label
            Expanded(
              child: Text(
                _displayLabel(),
                style: TextStyle(
                  fontFamily: 'monospace',
                  fontFamilyFallback: const ['Consolas', 'Courier New'],
                  fontSize: 11.5,
                  fontWeight:
                      isSelected ? FontWeight.w600 : FontWeight.w400,
                  color: isSelected
                      ? theme.colorScheme.onSurface
                      : theme.colorScheme.onSurfaceVariant,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            // Type pill for leaf member nodes
            if (node.isMember) ...[
              const SizedBox(width: 6),
              _TypePill(type: node.data['type'] as String? ?? ''),
            ],
          ],
        ),
      ),
    );
  }

  /// Builds the display label, appending a count for group nodes.
  String _displayLabel() {
    if (node.isGroup) {
      final count = node.data['count'] as int? ?? 0;
      final typeName = node.data['memberType'] as String? ?? '';
      return '${typeName}s ($count)';
    }
    return node.label;
  }

  /// Returns the indicator dot color based on node type.
  static Color _dotColorForType(TreeNodeType type) {
    switch (type) {
      case TreeNodeType.method:
      case TreeNodeType.methodGroup:
        return AppTheme.methodColor;
      case TreeNodeType.signal:
      case TreeNodeType.signalGroup:
        return AppTheme.signalColor;
      case TreeNodeType.property:
      case TreeNodeType.propertyGroup:
        return AppTheme.propertyColor;
      case TreeNodeType.path:
      case TreeNodeType.interface:
        return AppTheme.accentColor;
    }
  }
}

// ---------------------------------------------------------------------------
// Type pill (small label on the right side of member nodes)
// ---------------------------------------------------------------------------

class _TypePill extends StatelessWidget {
  final String type;

  const _TypePill({required this.type});

  @override
  Widget build(BuildContext context) {
    final color = AppTheme.typeColor(type);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
      decoration: BoxDecoration(
        color: color.withValues(alpha:0.08),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha:0.25), width: 0.5),
      ),
      child: Text(
        type,
        style: TextStyle(
          fontSize: 9,
          fontWeight: FontWeight.w500,
          color: color,
          letterSpacing: 0.3,
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Empty state placeholder
// ---------------------------------------------------------------------------

class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String message;

  const _EmptyState({required this.icon, required this.message});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 32, color: theme.colorScheme.outlineVariant),
            const SizedBox(height: 12),
            Text(
              message,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
