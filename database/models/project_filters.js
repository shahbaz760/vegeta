module.exports = (sequelize, DataTypes) => {
  const project_filters = sequelize.define(
    "project_filters",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING("255"),
        allowNull: true,
      },
      project_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      search: {
        type: DataTypes.STRING("255"),
        allowNull: true,
      },
      group: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      sort: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      filter: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
      },
      is_view: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: "0-> Kanban, 1-> Task Table, 2-> Task List, 3-> Calendar"
      },
      is_filter: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: "0-> Sort and Group, 1-> Only filter and its multiple saved",
        defaultValue: 1,
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
  return project_filters;
};
