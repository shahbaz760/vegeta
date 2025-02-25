module.exports = (sequelize,DataTypes) =>{
    const line_items = sequelize.define('line_items',{
      id:{
        type:DataTypes.INTEGER,
        autoIncrement:true,
        allowNull:false,
        primaryKey:true
      },
      user_id:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      name:{
        type:DataTypes.STRING(255),
        allowNull:true,
      },
      description:{
        type:DataTypes.TEXT,
        allowNull:true,
      },
      unit_price:{
        type:DataTypes.DOUBLE(10,2),
        allowNull:true,
      },
      type:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0=> Global Product, 1=> Line Item"
      },
      quantity:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 1,
      },
      billing_frequency:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "1=> one time, 2=> monthly , 3=> quaterly, 4=> semi annually, 5=> annually"
      },
      billing_terms:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 2,
        comment: "1=> Fixed number of payments, 2=> Automatically renew until cancelled"
      },
      no_of_payments:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
      },
      is_delay_in_billing:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue: 0,
        comment: "0=> No, 1=> Yes"
      },
      billing_start_date:{
        type:DataTypes.INTEGER,
        allowNull:true,
      },
      stripe_price_id:{
        type:DataTypes.STRING(255),
        allowNull:true,
      },
      is_private: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
      },
      deleted_at: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },{timeStamps:true})
    return line_items
   }
   