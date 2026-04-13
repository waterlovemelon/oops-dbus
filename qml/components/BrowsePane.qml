import QtQuick 2.11
import QtQuick.Controls 2.4
import QtQuick.Layouts 1.3

Rectangle {
    id: root

    property var theme
    property var node: ({})
    property var model
    property string selectedNodeId: ""

    signal memberClicked(var member)
    signal copyRequested(string type, string method)

    color: theme.appBackground

    ColumnLayout {
        anchors.fill: parent
        spacing: 0

        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: 108
            color: theme.panelBackground

            ColumnLayout {
                anchors.fill: parent
                anchors.leftMargin: 28
                anchors.rightMargin: 28
                anchors.topMargin: 18
                anchors.bottomMargin: 16
                spacing: 6

                Row {
                    spacing: 6

                    Label {
                        visible: !!root.node.path
                        text: root.node.path || ""
                        font.pixelSize: theme.bodyFont
                        color: theme.textMuted
                        font.family: "monospace"
                    }

                    Label {
                        visible: !!root.node.path && !!root.node.interfaceName
                        text: "·"
                        font.pixelSize: theme.bodyFont
                        color: theme.textMuted
                    }

                    Label {
                        visible: !!root.node.interfaceName
                        text: root.node.interfaceName || ""
                        font.pixelSize: theme.bodyFont
                        color: theme.textMuted
                        font.family: "monospace"
                    }
                }

                Label {
                    text: root.node.label || root.node.name || "Browse"
                    font.pixelSize: 22
                    font.weight: Font.DemiBold
                    color: theme.textPrimary
                }

                Label {
                    text: root.node.summary || (root.model ? (root.model.length + " items") : "")
                    font.pixelSize: theme.bodyFont
                    color: theme.textSecondary
                }
            }

            Rectangle {
                anchors.bottom: parent.bottom
                anchors.left: parent.left
                anchors.right: parent.right
                height: 1
                color: theme.divider
            }
        }

        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true
            color: theme.appBackground

            ListView {
                id: memberList
                anchors.fill: parent
                clip: true
                topMargin: 12
                bottomMargin: 28
                leftMargin: 20
                rightMargin: 20
                spacing: 8
                model: root.model

                delegate: Rectangle {
                    id: memberRow

                    property var itemData: (modelData && typeof modelData === "object" && modelData.name !== undefined) ? modelData : model
                    property bool copyMenuOpen: false
                    property bool showActions: rowMouse.containsMouse || copyMenuOpen

                    width: memberList.width - memberList.leftMargin - memberList.rightMargin
                    height: 56
                    radius: theme.panelRadius
                    color: root.selectedNodeId === itemData.id ? theme.selectedBackground : theme.panelBackground
                    border.width: 1
                    border.color: root.selectedNodeId === itemData.id ? theme.focusRing : (rowMouse.containsMouse ? theme.borderStrong : theme.borderSubtle)

                    Rectangle {
                        visible: root.selectedNodeId === itemData.id
                        anchors.left: parent.left
                        anchors.top: parent.top
                        anchors.bottom: parent.bottom
                        width: 3
                        radius: 2
                        color: itemData.type === "method" ? theme.methodColor : (itemData.type === "signal" ? theme.signalColor : theme.propertyColor)
                    }

                    RowLayout {
                        anchors.fill: parent
                        anchors.leftMargin: 16
                        anchors.rightMargin: 12
                        spacing: 14

                        Rectangle {
                            width: 8
                            height: 8
                            radius: 4
                            color: {
                                if (itemData.type === "method") return theme.methodColor;
                                if (itemData.type === "signal") return theme.signalColor;
                                if (itemData.type === "property") return theme.propertyColor;
                                return theme.textMuted;
                            }
                        }

                        RowLayout {
                            Layout.fillWidth: true
                            spacing: 8

                            Label {
                                text: itemData.name
                                font.pixelSize: 15
                                font.weight: Font.Medium
                                font.family: "monospace"
                                color: theme.textPrimary
                                Layout.alignment: Qt.AlignVCenter
                            }

                            Label {
                                visible: !!itemData.signature
                                text: itemData.signature || ""
                                font.pixelSize: theme.bodyFont
                                color: theme.textSecondary
                                elide: Text.ElideRight
                                Layout.fillWidth: true
                                Layout.alignment: Qt.AlignVCenter
                            }

                            Item { Layout.fillWidth: true }
                        }

                        Row {
                            spacing: 4
                            visible: memberRow.showActions

                            Rectangle {
                                width: 30
                                height: 30
                                radius: theme.controlRadius
                                color: itemData.type === "method" ? (execMouse.containsMouse ? theme.selectedBackground : "transparent") : "transparent"
                                visible: itemData.type === "method"

                                Label {
                                    anchors.centerIn: parent
                                    text: "▶"
                                    font.pixelSize: 11
                                    color: theme.accent
                                }

                                MouseArea {
                                    id: execMouse
                                    anchors.fill: parent
                                    hoverEnabled: true
                                    cursorShape: Qt.PointingHandCursor
                                    onClicked: root.memberClicked(itemData)
                                }
                            }

                            Rectangle {
                                id: copyBtn
                                width: 30
                                height: 30
                                radius: theme.controlRadius
                                color: copyMouse.containsMouse ? theme.hoverBackground : "transparent"
                                visible: memberRow.showActions

                                Label {
                                    anchors.centerIn: parent
                                    text: "⎘"
                                    font.pixelSize: 13
                                    color: theme.textMuted
                                }

                                MouseArea {
                                    id: copyMouse
                                    anchors.fill: parent
                                    hoverEnabled: true
                                    cursorShape: Qt.PointingHandCursor
                                    onClicked: {
                                        copyMenu.modelData = itemData;
                                        copyMenu.x = copyBtn.mapToItem(root, 0, 0).x - 140;
                                        copyMenu.y = copyBtn.mapToItem(root, 0, 0).y - copyMenu.height - 4;
                                        copyMenu.visible = true;
                                        copyMenuOpen = true;
                                    }
                                }
                            }
                        }
                    }

                    MouseArea {
                        id: rowMouse
                        anchors.fill: parent
                        hoverEnabled: true
                        cursorShape: Qt.PointingHandCursor
                        onClicked: root.memberClicked(itemData)
                    }
                }
            }
        }

        Rectangle {
            id: copyMenu
            Layout.alignment: Qt.AlignRight
            Layout.rightMargin: 20
            width: 190
            height: copyMenuCol.implicitHeight + 8
            radius: theme.panelRadius
            color: theme.panelBackground
            border.width: 1
            border.color: theme.borderSubtle
            visible: false
            z: 100

            property var modelData: ({})

            ColumnLayout {
                id: copyMenuCol
                anchors.fill: parent
                anchors.margins: 4
                spacing: 0

                Repeater {
                    model: ["qdbus", "dbus-send", "gdbus", "Python"]

                    delegate: Rectangle {
                        Layout.fillWidth: true
                        height: 34
                        radius: theme.controlRadius
                        color: copyOptionMouse.containsMouse ? theme.hoverBackground : "transparent"

                        RowLayout {
                            anchors.fill: parent
                            anchors.leftMargin: 10
                            anchors.rightMargin: 10
                            spacing: 8

                            Label {
                                text: modelData
                                font.pixelSize: theme.smallFont
                                font.weight: Font.Medium
                                color: theme.textPrimary
                            }

                            Item { Layout.fillWidth: true }

                            Label {
                                text: {
                                    switch (modelData) {
                                    case "qdbus": return "Qt CLI";
                                    case "dbus-send": return "GLib CLI";
                                    case "gdbus": return "GNOME CLI";
                                    case "Python": return "dbus-next";
                                    default: return "";
                                    }
                                }
                                font.pixelSize: 10
                                color: theme.textMuted
                            }
                        }

                        MouseArea {
                            id: copyOptionMouse
                            anchors.fill: parent
                            hoverEnabled: true
                            cursorShape: Qt.PointingHandCursor
                            onClicked: {
                                root.copyRequested(modelData, copyMenu.modelData.name || "");
                                copyMenu.visible = false;
                            }
                        }
                    }
                }
            }
        }
    }
}
