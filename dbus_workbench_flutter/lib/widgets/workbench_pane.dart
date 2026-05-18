import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/argument_info.dart';
import '../providers/app_state.dart';
import '../theme/app_theme.dart';

/// The method invocation workbench.
///
/// Shown when the user selects an individual method member. The pane is split
/// into two card sections:
///   1. **Arguments** -- editable text fields for each method input parameter,
///      with an "Invoke" action button.
///   2. **Result** -- a monospace text area showing the return value (or error)
///      together with a status badge indicating idle / running / success / error.
class WorkbenchPane extends StatelessWidget {
  const WorkbenchPane({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AppState>(
      builder: (context, appState, _) {
        final memberData = appState.selectedMemberData;
        if (memberData == null) return const SizedBox.shrink();

        final name = memberData['name'] as String? ?? '';
        final interfaceName = memberData['interfaceName'] as String? ?? '';
        final path = memberData['path'] as String? ?? '';
        final returnType = memberData['returnType'] as String? ?? '';

        return Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _WorkbenchHeader(
                path: path,
                interfaceName: interfaceName,
                name: name,
                returnType: returnType,
              ),
              const SizedBox(height: 12),
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    children: [
                      _ArgumentsCard(appState: appState),
                      const SizedBox(height: 12),
                      _ResultCard(appState: appState),
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

class _WorkbenchHeader extends StatelessWidget {
  const _WorkbenchHeader({
    required this.path,
    required this.interfaceName,
    required this.name,
    required this.returnType,
  });

  final String path;
  final String interfaceName;
  final String name;
  final String returnType;

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
                '$path  ›  $interfaceName',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        // Method name + return type
        Row(
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                color: AppTheme.methodColor,
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
            if (returnType.isNotEmpty) ...[
              const SizedBox(width: 8),
              Text(
                '→ $returnType',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                  fontFamily: 'monospace',
                ),
              ),
            ],
          ],
        ),
      ],
    );
  }
}

// -- Arguments card ----------------------------------------------------------

class _ArgumentsCard extends StatelessWidget {
  const _ArgumentsCard({required this.appState});

  final AppState appState;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final args = appState.arguments;
    final isRunning = appState.executionStatus == 'running';

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Icon(Icons.input,
                    size: 16, color: theme.colorScheme.onSurfaceVariant),
                const SizedBox(width: 8),
                Text(
                  'Arguments',
                  style: theme.textTheme.titleSmall
                      ?.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(width: 8),
                _CountBadge(count: args.length),
              ],
            ),
            const SizedBox(height: 12),

            // Argument list
            if (args.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Text(
                  'No arguments required',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant
                        .withValues(alpha: 0.6),
                  ),
                ),
              )
            else
              ...List.generate(
                args.length,
                (i) => _ArgumentRow(
                  arg: args[i],
                  onChanged: (v) => appState.setArgumentValue(i, v),
                ),
              ),

            const SizedBox(height: 12),

            // Action bar
            Row(
              children: [
                const Spacer(),
                ElevatedButton.icon(
                  onPressed:
                      isRunning ? null : () => appState.invokeMethod(),
                  icon: isRunning
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child:
                              CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.play_arrow, size: 18),
                  label:
                      Text(isRunning ? 'Invoking…' : 'Invoke'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.methodColor,
                    foregroundColor: Colors.white,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ArgumentRow extends StatelessWidget {
  const _ArgumentRow({
    required this.arg,
    required this.onChanged,
  });

  final ArgumentInfo arg;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          // Argument name
          SizedBox(
            width: 80,
            child: Text(
              arg.name,
              style: theme.textTheme.bodySmall?.copyWith(
                fontFamily: 'monospace',
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const SizedBox(width: 8),
          // Signature badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: theme.colorScheme.tertiaryContainer
                  .withValues(alpha: 0.4),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              arg.signature,
              style: theme.textTheme.labelSmall?.copyWith(
                fontFamily: 'monospace',
                color: theme.colorScheme.onTertiaryContainer,
              ),
            ),
          ),
          const SizedBox(width: 8),
          // Value input
          Expanded(
            child: SizedBox(
              height: 32,
              child: TextField(
                onChanged: onChanged,
                decoration: InputDecoration(
                  hintText: _hintForSignature(arg.signature),
                  hintStyle: TextStyle(
                    color: theme.colorScheme.onSurfaceVariant
                        .withValues(alpha: 0.4),
                    fontSize: 12,
                    fontFamily: 'monospace',
                  ),
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(6),
                    borderSide: BorderSide(
                      color: theme.colorScheme.outlineVariant,
                    ),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(6),
                    borderSide: BorderSide(
                      color: theme.colorScheme.outlineVariant,
                    ),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(6),
                    borderSide:
                        BorderSide(color: theme.colorScheme.primary),
                  ),
                ),
                style: const TextStyle(
                  fontSize: 12,
                  fontFamily: 'monospace',
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Returns a context-aware placeholder hint based on the D-Bus type.
  static String _hintForSignature(String sig) {
    if (sig == 's') return '"string"';
    if (sig == 'b') return 'true / false';
    if ('iunxqtdy'.contains(sig)) return '0';
    if (sig == 'o') return '/object/path';
    if (sig == 'v') return 'variant';
    return 'value';
  }
}

// -- Result card -------------------------------------------------------------

class _ResultCard extends StatelessWidget {
  const _ResultCard({required this.appState});

  final AppState appState;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final status = appState.executionStatus;

    final (:color, :label, :icon) = _statusStyle(status, theme);

    final resultText =
        status == 'error' ? appState.executionError : appState.executionResult;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Icon(Icons.output,
                    size: 16, color: theme.colorScheme.onSurfaceVariant),
                const SizedBox(width: 8),
                Text(
                  'Result',
                  style: theme.textTheme.titleSmall
                      ?.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(width: 8),
                _StatusBadge(color: color, label: label, icon: icon),
              ],
            ),
            const SizedBox(height: 12),

            // Result text area
            Container(
              width: double.infinity,
              constraints: const BoxConstraints(minHeight: 80),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerHighest
                    .withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: status == 'error'
                      ? AppTheme.dangerColor.withValues(alpha: 0.3)
                      : status == 'success'
                          ? AppTheme.successColor.withValues(alpha: 0.3)
                          : theme.colorScheme.outlineVariant
                              .withValues(alpha: 0.3),
                ),
              ),
              child: resultText.isEmpty
                  ? Text(
                      status == 'running'
                          ? 'Waiting for result…'
                          : 'No result yet',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant
                            .withValues(alpha: 0.5),
                        fontStyle: FontStyle.italic,
                      ),
                    )
                  : SelectableText(
                      resultText,
                      style: theme.textTheme.bodySmall?.copyWith(
                        fontFamily: 'monospace',
                        color: status == 'error'
                            ? AppTheme.dangerColor
                            : null,
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  /// Returns visual properties for the current execution status.
  ({Color color, String label, IconData icon}) _statusStyle(
    String status,
    ThemeData theme,
  ) {
    switch (status) {
      case 'running':
        return (
          color: AppTheme.warningColor,
          label: 'Running',
          icon: Icons.hourglass_top,
        );
      case 'success':
        return (
          color: AppTheme.successColor,
          label: 'Success',
          icon: Icons.check_circle,
        );
      case 'error':
        return (
          color: AppTheme.dangerColor,
          label: 'Error',
          icon: Icons.error,
        );
      default:
        return (
          color: theme.colorScheme.onSurfaceVariant,
          label: 'Idle',
          icon: Icons.circle_outlined,
        );
    }
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

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({
    required this.color,
    required this.label,
    required this.icon,
  });

  final Color color;
  final String label;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: color,
                  fontWeight: FontWeight.w600,
                ),
          ),
        ],
      ),
    );
  }
}
