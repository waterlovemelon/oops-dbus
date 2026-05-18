import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/dbus_member_info.dart';
import '../providers/app_state.dart';
import '../theme/app_theme.dart';

/// Displays the list of members belonging to a selected group node.
///
/// Shown when the user selects a "methods", "signals", or "properties" group
/// in the service explorer tree. The pane renders a breadcrumb header, a
/// summary count, and a scrollable list of member cards. Method cards reveal
/// a play button on hover to quickly jump into the workbench.
class BrowsePane extends StatelessWidget {
  const BrowsePane({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AppState>(
      builder: (context, appState, _) {
        final node = appState.selectedNode;
        if (node == null) return const SizedBox.shrink();

        final path = node.data['path'] as String? ?? '';
        final interfaceName = node.data['interfaceName'] as String? ?? '';
        final memberType = node.data['memberType'] as String? ?? '';
        final count =
            node.data['count'] as int? ?? appState.browseMembers.length;

        return Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _BrowseHeader(
                path: path,
                interfaceName: interfaceName,
                memberType: memberType,
                count: count,
              ),
              const SizedBox(height: 12),
              Expanded(
                child: _BrowseMemberList(
                  members: appState.browseMembers,
                  onSelect: appState.selectMember,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // ---------------------------------------------------------------------------
}

// -- Header ------------------------------------------------------------------

class _BrowseHeader extends StatelessWidget {
  const _BrowseHeader({
    required this.path,
    required this.interfaceName,
    required this.memberType,
    required this.count,
  });

  final String path;
  final String interfaceName;
  final String memberType;
  final int count;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final onSurfaceVariant = theme.colorScheme.onSurfaceVariant;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Breadcrumb
        Row(
          children: [
            Icon(Icons.folder_outlined, size: 14, color: onSurfaceVariant),
            const SizedBox(width: 4),
            Expanded(
              child: Text(
                '$path  ›  $interfaceName',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: onSurfaceVariant,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        // Title + count badge
        Row(
          children: [
            _TypeDot(type: memberType),
            const SizedBox(width: 8),
            Text(
              '${memberType}s',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(width: 8),
            _CountBadge(count: count),
          ],
        ),
      ],
    );
  }
}

// -- Member list -------------------------------------------------------------

class _BrowseMemberList extends StatelessWidget {
  const _BrowseMemberList({
    required this.members,
    required this.onSelect,
  });

  final List<DbusMemberInfo> members;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    if (members.isEmpty) {
      return Center(
        child: Text(
          'No members',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context)
                    .colorScheme
                    .onSurfaceVariant
                    .withValues(alpha: 0.5),
              ),
        ),
      );
    }

    return ListView.builder(
      itemCount: members.length,
      itemBuilder: (context, index) {
        final member = members[index];
        return _MemberCard(
          member: member,
          onTap: () => onSelect(member.id),
        );
      },
    );
  }
}

// -- Single member card ------------------------------------------------------

class _MemberCard extends StatefulWidget {
  const _MemberCard({
    required this.member,
    required this.onTap,
  });

  final DbusMemberInfo member;
  final VoidCallback onTap;

  @override
  State<_MemberCard> createState() => _MemberCardState();
}

class _MemberCardState extends State<_MemberCard> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final typeColor = AppTheme.typeColor(widget.member.type);
    final isMethod = widget.member.type == 'method';

    return MouseRegion(
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 120),
          margin: const EdgeInsets.only(bottom: 4),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: _hovered
                ? theme.colorScheme.surfaceContainerHighest
                    .withValues(alpha: 0.5)
                : theme.colorScheme.surfaceContainerLow,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: _hovered
                  ? theme.colorScheme.outlineVariant
                  : theme.colorScheme.outlineVariant.withValues(alpha: 0.3),
            ),
          ),
          child: Row(
            children: [
              // Type dot
              Container(
                width: 6,
                height: 6,
                decoration: BoxDecoration(
                  color: typeColor,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 10),
              // Name
              Text(
                widget.member.name,
                style: theme.textTheme.bodyMedium?.copyWith(
                  fontFamily: 'monospace',
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(width: 8),
              // Signature
              if (widget.member.signature.isNotEmpty)
                Expanded(
                  child: Text(
                    '(${widget.member.signature})',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                      fontFamily: 'monospace',
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                )
              else
                const Spacer(),
              // Execute button (methods only, visible on hover)
              if (_hovered && isMethod)
                IconButton(
                  icon: const Icon(Icons.play_arrow_rounded, size: 18),
                  color: AppTheme.methodColor,
                  tooltip: 'Execute',
                  visualDensity: VisualDensity.compact,
                  onPressed: widget.onTap,
                ),
            ],
          ),
        ),
      ),
    );
  }
}

// -- Shared helpers ----------------------------------------------------------

class _TypeDot extends StatelessWidget {
  const _TypeDot({required this.type});
  final String type;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 8,
      height: 8,
      decoration: BoxDecoration(
        color: AppTheme.typeColor(type),
        shape: BoxShape.circle,
      ),
    );
  }
}

class _CountBadge extends StatelessWidget {
  const _CountBadge({required this.count});
  final int count;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        '$count',
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w600,
            ),
      ),
    );
  }
}
