import QtQuick 2.11
import QtQuick.Controls 2.4
import QtQuick.Layouts 1.3
import DbusWorkbench 1.0

Rectangle {
    id: root

    property var theme
    property var signalEventModel
    property var callHistory: []
    property bool expanded: false

    height: expanded ? 220 : 40
    color: theme.panelBackground

    Behavior on height {
        NumberAnimation { duration: 200; easing.type: Easing.OutCubic }
    }

    ColumnLayout {
        anchors.fill: parent
        spacing: 0

        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: 40
            color: toggleMouse.containsMouse ? theme.hoverBackground : theme.panelBackground

            RowLayout {
                anchors.fill: parent
                anchors.leftMargin: 16
                anchors.rightMargin: 16
                spacing: 8

                Rectangle {
                    width: 8
                    height: 8
                    radius: 4
                    color: theme.signalColor
                }

                Label {
                    text: "Activity"
                    font.pixelSize: theme.smallFont
                    font.weight: Font.Medium
                    color: theme.textSecondary
                }

                Item { Layout.fillWidth: true }

                Row {
                    spacing: 12

                    Row {
                        spacing: 4
                        Rectangle {
                            width: 5
                            height: 5
                            radius: 2.5
                            color: theme.signalColor
                            anchors.verticalCenter: parent.verticalCenter
                        }
                        Label {
                            text: root.signalEventModel.rowCount() + " signals"
                            font.pixelSize: 11
                            color: theme.textMuted
                        }
                    }

                    Row {
                        spacing: 4
                        Rectangle {
                            width: 5
                            height: 5
                            radius: 2.5
                            color: theme.methodColor
                            anchors.verticalCenter: parent.verticalCenter
                        }
                        Label {
                            text: root.callHistory.length + " calls"
                            font.pixelSize: 11
                            color: theme.textMuted
                        }
                    }
                }

                Label {
                    text: root.expanded ? "▲" : "▼"
                    font.pixelSize: 9
                    color: theme.textMuted
                }
            }

            MouseArea {
                id: toggleMouse
                anchors.fill: parent
                hoverEnabled: true
                cursorShape: Qt.PointingHandCursor
                onClicked: root.expanded = !root.expanded
            }

            Rectangle {
                anchors.top: parent.top
                anchors.left: parent.left
                anchors.right: parent.right
                height: 1
                color: theme.divider
            }
        }

        Flickable {
            Layout.fillWidth: true
            Layout.fillHeight: true
            visible: root.expanded
            contentHeight: signalColumn.height
            clip: true

            ColumnLayout {
                id: signalColumn
                anchors.left: parent.left
                anchors.right: parent.right
                anchors.leftMargin: 16
                anchors.rightMargin: 16
                anchors.topMargin: 10
                spacing: 6

                Repeater {
                    model: root.signalEventModel

                    delegate: Rectangle {
                        Layout.fillWidth: true
                        Layout.preferredHeight: 52
                        radius: theme.panelRadius
                        color: signalMouse.containsMouse ? theme.hoverBackground : theme.panelMutedBackground
                        border.width: 1
                        border.color: theme.borderSubtle

                        RowLayout {
                            anchors.fill: parent
                            anchors.leftMargin: 12
                            anchors.rightMargin: 12
                            spacing: 12

                            Label {
                                text: model.time
                                font.pixelSize: 11
                                font.family: "monospace"
                                color: theme.methodColor
                            }

                            ColumnLayout {
                                Layout.fillWidth: true
                                spacing: 2

                                Label {
                                    text: model.topic
                                    font.pixelSize: theme.smallFont
                                    font.weight: Font.Medium
                                    font.family: "monospace"
                                    color: theme.textPrimary
                                    elide: Text.ElideRight
                                    Layout.fillWidth: true
                                }

                                Label {
                                    text: model.payload
                                    font.pixelSize: 11
                                    color: theme.textSecondary
                                    elide: Text.ElideRight
                                    Layout.fillWidth: true
                                }
                            }
                        }

                        MouseArea {
                            id: signalMouse
                            anchors.fill: parent
                            hoverEnabled: true
                            acceptedButtons: Qt.NoButton
                        }
                    }
                }
            }
        }
    }
}
