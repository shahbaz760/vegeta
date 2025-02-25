module.exports = (sequelize,DataTypes) =>{
    const subscription_settings = sequelize.define('subscription_settings',{
      id:{
        type:DataTypes.INTEGER,
        autoIncrement:true,
        allowNull:false,
        primaryKey:true
      },
      overdue_period_days: {
        type:DataTypes.STRING(50),
        allowNull:true,
      },
      suspend_period_days: {
        type:DataTypes.STRING(50),
        allowNull:true,
      },
      automatic_reminder_email_days: {
        type:DataTypes.STRING(50),
        allowNull:true,
      },
      overdue_reminder_email_days: {
        type:DataTypes.STRING(50),
        allowNull:true,
      },
      card_expiry_reminder_email_days: {
        type:DataTypes.STRING(50),
        allowNull:true,
      },
      payment_retry_overdue_status_days: {
        type:DataTypes.STRING(50),
        allowNull:true,
      },
      payment_retry_suspended_status_days: {
        type:DataTypes.STRING(50),
        allowNull:true,
      },
      global_processing_fee_description: {
        type:DataTypes.STRING(50),
        allowNull:true,
      },
      global_processing_fee: {
        type:DataTypes.STRING(50),
        allowNull:true,
      },
      tax_rate_id: {
        type:DataTypes.STRING(255),
        allowNull:true,
      },
      deleted_at: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },{timeStamps:true})
    return subscription_settings
   }
   