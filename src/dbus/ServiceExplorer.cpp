#include "ServiceExplorer.h"
#include "DBusManager.h"

#include <QDBusInterface>
#include <QDBusReply>
#include <QDomDocument>
#include <QDebug>
#include <QVariantMap>

ServiceExplorer::ServiceExplorer(QObject *parent)
    : QObject(parent)
{
}

QStringList ServiceExplorer::listServices(int busType)
{
    QStringList services;

    QDBusConnection conn = (static_cast<DBusManager::BusType>(busType) == DBusManager::SessionBus) ? QDBusConnection::sessionBus() : QDBusConnection::systemBus();
    if (!conn.isConnected()) {
        qWarning() << "[ServiceExplorer] Not connected to D-Bus busType=" << busType;
        return services;
    }

    QDBusInterface dbus("org.freedesktop.DBus", "/org/freedesktop/DBus", "org.freedesktop.DBus", conn);
    QDBusReply<QStringList> reply = dbus.call("ListNames");

    if (reply.isValid()) {
        services = reply.value();
        qDebug() << "[ServiceExplorer] listServices returned" << services.count() << "names";
    } else {
        qWarning() << "[ServiceExplorer] Failed to list services:" << reply.error().message();
    }

    return services;
}

DbusServiceInfo ServiceExplorer::introspectService(const QString &serviceName, int busType)
{
    DbusServiceInfo info;
    info.name = serviceName;
    QString id = serviceName;
    info.id = id.replace(".", "-").replace(":", "");
    info.busType = static_cast<DBusManager::BusType>(busType);

    QDBusConnection conn = (static_cast<DBusManager::BusType>(busType) == DBusManager::SessionBus) ? QDBusConnection::sessionBus() : QDBusConnection::systemBus();
    if (!conn.isConnected()) {
        qWarning() << "Not connected to D-Bus";
        return info;
    }

    const QString rootPath = "/";
    info.interfaces = introspectPath(serviceName, rootPath, busType);

    emit introspectionCompleted(info);

    return info;
}

QVariantList ServiceExplorer::introspectServiceMembers(const QString &serviceName, int busType)
{
    QVariantList members;
    const DbusServiceInfo serviceInfo = introspectService(serviceName, busType);

    for (const DbusInterfaceInfo &interfaceInfo : serviceInfo.interfaces) {
        for (const DbusMemberInfo &member : interfaceInfo.methods) {
            members.append(m_memberToVariantMap(member));
        }
        for (const DbusMemberInfo &member : interfaceInfo.signalMembers) {
            members.append(m_memberToVariantMap(member));
        }
        for (const DbusMemberInfo &member : interfaceInfo.properties) {
            members.append(m_memberToVariantMap(member));
        }
    }

    return members;
}

QList<DbusInterfaceInfo> ServiceExplorer::introspectPath(const QString &serviceName, const QString &path, int busType)
{
    QList<DbusInterfaceInfo> interfaces;

    QString xml = m_introspect(serviceName, path, busType);
    if (xml.isEmpty()) {
        return interfaces;
    }

    QDomDocument doc;
    if (!doc.setContent(xml)) {
        qWarning() << "Failed to parse introspection XML for" << serviceName << path;
        return interfaces;
    }

    QDomElement root = doc.documentElement();

    for (QDomNode child = root.firstChild(); !child.isNull(); child = child.nextSibling()) {
        const QDomElement childElement = child.toElement();
        if (childElement.isNull()) {
            continue;
        }

        if (childElement.tagName() == "interface") {
            const QString interfaceName = childElement.attribute("name");
            if (interfaceName.startsWith("org.freedesktop.DBus.")) {
                continue;
            }

            DbusInterfaceInfo interfaceInfo;
            interfaceInfo.name = interfaceName;
            interfaceInfo.path = path;
            interfaceInfo.methods = m_parseMethods(const_cast<QDomElement &>(childElement), path);
            interfaceInfo.signalMembers = m_parseSignals(const_cast<QDomElement &>(childElement), path);
            interfaceInfo.properties = m_parseProperties(const_cast<QDomElement &>(childElement), path);
            interfaces.append(interfaceInfo);
            continue;
        }

        if (childElement.tagName() != "node") {
            continue;
        }

        const QString subPath = childElement.attribute("name");
        if (subPath.isEmpty()) {
            continue;
        }

        const QString fullPath = path == "/" ? "/" + subPath : path + "/" + subPath;
        interfaces.append(introspectPath(serviceName, fullPath, busType));
    }

    return interfaces;
}

QString ServiceExplorer::m_introspect(const QString &serviceName, const QString &path, int busType)
{
    QDBusConnection conn = (static_cast<DBusManager::BusType>(busType) == DBusManager::SessionBus) ? QDBusConnection::sessionBus() : QDBusConnection::systemBus();
    if (!conn.isConnected()) {
        return QString();
    }

    QDBusInterface iface(serviceName, path, "org.freedesktop.DBus.Introspectable", conn);
    QDBusReply<QString> reply = iface.call("Introspect");

    if (reply.isValid()) {
        return reply.value();
    } else {
        qWarning() << "Introspection failed for" << serviceName << path << ":" << reply.error().message();
        emit introspectionFailed(serviceName, reply.error().message());
        return QString();
    }
}

bool ServiceExplorer::m_parseIntrospectionXml(const QString &xml, DbusInterfaceInfo &interfaceInfo)
{
    QDomDocument doc;
    if (!doc.setContent(xml)) {
        return false;
    }

    QDomElement root = doc.documentElement();

    QDomNodeList interfaceNodes = root.elementsByTagName("interface");
    for (int i = 0; i < interfaceNodes.count(); ++i) {
        QDomElement interfaceElement = interfaceNodes.item(i).toElement();
        if (interfaceElement.attribute("name") == interfaceInfo.name) {
            interfaceInfo.methods = m_parseMethods(interfaceElement, interfaceInfo.path);
            interfaceInfo.signalMembers = m_parseSignals(interfaceElement, interfaceInfo.path);
            interfaceInfo.properties = m_parseProperties(interfaceElement, interfaceInfo.path);
            return true;
        }
    }

    return false;
}

QList<DbusMemberInfo> ServiceExplorer::m_parseMethods(QDomElement &interfaceElement, const QString &path)
{
    QList<DbusMemberInfo> methods;
    QDomNodeList methodNodes = interfaceElement.elementsByTagName("method");

    for (int i = 0; i < methodNodes.count(); ++i) {
        QDomElement methodElement = methodNodes.item(i).toElement();
        DbusMemberInfo info;
        info.id = path + "|" + interfaceElement.attribute("name") + "|method|" + methodElement.attribute("name");
        info.name = methodElement.attribute("name");
        info.type = "method";
        info.interfaceName = interfaceElement.attribute("name");
        info.path = path;

        QDomNodeList argNodes = methodElement.elementsByTagName("arg");
        for (int j = 0; j < argNodes.count(); ++j) {
            QDomElement argElement = argNodes.item(j).toElement();
            QString direction = argElement.attribute("direction", "in");
            if (direction == "in") {
                info.signature += argElement.attribute("type");
            } else {
                info.returnType += argElement.attribute("type");
            }
        }

        QDomNodeList annotationNodes = methodElement.elementsByTagName("annotation");
        for (int k = 0; k < annotationNodes.count(); ++k) {
            QDomElement annotationElement = annotationNodes.item(k).toElement();
            if (annotationElement.attribute("name") == "org.freedesktop.DBus.Deprecated") {
                info.annotation = "deprecated";
            }
        }

        methods.append(info);
    }

    return methods;
}

QList<DbusMemberInfo> ServiceExplorer::m_parseSignals(QDomElement &interfaceElement, const QString &path)
{
    QList<DbusMemberInfo> result;
    QDomNodeList signalNodes = interfaceElement.elementsByTagName("signal");

    for (int i = 0; i < signalNodes.count(); ++i) {
        QDomElement signalElement = signalNodes.item(i).toElement();
        DbusMemberInfo info;
        info.id = path + "|" + interfaceElement.attribute("name") + "|signal|" + signalElement.attribute("name");
        info.name = signalElement.attribute("name");
        info.type = "signal";
        info.interfaceName = interfaceElement.attribute("name");
        info.path = path;

        QDomNodeList argNodes = signalElement.elementsByTagName("arg");
        for (int j = 0; j < argNodes.count(); ++j) {
            QDomElement argElement = argNodes.item(j).toElement();
            info.signature += argElement.attribute("type");
        }

        result.append(info);
    }

    return result;
}

QList<DbusMemberInfo> ServiceExplorer::m_parseProperties(QDomElement &interfaceElement, const QString &path)
{
    QList<DbusMemberInfo> properties;
    QDomNodeList propertyNodes = interfaceElement.elementsByTagName("property");

    for (int i = 0; i < propertyNodes.count(); ++i) {
        QDomElement propertyElement = propertyNodes.item(i).toElement();
        DbusMemberInfo info;
        info.id = path + "|" + interfaceElement.attribute("name") + "|property|" + propertyElement.attribute("name");
        info.name = propertyElement.attribute("name");
        info.type = "property";
        info.interfaceName = interfaceElement.attribute("name");
        info.path = path;
        info.signature = propertyElement.attribute("type");

        QString access = propertyElement.attribute("access", "read");
        if (access.contains("read")) {
            if (access.contains("write")) {
                info.annotation = "readwrite";
            } else {
                info.annotation = "readonly";
            }
        } else {
            info.annotation = "writeonly";
        }

        properties.append(info);
    }

    return properties;
}

QVariantMap ServiceExplorer::m_memberToVariantMap(const DbusMemberInfo &member) const
{
    return {
        {"id", member.id},
        {"name", member.name},
        {"type", member.type},
        {"interfaceName", member.interfaceName},
        {"path", member.path},
        {"signature", member.signature},
        {"returnType", member.returnType},
        {"annotation", member.annotation}
    };
}
