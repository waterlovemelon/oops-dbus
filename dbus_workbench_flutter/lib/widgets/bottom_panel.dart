import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/signal_event.dart';
import '../providers/app_state.dart';
import '../theme/app_theme.dart';

/// A collapsible bottom activity panel that displays received signal events.
///
/// Collapsed state (40 px): a bar with an "Activity" label, a signal event
/// count badge, and an expand/collapse chevron.
///
/// Expanded state (220 px): the same bar plus a scrollable list of signal
/// events, each showing a muted timestamp, bold topic, and truncated
/// monospace payload.
class BottomPanel extends StatefulWidget {
  const BottomPanel({super.key});

  @override
  State<BottomPanel> createState() => _BottomPanelState();
}

class _BottomPanelState extends State<BottomPanel> {
  bool _expanded = false;

  static const double _collapsedHeight = 40;
  static const double _expandedHeight = 220;

  void _toggle() => setState(() => _expanded = !_expanded);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return AnimatedSize(
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeInOut,
      alignment: Alignment.topCenter,
      child: Container(
        height: _expanded ? _expandedHeight : _collapsedHeight,
        decoration: BoxDecoration(
          color: colorScheme.surface,
          border: Border(
            top: BorderSide(
              color: colorScheme.outlineVariant,
              width: 1,
            ),
          ),
        ),
        child: Column(
          children: [
            // ---- Header bar (always visible) ----
            _HeaderBar(
              expanded: _expanded,
              onToggle: _toggle,
            ),
            // ---- Event list (only when expanded) ----
            if (_expanded) const Expanded(child: _EventList()),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Header bar
// ---------------------------------------------------------------------------

class _HeaderBar extends StatelessWidget {
  const _HeaderBar({
    required this.expanded,
    required this.onToggle,
  });

  final bool expanded;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return GestureDetector(
      onTap: onToggle,
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        height: _BottomPanelState._collapsedHeight,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Row(
            children: [
              // Activity icon
              Icon(
                Icons.bolt,
                size: 16,
                color: AppTheme.signalColor,
              ),
              const SizedBox(width: 6),
              // Label
              Text(
                'Activity',
                style: theme.textTheme.labelLarge?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: colorScheme.onSurface,
                ),
              ),
              const SizedBox(width: 8),
              // Signal event count badge
              Consumer<AppState>(
                builder: (context, state, _) {
                  final count = state.signalEvents.length;
                  if (count == 0) return const SizedBox.shrink();
                  return _CountBadge(count: count);
                },
              ),
              const Spacer(),
              // Expand / collapse chevron
              AnimatedRotation(
                turns: expanded ? 0.5 : 0,
                duration: const Duration(milliseconds: 250),
                child: Icon(
                  Icons.expand_less,
                  size: 20,
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Count badge
// ---------------------------------------------------------------------------

class _CountBadge extends StatelessWidget {
  const _CountBadge({required this.count});

  final int count;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 1),
      decoration: BoxDecoration(
        color: AppTheme.signalColor,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        count > 999 ? '999+' : '$count',
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: colorScheme.onPrimary,
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Event list
// ---------------------------------------------------------------------------

class _EventList extends StatelessWidget {
  const _EventList();

  @override
  Widget build(BuildContext context) {
    return Consumer<AppState>(
      builder: (context, state, _) {
        final events = state.signalEvents;

        if (events.isEmpty) {
          return Center(
            child: Text(
              'No signal events yet',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.symmetric(vertical: 4),
          itemCount: events.length,
          itemBuilder: (context, index) {
            final event = events[index];
            return _EventTile(event: event);
          },
        );
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Single event tile
// ---------------------------------------------------------------------------

class _EventTile extends StatelessWidget {
  const _EventTile({required this.event});

  final SignalEvent event;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Timestamp
          Text(
            event.time,
            style: theme.textTheme.bodySmall?.copyWith(
              color: colorScheme.onSurfaceVariant,
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
          ),
          const SizedBox(width: 10),
          // Topic
          Flexible(
            flex: 0,
            child: Text(
              event.topic,
              style: theme.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: 10),
          // Payload (monospace, truncated)
          Expanded(
            child: Text(
              event.payload,
              style: theme.textTheme.bodySmall?.copyWith(
                fontFamily: 'monospace',
                fontFamilyFallback: const ['Noto Sans Mono', 'Courier'],
                color: colorScheme.onSurfaceVariant,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
