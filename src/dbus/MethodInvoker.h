#ifndef METHODINVOKER_H
#define METHODINVOKER_H

#include <QObject>
#include <QVariantList>
#include <QDBusMessage>

struct ArgumentInfo {
    QString name;
    QString signature;
    QString type;
    QVariant defaultValue;
    QVariant value;
};

class MethodInvoker : public QObject
{
    Q_OBJECT

public:
    explicit MethodInvoker(QObject *parent = nullptr);

    Q_INVOKABLE bool invokeMethod(const QString &serviceName,
                                  const QString &path,
                                  const QString &interfaceName,
                                  const QString &methodName,
                                  const QVariantList &arguments,
                                  int busType);

    void setMethodInfo(const QList<ArgumentInfo> &arguments);
    QList<ArgumentInfo> methodInfo() const;

signals:
    void invocationCompleted(bool success, const QVariant &result, const QString &error);
    void invocationFailed(const QString &error);

private:
    QList<ArgumentInfo> m_methodInfo;
    QVariant m_parseReturnValue(const QDBusMessage &reply);
    QString m_errorMessage;
};

#endif // METHODINVOKER_H
