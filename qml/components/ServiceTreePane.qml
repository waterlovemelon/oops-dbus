import QtQuick 2.11
import QtQuick.Controls 2.4
import QtQuick.Layouts 1.3

Rectangle {
    id: root

    property var theme
    property var model
    property var memberModel
    property var treeModel: []
    property var expandedTreeNodeIds: ({})
    property string selectedServiceId
    property string selectedMemberId
    property string selectedNodeId: ""
    property string searchText: ""

    function isMemberNode(node) {
        return node.type === "method" || node.type === "signal" || node.type === "property";
    }

    function isTypeGroupNode(node) {
        return node.type === "methodGroup" || node.type === "signalGroup" || node.type === "propertyGroup";
    }

    function groupLabel(node) {
        if (node.type === "methodGroup") return "Methods";
        if (node.type === "signalGroup") return "Signals";
        if (node.type === "propertyGroup") return "Properties";
        return node.label;
    }

    function typeAccent(node) {
        if (!node) return theme.textMuted;
        if (node.type === "path") return theme.accent;
        if (node.type === "methodGroup" || node.type === "method") return theme.methodColor;
        if (node.type === "signalGroup" || node.type === "signal") return theme.signalColor;
        if (node.type === "propertyGroup" || node.type === "property") return theme.propertyColor;
        return theme.borderStrong;
    }

    signal serviceSelected(string id, string serviceName, int busType)
    signal memberSelected(string id)
    signal treeNodeToggled(string id)

    color: theme.panelBackground

    ColumnLayout {
        anchors.fill: parent
        spacing: 0

        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: 52
            color: theme.panelBackground

            RowLayout {
                anchors.fill: parent
                anchors.leftMargin: theme.space16
                anchors.rightMargin: theme.space16
                spacing: theme.space8

                Label {
                    text: "Explorer"
                    font.pixelSize: theme.sectionFont
                    font.weight: Font.DemiBold
                    color: theme.textPrimary
                }

                Item { Layout.fillWidth: true }

                Label {
                    text: root.searchText.trim().length > 0 ? "Filtered" : (root.model ? root.model.rowCount() + " services" : "0 services")
                    font.pixelSize: theme.smallFont
                    color: theme.textMuted
                }
            }
        }

        Rectangle {
            Layout.fillWidth: true
            height: 1
            color: theme.divider
        }

        ListView {
            id: serviceList
            Layout.fillWidth: true
            Layout.fillHeight: true
            clip: true
            model: root.model
            spacing: 6
            topMargin: theme.space8
            bottomMargin: theme.space12

            delegate: Column {
                id: serviceDelegate
                width: serviceList.width

                property bool isExpanded: root.selectedServiceId === id

                Rectangle {
                    width: parent.width
                    height: 40
                    radius: theme.controlRadius
                    color: serviceMouse.containsMouse || serviceDelegate.isExpanded ? theme.hoverBackground : "transparent"

                    Rectangle {
                        visible: serviceDelegate.isExpanded
                        anchors.left: parent.left
                        anchors.top: parent.top
                        anchors.bottom: parent.bottom
                        width: 3
                        radius: 2
                        color: theme.accent
                    }

                    RowLayout {
                        anchors.fill: parent
                        anchors.leftMargin: 12
                        anchors.rightMargin: 12
                        spacing: 8

                        Label {
                            text: serviceDelegate.isExpanded ? "▾" : "▸"
                            font.pixelSize: 10
                            color: theme.textMuted
                        }

                        Label {
                            Layout.fillWidth: true
                            text: label
                            font.pixelSize: theme.bodyFont
                            font.weight: Font.Medium
                            color: serviceDelegate.isExpanded ? theme.textPrimary : theme.textSecondary
                            elide: Text.ElideRight
                        }
                    }

                    MouseArea {
                        id: serviceMouse
                        anchors.fill: parent
                        hoverEnabled: true
                        cursorShape: Qt.PointingHandCursor
                        onClicked: root.serviceSelected(id, label, busType)
                    }
                }

                ListView {
                    id: memberList
                    width: parent.width
                    visible: serviceDelegate.isExpanded && root.selectedServiceId === id
                    height: visible ? contentHeight : 0
                    clip: true
                    model: root.treeModel
                    interactive: false
                    spacing: 2

                    delegate: Rectangle {
                        width: memberList.width
                        height: modelData.type === "path" ? 40 : 36
                        radius: theme.controlRadius
                        color: {
                            if (root.isMemberNode(modelData) || root.isTypeGroupNode(modelData)) {
                                return (root.selectedMemberId === modelData.id || root.selectedNodeId === modelData.id)
                                    ? theme.selectedBackground
                                    : (treeMouse.containsMouse ? theme.hoverBackground : "transparent");
                            }
                            return treeMouse.containsMouse ? theme.hoverBackground : "transparent";
                        }

                        Rectangle {
                            visible: root.selectedMemberId === modelData.id || root.selectedNodeId === modelData.id
                            anchors.left: parent.left
                            anchors.top: parent.top
                            anchors.bottom: parent.bottom
                            width: 3
                            radius: 2
                            color: root.typeAccent(modelData)
                        }

                        RowLayout {
                            anchors.fill: parent
                            anchors.leftMargin: 12 + (modelData.depth * 18)
                            anchors.rightMargin: 12
                            spacing: 8

                            Label {
                                width: 12
                                horizontalAlignment: Text.AlignHCenter
                                text: {
                                    if (!modelData.expandable)
                                        return "";
                                    return root.expandedTreeNodeIds[modelData.id] ? "▾" : "▸";
                                }
                                color: theme.textMuted
                                font.pixelSize: 10
                            }

                            Rectangle {
                                width: modelData.type === "path" ? 8 : 6
                                height: modelData.type === "path" ? 8 : 6
                                radius: width / 2
                                visible: root.isMemberNode(modelData) || modelData.type === "path" || modelData.type === "interface" || root.isTypeGroupNode(modelData)
                                color: root.typeAccent(modelData)
                            }

                            ColumnLayout {
                                Layout.fillWidth: true
                                spacing: 1

                                Label {
                                    Layout.fillWidth: true
                                    text: root.isTypeGroupNode(modelData) ? root.groupLabel(modelData) : modelData.label
                                    font.pixelSize: modelData.type === "path" ? theme.bodyFont : theme.smallFont
                                    font.family: modelData.type === "path" || modelData.type === "interface" || root.isMemberNode(modelData) ? "monospace" : undefined
                                    font.weight: modelData.type === "path" ? Font.DemiBold : ((modelData.type === "interface" || root.isTypeGroupNode(modelData)) ? Font.Medium : Font.Normal)
                                    color: {
                                        if (root.isMemberNode(modelData)) return theme.textPrimary;
                                        if (modelData.type === "interface") return theme.textSecondary;
                                        if (root.isTypeGroupNode(modelData)) return theme.textSecondary;
                                        return theme.textPrimary;
                                    }
                                    elide: Text.ElideRight
                                }

                                Label {
                                    visible: modelData.type === "path"
                                    Layout.fillWidth: true
                                    text: "Object path"
                                    font.pixelSize: 10
                                    color: theme.textMuted
                                }

                                Label {
                                    visible: modelData.type === "interface"
                                    Layout.fillWidth: true
                                    text: "Interface"
                                    font.pixelSize: 10
                                    color: theme.textMuted
                                }
                            }

                            Label {
                                visible: root.isTypeGroupNode(modelData)
                                text: modelData.data && modelData.data.count ? modelData.data.count : ""
                                font.pixelSize: 11
                                font.weight: Font.Medium
                                color: theme.textMuted
                            }

                            Label {
                                visible: root.isMemberNode(modelData)
                                text: modelData.type
                                font.pixelSize: 11
                                color: theme.textMuted
                            }
                        }

                        MouseArea {
                            id: treeMouse
                            anchors.fill: parent
                            hoverEnabled: true
                            cursorShape: Qt.PointingHandCursor
                            onClicked: {
                                if (modelData.expandable) {
                                    root.treeNodeToggled(modelData.id);
                                } else {
                                    root.memberSelected(modelData.id);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
