module.exports = (sequelize,DataTypes) =>{
    const agent_attachments = sequelize.define('agent_attachments',{
      id:{
        type:DataTypes.INTEGER,
        autoIncrement:true,
        allowNull:false,
        primaryKey:true
      },
      agent_id:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      file:{
        type:DataTypes.STRING(255),
        allowNull:true,
      },
      added_by:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      deleted_at: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },{timeStamps:true})
    return agent_attachments
   }
   