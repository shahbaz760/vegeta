module.exports = (sequelize,DataTypes) =>{
    const agent_group_member = sequelize.define('agent_group_members',{
      id:{
        type:DataTypes.INTEGER,
        autoIncrement:true,
        allowNull:false,
        primaryKey:true
      },
      agent_group_id:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      user_id:{
         type:DataTypes.INTEGER,
         allowNull:true,
      },
      deleted_at: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },{timeStamps:true})
    return agent_group_member
   }
   