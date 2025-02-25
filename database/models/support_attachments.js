import bcrypt from "bcrypt";
import { saltRounds } from "../../config/keys";

module.exports = (sequelize, DataTypes) => {
    const support_attachments = sequelize.define(
        "support_attachments",
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
            file: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            file_type: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            chat_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                comment: "if chat_id save then files related to chat"
            },
            deleted_at: {
                type: DataTypes.INTEGER,
                allowNull: true,
            }
        },
        { timeStamps: true }
    )
    return support_attachments
}