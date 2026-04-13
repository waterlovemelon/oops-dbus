#ifndef SERVICEMODEL_H
#define SERVICEMODEL_H

#include <QAbstractListModel>
#include <QStringList>

#include "../ServiceExplorer.h"

class ServiceModel : public QAbstractListModel
{
    Q_OBJECT
    Q_PROPERTY(QString filterText READ filterText WRITE setFilterText NOTIFY filterTextChanged)

public:
    enum Roles {
        IdRole = Qt::UserRole + 1,
        LabelRole,
        CountRole,
        BusTypeRole
    };

    explicit ServiceModel(QObject *parent = nullptr);

    int rowCount(const QModelIndex &parent = QModelIndex()) const override;
    QVariant data(const QModelIndex &index, int role = Qt::DisplayRole) const override;
    QHash<int, QByteArray> roleNames() const override;

    QString filterText() const;
    void setFilterText(const QString &text);

    Q_INVOKABLE void setServices(const QStringList &services, int busType);
    Q_INVOKABLE void addService(const QString &service, int busType);
    Q_INVOKABLE void removeService(const QString &service);
    Q_INVOKABLE void clear();

signals:
    void filterTextChanged();

private:
    struct ServiceItem {
        QString id;
        QString label;
        int count;
        DBusManager::BusType busType;
    };

    QList<ServiceItem> m_allServices;
    QList<ServiceItem> m_filteredServices;
    QString m_filterText;

    bool fuzzyMatch(const QString &text, const QString &pattern) const;
    void applyFilter();
};

#endif // SERVICEMODEL_H
