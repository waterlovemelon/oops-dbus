#ifndef SIGNALEVENTMODEL_H
#define SIGNALEVENTMODEL_H

#include <QAbstractListModel>

#include "../SignalMonitor.h"

class SignalEventModel : public QAbstractListModel
{
    Q_OBJECT

public:
    enum Roles {
        TimeRole = Qt::UserRole + 1,
        TopicRole,
        SenderRole,
        PayloadRole
    };

    explicit SignalEventModel(QObject *parent = nullptr);

    int rowCount(const QModelIndex &parent = QModelIndex()) const override;
    QVariant data(const QModelIndex &index, int role = Qt::DisplayRole) const override;
    QHash<int, QByteArray> roleNames() const override;

    Q_INVOKABLE void addEvent(const SignalEvent &event);
    Q_INVOKABLE void clear();

private:
    QList<SignalEvent> m_events;
    static const int MAX_EVENTS = 100;
};

#endif // SIGNALEVENTMODEL_H
