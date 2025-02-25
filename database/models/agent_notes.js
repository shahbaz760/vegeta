module.exports = (sequelize,DataTypes) =>{
    const agent_notes = sequelize.define('agent_notes',{
      id:{
        type:DataTypes.INTEGER,
        autoIncrement:true,
        allowNull:false,
        primaryKey:true
      },
      added_by:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      agent_id:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      note:{
        type:DataTypes.TEXT('long'),
        allowNull:true,
      },
      deleted_at: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },{timeStamps:true})
    return agent_notes
   }
   