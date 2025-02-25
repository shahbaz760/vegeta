import sequelize from 'sequelize';
const Op = sequelize.Op;
import { ASSIGNED_USERS, PAGINATION, RESPONSE_CODES, ROLES, RECENT_ACTIVITY_TYPE } from '../../../config/constants';
import { successResponse, errorResponse } from "../../../config/responseHelper";


export default class Agent {
  async init(db) {
    this.Models = db.models;
  }

  /** create agent */
  createAgent = async (data) => {
    return await this.Models.Users.create(data);
  };

  /** get user by email*/
  getAgentByMail = async (email) => {
    return this.Models.Users.findOne({
      where: {
        email: email,
        // role_id: ROLES.AGENT
      },
      raw: true
    });
  };

  /** get Agent by agentId*/
  getAgentByAgentId = async (AgentId) => {
    return this.Models.Users.findOne({
      where: {
        id: AgentId,
        role_id: ROLES.AGENT
      },
      raw: true
    });
  };

  /** Get agent information  */
  getAgentInformation = async (data) => {
    return this.Models.Users.findOne({
      attributes: ["id", "role_id", "first_name", "last_name", "email", "country_code", "phone_number", "address", "address2", "country", "state", "city", "zipcode", "user_image", "company_name", "two_factor_authentication", "created_at", "updated_at", [sequelize.literal(`
      CASE
        WHEN status = 0 THEN 'Pending'
        WHEN status = 1 THEN 'Active'
        WHEN status = 2 THEN 'Inactive'
        ELSE 'Inactive'
      END
    `), 'status']],
      include: [
        {
          model: this.Models.AgentAttachments,
          as: "attachments",
          where: { deleted_at: null },
          required: false,
        },
        {
          model: this.Models.AssignedUsers,
          attributes: {
            include: [[sequelize.literal("(SELECT first_name FROM users WHERE users.id = user_id)"), "first_name"], [sequelize.literal("(SELECT last_name FROM users WHERE users.id = user_id)"), "last_name"], [sequelize.literal("(SELECT user_image FROM users WHERE users.id = user_id)"), "user_image"], [sequelize.literal("(SELECT company_name FROM users WHERE users.id = user_id)"), "company_name"], [sequelize.literal(`
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
      `), 'status']]
          },
          as: "assigned_agent_client",
          where: { deleted_at: null },
          required: false,
        }
      ],
      where: data,

    });
  };

  /** get all agent list with pagination and search filter and total count*/
  getAgentList = async (body, user) => {
    let havingCondition = {
      deleted_at: null,
      role_id: ROLES.AGENT,
    };

    let agentCountWithoutSearchCondition = {
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

    let attributes = ["id", "role_id", "first_name", "last_name", "email", "country_code", "phone_number", "address", "user_image", "company_name", "is_complete_profile", "deleted_at", "created_at", "updated_at", [sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = users.id)"), "userName"], [sequelize.literal(`
      CASE
        WHEN status = 0 THEN 'Pending'
        WHEN status = 1 THEN 'Active'
        WHEN status = 2 THEN 'Inactive'
        ELSE 'Inactive'
      END
    `), 'status'], [sequelize.literal("(SELECT FROM_UNIXTIME(login_time, '%Y-%m-%d %H:%i:%s') FROM user_login_times WHERE user_login_times.user_id = users.id ORDER BY user_login_times.id DESC limit 1)"), "last_login"], [sequelize.literal(0), 'is_delete_access']];

    if(user.role_id == ROLES.ACCOUNTMANAGER) {
      let setAttributes = ["id", "agent_view", "agent_delete", "deleted_at"];
      let getPermission = await this.getAccountManagerRolePermissions(user.role_permission_id, setAttributes);
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

        if(getAgentIds.length == 0) {
          getAgentIds = [user.id];
        }

        if(getPermission && getPermission.agent_view == 1) {
          havingCondition.id = getAgentIds;
          agentCountWithoutSearchCondition.id = getAgentIds;
        }

        if(getPermission && getPermission.agent_delete == 0 && getAgentIds.length > 0) {
            attributes = ["id", "role_id", "first_name", "last_name", "email", "country_code", "phone_number", "address", "user_image", "company_name", "is_complete_profile", "deleted_at", "created_at", "updated_at", [sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = users.id)"), "userName"], [sequelize.literal(`
              CASE
                WHEN status = 0 THEN 'Pending'
                WHEN status = 1 THEN 'Active'
                WHEN status = 2 THEN 'Inactive'
                ELSE 'Inactive'
              END
            `), 'status'], [sequelize.literal("(SELECT FROM_UNIXTIME(login_time, '%Y-%m-%d %H:%i:%s') FROM user_login_times WHERE user_login_times.user_id = users.id ORDER BY user_login_times.id DESC limit 1)"), "last_login"], [sequelize.literal(1), 'is_delete_access']];

        }else if(getPermission && getPermission.agent_delete == 1 && getAgentIds.length > 0) {
         
            attributes = ["id", "role_id", "first_name", "last_name", "email", "country_code", "phone_number", "address", "user_image", "company_name", "is_complete_profile", "deleted_at", "created_at", "updated_at", [sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = users.id)"), "userName"], [sequelize.literal(`
              CASE
                WHEN status = 0 THEN 'Pending'
                WHEN status = 1 THEN 'Active'
                WHEN status = 2 THEN 'Inactive'
                ELSE 'Inactive'
              END
            `), 'status'], [sequelize.literal("(SELECT FROM_UNIXTIME(login_time, '%Y-%m-%d %H:%i:%s') FROM user_login_times WHERE user_login_times.user_id = users.id ORDER BY user_login_times.id DESC limit 1)"), "last_login"], [sequelize.literal(`CASE  WHEN users.id IN (${getAgentIds.join(',')}) THEN 1 ELSE 0 END`), 'is_delete_access']];
          }

        
    }



    if (body.client_id && body.client_id != 0) {

      attributes = ["id", "role_id", "first_name", "last_name", "email", "country_code", "phone_number", "address", "user_image", "company_name", "is_complete_profile", "deleted_at", "created_at", "updated_at", [sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = users.id)"), "userName"], [
        sequelize.literal(`
            CASE
                WHEN (SELECT COUNT(*) FROM assigned_users WHERE assigned_users.agent_id = users.id AND deleted_at IS NULL AND user_id = ${body.client_id} AND type = 1) > 0
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
    `), 'status'], [sequelize.literal("(SELECT FROM_UNIXTIME(login_time, '%Y-%m-%d %H:%i:%s') FROM user_login_times WHERE user_login_times.user_id = users.id ORDER BY user_login_times.id DESC limit 1)"), "last_login"]];
      havingCondition.is_assigned = 0;
    }

    if (body.group_id && body.group_id != 0) {
      attributes = ["id", "role_id", "first_name", "last_name", "email", "country_code", "phone_number", "address", "user_image", "company_name", "is_complete_profile", "deleted_at", "created_at", "updated_at", [sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = users.id)"), "userName"], [
        sequelize.literal(`CASE
           WHEN (SELECT COUNT(*) FROM agent_group_members WHERE agent_group_members.user_id = users.id AND deleted_at IS NULL AND agent_group_id = ${body.group_id}) > 0 
           THEN 1 ELSE 0 END`), "is_grouped"], [sequelize.literal(`
        CASE
          WHEN status = 0 THEN 'Pending'
          WHEN status = 1 THEN 'Active'
          WHEN status = 2 THEN 'Inactive'
          ELSE 'Inactive'
        END
      `), 'status'], [sequelize.literal("(SELECT FROM_UNIXTIME(login_time, '%Y-%m-%d %H:%i:%s') FROM user_login_times WHERE user_login_times.user_id = users.id ORDER BY user_login_times.id DESC limit 1)"), "last_login"]];
      havingCondition.is_grouped = 0;
    }

    const allAgentCount = await this.Models.Users.findAll({
      attributes: attributes,
      having: havingCondition,
    });

    const allAgentCountWithoutSearch = await this.Models.Users.count({
      where: agentCountWithoutSearchCondition
    });


    const getAllAgents = await this.Models.Users.findAll({
      attributes: attributes,
      having: havingCondition,
      order: [
        ['id', 'DESC'],
      ],
      offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
      limit: (body.limit == -1) ? allAgentCount.length : parseInt(body.limit) || PAGINATION.LIMIT,
      raw: true,
    });

    return { list: getAllAgents, total_records: allAgentCount.length, total_count: allAgentCountWithoutSearch, filtered_records: getAllAgents.length }
  };



  /** get group by name*/
  getAgentGroupByName = async (groupName) => {
    return this.Models.AgentGroups.findOne({
      where: {
        group_name: groupName,
        deleted_at: null
      },
      raw: true
    });
  };


  /** create agent group */
  createAgentGroup = async (data) => {
    return await this.Models.AgentGroups.create(data);
  };


  /** get all agent group list with pagination and search filter and total count*/
  getAgentGroupList = async (body, user) => {
    let whereCondition = {
      deleted_at: null,
    };

    let whereConditionWithoutSearch = {
      deleted_at: null,
    };

    if (body.search) {
      whereCondition = {
        [Op.or]: [
          { group_name: { [Op.like]: `%${body.search}%` } }
        ],
        deleted_at: null,
      }
    }

    let attributes = {
      include: [
        [
          sequelize.literal(
            `(SELECT Count(*) FROM agent_group_members WHERE agent_group_members.agent_group_id = agent_groups.id AND agent_group_members.deleted_at IS NULL)`
          ),
          "members_count",
        ],[sequelize.literal(0), 'is_delete_access'], [sequelize.literal(0), 'is_edit_access']
      ],
    };
    let getAgentGroupIds = [];
    if(user.role_id == ROLES.ACCOUNTMANAGER) {
      let setAttributes = ["id", "is_agent_group_access", "agent_group_view", "agent_group_edit", "agent_group_delete", "deleted_at"];
      let getPermission = await this.getAccountManagerRolePermissions(user.role_permission_id, setAttributes);
      
      if(getPermission && getPermission.is_agent_group_access == 1 && getPermission.agent_group_view == 1) {

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

        let getAgentIds = getAllAgentsOfClients.map(val => val.agent_id);
        let getAgentGroups = await this.Models.AgentGroupMembers.findAll({
          // group: ["agent_group_id"],
          where: {
            user_id: getAgentIds,
            deleted_at: null
          },
          raw: true
        });
        getAgentGroupIds = getAgentGroups.map(val => val.agent_group_id);
        if(getAgentGroupIds.length == 0) {
          getAgentGroupIds.push(user.id);
        }
        whereCondition.id = getAgentGroupIds;
        whereConditionWithoutSearch.id = getAgentGroupIds;

      }else if(getPermission && getPermission.is_agent_group_access == 1 && getPermission.agent_group_view == 0){
         
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

        let getAgentIds = getAllAgentsOfClients.map(val => val.agent_id);
        let getAgentGroups = await this.Models.AgentGroupMembers.findAll({
          // group: ["agent_group_id"],
          where: {
            user_id: getAgentIds,
            deleted_at: null
          },
          raw: true
        });
        getAgentGroupIds = getAgentGroups.map(val => val.agent_group_id);
        if(getAgentGroupIds.length == 0) {
          getAgentGroupIds.push(user.id);
        }
      }

      if(getPermission && getPermission.agent_group_delete == 1) {
       
        if(getAgentGroupIds.length > 0) {
          attributes.include = attributes.include.map(attr =>
            attr[1] === 'is_delete_access'
              ? [sequelize.literal(`CASE WHEN id IN (${getAgentGroupIds.join(',')}) THEN 1 ELSE 0 END`), 'is_delete_access']
              : attr
          );
        }


      }else if (getPermission && getPermission.agent_group_delete == 0) {
        attributes.include = attributes.include.map(attr =>
          attr[1] === 'is_delete_access'
            ? [sequelize.literal(1), 'is_delete_access']
            : attr
        );
      }


      if(getPermission && getPermission.agent_group_edit == 1) {

        if(getAgentGroupIds.length > 0) {
          attributes.include = attributes.include.map(attr =>
            attr[1] === 'is_edit_access'
              ? [sequelize.literal(`CASE WHEN id IN (${getAgentGroupIds.join(',')}) THEN 1 ELSE 0 END`), 'is_edit_access']
              : attr
          );
        }

      }else if (getPermission && getPermission.agent_group_edit == 0) {
        attributes.include = attributes.include.map(attr =>
          attr[1] === 'is_edit_access'
            ? [sequelize.literal(1), 'is_edit_access']
            : attr
        );
      }
    }

    const allAgentGroupCount = await this.Models.AgentGroups.count({
      where: whereCondition,
    });

    //all agent group list without search
    const allAgentGroupCountWithoutSearch = await this.Models.AgentGroups.count({
      where: whereConditionWithoutSearch
    });

    const getAllAgents = await this.Models.AgentGroups.findAll({
      attributes: attributes,
      include: [
        {
          model: this.Models.AgentGroupMembers,
          as: "group_members",
          where: { deleted_at: null },
          required: false,
        },
      ],
      where: whereCondition,
      order: [
        ['id', 'DESC'],
        [
          { model: this.Models.AgentGroupMembers, as: "group_members" },
          "id",
          "DESC",
        ],
      ],
      offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
      limit: (body.limit == -1) ? allAgentGroupCount : parseInt(body.limit) || PAGINATION.LIMIT,
    });

    return { list: getAllAgents, total_records: allAgentGroupCount, total_count: allAgentGroupCountWithoutSearch, filtered_records: getAllAgents.length }
  };


  /** get group by id*/
  getAgentGroupById = async (groupId) => {
    return this.Models.AgentGroups.findOne({
      where: {
        id: groupId,
        deleted_at: null
      },
      raw: true
    });
  };

  /** create agent group members */
  createAgentGroupMember = async (data) => {
    return await this.Models.AgentGroupMembers.create(data);
  };

  /** update agent group by condition*/
  updateAgentGroup = async (data, groupId) => {
    await this.Models.AgentGroups.update(data, { where: { id: groupId } });
  };


  /** check group name by group id*/
  checkAgentGroupNameById = async (groupName, groupId) => {
    return this.Models.AgentGroups.findOne({
      where: {
        id: {
          [Op.ne]: groupId
        },
        group_name: groupName,
        deleted_at: null
      },
      raw: true
    });
  };

  /** get group by id*/
  getAgentGroupInfo = async (groupId, user) => {

    let attributes = {
      include: [
        [
          sequelize.literal(
            `(SELECT Count(*) FROM agent_group_members WHERE agent_group_members.agent_group_id = agent_groups.id AND deleted_at IS NULL)`
          ),
          "members_count",
        ],[sequelize.literal(0), 'is_edit_access']
      ],
    };

    if(user.role_id == ROLES.ACCOUNTMANAGER) {
      let getAgentGroupIds = [];
      let setAttributes = ["id", "is_agent_group_access", "agent_group_view", "agent_group_edit", "agent_group_delete", "deleted_at"];
      let getPermission = await this.getAccountManagerRolePermissions(user.role_permission_id, setAttributes);

      if(getPermission && getPermission.is_agent_group_access == 1 && getPermission.agent_group_edit == 1) {

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

        let getAgentIds = getAllAgentsOfClients.map(val => val.agent_id);
        let getAgentGroups = await this.Models.AgentGroupMembers.findAll({
          group: ["agent_group_id"],
          where: {
            user_id: getAgentIds
          },
          raw: true
        });
        getAgentGroupIds = getAgentGroups.map(val => val.agent_group_id);

        if(getPermission && getPermission.agent_group_delete == 1) {
          attributes = {
            include: [
              [
                sequelize.literal(
                  `(SELECT Count(*) FROM agent_group_members WHERE agent_group_members.agent_group_id = agent_groups.id AND deleted_at IS NULL)`
                ),
                "members_count",
              ], [sequelize.literal(`CASE WHEN agent_groups.id IN (${getAgentGroupIds.join(',')}) THEN 1 ELSE 0 END`), 'is_edit_access']
            ],
          };

        }

      }

    }


    return await this.Models.AgentGroups.findOne({
      attributes: attributes,
      include: [
        {
          model: this.Models.AgentGroupMembers,
          attributes: { include: [[sequelize.literal("(SELECT first_name FROM users WHERE users.id = group_members.user_id)"), "first_name"], [sequelize.literal("(SELECT last_name FROM users WHERE users.id = group_members.user_id)"), "last_name"]] },
          as: "group_members",
          where: { deleted_at: null },
          required: false,
        },
      ],
      order: [
        [
          { model: this.Models.AgentGroupMembers, as: "group_members" },
          "id",
          "DESC",
        ],
      ],
      where: {
        id: groupId,
        deleted_at: null
      },
    });
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


  addAttachments = async (files, data) => {
    let agentAttachment = [];
    if (files.length > 0) {
      for (const i in files) {
        agentAttachment.push({
          added_by: data.added_by,
          agent_id: data.agent_id,
          file: files[i].file_key,
        });
      }
      return await this.Models.AgentAttachments.bulkCreate(agentAttachment);
    }
  };

  /**  get Agent attachment */
  getAttachmentById = async (attachmentId) => {
    return this.Models.AgentAttachments.findOne({
      where: {
        id: attachmentId,
        deleted_at: null
      },
      raw: true
    });
  };

  /** update Agent attachment */
  updateAgentAttachment = async (data, attachmentId) => {
    await this.Models.AgentAttachments.update(data, { where: { id: attachmentId } });
  };


  /** update agent detail by condition*/
  updateAgentDetail = async (data, agentId) => {
    await this.Models.Users.update(data, { where: { id: agentId } });
  };

  /**  get Agent group member */
  getGroupMemberById = async (memberId) => {
    return this.Models.AgentGroupMembers.findOne({
      where: {
        id: memberId,
        deleted_at: null
      },
      raw: true
    });
  };


  /** update agent group member by condition*/
  updateAgentGroupMemberDetail = async (data, memberId) => {
    await this.Models.AgentGroupMembers.update(data, { where: { id: memberId } });
  };


  /** get agent group members by ids */
  getGroupMembersByMemberId = async (memberIds) => {
    return this.Models.AgentGroupMembers.findAll({
      attributes: { include: [[sequelize.literal("(SELECT first_name FROM users  WHERE users.id = agent_group_members.user_id)"), "first_name"], [sequelize.literal("(SELECT last_name FROM users  WHERE users.id = agent_group_members.user_id)"), "last_name"], [sequelize.literal("(SELECT email FROM users  WHERE users.id = agent_group_members.user_id)"), "email"]] },
      where: {
        id: memberIds,
        deleted_at: null
      },
      raw: true
    });
  };

  getAgentGroupMemberList = async (group_id, body, user) => {
    let whereCondition = {
      deleted_at: null,
      agent_group_id: group_id
    };

    let attributes = ["id", "group_name",[sequelize.literal(0), 'is_edit_access']];

    if(user.role_id == ROLES.ACCOUNTMANAGER) {
      let setAttributes = ["id", "agent_view", "agent_delete", "agent_group_edit", "deleted_at"];
      let getPermission = await this.getAccountManagerRolePermissions(user.role_permission_id, setAttributes);

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
        let getAgentIds = getAllAgentsOfClients.map(val => val.agent_id);

        let getAllAgentsOfmanager = await this.Models.AssignedUsers.findAll({
          attribute: ["id", "type", "account_manager_id", "agent_id", "deleted_at"],
          where: {
            account_manager_id: user.id,
            type: ASSIGNED_USERS.AGENTS_TO_ACCOUNT_MANAGER,
            deleted_at: null
          },
          raw: true,
        });
        let getManagerAgentIds = getAllAgentsOfmanager.map(val => val.agent_id);
        let getAllAgentIds = getAgentIds.concat(getManagerAgentIds);

        if(getPermission && getPermission.agent_view == 1) {
          whereCondition = {
            user_id: getAllAgentIds,
            deleted_at: null,
            agent_group_id: group_id
          };
        }
        let getAgentGroups = await this.Models.AgentGroupMembers.findAll({
          where: {
            user_id: getAllAgentIds,
            deleted_at: null
          },
          raw: true
        });

        let getAgentGroupIds = getAgentGroups.map(val => val.agent_group_id);

        if(getPermission && getPermission.agent_group_edit == 0) {
          attributes = ["id", "group_name",[sequelize.literal(1), 'is_edit_access']];
        }else if(getPermission && getPermission.agent_group_edit == 1){
          attributes = ["id", "group_name", 
            [sequelize.literal(`CASE WHEN id IN (${getAgentGroupIds.join(',')}) THEN 1 ELSE 0 END`), 'is_edit_access']
            ];
        }
    }

    const allAgentCount = await this.Models.AgentGroupMembers.count({
      where: whereCondition,
    });

    const groupName = await this.Models.AgentGroups.findOne({
      attributes: attributes,
      where: {
        deleted_at: null,
        id: group_id
      },
      raw: true
    })

    const getAllAssignedAgents = await this.Models.AgentGroupMembers.findAll({
      attributes: ["id", "agent_group_id"],
      where: whereCondition,
      order: [
        ['id', 'DESC'],
      ],
      include: [
        {
          model: this.Models.Users,
          as: "member_details",
          attributes: ["id", "first_name", "last_name"]
        },
      ],

      offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
      limit: (body.limit == -1) ? allAgentCount : parseInt(body.limit) || PAGINATION.LIMIT,
    });

    return { group_name: groupName.group_name, is_edit_access: groupName.is_edit_access, list: getAllAssignedAgents, total_count: allAgentCount, total_records: allAgentCount, filtered_records: getAllAssignedAgents.length }
  };

  /* create login time */
  createLoginTime = async (data) => {
    return this.Models.UserLoginTime.create(data);
  }



  /** get assigned user ids acc. to auth token  */
  getAssignedUserIdForAdminUser = async (userId, roleId, addedBy, userData) => {
    let allUserIds = [];
    // let findAdmins = await this.Models.Users.findAll({
    //   attributes: ["id"],
    //   where: {
    //     deleted_at: null,
    //     role_id: ROLES.ADMIN
    //   },
    //   raw: true,
    // });
    // let getAdminds = findAdmins.map(val => val.id);
    // allUserIds.push(getAdminds);

    if (roleId == ROLES.CLIENT) {

      let getAssignedAgent = await this.Models.AssignedUsers.findAll({
        attributes: ["agent_id", "deleted_at", "user_id", "type"],
        where: {
          deleted_at: null,
          user_id: userId,
          type: ASSIGNED_USERS.CLIENTS_TO_AGENT
        },
        raw: true,
      });
      let getAgentIds = getAssignedAgent.map(val => val.agent_id);
      allUserIds.push(getAgentIds);

      let getAssignedAccountmanager = await this.Models.AssignedUsers.findAll({
        attributes: ["account_manager_id", "deleted_at", "user_id", "type"],
        where: {
          deleted_at: null,
          user_id: userId,
          type: ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER
        },
        raw: true,
      });
      let getAccountmanagerIds = getAssignedAccountmanager.map(val => val.account_manager_id);
      allUserIds.push(getAccountmanagerIds);

      let getAllClientUsers = await this.Models.Users.findAll({
        attributes: ["id", "role_id", "deleted_at", "added_by"],
        where: {
          deleted_at: null,
          role_id: ROLES.USER,
          added_by: userId
        },
        raw: true,
      });
      let getUserIds = getAllClientUsers.map(val => val.id);
      allUserIds.push(getUserIds);

    } else if (roleId == ROLES.AGENT) {

      let getAssignedClient = await this.Models.AssignedUsers.findAll({
        attributes: ["agent_id", "deleted_at", "user_id", "type"],
        where: {
          deleted_at: null,
          agent_id: userId,
          type: ASSIGNED_USERS.CLIENTS_TO_AGENT
        },
        raw: true,
      });

      let getClientIds = getAssignedClient.map(val => val.user_id);
      allUserIds.push(getClientIds);

      let getAllClientUsers = await this.Models.Users.findAll({
        attributes: ["id", "role_id", "deleted_at", "added_by"],
        where: {
          deleted_at: null,
          role_id: ROLES.USER,
          added_by: getClientIds
        },
        raw: true,
      });
      let getUserIds = getAllClientUsers.map(val => val.id);
      allUserIds.push(getUserIds);

      let getAssignedAccountmanager = await this.Models.AssignedUsers.findAll({
        attributes: ["account_manager_id", "deleted_at", "user_id", "type"],
        where: {
          deleted_at: null,
          user_id: getClientIds,
          type: ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER
        },
        raw: true,
      });
      let getAccountmanagerIds = getAssignedAccountmanager.map(val => val.account_manager_id);
      allUserIds.push(getAccountmanagerIds);

    } else if (roleId == ROLES.ACCOUNTMANAGER) {

      let setAttributes = ["id", "chat", "deleted_at"];
      let getPermission = await this.getAccountManagerRolePermissions(userData.role_permission_id, setAttributes);
      if(getPermission && getPermission.chat == 1) {
        let getAssignedClient = await this.Models.AssignedUsers.findAll({
          attributes: ["account_manager_id", "deleted_at", "user_id", "type"],
          where: {
            deleted_at: null,
            account_manager_id: userId,
            type: ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER
          },
          raw: true,
        });

        let getClientIds = getAssignedClient.map(val => val.user_id);
        allUserIds.push(getClientIds);

        let getAssignedAgents = await this.Models.AssignedUsers.findAll({
          attributes: ["agent_id", "deleted_at", "user_id", "type"],
          where: {
            deleted_at: null,
            user_id: getClientIds,
            type: ASSIGNED_USERS.CLIENTS_TO_AGENT
          },
          raw: true,
        });
        let getAgentIds = getAssignedAgents.map(val => val.agent_id);
        allUserIds.push(getAgentIds);

        let getAssignedManagerAgents = await this.Models.AssignedUsers.findAll({
          attributes: ["agent_id", "deleted_at", "account_manager_id", "type"],
          where: {
            deleted_at: null,
            account_manager_id: userId,
            type: ASSIGNED_USERS.AGENTS_TO_ACCOUNT_MANAGER
          },
          raw: true,
        });
        let getManagerAgentIds = getAssignedManagerAgents.map(val => val.agent_id);
        allUserIds.push(getManagerAgentIds);

        let getAllClientUsers = await this.Models.Users.findAll({
          attributes: ["id", "role_id", "deleted_at", "added_by"],
          where: {
            deleted_at: null,
            role_id: ROLES.USER,
            added_by: getClientIds
          },
          raw: true,
        });
        let getUserIds = getAllClientUsers.map(val => val.id);
        allUserIds.push(getUserIds);
        
      }else {

        let getAllUsersList = await this.Models.Users.findAll({
          attributes: ["id"],
          where: {
            role_id: {
              [Op.ne]: 1
            },
            deleted_at: null,
          },
          raw: true,
        });
        let getAllUserIds = getAllUsersList.map(val => val.id);
        allUserIds.push(getAllUserIds);
      }
    } else if (roleId == ROLES.USER) {

      allUserIds.push(addedBy);
      let getAssignedAgent = await this.Models.AssignedUsers.findAll({
        attributes: ["agent_id", "deleted_at", "user_id", "type"],
        where: {
          deleted_at: null,
          user_id: addedBy,
          type: ASSIGNED_USERS.CLIENTS_TO_AGENT
        },
        raw: true,
      });
      let getAgentIds = getAssignedAgent.map(val => val.agent_id);
      allUserIds.push(getAgentIds);

      let getAssignedAccountmanager = await this.Models.AssignedUsers.findAll({
        attributes: ["account_manager_id", "deleted_at", "user_id", "type"],
        where: {
          deleted_at: null,
          user_id: addedBy,
          type: ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER
        },
        raw: true,
      });
      let getAccountmanagerIds = getAssignedAccountmanager.map(val => val.account_manager_id);
      allUserIds.push(getAccountmanagerIds);

      let getAllClientUsers = await this.Models.Users.findAll({
        attributes: ["id", "role_id", "deleted_at", "added_by"],
        where: {
          deleted_at: null,
          id: {
            [Op.ne]: userId
          },
          role_id: ROLES.USER,
          added_by: addedBy
        },
        raw: true,
      });
      let getUserIds = getAllClientUsers.map(val => val.id);
      allUserIds.push(getUserIds);

    } 
    let findUserIds = allUserIds.flat();
    return findUserIds
  };


  /** Get agent information  */
  getAgentInformationById = async (data, user) => {
    return this.Models.Users.findOne({
      attributes: ["id", "role_id", "first_name", "last_name", "email", "country_code", "phone_number", "address", "address2", "country", "state", "city", "zipcode", "user_image", "company_name", "two_factor_authentication", "created_at", "updated_at", [sequelize.literal(`
      CASE
        WHEN status = 0 THEN 'Pending'
        WHEN status = 1 THEN 'Active'
        WHEN status = 2 THEN 'Inactive'
        ELSE 'Inactive'
      END
    `), 'status']],
      include: [
        {
          model: this.Models.AgentAttachments,
          as: "attachments",
          where: { deleted_at: null },
          required: false,
        },
        {
          model: this.Models.AssignedUsers,
          attributes: {
            include: [[sequelize.literal("(SELECT first_name FROM users WHERE users.id = user_id)"), "first_name"], [sequelize.literal("(SELECT last_name FROM users WHERE users.id = user_id)"), "last_name"], [sequelize.literal("(SELECT user_image FROM users WHERE users.id = user_id)"), "user_image"], [sequelize.literal("(SELECT company_name FROM users WHERE users.id = user_id)"), "company_name"], [sequelize.literal(`
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
      `), 'status']]
          },
          as: "assigned_agent_client",
          where: { deleted_at: null },
          required: false,
        }
      ],
      where: data,

    });
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

  /** Get Agent Access as per Permissions */
  getAgentAccess = async (agentId, user) => {
    let is_edit_access = 0;
    let is_delete_access = 0;
    if(user.role_id == ROLES.ACCOUNTMANAGER) {
      let setAttributes = ["id", "agent_delete", "agent_edit", "deleted_at"];
      let getPermission = await this.getAccountManagerRolePermissions(user.role_permission_id, setAttributes);
        let getAgentClientIds = await this.Models.AssignedUsers.findAll({
          attribute: ["id", "type", "user_id", "agent_id", "deleted_at"],
          where: {
            agent_id: agentId,
            type: ASSIGNED_USERS.CLIENTS_TO_AGENT,
            deleted_at: null
          },
          raw: true,
        });

        let getClientIds = getAgentClientIds.map(val => val.user_id);
        let checkAccountManager = await this.Models.AssignedUsers.findOne({
          attribute: ["id", "type", "user_id", "account_manager_id", "deleted_at"],
          where: {
            account_manager_id: user.id,
            user_id: getClientIds,
            type: ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER,
            deleted_at: null
          },
          raw: true,
        });

      if(checkAccountManager && getPermission && getPermission.agent_delete == 1) {
        is_delete_access = 1;
      }
      if(getPermission && getPermission.agent_delete == 0) {
        is_delete_access = 1;
      }
      if(checkAccountManager && getPermission && getPermission.agent_edit == 1) {
        is_edit_access = 1;
      }

      if(getPermission && getPermission.agent_edit == 0) {
        is_edit_access = 1;
      }
    }
    let finalData = {
      is_edit_access: is_edit_access,
      is_delete_access: is_delete_access
    };
    return finalData;
};


  /** Get agent detail by agent id  */
  getAgentDetailByAgentId = async (data, user) => {
    let getClientIds = [data.id];

    let assinedUserCondition = { 
      deleted_at: null,
      user_id: {
        [Op.ne]: null // Use the array directly
      },
    };

    if(user.role_id == ROLES.ACCOUNTMANAGER) {
      let setAttributes = ["id", "client_view", "deleted_at"];
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
          },
        };
      }
    }

    return this.Models.Users.findOne({
      attributes: ["id", "role_id", "first_name", "last_name", "email", "country_code", "phone_number", "address", "address2", "country", "state", "city", "zipcode", "user_image", "company_name", "two_factor_authentication", "kyc_front_pic", "kyc_back_pic", "captured_pic", "is_complete_profile", "created_at", "updated_at", [sequelize.literal(`
      CASE
        WHEN status = 0 THEN 'Pending'
        WHEN status = 1 THEN 'Active'
        WHEN status = 2 THEN 'Inactive'
        ELSE 'Inactive'
      END
    `), 'status']],
      include: [
        {
          model: this.Models.AgentAttachments,
          as: "attachments",
          where: { deleted_at: null },
          required: false,
        },
        {
          model: this.Models.AssignedUsers,
          attributes: {
            include: [[sequelize.literal("(SELECT first_name FROM users WHERE users.id = user_id)"), "first_name"], [sequelize.literal("(SELECT last_name FROM users WHERE users.id = user_id)"), "last_name"], [sequelize.literal("(SELECT user_image FROM users WHERE users.id = user_id)"), "user_image"], [sequelize.literal("(SELECT company_name FROM users WHERE users.id = user_id)"), "company_name"], [sequelize.literal(`
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
        END `), 'status']]
        },
          as: "assigned_agent_client",
          where: assinedUserCondition,
          required: false,
        }
      ],
      where: data,
    });
  };


  /** get all assigned client list with pagination and search filter and total count*/
  getAssignedClientList = async (body, user) => {
    let havingCondition = {
      deleted_at: null,
      role_id: ROLES.CLIENT,
    };
    let userId = user.id;

    if(user.role_id == ROLES.ADMIN || user.role_id == ROLES.ACCOUNTMANAGER) {
      userId = body.agent_id;
    }

    let clientCountWithoutSearchCondition = {
      deleted_at: null,
      role_id: ROLES.CLIENT,
    };

    if (body.search) {
      havingCondition = {
        [Op.or]: [
          { userName: { [Op.like]: `%${body.search}%` } }
        ],
        deleted_at: null,
        role_id: ROLES.CLIENT,
      }
    }

    let getAllClientOfAgent = await this.Models.AssignedUsers.findAll({
      attribute: ["id", "type", "user_id", "agent_id", "deleted_at"],
      where: {
        agent_id: userId,
        type: ASSIGNED_USERS.CLIENTS_TO_AGENT,
        deleted_at: null
      },
      raw: true,
    });

    let getClientIds = getAllClientOfAgent.map(val => val.user_id);
    havingCondition.id = getClientIds;
    clientCountWithoutSearchCondition.id = getClientIds;

    let attributes = ["id", "role_id", "first_name", "last_name", "email", "country_code", "phone_number", "address", "user_image", "company_name", "deleted_at", "created_at", "updated_at", [sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = users.id)"), "userName"], [sequelize.literal(`
      CASE
        WHEN status = 0 THEN 'Pending'
        WHEN status = 1 THEN 'Active'
        WHEN status = 2 THEN 'Inactive'
        ELSE 'Inactive'
      END
    `), 'status'], [sequelize.literal("(SELECT FROM_UNIXTIME(login_time, '%Y-%m-%d %H:%i:%s') FROM user_login_times WHERE user_login_times.user_id = users.id ORDER BY user_login_times.id DESC limit 1)"), "last_login"], [sequelize.literal(`(SELECT created_at FROM assigned_users WHERE assigned_users.agent_id = ${userId} AND  assigned_users.user_id = users.id limit 1)`), "start_date"],
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
    `), 'subscription_status']
  ];

    const allClientCount = await this.Models.Users.findAll({
      attributes: attributes,
      having: havingCondition,
    });

    const allClientCountWithoutSearch = await this.Models.Users.count({
      where: clientCountWithoutSearchCondition
    });

    const getAllClients = await this.Models.Users.findAll({
      attributes: attributes,
      having: havingCondition,
      order: [
        ['id', 'DESC'],
      ],
      offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
      limit: (body.limit == -1) ? allClientCount.length : parseInt(body.limit) || PAGINATION.LIMIT,
      raw: true,
    });

    return { list: getAllClients, total_records: allClientCount.length, total_count: allClientCountWithoutSearch, filtered_records: getAllClients.length }
  };




  getAgentRecentActitvity = async (userId) => {
    let whereCondition = {
      deleted_at: null,
      type: {
        [Op.notIn]: [7,8,9] //This is for notification. No need to show in recent activity
      }
    }

    let getAssignedUsers = await this.Models.AssignedTaskUsers.findAll({
      attributes:["id", "task_id", "project_id", "user_id"],
        where: {
          user_id: userId,
          deleted_at: null
        },
      raw: true,
    });

    let assignedTaskIds = getAssignedUsers.map(val => val.task_id);
    whereCondition = {
      [Op.or]: [{
        task_id: assignedTaskIds,
      },
      {
        user_id: userId
      }],
      type: {
        [Op.notIn]: [7,8,9]
      },
      deleted_at: null
    }

    const totalAgentRecentActivities = await this.Models.RecentActivities.count({
      where: whereCondition
    })

    let getAgentRecentActivity = await this.Models.RecentActivities.findAll({
      attributes: ["id", "user_id", "type", "message", [sequelize.literal("DATE_FORMAT(created_at, '%Y-%m-%d')"), "created_at"], [sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = recent_activities.user_id)"), "userName"], [sequelize.literal("(SELECT user_image FROM users WHERE users.id = recent_activities.user_id)"), "user_image"], [sequelize.literal("(SELECT name FROM projects WHERE projects.id = recent_activities.project_id)"), "project_name"], [sequelize.literal("(SELECT title FROM tasks WHERE tasks.id = recent_activities.task_id)"), "task_name"], [sequelize.literal("(SELECT name FROM project_columns WHERE project_columns.id = recent_activities.project_column_id)"), "project_column_name"]],
      where: whereCondition,
      limit: 5,
      order: [["id", "DESC"]],
      raw: true,
    });


    if(getAgentRecentActivity.length > 0) {

      for (let i in getAgentRecentActivity) {
        let userName = getAgentRecentActivity[i].user_id == userId ? `You` : getAgentRecentActivity[i].userName;
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



// get user detail
  getUserDetail = async (userId) => {
    return await this.Models.Users.findOne({
      attribute: ["id", "deleted_at"],
      where: {
        id: userId,
        deleted_at: null
      },
      raw: true
    });
  };

  /** create notes for agent */
  createAgentNote = async (data) => {
    return await this.Models.AgentNotes.create(data);
  };

  getAllAgentNotes = async (body, user) => {
    let whereCondition = {
      agent_id: body.agent_id,
      added_by: user.id,
      deleted_at: null,
    };

    const allNotesCount = await this.Models.AgentNotes.count({
      where: whereCondition,
    });

    let getAllNotes = await this.Models.AgentNotes.findAll({
      where: whereCondition,
      order: [
        ['id', 'ASC'],
      ],
      offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
      limit: (body.limit == -1) ? allNotesCount : parseInt(body.limit) || PAGINATION.LIMIT,
      raw: true,
    });

    // getAllNotes = getAllNotes.reverse();
    return { list: getAllNotes, total_records: allNotesCount, filtered_records: getAllNotes.length }
  };


  // get agent note detail
  getNoteDetail = async (noteId) => {
    return await this.Models.AgentNotes.findOne({
      where: {
        id: noteId,
        deleted_at: null
      },
      raw: true
    });
  };


  /** update notes for agent */
  updateAgentNote = async (noteId, data) => {
    return await this.Models.AgentNotes.update(data, {
      where: {
        id: noteId,
      }
    });
  };

}
