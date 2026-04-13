import QtQuick 2.11
import QtQuick.Controls 2.4
import QtQuick.Layouts 1.3

Rectangle {
    id: root

    property var theme
    property string activeBus: "session"
    property bool maximized: false
    property alias searchText: searchField.text
    property bool darkMode: theme ? theme.darkMode : false

    signal dragRequested(real mouseX, real mouseY)
    signal dragMoved(real mouseX, real mouseY)
    signal titleDoubleClicked()
    signal busSelected(string bus)
    signal searchChanged(string text)
    signal themeToggled()
    signal minimizeRequested()
    signal maximizeRequested()
    signal closeRequested()

    color: theme ? theme.panelBackground : "#ffffff"
    implicitHeight: theme ? theme.topBarHeight : 48

    Rectangle {
        anchors.bottom: parent.bottom
        anchors.left: parent.left
        anchors.right: parent.right
        height: 1
        color: theme ? theme.divider : "#e8eaee"
    }

    MouseArea {
        id: dragArea
        anchors.fill: parent
        acceptedButtons: Qt.LeftButton
        onPressed: root.dragRequested(mouseX, mouseY)
        onPositionChanged: if (pressed) root.dragMoved(mouseX, mouseY)
        onDoubleClicked: root.titleDoubleClicked()
    }

    RowLayout {
        anchors.fill: parent
        anchors.leftMargin: theme ? theme.space16 : 16
        anchors.rightMargin: theme ? theme.space12 : 12
        spacing: theme ? theme.space12 : 12
        z: 1

        RowLayout {
            spacing: theme ? theme.space8 : 8

            Item {
                Layout.preferredWidth: 20
                Layout.preferredHeight: 20

                Canvas {
                    anchors.fill: parent
                    onPaint: {
                        var ctx = getContext("2d");
                        ctx.reset();
                        ctx.beginPath();
                        ctx.moveTo(width * 0.12, height * 0.72);
                        ctx.quadraticCurveTo(width * 0.48, height * 0.08, width * 0.88, height * 0.72);
                        ctx.lineTo(width * 0.82, height * 0.84);
                        ctx.quadraticCurveTo(width * 0.48, height * 0.36, width * 0.18, height * 0.84);
                        ctx.closePath();
                        ctx.fillStyle = "#e86b7a";
                        ctx.fill();

                        ctx.beginPath();
                        ctx.moveTo(width * 0.18, height * 0.84);
                        ctx.quadraticCurveTo(width * 0.48, height * 0.56, width * 0.82, height * 0.84);
                        ctx.lineTo(width * 0.78, height * 0.94);
                        ctx.quadraticCurveTo(width * 0.48, height * 0.72, width * 0.22, height * 0.94);
                        ctx.closePath();
                        ctx.fillStyle = "#6ca66f";
                        ctx.fill();

                        ctx.fillStyle = "#4b2f32";
                        [0.34, 0.5, 0.66].forEach(function(pos) {
                            ctx.beginPath();
                            ctx.ellipse(width * pos, height * 0.56, 1.1, 2.1, 0, 0, Math.PI * 2);
                            ctx.fill();
                        });
                    }
                }
            }

            Label {
                text: "DBus Workbench"
                font.pixelSize: theme ? theme.sectionFont : 15
                font.weight: Font.DemiBold
                color: theme ? theme.textPrimary : "#1f2328"
            }
        }

        SegmentedToggle {
            id: busToggle
            theme: root.theme
            selectedValue: root.activeBus
            options: [
                { label: "Session", value: "session" },
                { label: "System", value: "system" }
            ]
            onSelected: root.busSelected(value)
        }

        Item { Layout.fillWidth: true }

        Rectangle {
            Layout.preferredWidth: 420
            Layout.preferredHeight: theme ? theme.controlHeight : 36
            radius: theme ? theme.controlRadius : 8
            color: theme ? theme.inputBackground : "#ffffff"
            border.width: 1
            border.color: searchField.activeFocus
                ? (theme ? theme.focusRing : "#2f6feb")
                : (theme ? theme.borderStrong : "#d0d7de")

            RowLayout {
                anchors.fill: parent
                anchors.leftMargin: theme ? theme.space12 : 12
                anchors.rightMargin: theme ? theme.space12 : 12
                spacing: theme ? theme.space8 : 8

                Label {
                    text: "⌕"
                    font.pixelSize: 13
                    color: theme ? theme.textMuted : "#8b949e"
                }

                TextField {
                    id: searchField
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    placeholderText: "Search services, interfaces, methods..."
                    selectByMouse: true
                    font.pixelSize: theme ? theme.bodyFont : 13
                    color: theme ? theme.textPrimary : "#1f2328"
                    placeholderTextColor: theme ? theme.textMuted : "#8b949e"
                    background: Item {}
                    onTextChanged: root.searchChanged(text)
                }
            }
        }

        Item { Layout.fillWidth: true }

        Rectangle {
            width: theme ? theme.compactControlHeight : 32
            height: theme ? theme.compactControlHeight : 32
            radius: theme ? theme.controlRadius : 8
            color: theme ? theme.panelMutedBackground : "#f7f8fa"
            border.width: 1
            border.color: theme ? theme.borderSubtle : "#e5e7eb"

            Label {
                anchors.centerIn: parent
                text: root.darkMode ? "☾" : "☼"
                font.pixelSize: 13
                color: theme ? theme.textSecondary : "#57606a"
            }

            MouseArea {
                anchors.fill: parent
                cursorShape: Qt.PointingHandCursor
                onClicked: root.themeToggled()
            }
        }

        Row {
            spacing: 2

            WindowButton {
                theme: root.theme
                kind: "minimize"
                onClicked: root.minimizeRequested()
            }

            WindowButton {
                theme: root.theme
                kind: root.maximized ? "restore" : "maximize"
                onClicked: root.maximizeRequested()
            }

            WindowButton {
                theme: root.theme
                kind: "close"
                onClicked: root.closeRequested()
            }
        }
    }
}
