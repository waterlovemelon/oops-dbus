import QtQuick 2.11
import QtQuick.Controls 2.4
import QtQuick.Layouts 1.3

Rectangle {
    id: root

    property var theme
    property string message: ""

    width: toastText.implicitWidth + 36
    height: 38
    radius: theme ? theme.panelRadius : 10
    color: theme ? theme.textPrimary : "#1f2328"
    border.width: 1
    border.color: theme ? theme.borderStrong : "#d0d7de"
    opacity: 0
    visible: opacity > 0

    function show(msg) {
        message = msg;
        hideTimer.restart();
        opacity = 1;
    }

    function hide() {
        opacity = 0;
    }

    Label {
        id: toastText
        anchors.centerIn: parent
        text: root.message
        font.pixelSize: theme ? theme.smallFont : 12
        font.weight: Font.Medium
        color: theme ? theme.textOnAccent : "#ffffff"
    }

    Behavior on opacity {
        NumberAnimation { duration: 200; easing.type: Easing.OutCubic }
    }

    Timer {
        id: hideTimer
        interval: 1800
        onTriggered: root.hide()
    }
}
