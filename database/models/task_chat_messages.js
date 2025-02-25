module.exports = (sequelize, DataTypes) => {
    const task_chat_messages = sequelize.define(
        "task_chat_messages",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                allowNull: true,
                primaryKey: true,
            },
            task_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            user_id: {
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
    return task_chat_messages
}