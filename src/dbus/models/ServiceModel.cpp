#include "ServiceModel.h"

#include <QRegularExpression>

ServiceModel::ServiceModel(QObject *parent)
    : QAbstractListModel(parent)
{
}

int ServiceModel::rowCount(const QModelIndex &parent) const
{
    if (parent.isValid())
        return 0;
    return m_filteredServices.count();
}

QVariant ServiceModel::data(const QModelIndex &index, int role) const
{
    if (!index.isValid() || index.row() >= m_filteredServices.count())
        return QVariant();

    const ServiceItem &item = m_filteredServices.at(index.row());

    switch (role) {
    case IdRole:
        return item.id;
    case LabelRole:
        return item.label;
    case CountRole:
        return item.count;
    case BusTypeRole:
        return static_cast<int>(item.busType);
    default:
        return QVariant();
    }
}

QHash<int, QByteArray> ServiceModel::roleNames() const
{
    QHash<int, QByteArray> roles;
    roles[IdRole] = "id";
    roles[LabelRole] = "label";
    roles[CountRole] = "count";
    roles[BusTypeRole] = "busType";
    return roles;
}

QString ServiceModel::filterText() const
{
    return m_filterText;
}

void ServiceModel::setFilterText(const QString &text)
{
    if (m_filterText == text)
        return;
    m_filterText = text;
    applyFilter();
    emit filterTextChanged();
}

bool ServiceModel::fuzzyMatch(const QString &text, const QString &pattern) const
{
    if (pattern.isEmpty())
        return true;

    QString lowerText = text.toLower();
    QString lowerPattern = pattern.toLower();

    if (lowerText.contains(lowerPattern))
        return true;

    QStringList parts = lowerPattern.split(QRegularExpression("\\s+"), QString::SkipEmptyParts);
    for (const QString &part : parts) {
        if (!lowerText.contains(part))
            return false;
    }

    return true;
}

void ServiceModel::applyFilter()
{
    beginResetModel();
    m_filteredServices.clear();

    if (m_filterText.isEmpty()) {
        m_filteredServices = m_allServices;
    } else {
        for (const ServiceItem &item : m_allServices) {
            if (fuzzyMatch(item.label, m_filterText)) {
                m_filteredServices.append(item);
            }
        }
    }

    endResetModel();
}

void ServiceModel::setServices(const QStringList &services, int busType)
{
    beginResetModel();
    m_allServices.clear();
    m_filteredServices.clear();

    for (const QString &service : services) {
        if (service.startsWith(":"))
            continue;

        ServiceItem item;
        QString idCopy = service;
        item.id = "service-" + idCopy.replace(".", "-").replace(":", "");
        item.label = service;
        item.count = 0;
        item.busType = static_cast<DBusManager::BusType>(busType);
        m_allServices.append(item);
    }

    std::sort(m_allServices.begin(), m_allServices.end(), [](const ServiceItem &a, const ServiceItem &b) {
        return a.label < b.label;
    });

    applyFilter();
    endResetModel();
}

void ServiceModel::addService(const QString &service, int busType)
{
    for (const ServiceItem &item : m_allServices) {
        if (item.label == service)
            return;
    }

    ServiceItem item;
    QString idCopy = service;
    item.id = "service-" + idCopy.replace(".", "-").replace(":", "");
    item.label = service;
    item.count = 0;
    item.busType = static_cast<DBusManager::BusType>(busType);
    m_allServices.append(item);

    applyFilter();
}

void ServiceModel::removeService(const QString &service)
{
    for (int i = 0; i < m_allServices.count(); ++i) {
        if (m_allServices.at(i).label == service) {
            m_allServices.removeAt(i);
            applyFilter();
            return;
        }
    }
}

void ServiceModel::clear()
{
    beginResetModel();
    m_allServices.clear();
    m_filteredServices.clear();
    endResetModel();
}
