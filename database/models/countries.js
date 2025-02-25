module.exports = (sequelize, DataTypes) =>{
    const countries = sequelize.define('countries',{
      id:{
        type:DataTypes.INTEGER,
        autoIncrement:true,
        allowNull:false,
        primaryKey:true
      },
      name:{
        type:DataTypes.STRING(255),
        allowNull:true,
      },
      iso_code:{
        type:DataTypes.STRING(255),
        allowNull:true,
      },
      flag:{
        type:DataTypes.STRING(255),
        allowNull:true,
      },
      phonecode:{
        type:DataTypes.STRING(255),
        allowNull:true,
      },
      currency:{
        type:DataTypes.STRING(255),
        allowNull:true,
      },
    },
    {timeStamps:true})
    return countries
  }
   