module.exports = (sequelize,DataTypes) =>{
    const task_labels = sequelize.define('task_labels',
    {
      id:{
        type:DataTypes.INTEGER,
        autoIncrement:true,
        allowNull:false,
        primaryKey:true
      },
      user_id:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      project_id:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      label:{
        type:DataTypes.STRING(100),
        allowNull:true,
      },
      is_default:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
      },
      deleted_at:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
    },
    {timeStamps:true})
    return task_labels
   }
   