module.exports = (sequelize,DataTypes) =>{
    const states = sequelize.define('states',
    {
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
      country_code:{
        type:DataTypes.STRING(255),
        allowNull:true,
      },
    },
    {timeStamps:true})
    return states
   }
   