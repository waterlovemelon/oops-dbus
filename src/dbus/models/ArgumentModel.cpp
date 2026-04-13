#include "ArgumentModel.h"

namespace {
ArgumentInfo makeArgumentInfo(const QString &name, const QString &signature)
{
    ArgumentInfo argument;
    argument.name = name;
    argument.signature = signature;
    argument.type = "input";
    argument.value = QVariant();
    return argument;
}

bool parseBoolean(const QString &text, bool *ok)
{
    const QString normalized = text.trimmed().toLower();
    if (normalized == QLatin1String("true") || normalized == QLatin1String("1") || normalized == QLatin1String("yes") || normalized == QLatin1String("on")) {
        *ok = true;
        return true;
    }
    if (normalized == QLatin1String("false") || normalized == QLatin1String("0") || normalized == QLatin1String("no") || normalized == QLatin1String("off")) {
        *ok = true;
        return false;
    }
    *ok = false;
    return false;
}

QVariant convertArgumentValue(const ArgumentInfo &argument, QString *error)
{
    const QString signature = argument.signature;
    const QString text = argument.value.toString().trimmed();
    bool ok = false;

    if (signature.isEmpty() || signature == QLatin1String("s") || signature == QLatin1String("o") || signature == QLatin1String("g")) {
        return text;
    }

    if (signature == QLatin1String("b")) {
        const bool value = parseBoolean(text, &ok);
        if (ok) {
            return value;
        }
        *error = QString("%1 expects boolean").arg(argument.name);
        return QVariant();
    }

    if (signature == QLatin1String("y") || signature == QLatin1String("n") || signature == QLatin1String("q") ||
        signature == QLatin1String("i") || signature == QLatin1String("h")) {
        const int value = text.toInt(&ok);
        if (ok) {
            return value;
        }
        *error = QString("%1 expects integer").arg(argument.name);
        return QVariant();
    }

    if (signature == QLatin1String("u") || signature == QLatin1String("t")) {
        const uint value = text.toUInt(&ok);
        if (ok) {
            return value;
        }
        *error = QString("%1 expects unsigned integer").arg(argument.name);
        return QVariant();
    }

    if (signature == QLatin1String("x")) {
        const qlonglong value = text.toLongLong(&ok);
        if (ok) {
            return value;
        }
        *error = QString("%1 expects 64-bit integer").arg(argument.name);
        return QVariant();
    }

    if (signature == QLatin1String("d")) {
        const double value = text.toDouble(&ok);
        if (ok) {
            return value;
        }
        *error = QString("%1 expects number").arg(argument.name);
        return QVariant();
    }

    return text;
}

int signatureTokenLength(const QString &signature, int start)
{
    if (start >= signature.size()) {
        return 0;
    }

    const QChar token = signature.at(start);
    if (token == QLatin1Char('a')) {
        const int childLength = signatureTokenLength(signature, start + 1);
        return childLength > 0 ? 1 + childLength : 1;
    }

    if (token == QLatin1Char('(')) {
        int depth = 1;
        for (int i = start + 1; i < signature.size(); ++i) {
            const QChar current = signature.at(i);
            if (current == QLatin1Char('(')) {
                ++depth;
            } else if (current == QLatin1Char(')')) {
                --depth;
                if (depth == 0) {
                    return i - start + 1;
                }
            }
        }
        return signature.size() - start;
    }

    if (token == QLatin1Char('{')) {
        int depth = 1;
        for (int i = start + 1; i < signature.size(); ++i) {
            const QChar current = signature.at(i);
            if (current == QLatin1Char('{')) {
                ++depth;
            } else if (current == QLatin1Char('}')) {
                --depth;
                if (depth == 0) {
                    return i - start + 1;
                }
            }
        }
        return signature.size() - start;
    }

    return 1;
}
}

ArgumentModel::ArgumentModel(QObject *parent)
    : QAbstractListModel(parent)
{
}

int ArgumentModel::rowCount(const QModelIndex &parent) const
{
    if (parent.isValid())
        return 0;
    return m_arguments.count();
}

QVariant ArgumentModel::data(const QModelIndex &index, int role) const
{
    if (!index.isValid() || index.row() >= m_arguments.count())
        return QVariant();

    const ArgumentInfo &arg = m_arguments.at(index.row());

    switch (role) {
    case NameRole:
        return arg.name;
    case SignatureRole:
        return arg.signature;
    case TypeRole:
        return arg.type;
    case ValueRole:
        return arg.value;
    default:
        return QVariant();
    }
}

QHash<int, QByteArray> ArgumentModel::roleNames() const
{
    QHash<int, QByteArray> roles;
    roles[NameRole] = "name";
    roles[SignatureRole] = "signature";
    roles[TypeRole] = "type";
    roles[ValueRole] = "value";
    return roles;
}

void ArgumentModel::setArguments(const QList<ArgumentInfo> &arguments)
{
    beginResetModel();
    m_arguments = arguments;
    endResetModel();
}

void ArgumentModel::setArgumentsFromSignature(const QString &signature)
{
    QList<ArgumentInfo> arguments;
    int argumentIndex = 1;

    for (int i = 0; i < signature.size();) {
        const int tokenLength = signatureTokenLength(signature, i);
        if (tokenLength <= 0) {
            break;
        }

        const QString token = signature.mid(i, tokenLength);
        arguments.append(makeArgumentInfo(QString("arg%1").arg(argumentIndex++), token));
        i += tokenLength;
    }

    setArguments(arguments);
}

void ArgumentModel::setArgumentValue(int index, const QVariant &value)
{
    if (index < 0 || index >= m_arguments.count())
        return;

    m_arguments[index].value = value;
    emit dataChanged(createIndex(index, 0), createIndex(index, 0), {ValueRole});
}

QVariantList ArgumentModel::getArgumentValues()
{
    m_lastError.clear();

    QVariantList values;
    for (const ArgumentInfo &arg : m_arguments) {
        QString error;
        const QVariant converted = convertArgumentValue(arg, &error);
        if (!error.isEmpty()) {
            m_lastError = error;
            return {};
        }
        values.append(converted);
    }
    return values;
}

QString ArgumentModel::lastError() const
{
    return m_lastError;
}

void ArgumentModel::clear()
{
    beginResetModel();
    m_arguments.clear();
    m_lastError.clear();
    endResetModel();
}
