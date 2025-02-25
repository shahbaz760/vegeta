module.exports = (sequelize, DataTypes) => {
  const project_columns = sequelize.define(
    "project_columns",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      project_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      sort_order: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      is_defalut: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: "0=> Added by client, 1=> By default"
      },
      defalut_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: "Actual Name is edited, but default can't be updated. If column is_deafult = 1"
      },
      added_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      deleted_at: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    { timeStamps: true }
  );
  return project_columns;
};
