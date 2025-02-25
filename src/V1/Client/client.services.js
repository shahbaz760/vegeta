import sequelize, { where } from 'sequelize';
const Op = sequelize.Op;
import { PAGINATION, RESPONSE_CODES, ROLES, ASSIGNED_USERS, SUBSCRIPTION_LOGID, SUBSCRIPTION_LOGS_MESSAGE, RECENT_ACTIVITY_TYPE } from '../../../config/constants';
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
import moment from "moment";
import docusign from 'docusign-esign';
const fs = require('fs');
import path from "path";
import { foreign_key } from 'i/lib/methods';
import { v4 as uuidv4 } from 'uuid';
import { type } from 'os';
import { refreshToken } from "../helpers/jwt";

export default class Client {
  async init(db) {
    this.Models = db.models;
  }


  /** create client */
  createClient = async (data) => {
    return await this.Models.Users.create(data);
  };

  /* check client by client_id */
  checkClientById = async (clientId) => {
    return await this.Models.Users.findOne({
      where: {
        id: clientId,
        deleted_at: null,
        role_id: ROLES.CLIENT
      },
      raw: true,
    })
  };

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

  /* check client by client_id */
  checkUserDetailById = async (clientId) => {
    return await this.Models.Users.findOne({
      where: {
        id: clientId,
        deleted_at: null,
      },
      raw: true,
    })
  };

  /** check user by condition */
  getClientByCondition = async (data) => {
    return await this.Models.Users.findOne({ 
      where: data,
      raw: true
    });
  };

  /** update client password by condition*/
  updateClient = async (data, clientId) => {
    await this.Models.Users.update(data, { where: { id: clientId } });
  };

  /** get user by email*/
  getClientByMail = async (email) => {
    return this.Models.Users.findOne({
      where: {
        email: email,
        // role_id: ROLES.CLIENT
      },
      raw: true
    });
  };

  /** Get client information  */
  getClientInformation = async (data) => {
    return this.Models.Users.findOne({
      attributes: ["id", "role_id", "first_name", "last_name", "email", "country_code", "phone_number", "address", "address2", "country", "social_id", "state", "city", "zipcode", "user_image", "company_name", "two_factor_authentication", [sequelize.literal(`
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
              AND client_subscriptions.status = 1 
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
    `), 'subscription_status'], [sequelize.literal(`
    CASE
      WHEN status = 0 THEN 'Pending'
      WHEN status = 1 THEN 'Active'
      WHEN status = 2 THEN 'Inactive'
      ELSE 'Inactive'
    END
  `), 'status'], [sequelize.literal(`CASE WHEN ( SELECT COUNT(*) FROM client_subscriptions WHERE client_subscriptions.client_id = users.id AND deleted_at IS NULL AND client_subscriptions.status = 0 AND client_subscriptions.is_signed_docusign = 0) > 0 THEN 1
    ELSE 0 END `), "pending_subscription"]],
      where: data,
      raw: true
    });
  };

  /** get all users list with pagination and search filter and total count*/
  getClientList = async (body, user) => {
    let havingCondition = {
      deleted_at: null,
      role_id: ROLES.CLIENT,
    };

    let countHavingCondition = {
      deleted_at: null,
      role_id: ROLES.CLIENT,
    }

    if (body.search) {
      havingCondition = {
        [Op.or]: [
          { userName: { [Op.like]: `%${body.search}%` } },
          { company_name: { [Op.like]: `%${body.search}%` } },
          { email: { [Op.like]: `%${body.search}%` } }
        ],
        deleted_at: null,
        role_id: ROLES.CLIENT,
      }
    }

    if(body.role_id == ROLES.ACCOUNTMANAGER) {
      let setAttributes = ["id", "client_view", "deleted_at"];
      let getPermission = await this.getAccountManagerRolePermissions(user.role_permission_id, setAttributes);
      if(getPermission && getPermission.client_view == 1) {
        let getAllClientOfManager = await this.Models.AssignedUsers.findAll({
          attribute: ["id", "type", "user_id", "account_manager_id", "deleted_at"],
          where: {
            account_manager_id: body.user_id,
            type: ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER,
            deleted_at: null
          },
          raw: true,
        });
        let getClientIds = getAllClientOfManager.map(val => val.user_id);
        havingCondition.id = getClientIds;
        countHavingCondition.id = getClientIds;

        if (body.search) {
          havingCondition = {
            [Op.or]: [
              { userName: { [Op.like]: `%${body.search}%` } },
              { company_name: { [Op.like]: `%${body.search}%` } },
              { email: { [Op.like]: `%${body.search}%` } }
            ],
            deleted_at: null,
            role_id: ROLES.CLIENT,
            id: getClientIds,
          }
        }
      }
    }

    if (body.type == 1) {
      havingCondition.active_subscription = 1;
    } else if (body.type == 2) {
      havingCondition.pause_subscription = 1;
    } else if (body.type == 3) {
      havingCondition.cancelled_subscription = 1;
    } else if (body.type == 4) {
      havingCondition.pending_subscription = 1;
      let currDate = new Date();
      havingCondition.subscription_creation_date = {
        [Op.lt]: new Date(moment(currDate).startOf("day")),
      }
    }


    if (body.type == 1) {
      countHavingCondition.active_subscription = 1;
    } else if (body.type == 2) {
      countHavingCondition.pause_subscription = 1;
    } else if (body.type == 3) {
      countHavingCondition.cancelled_subscription = 1;
    } else if (body.type == 4) {
      countHavingCondition.pending_subscription = 1;
      let currDate = new Date();
      countHavingCondition.subscription_creation_date = {
        [Op.lt]: new Date(moment(currDate).startOf("day")),
      }
    }

    const allClientExcludeSearchCount = await this.Models.Users.findAll({
      attributes: {
        include: [[sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = users.id)"), "userName"], [sequelize.literal(` CASE WHEN ( SELECT COUNT(*) FROM client_subscriptions WHERE client_subscriptions.client_id = users.id AND deleted_at IS NULL AND client_subscriptions.status = 0 AND client_subscriptions.is_signed_docusign = 0) > 0 THEN 1
        ELSE 0 END `), "pending_subscription"], [sequelize.literal(` CASE WHEN ( SELECT COUNT(*) FROM client_subscriptions WHERE client_subscriptions.client_id = users.id AND client_subscriptions.deleted_at IS NULL AND client_subscriptions.status = 1 AND client_subscriptions.is_signed_docusign = 1) > 0 THEN 1
          ELSE 0 END `), "active_subscription"], [sequelize.literal(` CASE WHEN ( SELECT COUNT(*) FROM client_subscriptions WHERE client_subscriptions.client_id = users.id AND client_subscriptions.deleted_at IS NULL AND client_subscriptions.status = 2 AND client_subscriptions.is_signed_docusign = 1) > 0 THEN 1
          ELSE 0 END `), "pause_subscription"], [sequelize.literal(` CASE WHEN ( SELECT COUNT(*) FROM client_subscriptions WHERE client_subscriptions.client_id = users.id AND client_subscriptions.deleted_at IS NULL AND client_subscriptions.status = 3 AND client_subscriptions.is_signed_docusign = 1) > 0 THEN 1
          ELSE 0 END `), "expire_subscription"], [sequelize.literal(` CASE WHEN ( SELECT COUNT(*) FROM client_subscriptions WHERE client_subscriptions.client_id = users.id AND client_subscriptions.deleted_at IS NULL AND client_subscriptions.status = 4 AND client_subscriptions.is_signed_docusign = 1) > 0 THEN 1
          ELSE 0 END `), "cancelled_subscription"], [sequelize.literal("(SELECT created_at FROM client_subscriptions WHERE client_subscriptions.client_id = users.id AND client_subscriptions.status = 0 AND client_subscriptions.deleted_at IS NULL limit 1)"), "subscription_creation_date"], [sequelize.literal(`
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
                  AND client_subscriptions.status = 5 
                  AND client_subscriptions.is_signed_docusign = 1) > 0 THEN 'Active'
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
        `), 'subscription_status']]
      },
      having: countHavingCondition,
    });

    const allClientCount = await this.Models.Users.findAll({
      attributes: {
        include: [[sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = users.id)"), "userName"], [sequelize.literal(` CASE WHEN ( SELECT COUNT(*) FROM client_subscriptions WHERE client_subscriptions.client_id = users.id AND deleted_at IS NULL AND client_subscriptions.status = 0 AND client_subscriptions.is_signed_docusign = 0) > 0 THEN 1
        ELSE 0 END `), "pending_subscription"], [sequelize.literal(` CASE WHEN ( SELECT COUNT(*) FROM client_subscriptions WHERE client_subscriptions.client_id = users.id AND client_subscriptions.deleted_at IS NULL AND client_subscriptions.status = 1 AND client_subscriptions.is_signed_docusign = 1) > 0 THEN 1
          ELSE 0 END `), "active_subscription"], [sequelize.literal(` CASE WHEN ( SELECT COUNT(*) FROM client_subscriptions WHERE client_subscriptions.client_id = users.id AND client_subscriptions.deleted_at IS NULL AND client_subscriptions.status = 2 AND client_subscriptions.is_signed_docusign = 1) > 0 THEN 1
          ELSE 0 END `), "pause_subscription"], [sequelize.literal(` CASE WHEN ( SELECT COUNT(*) FROM client_subscriptions WHERE client_subscriptions.client_id = users.id AND client_subscriptions.deleted_at IS NULL AND client_subscriptions.status = 3 AND client_subscriptions.is_signed_docusign = 1) > 0 THEN 1
          ELSE 0 END `), "expire_subscription"], [sequelize.literal(` CASE WHEN ( SELECT COUNT(*) FROM client_subscriptions WHERE client_subscriptions.client_id = users.id AND client_subscriptions.deleted_at IS NULL AND client_subscriptions.status = 4 AND client_subscriptions.is_signed_docusign = 1) > 0 THEN 1
          ELSE 0 END `), "cancelled_subscription"], [sequelize.literal("(SELECT created_at FROM client_subscriptions WHERE client_subscriptions.client_id = users.id AND client_subscriptions.status = 0 AND client_subscriptions.deleted_at IS NULL limit 1)"), "subscription_creation_date"], [sequelize.literal(`
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
                  AND client_subscriptions.status = 5 
                  AND client_subscriptions.is_signed_docusign = 1) > 0 THEN 'Active'
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
        `), 'subscription_status']]
      },
      having: havingCondition,
    });

    const getAllClients = await this.Models.Users.findAll({
      attributes: ["id", "role_id", "first_name", "last_name", "email", "country_code", "phone_number", "address", "user_image", "company_name", "deleted_at", "created_at", "updated_at", [sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = users.id)"), "userName"], [sequelize.literal(` CASE WHEN ( SELECT COUNT(*) FROM client_subscriptions WHERE client_subscriptions.client_id = users.id AND deleted_at IS NULL AND client_subscriptions.status = 0 AND client_subscriptions.is_signed_docusign = 0) > 0 THEN 1
      ELSE 0 END `), "pending_subscription"], [sequelize.literal(` CASE WHEN ( SELECT COUNT(*) FROM client_subscriptions WHERE client_subscriptions.client_id = users.id AND client_subscriptions.deleted_at IS NULL AND client_subscriptions.status = 1 AND client_subscriptions.is_signed_docusign = 1) > 0 THEN 1
        ELSE 0 END `), "active_subscription"], [sequelize.literal(` CASE WHEN ( SELECT COUNT(*) FROM client_subscriptions WHERE client_subscriptions.client_id = users.id AND client_subscriptions.deleted_at IS NULL AND client_subscriptions.status = 2 AND client_subscriptions.is_signed_docusign = 1) > 0 THEN 1
        ELSE 0 END `), "pause_subscription"], [sequelize.literal(` CASE WHEN ( SELECT COUNT(*) FROM client_subscriptions WHERE client_subscriptions.client_id = users.id AND client_subscriptions.deleted_at IS NULL AND client_subscriptions.status = 3 AND client_subscriptions.is_signed_docusign = 1) > 0 THEN 1
        ELSE 0 END `), "expire_subscription"], [sequelize.literal(` CASE WHEN ( SELECT COUNT(*) FROM client_subscriptions WHERE client_subscriptions.client_id = users.id AND client_subscriptions.deleted_at IS NULL AND client_subscriptions.status = 4 AND client_subscriptions.is_signed_docusign = 1) > 0 THEN 1
        ELSE 0 END `), "cancelled_subscription"], [sequelize.literal("(SELECT created_at FROM client_subscriptions WHERE client_subscriptions.client_id = users.id AND client_subscriptions.status = 0 AND client_subscriptions.deleted_at IS NULL limit 1)"), "subscription_creation_date"], [sequelize.literal(`
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
                  AND client_subscriptions.status = 5 
                  AND client_subscriptions.is_signed_docusign = 1) > 0 THEN 'Active'
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
      `), 'subscription_status'], [sequelize.literal(`
      CASE
        WHEN status = 0 THEN 'Pending'
        WHEN status = 1 THEN 'Active'
        WHEN status = 2 THEN 'Inactive'
        ELSE 'Inactive'
      END
    `), 'status'],
    [sequelize.literal(`
      CASE 
        -- When client_delete is 1, check if assigned users exist
        WHEN (
          (SELECT COUNT(*) 
            FROM roles_and_permissions 
            WHERE roles_and_permissions.id = ${user.role_permission_id} 
              AND roles_and_permissions.client_delete = 1 
              AND roles_and_permissions.deleted_at IS NULL
          ) > 0
        )
        THEN 
          CASE 
            -- If client_delete is 1, check for assigned users (should exist)
            WHEN (
              (SELECT COUNT(*) 
                FROM assigned_users 
                WHERE assigned_users.user_id = users.id 
                  AND assigned_users.deleted_at IS NULL 
                  AND assigned_users.account_manager_id = ${user.id}
              ) > 0 
            )
            THEN 1
            ELSE 0
          END
        
        -- When client_delete is 0, check if there are no assigned users
        WHEN (
          (SELECT COUNT(*) 
            FROM roles_and_permissions 
            WHERE roles_and_permissions.id = ${user.role_permission_id} 
              AND roles_and_permissions.client_delete = 0 
              AND roles_and_permissions.deleted_at IS NULL
          ) > 0
        )
        THEN 1
            ELSE 0
          END
    `), "is_delete_access"]
    ],
      having: havingCondition,
      order: [
        ['id', 'DESC'],
      ],
      offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
      limit: (body.limit == -1) ? allClientCount.length : parseInt(body.limit) || PAGINATION.LIMIT,
      raw: true,
    });

    return { list: getAllClients, total_records: allClientCount.length, total_count: allClientExcludeSearchCount.length, filtered_records: getAllClients.length }
  };


  /** delete client by client ids */
  removeClient = async (data, Ids) => {
    return this.Models.Users.update(data, {
      where: {
        id: Ids,
        role_id: ROLES.CLIENT
      }
    });
  };

  /** check user by id */
  getClientById = async (clientId) => {
    return this.Models.Users.findOne({
      attributes: ["id", "role_id", "first_name", "last_name", "email", "country_code", "phone_number", "address", "address2", "country", "state", "city", "zipcode", "user_image", "company_name", "role_permission_id", [sequelize.literal(`
      CASE
        WHEN status = 0 THEN 'Pending'
        WHEN status = 1 THEN 'Active'
        WHEN status = 2 THEN 'Inactive'
        ELSE 'Inactive'
      END
    `), 'status']],
      where: {
        id: clientId,
        role_id: ROLES.CLIENT
      },
      raw: true
    });
  };



  getAgentList = async (body) => {
    let havingCondition = {
      deleted_at: null,
      role_id: ROLES.AGENT,
    };

    if (body.search) {
      havingCondition = {
        [Op.or]: [
          { userName: { [Op.like]: `%${body.search}%` } }
        ],
        deleted_at: null,
        role_id: ROLES.AGENT,
      }
    }

    const getAllAgents = await this.Models.Users.findAll({
      attributes: ["id", "role_id", "first_name", "last_name", "email", "country_code", "phone_number", "address", "user_image", "company_name", "status", "deleted_at", "created_at", "updated_at", [sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = users.id)"),
        "userName"]],
      having: havingCondition,
      order: [
        ['id', 'DESC'],
      ],
      raw: true,
    });

    return { list: getAllAgents, total_records: getAllAgents.length }
  };



  getAssignedAgentList = async (body, userDetail) => {
    let havingCondition = {
      user_id: body.client_id,
      deleted_at: null,
      type: ASSIGNED_USERS.CLIENTS_TO_AGENT,
    };


    let userWhereCondition = {
        deleted_at: null,
        role_id: ROLES.USER,
        // [Op.and]: [
        //   {id: { [Op.ne]: body.user_id }},
        //   {added_by: body.client_id}
        // ],
    }

    if (body.search) {
      havingCondition = {
        [Op.or]: [
          { userName: { [Op.like]: `%${body.search}%` } }
        ],
        deleted_at: null,
        type: ASSIGNED_USERS.CLIENTS_TO_AGENT,
        user_id: body.client_id,
      };

      userWhereCondition = {
        [Op.or]: [
          { userName: { [Op.like]: `%${body.search}%` } }
        ],
        deleted_at: null,
        role_id: ROLES.USER,
        // [Op.and]: [
        //   {id: { [Op.ne]: body.user_id }},
        //   {added_by: body.client_id}
        // ],
    }
    }

    const allAgentCountWithoutSearch = await this.Models.AssignedUsers.count({
      where: {
        user_id: body.client_id,
        deleted_at: null,
        type: ASSIGNED_USERS.CLIENTS_TO_AGENT
      }
    });

    let assignedUserIds = [];
    if(body.project_id) {
      let getAssignedProjectUser = await this.Models.AssignedTaskUsers.findAll({
        where: {
          project_id: body.project_id,
          task_id: null,
          deleted_at: null
        },
        raw: true
      });
      assignedUserIds = getAssignedProjectUser.map(val => val.user_id);
    }

    if(assignedUserIds.length > 0){
      havingCondition.agent_id = assignedUserIds;
      userWhereCondition.id = assignedUserIds;
    }


    if(userDetail.role_id == ROLES.CLIENT) {
      let geClientUsers = await this.Models.Users.findAll({
        attributes: ["id", "added_by", "deleted_at"],
        where: {
          added_by: userDetail.id,
          deleted_at: null,
        },
        raw: true
      });
      let getClientUserIds = geClientUsers.map(val => val.id);
      let getUsersOfUser = await this.Models.Users.findAll({
        attributes: ["id", "added_by", "deleted_at"],
        where: {
          added_by: getClientUserIds,
          deleted_at: null,
        },
        raw: true
      });
      getClientUserIds.push(userDetail.id);
      let getUsersOfUserIds = getUsersOfUser.map(val => val.id);
      let finalUserIds = getClientUserIds.concat(getUsersOfUserIds);
      finalUserIds = finalUserIds.filter(item => item != userDetail.id);
      userWhereCondition.id = getClientUserIds.concat(getUsersOfUserIds);
    }

    if(userDetail.role_id == ROLES.USER) {

      let geClientUsers = await this.Models.Users.findAll({
        attributes: ["id", "added_by", "added_by_user", "deleted_at"],
        where: {
          added_by: userDetail.added_by,
          deleted_at: null,
        },
        raw: true
      });
      let finalUserIds = geClientUsers.map(val => val.id);
       finalUserIds.push(userDetail.added_by, userDetail.added_by_user);

      // let geClientUsers = await this.Models.Users.findAll({
      //   attributes: ["id", "added_by", "deleted_at"],
      //   where: {
      //     added_by: [userDetail.added_by, userDetail.id],
      //     deleted_at: null,
      //   },
      //   raw: true
      // });
      // let getClientUserIds = geClientUsers.map(val => val.id);
      // let getUsersOfUser = await this.Models.Users.findAll({
      //   attributes: ["id", "added_by", "deleted_at"],
      //   where: {
      //     added_by: getClientUserIds,
      //     deleted_at: null,
      //   },
      //   raw: true
      // });
      // getClientUserIds.push(userDetail.id, userDetail.added_by);
      // let getUsersOfUserIds = getUsersOfUser.map(val => val.id);
      // let finalUserIds = getClientUserIds.concat(getUsersOfUserIds);
      finalUserIds = finalUserIds.filter(item => item != userDetail.id);
      userWhereCondition.id = finalUserIds;
    }



    const allAgentCount = await this.Models.AssignedUsers.findAll({
      attributes: ["id", "user_id", "agent_id", "type", "assigned_date", "deleted_at", "created_at", "updated_at", [sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = assigned_users.agent_id)"), "userName"]],
      having: havingCondition,
    });

    const getAllAgents = await this.Models.AssignedUsers.findAll({
      attributes: ["id", "user_id", "agent_id", "type", "assigned_date", "deleted_at", "created_at", "updated_at", [sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = assigned_users.agent_id)"), "userName"], [sequelize.literal("DATE_FORMAT(FROM_UNIXTIME(assigned_users.assigned_date), '%M %e, %Y')"), "assigned_date_time"], [sequelize.literal("(SELECT first_name FROM users WHERE users.id = assigned_users.agent_id)"), "first_name"], [sequelize.literal("(SELECT last_name FROM users WHERE users.id = assigned_users.agent_id)"), "last_name"], [sequelize.literal("(SELECT user_image FROM users WHERE users.id = assigned_users.agent_id)"), "user_image"], [sequelize.literal("(SELECT role_id FROM users WHERE users.id = assigned_users.agent_id)"), "role_id"], [sequelize.literal(`
      (SELECT CASE 
          WHEN u.status = 0 THEN 'Pending' 
          WHEN u.status = 1 THEN 'Active' 
          WHEN u.status = 2 THEN 'Inactive' 
          ELSE 'Inactive' 
        END 
      FROM users u 
      WHERE u.id = assigned_users.agent_id)
    `), 'status'], [sequelize.literal(`
    (SELECT COALESCE(
      (SELECT CASE 
        WHEN user_task_permissions.is_toggle = 0 THEN 0 
        WHEN user_task_permissions.is_toggle = 1 THEN 1 
        ELSE 0
      END 
      FROM user_task_permissions
      WHERE user_task_permissions.client_id = ${body.client_id} 
      AND user_task_permissions.user_id = assigned_users.agent_id), 0)
    )
  `), 'is_toggle'],
  [sequelize.literal("(SELECT FROM_UNIXTIME(login_time, '%Y-%m-%d %H:%i:%s') FROM user_login_times WHERE user_login_times.user_id = assigned_users.agent_id ORDER BY user_login_times.id DESC limit 1)"), "last_login"]],
      having: havingCondition,
      offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
      limit: (body.limit == -1) ? allAgentCount.length : parseInt(body.limit) || PAGINATION.LIMIT,
      order: [
        ['id', 'DESC'],
      ],
      raw: true,
    });

    let getAgentId = allAgentCount.map(val => val.agent_id);
    let getLoggedInAgents = await this.Models.UserLoginTime.findAll({
      attributes: ["id", "user_id"],
      group: ["user_id"],
      where: {
        user_id: getAgentId,
      }
    });

    if(body.is_user == 1) {
      let getAssignedUsers = await this.Models.Users.findAll({
        attributes: ["id", ["added_by", "user_id"], ["id", "agent_id"], "role_id", "first_name", "last_name", "deleted_at", "created_at", [sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = users.id)"), "userName"], "user_image"],
        having: userWhereCondition,
        order: [["id", "DESC"]],
        raw: true
      });
      const mergedArray = getAllAgents.concat(getAssignedUsers);
      return { list: mergedArray, total_records: mergedArray.length, filtered_records: mergedArray.length }
    }else {
      return { list: getAllAgents, total_records: allAgentCount.length, filtered_records: getAllAgents.length, total_count: allAgentCountWithoutSearch, total_logged_in_agent: getLoggedInAgents.length }
    }
  };


  /* check agent by agent_id */
  checkAgentById = async (agentId) => {
    return await this.Models.Users.findOne({
      where: {
        id: agentId,
        deleted_at: null,
        role_id: ROLES.AGENT
      }
    })
  };

  /* check Assigned User By Condtion */
  checkAssignedUserByCondtion = async (condition) => {
    return await this.Models.AssignedUsers.findOne({
      where: condition,
      raw: true
    });
  };

  /* Unassign client By Condtion */
  unassignedClientByCondtion = async (data, condition) => {
    return await this.Models.AssignedUsers.update(data, condition);
  };


  /** get product by id*/
  getProductById = async (productId) => {
    return this.Models.LineItems.findOne({
      where: {
        id: productId,
        deleted_at: null
      },
      raw: true
    });
  };

  updateProduct = async (data, productId) => {
    return await this.Models.LineItems.update(data, { where: { id: productId } });
  };

  /* create subscription for client */
  createSubscriptionPrice = async (data) => {

    let recurring = {};
    if (data.billing_frequency != 1) {
      recurring = {
        interval: (data.billing_frequency == 6 || data.billing_frequency == 7) ? "week" : (data.billing_frequency == 5) ? "year" : "month",
        interval_count: (data.billing_frequency == 2) ? 1 : (data.billing_frequency == 3) ? 3 : (data.billing_frequency == 4) ? 6 : (data.billing_frequency == 5) ? 1 : (data.billing_frequency == 6) ? 1 :  (data.billing_frequency == 7) ? 4 : 1
      };
    }

    let price = parseInt((data.unit_price * 100).toFixed(0), 10);
    const createPrice = await stripe.prices.create({
      unit_amount: parseInt(price), // amount in cents
      currency: 'usd',
      product_data: {
        name: data.name,
      },
      recurring: recurring,
    });
    return createPrice.id;
  };

  /* get subscription Price Ids  */
  getSubscriptionPriceId = async (subscriptionData) => {
    let priceIds = [];
    if (subscriptionData.length > 0) {
      for (let i in subscriptionData) {
        
        const getProductDetail = await this.getProductById(subscriptionData[i].product_id);
        if (getProductDetail) {
          let subscriptionPriceData = {
            name: getProductDetail.name,
            unit_price: subscriptionData[i].unit_price,
            billing_frequency: subscriptionData[i].billing_frequency,
          }
          // if (getProductDetail.billing_frequency == subscriptionData[i].billing_frequency && getProductDetail.unit_price == subscriptionData[i].net_price) {
          //   priceIds.push({ price: getProductDetail.stripe_price_id })
          // } else {
          const createStripePrice = await this.createSubscriptionPrice(subscriptionPriceData);
          let updateData = {
            quantity: subscriptionData[i].quantity,
            billing_frequency: subscriptionData[i].billing_frequency,
            billing_terms: subscriptionData[i].billing_terms,
            no_of_payments: subscriptionData[i].no_of_payments,
            is_delay_in_billing: subscriptionData[i].is_delay_in_billing,
            billing_start_date: (subscriptionData[i].billing_start_date != "") ? moment(new Date(subscriptionData[i].billing_start_date)).unix() : moment(new Date()).unix(),
            stripe_price_id: createStripePrice
          };
          await this.updateProduct(updateData, getProductDetail.id);
          priceIds.push({ price: createStripePrice, quantity: subscriptionData[i].quantity });
          // }
        }
      }
    }
    return priceIds;
  };


  /* create stripe for client */
  createStripeCustomer = async (clientData) => {
    // Create a customer
    const customer = await stripe.customers.create({
      email: clientData.email,
    });

    let updateData = {
      customer_id: customer.id
    }
    await this.updateClient(updateData, clientData.id);
    return customer.id;
  };


// create subscription in stripe 
  createSubscriptionForClient = async (paymentMode, customerId, priceIds, clientId, subscriptionParams, discountId, subscriptionAllParams, isManualPayment) => {
    let subscriptionData = {};
    let billingDateParam = {};
    let discountParam = {};
    let invoice_creation = {};
    let subscription_data = {};
    let taxDetail = {};

    if (discountId) {
      discountParam = {
        discounts: [{
          coupon: discountId
        }]
      }
    }
    // If subscription billing start to future date
    if (subscriptionParams.billing_start_date != "") {
      billingDateParam.trial_end = moment(new Date(subscriptionParams.billing_start_date)).unix();
    }

    if (subscriptionAllParams.every(item => item.billing_frequency === 1)) {
      invoice_creation = {
        enabled: true
      };
    }


    let getTaxId = await this.Models.SubscriptionSettings.findOne({
      attributes: ["tax_rate_id"],
      where: {
        deleted_at: null
      },
      raw: true
    });

    if(getTaxId && getTaxId.tax_rate_id != "" && getTaxId.tax_rate_id != null){
      billingDateParam.default_tax_rates = [getTaxId.tax_rate_id];
    }

    if (paymentMode == "subscription") {
      subscription_data = {
        ...billingDateParam,
      };
    }else {

      if(getTaxId && getTaxId.tax_rate_id != "" && getTaxId.tax_rate_id != null){
        for(let prcItem in priceIds) {
          priceIds[prcItem].tax_rates = [getTaxId.tax_rate_id]
        }
      }
 
    }

    const createSubscription = await stripe.checkout.sessions.create({
      mode: paymentMode,
      customer: customerId,
      success_url: `${process.env.BASE_URL}subscription-success`,
      cancel_url: `${process.env.BASE_URL}subscription-cancel`,
      line_items: priceIds,
      payment_method_types: ['card'],
      invoice_creation,
      subscription_data,
      expand: ['payment_intent.payment_method'],
      metadata: {
        "client_id": +clientId,
        "billing_terms": +subscriptionParams.billing_terms,
        "no_of_payments": subscriptionParams.no_of_payments ? +subscriptionParams.no_of_payments : 0,
        "billing_frequency": +subscriptionParams.billing_frequency,
        "is_edited": false,
        "payment_method": "card",
        "is_manual_payment": (isManualPayment && isManualPayment == 1) ? 1: 0,
      },
      ...discountParam,
      ...taxDetail
    });

    for(let dltPrcItem in priceIds) {
      delete priceIds[dltPrcItem].tax_rates;
    }

    if (createSubscription) {
      // get payment link of subscription
      subscriptionData = {
        subscription_id: createSubscription.id,
        payment_link: createSubscription.url,
        amount: createSubscription.amount_total / 100,
        subTotal: createSubscription.amount_subtotal / 100,
        start_date: createSubscription.created
      }
    }
    return subscriptionData;
  };


  // Buy subscription in stripe 
  buySubscriptionByClient = async (customerId, priceIds, clientId, subscriptionParams, paymentMethodId) => {
    let subscriptionData = {};
    let subscription_data = {};

    let getTaxId = await this.Models.SubscriptionSettings.findOne({
      attributes: ["tax_rate_id"],
      where: {
        deleted_at: null
      },
      raw: true
    });

    if(getTaxId && getTaxId.tax_rate_id != "" && getTaxId.tax_rate_id != null){
      subscription_data.default_tax_rates = [getTaxId.tax_rate_id];
    }

    const createSubscription = await stripe.subscriptions.create({
      customer: customerId,
      items: priceIds,
      collection_method: "charge_automatically",
      default_payment_method: paymentMethodId,
      metadata: {
        "client_id": +clientId,
        "billing_terms": +subscriptionParams.billing_terms,
        "no_of_payments": subscriptionParams.no_of_payments ? +subscriptionParams.no_of_payments : 0,
        "billing_frequency": +subscriptionParams.billing_frequency,
        "is_edited": false,
        "payment_method": "card",
        "buy_with_client": true,
      },
      ...subscription_data,
    });

    console.log(createSubscription, "====createSubscription=====");

    if (createSubscription) {
      // get payment link of subscription
      subscriptionData = {
        subscription_id: createSubscription.id,
        status: createSubscription.status,
        start_date: createSubscription.start_date
      }
    }
    return subscriptionData;
  };



  /** create subscription in Table */
  createSubscription = async (data) => {
    return await this.Models.ClientSubscriptions.create(data);
  };


  /** create subscription history in Table */
  createSubscriptionHistory = async (data) => {
    return await this.Models.ClientSubscriptionHistories.create(data);
  };

  /* create one time payment link */
  createOneTimePaymentLink = async (priceIds, clientId, subscriptionParams) => {
    let paymentData = {};
    // get payment link of one time subscription
    const paymentLink = await stripe.paymentLinks.create({
      line_items: priceIds,
      metadata: {
        "client_id": +clientId,
        "billing_terms": +subscriptionParams.billing_terms,
        "no_of_payments": subscriptionParams.no_of_payments ? +subscriptionParams.no_of_payments : 0,
        "billing_frequency": +subscriptionParams.billing_frequency,
      },
      payment_method_types: ['card'],
      after_completion: {
        type: "redirect",
        redirect: {
          url: `${process.env.BASE_URL}subscription-success`,
        }
      }
    });
    paymentData = {
      subscription_id: paymentLink.id,
      payment_link: paymentLink.url,
      start_date: paymentLink.created
    }
    return paymentData;
  };


  /* create One Time Subscription */
  createOneTimeSubscription = async (customerId, paymentMethodId, totalAmount) => {
    let paymentData = {};
    let amount = parseInt((totalAmount * 100).toFixed(0), 10);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in the smallest currency unit (e.g., cents for USD)
      currency: "usd", // Currency code (e.g., 'usd', 'eur')
      payment_method: paymentMethodId, // The Payment Method ID
      customer: customerId, // Optional: Attach a customer if you have one
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never"
      },
      confirm: true, // Immediately confirm the payment
    });
    console.log(paymentIntent, "===paymentIntent=====");
    paymentData = {
      subscription_id: paymentIntent.id,
      status: (paymentIntent.status == "succeeded" ) ? "active" : "inactive",
      start_date: paymentIntent.created
    }
    return paymentData;
  };

  checkMatchingData = async (subscriptionData) => {
    // Check if the array is empty
    if (subscriptionData.length === 0) {
      return 0;
    }
    // Get the reference object to compare
    const referenceObj = subscriptionData[0];

    // Iterate through each object in the array starting from the second object
    for (let i = 1; i < subscriptionData.length; i++) {
      const currentObj = subscriptionData[i];

      // Compare each key-value pair excluding "product_id"
      for (const key in referenceObj) {
        if (key !== "product_id" && key !="description" && key !="plan_id" && key !== "quantity" && key !== "unit_price" && key !== "unit_discount_type" && key !== "unit_discount" && key !== "is_delay_in_billing" && key !== "net_price" && key !== "billing_frequency" && referenceObj.hasOwnProperty(key)) {
          if (referenceObj[key] !== currentObj[key]) {
            return 0; // Return 0 if any key-value pair doesn't match
          }
        }
      }
    }
    return 1;
  }


  checkMatchingDataForClient = async (subscriptionData) => {
    // Check if the array is empty
    if (subscriptionData.length === 0) {
      return 0;
    }
    // Get the reference object to compare
    const referenceObj = subscriptionData[0];

    // Iterate through each object in the array starting from the second object
    for (let i = 1; i < subscriptionData.length; i++) {
      const currentObj = subscriptionData[i];

      // Compare each key-value pair excluding "product_id"
      for (const key in referenceObj) {
        if (key !== "product_id" && key !== "quantity" && key !== "unit_price" && key !== "net_price" && key !== "billing_frequency" && referenceObj.hasOwnProperty(key)) {
          if (referenceObj[key] !== currentObj[key]) {
            return 0; // Return 0 if any key-value pair doesn't match
          }
        }
      }
    }
    return 1;
  }

  getClientSubscriptionList = async (body) => {
    let havingCondition = {
      client_id: body.client_id,
      deleted_at: null,
    };

    if (body.search) {
      havingCondition = {
        [Op.or]: [
          { userName: { [Op.like]: `%${body.search}%` } }
        ],
        deleted_at: null,
        client_id: body.client_id,
      }
    }

    const allSubscriptionCount = await this.Models.ClientSubscriptions.findAll({
      attributes: { include: [[sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = client_subscriptions.client_id)"), "userName"]] },
      having: havingCondition,
    });

    const allSubscriptionCountWithoutSearch = await this.Models.ClientSubscriptions.count({
      where: {
        client_id: body.client_id,
        deleted_at: null,
      }
    });

    const allSubscriptions = await this.Models.ClientSubscriptions.findAll({
      attributes: {
        include: [[sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = client_subscriptions.client_id)"), "userName"], [sequelize.literal("DATE_FORMAT(FROM_UNIXTIME(client_subscriptions.start_date), '%d/%m/%Y')"), "subscription_start_date"], [sequelize.literal(`CASE WHEN client_subscriptions.billing_frequency = 2 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(client_subscriptions.start_date), INTERVAL 1 MONTH), '%d/%m/%Y')
        WHEN client_subscriptions.billing_frequency = 3 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(client_subscriptions.start_date), INTERVAL 3 MONTH), '%d/%m/%Y')
        WHEN client_subscriptions.billing_frequency = 4 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(client_subscriptions.start_date), INTERVAL 6 MONTH), '%d/%m/%Y')
        WHEN client_subscriptions.billing_frequency = 5 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(client_subscriptions.start_date), INTERVAL 1 YEAR), '%d/%m/%Y')
        WHEN client_subscriptions.billing_frequency = 6 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(client_subscriptions.start_date), INTERVAL 7 DAY), '%d/%m/%Y')
        WHEN client_subscriptions.billing_frequency = 7 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(client_subscriptions.start_date), INTERVAL 28 DAY), '%d/%m/%Y')
        ELSE null END`), "active_until"],[sequelize.literal("(SELECT invoice FROM client_subscription_histories WHERE client_subscription_histories.subscription_id = client_subscriptions.id AND client_subscription_histories.type IN (1,2) ORDER BY id DESC limit 1)"), "invoice"]]
      },
      having: havingCondition,
      include: [
        {
          model: this.Models.ClientSubscriptionPlans,
          attributes: { include: [[sequelize.literal("(SELECT name FROM line_items WHERE line_items.id = product_id)"), "product_name"], [sequelize.literal("(SELECT description FROM line_items WHERE line_items.id = product_id)"), "description"]] },
          as: "subscription_plans",
          where: { deleted_at: null },
          required: false,
        },
      ],
      offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
      limit: (body.limit == -1) ? allSubscriptionCount.length : parseInt(body.limit) || PAGINATION.LIMIT,
      order: [
        ['id', 'DESC'],
      ],
    });

    for (let i in allSubscriptions) {
      allSubscriptions[i].dataValues.subscription_payment_link = "";
      if(allSubscriptions[i].status == 0) {
        let payload = {
          subscription_id: allSubscriptions[i].id,
          client_id: body.client_id,
          payment_status: "pending",
        }
        console.log(payload, "====payload====")
        const subscriptionToken = refreshToken(payload);
        allSubscriptions[i].dataValues.subscription_payment_link = `${process.env.BASE_URL}payment-method/${subscriptionToken}`;
      }
    }

    return { list: allSubscriptions, total_records: allSubscriptionCount.length, total_count: allSubscriptionCountWithoutSearch, filtered_records: allSubscriptions.length }
  };



  expirePaymentLink = async (pamentLink) => {
    return await stripe.paymentLinks.update(
      pamentLink,
      { active: false }
    );
  };

  expireCheckOutSessionLink = async (sessionId) => {
    const getSession = await stripe.checkout.sessions.retrieve(
      sessionId
    );
    if(getSession && getSession.status == "open") {
      return await stripe.checkout.sessions.expire(
        sessionId,
      );
    }
  };

  cancelAtSubscription = async (cancelAt, subscriptionId) => {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at: cancelAt,
    });
  };


  cancelSubscriptionImmediately = async (subscriptionId) => {
    return await stripe.subscriptions.cancel(subscriptionId);
  };





  checkDefaultClientCountAccountManagerById = async (clientId) => {
    return await this.Models.AssignedUsers.count({
      where: {
        is_default: 1,
        user_id: clientId,
        type: ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER,
        deleted_at: null
      }
    });
  }


  getAssignedAccountManagerList = async (body) => {
    let havingCondition = {
      user_id: body.client_id,
      deleted_at: null,
      type: ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER,
    };

    if (body.search) {
      havingCondition = {
        [Op.or]: [
          { userName: { [Op.like]: `%${body.search}%` } }
        ],
        deleted_at: null,
        type: ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER,
      }
    }

    const AllAccountManagerCount = await this.Models.AssignedUsers.findAll({
      attributes: ["id", "user_id", "account_manager_id", "type", "assigned_date", "is_default", "deleted_at", "created_at", "updated_at", [sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = assigned_users.account_manager_id)"), "userName"]],
      having: havingCondition,
    });

    const AllAccountManagerCountWithoutSearch = await this.Models.AssignedUsers.count({
      where: {
        user_id: body.client_id,
        deleted_at: null,
        type: ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER,
      }
    });

    const getAllAccountManager = await this.Models.AssignedUsers.findAll({
      attributes: ["id", "user_id", "account_manager_id", "type", "assigned_date", "is_default", "deleted_at", "created_at", "updated_at", [sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = assigned_users.account_manager_id)"), "userName"], [sequelize.literal("DATE_FORMAT(FROM_UNIXTIME(assigned_users.assigned_date), '%M %e, %Y')"), "assigned_date_time"], [sequelize.literal("(SELECT first_name FROM users WHERE users.id = assigned_users.account_manager_id)"), "first_name"], [sequelize.literal("(SELECT last_name FROM users WHERE users.id = assigned_users.account_manager_id)"), "last_name"], [sequelize.literal("(SELECT user_image FROM users WHERE users.id = assigned_users.account_manager_id)"), "user_image"]],
      having: havingCondition,
      offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
      limit: (body.limit == -1) ? AllAccountManagerCount.length : parseInt(body.limit) || PAGINATION.LIMIT,
      order: [
        ['id', 'DESC'],
      ],
      raw: true,
    });

    return { list: getAllAccountManager, total_records: AllAccountManagerCount.length, total_count: AllAccountManagerCountWithoutSearch, filtered_records: getAllAccountManager.length }
  };



  /* check account manager by agent_id */
  checkAccountManagerById = async (accountManagerId) => {
    return await this.Models.Users.findOne({
      where: {
        id: accountManagerId,
        deleted_at: null,
        role_id: ROLES.ACCOUNTMANAGER
      }
    })
  };




  getAccountManagerList = async (body) => {
    let havingCondition = {
      deleted_at: null,
      role_id: ROLES.ACCOUNTMANAGER,
    };

    if (body.search) {
      havingCondition = {
        [Op.or]: [
          { userName: { [Op.like]: `%${body.search}%` } }
        ],
        deleted_at: null,
        role_id: ROLES.ACCOUNTMANAGER,
      }
    }

    const getAllAccountManager = await this.Models.Users.findAll({
      attributes: ["id", "role_id", "first_name", "last_name", "status", "deleted_at", "created_at", "updated_at", [sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = users.id)"),
        "userName"]],
      having: havingCondition,
      order: [
        ['id', 'DESC'],
      ],
      raw: true,
    });

    return { list: getAllAccountManager, total_records: getAllAccountManager.length }
  };



  /* create Coupon For Subscription */
  createCouponForSubscription = async (couponName, amount, discountType) => {
    let percentageOff = {};
    let amountOff = {};

    if (discountType == 1) {
      percentageOff = {
        percent_off: amount,
      }
    }
    if (discountType == 2) {
      amount = amount * 100;
      amountOff = {
        currency: "usd",
        amount_off: amount,
      }
    }
    const coupon = await stripe.coupons.create({
      name: couponName,
      duration: 'once',
      ...percentageOff,
      ...amountOff
    });
    return coupon.id;
  };

  checkClientExist = async (client_id) => {
    return await this.Models.AssignedUsers.findOne({
      where: {
        user_id: client_id,
        deleted_at: null
      }
    })
  }

  getClientDetailExist = async (client_id) => {
    return await this.Models.Users.findOne({
      where: {
        id: client_id,
        deleted_at: null
      }
    })
  }

  checkaccountManagerAndClientExist = async (body) => {
    const { client_id, account_manager_id } = body;

    return await this.Models.AssignedUsers.findOne({
      where: {
        user_id: client_id,
        account_manager_id: account_manager_id,
        deleted_at: null,
        type: ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER
      }
    })
  }

  checkAccountManagerisDefault = async (body) => {
    const { client_id, account_manager_id } = body;
    return await this.Models.AssignedUsers.findOne({
      where: {
        user_id: client_id,
        account_manager_id: account_manager_id,
        deleted_at: null,
        is_default: 1,
        type: ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER
      }
    })
  }

  setAccountManagerAsDefault = async (body) => {
    const { client_id, account_manager_id } = body;

    await this.Models.AssignedUsers.update({ is_default: 1 }, {
      where: {
        user_id: client_id,
        account_manager_id: account_manager_id,
        deleted_at: null,
        type: ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER
      }
    })

    this.Models.AssignedUsers.update({ is_default: 0 }, {
      where: {
        is_default: 1,
        user_id: client_id,
        account_manager_id: {
          [Op.ne]: account_manager_id
        },
        type: ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER

      }
    });

    return true


  }

  createDosusignLinkOld = async (clientDetail, documentBase64) => {

    let dsApi = new docusign.ApiClient();
    // dsApi.setOAuthBasePath("account-d.docusign.com"); // it should be domain only.
    dsApi.setOAuthBasePath(process.env.DOCUSIGN_DOMAIN); // it should be domain only.

    const jwtLifeSec = 60 * 60 * 24; // requested lifetime for the JWT is 10 min
    const results1 = await dsApi.requestJWTUserToken(
      process.env.DOCUSIGN_INTEGRATION_KEY, // Integration Key
      process.env.DOCUSIGN_USER_ID, // User ID
      "signature",
      // fs.readFileSync(path.join(__dirname, "private.key")), //Private key file
      fs.readFileSync(path.join(__dirname, '../', "private.key")), //Private key file
      jwtLifeSec
    );

    /** -----------------------DocuSign Integration--------------------------------- */
    /* --DocuSign API credentials-- */
    const accountId = process.env.DOCUSIGN_ACCOUNT_ID; // Account ID 
    const data = {
      access_token: results1.body.access_token,
      token_type: "Bearer",
      expires_in: 3600,
      scope: "signature",
    };
    const dsApiClient = new docusign.ApiClient();
    dsApiClient.setBasePath(process.env.DOCUSIGN_BASE_URL);
    dsApiClient.addDefaultHeader(
      "Authorization",
      "Bearer " + data.access_token
    );

    // create the document
    const document = docusign.Document.constructFromObject({
      documentBase64: documentBase64,
      documentId: '1',
      fileExtension: 'txt',
      name: clientDetail.subscription_title
    });

    const clientUserId = uuidv4(); 
    const signer = docusign.Signer.constructFromObject({
      email: "nasrudeen@softradix.in",
      name: clientDetail.name,
      recipientId: 1,
    });

    const signature = docusign.SignHere.constructFromObject({
      documentId: '1',
      name: 'signature',
      pageNumber: '1',
      recipientId: '1',
      tabLabel: 'signHere',
      tooltip: 'click here to add signature',
      xPosition: '280',  // Adjust this value based on your document's layout
      yPosition: '280'
    });

    signer.tabs = docusign.Tabs.constructFromObject({
      signHereTabs: [signature]
    });

    const customFields = docusign.CustomFields.constructFromObject({
      SignHere: signature,
      textCustomFields: [
        {
          name: 'client_id',
          value: clientDetail.id
        },
        {
          name: 'client_email',
          value: clientDetail.email
        }
      ]
    });

    const recipients = docusign.Recipients.constructFromObject({
      signers: [signer]
    });

    const envelopeDefinition = docusign.EnvelopeDefinition.constructFromObject({
      customFields: customFields,
      documents: [document],
      emailSubject: `Please sign this ${clientDetail.subscription_title} subscription contarct.`,
      recipients: recipients,
      status: 'sent',
    });

    const envelopesApi = new docusign.EnvelopesApi(dsApiClient);
    // Call Envelopes create API
    const results = await envelopesApi.createEnvelope(accountId, {
      envelopeDefinition,
    });


    if (results.status === "sent") {

      const recipientViewRequest = {
        authenticationMethod: "none",
        returnUrl: process.env.BASE_API_URL + `v1/docusign-completed/${clientDetail.subscription_id}?client_id=${clientDetail.id}&envelopId=${results.envelopeId}`,
        userName: clientDetail.client_name,
        email: clientDetail.email,
        name: clientDetail.client_name
      };
      const recipientView = await envelopesApi.createRecipientView(
        accountId,
        results.envelopeId,
        { recipientViewRequest }
      );
      return recipientView.url;
    }

  }


  createDosusignLink = async (clientDetail, documentBase64) => {
    try {
      const dsApi = new docusign.ApiClient();
      dsApi.setOAuthBasePath(process.env.DOCUSIGN_DOMAIN);
      
      const jwtLifeSec = 60 * 60 * 24;
      const results1 = await dsApi.requestJWTUserToken(
        process.env.DOCUSIGN_INTEGRATION_KEY, 
        process.env.DOCUSIGN_USER_ID,
        "signature",
        fs.readFileSync(path.join(__dirname, '../', "private.key")),
        jwtLifeSec
      );
  
      const dsApiClient = new docusign.ApiClient();
      dsApiClient.setBasePath(process.env.DOCUSIGN_BASE_URL);
      dsApiClient.addDefaultHeader("Authorization", "Bearer " + results1.body.access_token);
  
      const document = docusign.Document.constructFromObject({
        documentBase64: documentBase64,
        documentId: '1',
        fileExtension: 'txt',
        name: clientDetail.subscription_title
      });
  
      const clientUserId = uuidv4(); 
      const signer = docusign.Signer.constructFromObject({
        email: clientDetail.email,
        name: clientDetail.name,
        recipientId: '1',
        clientUserId: clientUserId
      });
  
      const signature = docusign.SignHere.constructFromObject({
        documentId: '1',
        name: 'signature',
        pageNumber: '1',
        recipientId: '1',
        tabLabel: 'signHere',
        tooltip: 'click here to add signature',
        xPosition: '280',
        yPosition: '280'
      });
  
      signer.tabs = docusign.Tabs.constructFromObject({
        signHereTabs: [signature]
      });
  
      const customFields = docusign.CustomFields.constructFromObject({
        textCustomFields: [
          { name: 'client_id', value: clientDetail.id },
          { name: 'client_email', value: clientDetail.email }
        ]
      });
  
      const recipients = docusign.Recipients.constructFromObject({
        signers: [signer]
      });
  
      const envelopeDefinition = docusign.EnvelopeDefinition.constructFromObject({
        customFields: customFields,
        documents: [document],
        emailSubject: `Please sign this ${clientDetail.subscription_title} subscription contract.`,
        recipients: recipients,
        status: 'sent',
      });
  
      const envelopesApi = new docusign.EnvelopesApi(dsApiClient);
      const results = await envelopesApi.createEnvelope(process.env.DOCUSIGN_ACCOUNT_ID, { envelopeDefinition });
  
      if (results.status === "sent") {
        const recipientViewRequest = {
          authenticationMethod: "none",
          returnUrl: process.env.BASE_API_URL + `v1/docusign-completed/${clientDetail.subscription_id}?client_id=${clientDetail.id}&envelopId=${results.envelopeId}`,
          userName: clientDetail.client_name,
          email: clientDetail.email,
          name: clientDetail.client_name,
          clientUserId: clientUserId,
        };
  
        const recipientView = await envelopesApi.createRecipientView(
          process.env.DOCUSIGN_ACCOUNT_ID,
          results.envelopeId,
          { recipientViewRequest }
        );
  
        return recipientView.url;
      }
    } catch (error) {
      console.error('Error during DocuSign process:', error);
      throw error;
    }
  };
  

  /** update subscription data */
  updateSubscription = async (data, subscriptionId) => {
    return await this.Models.ClientSubscriptions.update(data, { where: { id: subscriptionId } });
  };

  /** Get subscription detail */
  getSubscriptionDetail = async (subscriptionId) => {
    const subscriptionDetail = await this.Models.ClientSubscriptions.findOne({
      attributes: {
        include: [[sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = client_subscriptions.client_id)"), "userName"], [sequelize.literal("DATE_FORMAT(FROM_UNIXTIME(client_subscriptions.start_date), '%M %e, %Y')"), "subscription_start_date"], [sequelize.literal("(SELECT first_name FROM users WHERE users.id = client_subscriptions.client_id)"), "first_name"], [sequelize.literal("(SELECT last_name FROM users WHERE users.id = client_subscriptions.client_id)"), "last_name"], [sequelize.literal("(SELECT user_image FROM users WHERE users.id = client_subscriptions.client_id)"), "user_image"], [sequelize.literal("(SELECT company_name FROM users WHERE users.id = client_subscriptions.client_id)"), "company_name"], [sequelize.literal("(SELECT email FROM users WHERE users.id = client_subscriptions.client_id)"), "email"], [sequelize.literal("(SELECT phone_number FROM users WHERE users.id = client_subscriptions.client_id)"), "phone_number"], [sequelize.literal("(SELECT address FROM users WHERE users.id = client_subscriptions.client_id)"), "address"], [sequelize.literal("(SELECT address2 FROM users WHERE users.id = client_subscriptions.client_id)"), "address2"], [sequelize.literal("(SELECT country FROM users WHERE users.id = client_subscriptions.client_id)"), "country"], [sequelize.literal("(SELECT state FROM users WHERE users.id = client_subscriptions.client_id)"), "state"], [sequelize.literal("(SELECT city FROM users WHERE users.id = client_subscriptions.client_id)"), "city"], [sequelize.literal("(SELECT zipcode FROM users WHERE users.id = client_subscriptions.client_id)"), "zipcode"], [sequelize.literal("(SELECT SUM(unit_price * quantity) FROM client_subscription_plans WHERE client_subscription_plans.subscription_id = client_subscriptions.id AND client_subscription_plans.billing_frequency != 1 AND client_subscriptions.status != 4)"), "future_payment_amount"],
        [sequelize.literal(`CASE WHEN client_subscriptions.billing_frequency = 2 AND client_subscriptions.status != 4 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(client_subscriptions.start_date), INTERVAL 1 MONTH), '%M %e, %Y')
        WHEN client_subscriptions.billing_frequency = 3 AND client_subscriptions.status != 4 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(client_subscriptions.start_date), INTERVAL 3 MONTH), '%M %e, %Y')
        WHEN client_subscriptions.billing_frequency = 4 AND client_subscriptions.status != 4 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(client_subscriptions.start_date), INTERVAL 6 MONTH), '%M %e, %Y')
        WHEN client_subscriptions.billing_frequency = 5 AND client_subscriptions.status != 4 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(client_subscriptions.start_date), INTERVAL 1 YEAR), '%M %e, %Y')
        WHEN client_subscriptions.billing_frequency = 6 AND client_subscriptions.status != 4 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(client_subscriptions.start_date), INTERVAL 7 DAY), '%M %e, %Y')
        WHEN client_subscriptions.billing_frequency = 7 AND client_subscriptions.status != 4 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(client_subscriptions.start_date), INTERVAL 28 DAY), '%M %e, %Y')
        ELSE null END`), "end_date"], [sequelize.literal(`
          (SELECT price 
           FROM client_subscription_histories 
           WHERE client_subscription_histories.subscription_id = client_subscriptions.id 
             AND client_subscription_histories.type IN (1, 2) 
           ORDER BY client_subscription_histories.start_date DESC 
           LIMIT 1)
        `), "last_payment_amount"]]
      },
      where: {
        id: subscriptionId,
        deleted_at: null
      },
      include: [
        {
          model: this.Models.ClientSubscriptionPlans,
          attributes: { include: [[sequelize.literal("(SELECT name FROM line_items WHERE line_items.id = product_id)"), "product_name"], [sequelize.literal("(SELECT description FROM line_items WHERE line_items.id = product_id)"), "description"], [sequelize.literal("(SELECT no_of_payments FROM client_subscriptions WHERE client_subscriptions.id = subscription_id )"), "no_of_payments"],[sequelize.literal("(SELECT is_delay_in_billing FROM line_items WHERE line_items.id = product_id)"), "is_delay_in_billing"], [sequelize.literal("(SELECT DATE_FORMAT(FROM_UNIXTIME(start_date), '%M %e, %Y') FROM client_subscriptions WHERE client_subscriptions.id = subscription_id)"), "billing_start_date"],[sequelize.literal("(SELECT billing_terms FROM client_subscriptions WHERE client_subscriptions.id = subscription_id )"), "billing_terms"]] },
          as: "subscription_plans",
          where: { deleted_at: null },
          required: false,
        },
      ],
    });

    

    if (!subscriptionDetail) return null;
    const futurePayments = [];

    if (subscriptionDetail && (subscriptionDetail.status == 1)) {

      const startDate = moment(subscriptionDetail.dataValues.subscription_start_date, 'MMMM D, YYYY');
      const billingFrequency = subscriptionDetail.dataValues.billing_frequency;
      const futurePaymentAmount = subscriptionDetail.dataValues.future_payment_amount;

      let getPercentageAmountOfFee = (futurePaymentAmount * subscriptionDetail.global_processing_fee) / 100;
      getPercentageAmountOfFee = getPercentageAmountOfFee.toFixed(2);
      getPercentageAmountOfFee = +getPercentageAmountOfFee;

      let finalFuturePaymentAmount = Number(futurePaymentAmount) + (getPercentageAmountOfFee);
      subscriptionDetail.dataValues.future_payment_amount = finalFuturePaymentAmount;
      switch (billingFrequency) {
        case 2: // Monthly
          for (let i = 1; i < 13; i++) {
            futurePayments.push({ amount: finalFuturePaymentAmount, date: startDate.clone().add(i, 'months').format('MMMM D, YYYY h:mm a')});
          }
          break;
        case 3: // Quarterly
          for (let i = 1; i < 13; i++) {
            futurePayments.push({amount: finalFuturePaymentAmount, date: startDate.clone().add(i * 3, 'months').format('MMMM D, YYYY h:mm a')});
          }
          break;
        case 4: // Semi-Annually
          for (let i = 1; i < 13; i++) {
            futurePayments.push({ amount: finalFuturePaymentAmount, date: startDate.clone().add(i * 6, 'months').format('MMMM D, YYYY h:mm a')});
          }
          break;
        case 5: // Annually
          for (let i = 1; i < 13; i++) {
            futurePayments.push({ amount: finalFuturePaymentAmount, date: startDate.clone().add(i * 1, 'years').format('MMMM D, YYYY h:mm a')});
          }
          break;
        case 6: // Annually
          for (let i = 1; i < 53; i++) {
            futurePayments.push({ amount: finalFuturePaymentAmount, date: startDate.clone().add(i * 1, 'weeks').format('MMMM D, YYYY h:mm a')});
          }
          break;
        case 7: // Annually
          for (let i = 1; i < 14; i++) {
            futurePayments.push({ amount: finalFuturePaymentAmount, date: startDate.clone().add(i * 4, 'weeks').format('MMMM D, YYYY h:mm a')});
          }
          break;
        default:
          // No future payments for other billing frequencies
          []
          break;
      }

    };
  
    return {
      ...subscriptionDetail.dataValues,
      future_payments: futurePayments
    };

    // return subscriptionDetail;
  };


  /** get assigned agents by ids */
  getAssignedAgentsById = async (clientId, agentId) => {

    return this.Models.AssignedUsers.findAll({
      attributes: ["id", "user_id", "agent_id", "type", "assigned_date", "deleted_at", "created_at", "updated_at", [sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = assigned_users.agent_id)"), "userName"], [sequelize.literal("DATE_FORMAT(FROM_UNIXTIME(assigned_users.assigned_date), '%M %e, %Y')"), "assigned_date_time"], [sequelize.literal("(SELECT first_name FROM users WHERE users.id = assigned_users.agent_id)"), "first_name"], [sequelize.literal("(SELECT last_name FROM users WHERE users.id = assigned_users.agent_id)"), "last_name"]],
      where: {
        user_id: clientId,
        agent_id: agentId,
        deleted_at: null
      },
      raw: true
    });
  };


  /** get assigned account Manager by ids */
  getAssignedAccountManagersById = async (clientId, accountManagerId) => {
    return this.Models.AssignedUsers.findAll({
      attributes: ["id", "user_id", "account_manager_id", "type", "assigned_date", "deleted_at", "created_at", "updated_at", [sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = assigned_users.account_manager_id)"), "userName"], [sequelize.literal("DATE_FORMAT(FROM_UNIXTIME(assigned_users.assigned_date), '%M %e, %Y')"), "assigned_date_time"], [sequelize.literal("(SELECT first_name FROM users WHERE users.id = assigned_users.account_manager_id)"), "first_name"], [sequelize.literal("(SELECT last_name FROM users WHERE users.id = assigned_users.account_manager_id)"), "last_name"]],
      where: {
        user_id: clientId,
        account_manager_id: accountManagerId,
        deleted_at: null
      },
      order: [["id", "DESC"]],
      raw: true
    });
  };

  /* create login time */
  createLoginTime = async (data) => {
    return this.Models.UserLoginTime.create(data);
  }


  retrieveInvoicePdf = async (invoiceId) => {
    let invoicePdf = await stripe.invoices.retrieve(invoiceId);
    return invoicePdf.invoice_pdf;
    // return invoicePdf;
  };


  retrieveSubscription = async (subscriptionId) => {
    let subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription.default_payment_method;
  };

  retrievePaymentMethod = async (paymentMethodId) => {
    let getPaymentmethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (getPaymentmethod) {
      return getPaymentmethod
    }
    return null;
  };

  retrieveSession = async (subscriptionId) => {
    let session = await stripe.checkout.sessions.retrieve(subscriptionId);
    return session.payment_intent
  };

  retrievePaymentIntent = async (paymentIntentId) => {
    let paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent) {
      return paymentIntent.payment_method
    }
    return null;
  };


  updateDefaultPaymentMethod = async (customerId, paymentmethodId) => {
    return await stripe.customers.update(
      customerId,
      {
        invoice_settings: {
          default_payment_method: paymentmethodId, // Set the default payment method
        },
      }
    )
  };

  attachPaymentMethodToCustomer = async (customerId, paymentmethodId) => {
    let getPaymentMethod =  await stripe.paymentMethods.attach(paymentmethodId, {
      customer: customerId,
    });
    return getPaymentMethod;
  };

  paymentCreateForCustomer = async (amount, customerId) => {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: parseInt((amount * 100).toFixed(0), 10), // Amount in cents
      currency: 'usd',
      customer: customerId, // Existing customer ID
      setup_future_usage: 'off_session', // Save payment method for future use
    });
    return paymentIntent.id;
  };

  getCardDetailOfClient = async () => {
    const allSubscriptions = await this.Models.ClientSubscriptions.findAll({
      where: {
        status: {
          [Op.ne]: 0
        },
        stripe_subscription_id: {
          [Op.ne]: null
        }
      },
      raw: true,
      order: [
        ['id', 'DESC'],
      ],
    });

    for (let i in allSubscriptions) {

      if (allSubscriptions[i].billing_frequency == 1) {

        let getPaymentIntent = await this.retrieveSession(allSubscriptions[i].stripe_subscription_id);
        if (getPaymentIntent) {

          let getPaymentMethod = await this.retrievePaymentIntent(getPaymentIntent);
          if (getPaymentMethod) {
            let getCardDetail = await this.retrievePaymentMethod(getPaymentMethod);
            if (getCardDetail) {
              await this.Models.ClientSubscriptions.update({
                card: getCardDetail.card.brand,
                card_last_digit: getCardDetail.card.last4
              }, {
                where: {
                  id: allSubscriptions[i].id
                }
              });
            }

          }
        }

      } else {

        let getPaymentMethod = await this.retrieveSubscription(allSubscriptions[i].stripe_subscription_id);
        if (getPaymentMethod) {
          let getCardDetail = await this.retrievePaymentMethod(getPaymentMethod);
          if (getCardDetail) {
            await this.Models.ClientSubscriptions.update({
              card: getCardDetail.card.brand,
              card_last_digit: getCardDetail.card.last4
            }, {
              where: {
                id: allSubscriptions[i].id
              }
            });
          }
        }
      }
    }
    return true;
  };


  /** Get Recent Activity  */
  getRecentActitvity = async (clientId, userDetail) => {
    let getRecentActivity = await this.Models.RecentActivities.findAll({
      attributes: { include: [[sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = recent_activities.user_id)"), "userName"],[sequelize.literal("(SELECT user_image FROM users WHERE users.id = recent_activities.user_id)"), "user_image"], [sequelize.literal("(SELECT name FROM projects WHERE projects.id = recent_activities.project_id)"), "project_name"], [sequelize.literal("(SELECT title FROM tasks WHERE tasks.id = recent_activities.task_id)"), "task_name"], [sequelize.literal("(SELECT name FROM project_columns WHERE project_columns.id = recent_activities.project_column_id)"), "project_column_name"]] },
      where: {
        client_id: clientId,
        deleted_at: null,
        type: {
          [Op.notIn]: [7,8,9] //This is for notification. No need to show in recent activity
        }
      },
      limit: 5,
      order: [["id", "DESC"]],
      raw: true,
    });

    if(getRecentActivity.length > 0) {

      for (let i in getRecentActivity) {
        let userName = getRecentActivity[i].user_id == userDetail.id ? `You` : getRecentActivity[i].userName;
        switch (getRecentActivity[i].type) {
          case RECENT_ACTIVITY_TYPE.PROJECT_CREATED:
            getRecentActivity[i].message = `${userName} created the ${getRecentActivity[i].project_name} project successfully.`;
            break;
          case RECENT_ACTIVITY_TYPE.TASK_CREATED:
            getRecentActivity[i].message = `${userName} created the ${getRecentActivity[i].task_name} task successfully in the ${getRecentActivity[i].project_name} project.`;
            break;
          case RECENT_ACTIVITY_TYPE.TASK_UPDATED:
            getRecentActivity[i].message = `${userName} updated the ${getRecentActivity[i].task_name} task successfully in the ${getRecentActivity[i].project_name} project.`;
            break;
          case RECENT_ACTIVITY_TYPE.TASK_MOVE:
            getRecentActivity[i].message = `${userName} moved the ${getRecentActivity[i].task_name} task to list ${getRecentActivity[i].project_column_name} in the ${getRecentActivity[i].project_name} project.`;
            break;
          case RECENT_ACTIVITY_TYPE.TASK_DELETE:
            getRecentActivity[i].message = `${userName} deleted the ${getRecentActivity[i].task_name} task successfully in the ${getRecentActivity[i].project_name} project.`;
            break;
          case RECENT_ACTIVITY_TYPE.PROJECT_DELETE:
            getRecentActivity[i].message = `${userName} deleted the ${getRecentActivity[i].project_name} project successfully.`;
            break;
          case RECENT_ACTIVITY_TYPE.TASK_COMPLETE:
            getRecentActivity[i].message = `${userName} has successfully ${getRecentActivity[i].project_column_name} the ${getRecentActivity[i].task_name} task in the ${getRecentActivity[i].project_name} project successfully.`;
            break;
          default:
            getRecentActivity[i].message = "";
        }
      }
    }

    return getRecentActivity;
  };


  /** Get Tasks List  */
  getTasksList = async (body, clientId, userDetail) => {

    let currentDate = new Date();

    let whereCondition = {
      user_id: clientId,
      deleted_at: null,
      due_date_time: {
        [Op.between]: [new Date(moment(currentDate).startOf("day")), new Date(moment(currentDate).endOf("day"))],
      }
    };

    if (body.date && body.date != "") {
      whereCondition = {
        user_id: clientId,
        deleted_at: null,
        due_date_time: {
          [Op.between]: [new Date(moment(body.date).startOf("day")), new Date(moment(body.date).endOf("day"))],
        }
      }
    }

    if(userDetail.role_id == ROLES.AGENT) {
      let getAssignedAgentClients = await this.Models.AssignedUsers.findAll({
        attributes: ["id", "user_id", "agent_id", "deleted_at"],
        where: {
          agent_id: userDetail.id,
          deleted_at: null
        },
        raw: true
      });
      let clientIds = getAssignedAgentClients.map(val=> val.user_id);
      whereCondition = {
        [Op.or]: [{
          user_id: clientIds,
        },{
          user_id: userDetail.id,
        }],
        deleted_at: null,
        due_date_time: {
          [Op.between]: [new Date(moment(currentDate).startOf("day")), new Date(moment(currentDate).endOf("day"))],
        }
      };

      if (body.date && body.date != "") {
        whereCondition = {
          [Op.or]: [{
            user_id: clientIds,
          },{
            user_id: userDetail.id,
          }],
          deleted_at: null,
          due_date_time: {
            [Op.between]: [new Date(moment(body.date).startOf("day")), new Date(moment(body.date).endOf("day"))],
          }
        };
      }
    }



    const allTaskCount = await this.Models.Tasks.findAll({
      attributes: { include: [[sequelize.literal("(SELECT name FROM project_columns WHERE project_columns.id = tasks.status)"), "project_column_status"], [sequelize.literal("(SELECT deleted_at FROM projects WHERE projects.id = tasks.project_id)"), "project_deleted_at"]] },
      where: whereCondition,
      having: {
        project_column_status: {
          [Op.ne]: "Completed"
        },
        project_deleted_at: null
      },
    });

    const getAllTasks = await this.Models.Tasks.findAll({
      attributes: { include: [[sequelize.literal("(SELECT name FROM project_columns WHERE project_columns.id = tasks.status)"), "project_column_status"], [sequelize.literal("(SELECT deleted_at FROM projects WHERE projects.id = tasks.project_id)"), "project_deleted_at"]] },
      where: whereCondition,
      having: {
        project_column_status: {
          [Op.ne]: "Completed"
        },
        project_deleted_at: null
      },
      offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
      limit: (body.limit == -1) ? allTaskCount.length : parseInt(body.limit) || PAGINATION.LIMIT,
      order: [
        ['id', 'DESC'],
      ],
      raw: true,
    });

    return { list: getAllTasks, total_records: allTaskCount.length, filtered_records: getAllTasks.length }
  };

  /** Get Client By Id  */

  findClientById = async (clientID) => {
    return await this.Models.Users.findOne({
      where: {
        id: clientID,
        deleted_at: null,
        role_id: [ROLES.CLIENT, ROLES.AGENT, ROLES.USER]
      }
    })
  }

  /** Get Agent By Id  */
  findAgentsById = async (agent_id, user) => {
    return await this.Models.AssignedUsers.findOne({
      where: {
        type: ASSIGNED_USERS.CLIENTS_TO_AGENT,
        agent_id: agent_id,
        user_id: user,
        deleted_at: null,
      },
      raw: true
    });
  }


  /** Get Agent By Id  */
  findAgentsByID = async (agentID) => {
    return await this.Models.Users.findOne({
      where: {
        id: agentID,
        deleted_at: null,
        role_id: [ROLES.AGENT, ROLES.USER]
      }
    })
  }

  getPasswordManagerslist = async (body, user) => {

    let userId = user.id;
    if(user.role_id == ROLES.USER) {
      userId = user.added_by;
    };

    let whereCondition = {
      deleted_at: null,
    }

    let totalCountwhereCondition = {
      deleted_at: null,
    }

    if(body.search) {
      whereCondition = {
        deleted_at: null,
        [Op.or]: [
          { site_name: { [Op.like]: `%${body.search}%` } },
          { user_name: { [Op.like]: `%${body.search}%` } }
        ]
      }
    }

    let requiredField = false;

    if (user.role_id === ROLES.CLIENT) {

      let getAllClientUsers = await this.Models.Users.findAll({
        attributes: ["id", "added_by", "deleted_at"],
        where: {
          added_by: user.id,
          deleted_at: null
        },
        raw: true
      });
      let userIds = getAllClientUsers.map(val=> val.id);
      userIds.push(user.id);
      whereCondition.user_id = userIds;
      totalCountwhereCondition.user_id = userIds;
    }

    let assignedAgentwhereCondition = {
      deleted_at: null,
    }

    if (user.role_id === ROLES.USER) {

      let getAllClientUsers = await this.Models.Users.findAll({
        attributes: ["id", "added_by", "added_by_user", "deleted_at"],
        where: {
          added_by: user.added_by,
          deleted_at: null
        },
        raw: true
      });
      let getAllClientUserIds = getAllClientUsers.map(val=> val.id);
      getAllClientUserIds.push(user.id, user.added_by, user.added_by_user);

      whereCondition.user_id = getAllClientUserIds;
      totalCountwhereCondition.user_id = getAllClientUserIds;
    }


    if (user.role_id === ROLES.AGENT) {
        let getPasswordManagerId = await this.Models.assignedAgentPasswords.findAll({
          where: {
            agent_id: user.id,
            deleted_at: null,
          },
          raw: true
        });
        let getPasswordIds = await getPasswordManagerId.map(manager => manager.password_manager_id );
        whereCondition.id = getPasswordIds;
        totalCountwhereCondition.id = getPasswordIds;
        if(user.role_id === ROLES.AGENT) {
          requiredField = true;
        }

      // let getAllClient = await this.Models.assignedAgentPasswords.findAll({
      //   where: {
      //     agent_id: user.id,
      //     deleted_at: null,
      //   },
      //   raw: true
      // });
      // let clientIds = await getAllClient.map(clients => clients.client_id);

      // let getAllClientUsers = await this.Models.Users.findAll({
      //   attributes: ["id", "added_by", "deleted_at"],
      //   where: {
      //     added_by: clientIds,
      //     deleted_at: null
      //   },
      //   raw: true
      // });
      // let getAllClientUserIds = getAllClientUsers.map(val => val.id);
      // // let agentIds = await getAllClient.map(agents => agents.agent_id);
      // whereCondition.user_id = clientIds.concat(getAllClientUserIds);
      // clientIds.push(user.id);
      // totalCountwhereCondition.user_id = clientIds.concat(getAllClientUserIds);;
      // // assignedAgentwhereCondition.agent_id = agentIds;
      // if(user.role_id === ROLES.AGENT) {
      //   requiredField = true;
      // }
    }

    let getPasswordManagerTotalCount = await this.Models.PasswordManager.findAll({
      include: [
        {
          model: this.Models.assignedAgentPasswords,
          as: 'password_assigned_agent',
          attributes: ['password_manager_id', 'client_id', 'agent_id'],
          where: assignedAgentwhereCondition,
          // where: {
          //   deleted_at: null
          // },
          required: requiredField,
        },
      ],
      where: totalCountwhereCondition,
    });

    let getPasswordManagerCount = await this.Models.PasswordManager.findAll({
      include: [
        {
          model: this.Models.assignedAgentPasswords,
          as: 'password_assigned_agent',
          attributes: ['password_manager_id', 'client_id', 'agent_id'],
          where: assignedAgentwhereCondition,
          // where: {
          //   deleted_at: null
          // },
          required: requiredField,
        },
      ],
      where: whereCondition,
    });

    let getPasswordManager = await this.Models.PasswordManager.findAll({
      include: [
        {
          model: this.Models.assignedAgentPasswords,
          as: 'password_assigned_agent',
          attributes: ['password_manager_id', 'client_id', 'agent_id'],
          where: assignedAgentwhereCondition,
          // where: {
          //   deleted_at: null
          // },
          required: requiredField,
          include: [
            {
              model: this.Models.Users,
              as: 'agent_details',
              attributes: ['user_image']
            },
          ]
        },
      ],
      where: whereCondition,
      order: [["id", "DESC"]],
      offset: (parseInt(body.start) === 0 ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT)) || PAGINATION.START,
      limit: (body.limit === -1 ? getPasswordManagerCount.length : parseInt(body.limit)) || PAGINATION.LIMIT,
    });
    return { list: getPasswordManager, total_count: getPasswordManagerTotalCount.length, total_records:  getPasswordManagerCount.length, filtered_records: getPasswordManager.length }
  }

  passwordDetailsExist = async (params) => {
    return await this.Models.PasswordManager.findOne({
      where: {
        id: params,
        deleted_at: null
      }
    })
  }

  updatePassManager = async (data, passManager_id) => {
    return await this.Models.PasswordManager.update(data, {
      where: {
        id: passManager_id,
        deleted_at: null
      }
    })
  }

  /** compare arrayes  */
  getDeletedAssignedUserIds = async (array1, array2) => {
    const result = array2.filter(value => !array1.includes(value));
    return result;
  };

  deleteAlreadyAssignedUsers = async (data, passwordManagerId, assignedUserId) => {
    return await this.Models.assignedAgentPasswords.update(
      data,
      {
        where: {
          password_manager_id: passwordManagerId,
          agent_id: assignedUserId,
        }
      })
  }

  deleteAssignedAgentsInPassword = async (data, passwordManagerId) => {
    return await this.Models.assignedAgentPasswords.update(
      data,
      {
        where: {
          password_manager_id: passwordManagerId,
        }
      })
  }

  deletePassManager = async (data, pmId, userid) => {
    await this.Models.PasswordManager.update(
      data,
      {
        where: {
          // user_id: userid,
          id: pmId,
          deleted_at: null
        }
      })

    return await this.Models.assignedAgentPasswords.update(
      data,
      {
        where: {
          // client_id: userid,
          password_manager_id: pmId,
          deleted_at: null
        }
      })
  }

  passwordManagerdetails = async (password_manager_id, user) => {
    return await this.Models.PasswordManager.findOne({
      include: [
        {

          model: this.Models.assignedAgentPasswords,
          as: 'password_assigned_agent',
          attributes: ['agent_id'],
          where: {
            deleted_at: null
          },
          required: false
        },
      ],
      where: {
        id: password_manager_id,
        deleted_at: null,
        // user_id: user
      }
    })

  }

  uploadFileDetails = async (body) => {
    return await this.Models.SharedFiles.create(body)
  }

  updateSharedFileDetails = async (file_key, file_id) => {
    return await this.Models.SharedFiles.update(file_key,
      {
        where: {
          id: file_id,
          deleted_at: null
        }
      })

  }

  sharedFileExist = async (file_id, user) => {
    return await this.Models.SharedFiles.findOne({
      where: {
        id: file_id,
        // client_id: user,
        deleted_at: null
      }
    })
  }

  getFilesList = async (user, body) => {

    let whereCondition = {
      client_id: user,
      deleted_at: null,
    };
    let filesCount = await this.Models.SharedFiles.count({
      where: whereCondition
    });

    if(body.search && body.search !=""){
      whereCondition.file_name = { [Op.like]: `%${body.search}%` };
    }

    const files = await this.Models.SharedFiles.findAll({
      where: whereCondition,
      order: [["id", "DESC"]],
      offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
      limit: (body.limit == -1) ? filesCount : parseInt(body.limit) || PAGINATION.LIMIT,
      raw: true
    })
    return { list: files, total_records: filesCount, total_count: filesCount, filtered_records: files.length }
  }

  findAgentById = async (agent_id) => {
    return await this.Models.AssignedUsers.findAll({
      attributes: ["user_id"],
      where: {
        type: ASSIGNED_USERS.CLIENTS_TO_AGENT,
        agent_id: agent_id,
        deleted_at: null
      },
      raw: true
    })
  };


  findAllAgentsOfClientById = async (clientId) => {
    return await this.Models.AssignedUsers.findAll({
      attributes: ["user_id", "agent_id", "type", "deleted_at"],
      where: {
        type: ASSIGNED_USERS.CLIENTS_TO_AGENT,
        user_id: clientId,
        deleted_at: null
      },
      raw: true
    })
  };

  findAllUsersOfClientById = async (clientId) => {
    let getAllUsers =  await this.Models.Users.findAll({
      attributes: ["id", "added_by", "deleted_at"],
      where: {
        added_by: clientId,
        deleted_at: null
      },
      raw: true
    });
    let allUserIds = getAllUsers.map(val => val.id);
    return allUserIds;
  }

  /** Get all client groups in commetChat */
  // getAllGroups = async (clientId) => {
  //   const allTaskGroups = await this.Models.Tasks.findAll({
  //     attributes: ["id", "user_id", "guid", "deleted_at"],
  //     where: {
  //       user_id: clientId,
  //       guid: {
  //         [Op.ne]: null
  //       },
  //       deleted_at: null,
  //     },
  //     raw: true,
  //   });
  //   let groupIds = [];
  //   if (allTaskGroups.length > 0) {
  //     let getTaskGroupIds = allTaskGroups.map(val => val.guid);
  //     groupIds.push(getTaskGroupIds);
  //   }

  //   const getAllSupportGroups = await this.Models.Supports.findAll({
  //     attributes: ["id", "user_id", "deleted_at"],
  //     where: {
  //       user_id: clientId,
  //       deleted_at: null,
  //     },
  //     raw: true,
  //   });

  //   if (getAllSupportGroups.length > 0) {
  //     let getSupportGroupIds = getAllSupportGroups.map(val => val.id);
  //     groupIds.push(getSupportGroupIds);
  //   }
  //   groupIds = groupIds.flat();
  //   return groupIds;
  // };

  /** Get all client groups in commetChat */
  getAllGroups = async (clientId) => {
    const [allTaskGroups, getAllSupportGroups] = await Promise.all([
      this.Models.Tasks.findAll({
        attributes: ["id", "user_id", "guid", "deleted_at"],
        where: {
          user_id: clientId,
          guid: {
            [Op.ne]: null
          },
          deleted_at: null,
        },
        raw: true,
      }),
      this.Models.Supports.findAll({
        attributes: ["id", "user_id", "deleted_at"],
        where: {
          user_id: clientId,
          deleted_at: null,
        },
        raw: true,
      })
    ]);
  
    let groupIds = [];
  
    if (allTaskGroups.length > 0) {
      let getTaskGroupIds = allTaskGroups.map(val => val.guid);
      groupIds.push(...getTaskGroupIds);
    }
  
    if (getAllSupportGroups.length > 0) {
      let getSupportGroupIds = getAllSupportGroups.map(val => val.id);
      groupIds.push(...getSupportGroupIds);
    }
    return groupIds;
  };

  /** Get default account manager */
  getDefaultAccManager = async (client_id) => {
    return await this.Models.AssignedUsers.findOne({
      attributes: ["account_manager_id"],
      include: [
        {
          model: this.Models.Users,
          as: "Account_manager_details",
          attributes: ["email", "user_image", [sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = Account_manager_details.id)"), "userName"], [sequelize.literal("LOWER((SELECT name FROM roles WHERE roles.id = Account_manager_details.role_id limit 1))"), "role_name"]],
          where: { deleted_at: null },
          required: true
        },
      ],
      where: {
        user_id: client_id,
        deleted_at: null,
        is_default: 1,
        account_manager_id: { [Op.ne]: null }
      },
      raw: true
    })
  }

  checkClientExist = async (client_id) => {
    await this.Models.Users.findOne({
      attribute: ["id"],
      where: {
        id: client_id,
        role_id: ROLES.CLIENT,
        deleted_at: null
      }
    })
  };


  // cardExistInStripe = async (data) => {
  //   const token = await stripe.tokens.retrieve(data.token);
  //   let cardDetail = {};
  //   if(token) {
  //     cardDetail = {
  //       brand: token.card.brand,
  //       exp_month: token.card.exp_month,
  //       exp_year: token.card.exp_year,
  //       last4: token.card.last4,
  //     }
  //   }
  //   return cardDetail;
  // }


  createPaymentMethodInStripe = async (token) => {

    console.log(token, "====token====");

    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        token: token,
      },
      allow_redisplay: "always" 
    });
    console.log(paymentMethod, "====paymentMethod====");

    let cardDetail = {};
    if(paymentMethod) {
      cardDetail = {
        id: paymentMethod.id,
        brand: paymentMethod.card.brand,
        exp_month: paymentMethod.card.exp_month,
        exp_year: paymentMethod.card.exp_year,
        last4: paymentMethod.card.last4,
      }
    }
    return cardDetail
  }


  /* add card in stripe */
  createCardInStripe = async (customerId, data, userId, paymentMethodId) => {
    // Create a card

    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    let createCards = [];
    let globalDefault = data.is_default;
    let getCardExpiry = moment(`${data.exp_year}-${data.exp_month}`, "YYYY-MM").endOf('month').unix();
    if (data.is_default == 1) {
      globalDefault = 1;
      let updateParams = {
        default_payment_method: paymentMethodId,
      }

      if(data.payment_method == "bank_account") {

        let getTaxId = await this.Models.SubscriptionSettings.findOne({
          attributes: ["tax_rate_id"],
          where: {
            deleted_at: null
          },
          raw: true
        });
  
        if(getTaxId && getTaxId.tax_rate_id !="" && getTaxId.tax_rate_id != null) {
          updateParams.default_tax_rates = [getTaxId.tax_rate_id];
        }
      }
      if(data.stripe_subscription_id){
        await this.updateSubscriptionsParam(data.stripe_subscription_id, updateParams);
      }

      await this.Models.Cards.update({
        is_default: 0
      },{
        where: {
          payment_method_id: {
            [Op.ne]: paymentMethodId
          },
          user_id: userId,
          subscription_id: data.subscription_id,
          deleted_at: null,
          type: 0
        }
      });

      createCards.push({
        user_id: userId,
        payment_method_id: paymentMethodId,
        is_default: data.is_default,
        global_default: globalDefault,
        expiry_date: getCardExpiry,
        last_digit: data.last_digit,
        type: 0,
        subscription_id: data.subscription_id
      });
      
    }else if(data.is_default == 2) {

      let getUserAllSubscriptions = await this.Models.ClientSubscriptions.findAll({
        attributes: ["id", "stripe_subscription_id", "payment_method"],
        where: {
          client_id: userId,
          deleted_at: null,
          billing_frequency: {
            [Op.ne]: 1
          },
          status: [1,2],
          payment_method: "card"
        },
        raw: true
      });

      await this.Models.Cards.update({
        is_default: 0,
        global_default: 0
      },{
        where: {
          user_id: userId,
          deleted_at: null,
          type: 0
        }
      });

  
      let updateParams = {
        default_payment_method: paymentMethodId,
      }

      // let getTaxId = await this.Models.SubscriptionSettings.findOne({
      //   attributes: ["tax_rate_id"],
      //   where: {
      //     deleted_at: null
      //   },
      //   raw: true
      // });

      for(let i in getUserAllSubscriptions) {

        if(getUserAllSubscriptions[i].id == data.subscription_id) {
          globalDefault = 1;
        }

        // if(getUserAllSubscriptions[i].payment_method == "bank_account"){
        //   if(getTaxId && getTaxId.tax_rate_id !="" && getTaxId.tax_rate_id != null) {
        //     updateParams.default_tax_rates = [getTaxId.tax_rate_id];
        //   }
        // }
        await this.updateSubscriptionsParam(getUserAllSubscriptions[i].stripe_subscription_id, updateParams);

        // let updateSubDetail = {
        //   payment_method: "card"
        // };

        // let subCondition = {
        //   id: getUserAllSubscriptions[i].id,
        // };
        // await this.updateSubscriptionWithCondition(updateSubDetail, subCondition);
        
        createCards.push({
          user_id: userId,
          payment_method_id: paymentMethodId,
          is_default: 1,
          global_default: globalDefault,
          expiry_date: getCardExpiry,
          last_digit: data.last_digit,
          type: 0,
          subscription_id: getUserAllSubscriptions[i].id
        });
      }

    }else {
      createCards.push({
        user_id: userId,
        payment_method_id: paymentMethodId,
        is_default: data.is_default,
        global_default: globalDefault,
        expiry_date: getCardExpiry,
        last_digit: data.last_digit,
        type: 0,
        subscription_id: data.subscription_id
      });
    }

    await this.Models.Cards.bulkCreate(createCards);
    return paymentMethodId;
  };


  /** create card */
  createCard = async (data) => {
    return await this.Models.Cards.create(data);
  };

  /** create list */
  getCardList = async (customerId, subscriptionId) => {
    try {
      const cards = await stripe.paymentMethods.list({
        type: "card",
        customer: customerId,
      });

      let formattedCards = [];
      if(cards.data.length > 0) {
        for(let i in cards.data) {

          let findCard = await this.Models.Cards.findOne({
            where: {
              payment_method_id: cards.data[i].id,
              subscription_id: subscriptionId,
              deleted_at: null
            },
            raw: true
          });
          formattedCards.push({
            id: cards.data[i].id,
            name: cards.data[i].card.name,
            brand: cards.data[i].card.brand,
            last4: cards.data[i].card.last4,
            exp_month: cards.data[i].card.exp_month,
            exp_year: cards.data[i].card.exp_year,
            is_default: (findCard && findCard.is_default == 1) ? 1 : 0
          })
        }
      }

      return formattedCards;
    } catch (error) {
      console.error('Error retrieving card list:', error);
      throw error;
    }
  }

  /** card detail */

  getCardData = async (customerId, paymentMethodId, cardId) => {
    try {

      const card = await stripe.paymentMethods.retrieve(
        paymentMethodId
      );

      let findCard = await this.Models.Cards.findOne({
        where: {
          id: cardId,
          payment_method_id: paymentMethodId,
          deleted_at: null
        },
        raw: true
      });

      // Format the cards with the default value indication
      let formattedCards = {
        id: cardId,
        payment_method_id: card.id,
        is_default: (findCard && findCard.is_default == 1) ? 1 : 0,
      };

      if(card.type == "card") {
        formattedCards.name = card.card.name,
        formattedCards.brand = card.card.brand,
        formattedCards.exp_month = card.card.exp_month,
        formattedCards.exp_year = card.card.exp_year,
        formattedCards.type = 0
      }else {
        formattedCards.name = findCard.name,
        formattedCards.account_holder_name = findCard.bank_name,
        formattedCards.last4 = findCard.last_digit,
        formattedCards.type = 1
      }

      return formattedCards;
    } catch (error) {
      console.error('Error retrieving card detail:', error);
      throw error;
    }
  }

  /** card deleted */
  deleteCardDetail = async (userId, cardId, findCard, customerId) => {
    try {
      console.log(findCard, "====findCard=in function==");

      let subscriptionId = findCard.subscription_id;

      if(findCard && findCard.is_default == 1) {

        // const cards = await stripe.paymentMethods.list({
        //   customer: customerId,
        //   type: type
        // });
        const cards = await this.Models.Cards.findAll({
          where: {
            payment_method_id: {
              [Op.ne]: cardId
            },
            user_id: userId,
            subscription_id: subscriptionId,
            deleted_at: null,
            type: findCard.type
          },
          raw: true
        });
        console.log(cards, "====cards===");

        if (cards.length > 0) {

          for(let i in cards) {

            let getPaymentMethod = await this.Models.Cards.findOne({
              where: {
                payment_method_id: cards[i].payment_method_id,
                subscription_id: subscriptionId,
                deleted_at: null,
                user_id: userId,
              },
              raw: true
            });
            console.log(getPaymentMethod, "====getPaymentMethod===");

            if(getPaymentMethod) {
    
              let getdefaultCard = await this.Models.Cards.findOne({
                where: {
                  user_id: userId,
                  payment_method_id: {
                    [Op.ne]: cardId
                  },
                  subscription_id: subscriptionId,
                  deleted_at: null,
                  type: findCard.type,
                  is_default: 1
                },
                raw: true
              });

              console.log(getdefaultCard, "====getdefaultCard======");

              if(!getdefaultCard) {
                console.log("====enter here======");

                // if(getCardInfo.type == 0){
                //   await stripe.paymentMethods.attach(getPaymentMethod.payment_method_id, {
                //     customer: customerId,
                //   });
                // }
                console.log(getPaymentMethod.payment_method_id, "====getPaymentMethod.payment_method_id======");
    
                await this.Models.Cards.update({
                  is_default: 1
                },{
                  where: {
                    payment_method_id: getPaymentMethod.payment_method_id,
                    user_id: userId,
                    subscription_id: subscriptionId,
                    deleted_at: null,
                    type: findCard.type
                  }
                });
              }
            }
          }
        }
      }

      let cardCountCondition = {
        payment_method_id: cardId,
        user_id: userId,
        deleted_at: null,
        type: findCard.type
      };
      let getCardCount = await this.getPaymentMethodInfoByCondition(cardCountCondition);
      console.log(getCardCount, "====getCardCount=====");
      if(getCardCount == 1){

        if(findCard.type == 0) {
          await stripe.paymentMethods.detach(
            cardId
          );
        }else {
          await stripe.customers.deleteSource(
            customerId,
            cardId
          );
        }
      }
      console.log("====here delete else =====");
      await this.Models.Cards.update({
        deleted_at: moment(new Date()).unix(),
      },{
        where: {
          payment_method_id: cardId,
          id: findCard.id,
          user_id: userId,
          subscription_id: subscriptionId,
        }
      });


      return true;
    } catch (error) {
      console.error('Error delete card:', error);
      throw error;
    }
  };


  /* update card in stripe */
  updateCardInStripe = async (customerId, data) => {
    // update a card
    console.log(data, "====data=====data====");
    let globalDefault = 0;
    let createCard = [];
    if (data.exp_date) {
      await stripe.paymentMethods.update(
        data.payment_method_id,
        {
          card: {
            exp_month: data.exp_date.split("/")[0],
            exp_year: data.exp_date.split("/")[1],
          },
        }
      );
    };

    let expiryMonth = data.exp_date.split("/")[0];
    let expiryYear = data.exp_date.split("/")[1];

    let getCardExpiry = moment(`${expiryMonth}-${expiryYear}`, "MM-YYYY").endOf('month').unix();

    if (data.exp_date) {
      data.expiry_date = getCardExpiry;
    }
    console.log(data, "====data=====1111====");

    await this.Models.Cards.update({
      expiry_date: getCardExpiry
    },{
      where: {
        payment_method_id: data.payment_method_id,
        subscription_id: data.subscription_id,
        user_id: data.user_id,
        type: 0
      }
    });

    let getPaymentMethod = await this.Models.Cards.findOne({
      where: {
        payment_method_id: data.payment_method_id,
        user_id: data.user_id,
        subscription_id: data.subscription_id,
        deleted_at: null,
        type: 0
      },
      raw: true
    });

    if(data.is_default == 1) {

      globalDefault = 1;

      if(getPaymentMethod) {

        let getSubscriptionId = await this.Models.ClientSubscriptions.findOne({
          attributes: ["id", "stripe_subscription_id"],
          where: {
            id: getPaymentMethod.subscription_id,
            deleted_at: null,
          },
          raw: true
        });

        let updateParams = {
          default_payment_method: getPaymentMethod.payment_method_id,
        }
  
        if(getSubscriptionId) {
          await this.updateSubscriptionsParam(getSubscriptionId.stripe_subscription_id, updateParams);
        }

        await this.Models.Cards.update({
          is_default: 1
        },{
          where: {
            payment_method_id: data.payment_method_id,
            user_id: data.user_id,
            subscription_id: getPaymentMethod.subscription_id,
            type: 0
          }
        });

        await this.Models.Cards.update({
          is_default: 0
        },{
          where: {
            payment_method_id: {
              [Op.ne]: data.payment_method_id
            },
            user_id: data.user_id,
            subscription_id: getPaymentMethod.subscription_id,
            deleted_at: null,
            type: 0
          }
        });
      }
    }else if(data.is_default == 2) {

      console.log(data.is_default, "====data.is_default===");
      let getUserAllSubscriptions = await this.Models.ClientSubscriptions.findAll({
        attributes: ["id", "stripe_subscription_id", "payment_method"],
        where: {
          client_id: data.user_id,
          deleted_at: null,
          billing_frequency: {
            [Op.ne]: 1
          },
          payment_method: "card"
        },
        raw: true
      });
      console.log(getUserAllSubscriptions, "====getUserAllSubscriptions===");

      await this.Models.Cards.update({
        is_default: 0,
        global_default: 0
      },{
        where: {
          user_id: data.user_id,
          deleted_at: null,
          type: 0,
        }
      });

      await this.Models.Cards.update({
        is_default: 1,
        global_default: 1,
      },{
        where: {
          payment_method_id: data.payment_method_id,
          subscription_id: getPaymentMethod.subscription_id,
          type: 0
        }
      });

      for(let i in getUserAllSubscriptions) {

        if(getUserAllSubscriptions[i].id == data.subscription_id) {
          globalDefault = 1;
        }

        let updateParams = {
          default_payment_method: data.payment_method_id,
        }
        await this.updateSubscriptionsParam(getUserAllSubscriptions[i].stripe_subscription_id, updateParams);

        let getCardExist = await this.Models.Cards.findOne({
          where: {
            subscription_id: getUserAllSubscriptions[i].id,
            payment_method_id: data.payment_method_id,
            user_id: data.user_id,
            deleted_at: null,
            type: 0,
          },
          raw: true
        });

        console.log(getCardExist, "=========getCardExist====")

        console.log(globalDefault, "===globalDefault====");

        if(!getCardExist) {
          createCard.push({
            user_id: data.user_id,
            payment_method_id: data.payment_method_id,
            is_default: 1,
            global_default: globalDefault,
            type: 0,
            last_digit: data.last_digit,
            expiry_date: data.expiry_date,
            subscription_id: getUserAllSubscriptions[i].id
          });
        }else {

          await this.Models.Cards.update({
            is_default: 1,
            global_default: globalDefault,
          },{
            where: {
              payment_method_id: data.payment_method_id,
              subscription_id: getUserAllSubscriptions[i].id,
              type: 0,
            }
          });
        }
      }
      await this.Models.Cards.bulkCreate(createCard);
    }
    return true;
  };



  getClientBillingHistory = async (body) => {
    let whereCondition = {
      client_id: body.client_id,
      deleted_at: null,
      type: [SUBSCRIPTION_LOGID.ON_PURCHASE, SUBSCRIPTION_LOGID.ON_RENEW]
    };

    if (body.search) {
      whereCondition = {
        [Op.or]: [
          { description: { [Op.like]: `%${body.search}%` } }
        ],
        deleted_at: null,
        client_id: body.client_id,
        type: [SUBSCRIPTION_LOGID.ON_PURCHASE, SUBSCRIPTION_LOGID.ON_RENEW]
      }
    }

    if (body.filter) {
      if (body.filter.month != 0 || body.filter.year != 0) {
        let month = (body.filter.month != 0) ? body.filter.month : moment().month() + 1;
        let year = (body.filter.year != 0) ? body.filter.year : moment().year();
    
        let firstDay, lastDay;
    
        if (body.filter.month == 0) {
          // If only the year is provided, return the first and last day of that year
          firstDay = new Date(year, 0, 1); // January 1st of the provided year
          lastDay = new Date(year, 11, 31); // December 31st of the provided year
        } else {
          // Otherwise, return the first and last day of the provided month and year
          firstDay = new Date(year, month - 1, 1);
          lastDay = new Date(year, month, 0);
        }
        whereCondition.start_date = {
          [Op.between]: [moment(firstDay).unix(), moment(lastDay).unix()],
        };
      }
    }

    const allBillingHistoryCount = await this.Models.ClientSubscriptionHistories.count({
      where: whereCondition,
    });

    const allBillingHistoryCountWithoutSearch = await this.Models.ClientSubscriptionHistories.count({
      where: {
        client_id: body.client_id,
        deleted_at: null,
        type: [SUBSCRIPTION_LOGID.ON_PURCHASE, SUBSCRIPTION_LOGID.ON_RENEW]
      },
    });

    const allBillingHistory = await this.Models.ClientSubscriptionHistories.findAll({
      attributes: { include: [[sequelize.literal("DATE_FORMAT(FROM_UNIXTIME(client_subscription_histories.start_date), '%M %e, %Y')"), "subscription_start_date"]] },
      where: whereCondition,
      offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
      limit: (body.limit == -1) ? allBillingHistoryCount : parseInt(body.limit) || PAGINATION.LIMIT,
      order: [
        ['id', 'DESC'],
      ],
    });

    return { list: allBillingHistory, total_records: allBillingHistoryCount, filtered_records: allBillingHistory.length, total_count: allBillingHistoryCountWithoutSearch }
  };


  /** update subscription history data */
  updateSubscriptionHistory = async (data, subscriptionId) => {
    return await this.Models.ClientSubscriptionHistories.update(data, { where: { subscription_id: subscriptionId } });
  };

   /** update subscription history data By Id*/
  updateSubscriptionHistoryById = async (data, historyId) => {
    return await this.Models.ClientSubscriptionHistories.update(data, { where: { id: historyId } });
  };


  getBillingPlans = async (subscriptionId, startDate) => {
    const getBillingList = await this.Models.ClientSubscriptionPlans.findAll({
      attributes: {
        include: [[sequelize.literal("(SELECT name FROM line_items WHERE line_items.id = product_id)"), "product_name"], [sequelize.literal("(SELECT description FROM line_items WHERE line_items.id = product_id)"), "description"], [sequelize.literal("(SELECT no_of_payments FROM client_subscriptions WHERE client_subscriptions.id = subscription_id)"), "no_of_payments"], [sequelize.literal("(SELECT billing_terms FROM client_subscriptions WHERE client_subscriptions.id = subscription_id)"), "billing_terms"], [sequelize.literal(`DATE_FORMAT(FROM_UNIXTIME(${startDate}), '%M %e, %Y')`), "start_date"], [sequelize.literal(`CASE WHEN billing_frequency = 2 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(${startDate}), INTERVAL 1 MONTH), '%d/%m/%Y')
      WHEN billing_frequency = 3 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(${startDate}), INTERVAL 3 MONTH), '%d/%m/%Y')
      WHEN billing_frequency = 4 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(${startDate}), INTERVAL 6 MONTH), '%d/%m/%Y')
      WHEN billing_frequency = 5 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(${startDate}), INTERVAL 1 YEAR), '%d/%m/%Y')
      WHEN billing_frequency = 6 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(${startDate}), INTERVAL 7 DAY), '%d/%m/%Y')
      WHEN billing_frequency = 7 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(${startDate}), INTERVAL 28 DAY), '%d/%m/%Y')
      ELSE null END`), "active_until"]]
      },
      where: {
        subscription_id: subscriptionId,
        deleted_at: null
      },
      raw: true
    });
    return getBillingList;
  };

  getAgentRecentActitvity = async (body, client_id) => {
    let whereCondition = {
      // client_id: client_id,
      project_id: body.project_id,
      deleted_at: null,
      type: {
        [Op.notIn]: [7,8,9] //This is for notification. No need to show in recent activity
      }
    }

    if(body.role_id == ROLES.AGENT || body.role_id == ROLES.USER) {
      // let getAssignedUsers = await this.Models.AssignedTaskUsers.findAll({
      //   attributes:["id", "task_id", "project_id", "user_id"],
      //     where: {
      //       project_id: body.project_id,
      //       user_id: client_id,
      //       deleted_at: null
      //     },
      //   raw: true,
      // });
      // let assignedIds = getAssignedUsers.map(val => val.id);
      whereCondition = {
        project_id: body.project_id,
        deleted_at: null,
        type: {
          [Op.notIn]: [7,8,9] //This is for notification. No need to show in recent activity
        }
      }
    }

    const totalAgentRecentActivities = await this.Models.RecentActivities.count({
      where: whereCondition
    })

    let getAgentRecentActivity = await this.Models.RecentActivities.findAll({
      attributes: ["id", "user_id", "type", "message", [sequelize.literal("DATE_FORMAT(created_at, '%Y-%m-%d')"), "created_at"], [sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = recent_activities.user_id)"), "userName"], [sequelize.literal("(SELECT user_image FROM users WHERE users.id = recent_activities.user_id)"), "user_image"], [sequelize.literal("(SELECT name FROM projects WHERE projects.id = recent_activities.project_id)"), "project_name"], [sequelize.literal("(SELECT title FROM tasks WHERE tasks.id = recent_activities.task_id)"), "task_name"], [sequelize.literal("(SELECT name FROM project_columns WHERE project_columns.id = recent_activities.project_column_id)"), "project_column_name"]],
      where: whereCondition,
      offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
      limit: (body.limit == -1) ? totalAgentRecentActivities : parseInt(body.limit) || PAGINATION.LIMIT,
      order: [["id", "DESC"]],
      raw: true,
    });


    if(getAgentRecentActivity.length > 0) {

      for (let i in getAgentRecentActivity) {
        let userName = getAgentRecentActivity[i].user_id == client_id ? `You` : getAgentRecentActivity[i].userName;
        switch (getAgentRecentActivity[i].type) {
          case RECENT_ACTIVITY_TYPE.PROJECT_CREATED:
            getAgentRecentActivity[i].message = `${userName} created the ${getAgentRecentActivity[i].project_name} project successfully.`;
            break;
          case RECENT_ACTIVITY_TYPE.TASK_CREATED:
            getAgentRecentActivity[i].message = `${userName} created the ${getAgentRecentActivity[i].task_name} task successfully in the ${getAgentRecentActivity[i].project_name} project.`;
            break;
          case RECENT_ACTIVITY_TYPE.TASK_UPDATED:
            getAgentRecentActivity[i].message = `${userName} updated the ${getAgentRecentActivity[i].task_name} task successfully in the ${getAgentRecentActivity[i].project_name} project.`;
            break;
          case RECENT_ACTIVITY_TYPE.TASK_MOVE:
            getAgentRecentActivity[i].message = `${userName} moved the ${getAgentRecentActivity[i].task_name} task to list ${getAgentRecentActivity[i].project_column_name} in the ${getAgentRecentActivity[i].project_name} project.`;
            break;
          case RECENT_ACTIVITY_TYPE.TASK_DELETE:
            getAgentRecentActivity[i].message = `${userName} deleted the ${getAgentRecentActivity[i].task_name} task successfully in the ${getAgentRecentActivity[i].project_name} project.`;
            break;
          case RECENT_ACTIVITY_TYPE.PROJECT_DELETE:
            getAgentRecentActivity[i].message = `${userName} deleted the ${getAgentRecentActivity[i].project_name} project successfully.`;
            break;
          case RECENT_ACTIVITY_TYPE.TASK_COMPLETE:
            getAgentRecentActivity[i].message = `${userName} has successfully ${getAgentRecentActivity[i].project_column_name} the ${getAgentRecentActivity[i].task_name} task in the ${getAgentRecentActivity[i].project_name} project successfully.`;
            break;
          default:
            getAgentRecentActivity[i].message = "";
        }
      }

    }

    return { list: getAgentRecentActivity, filtered_records: getAgentRecentActivity.length, total_count: totalAgentRecentActivities }
  };

  getClientBillingList = async (body) => {
    let havingCondition = {
      client_id: body.client_id,
      deleted_at: null,
      status: {
        [Op.ne]: 0
      }
    };

    if (body.search) {
      havingCondition = {
        [Op.or]: [
          { userName: { [Op.like]: `%${body.search}%` } }
        ],
        deleted_at: null,
        client_id: body.client_id,
        status: {
          [Op.ne]: 0
        }
      }
    }

    const allSubscriptionCount = await this.Models.ClientSubscriptions.findAll({
      attributes: { include: [[sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = client_subscriptions.client_id)"), "userName"]] },
      having: havingCondition,
    });

    const allSubscriptionCountWithoutSearch = await this.Models.ClientSubscriptions.count({
      where: {
        client_id: body.client_id,
        deleted_at: null,
        status: {
          [Op.ne]: 0
        }
      }
    });

    const allSubscriptions = await this.Models.ClientSubscriptions.findAll({
      attributes: {
        include: [[sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = client_subscriptions.client_id)"), "userName"], [sequelize.literal("DATE_FORMAT(FROM_UNIXTIME(client_subscriptions.start_date), '%d/%m/%Y')"), "subscription_start_date"], [sequelize.literal(`CASE WHEN client_subscriptions.billing_frequency = 2 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(client_subscriptions.start_date), INTERVAL 1 MONTH), '%d/%m/%Y')
        WHEN client_subscriptions.billing_frequency = 3 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(client_subscriptions.start_date), INTERVAL 3 MONTH), '%d/%m/%Y')
        WHEN client_subscriptions.billing_frequency = 4 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(client_subscriptions.start_date), INTERVAL 6 MONTH), '%d/%m/%Y')
        WHEN client_subscriptions.billing_frequency = 5 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(client_subscriptions.start_date), INTERVAL 1 YEAR), '%d/%m/%Y')
        WHEN client_subscriptions.billing_frequency = 6 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(client_subscriptions.start_date), INTERVAL 7 DAY), '%d/%m/%Y')
        WHEN client_subscriptions.billing_frequency = 7 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(client_subscriptions.start_date), INTERVAL 28 DAY), '%d/%m/%Y')
        ELSE null END`), "active_until"]]
      },
      having: havingCondition,
      include: [
        {
          model: this.Models.ClientSubscriptionPlans,
          attributes: { include: [[sequelize.literal("(SELECT name FROM line_items WHERE line_items.id = product_id)"), "product_name"], [sequelize.literal("(SELECT description FROM line_items WHERE line_items.id = product_id)"), "description"]] },
          as: "subscription_plans",
          where: { deleted_at: null },
          required: false,
        },
      ],
      offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
      limit: (body.limit == -1) ? allSubscriptionCount.length : parseInt(body.limit) || PAGINATION.LIMIT,
      order: [
        ['id', 'DESC'],
      ],
    });

    let getCancelSubscriptionSetting = await this.Models.GlobalSettings.findOne({
      where: {
        deleted_at: null,
        user_role: 6,
      },
      raw: true,
    });

    let cancelSubscriptionSetting = (getCancelSubscriptionSetting && getCancelSubscriptionSetting.is_authenticate == 1) ? 1 : 0; 

    return { list: allSubscriptions, total_records: allSubscriptionCount.length, total_count: allSubscriptionCountWithoutSearch, filtered_records: allSubscriptions.length, cancel_subscription_setting: cancelSubscriptionSetting }
  };


 /** Get subscription logs */
  getClientSubscriptionLogs = async (body) => {
    let whereCondition = {
      subscription_id: body.subscription_id,
      deleted_at: null,
    };

    if (body.search) {
      whereCondition = {
        [Op.or]: [
          { title: { [Op.like]: `%${body.search}%` } }
        ],
        deleted_at: null,
        subscription_id: body.subscription_id,
      }
    }

    const allLogsCount = await this.Models.ClientSubscriptionHistories.count({
      where: whereCondition,
    });

    const allLogsCountWithoutSearch = await this.Models.ClientSubscriptionHistories.count({
      where: {
        subscription_id: body.subscription_id,
        deleted_at: null,
      },
    });

    const allLogs = await this.Models.ClientSubscriptionHistories.findAll({
      attributes: ["id", "type", "subscription_id", "client_id", "start_date", "deleted_at", "price", [sequelize.literal("DATE_FORMAT(FROM_UNIXTIME(client_subscription_histories.start_date), '%M %e, %Y')"), "subscription_start_date"],[sequelize.literal("(SELECT title FROM client_subscriptions WHERE client_subscriptions.id = client_subscription_histories.subscription_id limit 1)"), "title"]],
      where: whereCondition,
      raw: true,
      offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
      limit: (body.limit == -1) ? allLogsCount : parseInt(body.limit) || PAGINATION.LIMIT,
      order: [
        ['id', 'DESC'],
      ],
    });

    for (let i in allLogs) {
      switch (allLogs[i].type) {
        case SUBSCRIPTION_LOGID.ON_PURCHASE:
          allLogs[i].log = SUBSCRIPTION_LOGS_MESSAGE.ON_PURCHASE;
          break;
        case SUBSCRIPTION_LOGID.ON_RENEW:
          allLogs[i].log = SUBSCRIPTION_LOGS_MESSAGE.ON_RENEW;
          break;
        case SUBSCRIPTION_LOGID.ON_DECLINE:
          allLogs[i].log = SUBSCRIPTION_LOGS_MESSAGE.ON_DECLINE;
          break;
        case SUBSCRIPTION_LOGID.ON_RENEW_MAIL:
          allLogs[i].log = SUBSCRIPTION_LOGS_MESSAGE.ON_RENEW_MAIL;
          break;
        case SUBSCRIPTION_LOGID.STATUS_CHANGE_CANCEL:
          allLogs[i].log = SUBSCRIPTION_LOGS_MESSAGE.STATUS_CHANGE_CANCEL;
          break;
        case SUBSCRIPTION_LOGID.STATUS_CHANGE_PAUSE:
          allLogs[i].log = SUBSCRIPTION_LOGS_MESSAGE.STATUS_CHANGE_PAUSE;
          break;

        case SUBSCRIPTION_LOGID.STATUS_CHANGE_EXPIRE:
          allLogs[i].log = SUBSCRIPTION_LOGS_MESSAGE.STATUS_CHANGE_EXPIRE;
          break;
        default:
          allLogs[i].log = SUBSCRIPTION_LOGS_MESSAGE.ON_UPDATE;
      }
    }
    
    return { list: allLogs, total_records: allLogsCount, filtered_records: allLogs.length, total_count: allLogsCountWithoutSearch }
  };




  getAllSubscriptionPlans = async (subscriptionId) => {
    const getSubscriptionPlans = await this.Models.ClientSubscriptionPlans.findAll({
      where: {
        subscription_id: subscriptionId,
        deleted_at: null
      },
      raw: true
    });
    return getSubscriptionPlans;
  };


  /** get Subscription Info By sunscription id */
  getSubscriptionInfoById = async (subscriptionId) => {
    const subscriptionDetail = await this.Models.ClientSubscriptions.findOne({
      where: {
        id: subscriptionId,
        deleted_at: null
      },
      raw: true
    });
    return subscriptionDetail;
  }



  /** Expire stripe Previous link subscription */
  expireCheckoutSession = async (sessionId) => {
    const session = await stripe.checkout.sessions.expire(
      sessionId
    );
    return session;
  };



  /** Retrive subscription*/
  retriveSubscriptionPlansFromStripe = async (subscriptionId) => {

    let priceIds = [];
    const subscription = await stripe.subscriptions.retrieve(
      subscriptionId
    );

    if(subscription.items.data.length > 0) {
      for(let i in subscription.items.data) {
        priceIds.push({
          "price_id": subscription.items.data[i].plan.id
        });
      }
    }
    return priceIds;
  };


  /** Retrive subscription items */
  retriveSubscriptionItemsFromStripe = async (subscriptionId, priceId, price, quantity, interval, allSubData) => {

    const subscriptionItems = await stripe.subscriptionItems.list({
      subscription: subscriptionId,
    });

    let getSubscriptionItem = [];
    if (subscriptionItems.data.length > 0) {
      // for (let i = 0; i < subscriptionItems.data.length; i++) {
      for (let i in subscriptionItems.data && allSubData) {
        if (priceId.includes(subscriptionItems.data[i].plan.id)) {
          getSubscriptionItem.push({
            id: subscriptionItems.data[i].id,
            quantity: allSubData[i].quantity,
            price_data: {
              unit_amount: parseInt((allSubData[i].unit_price * 100).toFixed(0), 10),
              currency: "USD",
              product: subscriptionItems.data[i].plan.product,
              recurring: {
                interval: interval,
              },
            },
          });
        }
      }
    }
    return getSubscriptionItem;
  };


  /** create subscription items */
  createSubscriptionItemsInStripe = async (subscriptionId, priceId, quantity) => {
    const subscriptionItem = await stripe.subscriptionItems.create({
      subscription: subscriptionId,
      price: priceId,
      quantity: quantity,
      proration_behavior:'always_invoice',
    });
    return subscriptionItem;
  };


  /** update subscription plans */
  updateSubscriptionPlan = async (data, planId) => {
    return await this.Models.ClientSubscriptionPlans.update(data, { where: { id: planId } });
  };


  /** delete subscription plans */
  deleteSubscriptionPlan = async (data, subscriptionId) => {
    return await this.Models.ClientSubscriptionPlans.update(data, { where: { subscription_id: subscriptionId } });
  };


  /** create subscription plans */
  createSubscriptionPlan = async (data) => {
    return await this.Models.ClientSubscriptionPlans.create(data);
  };

  /** create subscription in stripe */
  updateSubscriptionInStripe = async (subscriptionId, items, cancelAt, data) => {
    let cancelSubscription = {};
    let defaultTaxRates = {};
    if(cancelAt !=null) {
      cancelSubscription.cancel_at = cancelAt;
    }else if(cancelAt == null) {
      cancelSubscription.cancel_at_period_end = false;
    }

    if(data.global_processing_fee && (data.global_processing_fee !=0 || data.global_processing_fee !="")) {
      const taxRate = await stripe.taxRates.create({
        display_name: (data.global_processing_fee_description !="") ? data.global_processing_fee_description : '',
        percentage: data.global_processing_fee,
        inclusive: false,
      });
      defaultTaxRates.default_tax_rates = [taxRate.id];
      await this.updateSubscription({tax_rate_id: taxRate.id}, data.subscription_id);
    }

    const subscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        items: items,
        ...cancelSubscription,
        proration_behavior:'always_invoice',
        ...defaultTaxRates,
        metadata: {
          is_edited: true,
        },
      }
    );
    return subscription;
  };



  /** create Tax rate in stripe*/
  createTaxRateInStripe = async (data) => {
    const taxRate = await stripe.taxRates.create({
      display_name: (data.global_processing_fee_description !="") ? data.global_processing_fee_description : '',
      percentage: data.global_processing_fee,
      inclusive: false,
    });
    return taxRate.id;
  };


  /** Retrive subscription All data*/
  retriveSubscriptionAllInfoFromStripe = async (subscriptionId) => {
    const subscription = await stripe.subscriptions.retrieve(
      subscriptionId
    );
    return subscription;
  };

  /** Retrive charge */
  retriveChargeFromStripe = async (charge) => {
    const getCharge = await stripe.charges.retrieve(
      charge
    );
    return getCharge.receipt_url;
  };

  /** create subscription in stripe */
  updateDiscountInStripeSubscription = async (subscriptionId, discountId) => {
    const subscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        discounts: [{
          coupon: discountId
        }],
        proration_behavior:'create_prorations',
      }
    );
    return subscription;
  };


  /** Check user tasks permission */
  checkUserTaskPermission = async (clientId, userId) => {
    let checkPermisiion = await this.Models.UserTaskPermissions.findOne({
      where: {
        client_id: clientId,
        user_id: userId,
        deleted_at: null
      },
      raw: true
    });
    return checkPermisiion;
  };

  /** update user tasks permission */
  updateUserTaskPermission = async (clientId, userId, isToggle) => {
    return await this.Models.UserTaskPermissions.update({
      is_toggle: isToggle
    },{
      where: {
        client_id: clientId,
        user_id: userId,
        deleted_at: null
      },
      raw: true
    });
  };


  /** create tasks permission */
  createUserTaskPermission = async (data) => {
    return await this.Models.UserTaskPermissions.create(data);
  };


  /** Get Agent Client Projects As per toggle button */
  getProjectsForAgentByAgentId = async (userId) => {
    try {
      // Fetch all assigned clients for the agent, including is_toggle
      const getAgentClients = await this.Models.AssignedUsers.findAll({
        attributes: [
          "id", "agent_id", "user_id", "type", "deleted_at",
          [sequelize.literal(`
            (SELECT COALESCE(
              (SELECT CASE 
                WHEN user_task_permissions.is_toggle = 0 THEN 0 
                WHEN user_task_permissions.is_toggle = 1 THEN 1 
                ELSE 0
              END 
              FROM user_task_permissions
              WHERE user_task_permissions.client_id = assigned_users.user_id 
              AND user_task_permissions.user_id = ${userId}), 0)
            )`), 'is_toggle'
          ]
        ],
        where: {
          agent_id: userId,
          type: ASSIGNED_USERS.CLIENTS_TO_AGENT,
          deleted_at: null,
        },
        raw: true
      });

      const projectsPromises = getAgentClients.map(async (client) => {
        if (client.is_toggle === 0) {
          // Fetch all projects for the client
          return this.Models.Projects.findAll({
            attributes: ["id", ["id", "project_id"], "name", "user_id", "deleted_at", "sort_order"],
            where: {
              user_id: client.user_id,
              deleted_at: null,
            },
            order: [["sort_order", "ASC"]],
            raw: true
          });
        } else {
          // Fetch assigned projects for the agent
          return this.Models.AssignedTaskUsers.findAll({
            attributes: [
              "id", "user_id", "project_id", "deleted_at",
              [sequelize.literal("(SELECT name FROM projects WHERE projects.id = project_id LIMIT 1)"), "name"],
              [sequelize.literal("(SELECT deleted_at FROM projects WHERE projects.id = project_id LIMIT 1)"), "project_deleted_at"],
              [sequelize.literal("(SELECT sort_order FROM projects WHERE projects.id = project_id LIMIT 1)"), "sort_order"]
            ],
            group: ["project_id"],
            where: {
              user_id: userId,
              deleted_at: null,
            },
            having: {
              project_deleted_at: null
            },
            order: [sequelize.literal("sort_order", "ASC")],
            raw: true
          });
        }
      });
      // Execute all project queries in parallel
      const projectResults = await Promise.all(projectsPromises);
      // Flatten nested arrays of projects
      const getAllProjects = projectResults.flat();
      return getAllProjects;
    } catch (error) {
      console.error('Error fetching projects for agent:', error);
      throw error; // Handle this appropriately in your error handler
    }
  };

  /** get project by id*/
  getProjectById = async (projectId) => {
    return this.Models.Projects.findOne({
      where: {
        id: projectId,
        deleted_at: null
      },
      raw: true
    });
  };


  /** Get user by User Id */
  getUserDetailById = async (userId) => {
    return this.Models.Users.findOne({
      attributes: ["id", "role_id", "added_by", "deleted_at"],
      where: {
        id: userId,
        deleted_at: null
      },
      raw: true
    });
  };




  /** pause Subscription In Stripe */
  pauseSubscriptionInStripe = async (subscriptionId) => {
    const subscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        pause_collection: {
          behavior: "void"
        },
        // payment_behavior: "allow_incomplete"
      }
    );
    return subscription;
  };


  /** resume Subscription In Stripe */
  resumeSubscriptionInStripe = async (subscriptionId) => {
    const subscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        pause_collection: null,
      }
    );
    return subscription;
  };



  /** get all users list with pagination and search filter and total count*/
  getClientListForAssign = async (body, user) => {
    let havingCondition = {
      deleted_at: null,
      role_id: ROLES.CLIENT,
      is_assign: 0
    };

    let countHavingCondition = {
      deleted_at: null,
      role_id: ROLES.CLIENT,
    }
    
    if (body.search) {
      havingCondition = {
        userName: { [Op.like]: `%${body.search}%` },
        deleted_at: null,
        role_id: ROLES.CLIENT,
        is_assign: 0
      }
    }

    if(user.role_id == ROLES.ACCOUNTMANAGER) {
      let getAllClientOfManager = await this.Models.AssignedUsers.findAll({
        attribute: ["id", "type", "user_id", "account_manager_id", "deleted_at"],
        where: {
          account_manager_id: body.user_id,
          type: ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER,
          deleted_at: null
        },
        raw: true,
      });
      let getClientIds = getAllClientOfManager.map(val => val.user_id);
      havingCondition.id = getClientIds;
      countHavingCondition.id = getClientIds;

      let setAttributes = ["id", "client_view", "deleted_at"];
      let getPermission = await this.getAccountManagerRolePermissions(user.role_permission_id, setAttributes);
      if(getPermission && getPermission.client_view == 1) {
        if (body.search) {
          havingCondition = {
            userName: { [Op.like]: `%${body.search}%` },
            deleted_at: null,
            role_id: ROLES.CLIENT,
            is_assign: 0,
            id: getClientIds
          }
        }
      }else {
        havingCondition = {
          userName: { [Op.like]: `%${body.search}%` },
          deleted_at: null,
          role_id: ROLES.CLIENT,
          is_assign: 0
        }
      }

    }


    const allClientExcludeSearchCount = await this.Models.Users.findAll({
      attributes: ["id", "role_id", "first_name", "last_name", "deleted_at", [sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = users.id)"), "userName"]],
      having: countHavingCondition,
    });

    const allClientCount = await this.Models.Users.findAll({
      attributes: ["id", "role_id", "first_name", "last_name", "deleted_at", [sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = users.id)"), "userName"], [sequelize.literal(` CASE WHEN ( SELECT COUNT(*) FROM assigned_users WHERE assigned_users.user_id = users.id AND deleted_at IS NULL AND  assigned_users.account_manager_id = ${body.account_manager_id}) > 0 THEN 1
        ELSE 0 END `), "is_assign"]],
      having: havingCondition,
    });

    const getAllClients = await this.Models.Users.findAll({
      attributes: ["id", "role_id", "first_name", "last_name", "deleted_at", [sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = users.id)"), "userName"], [sequelize.literal(` CASE WHEN ( SELECT COUNT(*) FROM assigned_users WHERE assigned_users.user_id = users.id AND deleted_at IS NULL AND  assigned_users.account_manager_id = ${body.account_manager_id}) > 0 THEN 1
        ELSE 0 END `), "is_assign"]],
      having: havingCondition,
      order: [
        ['id', 'DESC'],
      ],
      offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
      limit: (body.limit == -1) ? allClientCount.length : parseInt(body.limit) || PAGINATION.LIMIT,
      raw: true,
    });

    return { list: getAllClients, total_records: allClientCount.length, total_count: allClientExcludeSearchCount.length, filtered_records: getAllClients.length }
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



  /** Get User information  */
  getClientInformationByCondition = async (data, userData) => {
    return this.Models.Users.findOne({
      attributes: ["id", "role_id", "first_name", "last_name", "email", "country_code", "phone_number", "address", "address2", "country", "social_id", "state", "city", "zipcode", "user_image", "company_name", "two_factor_authentication", "role_permission_id", [sequelize.literal(`
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
              AND client_subscriptions.status = 5
              AND client_subscriptions.is_signed_docusign = 1) > 0 THEN 'Active'
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
    `), 'subscription_status'], [sequelize.literal(`
    CASE
      WHEN status = 0 THEN 'Pending'
      WHEN status = 1 THEN 'Active'
      WHEN status = 2 THEN 'Inactive'
      ELSE 'Inactive'
    END
  `), 'status'],
  [sequelize.literal(`
    CASE 
      -- When client_edit is 1, check if assigned users exist
      WHEN (
        (SELECT COUNT(*) 
          FROM roles_and_permissions 
          WHERE roles_and_permissions.id = ${userData.role_permission_id} 
            AND roles_and_permissions.client_edit = 1 
            AND roles_and_permissions.deleted_at IS NULL
        ) > 0
      )
      THEN 
        CASE 
          -- If client_edit is 1, check for assigned users (should exist)
          WHEN (
            (SELECT COUNT(*) 
              FROM assigned_users 
              WHERE assigned_users.user_id = users.id 
                AND assigned_users.deleted_at IS NULL 
                AND assigned_users.account_manager_id = ${userData.id}
            ) > 0 
          )
          THEN 1
          ELSE 0
        END
      
      -- When client_delete is 0, check if there are no assigned users
      WHEN (
        (SELECT COUNT(*) 
          FROM roles_and_permissions 
          WHERE roles_and_permissions.id = ${userData.role_permission_id} 
            AND roles_and_permissions.client_edit = 0 
            AND roles_and_permissions.deleted_at IS NULL
        ) > 0
      )
      THEN 1
          ELSE 0
        END
  `), "is_edit_access"]],
      where: data,
      raw: true
    });
  };



  /**Get subscription setting detail*/
  getSubscriptionSettingDetail = async () => {
    return this.Models.SubscriptionSettings.findOne({
      attributes: ["global_processing_fee_description", "global_processing_fee"], 
      where: {
        deleted_at: null
      },
      raw: true
    });
  };

  

  resendSubscriptionForClient = async (paymentMode, customerId, priceIds, clientId, subscriptionParams, discountId, subscriptionAllParams, taxRateId, isManualPayment) => {
    let subscriptionData = {};
    let billingDateParam = {};
    let discountParam = {};
    let invoice_creation = {};
    let subscription_data = {};
    let taxDetail = {};
    if (discountId) {
      discountParam = {
        discounts: [{
          coupon: discountId
        }]
      }
    }
    // If subscription billing start to future date
    if (subscriptionParams.billing_start_date != "") {
      billingDateParam.trial_end = moment(new Date(subscriptionParams.billing_start_date)).unix();
    }

    if (subscriptionAllParams.every(item => item.billing_frequency === 1)) {
      invoice_creation = {
        enabled: true
      };
    }

    if(taxRateId != "" && taxRateId != null){
      billingDateParam.default_tax_rates = [taxRateId];
    }

    if (paymentMode == "subscription") {
      subscription_data = {
        ...billingDateParam,
      };
    }

    const createSubscription = await stripe.checkout.sessions.create({
      mode: paymentMode,
      customer: customerId,
      success_url: `${process.env.BASE_URL}subscription-success`,
      cancel_url: `${process.env.BASE_URL}subscription-cancel`,
      line_items: priceIds,
      payment_method_types: ['card'],
      invoice_creation,
      subscription_data,
      expand: ['payment_intent.payment_method'],
      metadata: {
        "client_id": +clientId,
        "billing_terms": +subscriptionParams.billing_terms,
        "no_of_payments": subscriptionParams.no_of_payments ? +subscriptionParams.no_of_payments : 0,
        "billing_frequency": +subscriptionParams.billing_frequency,
        "is_edited": false,
        "payment_method": "card",
        "is_manual_payment": (isManualPayment && isManualPayment == 1) ? 1: 0,
      },
      ...discountParam,
      ...taxDetail
    });

    if (createSubscription) {
      // get payment link of subscription
      subscriptionData = {
        subscription_id: createSubscription.id,
        payment_link: createSubscription.url,
        amount: createSubscription.amount_total / 100,
        subTotal: createSubscription.amount_subtotal / 100,
        start_date: createSubscription.created
      }
    }
    return subscriptionData;
  };


  /** Get card Count by userId */
  getCardsCount = async (userId, cardType, subscriptionId) => {
    let getCardCount = await this.Models.Cards.count({
      where: {
        user_id: userId,
        type: cardType,
        subscription_id: subscriptionId,
        deleted_at: null
      },
    });
    return getCardCount
  }


  /** check Valid Card Not Delete */
  checkValidCardNotDelete = async (cardId, userId) => {
    let getDate = moment(new Date()).unix();
    let getCard = await this.Models.Cards.findOne({
      where: {
        user_id: userId,
        payment_method_id: cardId,
        deleted_at: null,
        expiry_date: {
          [Op.gt]: getDate,
        }
      },
      raw: true
    });

    if(getCard) {
      let getExpireCard = await this.Models.Cards.findOne({
        where: {
          user_id: userId,
          payment_method_id: {
            [Op.ne]: cardId
          },
          deleted_at: null,
          expiry_date: {
            [Op.gt]: getDate,
          }
        },
        raw: true
      });
      if(!getExpireCard) {
        return null
      }
      return getCard;

    }else {

      let getExpireCard = await this.Models.Cards.findOne({
        where: {
          user_id: userId,
          payment_method_id: {
            [Op.ne]: cardId
          },
          deleted_at: null,
          expiry_date: {
            [Op.gt]: getDate,
          }
        },
        raw: true
      });
      if(getExpireCard) {
        return getExpireCard
      }
      return null
    }
  };


  getRolesAndPermissions = async (name) => {
    return this.Models.RolesAndPermissions.findOne({
      where: {
        name: name,
        type: 1,
        deleted_at: null
      },
      raw: true
    });
  };

  getRolesAndPermissionsForAdd = async (name, userId) => {
    return this.Models.RolesAndPermissions.findOne({
      where: {
        name: name,
        type: 1,
        added_by: userId,
        deleted_at: null
      },
      raw: true
    });
  };

  checkFields = async (data) => {
    const fieldsToCheck = [
        'is_agent_access', 
        'is_users_access', 
        'is_billing_access', 
        'is_settings',  
        'is_shared_files', 
        'is_chat', 
        'is_supports', 
        'is_password_manager',
    ];
    const allZero = fieldsToCheck.every(field => data[field] === 0);
    return allZero ? 0 : 1;
  };


  /* create roles and permissions */
  createRolesAndPermissions = async (data) => {
    return await this.Models.RolesAndPermissions.create(data);
  };


  /**Get Roles And Permissions by Id*/
  getRolesAndPermissionsById = async (permissionId) => {
    return this.Models.RolesAndPermissions.findOne({
      where: {
        id: permissionId,
        deleted_at: null
      },
      raw: true
    });
  };

  /**Get Roles And Permissions*/
  getRolesAndPermissionsByNameOrId = async (name, permissionId) => {
    return this.Models.RolesAndPermissions.findOne({
      where: {
        name: name,
        id: {
          [Op.ne]: permissionId
        },
        deleted_at: null
      },
      raw: true
    });
  };

  /* update roles and permissions */
  updateRolesAndPermissions = async (data, permissionId) => {
    return await this.Models.RolesAndPermissions.update(data,{
      where: {
        id: permissionId
      }
    });
  };

  /** create recent activities */
  createRecentActivities = async (data) => {
    return await this.Models.RecentActivities.create(data);
  };

  /** get Assigned Password Users */
  getAssignedPasswordUsers = async (passwordId) => {
    let getAllAssignedUsers = await this.Models.assignedAgentPasswords.findAll({
      where: {
        password_manager_id: passwordId,
        deleted_at: null,
      },
      raw: true
    });

    let getAllAssignedUserIds = getAllAssignedUsers.map(val => val.agent_id);
    return getAllAssignedUserIds;
  };


  /** get Assigned Password Users */
  getAssignedAllUsersOfClient = async (clientId) => {
    let getAssignedAgents =  await this.Models.AssignedUsers.findAll({
      attributes: ["user_id", "agent_id"],
      where: {
        type: ASSIGNED_USERS.CLIENTS_TO_AGENT,
        user_id: clientId,
        deleted_at: null
      },
      raw: true
    });
    let getAssignedAgentIds = getAssignedAgents.map(val => val.agent_id);
    let getAssignedUsers =  await this.Models.Users.findAll({
      attributes: ["id", "added_by"],
      where: {
        added_by: clientId,
        deleted_at: null
      },
      raw: true
    });
    let getAssignedUserIds = getAssignedUsers.map(val => val.id);
    let finalAllUserIds = getAssignedAgentIds.concat(getAssignedUserIds);
    return finalAllUserIds;
  };




  /** Create Subscription For Client in edit case*/
  createSubscriptionForClientInEdit = async (paymentMode, customerId, priceIds, clientId, subscriptionParams, discountId, subscriptionAllParams, taxRateId, isManualPayment) => {
    let subscriptionData = {};
    let billingDateParam = {};
    let discountParam = {};
    let invoice_creation = {};
    let subscription_data = {};
    let taxDetail = {};
    if (discountId) {
      discountParam = {
        discounts: [{
          coupon: discountId
        }]
      }
    }
    // If subscription billing start to future date
    if (subscriptionParams.billing_start_date != "") {
      billingDateParam.trial_end = moment(new Date(subscriptionParams.billing_start_date)).unix();
    }

    if (subscriptionAllParams.every(item => item.billing_frequency === 1)) {
      invoice_creation = {
        enabled: true
      };
    }

    if(taxRateId && taxRateId != "" && taxRateId != null){
      billingDateParam.default_tax_rates = [taxRateId];
    }

    if (paymentMode == "subscription") {
      subscription_data = {
        ...billingDateParam,
      };
    }

    const createSubscription = await stripe.checkout.sessions.create({
      mode: paymentMode,
      customer: customerId,
      success_url: `${process.env.BASE_URL}subscription-success`,
      cancel_url: `${process.env.BASE_URL}subscription-cancel`,
      line_items: priceIds,
      payment_method_types: ['card'],
      invoice_creation,
      subscription_data,
      expand: ['payment_intent.payment_method'],
      metadata: {
        "client_id": +clientId,
        "billing_terms": +subscriptionParams.billing_terms,
        "no_of_payments": subscriptionParams.no_of_payments ? +subscriptionParams.no_of_payments : 0,
        "billing_frequency": +subscriptionParams.billing_frequency,
        "is_edited": false,
        "payment_method": "card",
        "is_manual_payment": (isManualPayment && isManualPayment == 1) ? 1 : 0
      },
      ...discountParam,
      ...taxDetail
    });

    if (createSubscription) {
      // get payment link of subscription
      subscriptionData = {
        subscription_id: createSubscription.id,
        payment_link: createSubscription.url,
        amount: createSubscription.amount_total / 100,
        subTotal: createSubscription.amount_subtotal / 100,
        start_date: createSubscription.created
      }
    }
    return subscriptionData;
  };


  createSubscriptionWithbank = async (createdSubscriptionId, paymentMode, customerId, priceIds, clientId, subscriptionParams, discountId, subscriptionAllParams, isManualPayment) => {
    let subscriptionData = {};
    let billingDateParam = {};
    let discountParam = {};
    let invoice_creation = {};
    let subscription_data = {};
    let taxDetail = {};
    if (discountId) {
      discountParam = {
        discounts: [{
          coupon: discountId
        }]
      }
    }
    // If subscription billing start to future date
    if (subscriptionParams.billing_start_date != "") {
      billingDateParam.trial_end = moment(new Date(subscriptionParams.billing_start_date)).unix();
    }

    if (subscriptionAllParams.every(item => item.billing_frequency === 1)) {
      invoice_creation = {
        enabled: true
      };
    }

    if (paymentMode == "subscription") {
      subscription_data = {
        ...billingDateParam,
      };
    }

    const createSubscription = await stripe.checkout.sessions.create({
      mode: paymentMode,
      customer: customerId,
      success_url: `${process.env.BASE_URL}subscription-success`,
      cancel_url: `${process.env.BASE_URL}subscription-cancel`,
      line_items: priceIds,
      payment_method_types: ['us_bank_account'],
      invoice_creation,
      subscription_data,
      expand: ['payment_intent.payment_method'],
      metadata: {
        "client_id": +clientId,
        "billing_terms": +subscriptionParams.billing_terms,
        "no_of_payments": subscriptionParams.no_of_payments ? +subscriptionParams.no_of_payments : 0,
        "billing_frequency": +subscriptionParams.billing_frequency,
        "is_edited": false,
        "payment_method": "bank",
        "is_manual_payment": (isManualPayment && isManualPayment == 1) ? 1: 0,
      },
      ...discountParam,
      ...taxDetail
    });

    if (createSubscription) {
      // get payment link of subscription
      subscriptionData = {
        bank_transaction_id: createSubscription.id,
        bank_payment_link: createSubscription.url,
      }
      await this.updateSubscription(subscriptionData, createdSubscriptionId);
    }
    return true;
  };



  /** get bank list */
  getBankList = async (customerId) => {
    try {
      const banks = await stripe.paymentMethods.list({
        customer: customerId,
        type: "us_bank_account",
      });

      let formattedBanks = [];

      if(banks.data.length > 0) {
        for(let i in banks.data) {

          let findCard = await this.Models.Cards.findOne({
            where: {
              payment_method_id: banks.data[i].id,
            },
            raw: true
          });
          formattedBanks.push({
            id: banks.data[i].id,
            bank_name: banks.data[i].us_bank_account.bank_name,
            last4: banks.data[i].us_bank_account.last4,
            is_default: (findCard && findCard.is_default == 1) ? 1 : 0
          })
        }
      }

      return formattedBanks;
    } catch (error) {
      console.error('Error retrieving bank list:', error);
      throw error;
    }
  };

  /** create Bank Account As Payment Method In Stripe */
  createBankAsPaymentMethodInStripe = async (data) => {

    const createBankToken = await stripe.tokens.create({
      bank_account: {
        country: 'US',
        currency: 'usd',
        account_holder_name: data.account_holder_name,
        account_holder_type: 'individual',
        routing_number: data.routing_number,
        account_number: data.account_number,
      },
    });

    let createBankSource = await stripe.customers.createSource(
      data.customer_id,
      {
        source: createBankToken.id,
      }
    );

    let verifyBank = await stripe.customers.verifySource(
      data.customer_id,
      createBankSource.id,
      {
        amounts: [32, 45],
      }
    );

    let bankDetail = {};
    if(verifyBank) {
      bankDetail = {
        id: verifyBank.id,
        bank_name: verifyBank.bank_name,
        account_holder_name: data.account_holder_name,
        last4: verifyBank.last4,
      }
    }
    return bankDetail
  };


  /* add bank in stripe */
  createBankInStripe = async (customerId, data, userId, paymentMethodId) => {

    let createBanks = [];
    let globalDefault = data.is_default;
    
    if (data.is_default == 1) {

      globalDefault = 1;

      let updateParams = {
        default_payment_method: paymentMethodId,
        default_tax_rates: null,
      }
      await this.updateSubscriptionsParam(data.stripe_subscription_id, updateParams);

      await this.Models.Cards.update({
        is_default: 0
      },{
        where: {
          payment_method_id: {
            [Op.ne]: paymentMethodId
          },
          user_id: userId,
          subscription_id: data.subscription_id,
          deleted_at: null,
          type: 1
        }
      });

      createBanks.push({
        user_id: userId,
        name: data.bank_name,
        account_holder_name: data.account_holder_name,
        payment_method_id: paymentMethodId,
        is_default: data.is_default,
        global_default: globalDefault,
        type: 1,
        last_digit: data.last_digit,
        subscription_id: data.subscription_id
      });
      
    }else if(data.is_default == 2) {

      let getUserAllSubscriptions = await this.Models.ClientSubscriptions.findAll({
        attributes: ["id", "stripe_subscription_id", "payment_method"],
        where: {
          client_id: userId,
          deleted_at: null,
          billing_frequency: {
            [Op.ne]: 1
          },
          status: [1,2],
          payment_method: "bank_account"
        },
        raw: true
      });

      await this.Models.Cards.update({
        is_default: 0
      },{
        where: {
          user_id: userId,
          deleted_at: null,
          type: 1
        }
      });


      for(let i in getUserAllSubscriptions) {

        if(getUserAllSubscriptions[i].id == data.subscription_id) {
          globalDefault = 1;
        }

        let updateParams = {
          default_payment_method: paymentMethodId,
          default_tax_rates: null,
        }
        await this.updateSubscriptionsParam(getUserAllSubscriptions[i].stripe_subscription_id, updateParams);

        createBanks.push({
          user_id: userId,
          name: data.bank_name,
          account_holder_name: data.account_holder_name,
          payment_method_id: paymentMethodId,
          is_default: 1,
          global_default: globalDefault,
          type: 1,
          last_digit: data.last_digit,
          subscription_id: getUserAllSubscriptions[i].id
        });
      }

    }else {
      createBanks.push({
        user_id: userId,
        name: data.bank_name,
        account_holder_name: data.account_holder_name,
        payment_method_id: paymentMethodId,
        is_default: data.is_default,
        global_default: globalDefault,
        type: 1,
        last_digit: data.last_digit,
        subscription_id: data.subscription_id
      });
    }
    await this.Models.Cards.bulkCreate(createBanks);
    return paymentMethodId;
  };



  getPaymentMethodList = async (customerId, subscriptionId) => {
    try {
      const cards = await stripe.paymentMethods.list({
        customer: customerId,
      });

      console.log(cards, "====cards=========");

      let formattedCards = [];
      let formattedBanks = [];
      let paymentMethodList = {};

      if(cards.data.length > 0) {
        for(let i in cards.data) {

          let findCard = await this.Models.Cards.findOne({
            where: {
              payment_method_id: cards.data[i].id,
              subscription_id: subscriptionId,
              deleted_at: null
            },
            raw: true
          });

          if(findCard) {
            if(cards.data[i].type == "card") {
              formattedCards.push({
                id: cards.data[i].id,
                name: cards.data[i].card.name,
                brand: cards.data[i].card.brand,
                last4: cards.data[i].card.last4,
                exp_month: cards.data[i].card.exp_month,
                exp_year: cards.data[i].card.exp_year,
                is_default: (findCard && findCard.is_default == 1) ? 1 : 0,
                type: 0
              })
            }else {
              formattedBanks.push({
                id: cards.data[i].id,
                name: cards.data[i].us_bank_account.bank_name,
                account_holder_name: cards.data[i].billing_details.name,
                routing_number: cards.data[i].us_bank_account.routing_number,
                last4: cards.data[i].us_bank_account.last4,
                is_default: (findCard && findCard.is_default == 1) ? 1 : 0,
                type: 1
              })
            }
          }

        }
      }
      paymentMethodList = {
        "cards": formattedCards,
        "banks": formattedBanks
      }
      return paymentMethodList;
    } catch (error) {
      console.error('Error retrieving card list:', error);
      throw error;
    }
  };



  /* update bank in stripe */
  updateBankInStripe = async (customerId, data) => {
    // update a card

    let createBanks = [];
    let globalDefault = data.is_default;
    if (data.account_holder_name) {

      if(data.payment_method_id.startsWith("p")) {
        await stripe.paymentMethods.update(
          data.payment_method_id,
          {
            billing_details: {
              name: data.account_holder_name,
            },
          }
        );

      }else {
        await stripe.customers.updateSource(
          customerId,
          data.payment_method_id,{
            account_holder_name: data.account_holder_name,
          }
        );
      }

    };

    await this.Models.Cards.update({
      account_holder_name: data.account_holder_name
    },{
      where: {
        id: data.bank_id,
        subscription_id: data.subscription_id,
        deleted_at: null
      }
    });

    let getPaymentMethod = await this.Models.Cards.findOne({
      where: {
        payment_method_id: data.payment_method_id,
        subscription_id: data.subscription_id,
        user_id: data.user_id
      },
      raw: true
    });

    if(data.is_default == 1) {

      if(getPaymentMethod) {

        let getSubscriptionId = await this.Models.ClientSubscriptions.findOne({
          attributes: ["id", "stripe_subscription_id"],
          where: {
            id: getPaymentMethod.subscription_id,
            deleted_at: null,
          },
          raw: true
        });

        let updateParams = {
          default_payment_method: getPaymentMethod.payment_method_id,
        }
 
        if(getSubscriptionId.stripe_subscription_id){
          await this.updateSubscriptionsParam(getSubscriptionId.stripe_subscription_id, updateParams);
        }

        await this.Models.Cards.update({
          is_default: 1
        },{
          where: {
            payment_method_id: data.payment_method_id,
            user_id: data.user_id,
            subscription_id: getPaymentMethod.subscription_id,
            type: 1
          }
        });

        await this.Models.Cards.update({
          is_default: 0
        },{
          where: {
            payment_method_id: {
              [Op.ne]: data.payment_method_id
            },
            user_id: data.user_id,
            subscription_id: getPaymentMethod.subscription_id,
            deleted_at: null,
            type: 1
          }
        });
      }
    }else if(data.is_default == 2) {

      let getUserAllSubscriptions = await this.Models.ClientSubscriptions.findAll({
        attributes: ["id", "stripe_subscription_id", "payment_method"],
        where: {
          client_id: data.user_id,
          deleted_at: null,
          billing_frequency: {
            [Op.ne]: 1
          },
          status: [1,2],
          payment_method: "bank_account"
        },
        raw: true
      });

      await this.Models.Cards.update({
        is_default: 0,
        global_default: 0,
      },{
        where: {
          user_id: data.user_id,
          deleted_at: null,
          type: 1,
        }
      });

      await this.Models.Cards.update({
        is_default: 1,
        global_default: 1,
      },{
        where: {
          payment_method_id: data.payment_method_id,
          subscription_id: getPaymentMethod.subscription_id,
        }
      });

      for(let i in getUserAllSubscriptions) {

        if(getUserAllSubscriptions[i].id == data.subscription_id) {
          globalDefault = 1;
        }

        let updateParams = {
          default_payment_method: data.payment_method_id,
          default_tax_rates: null,
        }
        await this.updateSubscriptionsParam(getUserAllSubscriptions[i].stripe_subscription_id, updateParams);
  
        let getBankExist = await this.Models.Cards.findOne({
          where: {
            subscription_id: getUserAllSubscriptions[i].id,
            user_id: data.user_id,
            payment_method_id: data.payment_method_id,
            deleted_at: null,
            type: 1,
          },
          raw: true
        });

        console.log(getBankExist, "=====getBankExist======");

        if(!getBankExist) {

          createBanks.push({
            user_id: data.user_id,
            name: data.name,
            account_holder_name: data.account_holder_name,
            payment_method_id: data.payment_method_id,
            is_default: 1,
            global_default: globalDefault,
            type: 1,
            last_digit: data.last_digit,
            subscription_id: getUserAllSubscriptions[i].id
          });

        }else {

          await this.Models.Cards.update({
            is_default: 1,
            global_default: globalDefault,
          },{
            where: {
              payment_method_id: data.payment_method_id,
              subscription_id: getUserAllSubscriptions[i].id,
              type: 1
            }
          });
        }
      }

      await this.Models.Cards.bulkCreate(createBanks);
    }
    return true;
  };


  // Set default payment method of subscription 
  setDefaultSubscriptionPaymentMethod = async (subscriptionId, paymentmethodId) => {
    return await stripe.subscriptions.update(subscriptionId, {
      default_payment_method: paymentmethodId,
    });
  };


  // update Subscriptions Param 
  updateSubscriptionsParam = async (subscriptionId, data) => {
    return await stripe.subscriptions.update(subscriptionId, data);
  };


  /** update subscription data */
  updateSubscriptionWithCondition = async (data, condition) => {
    return await this.Models.ClientSubscriptions.update(data, { where: condition });
  };


  /** get Card Info By Id */
  getCardInfoById = async (cardId, userId) => {
    let findCard = await this.Models.Cards.findOne({
      where: {
        payment_method_id: cardId,
        user_id: userId,
        deleted_at: null
      },
      raw: true
    });
    return findCard;
  };


  /** get Card Info By Crd Id */
  getCardInfoByCardId = async (cardId, userId) => {
    let findCard = await this.Models.Cards.findOne({
      where: {
        id: cardId,
        user_id: userId,
        deleted_at: null
      },
      raw: true
    });
    return findCard;
  };


  /** Get payment methods are added in one time subscription */
  getPaymentMethodOneTimeSubscription = async (customerId, subscriptionId) => {
    try {

      let formattedCards = [];
      let formattedBanks = [];
      let paymentMethodList = {};

      let findCards = await this.Models.Cards.findAll({
        where: {
          subscription_id: subscriptionId,
          deleted_at: null
        },
        raw: true
      });

      console.log(findCards, "====findCards====");

      for(let i in findCards) {

        if(findCards[i].payment_method_id.startsWith("p")) {
   
          const cardPaymentMethod = await stripe.paymentMethods.retrieve(
            findCards[i].payment_method_id
          );

          if(cardPaymentMethod) {

            if(cardPaymentMethod.type == "card") {
              formattedCards.push({
                id: findCards[i].id,
                payment_method_id: cardPaymentMethod.id,
                name: cardPaymentMethod.card.name,
                brand: cardPaymentMethod.card.brand,
                last4: cardPaymentMethod.card.last4,
                exp_month: cardPaymentMethod.card.exp_month,
                exp_year: cardPaymentMethod.card.exp_year,
                is_default: (findCards && findCards[i].is_default == 1) ? 1 : 0,
                type: 0
              })
            }else {
              formattedBanks.push({
                id: findCards[i].id,
                payment_method_id: cardPaymentMethod.id,
                name: cardPaymentMethod.us_bank_account.bank_name,
                account_holder_name: cardPaymentMethod.billing_details.name,
                routing_number: cardPaymentMethod.us_bank_account.routing_number,
                last4: cardPaymentMethod.us_bank_account.last4,
                is_default: (findCards && findCards[i].is_default == 1) ? 1 : 0,
                type: 1
              })
            }
          }
        }else {
          formattedBanks.push({
            id: findCards[i].id,
            payment_method_id: findCards[i].id,
            name: findCards[i].name,
            account_holder_name: findCards[i].account_holder_name,
            last4: findCards[i].last_digit,
            is_default: (findCards && findCards[i].is_default == 1) ? 1 : 0,
            type: 1
          })
        }
      }
      paymentMethodList = {
        "cards": formattedCards,
        "banks": formattedBanks
      }
      return paymentMethodList;
    } catch (error) {
      console.error('Error retrieving card list:', error);
      throw error;
    }
  };


  /** get Card detail By condition */
  getPaymentMethodInfoByCondition = async (whereCondition) => {
    let getPaymentMethod = await this.Models.Cards.findOne({
      where: whereCondition,
      raw: true
    });
    return getPaymentMethod;
  };

  /** update invoice payment method options */
  updateInvoicePaymentMethod = async (invoiceId, paymentMethodType) => {
    const updateInvoice = await stripe.invoices.update(invoiceId, {
      payment_settings: {
        payment_method_types: paymentMethodType,
      },
    });
    return updateInvoice;
  };


}

