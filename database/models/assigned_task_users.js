module.exports = (sequelize, DataTypes) => {
    const assigned_task_users = sequelize.define('assigned_task_users', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true
        },
        project_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        task_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: "if task_id null then user_id assigned to projects"
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: "Project Created By"
        }, 
        deleted_at: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    },{ 
        timeStamps: true
    });
    return assigned_task_users
}