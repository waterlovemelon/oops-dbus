#include "MethodInvoker.h"

#include <QDBusConnection>
#include <QDBusInterface>
#include <QDBusReply>
#include <QDBusPendingCallWatcher>
#include <QJsonDocument>
#include <QJsonObject>
#include <QDebug>

MethodInvoker::MethodInvoker(QObject *parent)
    : QObject(parent)
{
}

bool MethodInvoker::invokeMethod(const QString &serviceName,
                                   const QString &path,
                                   const QString &interfaceName,
                                   const QString &methodName,
                                   const QVariantList &arguments,
                                   int busType)
{
    QDBusConnection conn = (busType == 0) ? QDBusConnection::sessionBus() : QDBusConnection::systemBus();

    if (!conn.isConnected()) {
        m_errorMessage = "Not connected to D-Bus";
        emit invocationFailed(m_errorMessage);
        return false;
    }

    QDBusMessage call = QDBusMessage::createMethodCall(serviceName, path, interfaceName, methodName);

    if (!arguments.isEmpty()) {
        call.setArguments(arguments);
    }

    QDBusPendingCall async = conn.asyncCall(call);
    QDBusPendingCallWatcher *watcher = new QDBusPendingCallWatcher(async, this);

    connect(watcher, &QDBusPendingCallWatcher::finished, this, [this, watcher]() {
        QDBusPendingCall reply = *watcher;

        if (reply.isError()) {
            QString errorMsg = reply.error().message();
            emit invocationCompleted(false, QVariant(), errorMsg);
        } else {
            QVariant result = m_parseReturnValue(reply.reply());
            emit invocationCompleted(true, result, QString());
        }

        watcher->deleteLater();
    });

    return true;
}

void MethodInvoker::setMethodInfo(const QList<ArgumentInfo> &arguments)
{
    m_methodInfo = arguments;
}

QList<ArgumentInfo> MethodInvoker::methodInfo() const
{
    return m_methodInfo;
}

QVariant MethodInvoker::m_parseReturnValue(const QDBusMessage &reply)
{
    const QList<QVariant> arguments = reply.arguments();

    if (arguments.isEmpty()) {
        return QVariant();
    }

    if (arguments.size() == 1) {
        return arguments.first();
    }

    QVariantList list;
    for (const QVariant &arg : arguments) {
        list.append(arg);
    }

    return QVariant::fromValue(list);
}
