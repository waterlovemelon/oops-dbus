import QtQuick 2.11
import QtQuick.Controls 2.4
import QtQuick.Layouts 1.3

Rectangle {
    id: root

    property var theme
    property var node: ({})

    signal backRequested()

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

                Rectangle {
                    height: 30
                    width: 72
                    radius: theme.controlRadius
                    color: backMouse.containsMouse ? theme.hoverBackground : "transparent"

                    Row {
                        anchors.centerIn: parent
                        spacing: 4

                        Label {
                            text: "◀"
                            font.pixelSize: 9
                            color: theme.textSecondary
                        }

                        Label {
                            text: "返回"
                            font.pixelSize: theme.bodyFont
                            color: theme.textSecondary
                        }
                    }

                    MouseArea {
                        id: backMouse
                        anchors.fill: parent
                        hoverEnabled: true
                        cursorShape: Qt.PointingHandCursor
                        onClicked: root.backRequested()
                    }
                }

                Label {
                    text: root.node.interfaceName || ""
                    font.pixelSize: theme.bodyFont
                    color: theme.textMuted
                    font.family: "monospace"
                }

                Label {
                    text: root.node.label || root.node.name || "Property"
                    font.pixelSize: 22
                    font.weight: Font.DemiBold
                    color: theme.textPrimary
                }

                Label {
                    text: root.node.summary || "当前版本仅支持浏览 property 元数据。"
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

        Flickable {
            Layout.fillWidth: true
            Layout.fillHeight: true
            contentHeight: contentCol.implicitHeight
            clip: true

            ColumnLayout {
                id: contentCol
                width: parent.width
                anchors.left: parent.left
                anchors.right: parent.right
                anchors.margins: 28
                spacing: 20

                SurfaceCard {
                    theme: root.theme
                    Layout.fillWidth: true
                    implicitHeight: infoCol.implicitHeight

                    ColumnLayout {
                        id: infoCol
                        anchors.fill: parent
                        anchors.margins: 20
                        spacing: 12

                        Label {
                            text: "Metadata"
                            font.pixelSize: theme.sectionFont
                            font.weight: Font.DemiBold
                            color: theme.textPrimary
                        }

                        Label {
                            text: "Type: " + (root.node.signature || "unknown")
                            font.pixelSize: theme.bodyFont
                            color: theme.textPrimary
                            font.family: "monospace"
                        }

                        Label {
                            text: "Access: " + (root.node.annotation || "unknown")
                            font.pixelSize: theme.bodyFont
                            color: theme.textPrimary
                            font.family: "monospace"
                        }

                        Label {
                            Layout.fillWidth: true
                            text: root.node.path ? ("Object path: " + root.node.path) : ""
                            font.pixelSize: theme.bodyFont
                            color: theme.textSecondary
                            font.family: "monospace"
                            wrapMode: Text.Wrap
                        }
                    }
                }

                SurfaceCard {
                    theme: root.theme
                    Layout.fillWidth: true
                    implicitHeight: capabilityCol.implicitHeight

                    ColumnLayout {
                        id: capabilityCol
                        anchors.fill: parent
                        anchors.margins: 20
                        spacing: 10

                        Label {
                            text: "Current capability"
                            font.pixelSize: theme.sectionFont
                            font.weight: Font.DemiBold
                            color: theme.textPrimary
                        }

                        Label {
                            Layout.fillWidth: true
                            text: "当前版本只展示 property 的类型、访问权限和基础元数据，尚未接入 Get / Set / GetAll。"
                            font.pixelSize: theme.bodyFont
                            color: theme.textSecondary
                            wrapMode: Text.Wrap
                        }
                    }
                }
            }
        }
    }
}
