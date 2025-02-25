module.exports = (sequelize,DataTypes) =>{
    const keywords = sequelize.define('keywords',{
      id:{
        type:DataTypes.INTEGER,
        autoIncrement:true,
        allowNull:false,
        primaryKey:true
      },
      key_name:{
        type:DataTypes.TEXT,
        allowNull:true,
      },
      deleted_at: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },{timeStamps:true})
    return keywords
   }
   