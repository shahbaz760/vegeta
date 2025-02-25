module.exports = (sequelize,DataTypes) =>{
    const global_settings = sequelize.define('global_settings',{
      id:{
        type:DataTypes.INTEGER,
        autoIncrement:true,
        allowNull:false,
        primaryKey:true
      },
      user_role: {
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultvalue: 0,
        comment: "2=Client, 3= Agent,  4= Account Manager, 5= User  // admin not include"
      },
      is_authenticate:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultvalue: 0,
        comment: "0=No, 1= Yes"
      },
      deleted_at: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },{timeStamps:true})
    return global_settings
   }
   