import bcrypt from "bcrypt";
import { saltRounds } from "../../config/keys";

module.exports = (sequelize, DataTypes) => {
    const shared_files = sequelize.define(
        "shared_files",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                allowNull: true,
                primaryKey: true,
            },
            client_id: {
                type: DataTypes.INTEGER,
            }, // Project Created By
            file: {
                type: DataTypes.STRING(255),
            },
            file_key: {
                type: DataTypes.STRING(255),
            },
            file_name: {
                type: DataTypes.STRING(255),
                allowNull: true,
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
    return shared_files
}