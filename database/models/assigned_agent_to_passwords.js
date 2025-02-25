module.exports = (sequelize, DataTypes) => {
    const assigned_agent_to_passwords = sequelize.define('assigned_agent_to_passwords', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true
        },
        password_manager_id: {
            type: DataTypes.INTEGER,
        },
        client_id: {
            type: DataTypes.INTEGER,
        },
        agent_id: {
            type: DataTypes.INTEGER,
        }, // Project Created By
        deleted_at: {
            type: DataTypes.INTEGER,
        },
    },
        { timeStamps: true }
    );
    return assigned_agent_to_passwords
}