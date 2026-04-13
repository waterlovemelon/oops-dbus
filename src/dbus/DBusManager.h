#ifndef DBUSMANAGER_H
#define DBUSMANAGER_H

#include <QObject>
#include <QStringList>
#include <QDBusConnection>

class DBusManager : public QObject
{
    Q_OBJECT

public:
    explicit DBusManager(QObject *parent = nullptr);

    enum BusType {
        SessionBus,
        SystemBus
    };
    Q_ENUM(BusType)

    Q_INVOKABLE QDBusConnection connection(int busType) const;

    Q_INVOKABLE bool isConnected(int busType) const;

signals:
    void connected(int busType);
    void disconnected(int busType);
    void serviceAdded(const QString &serviceName, int busType);
    void serviceRemoved(const QString &serviceName, int busType);

private:
    QDBusConnection m_sessionConnection;
    QDBusConnection m_systemConnection;

    void setupMonitoring();
};

#endif // DBUSMANAGER_H
