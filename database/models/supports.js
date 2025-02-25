module.exports = (sequelize, DataTypes) => {
    const supports = sequelize.define(
        "supports",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                allowNull: true,
                primaryKey: true,
            },
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            department_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            subject: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            message: {
                type: DataTypes.TEXT("long"),
                allowNull: true,
            },
            status: {
                type: DataTypes.STRING(50),
                allowNull: true,
                comment: "Pending, In Progress, In Review, Completed, Re Opened, Closed"
            },
            priority: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            updated_by: {
                type: DataTypes.INTEGER,
                allowNull: true,
                comment: "User id of those user have updated the anything in support"
            },
            is_close: {
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 0
            },
            deleted_at: {
                type: DataTypes.INTEGER,
                allowNull: true,
            }
        },
        { timeStamps: true }
    )
    return supports
}