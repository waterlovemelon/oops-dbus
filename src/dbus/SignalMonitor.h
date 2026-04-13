#ifndef SIGNALMONITOR_H
#define SIGNALMONITOR_H

#include <QObject>
#include <QString>
#include <QDBusConnection>

#include "DBusManager.h"

struct SignalEvent {
    QString time;
    QString topic;
    QString sender;
    QString payload;
};

class SignalMonitor : public QObject
{
    Q_OBJECT

public:
    SignalMonitor(QObject *parent = nullptr);

    Q_INVOKABLE bool subscribe(const QString &serviceName,
                                const QString &path,
                                const QString &interfaceName,
                                const QString &signalName,
                                int busType);

    Q_INVOKABLE void unsubscribe(const QString &serviceName,
                                  const QString &path,
                                  const QString &interfaceName,
                                  const QString &signalName,
                                  int busType);

    Q_INVOKABLE void subscribeAll(const QString &serviceName,
                                   const QString &path,
                                   const QString &interfaceName,
                                   int busType);

    Q_INVOKABLE void unsubscribeAll(const QString &serviceName,
                                     const QString &path,
                                     const QString &interfaceName,
                                     int busType);

signals:
    void signalReceived(const SignalEvent &event);

private slots:
    void onDBusSignal(const QDBusMessage &message);

private:
    struct Subscription {
        QString serviceName;
        QString path;
        QString interfaceName;
        QString signalName;
        DBusManager::BusType busType;
    };

    QList<Subscription> m_subscriptions;
    QString m_formatTimestamp();
};

#endif // SIGNALMONITOR_H
