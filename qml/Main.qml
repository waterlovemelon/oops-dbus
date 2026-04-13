import QtQuick 2.11
import QtQuick.Controls 2.4
import QtQuick.Layouts 1.3
import QtQuick.Window 2.11
import "SampleData.js" as SampleData
import "components"
import DbusWorkbench 1.0

ApplicationWindow {
    id: window

    width: 1280
    height: 800
    minimumWidth: 1100
    minimumHeight: 680
    visible: true
    title: "D-Bus Workbench"
    color: "transparent"
    flags: Qt.FramelessWindowHint | Qt.Window | Qt.WindowMinimizeButtonHint | Qt.WindowMaximizeButtonHint

    DBusManager {
        id: dbusManager
    }

    ServiceExplorer {
        id: serviceExplorer
    }

    ServiceModel {
        id: serviceModel
    }

    MemberModel {
        id: memberModel
    }

    ArgumentModel {
        id: argumentModel
    }

    MethodInvoker {
        id: methodInvoker

        onInvocationCompleted: function(success, result, error) {
            window.methodExecutionStatus = success ? "success" : "error";
            window.methodExecutionError = success ? "" : error;
            window.methodExecutionText = success ? window.formatDetailValue(result) : error;

            if (success) {
                showToast("执行完成");
            } else {
                showToast("执行失败: " + error);
            }
        }

        onInvocationFailed: function(error) {
            window.methodExecutionStatus = "error";
            window.methodExecutionError = error;
            window.methodExecutionText = error;
            showToast("执行失败: " + error);
        }
    }

    SignalMonitor {
        id: signalMonitor

        onSignalReceived: function(event) {
            signalEventModel.addEvent(event);
        }
    }

    SignalEventModel {
        id: signalEventModel
    }

    Theme {
        id: theme
    }

    Component.onCompleted: {
        loadServices();
    }

    function loadServices() {
        var busType = window.activeBus === "session" ? 0 : 1;
        var services = serviceExplorer.listServices(busType);
        serviceModel.setServices(services, busType);
    }

    property var serviceModel: serviceModel
    property var memberModel: memberModel
    property var methodModel: argumentModel
    property var signalModel: signalEventModel
    property string activeBus: "session"
    property string activeMode: "browse"
    property string selectedServiceId: ""
    property string selectedServiceName: ""
    property string selectedMemberId: ""
    property var selectedNode: ({})
    property var serviceTreeNodes: []
    property var expandedTreeNodeIds: ({})
    property var browseMembers: []
    property string treeSearchText: ""
    property string methodExecutionStatus: "idle"
    property string methodExecutionText: ""
    property string methodExecutionError: ""
    property string activeSignalSubscriptionId: ""
    property real leftPaneWidth: 320
    property real leftPaneMinWidth: 280
    property real splitterWidth: 10
    property real contentMinWidth: 500
    property point startMousePos
    property point startWindowPos
    property bool darkMode: false
    property real outerRadius: window.visibility === Window.Maximized ? 0 : theme.windowRadius

    function resetSelectionState() {
        window.selectedServiceId = "";
        window.selectedServiceName = "";
        window.selectedMemberId = "";
        window.selectedNode = ({})
        window.serviceTreeNodes = [];
        window.expandedTreeNodeIds = ({})
        window.browseMembers = [];
        window.methodExecutionStatus = "idle";
        window.methodExecutionText = "";
        window.methodExecutionError = "";
        window.activeSignalSubscriptionId = "";
        memberModel.clear();
    }

    function switchBus(bus) {
        if (window.activeBus === bus)
            return;

        window.activeBus = bus;
        resetSelectionState();
        loadServices();
    }

    function beginWindowDrag(mouseX, mouseY) {
        window.startMousePos = Qt.point(mouseX, mouseY);
        window.startWindowPos = Qt.point(window.x, window.y);
    }

    function continueWindowDrag(mouseX, mouseY) {
        if (window.visibility === Window.Maximized)
            return;
        var dx = mouseX - window.startMousePos.x;
        var dy = mouseY - window.startMousePos.y;
        window.x = window.startWindowPos.x + dx;
        window.y = window.startWindowPos.y + dy;
    }

    function toggleMaximize() {
        if (window.visibility === Window.Maximized) {
            window.showNormal();
        } else {
            window.showMaximized();
        }
    }

    function clampLeftPaneWidth(candidateWidth) {
        var maximumWidth = Math.max(leftPaneMinWidth, window.width - contentMinWidth - splitterWidth);
        return Math.max(leftPaneMinWidth, Math.min(candidateWidth, maximumWidth));
    }

    function showToast(msg) {
        toast.show(msg);
    }

    function formatDetailValue(value) {
        if (value === undefined || value === null) {
            return "";
        }
        if (Array.isArray(value) || typeof value === "object") {
            return JSON.stringify(value, null, 2);
        }
        return value.toString();
    }

    function currentDetailMode() {
        if (window.activeMode === "browse" || !window.selectedNode || !window.selectedNode.type) {
            return "browse";
        }
        if (window.selectedNode.type === "method") {
            return "method";
        }
        if (window.selectedNode.type === "signal") {
            return "signal";
        }
        if (window.selectedNode.type === "property") {
            return "property";
        }
        return "browse";
    }

    function signalSubscriptionId(node) {
        if (!node || !node.path || !node.interfaceName || !node.name) {
            return "";
        }
        return [window.activeBus, window.selectedServiceName, node.path, node.interfaceName, node.name].join("|");
    }

    function isSignalSubscribed(node) {
        return signalSubscriptionId(node) !== "" && signalSubscriptionId(node) === window.activeSignalSubscriptionId;
    }

    function updateSignalSubscription(node, shouldSubscribe) {
        if (!node || node.type !== "signal") {
            return;
        }

        var busType = window.activeBus === "session" ? 0 : 1;
        var subscriptionId = signalSubscriptionId(node);
        if (shouldSubscribe) {
            var subscribed = signalMonitor.subscribe(window.selectedServiceName, node.path || "/", node.interfaceName, node.name, busType);
            if (subscribed) {
                window.activeSignalSubscriptionId = subscriptionId;
                showToast("已开始监听信号");
            } else {
                showToast("监听失败");
            }
            return;
        }

        signalMonitor.unsubscribe(window.selectedServiceName, node.path || "/", node.interfaceName, node.name, busType);
        if (window.activeSignalSubscriptionId === subscriptionId) {
            window.activeSignalSubscriptionId = "";
        }
        showToast("已停止监听");
    }

    function findTreeNodeById(nodeId) {
        for (var i = 0; i < window.serviceTreeNodes.length; i++) {
            if (window.serviceTreeNodes[i].id === nodeId) {
                return window.serviceTreeNodes[i];
            }
        }
        return null;
    }

    function memberDataFromModelIndex(idx) {
        return {
            id: memberModel.data(idx, MemberModel.IdRole),
            name: memberModel.data(idx, MemberModel.NameRole),
            type: memberModel.data(idx, MemberModel.TypeRole),
            interfaceName: memberModel.data(idx, MemberModel.InterfaceNameRole),
            path: memberModel.data(idx, MemberModel.PathRole),
            signature: memberModel.data(idx, MemberModel.SignatureRole),
            returnType: memberModel.data(idx, MemberModel.ReturnTypeRole),
            annotation: memberModel.data(idx, MemberModel.AnnotationRole),
            label: memberModel.data(idx, MemberModel.NameRole)
        };
    }

    function updateSelectedNode(nodeId) {
        var treeNode = findTreeNodeById(nodeId);
        if (treeNode && (treeNode.type === "methodGroup" || treeNode.type === "signalGroup" || treeNode.type === "propertyGroup")) {
            window.selectedNode = {
                id: treeNode.id,
                name: treeNode.data.memberType,
                label: treeNode.data.memberType.charAt(0).toUpperCase() + treeNode.data.memberType.slice(1) + "s (" + treeNode.data.count + ")",
                type: treeNode.type,
                interfaceName: treeNode.data.interfaceName,
                path: treeNode.data.path,
                summary: treeNode.data.count + " " + treeNode.data.memberType + (treeNode.data.count === 1 ? "" : "s"),
                annotation: "group"
            };
            window.browseMembers = treeNode.data.members || [];
            return;
        }

        var allMembers = [];
        var matchedMember = null;
        for (var i = 0; i < memberModel.rowCount(); i++) {
            var idx = memberModel.index(i, 0);
            var memberData = memberDataFromModelIndex(idx);
            allMembers.push(memberData);

            if (memberData.id === nodeId) {
                matchedMember = memberData;
            }
        }

        if (matchedMember) {
            window.selectedNode = matchedMember;
            window.browseMembers = allMembers.filter(function(member) {
                return member.type === matchedMember.type && member.interfaceName === matchedMember.interfaceName && member.path === matchedMember.path;
            });
            if (matchedMember.type === "method") {
                argumentModel.setArgumentsFromSignature(matchedMember.signature || "");
            } else {
                argumentModel.clear();
            }
            return;
        }

        window.selectedNode = ({})
        window.browseMembers = [];
        argumentModel.clear();
    }

    function createTreeNode(id, parentId, label, type, depth, expandable, data) {
        return {
            id: id,
            parentId: parentId || "",
            label: label,
            type: type,
            depth: depth,
            expandable: expandable,
            data: data || ({})
        };
    }

    function buildServiceTree(members) {
        var groupedPaths = {};
        for (var i = 0; i < members.length; i++) {
            var member = members[i];
            var memberPath = member.path || "/";
            var interfaceName = member.interfaceName || "";
            if (!groupedPaths[memberPath]) {
                groupedPaths[memberPath] = {};
            }
            if (!groupedPaths[memberPath][interfaceName]) {
                groupedPaths[memberPath][interfaceName] = [];
            }
            groupedPaths[memberPath][interfaceName].push(member);
        }

        var pathKeys = Object.keys(groupedPaths).sort();
        var nodes = [];
        for (var pathIndex = 0; pathIndex < pathKeys.length; pathIndex++) {
            var pathKey = pathKeys[pathIndex];
            var pathNodeId = "path|" + pathKey;
            nodes.push(createTreeNode(pathNodeId, "", pathKey, "path", 0, true, { path: pathKey }));

            var interfaces = groupedPaths[pathKey];
            var interfaceKeys = Object.keys(interfaces).sort();
            for (var interfaceIndex = 0; interfaceIndex < interfaceKeys.length; interfaceIndex++) {
                var interfaceKey = interfaceKeys[interfaceIndex];
                var interfaceNodeId = pathNodeId + "|iface|" + interfaceKey;
                nodes.push(createTreeNode(interfaceNodeId, pathNodeId, interfaceKey, "interface", 1, true, {
                    path: pathKey,
                    interfaceName: interfaceKey
                }));

                var interfaceMembers = interfaces[interfaceKey];
                var membersByType = {
                    method: [],
                    signal: [],
                    property: []
                };

                for (var memberIndex = 0; memberIndex < interfaceMembers.length; memberIndex++) {
                    var treeMember = interfaceMembers[memberIndex];
                    if (!membersByType[treeMember.type]) {
                        membersByType[treeMember.type] = [];
                    }
                    membersByType[treeMember.type].push(treeMember);
                }

                var memberTypes = ["method", "signal", "property"];
                for (var typeIndex = 0; typeIndex < memberTypes.length; typeIndex++) {
                    var memberType = memberTypes[typeIndex];
                    var typedMembers = membersByType[memberType];
                    if (!typedMembers || typedMembers.length === 0) {
                        continue;
                    }

                    typedMembers.sort(function(a, b) {
                        return a.name.localeCompare(b.name);
                    });

                    var typeNodeId = interfaceNodeId + "|group|" + memberType;
                    nodes.push(createTreeNode(typeNodeId, interfaceNodeId, memberType, memberType + "Group", 2, false, {
                        path: pathKey,
                        interfaceName: interfaceKey,
                        memberType: memberType,
                        count: typedMembers.length,
                        members: typedMembers,
                        label: memberType
                    }));

                    for (var typedMemberIndex = 0; typedMemberIndex < typedMembers.length; typedMemberIndex++) {
                        var typedMember = typedMembers[typedMemberIndex];
                        nodes.push(createTreeNode(typedMember.id, typeNodeId, typedMember.name, typedMember.type, 3, false, typedMember));
                    }
                }
            }
        }

        return nodes;
    }

    function isTreeNodeVisible(node) {
        if (node.depth === 0) {
            return true;
        }

        if (!node.parentId) {
            return true;
        }

        return !!window.expandedTreeNodeIds[node.parentId];
    }

    function matchesTreeSearch(node, normalizedSearch) {
        if (!normalizedSearch) {
            return false;
        }

        var fields = [node.label, node.type];
        if (node.data) {
            fields.push(node.data.path);
            fields.push(node.data.interfaceName);
            fields.push(node.data.name);
            fields.push(node.data.type);
        }

        for (var i = 0; i < fields.length; i++) {
            var value = fields[i];
            if (value && value.toString().toLowerCase().indexOf(normalizedSearch) !== -1) {
                return true;
            }
        }

        return false;
    }

    function visibleServiceTreeNodes() {
        var visibleNodes = [];
        var normalizedSearch = window.treeSearchText.trim().toLowerCase();
        var matchesById = {};

        if (normalizedSearch) {
            for (var matchIndex = 0; matchIndex < window.serviceTreeNodes.length; matchIndex++) {
                var candidate = window.serviceTreeNodes[matchIndex];
                if (!matchesTreeSearch(candidate, normalizedSearch)) {
                    continue;
                }

                matchesById[candidate.id] = true;

                var currentParentId = candidate.parentId;
                while (currentParentId) {
                    matchesById[currentParentId] = true;

                    var parentNode = null;
                    for (var parentIndex = 0; parentIndex < window.serviceTreeNodes.length; parentIndex++) {
                        if (window.serviceTreeNodes[parentIndex].id === currentParentId) {
                            parentNode = window.serviceTreeNodes[parentIndex];
                            break;
                        }
                    }

                    currentParentId = parentNode ? parentNode.parentId : "";
                }
            }
        }

        for (var i = 0; i < window.serviceTreeNodes.length; i++) {
            var node = window.serviceTreeNodes[i];
            var visibleBySearch = !normalizedSearch || matchesById[node.id];
            if (!visibleBySearch) {
                continue;
            }
            if (normalizedSearch || isTreeNodeVisible(node)) {
                visibleNodes.push(node);
            }
        }
        return visibleNodes;
    }

    function toggleTreeNode(nodeId) {
        var nextExpanded = {};
        for (var key in window.expandedTreeNodeIds) {
            nextExpanded[key] = window.expandedTreeNodeIds[key];
        }
        nextExpanded[nodeId] = !nextExpanded[nodeId];
        window.expandedTreeNodeIds = nextExpanded;
    }

    onWidthChanged: leftPaneWidth = clampLeftPaneWidth(leftPaneWidth)

    Rectangle {
        anchors.fill: parent
        radius: window.outerRadius
        color: theme.appBackground
        border.width: window.visibility === Window.Maximized ? 0 : 1
        border.color: theme.borderSubtle
        clip: true

        ColumnLayout {
            anchors.fill: parent
            spacing: 0

            AppTopBar {
                id: topBar
                Layout.fillWidth: true
                theme: theme
                activeBus: window.activeBus
                maximized: window.visibility === Window.Maximized
                darkMode: theme.darkMode

                onDragRequested: window.beginWindowDrag(mouseX, mouseY)
                onDragMoved: window.continueWindowDrag(mouseX, mouseY)
                onTitleDoubleClicked: window.toggleMaximize()
                onBusSelected: window.switchBus(bus)
                onSearchChanged: {
                    window.treeSearchText = text;
                    serviceModel.filterText = window.selectedServiceId === "" ? text : "";
                }
                onThemeToggled: theme.darkMode = !theme.darkMode
                onMinimizeRequested: window.showMinimized()
                onMaximizeRequested: window.toggleMaximize()
                onCloseRequested: window.close()
            }

            RowLayout {
                Layout.fillWidth: true
                Layout.fillHeight: true
                spacing: 0

                ServiceTreePane {
                    id: sidebar
                    Layout.fillHeight: true
                    Layout.preferredWidth: window.leftPaneWidth
                    theme: theme
                    model: serviceModel
                    memberModel: memberModel
                    treeModel: visibleServiceTreeNodes()
                    expandedTreeNodeIds: window.expandedTreeNodeIds
                    selectedServiceId: window.selectedServiceId
                    selectedMemberId: window.selectedMemberId
                    selectedNodeId: window.selectedNode.id || ""
                    searchText: window.treeSearchText

                    onServiceSelected: function(id, serviceName, busType) {
                        if (window.selectedServiceId === id) {
                            resetSelectionState();
                            return;
                        }

                        window.selectedServiceId = id;
                        window.selectedServiceName = serviceName;
                        window.selectedMemberId = "";
                        window.selectedNode = ({})
                        window.browseMembers = [];
                        window.methodExecutionStatus = "idle";
                        window.methodExecutionText = "";
                        window.methodExecutionError = "";
                        window.activeSignalSubscriptionId = "";

                        var members = serviceExplorer.introspectServiceMembers(serviceName, busType);
                        memberModel.setMembersFromVariantList(members);
                        window.serviceTreeNodes = buildServiceTree(members);

                        var expandedNodes = {};
                        var interfaceGroups = {};
                        var typeGroups = {};
                        for (var i = 0; i < window.serviceTreeNodes.length; i++) {
                            var node = window.serviceTreeNodes[i];
                            if (node.type === "path") {
                                expandedNodes[node.id] = true;
                            }
                            if (node.type === "interface") {
                                var pathId = node.parentId;
                                if (!interfaceGroups[pathId]) {
                                    interfaceGroups[pathId] = [];
                                }
                                interfaceGroups[pathId].push(node.id);
                            }
                            if (node.type === "methodGroup" || node.type === "signalGroup" || node.type === "propertyGroup") {
                                var interfaceId = node.parentId;
                                if (!typeGroups[interfaceId]) {
                                    typeGroups[interfaceId] = [];
                                }
                                typeGroups[interfaceId].push(node.id);
                            }
                        }
                        for (var pathKey in interfaceGroups) {
                            if (interfaceGroups[pathKey].length === 1) {
                                expandedNodes[interfaceGroups[pathKey][0]] = true;
                            }
                        }
                        for (var interfaceKey in typeGroups) {
                            var groups = typeGroups[interfaceKey];
                            for (var groupIndex = 0; groupIndex < groups.length; groupIndex++) {
                                expandedNodes[groups[groupIndex]] = true;
                            }
                        }
                        window.expandedTreeNodeIds = expandedNodes;
                    }

                    onMemberSelected: function(id) {
                        var treeNode = findTreeNodeById(id);
                        var isGroupNode = treeNode && (treeNode.type === "methodGroup" || treeNode.type === "signalGroup" || treeNode.type === "propertyGroup");
                        window.selectedMemberId = isGroupNode ? "" : id;
                        window.activeMode = isGroupNode ? "browse" : "detail";
                        window.methodExecutionStatus = "idle";
                        window.methodExecutionText = "";
                        window.methodExecutionError = "";
                        updateSelectedNode(id);
                    }

                    onTreeNodeToggled: function(id) {
                        toggleTreeNode(id);
                    }
                }

                Item {
                    id: splitter
                    width: window.splitterWidth
                    Layout.fillHeight: true

                    Rectangle {
                        anchors.centerIn: parent
                        width: splitterMouse.containsMouse || splitterMouse.pressed ? 3 : 1
                        height: parent.height
                        radius: 1
                        color: splitterMouse.containsMouse || splitterMouse.pressed ? theme.accent : theme.divider
                        Behavior on width { NumberAnimation { duration: 120 } }
                        Behavior on color { ColorAnimation { duration: 120 } }
                    }

                    MouseArea {
                        id: splitterMouse
                        anchors.fill: parent
                        hoverEnabled: true
                        cursorShape: Qt.SizeHorCursor
                        property real startWidth: 0
                        property real startMouseX: 0

                        onPressed: {
                            startWidth = window.leftPaneWidth;
                            startMouseX = mouseX;
                        }

                        onPositionChanged: {
                            if (!pressed) {
                                return;
                            }
                            window.leftPaneWidth = window.clampLeftPaneWidth(startWidth + (mouseX - startMouseX));
                        }
                    }
                }

                ColumnLayout {
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    spacing: 0

                    Loader {
                        id: contentLoader
                        Layout.fillWidth: true
                        Layout.fillHeight: true
                        sourceComponent: {
                            switch (window.currentDetailMode()) {
                            case "method":
                                return methodComponent;
                            case "signal":
                                return signalComponent;
                            case "property":
                                return propertyComponent;
                            default:
                                return browseComponent;
                            }
                        }
                    }

                    BottomPanel {
                        id: drawer
                        Layout.fillWidth: true
                        theme: theme
                        signalEventModel: signalEventModel
                        callHistory: SampleData.callHistory()
                    }
                }
            }

            Toast {
                id: toast
                theme: theme
                Layout.alignment: Qt.AlignHCenter | Qt.AlignBottom
                Layout.bottomMargin: 56
                z: 100
            }
        }
    }

    Component {
        id: browseComponent

        BrowsePane {
            theme: theme
            node: window.selectedNode
            model: window.browseMembers
            selectedNodeId: window.selectedMemberId

            onMemberClicked: function(member) {
                window.selectedMemberId = member.id || "";
                window.selectedNode = member || ({})
                if (member && member.type === "method") {
                    argumentModel.setArgumentsFromSignature(member.signature || "");
                    window.methodExecutionStatus = "idle";
                    window.methodExecutionText = "";
                    window.methodExecutionError = "";
                } else {
                    argumentModel.clear();
                }
                window.activeMode = "detail";
            }

            onCopyRequested: function(type, method) {
                window.showToast("已复制 " + type + " 命令");
            }
        }
    }

    Component {
        id: methodComponent

        WorkbenchPane {
            theme: theme
            node: window.selectedNode
            argumentModel: window.methodModel
            executionStatus: window.methodExecutionStatus
            executionText: window.methodExecutionText
            executionError: window.methodExecutionError

            onBackRequested: {
                window.activeMode = "browse";
            }

            onCopyRequested: function(type) {
                window.showToast("已复制 " + type + " 命令");
            }

            onExecuted: {
                var busType = window.activeBus === "session" ? 0 : 1;
                var serviceName = window.selectedServiceName;
                var path = window.selectedNode.path || "/";
                var interfaceName = window.selectedNode.interfaceName;
                var methodName = window.selectedNode.name;
                var arguments = window.methodModel.getArgumentValues();
                var argumentError = window.methodModel.lastError();

                if (argumentError) {
                    window.methodExecutionStatus = "error";
                    window.methodExecutionText = argumentError;
                    window.methodExecutionError = argumentError;
                    showToast("执行失败: " + argumentError);
                    return;
                }

                window.methodExecutionStatus = "running";
                window.methodExecutionText = "";
                window.methodExecutionError = "";

                if (!methodInvoker.invokeMethod(serviceName, path, interfaceName, methodName, arguments, busType)) {
                    var invokeError = "调用失败";
                    window.methodExecutionStatus = "error";
                    window.methodExecutionText = invokeError;
                    window.methodExecutionError = invokeError;
                }
            }
        }
    }

    Component {
        id: signalComponent

        SignalDetailPane {
            theme: theme
            node: window.selectedNode
            signalEventModel: signalEventModel
            subscribed: window.isSignalSubscribed(window.selectedNode)

            onBackRequested: {
                window.activeMode = "browse";
            }

            onSubscribeRequested: {
                window.updateSignalSubscription(window.selectedNode, true);
            }

            onUnsubscribeRequested: {
                window.updateSignalSubscription(window.selectedNode, false);
            }
        }
    }

    Component {
        id: propertyComponent

        PropertyDetailPane {
            theme: theme
            node: window.selectedNode

            onBackRequested: {
                window.activeMode = "browse";
            }
        }
    }
}
