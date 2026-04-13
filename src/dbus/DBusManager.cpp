#include "DBusManager.h"

#include <QDebug>

DBusManager::DBusManager(QObject *parent)
    : QObject(parent)
    , m_sessionConnection(QDBusConnection::sessionBus())
    , m_systemConnection(QDBusConnection::systemBus())
{
    setupMonitoring();
}

QDBusConnection DBusManager::connection(int busType) const
{
    return static_cast<BusType>(busType) == SessionBus ? m_sessionConnection : m_systemConnection;
}

bool DBusManager::isConnected(int busType) const
{
    QDBusConnection conn = connection(busType);
    return conn.isConnected();
}

void DBusManager::setupMonitoring()
{
    if (!m_sessionConnection.isConnected()) {
        qWarning() << "Failed to connect to session bus";
        return;
    }

    if (!m_systemConnection.isConnected()) {
        qWarning() << "Failed to connect to system bus";
        return;
    }

    emit connected(SessionBus);
    emit connected(SystemBus);

    bool success = m_sessionConnection.connect(
        "org.freedesktop.DBus",
        "/org/freedesktop/DBus",
        "org.freedesktop.DBus",
        "NameOwnerChanged",
        this,
        SLOT(onSessionNameOwnerChanged(QString, QString, QString))
    );

    if (!success) {
        qWarning() << "Failed to connect to NameOwnerChanged signal on session bus";
    }
}
