import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/app_state.dart';
import '../theme/app_theme.dart';

/// Detail view for a D-Bus property member.
///
/// Displays property metadata (type signature, access mode, object path) inside
/// a card, followed by a capability notice explaining that Get/Set/GetAll
/// operations are not yet available.
class PropertyDetailPane extends StatelessWidget {
  const PropertyDetailPane({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AppState>(
      builder: (context, appState, _) {
        final memberData = appState.selectedMemberData;
        if (memberData == null) return const SizedBox.shrink();

        final name = memberData['name'] as String? ?? '';
        final interfaceName = memberData['interfaceName'] as String? ?? '';
        final path = memberData['path'] as String? ?? '';
        final signature = memberData['signature'] as String? ?? '';
        final annotation = memberData['annotation'] as String? ?? '';

        return Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _PropertyHeader(
                interfaceName: interfaceName,
                name: name,
              ),
              const SizedBox(height: 12),
              _MetadataCard(
                signature: signature,
                annotation: annotation,
                path: path,
              ),
              const SizedBox(height: 12),
              const _CapabilityNotice(),
            ],
          ),
        );
      },
    );
  }
}

// -- Header ------------------------------------------------------------------

class _PropertyHeader extends StatelessWidget {
  const _PropertyHeader({
    required this.interfaceName,
    required this.name,
  });

  final String interfaceName;
  final String name;

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
        // Property name with type dot
        Row(
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                color: AppTheme.propertyColor,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              name,
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

// -- Metadata card -----------------------------------------------------------

class _MetadataCard extends StatelessWidget {
  const _MetadataCard({
    required this.signature,
    required this.annotation,
    required this.path,
  });

  final String signature;
  final String annotation;
  final String path;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Card header
            Row(
              children: [
                Icon(Icons.info_outline,
                    size: 16, color: theme.colorScheme.onSurfaceVariant),
                const SizedBox(width: 8),
                Text(
                  'Metadata',
                  style: theme.textTheme.titleSmall
                      ?.copyWith(fontWeight: FontWeight.w600),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Metadata rows
            _MetaRow(
              label: 'Type',
              value: signature.isEmpty ? '(unknown)' : signature,
            ),
            _MetaRow(
              label: 'Access',
              value: _accessLabel(annotation),
            ),
            _MetaRow(label: 'Object Path', value: path),
          ],
        ),
      ),
    );
  }

  /// Maps the raw D-Bus annotation string to a human-readable access label.
  static String _accessLabel(String annotation) {
    switch (annotation) {
      case 'readwrite':
        return 'Read/Write';
      case 'writeonly':
        return 'Write Only';
      case 'readonly':
      case '':
        return 'Read Only';
      default:
        return annotation;
    }
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
      padding: const EdgeInsets.only(bottom: 8),
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
            child: Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerHighest
                    .withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                value,
                style: theme.textTheme.bodySmall?.copyWith(
                  fontFamily: 'monospace',
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// -- Capability notice -------------------------------------------------------

class _CapabilityNotice extends StatelessWidget {
  const _CapabilityNotice();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      color: theme.colorScheme.surfaceContainerLow,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              Icons.info,
              size: 20,
              color: theme.colorScheme.primary,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Limited Capability',
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: theme.colorScheme.primary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Current version only shows metadata. '
                    'Get/Set/GetAll operations not yet supported.',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
