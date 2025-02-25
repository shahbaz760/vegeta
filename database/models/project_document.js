import bcrypt from "bcrypt";
import { saltRounds } from "../../config/keys";

module.exports = (sequelize, DataTypes) => {
    const project_document = sequelize.define(
        "project_document",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                allowNull: true,
                primaryKey: true,
            },
            project_menu_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            project_id: {
                type: DataTypes.INTEGER,
            },
            user_id: {
                type: DataTypes.INTEGER,
            },
            name: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            doc_file: {
                type: DataTypes.TEXT("long"),
                allowNull: true,
            },
            sort_order: {
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
    return project_document
}