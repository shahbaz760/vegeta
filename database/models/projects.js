module.exports = (sequelize,DataTypes) =>{
    const projects = sequelize.define('projects',{
      id:{
        type:DataTypes.INTEGER,
        autoIncrement:true,
        allowNull:false,
        primaryKey:true
      },
      added_by: {
        type:DataTypes.INTEGER,
        allowNull:true,
        comment: "If User create then user_id save if client then client_id"
      },
      type:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0-> Client, 1-> User"
      },
      user_id:{
        type:DataTypes.INTEGER,
        allowNull:true,
        comment: "Always save client_id. If user create then user belong to his client_id save"
      },
      name:{
        type:DataTypes.STRING(255),
        allowNull:true,
      },
      is_private: {
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue:0,
        comment: "0-> Public, 1-> Private"
      },
      sort_order: {
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      slack_channel_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      slack_configuration_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      slack_notification_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      types_of_slack_notification: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: "COLUMN_CREATED: 1, COLUMN_UPDATED: 2, COLUMN_DELETE: 3, TASK_CREATED: 4, TASK_DELETE: 5"
      },
      updated_by: {
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      deleted_at: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },{timeStamps:true})
    return projects
   }
   