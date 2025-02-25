import bcrypt from "bcrypt";
import { saltRounds } from "../../config/keys";

module.exports = (sequelize, DataTypes) => {
    const project_whiteBoard = sequelize.define(
        "project_whiteboard",
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
                allowNull: true,
            },
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            name: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            xml_data: {
                type: DataTypes.TEXT("long"),
                allowNull: true,
            },
            xml_img: {
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
    return project_whiteBoard
}