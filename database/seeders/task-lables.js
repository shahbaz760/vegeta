"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.bulkDelete("task_labels", null, { truncate: true }),
      queryInterface.bulkInsert(
        "task_labels",
        [
          {
            id: 1,
            user_id: null,
            project_id: null,
            label: "Important Task",
            deleted_at: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 2,
            user_id: null,
            project_id: null,
            label: "High Priority",
            deleted_at: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 3,
            user_id: null,
            project_id: null,
            label: "Medium Priority",
            deleted_at: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 4,
            user_id: null,
            project_id: null,
            label: "Responsive",
            deleted_at: null,
            created_at: new Date(),
            updated_at: new Date(),
          }
        ],
        { truncate: true }
      ),
    ]);
  },

  down: (queryInterface) =>
    queryInterface.bulkDelete("task_labels", null, { truncate: true }),
};
