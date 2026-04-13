import QtQuick 2.11

QtObject {
    id: theme

    property bool darkMode: false

    readonly property color appBackground: darkMode ? "#16181b" : "#f5f6f8"
    readonly property color panelBackground: darkMode ? "#1e2228" : "#ffffff"
    readonly property color panelMutedBackground: darkMode ? "#242931" : "#fbfbfc"
    readonly property color elevatedBackground: darkMode ? "#262d36" : "#f7f8fa"
    readonly property color hoverBackground: darkMode ? "#2a313b" : "#f0f3f7"
    readonly property color pressedBackground: darkMode ? "#313947" : "#e8edf4"
    readonly property color selectedBackground: darkMode ? "#20334f" : "#e8f1ff"
    readonly property color inputBackground: darkMode ? "#1a1f25" : "#ffffff"
    readonly property color codeBackground: darkMode ? "#151a20" : "#f7f8fa"

    readonly property color textPrimary: darkMode ? "#e6edf3" : "#1f2328"
    readonly property color textSecondary: darkMode ? "#b5bec8" : "#57606a"
    readonly property color textMuted: darkMode ? "#8b949e" : "#8b949e"
    readonly property color textOnAccent: "#ffffff"

    readonly property color borderSubtle: darkMode ? "#313844" : "#e5e7eb"
    readonly property color borderStrong: darkMode ? "#454f5d" : "#d0d7de"
    readonly property color divider: darkMode ? "#2d343d" : "#e8eaee"
    readonly property color focusRing: "#2f6feb"

    readonly property color accent: darkMode ? "#70a3ff" : "#2f6feb"
    readonly property color accentHover: darkMode ? "#5f94f5" : "#265fca"
    readonly property color success: darkMode ? "#3fb950" : "#2da44e"
    readonly property color successSurface: darkMode ? "#1d2f24" : "#eef8f1"
    readonly property color warning: darkMode ? "#d29922" : "#bf8700"
    readonly property color warningSurface: darkMode ? "#352a18" : "#fff8e6"
    readonly property color danger: darkMode ? "#f85149" : "#d1242f"
    readonly property color dangerSurface: darkMode ? "#3b2020" : "#fff1f1"

    readonly property color methodColor: darkMode ? "#78a9ff" : "#2f6feb"
    readonly property color signalColor: darkMode ? "#e1a33d" : "#bf8700"
    readonly property color propertyColor: darkMode ? "#b48eff" : "#8250df"

    readonly property real windowRadius: darkMode ? 12 : 12
    readonly property real panelRadius: 10
    readonly property real controlRadius: 8
    readonly property real pillRadius: 999
    readonly property int topBarHeight: 48
    readonly property int controlHeight: 36
    readonly property int compactControlHeight: 32

    readonly property int space4: 4
    readonly property int space8: 8
    readonly property int space12: 12
    readonly property int space16: 16
    readonly property int space20: 20
    readonly property int space24: 24

    readonly property int titleFont: 18
    readonly property int sectionFont: 15
    readonly property int bodyFont: 13
    readonly property int smallFont: 12
    readonly property int monoFont: 12
}
