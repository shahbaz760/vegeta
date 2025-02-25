module.exports = (sequelize,DataTypes) =>{
    const keyword_notification_emails = sequelize.define('keyword_notification_emails',{
      id:{
        type:DataTypes.INTEGER,
        autoIncrement:true,
        allowNull:false,
        primaryKey:true
      },
      added_by:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      email:{
        type:DataTypes.TEXT,
        allowNull:true,
      },
      deleted_at: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },{timeStamps:true})
    return keyword_notification_emails
   }
   