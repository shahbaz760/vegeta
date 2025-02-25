module.exports = (sequelize,DataTypes) =>{
    const client_subscription_histories = sequelize.define('client_subscription_histories',{
      id:{
        type:DataTypes.INTEGER,
        autoIncrement:true,
        allowNull:false,
        primaryKey:true
      },
      subscription_id:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      type: {
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 1,
        comment: "1-> ON_PURCHASE, 2-> ON_RENEW, 3-> ON_DECLINE, 4-> ON_RENEW_MAIL, 5-> STATUS_CHANGE_CANCEL, 6-> STATUS_CHANGE_PAUSE, 7-> STATUS_CHANGE_EXPIRE, 8-> ON_UPDATE"
      },
      client_id:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      description:{
        type:DataTypes.TEXT,
        allowNull:true,
      },
      price:{
        type:DataTypes.DOUBLE(10,2),
        allowNull:true,
      },
      start_date:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      billing_frequency:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "1=> one time, 2=> monthly , 3=> quaterly, 4=> semi annually, 5=> annually, 6=> every 1 week, 7=> every 4 weeks"
      },
      invoice:{
        type:DataTypes.TEXT,
        allowNull:true,
      },
      billing_terms:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "1=> Fixed number of payments, 2=> Automatically renew until cancelled"
      },
      no_of_payments:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
      },
      global_processing_fee:{
        type:DataTypes.DOUBLE(10,2),
        allowNull:true,
      },
      global_processing_fee_description: {
        type:DataTypes.STRING(50),
        allowNull:true,
      },
      tax_rate_id: {
        type:DataTypes.STRING(255),
        allowNull:true,
      },
      card:{
        type:DataTypes.STRING(50),
        allowNull:true,
      },
      card_last_digit:{
        type:DataTypes.STRING(10),
        allowNull:true,
      },
      payment_method: {
        type:DataTypes.STRING(255),
        allowNull:true,
      },
      is_manual_payment: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: "0-> No, 1-> Yes"
      },
      deleted_at: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },{timeStamps:true})
    return client_subscription_histories;
   }
   