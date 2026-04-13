#ifndef SERVICEEXPLORER_H
#define SERVICEEXPLORER_H

#include <QObject>
#include <QDBusInterface>
#include <QDomElement>
#include <QVariantList>

#include "DBusManager.h"

struct DbusMemberInfo {
    QString id;
    QString name;
    QString type;
    QString interfaceName;
    QString path;
    QString signature;
    QString returnType;
    QString annotation;
};

struct DbusInterfaceInfo {
    QString name;
    QString path;
    QList<DbusMemberInfo> methods;
    QList<DbusMemberInfo> signalMembers;
    QList<DbusMemberInfo> properties;
};

struct DbusServiceInfo {
    QString name;
    QString id;
    DBusManager::BusType busType;
    QList<DbusInterfaceInfo> interfaces;
};

class ServiceExplorer : public QObject
{
    Q_OBJECT

public:
    ServiceExplorer(QObject *parent = nullptr);

    Q_INVOKABLE QStringList listServices(int busType);
    Q_INVOKABLE DbusServiceInfo introspectService(const QString &serviceName, int busType);
    Q_INVOKABLE QList<DbusInterfaceInfo> introspectPath(const QString &serviceName, const QString &path, int busType);
    Q_INVOKABLE QVariantList introspectServiceMembers(const QString &serviceName, int busType);

signals:
    void introspectionCompleted(const DbusServiceInfo &serviceInfo);
    void introspectionFailed(const QString &serviceName, const QString &error);

private:
    QString m_introspect(const QString &serviceName, const QString &path, int busType);
    bool m_parseIntrospectionXml(const QString &xml, DbusInterfaceInfo &interfaceInfo);
    QList<DbusMemberInfo> m_parseMethods(QDomElement &interfaceElement, const QString &path);
    QList<DbusMemberInfo> m_parseSignals(QDomElement &interfaceElement, const QString &path);
    QList<DbusMemberInfo> m_parseProperties(QDomElement &interfaceElement, const QString &path);
    QVariantMap m_memberToVariantMap(const DbusMemberInfo &member) const;
};

#endif // SERVICEEXPLORER_H
