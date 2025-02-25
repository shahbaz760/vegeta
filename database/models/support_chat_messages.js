module.exports = (sequelize, DataTypes) => {
    const support_chat_messages = sequelize.define(
        "support_chat_messages",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                allowNull: true,
                primaryKey: true,
            },
            support_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            sender_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            receiver_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            message: {
                type: DataTypes.TEXT("long"),
                allowNull: true,
            },
            deleted_at: {
                type: DataTypes.INTEGER,
                allowNull: true,
            }
        },
        { timeStamps: true }
    )
    return support_chat_messages
}