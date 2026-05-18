import 'dart:convert';

import 'package:flutter/foundation.dart';
import '../models/dbus_member_info.dart';
import '../models/dbus_service_info.dart';
import '../models/tree_node.dart';
import '../models/argument_info.dart';
import '../models/signal_event.dart';
import '../services/dbus_service.dart';

enum SelectedNodeType { group, method, signal, property }

class AppState extends ChangeNotifier {
  final DbusService _dbusService = DbusService();

  // Bus selection
  BusType _activeBus = BusType.session;
  BusType get activeBus => _activeBus;

  // Services
  List<String> _services = [];
  List<String> get services => _services;
  String _filterText = '';
  String get filterText => _filterText;
  List<String> get filteredServices {
    if (_filterText.isEmpty) return _services;
    final parts = _filterText.toLowerCase().split(RegExp(r'\s+'));
    return _services.where((s) {
      final lower = s.toLowerCase();
      return parts.every((p) => lower.contains(p));
    }).toList();
  }

  // Selection state
  String _selectedServiceName = '';
  String get selectedServiceName => _selectedServiceName;
  String _selectedMemberId = '';
  String get selectedMemberId => _selectedMemberId;
  TreeNode? _selectedNode;
  TreeNode? get selectedNode => _selectedNode;
  SelectedNodeType? get selectedNodeType {
    if (_selectedNode == null) return null;
    final type = _selectedNode!.type;
    if (type == TreeNodeType.methodGroup || type == TreeNodeType.signalGroup || type == TreeNodeType.propertyGroup) {
      return SelectedNodeType.group;
    }
    if (type == TreeNodeType.method) return SelectedNodeType.method;
    if (type == TreeNodeType.signal) return SelectedNodeType.signal;
    if (type == TreeNodeType.property) return SelectedNodeType.property;
    return null;
  }
  Map<String, dynamic>? _selectedMemberData;
  Map<String, dynamic>? get selectedMemberData => _selectedMemberData;

  // Tree state
  List<TreeNode> _treeNodes = [];
  List<TreeNode> get treeNodes => _treeNodes;
  final Set<String> _expandedNodeIds = {};
  Set<String> get expandedNodeIds => _expandedNodeIds;
  String _treeSearchText = '';
  String get treeSearchText => _treeSearchText;

  // Browse members
  List<DbusMemberInfo> _browseMembers = [];
  List<DbusMemberInfo> get browseMembers => _browseMembers;

  // Members (flat list for the selected service)
  List<DbusMemberInfo> _members = [];
  List<DbusMemberInfo> get members => _members;

  // Arguments for method invocation
  List<ArgumentInfo> _arguments = [];
  List<ArgumentInfo> get arguments => _arguments;

  // Method execution state
  String _executionStatus = 'idle'; // idle, running, success, error
  String get executionStatus => _executionStatus;
  String _executionResult = '';
  String get executionResult => _executionResult;
  String _executionError = '';
  String get executionError => _executionError;

  // Signal monitoring
  String _activeSubscriptionId = '';
  String get activeSubscriptionId => _activeSubscriptionId;
  final List<SignalEvent> _signalEvents = [];
  List<SignalEvent> get signalEvents => _signalEvents;

  // Loading state
  bool _isLoading = false;
  bool get isLoading => _isLoading;
  String _errorMessage = '';
  String get errorMessage => _errorMessage;

  // Dark mode
  bool _darkMode = false;
  bool get darkMode => _darkMode;

  // --- Bus switching ---
  Future<void> switchBus(BusType bus) async {
    _activeBus = bus;
    _selectedServiceName = '';
    _selectedMemberId = '';
    _selectedNode = null;
    _selectedMemberData = null;
    _treeNodes = [];
    _expandedNodeIds.clear();
    _browseMembers = [];
    _members = [];
    _arguments = [];
    _executionStatus = 'idle';
    _executionResult = '';
    _executionError = '';
    notifyListeners();
    await loadServices();
  }

  // --- Service loading ---
  Future<void> loadServices() async {
    _isLoading = true;
    _errorMessage = '';
    notifyListeners();
    try {
      _services = await _dbusService.listServices(_activeBus);
    } catch (e) {
      _errorMessage = 'Failed to load services: $e';
    }
    _isLoading = false;
    notifyListeners();
  }

  // --- Filter ---
  void setFilter(String text) {
    _filterText = text;
    notifyListeners();
  }

  void setSearchQuery(String text) {
    _filterText = text;
    _treeSearchText = text;
    // If searching, auto-expand parents of matching nodes
    if (text.isNotEmpty) {
      for (final node in _treeNodes) {
        if (_matchesSearch(node, text)) {
          _expandParentsOf(node.id);
        }
      }
    }
    notifyListeners();
  }

  // --- Service selection ---
  Future<void> selectService(String serviceName) async {
    _selectedServiceName = serviceName;
    _selectedMemberId = '';
    _selectedNode = null;
    _selectedMemberData = null;
    _isLoading = true;
    _errorMessage = '';
    notifyListeners();

    try {
      _members = await _dbusService.introspectServiceMembers(serviceName, _activeBus);
      _treeNodes = _buildServiceTree(_members);
      // Auto-expand all paths
      for (final node in _treeNodes) {
        if (node.type == TreeNodeType.path) {
          _expandedNodeIds.add(node.id);
        }
        // Auto-expand single-interface paths
        if (node.type == TreeNodeType.interface) {
          final siblings = _treeNodes.where((n) => n.parentId == node.parentId && n.type == TreeNodeType.interface).length;
          if (siblings <= 1) _expandedNodeIds.add(node.id);
        }
        // Auto-expand groups
        if (node.isGroup) {
          _expandedNodeIds.add(node.id);
        }
      }
      _browseMembers = [];
    } catch (e) {
      _errorMessage = 'Failed to introspect service: $e';
    }
    _isLoading = false;
    notifyListeners();
  }

  // --- Tree toggle ---
  void toggleTreeNode(String nodeId) {
    if (_expandedNodeIds.contains(nodeId)) {
      _expandedNodeIds.remove(nodeId);
    } else {
      _expandedNodeIds.add(nodeId);
    }
    notifyListeners();
  }

  // --- Tree search ---
  void setTreeSearch(String text) {
    _treeSearchText = text;
    if (text.isNotEmpty) {
      // Auto-expand parents of matching nodes
      for (final node in _treeNodes) {
        if (_matchesSearch(node, text)) {
          _expandParentsOf(node.id);
        }
      }
    }
    notifyListeners();
  }

  bool _matchesSearch(TreeNode node, String query) {
    final lower = query.toLowerCase();
    return node.label.toLowerCase().contains(lower) ||
        node.data['type']?.toString().toLowerCase().contains(lower) == true ||
        node.data['path']?.toString().toLowerCase().contains(lower) == true ||
        node.data['interfaceName']?.toString().toLowerCase().contains(lower) == true ||
        node.data['name']?.toString().toLowerCase().contains(lower) == true;
  }

  void _expandParentsOf(String nodeId) {
    var node = _treeNodes.firstWhere((n) => n.id == nodeId, orElse: () => _treeNodes.first);
    while (node.parentId.isNotEmpty) {
      _expandedNodeIds.add(node.parentId);
      node = _treeNodes.firstWhere((n) => n.id == node.parentId, orElse: () => _treeNodes.first);
    }
  }

  // --- Visible tree nodes ---
  List<TreeNode> get visibleTreeNodes {
    return _treeNodes.where((node) {
      // Check parent visibility
      if (node.parentId.isNotEmpty && !_expandedNodeIds.contains(node.parentId)) return false;
      // Check search filter
      if (_treeSearchText.isNotEmpty) {
        return _matchesSearch(node, _treeSearchText) || node.expandable;
      }
      return true;
    }).toList();
  }

  // --- Member selection ---
  void selectMember(String nodeId) {
    final treeNode = _treeNodes.firstWhere((n) => n.id == nodeId, orElse: () => _treeNodes.first);

    // Group node
    if (treeNode.isGroup) {
      _selectedNode = treeNode;
      _selectedMemberData = null;
      _browseMembers = (treeNode.data['members'] as List<DbusMemberInfo>?) ?? [];
      notifyListeners();
      return;
    }

    // Individual member
    final member = _members.firstWhere((m) => m.id == nodeId, orElse: () => _members.first);
    _selectedMemberId = nodeId;
    _selectedNode = treeNode;
    _selectedMemberData = {
      'id': member.id,
      'name': member.name,
      'type': member.type,
      'interfaceName': member.interfaceName,
      'path': member.path,
      'signature': member.signature,
      'returnType': member.returnType,
      'annotation': member.annotation,
    };

    // Set browse members (siblings of same type/interface/path)
    _browseMembers = _members.where((m) =>
        m.type == member.type && m.interfaceName == member.interfaceName && m.path == member.path
    ).toList();

    // Set arguments for methods
    if (member.type == 'method') {
      _arguments = _parseArguments(member.signature);
    } else {
      _arguments = [];
    }

    _executionStatus = 'idle';
    _executionResult = '';
    _executionError = '';
    notifyListeners();
  }

  // --- Argument parsing ---
  List<ArgumentInfo> _parseArguments(String signature) {
    if (signature.isEmpty) return [];
    final args = <ArgumentInfo>[];
    int index = 0;
    int argNum = 1;
    while (index < signature.length) {
      final tokenLen = _signatureTokenLength(signature, index);
      args.add(ArgumentInfo(
        name: 'arg$argNum',
        signature: signature.substring(index, index + tokenLen),
        type: 'input',
        value: '',
      ));
      index += tokenLen;
      argNum++;
    }
    return args;
  }

  int _signatureTokenLength(String sig, int start) {
    if (start >= sig.length) return 0;
    final c = sig[start];
    if (c == 'a') return 1 + _signatureTokenLength(sig, start + 1);
    if (c == '(') {
      int depth = 1, i = start + 1;
      while (i < sig.length && depth > 0) {
        if (sig[i] == '(') depth++;
        if (sig[i] == ')') depth--;
        i++;
      }
      return i - start;
    }
    if (c == '{') {
      int depth = 1, i = start + 1;
      while (i < sig.length && depth > 0) {
        if (sig[i] == '{') depth++;
        if (sig[i] == '}') depth--;
        i++;
      }
      return i - start;
    }
    return 1;
  }

  // --- Argument value update ---
  void setArgumentValue(int index, String value) {
    if (index >= 0 && index < _arguments.length) {
      _arguments[index].value = value;
      notifyListeners();
    }
  }

  // --- Method invocation ---
  Future<void> invokeMethod() async {
    if (_selectedMemberData == null) return;

    _executionStatus = 'running';
    _executionResult = '';
    _executionError = '';
    notifyListeners();

    try {
      // Convert arguments
      final convertedArgs = <dynamic>[];
      for (final arg in _arguments) {
        convertedArgs.add(DbusService.convertValue(arg.signature, arg.value));
      }

      final result = await _dbusService.invokeMethod(
        _selectedServiceName,
        _selectedMemberData!['path'] as String,
        _selectedMemberData!['interfaceName'] as String,
        _selectedMemberData!['name'] as String,
        convertedArgs,
        _activeBus,
      );

      _executionStatus = 'success';
      _executionResult = _formatResult(result);
    } catch (e) {
      _executionStatus = 'error';
      _executionError = e.toString();
    }
    notifyListeners();
  }

  String _formatResult(dynamic value) {
    if (value == null) return '(null)';
    if (value is List) return const JsonEncoder.withIndent('  ').convert(value);
    if (value is Map) return const JsonEncoder.withIndent('  ').convert(value);
    return value.toString();
  }

  // --- Signal subscription ---
  Future<void> subscribeSignal(String path, String interfaceName, String signalName) async {
    final subId = '$_selectedServiceName:$path:$interfaceName:$signalName';
    _activeSubscriptionId = subId;
    notifyListeners();

    final stream = _dbusService.subscribeSignal(
      _selectedServiceName, path, interfaceName, signalName, _activeBus,
    );

    stream.listen((event) {
      _signalEvents.insert(0, SignalEvent(
        time: event['time'] as String,
        topic: event['topic'] as String,
        sender: event['sender'] as String,
        payload: event['payload'] as String,
      ));
      if (_signalEvents.length > 100) _signalEvents.removeLast();
      notifyListeners();
    });
  }

  void unsubscribeSignal() {
    _activeSubscriptionId = '';
    notifyListeners();
  }

  void clearSignalEvents() {
    _signalEvents.clear();
    notifyListeners();
  }

  // --- Tree building ---
  List<TreeNode> _buildServiceTree(List<DbusMemberInfo> members) {
    final nodes = <TreeNode>[];
    final pathMap = <String, bool>{};
    final interfaceMap = <String, bool>{};
    final groupMap = <String, List<DbusMemberInfo>>{};

    // Collect unique paths and interfaces
    for (final m in members) {
      pathMap[m.path] = true;
      final ifaceKey = '${m.path}|${m.interfaceName}';
      interfaceMap[ifaceKey] = true;
      final groupKey = '${m.path}|${m.interfaceName}|${m.type}';
      groupMap.putIfAbsent(groupKey, () => []).add(m);
    }

    // Sort paths
    final paths = pathMap.keys.toList()..sort();

    for (final path in paths) {
      final pathId = 'path|$path';
      nodes.add(TreeNode(
        id: pathId,
        parentId: '',
        label: path,
        type: TreeNodeType.path,
        depth: 0,
        expandable: true,
        data: {'path': path},
      ));

      // Interfaces under this path
      final interfaces = interfaceMap.keys
          .where((k) => k.startsWith('$path|'))
          .map((k) => k.split('|')[1])
          .toList()
        ..sort();

      for (final iface in interfaces) {
        final ifaceId = '$pathId|iface|$iface';
        nodes.add(TreeNode(
          id: ifaceId,
          parentId: pathId,
          label: iface,
          type: TreeNodeType.interface,
          depth: 1,
          expandable: true,
          data: {'path': path, 'interfaceName': iface},
        ));

        // Groups under this interface
        for (final groupType in ['method', 'signal', 'property']) {
          final groupKey = '$path|$iface|$groupType';
          final groupMembers = groupMap[groupKey] ?? [];
          if (groupMembers.isEmpty) continue;

          final groupId = '$ifaceId|group|$groupType';
          final groupNodeType = groupType == 'method'
              ? TreeNodeType.methodGroup
              : groupType == 'signal'
                  ? TreeNodeType.signalGroup
                  : TreeNodeType.propertyGroup;

          nodes.add(TreeNode(
            id: groupId,
            parentId: ifaceId,
            label: '${groupType}s',
            type: groupNodeType,
            depth: 2,
            expandable: false,
            data: {
              'path': path,
              'interfaceName': iface,
              'memberType': groupType,
              'count': groupMembers.length,
              'members': groupMembers,
            },
          ));

          // Individual members
          for (final member in groupMembers) {
            final memberNodeType = member.type == 'method'
                ? TreeNodeType.method
                : member.type == 'signal'
                    ? TreeNodeType.signal
                    : TreeNodeType.property;

            nodes.add(TreeNode(
              id: member.id,
              parentId: groupId,
              label: member.name,
              type: memberNodeType,
              depth: 3,
              expandable: false,
              data: {
                'path': member.path,
                'interfaceName': member.interfaceName,
                'name': member.name,
                'type': member.type,
                'signature': member.signature,
                'returnType': member.returnType,
                'annotation': member.annotation,
              },
            ));
          }
        }
      }
    }

    return nodes;
  }

  // --- Dark mode ---
  void toggleDarkMode() {
    _darkMode = !_darkMode;
    notifyListeners();
  }

  // --- Reset ---
  void resetSelectionState() {
    _selectedMemberId = '';
    _selectedNode = null;
    _selectedMemberData = null;
    _browseMembers = [];
    _arguments = [];
    _executionStatus = 'idle';
    _executionResult = '';
    _executionError = '';
    notifyListeners();
  }

  @override
  void dispose() {
    _dbusService.dispose();
    super.dispose();
  }
}
