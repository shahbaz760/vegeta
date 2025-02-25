module.exports = (sequelize,DataTypes) =>{
    const assigned_users = sequelize.define('assigned_users',{
      id:{
        type:DataTypes.INTEGER,
        autoIncrement:true,
        allowNull:false,
        primaryKey:true
      },
      user_id:{
        type:DataTypes.INTEGER,
        allowNull:true,
        comment: "In user_id saved client id"
      },
      agent_id:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      account_manager_id : {
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      type : {
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "1=> Assign, Agents to Client, 2=> Assign Account Manager to client, 3=> Assign Clients to Account manager"
      },
      is_default : {
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0=> Not default, 1=> Mark as default"
      },
      assigned_date: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      deleted_at: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },{timeStamps:true})
    return assigned_users
   }
   