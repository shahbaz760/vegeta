import bcrypt from "bcrypt";
import { saltRounds } from "../../config/keys";

module.exports = (sequelize, DataTypes) => {
    const task_files = sequelize.define(
        "task_files",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                allowNull: true,
                primaryKey: true,
            },
            task_id: {
                type: DataTypes.INTEGER,
            }, // Project Created By
            project_id: {
                type: DataTypes.INTEGER,
            },
            file: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            added_by: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            chat_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: null,
                comment: "null-> Tasks, if id-> chat_id"
            },
            file_type: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            deleted_at: {
                type: DataTypes.INTEGER,
                allowNull: true,
            }
        },
        { timeStamps: true }
    )
    return task_files
}