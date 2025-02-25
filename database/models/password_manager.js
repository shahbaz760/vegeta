module.exports = (sequelize, DataTypes) => {
    const password_managers = sequelize.define(
      "password_managers",
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
          },
        site_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        user_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        password: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        deleted_at: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
      },
      { timeStamps: true }
    );
    return password_managers;
  };
  