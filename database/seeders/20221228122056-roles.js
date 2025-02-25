"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.bulkDelete("roles", null, { truncate: true }),
      queryInterface.bulkInsert(
        "roles",
        [
          {
            id: 1,
            name: "Admin",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 2,
            name: "Client",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 3,
            name: "Agent",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 4,
            name: "Account Manager",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 5,
            name: "User",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 6,
            name: "Developer",
            parent_role_id: 5,
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 7,
            name: "Tester",
            parent_role_id: 5,
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 8,
            name: "Designer",
            parent_role_id: 5,
            created_at: new Date(),
            updated_at: new Date(),
          }
        ],
        { truncate: true }
      ),
    ]);
  },

  down: (queryInterface) =>
    queryInterface.bulkDelete("roles", null, { truncate: true }),
};
