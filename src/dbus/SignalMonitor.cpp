#include "SignalMonitor.h"
#include "DBusManager.h"

#include <QDateTime>
#include <QDBusMessage>
#include <QDebug>
#include <QJsonDocument>
#include <QJsonObject>

SignalMonitor::SignalMonitor(QObject *parent)
    : QObject(parent)
{
}

bool SignalMonitor::subscribe(const QString &serviceName,
                               const QString &path,
                               const QString &interfaceName,
                                const QString &signalName,
                                int busType)
{
    QDBusConnection conn = (busType == static_cast<int>(DBusManager::SessionBus)) ? QDBusConnection::sessionBus() : QDBusConnection::systemBus();

    if (!conn.isConnected()) {
        qWarning() << "Not connected to D-Bus";
        return false;
    }

    QString signalKey = serviceName + ":" + path + ":" + interfaceName + ":" + signalName;

    for (const Subscription &sub : m_subscriptions) {
        QString existingKey = sub.serviceName + ":" + sub.path + ":" + sub.interfaceName + ":" + sub.signalName;
        if (existingKey == signalKey) {
            qDebug() << "Already subscribed to signal:" << signalKey;
            return true;
        }
    }

    bool success = conn.connect(serviceName, path, interfaceName, signalName,
                               this, SLOT(onDBusSignal(QDBusMessage)));

    if (success) {
        Subscription sub;
        sub.serviceName = serviceName;
        sub.path = path;
        sub.interfaceName = interfaceName;
        sub.signalName = signalName;
        sub.busType = static_cast<DBusManager::BusType>(busType);
        m_subscriptions.append(sub);
        qDebug() << "Subscribed to signal:" << signalKey;
    } else {
        qWarning() << "Failed to subscribe to signal:" << signalKey;
    }

    return success;
}

void SignalMonitor::unsubscribe(const QString &serviceName,
                                  const QString &path,
                                  const QString &interfaceName,
                                  const QString &signalName,
                                  int busType)
{
    QDBusConnection conn = (busType == static_cast<int>(DBusManager::SessionBus)) ? QDBusConnection::sessionBus() : QDBusConnection::systemBus();

    if (!conn.isConnected()) {
        return;
    }

    QString signalKey = serviceName + ":" + path + ":" + interfaceName + ":" + signalName;

    bool success = conn.disconnect(serviceName, path, interfaceName, signalName,
                                  this, SLOT(onDBusSignal(QDBusMessage)));

    if (success) {
        for (int i = 0; i < m_subscriptions.count(); ++i) {
            QString existingKey = m_subscriptions[i].serviceName + ":" +
                                 m_subscriptions[i].path + ":" +
                                 m_subscriptions[i].interfaceName + ":" +
                                 m_subscriptions[i].signalName;
            if (existingKey == signalKey) {
                m_subscriptions.removeAt(i);
                break;
            }
        }
        qDebug() << "Unsubscribed from signal:" << signalKey;
    }
}

void SignalMonitor::subscribeAll(const QString &serviceName,
                                  const QString &path,
                                  const QString &interfaceName,
                                    int busType)
{
    QDBusConnection conn = (busType == static_cast<int>(DBusManager::SessionBus)) ? QDBusConnection::sessionBus() : QDBusConnection::systemBus();

    if (!conn.isConnected()) {
        qWarning() << "Not connected to D-Bus";
        return;
    }

    bool success = conn.connect(serviceName, path, interfaceName, QString(),
                               this, SLOT(onDBusSignal(QDBusMessage)));

    if (success) {
        Subscription sub;
        sub.serviceName = serviceName;
        sub.path = path;
        sub.interfaceName = interfaceName;
        sub.signalName = QString();
        sub.busType = static_cast<DBusManager::BusType>(busType);
        m_subscriptions.append(sub);
        qDebug() << "Subscribed to all signals from:" << serviceName << interfaceName;
    }
}

void SignalMonitor::unsubscribeAll(const QString &serviceName,
                                    const QString &path,
                                    const QString &interfaceName,
                                  int busType)
{
    QDBusConnection conn = (busType == static_cast<int>(DBusManager::SessionBus)) ? QDBusConnection::sessionBus() : QDBusConnection::systemBus();

    if (!conn.isConnected()) {
        return;
    }

    bool success = conn.disconnect(serviceName, path, interfaceName, QString(),
                                  this, SLOT(onDBusSignal(QDBusMessage)));

    if (success) {
        for (int i = m_subscriptions.count() - 1; i >= 0; --i) {
            const Subscription &sub = m_subscriptions[i];
            if (sub.serviceName == serviceName && sub.path == path &&
                sub.interfaceName == interfaceName && sub.signalName.isEmpty()) {
                m_subscriptions.removeAt(i);
            }
        }
    }
}

void SignalMonitor::onDBusSignal(const QDBusMessage &message)
{
    SignalEvent event;
    event.time = m_formatTimestamp();
    event.topic = message.interface() + "." + message.member();
    event.sender = message.service();
    event.payload = message.arguments().isEmpty() ? "" : message.arguments().first().toString();

    emit signalReceived(event);
}

QString SignalMonitor::m_formatTimestamp()
{
    return QDateTime::currentDateTime().toString("hh:mm:ss");
}
