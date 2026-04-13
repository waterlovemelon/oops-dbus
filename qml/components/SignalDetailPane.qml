import QtQuick 2.11
import QtQuick.Controls 2.4
import QtQuick.Layouts 1.3

Rectangle {
    id: root

    property var theme
    property var node: ({})
    property var signalEventModel
    property bool subscribed: false

    signal backRequested()
    signal subscribeRequested()
    signal unsubscribeRequested()

    color: theme.appBackground

    function eventMatchesCurrentSignal(event) {
        if (!event || !root.node.interfaceName || !root.node.name) {
            return false;
        }
        return event.topic === (root.node.interfaceName + "." + root.node.name);
    }

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

                RowLayout {
                    Layout.fillWidth: true

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

                    Item { Layout.fillWidth: true }

                    Rectangle {
                        radius: theme.controlRadius
                        color: root.subscribed ? theme.successSurface : theme.panelMutedBackground
                        border.width: 1
                        border.color: root.subscribed ? theme.success : theme.borderStrong
                        Layout.preferredHeight: 28
                        Layout.preferredWidth: statusLabel.implicitWidth + 20

                        Label {
                            id: statusLabel
                            anchors.centerIn: parent
                            text: root.subscribed ? "监听中" : "未监听"
                            font.pixelSize: theme.smallFont
                            font.weight: Font.Medium
                            color: root.subscribed ? theme.success : theme.textSecondary
                        }
                    }
                }

                Label {
                    text: root.node.interfaceName || ""
                    font.pixelSize: theme.bodyFont
                    color: theme.textMuted
                    font.family: "monospace"
                }

                Label {
                    text: root.node.label || root.node.name || "Signal"
                    font.pixelSize: 22
                    font.weight: Font.DemiBold
                    color: theme.textPrimary
                }

                Label {
                    text: root.node.signature ? ("签名 " + root.node.signature) : "Signal 只能订阅监听，不能主动执行。"
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
                    implicitHeight: monitorCol.implicitHeight

                    ColumnLayout {
                        id: monitorCol
                        anchors.fill: parent
                        anchors.margins: 20
                        spacing: 14

                        Label {
                            text: "Monitor"
                            font.pixelSize: theme.sectionFont
                            font.weight: Font.DemiBold
                            color: theme.textPrimary
                        }

                        Label {
                            Layout.fillWidth: true
                            text: root.node.path ? ("Object path: " + root.node.path) : ""
                            font.pixelSize: theme.bodyFont
                            color: theme.textSecondary
                            font.family: "monospace"
                            wrapMode: Text.Wrap
                        }

                        RowLayout {
                            spacing: 10

                            Rectangle {
                                Layout.preferredHeight: theme.controlHeight
                                Layout.preferredWidth: monitorButtonLabel.implicitWidth + 28
                                radius: theme.controlRadius
                                color: root.subscribed ? theme.panelMutedBackground : theme.accent
                                border.width: root.subscribed ? 1 : 0
                                border.color: theme.borderStrong

                                Label {
                                    id: monitorButtonLabel
                                    anchors.centerIn: parent
                                    text: root.subscribed ? "停止监听" : "开始监听"
                                    font.pixelSize: theme.bodyFont
                                    font.weight: Font.Medium
                                    color: root.subscribed ? theme.textPrimary : theme.textOnAccent
                                }

                                MouseArea {
                                    anchors.fill: parent
                                    hoverEnabled: true
                                    cursorShape: Qt.PointingHandCursor
                                    onClicked: {
                                        if (root.subscribed) {
                                            root.unsubscribeRequested();
                                        } else {
                                            root.subscribeRequested();
                                        }
                                    }
                                }
                            }

                            Label {
                                text: root.subscribed ? "新事件会同步出现在底部信号面板。" : "开始监听后会接收该 signal 的新事件。"
                                font.pixelSize: theme.bodyFont
                                color: theme.textSecondary
                            }
                        }
                    }
                }

                SurfaceCard {
                    theme: root.theme
                    Layout.fillWidth: true
                    implicitHeight: recentEventsCol.implicitHeight

                    ColumnLayout {
                        id: recentEventsCol
                        anchors.fill: parent
                        anchors.margins: 20
                        spacing: 12

                        Label {
                            text: "Recent events"
                            font.pixelSize: theme.sectionFont
                            font.weight: Font.DemiBold
                            color: theme.textPrimary
                        }

                        Repeater {
                            model: root.signalEventModel

                            delegate: Rectangle {
                                visible: root.eventMatchesCurrentSignal(model)
                                Layout.fillWidth: true
                                implicitHeight: eventContent.implicitHeight + 16
                                radius: theme.panelRadius
                                color: theme.codeBackground
                                border.width: 1
                                border.color: theme.borderSubtle

                                ColumnLayout {
                                    id: eventContent
                                    anchors.fill: parent
                                    anchors.margins: 12
                                    spacing: 4

                                    Label {
                                        text: model.time + " · " + model.sender
                                        font.pixelSize: theme.smallFont
                                        color: theme.textMuted
                                        font.family: "monospace"
                                    }

                                    Label {
                                        Layout.fillWidth: true
                                        text: model.payload || "(empty payload)"
                                        font.pixelSize: theme.bodyFont
                                        color: theme.textPrimary
                                        wrapMode: Text.Wrap
                                    }
                                }
                            }
                        }

                        Label {
                            visible: !root.signalEventModel || root.signalEventModel.rowCount() === 0
                            text: "还没有收到该信号的事件。"
                            font.pixelSize: theme.bodyFont
                            color: theme.textMuted
                        }
                    }
                }
            }
        }
    }
}
