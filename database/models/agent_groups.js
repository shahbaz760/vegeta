module.exports = (sequelize,DataTypes) =>{
    const agent_group = sequelize.define('agent_groups',{
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
      group_name:{
        type:DataTypes.STRING(255),
        allowNull:true,
      },
      deleted_at: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },{timeStamps:true})
    return agent_group
   }
   