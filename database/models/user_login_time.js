module.exports = (sequelize,DataTypes) =>{
 const user_login_time = sequelize.define('user_login_times',{
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
    login_time:{
      type:DataTypes.INTEGER,
      allowNull:true
    },
    fcm_token:{
      type:DataTypes.STRING(255),
      allowNull:true
    },
    device_id:{
      type:DataTypes.STRING(255),
      allowNull:true
    },
    device_type:{
      type:DataTypes.INTEGER,
      allowNull:true,
      defaultValue: 0,
      comment: "0=web, 1=IOS, 2=Android"
    }
 },{timeStamps:true})
 return user_login_time;
}
