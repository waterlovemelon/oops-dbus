#include "MemberModel.h"

#include <QVariantMap>

MemberModel::MemberModel(QObject *parent)
    : QAbstractListModel(parent)
{
}

int MemberModel::rowCount(const QModelIndex &parent) const
{
    if (parent.isValid())
        return 0;
    return m_members.count();
}

QVariant MemberModel::data(const QModelIndex &index, int role) const
{
    if (!index.isValid() || index.row() >= m_members.count())
        return QVariant();

    const DbusMemberInfo &member = m_members.at(index.row());

    switch (role) {
    case IdRole:
        return member.id;
    case NameRole:
        return member.name;
    case TypeRole:
        return member.type;
    case InterfaceNameRole:
        return member.interfaceName;
    case PathRole:
        return member.path;
    case SignatureRole:
        return member.signature;
    case ReturnTypeRole:
        return member.returnType;
    case AnnotationRole:
        return member.annotation;
    default:
        return QVariant();
    }
}

QHash<int, QByteArray> MemberModel::roleNames() const
{
    QHash<int, QByteArray> roles;
    roles[IdRole] = "id";
    roles[NameRole] = "name";
    roles[TypeRole] = "type";
    roles[InterfaceNameRole] = "interfaceName";
    roles[PathRole] = "path";
    roles[SignatureRole] = "signature";
    roles[ReturnTypeRole] = "returnType";
    roles[AnnotationRole] = "annotation";
    return roles;
}

void MemberModel::setMembers(const QList<DbusMemberInfo> &members, const QString &interfaceName, const QString &path)
{
    beginResetModel();
    m_members = members;
    m_interfaceName = interfaceName;
    m_path = path;
    endResetModel();
}

void MemberModel::setMembersFromVariantList(const QVariantList &members)
{
    QList<DbusMemberInfo> parsedMembers;
    parsedMembers.reserve(members.size());

    for (const QVariant &memberValue : members) {
        const QVariantMap memberMap = memberValue.toMap();
        DbusMemberInfo member;
        member.id = memberMap.value("id").toString();
        member.name = memberMap.value("name").toString();
        member.type = memberMap.value("type").toString();
        member.interfaceName = memberMap.value("interfaceName").toString();
        member.path = memberMap.value("path").toString();
        member.signature = memberMap.value("signature").toString();
        member.returnType = memberMap.value("returnType").toString();
        member.annotation = memberMap.value("annotation").toString();
        parsedMembers.append(member);
    }

    setMembers(parsedMembers, QString(), QString());
}

void MemberModel::clear()
{
    beginResetModel();
    m_members.clear();
    m_interfaceName.clear();
    m_path.clear();
    endResetModel();
}
