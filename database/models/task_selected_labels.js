module.exports = (sequelize,DataTypes) =>{
    const task_selected_labels = sequelize.define('task_selected_labels',
    {
      id:{
        type:DataTypes.INTEGER,
        autoIncrement:true,
        allowNull:false,
        primaryKey:true
      },
      project_id:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      task_id:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      label_id:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      deleted_at:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
    },
    {timeStamps:true})
    return task_selected_labels
   }
   