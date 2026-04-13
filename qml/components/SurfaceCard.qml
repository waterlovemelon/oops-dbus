import QtQuick 2.11

Rectangle {
    id: root

    property var theme
    property color surfaceColor: theme ? theme.panelBackground : "#ffffff"
    property color strokeColor: theme ? theme.borderSubtle : "#e5e7eb"

    radius: theme ? theme.panelRadius : 10
    color: surfaceColor
    border.width: 1
    border.color: strokeColor
}
