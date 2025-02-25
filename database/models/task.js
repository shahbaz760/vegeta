import bcrypt from "bcrypt";
import { saltRounds } from "../../config/keys";

module.exports = (sequelize, DataTypes) => {
    const tasks = sequelize.define(
        "tasks",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                allowNull: true,
                primaryKey: true,
            },
            added_by:{
                type: DataTypes.INTEGER,
                allowNull: true,
                comment: "Task Created By"
            },
            type:{
                type:DataTypes.INTEGER,
                allowNull:true,
                defaultValue: 0,
                comment: "0-> Client, 1-> User, 2=> Agent"
            },
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                comment: "Always save client id"
            }, 
            parent_task_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                comment: "if add sub task then add task_id in a parent_task_id param",
            },
            project_id: {
                type: DataTypes.INTEGER,
            },
            project_column_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            title: {
                type: DataTypes.TEXT('long'),
                allowNull: true
            },
            description: {
                type: DataTypes.TEXT('long'),
                allowNull: true
            },
            voice_record_file: {
                type: DataTypes.STRING(255),
            },
            screen_record_file: {
                type: DataTypes.STRING(255),
                allowNull: true
            },
            priority: {
                type: DataTypes.STRING(20),
                allowNull: true
            },
            labels: {
                type: DataTypes.STRING(255),
                allowNull: true
            },
            status: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            sort_order: {
                type: DataTypes.INTEGER,
                allowNull: true,
            }, 
            due_date_time: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            business_due_date: {
                type: DataTypes.STRING(50),
                allowNull: true
            },
            reminders:{
                type: DataTypes.DATE,
                allowNull: true,
            },
            outlookEventId:{
                type: DataTypes.TEXT(),
                allowNull: true,
            },
            googleCalenderEventId:{
                type: DataTypes.TEXT(),
                allowNull: true,
            },
            updated_by:{
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            deleted_at: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            guid:{
                type: DataTypes.STRING(255),
                allowNull: true,
                comment: "group id for commetChat"
            }
        },
        { 
        timeStamps: true,
        }
    );


    return tasks
}