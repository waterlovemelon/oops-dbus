#include <QtTest>

#include "src/dbus/models/MemberModel.h"

class MemberModelTest : public QObject
{
    Q_OBJECT

private slots:
    void loadsMembersFromVariantList();
};

void MemberModelTest::loadsMembersFromVariantList()
{
    MemberModel model;

    QVariantList members;
    members.append(QVariantMap{
        {"id", "org.example.Interface.Ping"},
        {"name", "Ping"},
        {"type", "method"},
        {"interfaceName", "org.example.Interface"},
        {"path", "/org/example/Object"},
        {"signature", "s"},
        {"returnType", "b"},
        {"annotation", "deprecated"}
    });

    model.setMembersFromVariantList(members);

    QCOMPARE(model.rowCount(), 1);

    const QModelIndex index = model.index(0, 0);
    QCOMPARE(model.data(index, MemberModel::IdRole).toString(), QString("org.example.Interface.Ping"));
    QCOMPARE(model.data(index, MemberModel::NameRole).toString(), QString("Ping"));
    QCOMPARE(model.data(index, MemberModel::TypeRole).toString(), QString("method"));
    QCOMPARE(model.data(index, MemberModel::InterfaceNameRole).toString(), QString("org.example.Interface"));
    QCOMPARE(model.data(index, MemberModel::PathRole).toString(), QString("/org/example/Object"));
    QCOMPARE(model.data(index, MemberModel::SignatureRole).toString(), QString("s"));
    QCOMPARE(model.data(index, MemberModel::ReturnTypeRole).toString(), QString("b"));
    QCOMPARE(model.data(index, MemberModel::AnnotationRole).toString(), QString("deprecated"));
}

QTEST_MAIN(MemberModelTest)
#include "test_membermodel.moc"
