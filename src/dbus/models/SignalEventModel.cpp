#include "SignalEventModel.h"

SignalEventModel::SignalEventModel(QObject *parent)
    : QAbstractListModel(parent)
{
}

int SignalEventModel::rowCount(const QModelIndex &parent) const
{
    if (parent.isValid())
        return 0;
    return m_events.count();
}

QVariant SignalEventModel::data(const QModelIndex &index, int role) const
{
    if (!index.isValid() || index.row() >= m_events.count())
        return QVariant();

    const SignalEvent &event = m_events.at(index.row());

    switch (role) {
    case TimeRole:
        return event.time;
    case TopicRole:
        return event.topic;
    case SenderRole:
        return event.sender;
    case PayloadRole:
        return event.payload;
    default:
        return QVariant();
    }
}

QHash<int, QByteArray> SignalEventModel::roleNames() const
{
    QHash<int, QByteArray> roles;
    roles[TimeRole] = "time";
    roles[TopicRole] = "topic";
    roles[SenderRole] = "sender";
    roles[PayloadRole] = "payload";
    return roles;
}

void SignalEventModel::addEvent(const SignalEvent &event)
{
    beginInsertRows(QModelIndex(), 0, 0);
    m_events.prepend(event);

    if (m_events.count() > MAX_EVENTS) {
        m_events.removeLast();
    }

    endInsertRows();
}

void SignalEventModel::clear()
{
    beginResetModel();
    m_events.clear();
    endResetModel();
}
