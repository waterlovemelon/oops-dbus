#include <QtTest>

#include "src/dbus/models/ArgumentModel.h"

class ArgumentModelTest : public QObject
{
    Q_OBJECT

private slots:
    void splitsSimpleSignature();
    void keepsContainerTypesIntact();
    void splitsMixedSignature();
    void convertsScalarValues();
    void reportsInvalidBoolean();
};

void ArgumentModelTest::splitsSimpleSignature()
{
    ArgumentModel model;
    model.setArgumentsFromSignature("is");

    QCOMPARE(model.rowCount(), 2);
    QCOMPARE(model.data(model.index(0, 0), ArgumentModel::SignatureRole).toString(), QString("i"));
    QCOMPARE(model.data(model.index(1, 0), ArgumentModel::SignatureRole).toString(), QString("s"));
}

void ArgumentModelTest::keepsContainerTypesIntact()
{
    ArgumentModel model;
    model.setArgumentsFromSignature("a{sv}(ss)as");

    QCOMPARE(model.rowCount(), 3);
    QCOMPARE(model.data(model.index(0, 0), ArgumentModel::SignatureRole).toString(), QString("a{sv}"));
    QCOMPARE(model.data(model.index(1, 0), ArgumentModel::SignatureRole).toString(), QString("(ss)"));
    QCOMPARE(model.data(model.index(2, 0), ArgumentModel::SignatureRole).toString(), QString("as"));
}

void ArgumentModelTest::splitsMixedSignature()
{
    ArgumentModel model;
    model.setArgumentsFromSignature("sa{sv}(si)");

    QCOMPARE(model.rowCount(), 3);
    QCOMPARE(model.data(model.index(0, 0), ArgumentModel::SignatureRole).toString(), QString("s"));
    QCOMPARE(model.data(model.index(1, 0), ArgumentModel::SignatureRole).toString(), QString("a{sv}"));
    QCOMPARE(model.data(model.index(2, 0), ArgumentModel::SignatureRole).toString(), QString("(si)"));
}

void ArgumentModelTest::convertsScalarValues()
{
    ArgumentModel model;
    model.setArgumentsFromSignature("ibd");
    model.setArgumentValue(0, "42");
    model.setArgumentValue(1, "true");
    model.setArgumentValue(2, "3.5");

    const QVariantList values = model.getArgumentValues();
    QCOMPARE(values.size(), 3);
    QCOMPARE(values.at(0).toInt(), 42);
    QCOMPARE(values.at(1).toBool(), true);
    QCOMPARE(values.at(2).toDouble(), 3.5);
    QVERIFY(model.lastError().isEmpty());
}

void ArgumentModelTest::reportsInvalidBoolean()
{
    ArgumentModel model;
    model.setArgumentsFromSignature("b");
    model.setArgumentValue(0, "nope");

    const QVariantList values = model.getArgumentValues();
    QVERIFY(values.isEmpty());
    QCOMPARE(model.lastError(), QString("arg1 expects boolean"));
}

QTEST_MAIN(ArgumentModelTest)
#include "test_argumentmodel.moc"
