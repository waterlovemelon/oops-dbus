#ifndef MEMBERMODEL_H
#define MEMBERMODEL_H

#include <QAbstractListModel>
#include <QVariantList>

#include "../ServiceExplorer.h"

class MemberModel : public QAbstractListModel
{
    Q_OBJECT

public:
    enum Roles {
        IdRole = Qt::UserRole + 1,
        NameRole,
        TypeRole,
        InterfaceNameRole,
        PathRole,
        SignatureRole,
        ReturnTypeRole,
        AnnotationRole
    };

    explicit MemberModel(QObject *parent = nullptr);

    int rowCount(const QModelIndex &parent = QModelIndex()) const override;
    QVariant data(const QModelIndex &index, int role = Qt::DisplayRole) const override;
    QHash<int, QByteArray> roleNames() const override;

    Q_INVOKABLE void setMembers(const QList<DbusMemberInfo> &members, const QString &interfaceName, const QString &path);
    Q_INVOKABLE void setMembersFromVariantList(const QVariantList &members);
    Q_INVOKABLE void clear();

private:
    QList<DbusMemberInfo> m_members;
    QString m_interfaceName;
    QString m_path;
};

#endif // MEMBERMODEL_H
