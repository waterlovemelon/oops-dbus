import QtQuick 2.11
import QtQuick.Controls 2.4
import QtQuick.Layouts 1.3

Rectangle {
    id: root

    property var theme
    property string selectedValue: ""
    property var options: []

    signal selected(string value)

    radius: theme ? theme.controlRadius : 8
    color: theme ? theme.panelMutedBackground : "#f7f8fa"
    border.width: 1
    border.color: theme ? theme.borderSubtle : "#e5e7eb"
    implicitHeight: theme ? theme.compactControlHeight : 32
    implicitWidth: row.implicitWidth + 4

    Row {
        id: row
        anchors.centerIn: parent
        spacing: 2

        Repeater {
            model: root.options

            delegate: Rectangle {
                property var option: modelData
                property bool active: root.selectedValue === option.value

                width: Math.max(56, toggleLabel.implicitWidth + 20)
                height: (root.theme ? root.theme.compactControlHeight : 32) - 4
                radius: root.theme ? root.theme.controlRadius - 2 : 6
                color: active ? (root.theme ? root.theme.panelBackground : "#ffffff") : "transparent"

                Label {
                    id: toggleLabel
                    anchors.centerIn: parent
                    text: option.label
                    font.pixelSize: root.theme ? root.theme.smallFont : 12
                    font.weight: Font.Medium
                    color: active
                        ? (root.theme ? root.theme.accent : "#2f6feb")
                        : (root.theme ? root.theme.textSecondary : "#57606a")
                }

                MouseArea {
                    anchors.fill: parent
                    cursorShape: Qt.PointingHandCursor
                    onClicked: root.selected(option.value)
                }
            }
        }
    }
}
