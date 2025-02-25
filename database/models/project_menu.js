import bcrypt from "bcrypt";
import { saltRounds } from "../../config/keys";

module.exports = (sequelize, DataTypes) => {
    const project_menu = sequelize.define(
        "project_menu",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                allowNull: true,
                primaryKey: true,
            },
            uuid: {
                type: DataTypes.STRING(255),
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
            menu: {
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 0,
                comment: "0=> Kanban Board, 1=> Task Table, 2=> Task List, 3=> Calendar,4=> Whiteboard, 5=> Document,  6=> Chat"
            },
            is_disable: {
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 0,
                comment: "0=> disable, 1=> enable"
            },
            is_default: {
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 0,
                comment: "0=> Not, 1=> Default"
            },
            pin: {
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 0,
                comment: "0=> not, 1=> pinned"
            },
            sort_order: {
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            deleted_at: {
                type: DataTypes.INTEGER,
                allowNull: true,
            }
        },
        { timeStamps: true }
    )
    return project_menu
}