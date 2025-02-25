module.exports = (sequelize,DataTypes) =>{
    const client_subscriptions = sequelize.define('client_subscriptions',{
      id:{
        type:DataTypes.INTEGER,
        autoIncrement:true,
        allowNull:false,
        primaryKey:true
      },
      client_id:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      stripe_subscription_id:{
        type:DataTypes.STRING(255),
        allowNull:true,
      },
      title:{
        type:DataTypes.STRING(100),
        allowNull:true,
      },
      description:{
        type:DataTypes.TEXT('long'),
        allowNull:true,
      },
      total_price:{
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
      status:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0=> Pending (Sent Link), 1=> Active, 2=> Pause, 3=> Expire, 4=> cancelled, 5=> Overdue, 6=> Suspend"
      },
      transaction_id:{
        type:DataTypes.STRING(255),
        allowNull:true,
        comment: "check out session id"
      },
      bank_transaction_id:{
        type:DataTypes.STRING(255),
        allowNull:true,
        comment: "check out session id"
      },
      one_time_discount_name:{
        type:DataTypes.STRING(100),
        allowNull:true,
      },
      one_time_discount_type:{
        type:DataTypes.INTEGER,
        allowNull:true,
        comment: "1=> Percentage, 2=> Flat"
      },
      one_time_discount:{
        type:DataTypes.DOUBLE(10,2),
        allowNull:true,
      },
      stripe_discount_id: {
        type:DataTypes.STRING(255),
        allowNull:true,
      },
      subtotal:{
        type:DataTypes.DOUBLE(10,2),
        allowNull:true,
      },
      subscription_link: {
        type:DataTypes.TEXT,
        allowNull:true,
      },
      bank_payment_link: {
        type:DataTypes.TEXT,
        allowNull:true,
      },
      link_sent_time: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      docusign_link: {
        type:DataTypes.TEXT,
        allowNull:true,
      },
      is_signed_docusign: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: "0=> No, 1=> Yes"
      },
      card:{
        type:DataTypes.STRING(50),
        allowNull:true,
      },
      card_last_digit:{
        type:DataTypes.STRING(10),
        allowNull:true,
      },
      is_renew_count: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: "0=> 1st time Create"
      },
      cancel_at: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      cancelled_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      resume_date_time:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      docusign_link_click: {
        type:DataTypes.INTEGER,
        allowNull:true,
        comment: "0-> As Client, 1-> Login as Client"
      },
      overdue_at: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      suspend_at: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
    return client_subscriptions
   }
   