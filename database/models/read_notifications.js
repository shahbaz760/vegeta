module.exports = (sequelize,DataTypes) =>{
    const read_notifications = sequelize.define('read_notifications',
    {
      id:{
        type:DataTypes.INTEGER,
        autoIncrement:true,
        allowNull:false,
        primaryKey:true
      },
      notification_id:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      user_id:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      notification_type:{
        type:DataTypes.INTEGER,
        allowNull:true,
        comment: "0-> Project Created, 1-> Task Created, 2-> Task Updated, 3=> Task Movement, 4-> Task Delete, 5-> Project Delete, 6-> Password Manager assign, 7-> Shared file create",
      },
      is_read:{
        type:DataTypes.INTEGER,
        allowNull:true,
        comment: "0-> unread, 1-> read",
        defaultValue: 1
      },
      deleted_at:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
    },
    {timeStamps:true})
    return read_notifications
   }
   