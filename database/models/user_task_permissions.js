module.exports = (sequelize,DataTypes) =>{
    const user_task_permissions = sequelize.define('user_task_permissions',{
      id:{
        type:DataTypes.INTEGER,
        autoIncrement:true,
        allowNull:false,
        primaryKey:true
      },
      client_id: {
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      user_id:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      is_toggle:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0=> Off, 1=> On"
      },
      deleted_at: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },{timeStamps:true})
    return user_task_permissions
   }
   