import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/signal_event.dart';
import '../providers/app_state.dart';
import '../theme/app_theme.dart';

/// Detail view for a D-Bus signal member.
///
/// Split into two card sections:
///   1. **Monitor** -- signal metadata (interface, name, signature, object path)
///      together with a subscribe/unsubscribe toggle and a live status badge.
///   2. **Recent Events** -- a filterable list of received [SignalEvent]s that
///      match the currently selected signal. Displays an empty-state placeholder
///      when no events have arrived yet.
class SignalDetailPane extends StatelessWidget {
  const SignalDetailPane({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AppState>(
      builder: (context, appState, _) {
        final memberData = appState.selectedMemberData;
        if (memberData == null) return const SizedBox.shrink();

        final interfaceName = memberData['interfaceName'] as String? ?? '';
        final signalName = memberData['name'] as String? ?? '';
        final signature = memberData['signature'] as String? ?? '';
        final path = memberData['path'] as String? ?? '';

        // Determine whether we are currently listening to this signal.
        final expectedSubId =
            '${appState.selectedServiceName}:$path:$interfaceName:$signalName';
        final isListening =
            appState.activeSubscriptionId == expectedSubId;

        // Filter events that match the current signal topic.
        final signalTopic = '$interfaceName.$signalName';
        final filteredEvents = appState.signalEvents
            .where((e) => e.topic == signalTopic)
            .toList();

        return Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _SignalHeader(
                interfaceName: interfaceName,
                signalName: signalName,
              ),
              const SizedBox(height: 12),
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    children: [
                      _MonitorCard(
                        interfaceName: interfaceName,
                        signalName: signalName,
                        signature: signature,
                        path: path,
                        isListening: isListening,
                        onToggle: () {
                          if (isListening) {
                            appState.unsubscribeSignal();
                          } else {
                            appState.subscribeSignal(
                              path,
                              interfaceName,
                              signalName,
                            );
                          }
                        },
                      ),
                      const SizedBox(height: 12),
                      _RecentEventsCard(events: filteredEvents),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

// -- Header ------------------------------------------------------------------

class _SignalHeader extends StatelessWidget {
  const _SignalHeader({
    required this.interfaceName,
    required this.signalName,
  });

  final String interfaceName;
  final String signalName;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Breadcrumb
        Row(
          children: [
            Icon(Icons.route,
                size: 14, color: theme.colorScheme.onSurfaceVariant),
            const SizedBox(width: 4),
            Expanded(
              child: Text(
                interfaceName,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        // Signal name with type dot
        Row(
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                color: AppTheme.signalColor,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              signalName,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
                fontFamily: 'monospace',
              ),
            ),
          ],
        ),
      ],
    );
  }
}

// -- Monitor card ------------------------------------------------------------

class _MonitorCard extends StatelessWidget {
  const _MonitorCard({
    required this.interfaceName,
    required this.signalName,
    required this.signature,
    required this.path,
    required this.isListening,
    required this.onToggle,
  });

  final String interfaceName;
  final String signalName;
  final String signature;
  final String path;
  final bool isListening;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Card header + status badge
            Row(
              children: [
                Icon(Icons.sensors,
                    size: 16, color: theme.colorScheme.onSurfaceVariant),
                const SizedBox(width: 8),
                Text(
                  'Monitor',
                  style: theme.textTheme.titleSmall
                      ?.copyWith(fontWeight: FontWeight.w600),
                ),
                const Spacer(),
                _ListeningBadge(isListening: isListening),
              ],
            ),
            const SizedBox(height: 12),

            // Metadata rows
            _MetaRow(label: 'Interface', value: interfaceName),
            _MetaRow(label: 'Signal', value: signalName),
            _MetaRow(
              label: 'Signature',
              value: signature.isEmpty ? '(none)' : signature,
            ),
            _MetaRow(label: 'Object Path', value: path),
            const SizedBox(height: 12),

            // Subscribe / Unsubscribe toggle
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: onToggle,
                icon: Icon(
                  isListening ? Icons.stop : Icons.play_arrow,
                  size: 16,
                ),
                label: Text(isListening ? 'Unsubscribe' : 'Subscribe'),
                style: OutlinedButton.styleFrom(
                  foregroundColor:
                      isListening ? AppTheme.dangerColor : AppTheme.successColor,
                  side: BorderSide(
                    color: isListening
                        ? AppTheme.dangerColor.withValues(alpha: 0.5)
                        : AppTheme.successColor.withValues(alpha: 0.5),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ListeningBadge extends StatelessWidget {
  const _ListeningBadge({required this.isListening});
  final bool isListening;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final activeColor = AppTheme.successColor;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: isListening
            ? activeColor.withValues(alpha: 0.15)
            : theme.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isListening
              ? activeColor.withValues(alpha: 0.3)
              : theme.colorScheme.outlineVariant,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: isListening
                  ? activeColor
                  : theme.colorScheme.onSurfaceVariant,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 4),
          Text(
            isListening ? 'Listening' : 'Not listening',
            style: theme.textTheme.labelSmall?.copyWith(
              color: isListening
                  ? activeColor
                  : theme.colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _MetaRow extends StatelessWidget {
  const _MetaRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 90,
            child: Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: theme.textTheme.bodySmall?.copyWith(
                fontFamily: 'monospace',
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// -- Recent events card ------------------------------------------------------

class _RecentEventsCard extends StatelessWidget {
  const _RecentEventsCard({required this.events});
  final List<SignalEvent> events;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Card header + count
            Row(
              children: [
                Icon(Icons.list_alt,
                    size: 16, color: theme.colorScheme.onSurfaceVariant),
                const SizedBox(width: 8),
                Text(
                  'Recent Events',
                  style: theme.textTheme.titleSmall
                      ?.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(width: 8),
                _CountBadge(count: events.length),
              ],
            ),
            const SizedBox(height: 12),

            // Events list or empty state
            if (events.isEmpty)
              _buildEmptyState(context)
            else
              ...events.map((e) => _EventItem(event: e)),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 24),
      child: Column(
        children: [
          Icon(
            Icons.notifications_none,
            size: 32,
            color: theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.3),
          ),
          const SizedBox(height: 8),
          Text(
            'No events received yet',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.5),
            ),
          ),
        ],
      ),
    );
  }
}

class _EventItem extends StatelessWidget {
  const _EventItem({required this.event});
  final SignalEvent event;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(
          color: theme.colorScheme.outlineVariant.withValues(alpha: 0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Timestamp + sender
          Row(
            children: [
              Text(
                event.time,
                style: theme.textTheme.labelSmall?.copyWith(
                  fontFamily: 'monospace',
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  event.sender,
                  style: theme.textTheme.labelSmall?.copyWith(
                    fontFamily: 'monospace',
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          // Payload
          if (event.payload.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              event.payload,
              style: theme.textTheme.bodySmall?.copyWith(
                fontFamily: 'monospace',
              ),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ],
      ),
    );
  }
}

// -- Shared helpers ----------------------------------------------------------

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
