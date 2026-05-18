import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/app_state.dart';
import '../widgets/service_tree_pane.dart';
import '../widgets/browse_pane.dart';
import '../widgets/workbench_pane.dart';
import '../widgets/signal_detail_pane.dart';
import '../widgets/property_detail_pane.dart';
import '../widgets/bottom_panel.dart';
import '../models/dbus_service_info.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  double _sidebarWidth = 320.0;
  bool _isDragging = false;
  bool _bottomPanelExpanded = false;

  static const double _minSidebarWidth = 200.0;
  static const double _maxSidebarWidthRatio = 0.6;
  static const double _dividerWidth = 6.0;
  static const double _topBarHeight = 48.0;
  static const double _bottomBarCollapsedHeight = 40.0;
  static const double _bottomBarExpandedHeight = 220.0;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      body: Column(
        children: [
          _buildTopBar(context, isDark),
          Expanded(
            child: Consumer<AppState>(
              builder: (context, appState, _) {
                return Row(
                  children: [
                    // Left sidebar
                    SizedBox(
                      width: _sidebarWidth,
                      child: const ServiceTreePane(),
                    ),
                    // Resizable divider
                    _buildDivider(context),
                    // Right content area
                    Expanded(
                      child: _buildContentArea(appState),
                    ),
                  ],
                );
              },
            ),
          ),
          _buildBottomPanel(),
        ],
      ),
    );
  }

  Widget _buildTopBar(BuildContext context, bool isDark) {
    return Container(
      height: _topBarHeight,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border(
          bottom: BorderSide(
            color: Theme.of(context).colorScheme.outlineVariant,
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          // Title
          Text(
            'DBus Workbench',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(width: 16),
          // Bus type toggle
          Consumer<AppState>(
            builder: (context, appState, _) {
              return SegmentedButton<BusType>(
                segments: const [
                  ButtonSegment<BusType>(
                    value: BusType.session,
                    label: Text('Session'),
                  ),
                  ButtonSegment<BusType>(
                    value: BusType.system,
                    label: Text('System'),
                  ),
                ],
                selected: {appState.activeBus},
                onSelectionChanged: (selected) {
                  appState.switchBus(selected.first);
                },
                style: ButtonStyle(
                  visualDensity: VisualDensity.compact,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  padding: WidgetStateProperty.all(
                    const EdgeInsets.symmetric(horizontal: 12),
                  ),
                ),
              );
            },
          ),
          const SizedBox(width: 12),
          // Search field
          Expanded(
            child: SizedBox(
              height: 34,
              child: Consumer<AppState>(
                builder: (context, appState, _) {
                  return TextField(
                    onChanged: (value) => appState.setSearchQuery(value),
                    decoration: InputDecoration(
                      hintText: 'Search services, interfaces, methods...',
                      hintStyle: TextStyle(
                        color: Theme.of(context)
                            .colorScheme
                            .onSurfaceVariant
                            .withValues(alpha: 0.6),
                        fontSize: 13,
                      ),
                      prefixIcon: Icon(
                        Icons.search,
                        size: 18,
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                      prefixIconConstraints: const BoxConstraints(
                        minWidth: 32,
                        minHeight: 34,
                      ),
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 0,
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide(
                          color: Theme.of(context).colorScheme.outlineVariant,
                        ),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide(
                          color: Theme.of(context).colorScheme.outlineVariant,
                        ),
                      ),
                      filled: true,
                      fillColor: Theme.of(context)
                          .colorScheme
                          .surfaceContainerHighest
                          .withValues(alpha: 0.3),
                    ),
                    style: const TextStyle(fontSize: 13),
                  );
                },
              ),
            ),
          ),
          const SizedBox(width: 8),
          // Dark mode toggle
          IconButton(
            icon: Icon(
              isDark ? Icons.light_mode : Icons.dark_mode,
              size: 20,
            ),
            tooltip: isDark ? 'Switch to light mode' : 'Switch to dark mode',
            onPressed: () {
              final appState = context.read<AppState>();
              appState.toggleDarkMode();
            },
          ),
        ],
      ),
    );
  }

  Widget _buildDivider(BuildContext context) {
    return GestureDetector(
      onHorizontalDragStart: (_) {
        setState(() {
          _isDragging = true;
        });
      },
      onHorizontalDragUpdate: (details) {
        setState(() {
          final screenWidth = MediaQuery.of(context).size.width;
          final maxSidebarWidth = screenWidth * _maxSidebarWidthRatio;
          _sidebarWidth = (_sidebarWidth + details.delta.dx)
              .clamp(_minSidebarWidth, maxSidebarWidth);
        });
      },
      onHorizontalDragEnd: (_) {
        setState(() {
          _isDragging = false;
        });
      },
      child: MouseRegion(
        cursor: SystemMouseCursors.resizeColumn,
        child: Container(
          width: _dividerWidth,
          color: _isDragging
              ? Theme.of(context).colorScheme.primary.withValues(alpha: 0.3)
              : Theme.of(context).colorScheme.outlineVariant.withValues(alpha: 0.5),
          child: Center(
            child: Container(
              width: 1,
              color: Theme.of(context).colorScheme.outlineVariant,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildContentArea(AppState appState) {
    if (appState.selectedNode == null) {
      return _buildEmptyState();
    }

    switch (appState.selectedNodeType) {
      case SelectedNodeType.group:
        return const BrowsePane();
      case SelectedNodeType.method:
        return const WorkbenchPane();
      case SelectedNodeType.signal:
        return const SignalDetailPane();
      case SelectedNodeType.property:
        return const PropertyDetailPane();
      default:
        return _buildEmptyState();
    }
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.developer_board_outlined,
            size: 64,
            color: Theme.of(context)
                .colorScheme
                .onSurfaceVariant
                .withValues(alpha: 0.3),
          ),
          const SizedBox(height: 16),
          Text(
            'Select a service or interface',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: Theme.of(context)
                      .colorScheme
                      .onSurfaceVariant
                      .withValues(alpha: 0.5),
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Choose an item from the service tree to begin',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context)
                      .colorScheme
                      .onSurfaceVariant
                      .withValues(alpha: 0.4),
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomPanel() {
    return GestureDetector(
      onTap: () {
        setState(() {
          _bottomPanelExpanded = !_bottomPanelExpanded;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeInOut,
        height: _bottomPanelExpanded
            ? _bottomBarExpandedHeight
            : _bottomBarCollapsedHeight,
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          border: Border(
            top: BorderSide(
              color: Theme.of(context).colorScheme.outlineVariant,
              width: 1,
            ),
          ),
        ),
        child: Column(
          children: [
            // Activity bar (always visible)
            _buildBottomBarHeader(),
            // Expanded content
            if (_bottomPanelExpanded)
              const Expanded(
                child: BottomPanel(),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomBarHeader() {
    return Container(
      height: _bottomBarCollapsedHeight,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Row(
        children: [
          Icon(
            _bottomPanelExpanded
                ? Icons.keyboard_arrow_down
                : Icons.keyboard_arrow_up,
            size: 18,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
          const SizedBox(width: 8),
          Text(
            'Activity',
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  fontWeight: FontWeight.w500,
                ),
          ),
          const SizedBox(width: 8),
          Consumer<AppState>(
            builder: (context, appState, _) {
              final signalCount = appState.signalEvents.length;
              if (signalCount > 0) {
                return Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: Theme.of(context)
                        .colorScheme
                        .primaryContainer
                        .withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '$signalCount',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color:
                              Theme.of(context).colorScheme.onPrimaryContainer,
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                );
              }
              return const SizedBox.shrink();
            },
          ),
          const Spacer(),
          Consumer<AppState>(
            builder: (context, appState, _) {
              final signalCount = appState.signalEvents.length;
              if (signalCount > 0 && _bottomPanelExpanded) {
                return TextButton.icon(
                  icon: const Icon(Icons.clear_all, size: 16),
                  label: const Text('Clear'),
                  style: TextButton.styleFrom(
                    visualDensity: VisualDensity.compact,
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                  ),
                  onPressed: () => appState.clearSignalEvents(),
                );
              }
              return const SizedBox.shrink();
            },
          ),
        ],
      ),
    );
  }
}
