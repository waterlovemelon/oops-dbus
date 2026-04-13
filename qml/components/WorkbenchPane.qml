import QtQuick 2.11
import QtQuick.Controls 2.4
import QtQuick.Layouts 1.3

Rectangle {
    id: root

    property var theme
    property var node: ({})
    property var argumentModel
    property string executionStatus: "idle"
    property string executionText: ""
    property string executionError: ""

    signal backRequested()
    signal copyRequested(string type)
    signal executed()

    function statusFill() {
        if (root.executionStatus === "success") return theme.successSurface;
        if (root.executionStatus === "error") return theme.dangerSurface;
        if (root.executionStatus === "running") return theme.warningSurface;
        return theme.panelMutedBackground;
    }

    function statusStroke() {
        if (root.executionStatus === "success") return theme.success;
        if (root.executionStatus === "error") return theme.danger;
        if (root.executionStatus === "running") return theme.warning;
        return theme.borderStrong;
    }

    function statusTextColor() {
        if (root.executionStatus === "success") return theme.success;
        if (root.executionStatus === "error") return theme.danger;
        if (root.executionStatus === "running") return theme.warning;
        return theme.textSecondary;
    }

    color: theme.appBackground

    ColumnLayout {
        anchors.fill: parent
        spacing: 0

        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: 110
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
                            anchors.verticalCenter: parent.verticalCenter
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
                    font.family: "monospace"
                    color: theme.textMuted
                }

                Label {
                    text: root.node.label || root.node.name || "Method"
                    font.pixelSize: 22
                    font.weight: Font.DemiBold
                    color: theme.textPrimary
                }

                Label {
                    text: root.node.path ? ("Object path: " + root.node.path) : (root.node.signature ? ("Input signature: " + root.node.signature) : "执行 D-Bus method 并查看真实返回结果。")
                    font.pixelSize: theme.bodyFont
                    color: theme.textSecondary
                    wrapMode: Text.Wrap
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
            contentHeight: contentCol.height
            clip: true

            Column {
                id: contentCol
                width: parent.width
                leftPadding: 28
                rightPadding: 28
                topPadding: 24
                spacing: 20

                SurfaceCard {
                    theme: root.theme
                    width: parent.width - parent.leftPadding - parent.rightPadding
                    height: argsContent.height

                    Column {
                        id: argsContent
                        width: parent.width
                        spacing: 0

                        Row {
                            width: parent.width
                            height: 48
                            leftPadding: 20
                            rightPadding: 20

                            Label {
                                text: "Arguments"
                                font.pixelSize: theme.sectionFont
                                font.weight: Font.DemiBold
                                color: theme.textPrimary
                                anchors.verticalCenter: parent.verticalCenter
                            }

                            Item { width: parent.width - 160; height: 1 }

                            Label {
                                text: (root.argumentModel ? root.argumentModel.rowCount() : 0) + " arguments"
                                font.pixelSize: theme.smallFont
                                color: theme.textMuted
                                anchors.verticalCenter: parent.verticalCenter
                            }
                        }

                        Rectangle {
                            width: parent.width
                            height: 1
                            color: theme.divider
                        }

                        Label {
                            visible: !root.argumentModel || root.argumentModel.rowCount() === 0
                            width: parent.width
                            leftPadding: 20
                            rightPadding: 20
                            topPadding: 18
                            bottomPadding: 18
                            text: "这个 method 没有输入参数，可以直接执行。"
                            font.pixelSize: theme.bodyFont
                            color: theme.textSecondary
                        }

                        Repeater {
                            model: root.argumentModel

                            delegate: Rectangle {
                                width: parent.width
                                height: 56
                                color: argHover.containsMouse ? theme.hoverBackground : "transparent"

                                RowLayout {
                                    anchors.fill: parent
                                    anchors.leftMargin: 20
                                    anchors.rightMargin: 20
                                    spacing: 16

                                    Column {
                                        Layout.preferredWidth: 170
                                        spacing: 2
                                        anchors.verticalCenter: parent.verticalCenter

                                        Label {
                                            text: model.name
                                            font.pixelSize: theme.bodyFont
                                            font.weight: Font.Medium
                                            color: theme.textPrimary
                                        }

                                        Label {
                                            text: model.signature
                                            font.pixelSize: 11
                                            font.family: "monospace"
                                            color: theme.accent
                                        }
                                    }

                                    Rectangle {
                                        Layout.fillWidth: true
                                        height: theme.controlHeight
                                        radius: theme.controlRadius
                                        color: theme.inputBackground
                                        border.width: 1
                                        border.color: argInput.activeFocus ? theme.focusRing : theme.borderStrong
                                        anchors.verticalCenter: parent.verticalCenter

                                        TextField {
                                            id: argInput
                                            anchors.fill: parent
                                            anchors.margins: 1
                                            text: model.value
                                            font.pixelSize: theme.bodyFont
                                            font.family: "monospace"
                                            color: theme.textPrimary
                                            selectByMouse: true
                                            background: Item {}
                                            onTextChanged: root.argumentModel.setArgumentValue(index, text)
                                        }
                                    }
                                }

                                MouseArea {
                                    id: argHover
                                    anchors.fill: parent
                                    acceptedButtons: Qt.NoButton
                                    hoverEnabled: true
                                }
                            }
                        }

                        Rectangle {
                            width: parent.width
                            height: 1
                            color: theme.divider
                        }

                        Row {
                            width: parent.width
                            height: 64
                            leftPadding: 20
                            rightPadding: 20
                            spacing: 8

                            Rectangle {
                                height: theme.controlHeight
                                width: execLbl.implicitWidth + 32
                                radius: theme.controlRadius
                                color: execHover.containsMouse ? theme.accentHover : theme.accent
                                anchors.verticalCenter: parent.verticalCenter

                                Row {
                                    anchors.centerIn: parent
                                    spacing: 6

                                    Label {
                                        text: "▶"
                                        font.pixelSize: 11
                                        color: theme.textOnAccent
                                    }

                                    Label {
                                        id: execLbl
                                        text: "Invoke"
                                        font.pixelSize: theme.bodyFont
                                        font.weight: Font.Medium
                                        color: theme.textOnAccent
                                    }
                                }

                                MouseArea {
                                    id: execHover
                                    anchors.fill: parent
                                    hoverEnabled: true
                                    cursorShape: Qt.PointingHandCursor
                                    onClicked: root.executed()
                                }
                            }

                            Repeater {
                                model: ["Copy gdbus command", "Copy busctl command", "Copy Python code"]

                                delegate: Rectangle {
                                    height: theme.controlHeight
                                    width: cpLbl.implicitWidth + 24
                                    radius: theme.controlRadius
                                    color: cpHover.containsMouse ? theme.hoverBackground : theme.panelBackground
                                    border.width: 1
                                    border.color: theme.borderStrong
                                    anchors.verticalCenter: parent.verticalCenter

                                    Label {
                                        id: cpLbl
                                        anchors.centerIn: parent
                                        text: modelData
                                        font.pixelSize: theme.smallFont
                                        color: theme.textPrimary
                                    }

                                    MouseArea {
                                        id: cpHover
                                        anchors.fill: parent
                                        hoverEnabled: true
                                        cursorShape: Qt.PointingHandCursor
                                        onClicked: {
                                            var t = modelData.replace("Copy ", "").replace(" command", "").replace(" code", "");
                                            root.copyRequested(t);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                SurfaceCard {
                    theme: root.theme
                    width: parent.width - parent.leftPadding - parent.rightPadding
                    height: resultContent.height

                    Column {
                        id: resultContent
                        width: parent.width
                        spacing: 0

                        Row {
                            width: parent.width
                            height: 48
                            leftPadding: 20
                            rightPadding: 20
                            spacing: 8

                            Label {
                                text: "Result"
                                font.pixelSize: theme.sectionFont
                                font.weight: Font.DemiBold
                                color: theme.textPrimary
                                anchors.verticalCenter: parent.verticalCenter
                            }

                            Item { width: parent.width - resultStatusBadge.width - 148; height: 1 }

                            Rectangle {
                                id: resultStatusBadge
                                anchors.verticalCenter: parent.verticalCenter
                                radius: theme.controlRadius
                                height: 24
                                width: resultStatusLabel.implicitWidth + 18
                                color: root.statusFill()
                                border.width: 1
                                border.color: root.statusStroke()

                                Label {
                                    id: resultStatusLabel
                                    anchors.centerIn: parent
                                    text: {
                                        if (root.executionStatus === "success") return "success";
                                        if (root.executionStatus === "error") return "error";
                                        if (root.executionStatus === "running") return "running";
                                        return "idle";
                                    }
                                    font.pixelSize: 11
                                    font.weight: Font.Medium
                                    color: root.statusTextColor()
                                }
                            }
                        }

                        Rectangle {
                            width: parent.width
                            height: 1
                            color: theme.divider
                        }

                        Rectangle {
                            anchors.horizontalCenter: parent.horizontalCenter
                            width: parent.width - 40
                            height: resultTxt.implicitHeight + 24
                            radius: theme.panelRadius
                            color: root.executionStatus === "error" ? theme.dangerSurface : theme.codeBackground
                            anchors.topMargin: 16
                            anchors.bottomMargin: 16
                            border.width: 1
                            border.color: root.executionStatus === "error" ? theme.danger : theme.borderSubtle

                            Text {
                                id: resultTxt
                                anchors.fill: parent
                                anchors.margins: 12
                                text: {
                                    if (root.executionStatus === "running") {
                                        return "正在执行 D-Bus method...";
                                    }
                                    if (root.executionStatus === "error") {
                                        return root.executionError || "调用失败";
                                    }
                                    if (root.executionStatus === "success") {
                                        return root.executionText || "(empty result)";
                                    }
                                    return "执行后会在这里显示真实返回值或错误信息。";
                                }
                                font.family: "monospace"
                                font.pixelSize: theme.bodyFont
                                color: root.executionStatus === "error" ? theme.danger : theme.textPrimary
                                wrapMode: Text.Wrap
                            }
                        }

                        Item { width: 1; height: 16 }
                    }
                }

                Item { width: 1; height: 20 }
            }
        }
    }
}
