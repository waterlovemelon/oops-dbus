cmake_minimum_required(VERSION 3.16)

project(dd-feet VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_AUTORCC ON)

find_package(QT NAMES Qt6 Qt5 REQUIRED COMPONENTS Quick QuickControls2 DBus Xml Test)
find_package(Qt${QT_VERSION_MAJOR} REQUIRED COMPONENTS Quick QuickControls2 DBus Xml Test)

if(QT_VERSION_MAJOR EQUAL 6)
    qt_standard_project_setup(REQUIRES 6.5)
endif()

set(PROJECT_SOURCES
    src/main.cpp
    src/dbus/DBusManager.cpp
    src/dbus/ServiceExplorer.cpp
    src/dbus/MethodInvoker.cpp
    src/dbus/SignalMonitor.cpp
    src/dbus/models/ServiceModel.cpp
    src/dbus/models/MemberModel.cpp
    src/dbus/models/ArgumentModel.cpp
    src/dbus/models/SignalEventModel.cpp
)

# Add model headers so MOC processes them
set(PROJECT_HEADERS
    src/dbus/DBusManager.h
    src/dbus/ServiceExplorer.h
    src/dbus/MethodInvoker.h
    src/dbus/SignalMonitor.h
    src/dbus/models/ServiceModel.h
    src/dbus/models/MemberModel.h
    src/dbus/models/ArgumentModel.h
    src/dbus/models/SignalEventModel.h
)

set(QML_FILES
        qml/Main.qml
        qml/SampleData.js
        qml/components/AppTopBar.qml
        qml/components/BrowsePane.qml
        qml/components/BottomPanel.qml
        qml/components/PropertyDetailPane.qml
        qml/components/SegmentedToggle.qml
        qml/components/ServiceTreePane.qml
        qml/components/SignalDetailPane.qml
        qml/components/SurfaceCard.qml
        qml/components/Theme.qml
        qml/components/Toast.qml
        qml/components/WindowButton.qml
        qml/components/WorkbenchPane.qml
)

if(QT_VERSION_MAJOR EQUAL 6)
    qt_add_executable(dd-feet
        ${PROJECT_SOURCES}
        ${PROJECT_HEADERS}
    )

    qt_add_qml_module(dd-feet
        URI DbusWorkbench
        VERSION 1.0
        QML_FILES
            ${QML_FILES}
    )
else()
    set(CMAKE_AUTOMOC ON)
    add_executable(dd-feet
        ${PROJECT_SOURCES}
        ${PROJECT_HEADERS}
        resources.qrc
    )
endif()

target_link_libraries(dd-feet
    PRIVATE
        Qt${QT_VERSION_MAJOR}::Quick
        Qt${QT_VERSION_MAJOR}::QuickControls2
        Qt${QT_VERSION_MAJOR}::DBus
        Qt${QT_VERSION_MAJOR}::Xml
)

include(CTest)

add_executable(test_membermodel
    tests/test_membermodel.cpp
    src/dbus/models/MemberModel.cpp
)

target_include_directories(test_membermodel PRIVATE ${CMAKE_CURRENT_SOURCE_DIR})

target_link_libraries(test_membermodel
    PRIVATE
        Qt${QT_VERSION_MAJOR}::Test
        Qt${QT_VERSION_MAJOR}::DBus
        Qt${QT_VERSION_MAJOR}::Xml
)

add_test(NAME test_membermodel COMMAND test_membermodel)

add_executable(test_serviceexplorer
    tests/test_serviceexplorer.cpp
    src/dbus/ServiceExplorer.cpp
)

target_include_directories(test_serviceexplorer PRIVATE ${CMAKE_CURRENT_SOURCE_DIR})

target_link_libraries(test_serviceexplorer
    PRIVATE
        Qt${QT_VERSION_MAJOR}::Test
        Qt${QT_VERSION_MAJOR}::DBus
        Qt${QT_VERSION_MAJOR}::Xml
)

add_test(NAME test_serviceexplorer COMMAND test_serviceexplorer)

add_executable(test_argumentmodel
    tests/test_argumentmodel.cpp
    src/dbus/models/ArgumentModel.cpp
)

target_include_directories(test_argumentmodel PRIVATE ${CMAKE_CURRENT_SOURCE_DIR})

target_link_libraries(test_argumentmodel
    PRIVATE
        Qt${QT_VERSION_MAJOR}::Test
        Qt${QT_VERSION_MAJOR}::DBus
        Qt${QT_VERSION_MAJOR}::Xml
)

add_test(NAME test_argumentmodel COMMAND test_argumentmodel)

install(TARGETS dd-feet
    BUNDLE DESTINATION .
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)
