#ifndef ARGUMENTMODEL_H
#define ARGUMENTMODEL_H

#include <QAbstractListModel>

#include "../MethodInvoker.h"

class ArgumentModel : public QAbstractListModel
{
    Q_OBJECT

public:
    enum Roles {
        NameRole = Qt::UserRole + 1,
        SignatureRole,
        TypeRole,
        ValueRole
    };
    Q_ENUM(Roles)

    explicit ArgumentModel(QObject *parent = nullptr);

    int rowCount(const QModelIndex &parent = QModelIndex()) const override;
    QVariant data(const QModelIndex &index, int role = Qt::DisplayRole) const override;
    QHash<int, QByteArray> roleNames() const override;

    Q_INVOKABLE void setArguments(const QList<ArgumentInfo> &arguments);
    Q_INVOKABLE void setArgumentsFromSignature(const QString &signature);
    Q_INVOKABLE void setArgumentValue(int index, const QVariant &value);
    Q_INVOKABLE QVariantList getArgumentValues();
    Q_INVOKABLE QString lastError() const;
    Q_INVOKABLE void clear();

private:
    QList<ArgumentInfo> m_arguments;
    QString m_lastError;
};

#endif // ARGUMENTMODEL_H
