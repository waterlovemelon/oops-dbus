#include <QtTest>

#include "src/dbus/ServiceExplorer.h"

class ServiceExplorerTest : public QObject
{
    Q_OBJECT

private slots:
    void introspectUnknownServiceReturnsEmptyMembers();
};

void ServiceExplorerTest::introspectUnknownServiceReturnsEmptyMembers()
{
    ServiceExplorer explorer;
    const QVariantList members = explorer.introspectServiceMembers("org.example.DoesNotExist", static_cast<int>(DBusManager::SessionBus));
    QVERIFY(members.isEmpty());
}

QTEST_MAIN(ServiceExplorerTest)
#include "test_serviceexplorer.moc"
