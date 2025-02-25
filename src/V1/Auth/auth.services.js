import sequelize, { where } from "sequelize";
const Op = sequelize.Op;
import { ASSIGNED_USERS, PAGINATION, ROLES, USER_STATUS, SUBSCRIPTION_LOGS_MESSAGE, SUBSCRIPTION_LOGID, RECENT_ACTIVITY_TYPE } from "../../../config/constants";
import { verifyToken } from "../../V1/helpers/jwt";
import path from "path";
import docusign from 'docusign-esign';
import moment from "moment";
const fs = require('fs');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
import { v4 as uuidv4 } from 'uuid';

export default class Auth {
  async init(db) {
    this.Models = db.models;
    this.sequelize = db.sequelize;
    this.sql = db.sqlClient
  }
  /**
   * find User by email
   * @param {string} email 
   * @returns user detail
   */

  /* find User by email  */
  getByEmail = async (email) => {
    return await this.Models.Users.findOne({
      attributes: { include: [[sequelize.literal(`IFNULL((SELECT is_authenticate FROM global_settings WHERE global_settings.user_role = users.role_id limit 1), 0)`), "global_two_factor"]] },
      where: {
        email: email,
        // deleted_at: null
      },
      raw: true
    });
  };

  /* find User by token */
  getBytoken = async (token) => {
    return this.Models.Users.findOne({ where: { reset_password_token: token } });
  }

  /* find User by Id  */
  getUserById = async (userId) => {
    return await this.Models.Users.findOne({
      attributes: ["id", "uuid", "role_id", "first_name", "last_name", "email", "phone_number", "user_image", "social_id", "social_type", "deleted_at", "address", "is_verified", "status", "docusign_link", "is_complete_profile", "two_factor_authentication", "added_by", "added_by_user", "createdAt", "updatedAt", [sequelize.literal("LOWER((SELECT name FROM roles WHERE roles.id = users.role_id limit 1))"), "role"],
        [sequelize.literal(`IFNULL((SELECT is_authenticate FROM global_settings WHERE global_settings.user_role = users.role_id limit 1), 0)`), "global_two_factor"],
        [sequelize.literal(`
      CASE 
        WHEN (SELECT COUNT(*) 
              FROM client_subscriptions 
              WHERE client_subscriptions.client_id = users.id 
              AND (client_subscriptions.status = 1 OR client_subscriptions.status = 5)
              AND client_subscriptions.deleted_at IS NULL) = 0 THEN 0
        WHEN (SELECT COUNT(*) 
              FROM client_subscriptions 
              WHERE client_subscriptions.client_id = users.id 
              AND client_subscriptions.deleted_at IS NULL 
              AND (client_subscriptions.status = 1 OR client_subscriptions.status = 5)
              AND client_subscriptions.is_signed_docusign = 0) > 0 THEN 0
        ELSE 1
      END
    `), "is_signed"], [sequelize.literal(` CASE WHEN ( SELECT COUNT(*) FROM client_subscriptions WHERE client_subscriptions.client_id = users.id AND client_subscriptions.deleted_at IS NULL AND client_subscriptions.status = 1) > 0 THEN 1
      ELSE 0 END `), "is_subscription"], [sequelize.literal(`
      CASE
        WHEN (SELECT COUNT(*) FROM client_subscriptions 
              WHERE client_subscriptions.client_id = users.id 
              AND deleted_at IS NULL 
              AND client_subscriptions.status = 1 
              AND client_subscriptions.is_signed_docusign = 1 
              LIMIT 1) > 0 THEN 'Active'
        WHEN (SELECT COUNT(*) FROM client_subscriptions 
              WHERE client_subscriptions.client_id = users.id 
              AND deleted_at IS NULL 
              AND client_subscriptions.status = 0 
              AND client_subscriptions.is_signed_docusign = 0 
              LIMIT 1) > 0 THEN 'Pending'
        WHEN (SELECT COUNT(*) FROM client_subscriptions 
              WHERE client_subscriptions.client_id = users.id 
              AND deleted_at IS NULL 
              AND client_subscriptions.status = 2 
              AND client_subscriptions.is_signed_docusign = 1 
              LIMIT 1) > 0 THEN 'Paused'
        WHEN (SELECT COUNT(*) FROM client_subscriptions 
              WHERE client_subscriptions.client_id = users.id 
              AND deleted_at IS NULL 
              AND client_subscriptions.status = 3 
              AND client_subscriptions.is_signed_docusign = 0 
              LIMIT 1) > 0 THEN 'Suspended'
        WHEN (SELECT COUNT(*) FROM client_subscriptions 
            WHERE client_subscriptions.client_id = users.id 
            AND deleted_at IS NULL 
            AND client_subscriptions.status = 4 
            AND client_subscriptions.is_signed_docusign = 1
            LIMIT 1) > 0 THEN 'Pending'
        WHEN (SELECT COUNT(*) FROM client_subscriptions 
            WHERE client_subscriptions.client_id = users.id 
            AND deleted_at IS NULL 
            AND client_subscriptions.status = 5
            AND client_subscriptions.is_signed_docusign = 1 
            LIMIT 1) > 0 THEN 'Active'
        ELSE 'Pending'
      END
    `), 'subcription_status'], [sequelize.literal("(SELECT subscription_link FROM client_subscriptions WHERE client_subscriptions.client_id = users.id AND client_subscriptions.status = 0 limit 1)"), "subscription_link"], [sequelize.literal("(SELECT id FROM client_subscriptions WHERE client_subscriptions.client_id = users.id AND client_subscriptions.status = 0 limit 1)"), "pending_subscription_id"]],
      include: [
        {
          model: this.Models.ClientSubscriptions,
          attributes: ["id", "client_id", "stripe_subscription_id", "title", "status", "docusign_link", "is_signed_docusign"],
          as: "subscription_and_docusign",
          where: {
            deleted_at: null,
            is_signed_docusign: 0,
            status: 1
          },
          required: false,
        },
        {
          model: this.Models.Projects,
          // attributes: ["id", "user_id", "name", "sort_order", "deleted_at"],
          include: [{
            model: this.Models.AssignedTaskUsers,
            attributes: {
              include: [[sequelize.literal("(SELECT concat(first_name, ' ', last_name) FROM users WHERE users.id = `projects->project_assignees`.`user_id` limit 1)"),
                "user_name"
              ]]
            },
            as: "project_assignees",
            required: false,
            where: {
              deleted_at: null,
              task_id: null
            },
          }],
          as: "projects",
          where: {
            deleted_at: null,
          },
          required: false,
        },
      ],
      where: {
        id: userId,
        deleted_at: null
      },
      order: [sequelize.col("projects.sort_order", "ASC")],
    });
  };


  /* create login time */
  createLoginTime = async (data) => {
    return await this.Models.UserLoginTime.create(data);
  }

  /* update User by Id  */
  updateUser = async (data, userId) => {
    return await this.Models.Users.update(data, { where: { id: userId } });
  }

  /* find by email and logout Admin or Users by Id  */
  logoutUser = async (data) => {
    const decoded = verifyToken(data);
    let whereCondition = {
      user_id: decoded.id,
      login_time: decoded.login_time,
    };
    return this.Models.UserLoginTime.destroy({
      where: whereCondition,
    });
  }

  getClientById = async (userId) => {
    return this.Models.Users.findOne({
      attributes: ["id", "first_name", "last_name", "email"],
      where: {
        id: userId,
        deleted_at: null,
        role_id: [ROLES.CLIENT, ROLES.AGENT, ROLES.ACCOUNTMANAGER, ROLES.ADMIN, ROLES.USER]
      },
      raw: true,
    });
  };

  createUser = async (data) => {
    return await this.Models.Users.create(data);
  };

  getUserByEmailOrSocialId = async (email, socialId) => {
    const getUser = await this.Models.Users.findOne({
      where: {
        [Op.or]: [
          { email: email },
          { social_id: socialId }
        ],
        // deleted_at: null
      },
      raw: true,
    });
    return getUser;
  };



  getDosusignEnvelop = async (envelopeId) => {

    let dsApi = new docusign.ApiClient();
    // dsApi.setOAuthBasePath("account-d.docusign.com"); // it should be domain only.
    dsApi.setOAuthBasePath(process.env.DOCUSIGN_DOMAIN); // it should be domain only.

    const jwtLifeSec = 60 * 60; // requested lifetime for the JWT is 10 min
    const results1 = await dsApi.requestJWTUserToken(
      process.env.DOCUSIGN_INTEGRATION_KEY, // Integration Key
      process.env.DOCUSIGN_USER_ID, // User ID
      "signature",
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
    const envelopesApi = new docusign.EnvelopesApi(dsApiClient);
    const results = await envelopesApi.getEnvelope(accountId, envelopeId);
    return results;

  };


  createDosusignLink = async (agentDetail, documentBase64) => {

    let dsApi = new docusign.ApiClient();
    // dsApi.setOAuthBasePath("account-d.docusign.com"); // it should be domain only.
    dsApi.setOAuthBasePath(process.env.DOCUSIGN_DOMAIN); // it should be domain only.
    const accountId = process.env.DOCUSIGN_ACCOUNT_ID; // Account ID 

    /** -----------------------DocuSign Integration--------------------------------- */
    /* --DocuSign API credentials-- */
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

    // create the document
    const document = docusign.Document.constructFromObject({
      documentBase64: documentBase64,
      documentId: '1',
      fileExtension: 'txt',
      name: agentDetail.first_name + ' ' + agentDetail.last_name
    });

    // const signer = docusign.Signer.constructFromObject({
    //   email: "nasrudeen@softradix.in",
    //   name: agentDetail.first_name + ' ' + agentDetail.last_name,
    //   recipientId: 1
    // });

    const clientUserId = uuidv4();
    const signer = docusign.Signer.constructFromObject({
      // email: "nasrudeen@softradix.in",
      email: agentDetail.email,
      name: agentDetail.first_name + ' ' + agentDetail.last_name,
      recipientId: 1,
      clientUserId: clientUserId
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
          name: 'agent_id',
          value: agentDetail.id
        },
        {
          name: 'agent_email',
          value: agentDetail.email
        }
      ]
    });

    const recipients = docusign.Recipients.constructFromObject({
      signers: [signer]
    });

    const envelopeDefinition = docusign.EnvelopeDefinition.constructFromObject({
      customFields: customFields,
      documents: [document],
      emailSubject: `Please sign this contarct.`,
      recipients: recipients,
      status: 'sent'
    });

    const envelopesApi = new docusign.EnvelopesApi(dsApiClient);
    // Call Envelopes create API
    const results = await envelopesApi.createEnvelope(accountId, {
      envelopeDefinition,
    });

    if (results.status === "sent") {

      const recipientViewRequest = {
        authenticationMethod: "none",
        // returnUrl: process.env.BASE_URL+ `v1/agent-docusign-completed/${agentDetail.id}`,
        returnUrl: process.env.BASE_API_URL + `v1/agent-docusign-completed/${agentDetail.id}?envelopId=${results.envelopeId}`,
        userName: agentDetail.first_name + ' ' + agentDetail.last_name,
        email: agentDetail.email,
        name: agentDetail.first_name + ' ' + agentDetail.last_name,
        clientUserId: clientUserId
      };
      const recipientView = await envelopesApi.createRecipientView(
        accountId,
        results.envelopeId,
        { recipientViewRequest }
      );
      return recipientView.url;
    }

  }


  /* find Agent by Id  */
  getAgentByAgentId = async (userId) => {
    const getAgentDetail = await this.Models.Users.findOne({
      attributes: ["id", "role_id", "first_name", "last_name", "email", "phone_number", "user_image", "social_id", "social_type", "deleted_at", "address", "is_verified", "status", "docusign_link", "kyc_front_pic", "kyc_back_pic", "captured_pic", "is_complete_profile", "reject_reason", "two_factor_authentication", "two_factor_otp", "role_permission_id", "added_by_user", "createdAt", "updatedAt", [sequelize.literal("LOWER((SELECT name FROM roles WHERE roles.id = users.role_id limit 1))"), "role"]],
      where: {
        id: userId,
        deleted_at: null,
      },
      raw: true
    });
    return getAgentDetail;
  };



  /* find User by id  */
  findUserDetailById = async (userId) => {
    return await this.Models.Users.findOne({
      where: {
        id: userId,
        deleted_at: null
      },
      raw: true
    });
  };


  /* get all country list */
  getAllCountries = async (body) => {
    const getCountryCount = await this.Models.Countries.count();
    const getAllCountries = await this.Models.Countries.findAll({
      offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
      limit: (body.limit == -1) ? getCountryCount : parseInt(body.limit) || PAGINATION.LIMIT,
      order: [
        ['id', 'ASC'],
      ],
      raw: true,
    });
    return { list: getAllCountries, total_records: getCountryCount, filtered_records: getAllCountries.length }
  };

  /* get all state list */
  getAllStates = async (countryName, body) => {
    let whereCondition = {
      country_code: countryName,
    };
    const getStateCount = await this.Models.States.count({
      where: whereCondition
    });
    const getAllStates = await this.Models.States.findAll({
      where: whereCondition,
      offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
      limit: (body.limit == -1) ? getStateCount : parseInt(body.limit) || PAGINATION.LIMIT,
      order: [
        ['id', 'ASC'],
      ],
      raw: true,
    });
    return { list: getAllStates, total_records: getStateCount, filtered_records: getAllStates.length }
  };


  /* get all active clients */
  getActiveClients = async () => {
    return await this.Models.Users.count({
      where: {
        role_id: ROLES.CLIENT,
        deleted_at: null,
        status: USER_STATUS.ACTIVE
      },
    });
  };

  /* get all active agents */
  getActiveAgents = async () => {
    return await this.Models.Users.count({
      where: {
        role_id: ROLES.AGENT,
        deleted_at: null,
        status: USER_STATUS.ACTIVE
      },
    });
  };

  /* get all active account manager */
  getActiveAccountManager = async () => {
    return await this.Models.Users.count({
      where: {
        role_id: ROLES.ACCOUNTMANAGER,
        deleted_at: null,
        status: USER_STATUS.ACTIVE
      },
    });
  };


  getDateDifferenceArray = async (startDate, endDate) => {
    let start = moment(new Date(startDate));
    let end = moment(new Date(endDate));

    let startYear = start.year();
    let endYear = end.year();

    let startMonth = start.month();
    let endMonth = end.month();

    let name = [];
    if (startYear === endYear) {
      if (startMonth === endMonth) {
        // Dates are within the same month
        for (let day = start.date(); day <= end.date(); day++) {
          name.push({ day: day, start_day: start.date(day).format('YYYY-MM-DD'), end_day: start.date(day).format('YYYY-MM-DD'), date: start.date(day).format('YYYY-MM-DD') });
        }
        return name;
      } else {
        // Dates are within the same year but different months
        for (let month = startMonth; month <= endMonth; month++) {
          let monthStart = moment().year(startYear).month(month).startOf('month').format('YYYY-MM-DD');
          let monthEnd = moment().year(startYear).month(month).endOf('month').format('YYYY-MM-DD');
          name.push({ day: moment().month(month).format("MMM"), start_day: monthStart, end_day: monthEnd, date: monthStart });
        }
        return name;
      }
    } else {
      // Dates are in different years
      for (let year = startYear; year <= endYear; year++) {
        let yearStart = moment().year(year).startOf('year').format('YYYY-MM-DD');
        let yearEnd = moment().year(year).endOf('year').format('YYYY-MM-DD');
        name.push({ day: year, start_day: yearStart, end_day: yearEnd, date: yearStart });
      }
      return name;
    }
  }

  updateProfile = async (data, user) => {
    return await this.Models.Users.update(data, {
      where: {
        id: user,
        deleted_at: null
      }
    })
  }

  getUserProfileDetails = async (userId) => {
    return await this.Models.Users.findOne({
      attributes: ["first_name", "last_name", "email", "phone_number", "two_factor_authentication", "user_image", "address", "address2", "state", "city", "zipcode", "country", "role_id", [sequelize.literal("(SELECT name FROM roles WHERE roles.id = users.role_id LIMIT 1)"), "role"]],
      where: {
        id: userId,
        deleted_at: null
      }
    })
  }


  /** Get user detail by user id */
  getUserDetailByUserId = async (condition) => {
    return await this.Models.Users.findOne({
      where: condition,
      raw: true
    });
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
          ],
        ],
        where: {
          agent_id: userId,
          type: ASSIGNED_USERS.CLIENTS_TO_AGENT,
          deleted_at: null,
        },
        raw: true,
      });

      const projectsPromises = getAgentClients.map(async (client) => {
        if (client.is_toggle === 0) {
          // Fetch all projects for the client
          return this.Models.Projects.findAll({
            attributes: ["id", ["id", "project_id"], "name", "user_id", "deleted_at", "is_private", "sort_order", [
              sequelize.literal(`(
              CASE
                WHEN is_private = 1 AND 
                     EXISTS (
                       SELECT 1 
                       FROM assigned_task_users 
                       WHERE assigned_task_users.project_id = projects.id 
                         AND assigned_task_users.user_id = ${userId}
                         AND assigned_task_users.deleted_at IS NULL
                     )
                THEN 1
                ELSE 0
              END
            )`),
              "is_private_project"
            ], [sequelize.literal("(SELECT id FROM project_columns WHERE project_columns.project_id = projects.id AND project_columns.is_defalut = 1 AND project_columns.defalut_name = 'To Do' AND project_columns.deleted_at IS NULL limit 1)"), "project_column_id"]],
            where: {
              user_id: client.user_id,
              deleted_at: null,
            },
            having: {
              [Op.or]: [{
                is_private: 0
              }, {
                is_private_project: 1
              }]
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
              [sequelize.literal("(SELECT sort_order FROM projects WHERE projects.id = project_id LIMIT 1)"), "sort_order"],
              [sequelize.literal("(SELECT is_private FROM projects WHERE projects.id = project_id LIMIT 1)"), "is_private"],
              [sequelize.literal("(SELECT id FROM project_columns WHERE project_columns.project_id = project_id AND project_columns.is_defalut = 1 AND project_columns.defalut_name = 'To Do' AND project_columns.deleted_at IS NULL limit 1)"), "project_column_id"]
            ],
            group: ["project_id"],
            where: {
              user_id: userId,
              deleted_at: null,
            },
            having: {
              project_deleted_at: null,
              // is_private: 0
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
      const uniqueProjects = getAllProjects.filter((obj, index, self) =>
        index === self.findIndex((el) => el.project_id === obj.project_id)
      );

      for (let i in uniqueProjects) {
        uniqueProjects[i].project_assignee = [];
        let getAssignee = await this.Models.AssignedTaskUsers.findAll({
          attributes: { include: [[sequelize.literal("(SELECT concat(first_name, ' ', last_name) FROM users WHERE users.id = assigned_task_users.user_id limit 1)"), "user_name"]] },
          where: {
            project_id: uniqueProjects[i].project_id,
            deleted_at: null,
            task_id: null
          },
          raw: true
        });
        uniqueProjects[i].project_assignee = getAssignee;
      }

      return uniqueProjects;
    } catch (error) {
      console.error('Error fetching projects for agent:', error);
      throw error; // Handle this appropriately in your error handler
    }
  };

  /** Get account Manager clients */
  getAccountManagerClients = async (accountManagerId) => {
    let getAllClientOfManager = await this.Models.AssignedUsers.findAll({
      attributes: [
        "id", "type", "user_id", "account_manager_id", "deleted_at",
        [sequelize.literal("(SELECT status FROM users WHERE users.id = assigned_users.account_manager_id LIMIT 1)"), "user_status"],
      ],
      where: {
        account_manager_id: accountManagerId,
        type: ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER,
        deleted_at: null
      },
      having: {
        user_status: USER_STATUS.ACTIVE
      },
      raw: true,
    });

    let getClientIds = getAllClientOfManager.map(val => val.user_id);
    return getClientIds;
  };

  /** Get account Manager Client Agents */
  getAllAgentsOfClients = async (clientIds) => {
    let getAllAgentsOfClients = await this.Models.AssignedUsers.findAll({
      attributes: [
        "id", "type", "user_id", "agent_id", "deleted_at",
        [sequelize.literal("(SELECT status FROM users WHERE users.id = assigned_users.agent_id LIMIT 1)"), "user_status"],
      ],
      where: {
        user_id: clientIds,
        type: ASSIGNED_USERS.CLIENTS_TO_AGENT,
        deleted_at: null
      },
      having: {
        user_status: USER_STATUS.ACTIVE
      },
      raw: true,
    });
    let getAgentIds = getAllAgentsOfClients.map(val => val.agent_id);
    return getAgentIds;
  };


  /* get all active clients Ids */
  getActiveClientIds = async () => {
    let getAllClients = await this.Models.Users.findAll({
      attribute: ["id", "role_id", "deleted_at", "status"],
      where: {
        role_id: ROLES.CLIENT,
        deleted_at: null,
        status: USER_STATUS.ACTIVE
      },
      raw: true,
    });
    let getClientIds = getAllClients.map(val => val.id);
    return getClientIds;
  };


  /** Get User Client Projects As per toggle button */
  getAllProjectsForUserByUserId = async (userId, userClientId, user) => {
    try {

      // Parallelize fetching task permissions and projects
      const [getUserPermission, getAllProjects] = await Promise.all([
        this.Models.RolesAndPermissions.findOne({
          attributes: ["id", "is_project_access", "deleted_at"],
          where: {
            id: user.role_permission_id,
            deleted_at: null
          },
          raw: true
        }),
        // this.Models.UserTaskPermissions.findOne({
        //   where: { client_id: userClientId, user_id: userId },
        //   raw: true,
        // }),
        this.Models.Projects.findAll({
          attributes: ["id", ["id", "project_id"], "name", "user_id", "is_private", "deleted_at", "sort_order", [
            sequelize.literal(`(
              CASE
                WHEN is_private = 1 AND 
                     EXISTS (
                       SELECT 1 
                       FROM assigned_task_users 
                       WHERE assigned_task_users.project_id = projects.id 
                         AND assigned_task_users.user_id = ${userId}
                         AND assigned_task_users.deleted_at IS NULL
                     )
                THEN 1
                ELSE 0
              END
            )`),
            "is_private_project"
          ]],
          where: {
            [Op.or]: [{ user_id: userId }, { user_id: userClientId }],
            deleted_at: null,
          },
          // having: {
          //   [Op.or]: [{
          //     is_private: 0
          //   },{
          //     is_private_project: 1
          //   }]
          // },
          order: [["sort_order", "ASC"]],
          raw: true,
        }),
      ]);

      // Determine the is_toggle value
      // const isToggle = getUserTaskPermission && getUserTaskPermission.is_toggle === 1 ? 1 : 0;
      const isToggle = getUserPermission && getUserPermission.is_project_access === 0 ? 0 : 1;
      let finalProjects = [];
      if (isToggle === 0) {
        // If is_toggle is 0, return all projects
        finalProjects = getAllProjects;
      } else {

        // Fetch assigned projects for the agent
        const assignedProjects = await this.Models.AssignedTaskUsers.findAll({
          attributes: [
            "id", "user_id", "task_id", "project_id", "deleted_at",
            [sequelize.literal("(SELECT name FROM projects WHERE projects.id = project_id LIMIT 1)"), "name"],
            [sequelize.literal("(SELECT deleted_at FROM projects WHERE projects.id = project_id LIMIT 1)"), "project_deleted_at"],
            [sequelize.literal("(SELECT sort_order FROM projects WHERE projects.id = project_id LIMIT 1)"), "sort_order"],
            [sequelize.literal("(SELECT is_private FROM projects WHERE projects.id = project_id LIMIT 1)"), "is_private"], [sequelize.literal("(SELECT concat(first_name, ' ', last_name) FROM users WHERE users.id = user_id limit 1)"), "user_name"]
          ],
          where: { user_id: userId, task_id: null, deleted_at: null },
          having: {
            project_deleted_at: null,
            // is_private: 0
          },
          group: ["project_id"],
          // order: [[sequelize.col("projects.sort_order"), "ASC"]],
          raw: true,
        });

        // Fetch projects where added_by equals userId
        const addedProjects = await this.Models.Projects.findAll({
          attributes: ["id", ["id", "project_id"], "name", "user_id", "is_private", "deleted_at", "sort_order"],
          where: {
            added_by: userId,
            deleted_at: null,
          },
          order: [["sort_order", "ASC"]],
          raw: true,
        });
        // Combine both assigned and added projects
        finalProjects = [...addedProjects, ...assignedProjects];
      }

      return finalProjects;
    } catch (error) {
      console.error('Error fetching projects for user:', error);
      throw error;
    }
  };



  getDateDifferenceArrayForReports = async (startDate, endDate) => {
    let start = moment(new Date(startDate));
    let end = moment(new Date(endDate));

    let startYear = start.year();
    let endYear = end.year();

    let startMonth = start.month();
    let endMonth = end.month();

    let name = [];
    if (startYear === endYear) {
      if (startMonth === endMonth) {
        // Dates are within the same month
        for (let day = start.date(); day <= end.date(); day++) {
          name.push({ day: day + ' ' + start.format("MMM"), start_day: start.date(day).format('YYYY-MM-DD'), end_day: start.date(day).format('YYYY-MM-DD'), date: start.date(day).format('YYYY-MM-DD') });
        }
        return name;
      } else {
        // Dates are within the same year but different months
        for (let month = startMonth; month <= endMonth; month++) {
          let monthStart = moment().year(startYear).month(month).startOf('month').format('YYYY-MM-DD');
          let monthEnd = moment().year(startYear).month(month).endOf('month').format('YYYY-MM-DD');
          name.push({ day: moment().month(month).format("MMM"), start_day: monthStart, end_day: monthEnd, date: monthStart });
        }
        return name;
      }
    } else {
      // Dates are in different years
      for (let year = startYear; year <= endYear; year++) {
        let yearStart = moment().year(year).startOf('year').format('YYYY-MM-DD');
        let yearEnd = moment().year(year).endOf('year').format('YYYY-MM-DD');
        name.push({ day: year, start_day: yearStart, end_day: yearEnd, date: yearStart });
      }
      return name;
    }
  }




  /* get Last Month Growth Rate */
  getLastMonthGrowthRate = async (startDateCurrentMonth, endDateCurrentMonth) => {

    let totalChurnArray = [];
    let totalExistingSubscriptionsArray = [];

    let getLastMonthStartDate = moment(new Date(startDateCurrentMonth)).subtract(1, 'months').startOf('month');
    let getLastMonthEndDate = moment(new Date(endDateCurrentMonth)).subtract(1, 'months').endOf('month');

    let startDate = moment(new Date(getLastMonthStartDate)).format("YYYY-MM-DD");
    let endDate = moment(new Date(getLastMonthEndDate)).format("YYYY-MM-DD");

    /** Get new subscription created*/
    let new_subscriptions = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 1 AND is_renew_count = 1 AND DATE(FROM_UNIXTIME(`start_date`)) BETWEEN '" + startDate + "' AND '" + endDate + "'",
      {
        model: this.Models.ClientSubscriptions,
        mapToModel: true,
        raw: true,
        type: this.sequelize.QueryTypes.SELECT
      });

    /** Get reactivation subscriptions (resume subscriptions)*/
    let reactivation_subscriptions = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 1 AND is_renew_count > 1 AND DATE(FROM_UNIXTIME(`resume_date_time`)) BETWEEN '" + startDate + "' AND '" + endDate + "'",
      {
        model: this.Models.ClientSubscriptions,
        mapToModel: true,
        raw: true,
        type: this.sequelize.QueryTypes.SELECT
      });


    /** Get existing subscriptions (continue renew)*/
    let existing_subscriptions = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 1 AND is_renew_count > 1 AND resume_date_time IS NULL AND DATE(FROM_UNIXTIME(`start_date`)) BETWEEN '" + startDate + "' AND '" + endDate + "'",
      {
        model: this.Models.ClientSubscriptions,
        mapToModel: true,
        raw: true,
        type: this.sequelize.QueryTypes.SELECT
      });

    /** Get cancelled subscriptions */
    let voluntary_churn = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 4 AND DATE(FROM_UNIXTIME(`start_date`)) BETWEEN '" + startDate + "' AND '" + endDate + "'", {
      model: this.Models.ClientSubscriptions,
      mapToModel: true,
      raw: true,
      type: this.sequelize.QueryTypes.SELECT
    });

    /** Get subscriptions are not active*/
    let deliquent_churn = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 0 AND DATE(FROM_UNIXTIME(`start_date`)) BETWEEN '" + startDate + "' AND '" + endDate + "'", {
      model: this.Models.ClientSubscriptions,
      mapToModel: true,
      raw: true,
      type: this.sequelize.QueryTypes.SELECT
    });


    totalChurnArray.push(Number(voluntary_churn ? voluntary_churn[0].total_price : 0) + Number(deliquent_churn ? deliquent_churn[0].total_price : 0));

    totalExistingSubscriptionsArray.push(Number(existing_subscriptions ? existing_subscriptions[0].total_price : 0));


    let newCustomers = Number(new_subscriptions ? new_subscriptions[0].total_clients : 0)
    newCustomers = newCustomers.toFixed(2);

    /** churn = voluntary_churn+deliquent_churn */
    let finalChurn = Number(voluntary_churn ? voluntary_churn[0].total_price : 0) + Number(deliquent_churn ? deliquent_churn[0].total_price : 0);
    finalChurn = finalChurn.toFixed(2);

    /** totalGrowth = (new_subscriptions+reactivation_subscriptions)-churn */
    let totalGrowth = (Number(new_subscriptions ? new_subscriptions[0].total_price : 0) + Number(reactivation_subscriptions ? reactivation_subscriptions[0].total_price : 0) + Number(existing_subscriptions ? existing_subscriptions[0].total_price : 0)) - Number(finalChurn);
    totalGrowth = totalGrowth.toFixed(2);

    let allGrowthRate = {
      total_growth: +totalGrowth,
      total_customers: +newCustomers,
      total_churn: +finalChurn,
    }
    return allGrowthRate

  };


  /** Get customer activity */
  getCustomerActivityList = async (body) => {
    let whereCondition = {
      deleted_at: null,
    };

    const customerActivityCount = await this.Models.ClientSubscriptionHistories.findAll({
      attributes: ["id", "subscription_id", "deleted_at", [sequelize.literal("(SELECT status FROM client_subscriptions WHERE client_subscriptions.id = client_subscription_histories.subscription_id limit 1)"), "status"]],
      where: whereCondition,
      having: {
        status: {
          [Op.ne]: 0
        }
      },
      raw: true,
    });

    const customerActivity = await this.Models.ClientSubscriptionHistories.findAll({
      attributes: ["id", "client_id", "price", "type", "deleted_at", "created_at", [sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = client_subscription_histories.client_id)"), "userName"], [sequelize.literal("(SELECT user_image FROM users WHERE users.id = client_subscription_histories.client_id)"), "user_image"], [sequelize.literal("(SELECT email FROM users WHERE users.id = client_subscription_histories.client_id)"), "email"],
        [sequelize.literal("(SELECT title FROM client_subscriptions WHERE client_subscriptions.id = client_subscription_histories.subscription_id limit 1)"), "subscription_name"], [sequelize.literal("(SELECT status FROM client_subscriptions WHERE client_subscriptions.id = client_subscription_histories.subscription_id limit 1)"), "status"]],
      where: whereCondition,
      having: {
        status: {
          [Op.ne]: 0
        }
      },
      offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
      limit: (body.limit == -1) ? customerActivityCount.length : parseInt(body.limit) || PAGINATION.LIMIT,
      raw: true,
      order: [
        ['id', 'DESC'],
      ],
    });

    for (let i in customerActivity) {
      switch (customerActivity[i].type) {
        case SUBSCRIPTION_LOGID.ON_PURCHASE:
          customerActivity[i].log = SUBSCRIPTION_LOGS_MESSAGE.ON_PURCHASE;
          break;
        case SUBSCRIPTION_LOGID.ON_RENEW:
          customerActivity[i].log = SUBSCRIPTION_LOGS_MESSAGE.ON_RENEW;
          break;
        case SUBSCRIPTION_LOGID.ON_DECLINE:
          customerActivity[i].log = SUBSCRIPTION_LOGS_MESSAGE.ON_DECLINE;
          break;
        case SUBSCRIPTION_LOGID.ON_RENEW_MAIL:
          customerActivity[i].log = SUBSCRIPTION_LOGS_MESSAGE.ON_RENEW_MAIL;
          break;
        case SUBSCRIPTION_LOGID.STATUS_CHANGE_CANCEL:
          customerActivity[i].log = SUBSCRIPTION_LOGS_MESSAGE.STATUS_CHANGE_CANCEL;
          break;
        case SUBSCRIPTION_LOGID.STATUS_CHANGE_PAUSE:
          customerActivity[i].log = SUBSCRIPTION_LOGS_MESSAGE.STATUS_CHANGE_PAUSE;
          break;
        case SUBSCRIPTION_LOGID.STATUS_CHANGE_EXPIRE:
          customerActivity[i].log = SUBSCRIPTION_LOGS_MESSAGE.STATUS_CHANGE_EXPIRE;
          break;
        default:
          customerActivity[i].log = SUBSCRIPTION_LOGS_MESSAGE.ON_UPDATE;
      }
    }
    return { list: customerActivity, total_records: customerActivityCount.length, filtered_records: customerActivity.length }
  };



  /* get Month Growth Rate */
  getMonthGrowthRate = async (startDate, endDate) => {

    let totalChurnArray = [];
    let totalExistingSubscriptionsArray = [];

    /** Get new subscription created*/
    let new_subscriptions = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 1 AND deleted_at IS NULL AND is_renew_count = 1 AND DATE(FROM_UNIXTIME(`start_date`)) BETWEEN '" + startDate + "' AND '" + endDate + "'",
      {
        model: this.Models.ClientSubscriptions,
        mapToModel: true,
        raw: true,
        type: this.sequelize.QueryTypes.SELECT
      });

    /** Get reactivation subscriptions (resume subscriptions)*/
    let reactivation_subscriptions = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 1 AND deleted_at IS NULL AND is_renew_count > 1 AND DATE(FROM_UNIXTIME(`resume_date_time`)) BETWEEN '" + startDate + "' AND '" + endDate + "'",
      {
        model: this.Models.ClientSubscriptions,
        mapToModel: true,
        raw: true,
        type: this.sequelize.QueryTypes.SELECT
      });


    /** Get existing subscriptions (continue renew)*/
    let existing_subscriptions = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 1 AND deleted_at IS NULL AND is_renew_count > 1 AND resume_date_time IS NULL AND DATE(FROM_UNIXTIME(`start_date`)) BETWEEN '" + startDate + "' AND '" + endDate + "'",
      {
        model: this.Models.ClientSubscriptions,
        mapToModel: true,
        raw: true,
        type: this.sequelize.QueryTypes.SELECT
      });

    /** Get cancelled subscriptions */
    let voluntary_churn = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 4 AND deleted_at IS NULL AND DATE(FROM_UNIXTIME(`cancel_at`)) BETWEEN '" + startDate + "' AND '" + endDate + "'", {
      model: this.Models.ClientSubscriptions,
      mapToModel: true,
      raw: true,
      type: this.sequelize.QueryTypes.SELECT
    });


    /** Get subscriptions are not active*/
    let deliquent_churn = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 0 AND deleted_at IS NULL AND DATE(FROM_UNIXTIME(`start_date`)) BETWEEN '" + startDate + "' AND '" + endDate + "'", {
      model: this.Models.ClientSubscriptions,
      mapToModel: true,
      raw: true,
      type: this.sequelize.QueryTypes.SELECT
    });


    totalChurnArray.push(Number(voluntary_churn ? voluntary_churn[0].total_price : 0) + Number(deliquent_churn ? deliquent_churn[0].total_price : 0));

    totalExistingSubscriptionsArray.push(Number(existing_subscriptions ? existing_subscriptions[0].total_price : 0));


    let newCustomers = Number(new_subscriptions ? new_subscriptions[0].total_clients : 0)
    newCustomers = newCustomers.toFixed(2);

    /** churn = voluntary_churn+deliquent_churn */
    let finalChurn = Number(voluntary_churn ? voluntary_churn[0].total_price : 0) + Number(deliquent_churn ? deliquent_churn[0].total_price : 0);
    finalChurn = finalChurn.toFixed(2);

    /** totalGrowth = (new_subscriptions+reactivation_subscriptions)-churn */
    let totalGrowth = (Number(new_subscriptions ? new_subscriptions[0].total_price : 0) + Number(reactivation_subscriptions ? reactivation_subscriptions[0].total_price : 0) + Number(existing_subscriptions ? existing_subscriptions[0].total_price : 0)) - Number(finalChurn);
    totalGrowth = totalGrowth.toFixed(2);


    let reactivations = Number(reactivation_subscriptions ? reactivation_subscriptions[0].total_price : 0)
    reactivations = reactivations.toFixed(2);

    let allGrowthRate = {
      total_growth: +totalGrowth,
      total_customers: +newCustomers,
      total_churn: +finalChurn,
      total_reactivations: +reactivations
    }
    return allGrowthRate

  };


  /* create roles and permissions */
  createRolesAndPermissions = async (data) => {
    return await this.Models.RolesAndPermissions.create(data);
  }

  /**Get Roles And Permissions*/
  getRolesAndPermissions = async (name) => {
    return this.Models.RolesAndPermissions.findOne({
      where: {
        name: name,
        type: 0,
        deleted_at: null
      },
      raw: true
    });
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

  /** get all role and permissions*/
  getRolesAndPermissionList = async (body, user) => {
    let whereCondition = {
      id: {
        [Op.ne]: user.role_permission_id,
      },
      deleted_at: null,
    };

    let countWhereCondition = {
      deleted_at: null,
      id: {
        [Op.ne]: user.role_permission_id,
      }
    };

    if (body.search && body.search != "") {
      whereCondition = {
        name: { [Op.like]: `%${body.search}%` },
        deleted_at: null,
        id: {
          [Op.ne]: user.role_permission_id,
        }
      }
    }

    if (user.role_id == ROLES.ACCOUNTMANAGER || user.role_id == ROLES.ADMIN) {
      whereCondition.type = 0;
      countWhereCondition.type = 0;
    }


    if (user.role_id == ROLES.CLIENT) {
      let getUsersClient = await this.Models.Users.findAll({
        attributes: ["id", "added_by", "deleted_at"],
        where: {
          added_by: user.id,
          deleted_at: null
        },
        raw: true
      });
      let getUsersId = getUsersClient.map(val => val.id);

      let getUserClientUsers = await this.Models.Users.findAll({
        attributes: ["id", "added_by", "deleted_at"],
        where: {
          added_by: getUsersId,
          deleted_at: null
        },
        raw: true
      });
      let getUserClientUserIds = getUserClientUsers.map(val => val.id);
      let finalUserIds = getUsersId.concat(getUserClientUserIds);

      finalUserIds.push(user.id);
      whereCondition.added_by = finalUserIds;
      whereCondition.type = 1;
      countWhereCondition.type = 1;
      countWhereCondition.added_by = finalUserIds;
    }

    if (user.role_id == ROLES.USER) {
      let getUsersClient = await this.Models.Users.findAll({
        attributes: ["id", "added_by", "added_by_user", "deleted_at"],
        where: {
          added_by: user.added_by,
          deleted_at: null
        },
        raw: true
      });
      // let getUsersId = getUsersClient.map(val=> val.id);
      let finalUserIds = getUsersClient.map(val => val.id);
      finalUserIds.push(user.id, user.added_by, user.added_by_user);
      console.log(finalUserIds, "====finalUserIds====");

      // getUsersId.push(user.id, user.added_by);

      // let getUsersClientUser = await this.Models.Users.findAll({
      //   attributes: ["id", "added_by", "deleted_at"],
      //   where: {
      //     added_by: getUsersId,
      //     deleted_at: null
      //   },
      //   raw: true
      // });
      // let getUsersClientUserIds = getUsersClientUser.map(val=> val.id);
      // let finalUserIds = getUsersId.concat(getUsersClientUserIds);

      whereCondition.added_by = finalUserIds;
      whereCondition.type = 1;
      countWhereCondition.type = 1;
      countWhereCondition.added_by = finalUserIds;
    }

    const allRolestExcludeSearchCount = await this.Models.RolesAndPermissions.count({
      attributes: ["id", "name", "description", "deleted_at"],
      where: countWhereCondition,
    });

    const allRolesCount = await this.Models.RolesAndPermissions.findAll({
      attributes: ["id", "name", "description", "deleted_at"],
      where: whereCondition,
    });

    const getAllRoles = await this.Models.RolesAndPermissions.findAll({
      attributes: ["id", "added_by", "type", "name", "description", "deleted_at"],
      where: whereCondition,
      order: [
        ['id', 'DESC'],
      ],
      offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
      limit: (body.limit == -1) ? allRolesCount.length : parseInt(body.limit) || PAGINATION.LIMIT,
      raw: true,
    });

    return { list: getAllRoles, total_records: allRolesCount.length, total_count: allRolestExcludeSearchCount, filtered_records: getAllRoles.length }
  };

  /* update roles and permissions */
  updateRolesAndPermissions = async (data, permissionId) => {
    return await this.Models.RolesAndPermissions.update(data, {
      where: {
        id: permissionId
      }
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
        type: 0,
        deleted_at: null
      },
      raw: true
    });
  };


  /**check Roles And Permissions In Users By Id*/
  checkRolesAndPermissionsInUsersById = async (permissionId) => {
    return this.Models.Users.findOne({
      where: {
        role_permission_id: permissionId,
        deleted_at: null
      },
      raw: true
    });
  };


  checkFields = async (data) => {
    const fieldsToCheck = [
      'is_client_access',
      'is_agent_access',
      'is_report_access',
      'is_keywords',
      'is_settings',
      'is_manage_products',
      'is_chat',
      'is_supports',
      'is_admin_users',
      'is_agent_group_access'
    ];
    const allZero = fieldsToCheck.every(field => data[field] === 0);
    return allZero ? 0 : 1;
  }


  /**check subscription setting */
  checkSubscriptionSettings = async () => {
    return await this.Models.SubscriptionSettings.findOne({
      where: {
        deleted_at: null
      },
      raw: true
    });
  };


  /* create Subscription Settings */
  createSubscriptionSettings = async (data) => {
    return await this.Models.SubscriptionSettings.create(data);
  }


  /* update Subscription Settings */
  updateSubscriptionSettings = async (data, subscriptionSettingId) => {
    return await this.Models.SubscriptionSettings.update(data, {
      where: {
        id: subscriptionSettingId
      }
    });
  };


  /** Create Tax rates in stripe */
  createSubscriptionTaxRate = async (processingFee, feeName) => {
    const taxRate = await stripe.taxRates.create({
      display_name: (feeName != "") ? feeName : '',
      percentage: processingFee,
      inclusive: false,
    });
    return taxRate.id;
  };

  /** Inactive Tax rates in stripe */
  updateSubscriptionTaxRate = async (taxRateId) => {
    const taxRate = await stripe.taxRates.update(
      taxRateId,
      {
        active: false,
      }
    );
  };

  /**Get Roles And Permissions by Id And Role*/
  getRolesAndPermissionsByIdAndRole = async (permissionId, userDetail) => {
    let whereCondition = {
      id: permissionId,
      deleted_at: null
    };
    let attributes;
    if (userDetail.role_id == ROLES.ADMIN || userDetail.role_id == ROLES.ACCOUNTMANAGER) {
      attributes = { exclude: ["is_project_access", "is_users_access", "is_billing_access", "is_shared_files", "is_password_manager"] };
      whereCondition.type = 0;
    };
    if (userDetail.role_id == ROLES.CLIENT || userDetail.role_id == ROLES.USER) {
      attributes = ["id", "name", "description", "is_project_access", "is_agent_access", "is_chat", "is_settings", "is_supports", "is_users_access", "is_billing_access", "is_shared_files", "is_password_manager"];
      whereCondition.type = 1;
    }
    return this.Models.RolesAndPermissions.findOne({
      attributes: attributes,
      where: whereCondition,
      raw: true
    });
  };




  getAllNotifications = async (body, userDetail) => {

    let whereCondition = {
      deleted_at: null,
      user_id: userDetail.id,
      is_read: [0, 1]
    };

    if (body.is_mark && body.is_mark == 1) {
      whereCondition = {
        deleted_at: null,
        user_id: userDetail.id,
        is_read: 0
      };
    }

    const totalAgentRecentActivities = await this.Models.ReadNotifications.count({
      where: whereCondition
    });
    const getNotifications = await this.Models.ReadNotifications.findAll({
      include: [{
        model: this.Models.RecentActivities,
        attributes: { include: [[sequelize.literal("DATE_FORMAT(notifications.created_at, '%Y-%m-%d')"), "created_at"], [sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = notifications.user_id)"), "userName"], [sequelize.literal("(SELECT user_image FROM users WHERE users.id = notifications.user_id)"), "user_image"], [sequelize.literal("(SELECT name FROM projects WHERE projects.id = notifications.project_id)"), "project_name"], [sequelize.literal("(SELECT title FROM tasks WHERE tasks.id = notifications.task_id)"), "task_name"], [sequelize.literal("(SELECT title FROM tasks WHERE tasks.id = notifications.parent_task_id limit 1)"), "sub_task_name"], [sequelize.literal("(SELECT name FROM project_columns WHERE project_columns.id = notifications.project_column_id limit 1)"), "project_column_name"], [sequelize.literal("(SELECT site_name FROM password_managers WHERE password_managers.id = notifications.password_manager_id limit 1)"), "site_name"], [sequelize.literal("(SELECT file_name FROM shared_files WHERE shared_files.id = notifications.shared_file_id limit 1)"), "file_name"], [sequelize.literal(`(SELECT is_read FROM read_notifications WHERE read_notifications.notification_id = notifications.id AND read_notifications.user_id = ${userDetail.id} limit 1)`), "is_read"], [sequelize.literal(`(SELECT id FROM read_notifications WHERE read_notifications.notification_id = notifications.id AND read_notifications.user_id = ${userDetail.id} limit 1)`), "id"]] },
        required: false,
        as: "notifications",
      }],
      where: whereCondition,
      order: [["id", "DESC"]],
      offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
      limit: (body.limit == -1) ? totalAgentRecentActivities : parseInt(body.limit) || PAGINATION.LIMIT,
      raw: true,
      nest: true
    });


    let getAgentRecentActivity = getNotifications.map(val => val.notifications);

    if (getAgentRecentActivity.length > 0) {
      for (let i in getAgentRecentActivity) {
        let userName = getAgentRecentActivity[i].userName;
        switch (getAgentRecentActivity[i].type) {
          case RECENT_ACTIVITY_TYPE.TASK_CREATED:

            if (getAgentRecentActivity[i].sub_task_name) {
              getAgentRecentActivity[i].message = `${userName} created the ${getAgentRecentActivity[i].sub_task_name} sub-task in the ${getAgentRecentActivity[i].task_name} task under the ${getAgentRecentActivity[i].project_name} project.`;
            } else {
              getAgentRecentActivity[i].message = `${userName} assigned the ${getAgentRecentActivity[i].task_name} task to you in the ${getAgentRecentActivity[i].project_name} project.`;
            }
            break;
          case RECENT_ACTIVITY_TYPE.TASK_UPDATED:
            getAgentRecentActivity[i].message = `${userName} updated the ${getAgentRecentActivity[i].task_name} task successfully in the ${getAgentRecentActivity[i].project_name} project.`;
            break;
          case RECENT_ACTIVITY_TYPE.TASK_MOVE:
            getAgentRecentActivity[i].message = `${userName} moved the ${getAgentRecentActivity[i].task_name} task to ${getAgentRecentActivity[i].project_column_name} in the ${getAgentRecentActivity[i].project_name} project successfully.`;
            break;
          case RECENT_ACTIVITY_TYPE.TASK_DELETE:
            getAgentRecentActivity[i].message = `${userName} deleted the ${getAgentRecentActivity[i].task_name} task successfully in the ${getAgentRecentActivity[i].project_name} project.`;
            break;
          case RECENT_ACTIVITY_TYPE.PASSWORD_MANAGER_ASSIGN:
            getAgentRecentActivity[i].message = `${userName} assigned the password ${getAgentRecentActivity[i].site_name} to you.`;
            break;
          case RECENT_ACTIVITY_TYPE.SHARED_FILE_CREATE:
            getAgentRecentActivity[i].message = `${userName} shared the ${getAgentRecentActivity[i].file_name} file successfully.`;
            break;
          case RECENT_ACTIVITY_TYPE.TASK_COMPLETE:
            getAgentRecentActivity[i].message = `${userName} has successfully ${getAgentRecentActivity[i].project_column_name} the ${getAgentRecentActivity[i].task_name} task in the ${getAgentRecentActivity[i].project_name} project successfully.`;
            break;
          case RECENT_ACTIVITY_TYPE.TASK_COMMENT_ADD:
            getAgentRecentActivity[i].message = `${userName} added a new comment to the ${getAgentRecentActivity[i].task_name} task in the ${getAgentRecentActivity[i].project_name} project.`;
            break;
          default:
            getAgentRecentActivity[i].message = "";
        }
      }
    }
    return { list: getAgentRecentActivity, total_records: totalAgentRecentActivities, filtered_records: getAgentRecentActivity.length }
  };


  /** get Notification */
  getNotificationById = async (notificationId, userId) => {
    return await this.Models.ReadNotifications.findOne({
      where: {
        id: notificationId,
        user_id: userId
      },
      raw: true
    });
  };

  /** update Notification By Id */
  updateNotificationById = async (notificationId) => {
    return await this.Models.ReadNotifications.update({
      is_read: 1
    }, {
      where: {
        id: notificationId,
      },
    });
  };

  /** get All User Notification Ids*/
  getAllNotificationsById = async (userId) => {
    let getAllNotifications = await this.Models.ReadNotifications.findAll({
      where: {
        user_id: userId,
        is_read: 0
      },
      raw: true
    });
    let getAllNotificationIds = await getAllNotifications.map(notifications => notifications.id);
    return getAllNotificationIds;
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


  getUserDetailForJwtById = async (userId) => {
    return await this.Models.Users.findOne({
      attributes: ["id", "uuid", "role_id", "first_name", "last_name", "email", "phone_number", "user_image", "social_id", "social_type", "deleted_at", "address", "is_verified", "status", "docusign_link", "is_complete_profile", "two_factor_authentication", "added_by", "createdAt", "updatedAt", [sequelize.literal("LOWER((SELECT name FROM roles WHERE roles.id = users.role_id limit 1))"), "role"],
        [sequelize.literal(`IFNULL((SELECT is_authenticate FROM global_settings WHERE global_settings.user_role = users.role_id limit 1), 0)`), "global_two_factor"],
        [sequelize.literal(`
      CASE 
        WHEN (SELECT COUNT(*) 
              FROM client_subscriptions 
              WHERE client_subscriptions.client_id = users.id 
              AND client_subscriptions.status = 1
              AND client_subscriptions.deleted_at IS NULL) = 0 THEN 0
        WHEN (SELECT COUNT(*) 
              FROM client_subscriptions 
              WHERE client_subscriptions.client_id = users.id 
              AND client_subscriptions.deleted_at IS NULL 
              AND client_subscriptions.status = 1
              AND client_subscriptions.is_signed_docusign = 0) > 0 THEN 0
        ELSE 1
      END
    `), "is_signed"], [sequelize.literal(` CASE WHEN ( SELECT COUNT(*) FROM client_subscriptions WHERE client_subscriptions.client_id = users.id AND client_subscriptions.deleted_at IS NULL AND client_subscriptions.status = 1) > 0 THEN 1
      ELSE 0 END `), "is_subscription"], [sequelize.literal(`
      CASE
        WHEN (SELECT COUNT(*) FROM client_subscriptions 
              WHERE client_subscriptions.client_id = users.id 
              AND deleted_at IS NULL 
              AND client_subscriptions.status = 1 
              AND client_subscriptions.is_signed_docusign = 1 
              LIMIT 1) > 0 THEN 'Active'
        WHEN (SELECT COUNT(*) FROM client_subscriptions 
              WHERE client_subscriptions.client_id = users.id 
              AND deleted_at IS NULL 
              AND client_subscriptions.status = 0 
              AND client_subscriptions.is_signed_docusign = 0 
              LIMIT 1) > 0 THEN 'Pending'
        WHEN (SELECT COUNT(*) FROM client_subscriptions 
              WHERE client_subscriptions.client_id = users.id 
              AND deleted_at IS NULL 
              AND client_subscriptions.status = 2 
              AND client_subscriptions.is_signed_docusign = 1 
              LIMIT 1) > 0 THEN 'Paused'
        WHEN (SELECT COUNT(*) FROM client_subscriptions 
              WHERE client_subscriptions.client_id = users.id 
              AND deleted_at IS NULL 
              AND client_subscriptions.status = 3 
              AND client_subscriptions.is_signed_docusign = 0 
              LIMIT 1) > 0 THEN 'Suspended'
        WHEN (SELECT COUNT(*) FROM client_subscriptions 
            WHERE client_subscriptions.client_id = users.id 
            AND deleted_at IS NULL 
            AND client_subscriptions.status = 4 
            AND client_subscriptions.is_signed_docusign = 1
            LIMIT 1) > 0 THEN 'Pending'
        ELSE 'Pending'
      END
    `), 'subcription_status']],
      where: {
        id: userId,
        deleted_at: null
      },
    });
  };

  getProjectsForSlackIntegration = async (userId) => {
    return this.Models.Projects.findAll({
      attributes: ["id", "name", "slack_notification_url","slack_channel_name","types_of_slack_notification",
      [sequelize.literal('IF(slack_notification_url IS NOT NULL, 1, 0)'), 'is_slack_sync'],
      ],
      where: {
        deleted_at: null,
        user_id: userId
      },
      raw: true
    })
  }

  updateProject = async (data, projectId) => {
    return await this.Models.Projects.update(data, {
      where: {
        id: projectId,
      }
    })
  }


}
