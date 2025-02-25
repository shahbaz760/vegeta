module.exports = (sequelize,DataTypes) =>{
    const recent_activities = sequelize.define('recent_activities',
    {
      id:{
        type:DataTypes.INTEGER,
        autoIncrement:true,
        allowNull:false,
        primaryKey:true
      },
      client_id:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      user_id:{
        type:DataTypes.INTEGER,
        allowNull:true,
        comment: "who's moves the task (Agent id)"
      },
      type:{
        type:DataTypes.INTEGER,
        allowNull:true,
        comment: "0-> Project Created, 1-> Task Created, 2-> Task Updated, 3=> Task Movement, 4-> Task Delete, 5-> Project Delete, 6-> Password Manager assign, 7-> Shared file create",
        defaultValue: 1
      },
      project_id:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      project_column_id:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      task_id:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      parent_task_id:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      message:{
        type:DataTypes.TEXT,
        allowNull:true,
      },
      sort_order:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      is_notification:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0
      },
      password_manager_id:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      shared_file_id:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      comment_id:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      deleted_at:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
    },
    {timeStamps:true})
    return recent_activities
   }
   