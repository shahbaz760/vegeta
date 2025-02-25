module.exports = (sequelize,DataTypes) =>{
    const roles_and_permissions = sequelize.define('roles_and_permissions',{
      id:{
        type:DataTypes.INTEGER,
        autoIncrement:true,
        allowNull:false,
        primaryKey:true
      },
      added_by:{
        type:DataTypes.INTEGER,
        allowNull:true,
        comment: "If type 0-> Then added by Admin, type 1-> added by client"
      },
      name:{
        type:DataTypes.STRING(255),
        allowNull:true,
      },
      description:{
        type:DataTypes.TEXT('long'),
        allowNull:true,
      },
      type: {
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> For Admin Users, 1-> For Users"
      },
      is_client_access:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> No, 1-> Yes"
      },
      client_view:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> All, 1-> Assigned Only"
      },
      client_edit:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> All, 1-> Assigned Only, 2-> None"
      },
      client_delete:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> All, 1-> Assigned Only, 2-> None"
      },
      client_subscriptions:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> No, 1-> Yes"
      },
      client_as_login:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> No, 1-> Yes"
      },
      client_account_manager:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> No, 1-> Yes"
      },
      client_assigned_agent:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> No, 1-> Yes"
      },
      client_hide_info:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> No, 1-> Yes"
      },
      is_agent_access:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> No, 1-> Yes"
      },
      agent_view:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> All, 1-> Assigned Only"
      },
      agent_edit:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> All, 1-> Assigned Only, 2-> None"
      },
      agent_delete:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> All, 1-> Assigned Only, 2-> None"
      },
      agent_hide_info:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> No, 1-> Yes"
      },
      is_report_access:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> No, 1-> Yes"
      },
      report_financial:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> No, 1-> Yes"
      },
      report_churn:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> No, 1-> Yes"
      },
      report_retantion:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> No, 1-> Yes"
      },
      report_customer:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> No, 1-> Yes"
      },
      report_growth:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> No, 1-> Yes"
      },
      report_mmr:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> No, 1-> Yes"
      },
      is_manage_products:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> No, 1-> Yes"
      },
      is_chat:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> No, 1-> Yes"
      },
      chat:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> All, 1-> Assigned Only"
      },
      is_keywords:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> No, 1-> Yes"
      },
      is_settings:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> No, 1-> Yes"
      },
      is_supports:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> No, 1-> Yes"
      },
      support_access:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> All, 1-> Assigned Only"
      },
      support_department:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> No, 1-> Yes"
      },
      is_admin_users:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> No, 1-> Yes"
      },
      admin_view:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> No, 1-> Yes"
      },
      admin_edit:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> No, 1-> Yes"
      },
      admin_delete:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> No, 1-> Yes"
      },
      admin_hide_info:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> No, 1-> Yes"
      },
      is_agent_group_access:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> No, 1-> Yes"
      },
      agent_group_view:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> All, 1-> Assigned Only"
      },
      agent_group_edit:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> All, 1-> Assigned Only, 2-> None"
      },
      agent_group_delete:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> All, 1-> Assigned Only, 2-> None"
      },
      is_project_access:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> All, 1-> Assigned Only"
      },
      is_shared_files:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> No, 1-> Yes"
      },
      is_password_manager:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> No, 1-> Yes"
      },
      is_users_access:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> No, 1-> Yes"
      },
      is_billing_access:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> No, 1-> Yes"
      },
      deleted_at: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },{timeStamps:true})
    return roles_and_permissions
   }
   