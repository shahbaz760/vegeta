const { defaultValueSchemable } = require("sequelize/lib/utils");

module.exports = (sequelize,DataTypes) =>{
 const cards = sequelize.define('cards',{
    id:{
      type:DataTypes.INTEGER,
      autoIncrement:true,
      allowNull:false,
      primaryKey:true
    },
    name:{
      type:DataTypes.STRING(255),
      allowNull:true
    },
    account_holder_name:{
      type:DataTypes.STRING(255),
      allowNull:true
    },
    user_id:{
      type:DataTypes.INTEGER,
      allowNull:true,
    },
    subscription_id:{
      type:DataTypes.INTEGER,
      allowNull:true,
    },
    type:{
      type:DataTypes.INTEGER,
      allowNull:true,
      defaultValue: 0,
      comment: "0=> card, 1=> bank"
    },
    payment_method_id:{
      type:DataTypes.STRING(255),
      allowNull:true
    },
    is_default:{
      type:DataTypes.INTEGER,
      allowNull:true,
      defaultValue: 0,
      comment: "0=> No, 1=> Yes"
    },
    global_default:{
      type:DataTypes.INTEGER,
      allowNull:true,
      defaultValue: 0,
      comment: "0=> No, 1=> Yes"
    },
    last_digit:{
      type:DataTypes.STRING(10),
      allowNull:true,
    },
    expiry_date:{
      type:DataTypes.BIGINT,
      allowNull:true,
    },
    deleted_at:{
      type:DataTypes.INTEGER,
      allowNull:true,
    }
 },{timeStamps:true})
 return cards;
}
