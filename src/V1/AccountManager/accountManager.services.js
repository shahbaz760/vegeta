import sequelize from 'sequelize';
const Op = sequelize.Op;
import { PAGINATION, RESPONSE_CODES, ROLES, ASSIGNED_USERS } from '../../../config/constants';
import path from "path";
import fs from "fs";
import { successResponse, errorResponse } from "../../../config/responseHelper";

export default class AccountManager {
  async init(db) {
    this.Models = db.models;
  }
  // get User by Email
  getAccountManagerByMail = async (email) => {
    return await this.Models.Users.findOne({
      where: {
        email: email,
        // role_id: ROLES.ACCOUNTMANAGER
      },
      raw: true
    })
  }

  // create Account Manager
  createAccountManager = async (body) => {
    return await this.Models.Users.create(body)
  }

  //get Account Manager List
  getAccountManagersList = async (body) => {
    let havingCondition = {
      deleted_at: null,
      role_id: ROLES.ACCOUNTMANAGER
    };

    let countCondition = {
      deleted_at: null,
      role_id: ROLES.ACCOUNTMANAGER
    }

    // search Account Manager by First Or Last name
    if (body.search) {
      havingCondition = {
        [Op.or]: [
          { userName: { [Op.like]: `%${body.search}%` } }
        ],
        deleted_at: null,
        role_id: ROLES.ACCOUNTMANAGER
      }
    }

    if(body.role_id == ROLES.ACCOUNTMANAGER) {
      havingCondition.id = {
        [Op.ne]: body.user_id
      }
      countCondition.id = {
        [Op.ne]: body.user_id
      }
    }

    let attributes = ["id", "role_id", "first_name", "last_name", "email", "country_code", "phone_number", "address", "user_image", "company_name", "deleted_at", "role_permission_id", "created_at", "updated_at", [sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = users.id)"), "userName"], [
      sequelize.literal(
        `(SELECT Count(*) FROM assigned_users WHERE assigned_users.user_id = users.id AND deleted_at IS NULL AND type = 2)`
      ),
      "assigned_clients_count",
    ], [sequelize.literal(`
    CASE
      WHEN status = 0 THEN 'Pending'
      WHEN status = 1 THEN 'Active'
      WHEN status = 2 THEN 'Inactive'
      ELSE 'Inactive'
    END
  `), 'status'],[sequelize.literal("(SELECT name FROM roles_and_permissions WHERE roles_and_permissions.id = users.role_permission_id AND roles_and_permissions.deleted_at IS NULL limit 1)"), "role_permission_name"]];

    if (body.client_id && body.client_id != 0) {

      attributes = ["id", "role_id", "first_name", "last_name", "email", "country_code", "phone_number", "address", "user_image", "company_name", "deleted_at", "created_at", "updated_at", [sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = users.id)"), "userName"], [
        sequelize.literal(`
            CASE
                WHEN (SELECT COUNT(*) FROM assigned_users WHERE assigned_users.account_manager_id = users.id AND deleted_at IS NULL AND user_id = ${body.client_id} AND type = 2) > 0
                THEN 1
                ELSE 0
            END
        `),
        "is_assigned",
      ], [sequelize.literal(`
    CASE
      WHEN status = 0 THEN 'Pending'
      WHEN status = 1 THEN 'Active'
      WHEN status = 2 THEN 'Inactive'
      ELSE 'Inactive'
    END
  `), 'status']];
      havingCondition.is_assigned = 0;
    }

    //Count of all Account Manager
    const allAccountMangersCount = await this.Models.Users.findAll({
      attributes: attributes,
      having: havingCondition
    })

    //Count of all Account Manager without search
    const allAccountMangerCountWithoutSearch = await this.Models.Users.count({
      where: countCondition
    })

    //All Account Manager by Search with Pagination
    const allAccountMangers = await this.Models.Users.findAll({
      attributes: attributes,
      include: [
        {
          model: this.Models.AssignedUsers,
          attributes: ["id", "user_id", "type", "assigned_date", "deleted_at", [sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = user_id)"), "userName"], [sequelize.literal("(SELECT company_name FROM users WHERE users.id = user_id)"), "company_name"]],
          as: "assigned_clients",
          where: { deleted_at: null },
          required: false,
        },
      ],
      having: havingCondition,
      order: [
        ['id', 'DESC'],
      ],
      offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
      limit: (body.limit == -1) ? allAccountMangersCount.length : parseInt(body.limit) || PAGINATION.LIMIT,
    });

    return { list: allAccountMangers, total_records: allAccountMangersCount.length, total_count: allAccountMangerCountWithoutSearch, filtered_records: allAccountMangers.length }
  }

  // Remove Account Manager's
  removeAccountManager = async (data, Ids) => {
    await this.Models.Users.update(data, {
      where: {
        id: Ids,
        role_id: ROLES.ACCOUNTMANAGER
      }
    })
  }

  // get user by id
  getUserById = async (Id) => {
    //get Account Manager Profile Details
    const accountManagerDetail = await this.Models.Users.findOne({
      attributes: ["id", "role_id", "first_name", "last_name", "email", "country_code", "phone_number", "address", "address2", "country", "state", "city", "zipcode", "user_image", "company_name", "role_permission_id", "created_at", "updated_at", [
        sequelize.literal(
          `(SELECT Count(*) FROM assigned_users WHERE assigned_users.user_id = users.id AND deleted_at IS NULL AND type = 3)`
        ),
        "assigned_clients_count",
      ], [sequelize.literal(`
      CASE
        WHEN status = 0 THEN 'Pending'
        WHEN status = 1 THEN 'Active'
        WHEN status = 2 THEN 'Inactive'
        ELSE 'Inactive'
      END
    `), 'status']],
      include: [
        {
          model: this.Models.AssignedUsers,
          attributes: ["id", "user_id", "type", "assigned_date", "deleted_at", [sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = user_id)"), "userName"], [sequelize.literal("(SELECT company_name FROM users WHERE users.id = user_id)"), "company_name"]],
          as: "assigned_clients",
          where: { deleted_at: null },
          required: false,
        },
      ],
      where: {
        id: Id,
        role_id: ROLES.ACCOUNTMANAGER
      },
    })
    return accountManagerDetail;
  }


  getAccountmanagerById = async (Id) => {
    //get Account Manager Profile Details
    const accountManagerDetail = await this.Models.Users.findOne({
      attributes: ["id", "role_id", "first_name", "last_name", "email", "country_code", "phone_number", "address", "address2", "country", "state", "social_id", "city", "zipcode", "user_image", "company_name", "two_factor_authentication", "role_permission_id", "created_at", "updated_at", [
        sequelize.literal(
          `(SELECT Count(*) FROM assigned_users WHERE assigned_users.user_id = users.id AND deleted_at IS NULL AND type = 3)`
        ),
        "assigned_clients_count",
      ], [sequelize.literal(`
      CASE
        WHEN status = 0 THEN 'Pending'
        WHEN status = 1 THEN 'Active'
        WHEN status = 2 THEN 'Inactive'
        ELSE 'Inactive'
      END
    `), 'status']],
      include: [
        {
          model: this.Models.AssignedUsers,
          attributes: ["id", "user_id", "account_manager_id", "type", "assigned_date", "deleted_at", [sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = user_id)"), "userName"], [sequelize.literal("(SELECT company_name FROM users WHERE users.id = user_id)"), "company_name"], [sequelize.literal("(SELECT first_name FROM users WHERE users.id = user_id)"), "first_name"], [sequelize.literal("(SELECT last_name FROM users WHERE users.id = user_id)"), "last_name"], [sequelize.literal("(SELECT user_image FROM users WHERE users.id = user_id)"), "user_image"], [sequelize.literal(`
          CASE
            WHEN (SELECT COUNT(*) FROM client_subscriptions 
                  WHERE client_subscriptions.client_id = user_id 
                  AND deleted_at IS NULL 
                  AND client_subscriptions.status = 1 
                  AND client_subscriptions.is_signed_docusign = 1 
                  LIMIT 1) > 0 THEN 'Active'
            WHEN (SELECT COUNT(*) FROM client_subscriptions 
                  WHERE client_subscriptions.client_id = user_id 
                  AND deleted_at IS NULL 
                  AND client_subscriptions.status = 2
                  AND client_subscriptions.is_signed_docusign = 1 
                  LIMIT 1) > 0 THEN 'Paused'
            WHEN (SELECT COUNT(*) FROM client_subscriptions 
                  WHERE client_subscriptions.client_id = user_id 
                  AND deleted_at IS NULL 
                  AND client_subscriptions.status = 0 
                  AND client_subscriptions.is_signed_docusign = 0 
                  LIMIT 1) > 0 THEN 'Pending'
            WHEN (SELECT COUNT(*) FROM client_subscriptions 
                  WHERE client_subscriptions.client_id = user_id 
                  AND deleted_at IS NULL 
                  AND client_subscriptions.status = 1 
                  AND client_subscriptions.is_signed_docusign = 0 
                  AND client_subscriptions.created_at < CURRENT_DATE 
                  LIMIT 1) > 0 THEN 'Suspended'
            WHEN (SELECT COUNT(*) FROM client_subscriptions 
                WHERE client_subscriptions.client_id = user_id 
                AND deleted_at IS NULL 
                AND client_subscriptions.status = 4 
                AND client_subscriptions.is_signed_docusign = 1
                LIMIT 1) > 0 THEN 'Cancelled'
            ELSE 'Pending'
          END
        `), 'subcription_status'], [sequelize.literal(`
        CASE
          WHEN status = 0 THEN 'Pending'
          WHEN status = 1 THEN 'Active'
          WHEN status = 2 THEN 'Inactive'
          ELSE 'Inactive'
        END
      `), 'status']],
          as: "assigned_account_manager_client",
          where: { deleted_at: null },
          required: false,
        },
      ],
      where: {
        id: Id,
        role_id: ROLES.ACCOUNTMANAGER
      },
    })
    return accountManagerDetail;
  }

  //get Account Manager By ID
  checkAccount_ManagerById = async (accManager_Id) => {
    return await this.Models.Users.findOne({
      attributes: ["id"],
      where: {
        id: accManager_Id,
        deleted_at: null,
        role_id: ROLES.ACCOUNTMANAGER
      }
    })
  }

  // get All existed Clients
  allClientsData = async () => {
    return await this.Models.Users.findAll({
      attributes: ["id"],
      where: {
        deleted_at: null,
        role_id: ROLES.CLIENT
      },
      raw: true
    })
  }

  checkDefaultClientCountAccountManagerById = async (account_manager_id) => {
    return await this.Models.AssignedUsers.count({
      where: {
        is_default: 1,
        user_id: account_manager_id,
        type: ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER,
        deleted_at: null
      }
    });
  }



  /** get all client list */
  getAllClientList = async (query) => {

    let havingCondition = {
      deleted_at: null,
      role_id: ROLES.CLIENT,
      is_assigned: 1,
    };

    if (query.search) {
      havingCondition = {
        [Op.or]: [
          { userName: { [Op.like]: `%${query.search}%` } }
        ],
        deleted_at: null,
        role_id: ROLES.CLIENT,
        is_assigned: 1
      }
    }

    if (query.type && query.type == 1) {
      havingCondition.is_assigned = {
        [Op.ne]: 1
      }
    }

    let account_Manager_id = query.account_Manager_id;
    let attributes = ["id", "role_id", "first_name", "last_name", "company_name", "user_image", "deleted_at", [sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = users.id)"),
      "userName"], [
        sequelize.literal(`
          CASE
              WHEN (SELECT COUNT(*) FROM assigned_users WHERE assigned_users.user_id = users.id AND deleted_at IS NULL AND account_manager_id = ${account_Manager_id} AND type = 2) > 0
              THEN 1
              ELSE 0
          END
      `),
        "is_assigned",
      ], 
      [sequelize.literal(`(SELECT assigned_date FROM assigned_users WHERE assigned_users.user_id = users.id AND deleted_at IS NULL AND account_manager_id = ${account_Manager_id} AND type = 2 limit 1)`), "assigned_date"],
      [sequelize.literal("(SELECT created_at FROM client_subscriptions WHERE client_subscriptions.client_id = users.id AND client_subscriptions.status = 0 AND client_subscriptions.deleted_at IS NULL limit 1)"), "subscription_creation_date"], [sequelize.literal(`
        CASE
          WHEN (SELECT COUNT(*) FROM client_subscriptions 
                WHERE client_subscriptions.client_id = users.id 
                AND deleted_at IS NULL 
                AND client_subscriptions.status = 1 
                AND client_subscriptions.is_signed_docusign = 1) > 0 THEN 'Active'
          WHEN (SELECT COUNT(*) FROM client_subscriptions 
                WHERE client_subscriptions.client_id = users.id 
                AND deleted_at IS NULL 
                AND client_subscriptions.status = 2
                AND client_subscriptions.is_signed_docusign = 1) > 0 THEN 'Paused'
          WHEN (SELECT COUNT(*) FROM client_subscriptions 
                WHERE client_subscriptions.client_id = users.id 
                AND deleted_at IS NULL 
                AND client_subscriptions.status = 3
                AND client_subscriptions.is_signed_docusign = 0) > 0 THEN 'Suspended'
          WHEN (SELECT COUNT(*) FROM client_subscriptions 
                WHERE client_subscriptions.client_id = users.id 
                AND deleted_at IS NULL 
                AND client_subscriptions.status = 4 
                AND client_subscriptions.is_signed_docusign = 1) > 0 THEN 'Pending'
          WHEN (SELECT COUNT(*) FROM client_subscriptions 
                WHERE client_subscriptions.client_id = users.id 
                AND deleted_at IS NULL 
                AND client_subscriptions.status = 1 
                AND client_subscriptions.is_signed_docusign = 0) > 0 THEN 'Pending'
          WHEN (SELECT COUNT(*) FROM client_subscriptions 
                WHERE client_subscriptions.client_id = users.id 
                AND deleted_at IS NULL 
                AND client_subscriptions.status = 0 
                AND client_subscriptions.is_signed_docusign = 0) > 0 THEN 'Pending'
          ELSE 'Pending'
        END
      `), 'subscription_status'],
      [sequelize.literal(`
        CASE
          WHEN status = 0 THEN 'Pending'
          WHEN status = 1 THEN 'Active'
          WHEN status = 2 THEN 'Inactive'
          ELSE 'Inactive'
        END
      `), 'status']];

    const getAllClientsCount = await this.Models.Users.findAll({
      attributes: attributes,
      having: havingCondition,
      order: [
        ['id', 'DESC'],
      ],
      raw: true,
    });

    const getAllClients = await this.Models.Users.findAll({
      attributes: attributes,
      having: havingCondition,
      order: [
        ['id', 'DESC'],
      ],
      raw: true,
      offset: (parseInt(query.start) == 0) ? 0 : (parseInt(query.start) || PAGINATION.START) * (parseInt(query.limit) || PAGINATION.LIMIT) || PAGINATION.START,
      limit: (query.limit == -1) ? getAllClientsCount.length : parseInt(query.limit) || PAGINATION.LIMIT,
    });
    return { list: getAllClients, total_records: getAllClientsCount.length, filtered_records: getAllClients.length }
  };

  // update Account Manager's
  updateAccountManager = async (data, Ids) => {
    await this.Models.Users.update(data, {
      where: {
        id: Ids,
        role_id: ROLES.ACCOUNTMANAGER
      }
    })
  }

  errorFunction = async (req, res, msg) => {
    return res
      .status(400)
      .send(
        errorResponse(
          msg,
          null,
          RESPONSE_CODES.BAD_REQUEST
        )
      );
  }



  getAccountManagerByManagerId = async (Id, user) => {

    let assinedUserCondition = { 
      deleted_at: null,
      type: ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER,
    };

    let getClientIds = [Id];
    if(user.role_id == ROLES.ACCOUNTMANAGER) {
      let setAttributes = ["id", "client_view", "agent_view", "deleted_at"];
      let getPermission = await this.getAccountManagerRolePermissions(user.role_permission_id, setAttributes);
      if(getPermission.client_view == 1) {

        let getAllClientOfAgents = await this.Models.AssignedUsers.findAll({
          attribute: ["id", "type", "user_id", "account_manager_id", "deleted_at"],
          where: {
            account_manager_id: user.id,
            type: ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER,
            deleted_at: null
          },
          raw: true,
        });

        getClientIds = getAllClientOfAgents.map(val => val.user_id);
        assinedUserCondition = { 
          deleted_at: null,
          user_id: {
            [sequelize.Op.in]: getClientIds // Use the array directly
          }
        };
      }
    }

    //get Account Manager Profile Details
    const accountManagerDetail = await this.Models.Users.findOne({
      attributes: ["id", "role_id", "first_name", "last_name", "email", "country_code", "phone_number", "address", "address2", "country", "state", "social_id", "city", "zipcode", "user_image", "company_name", "two_factor_authentication", "role_permission_id", "created_at", "updated_at", [
        sequelize.literal(
          `(SELECT Count(*) FROM assigned_users WHERE assigned_users.user_id = users.id AND deleted_at IS NULL AND type = 3)`
        ),
        "assigned_clients_count",
      ], [sequelize.literal(`
      CASE
        WHEN status = 0 THEN 'Pending'
        WHEN status = 1 THEN 'Active'
        WHEN status = 2 THEN 'Inactive'
        ELSE 'Inactive'
      END
    `), 'status']],
      // include: [
      //   {
      //     model: this.Models.AssignedUsers,
      //     attributes: ["id", "user_id", "account_manager_id", "type", "assigned_date", "deleted_at", [sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = assigned_account_manager_client.user_id)"), "userName"], [sequelize.literal("(SELECT company_name FROM users WHERE users.id = assigned_account_manager_client.user_id)"), "company_name"], [sequelize.literal("(SELECT first_name FROM users WHERE users.id = assigned_account_manager_client.user_id)"), "first_name"], [sequelize.literal("(SELECT last_name FROM users WHERE users.id = assigned_account_manager_client.user_id)"), "last_name"], [sequelize.literal("(SELECT user_image FROM users WHERE users.id = assigned_account_manager_client.user_id)"), "user_image"], [sequelize.literal(`
      //     CASE
      //       WHEN (SELECT COUNT(*) FROM client_subscriptions 
      //             WHERE client_subscriptions.client_id = assigned_account_manager_client.user_id 
      //             AND deleted_at IS NULL 
      //             AND client_subscriptions.status = 1 
      //             AND client_subscriptions.is_signed_docusign = 1 
      //             LIMIT 1) > 0 THEN 'Active'
      //       WHEN (SELECT COUNT(*) FROM client_subscriptions 
      //             WHERE client_subscriptions.client_id = assigned_account_manager_client.user_id 
      //             AND deleted_at IS NULL 
      //             AND client_subscriptions.status = 2
      //             AND client_subscriptions.is_signed_docusign = 1 
      //             LIMIT 1) > 0 THEN 'Paused'
      //       WHEN (SELECT COUNT(*) FROM client_subscriptions 
      //             WHERE client_subscriptions.client_id = assigned_account_manager_client.user_id 
      //             AND deleted_at IS NULL 
      //             AND client_subscriptions.status = 0 
      //             AND client_subscriptions.is_signed_docusign = 0 
      //             LIMIT 1) > 0 THEN 'Pending'
      //       WHEN (SELECT COUNT(*) FROM client_subscriptions 
      //             WHERE client_subscriptions.client_id = assigned_account_manager_client.user_id 
      //             AND deleted_at IS NULL 
      //             AND client_subscriptions.status = 1 
      //             AND client_subscriptions.is_signed_docusign = 0 
      //             AND client_subscriptions.created_at < CURRENT_DATE 
      //             LIMIT 1) > 0 THEN 'Suspended'
      //       WHEN (SELECT COUNT(*) FROM client_subscriptions 
      //           WHERE client_subscriptions.client_id = assigned_account_manager_client.user_id 
      //           AND deleted_at IS NULL 
      //           AND client_subscriptions.status = 4 
      //           AND client_subscriptions.is_signed_docusign = 1
      //           LIMIT 1) > 0 THEN 'Cancelled'
      //       ELSE 'Pending'
      //     END
      //   `), 'subcription_status'], [sequelize.literal(`
      //   CASE
      //     WHEN status = 0 THEN 'Pending'
      //     WHEN status = 1 THEN 'Active'
      //     WHEN status = 2 THEN 'Inactive'
      //     ELSE 'Inactive'
      //   END
      // `), 'status']],
      //     as: "assigned_account_manager_client",
      //     where: assinedUserCondition,
      //     required: false,
      //   },
      // ],
      where: {
        id: Id,
        role_id: ROLES.ACCOUNTMANAGER
      },
    })
    return accountManagerDetail;
  };


  /**Get Roles And Permissions by Id*/
  getAccountManagerRolePermissions = async (permissionId, Attributes) => {
    return this.Models.RolesAndPermissions.findOne({
      attributes: Attributes,
      where: {
        id: permissionId,
        deleted_at: null
      },
      raw: true
    });
  };


  /** get all assigned agent list */
  getAllAssignedAgentList = async (query, user) => {

    let havingCondition = {
      deleted_at: null,
      role_id: ROLES.AGENT,
      is_assigned: 1
    };

    if (query.search) {
      havingCondition = {
        [Op.or]: [
          { userName: { [Op.like]: `%${query.search}%` } }
        ],
        deleted_at: null,
        role_id: ROLES.AGENT,
        is_assigned: 1
      }
    }

    if (query.type && query.type == 1) {
        havingCondition.is_assigned = {
          [Op.ne]: 1
        };

        let getAllClientOfManager = await this.Models.AssignedUsers.findAll({
          attribute: ["id", "type", "user_id", "account_manager_id", "deleted_at"],
          where: {
            account_manager_id: query.account_Manager_id,
            type: ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER,
            deleted_at: null
          },
          raw: true,
        });
        let getClientIds = getAllClientOfManager.map(val => val.user_id);
        let getAllAgentsOfClients = await this.Models.AssignedUsers.findAll({
          attribute: ["id", "type", "user_id", "agent_id", "deleted_at"],
          where: {
            user_id: getClientIds,
            type: ASSIGNED_USERS.CLIENTS_TO_AGENT,
            deleted_at: null
          },
          raw: true,
        });
        let getAgentIds = getAllAgentsOfClients.map(val => val.agent_id);
        // if(getAgentIds.length > 0) {
        //   havingCondition.id = {
        //     [Op.notIn]: getAgentIds
        //   }
        // }
        if (query.search) {
          havingCondition = {
            id: {
              [Op.notIn]: getAgentIds
            },
            [Op.or]: [
              { userName: { [Op.like]: `%${query.search}%` } }
            ],
            deleted_at: null,
            role_id: ROLES.AGENT,
            is_assigned: {
              [Op.ne]: 1
            }
          }
        }

        let setAttributes = ["id", "agent_view", "agent_delete", "deleted_at"];
        let getPermission = await this.getAccountManagerRolePermissions(user.role_permission_id, setAttributes);

        if(getPermission && getPermission.agent_view == 1) {

          let getAllClientOfManager = await this.Models.AssignedUsers.findAll({
            attribute: ["id", "type", "user_id", "account_manager_id", "deleted_at"],
            where: {
              account_manager_id: user.id,
              type: ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER,
              deleted_at: null
            },
            raw: true,
          });
          let getClientIds = getAllClientOfManager.map(val => val.user_id);
          let getAllAgentsOfClients = await this.Models.AssignedUsers.findAll({
            attribute: ["id", "type", "user_id", "agent_id", "deleted_at"],
            where: {
              user_id: getClientIds,
              type: ASSIGNED_USERS.CLIENTS_TO_AGENT,
              deleted_at: null
            },
            raw: true,
          });
  
          let getAllAgentsOfManager = await this.Models.AssignedUsers.findAll({
            attribute: ["id", "type", "account_manager_id", "agent_id", "deleted_at"],
            where: {
              account_manager_id: user.id,
              type: ASSIGNED_USERS.AGENTS_TO_ACCOUNT_MANAGER,
              deleted_at: null
            },
            raw: true,
          });
  
          let getAssignedAgentIds = getAllAgentsOfManager.map(val => val.agent_id);
          let getClientsAgentIds = getAllAgentsOfClients.map(val => val.agent_id);
          let getAgentIds = getAssignedAgentIds.concat(getClientsAgentIds);
          havingCondition = {
            id: getAgentIds,
            deleted_at: null,
            role_id: ROLES.AGENT,
            is_assigned: {
              [Op.ne]: 1
            }
          };
          if (query.search) {
            havingCondition = {
              id: getAgentIds,
              [Op.or]: [
                { userName: { [Op.like]: `%${query.search}%` } }
              ],
              deleted_at: null,
              role_id: ROLES.AGENT,
              is_assigned: {
                [Op.ne]: 1
              }
            }
          }
        }
    }

    let account_Manager_id = +query.account_Manager_id;
    let attributes = ["id", "role_id", "first_name", "last_name", "user_image", "status", "deleted_at", [sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = users.id)"),
      "userName"], [
        sequelize.literal(`
          CASE
              WHEN (SELECT COUNT(*) FROM assigned_users WHERE assigned_users.agent_id = users.id AND deleted_at IS NULL AND assigned_users.deleted_at IS NULL AND assigned_users.account_manager_id = ${account_Manager_id} AND type = 3) > 0
              THEN 1
              ELSE 0
          END
      `),
        "is_assigned",
      ], [sequelize.literal(`
        CASE
          WHEN status = 0 THEN 'Pending'
          WHEN status = 1 THEN 'Active'
          WHEN status = 2 THEN 'Inactive'
          ELSE 'Inactive'
        END
      `), 'status']]

      const getAllAgentsCount = await this.Models.Users.findAll({
        attributes: attributes,
        having: havingCondition,
        order: [
          ['id', 'DESC'],
        ],
        raw: true,
      });

      const getAllAgents = await this.Models.Users.findAll({
        attributes: attributes,
        having: havingCondition,
        order: [
          ['id', 'DESC'],
        ],
        raw: true,
        offset: (parseInt(query.start) == 0) ? 0 : (parseInt(query.start) || PAGINATION.START) * (parseInt(query.limit) || PAGINATION.LIMIT) || PAGINATION.START,
        limit: (query.limit == -1) ? getAllAgentsCount.length : parseInt(query.limit) || PAGINATION.LIMIT,
      });
      return { list: getAllAgents, total_records: getAllAgentsCount.length, filtered_records: getAllAgents.length }
    };

}
