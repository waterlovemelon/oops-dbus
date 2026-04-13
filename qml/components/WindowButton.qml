import QtQuick 2.11
import QtQuick.Controls 2.4

Rectangle {
    id: root

    property var theme
    property string kind: "minimize"
    property bool hovered: buttonMouse.containsMouse

    signal clicked()

    width: 40
    height: 32
    radius: theme ? theme.controlRadius : 8
    color: hovered
        ? (kind === "close"
            ? "#d1242f"
            : (theme ? theme.hoverBackground : "#f0f3f7"))
        : "transparent"

    Label {
        anchors.centerIn: parent
        text: {
            if (root.kind === "minimize") return "—";
            if (root.kind === "maximize") return "□";
            if (root.kind === "restore") return "❐";
            return "×";
        }
        font.pixelSize: root.kind === "close" ? 16 : 12
        color: root.hovered && root.kind === "close"
            ? "#ffffff"
            : (root.theme ? root.theme.textSecondary : "#57606a")
    }

    MouseArea {
        id: buttonMouse
        anchors.fill: parent
        hoverEnabled: true
        cursorShape: Qt.PointingHandCursor
        onClicked: root.clicked()
    }
}
