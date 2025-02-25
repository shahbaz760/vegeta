module.exports = (sequelize, DataTypes) => {
    const departments = sequelize.define(
        "departments",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                allowNull: true,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING(255)
            },
            added_by: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            deleted_at: {
                type: DataTypes.INTEGER,
                allowNull: true,
            }
        },
        { timeStamps: true }
    )
    return departments
}