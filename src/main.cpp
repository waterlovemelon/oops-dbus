#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QQuickStyle>
#include <QUrl>
#include <QDateTime>
#include <QDebug>
#include <QDir>
#include <QFile>
#include <QMutex>
#include <QMutexLocker>
#include <QStandardPaths>
#include <QTextStream>

#include "dbus/DBusManager.h"
#include "dbus/ServiceExplorer.h"
#include "dbus/MethodInvoker.h"
#include "dbus/SignalMonitor.h"

#include "dbus/models/ServiceModel.h"
#include "dbus/models/MemberModel.h"
#include "dbus/models/ArgumentModel.h"
#include "dbus/models/SignalEventModel.h"

namespace {
QMutex g_logMutex;
QFile *g_logFile = nullptr;

QString logLevelName(QtMsgType type)
{
    switch (type) {
    case QtDebugMsg:
        return "DEBUG";
    case QtInfoMsg:
        return "INFO";
    case QtWarningMsg:
        return "WARN";
    case QtCriticalMsg:
        return "ERROR";
    case QtFatalMsg:
        return "FATAL";
    }

    return "UNKNOWN";
}

void writeLogMessage(QtMsgType type, const QMessageLogContext &context, const QString &message)
{
    const QString timestamp = QDateTime::currentDateTime().toString(Qt::ISODateWithMs);
    const QString category = context.category ? QString::fromUtf8(context.category) : QStringLiteral("default");
    const QString formatted = QStringLiteral("[%1] [%2] [%3] %4")
                                  .arg(timestamp, logLevelName(type), category, message);

    fprintf(stderr, "%s\n", formatted.toLocal8Bit().constData());
    fflush(stderr);

    QMutexLocker locker(&g_logMutex);
    if (g_logFile && g_logFile->isOpen()) {
        QTextStream stream(g_logFile);
        stream << formatted << endl;
        g_logFile->flush();
    }

    if (type == QtFatalMsg) {
        abort();
    }
}

void setupFileLogging()
{
    const QString logDirPath = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation);
    if (logDirPath.isEmpty()) {
        return;
    }

    QDir logDir;
    if (!logDir.mkpath(logDirPath)) {
        return;
    }

    const QString logFilePath = logDirPath + "/dd-feet.log";
    auto *file = new QFile(logFilePath);
    if (!file->open(QIODevice::WriteOnly | QIODevice::Append | QIODevice::Text)) {
        delete file;
        return;
    }

    g_logFile = file;
    qInstallMessageHandler(writeLogMessage);
    qInfo().noquote() << "Writing logs to" << logFilePath;
}
} // namespace

int main(int argc, char *argv[])
{
    QGuiApplication app(argc, argv);
    setupFileLogging();
    QQuickStyle::setStyle("Basic");

    qmlRegisterType<DBusManager>("DbusWorkbench", 1, 0, "DBusManager");
    qmlRegisterType<ServiceExplorer>("DbusWorkbench", 1, 0, "ServiceExplorer");
    qmlRegisterType<MethodInvoker>("DbusWorkbench", 1, 0, "MethodInvoker");
    qmlRegisterType<SignalMonitor>("DbusWorkbench", 1, 0, "SignalMonitor");
    qmlRegisterType<ServiceModel>("DbusWorkbench", 1, 0, "ServiceModel");
    qmlRegisterType<MemberModel>("DbusWorkbench", 1, 0, "MemberModel");
    qmlRegisterType<ArgumentModel>("DbusWorkbench", 1, 0, "ArgumentModel");
    qmlRegisterType<SignalEventModel>("DbusWorkbench", 1, 0, "SignalEventModel");

    QQmlApplicationEngine engine;
    const QUrl mainUrl(QStringLiteral("qrc:/qml/Main.qml"));
    QObject::connect(
        &engine,
        &QQmlApplicationEngine::objectCreated,
        &app,
        [mainUrl](QObject *obj, const QUrl &objUrl) {
            if (!obj && objUrl == mainUrl) {
                QCoreApplication::exit(-1);
            }
        },
        Qt::QueuedConnection);
    engine.load(mainUrl);

    return app.exec();
}
