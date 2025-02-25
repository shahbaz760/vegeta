module.exports = (sequelize,DataTypes) =>{
    const client_subscription_history_plans = sequelize.define('client_subscription_history_plans',{
      id:{
        type:DataTypes.INTEGER,
        autoIncrement:true,
        allowNull:false,
        primaryKey:true
      },
      subscription_history_id:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      subscription_id:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      client_id:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      product_id:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      type:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0=> Global Product, 1=> Line Item"
      },
      unit_price:{
        type:DataTypes.DOUBLE(10,2),
        allowNull:true,
      },
      quantity:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      billing_frequency:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "1=> one time, 2=> monthly , 3=> quaterly, 4=> semi annually, 5=> annually, 6=> every 1 week, 7=> every 4 weeks"
      },
      unit_discount_type:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "1=> Percentage, 2=> Flat"
      },
      unit_discount:{
        type:DataTypes.DOUBLE(10,2),
        allowNull:true,
      },
      net_price:{
        type:DataTypes.DOUBLE(10,2),
        allowNull:true,
      },
      stripe_price_id:{
        type:DataTypes.STRING(100),
        allowNull:true,
      },
      deleted_at: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },{timeStamps:true})
    return client_subscription_history_plans
   }
   