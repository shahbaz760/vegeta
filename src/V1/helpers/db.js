import config from "config";
import { Sequelize, DataTypes } from "sequelize";

export default class DB {
  constructor() {
    this.seqClient = null;
    this.dbConfig = config.db;
    this.mysqlConfigClient = this.dbConfig.mysql.client;
    this.db = {};
    this.isDbRunning = true;
  }

  async connectMySQLClient() {
    try {
      this.seqClient = new Sequelize(
        this.mysqlConfigClient.database,
        this.mysqlConfigClient.username,
        this.mysqlConfigClient.password,
        {
          host: this.mysqlConfigClient.host,
          port: this.mysqlConfigClient.port,
          dialect: this.mysqlConfigClient.dialect,
          operatorsAliases: 0,
          logging: true,
          pool: {
            min: this.mysqlConfigClient.pool.min,
            max: this.mysqlConfigClient.pool.max,
            idle: this.mysqlConfigClient.pool.idle,
          },
          define: {
            underscored: true,
          },
          logging: false,
        }
      );
      this.seqClient
        .authenticate()
        .then(() => {
          console.log(
            "Connection to Client DB has been established successfully."
          );
        })
        .catch((err) => {
          console.error("Unable to connect to the Client database:", err);
        });
    } catch (err) {
      throw err;
    }
  }
  async init() {
    await this.connectMySQLClient();
    await this.setupModels();
  }

  async checkConnection() {
    try {
      return this.isDbRunning;
    } catch (error) {
      return !this.isDbRunning;
    }
  }

  async setupModels() {
    this.db.sqlClient = this.seqClient;
    this.db.sequelize = this.seqClient;
    this.db.models = {};
    this.db.models.Users = require("../../../database/models/user")(
      this.seqClient,
      DataTypes
    );
    this.db.models.Roles = require("../../../database/models/roles.js")(
      this.seqClient,
      DataTypes
    );

    this.db.models.UserLoginTime =
      require("../../../database/models/user_login_time.js")(
        this.seqClient,
        DataTypes
      );

    this.db.models.AssignedUsers =
      require("../../../database/models/assigned_users.js")(
        this.seqClient,
        DataTypes
      );

    this.db.models.AgentGroups =
      require("../../../database/models/agent_groups.js")(
        this.seqClient,
        DataTypes
      );

    this.db.models.AgentGroupMembers =
      require("../../../database/models/agent_group_members.js")(
        this.seqClient,
        DataTypes
      );

    this.db.models.LineItems =
      require("../../../database/models/line_items.js")(
        this.seqClient,
        DataTypes
      );

    this.db.models.ClientSubscriptions =
      require("../../../database/models/client_subscriptions.js")(
        this.seqClient,
        DataTypes
      );

    this.db.models.ClientSubscriptionPlans =
      require("../../../database/models/client_subscription_plans.js")(
        this.seqClient,
        DataTypes
      );

    this.db.models.Projects =
      require("../../../database/models/projects.js")(
        this.seqClient,
        DataTypes
      );

    this.db.models.ProjectColumns =
      require("../../../database/models/project_columns.js")(
        this.seqClient,
        DataTypes
      );


    this.db.models.AgentAttachments =
      require("../../../database/models/agent_attachments.js")(
        this.seqClient,
        DataTypes
      );

    this.db.models.Tasks =
      require("../../../database/models/task.js")(
        this.seqClient,
        DataTypes
      );

    this.db.models.AssignedTaskUsers =
      require("../../../database/models/assigned_task_users.js")(
        this.seqClient,
        DataTypes
      );

    this.db.models.TaskFiles =
      require("../../../database/models/task_files.js")(
        this.seqClient,
        DataTypes
      );


    this.db.models.ProjectDocument =
      require("../../../database/models/project_document.js")(
        this.seqClient,
        DataTypes
      );

    this.db.models.ProjectWhiteboard =
      require("../../../database/models/project_whiteBoard.js")(
        this.seqClient,
        DataTypes
      );

    this.db.models.ProjectMenu =
      require("../../../database/models/project_menu.js")(
        this.seqClient,
        DataTypes
      );

    this.db.models.Countries =
      require("../../../database/models/countries.js")(
        this.seqClient,
        DataTypes
      );

    this.db.models.States =
      require("../../../database/models/states.js")(
        this.seqClient,
        DataTypes
      );

    this.db.models.RecentActivities =
      require("../../../database/models/recent_activities.js")(
        this.seqClient,
        DataTypes
      );

    this.db.models.TaskLabels =
      require("../../../database/models/task_labels.js")(
        this.seqClient,
        DataTypes
      );

    this.db.models.PasswordManager =
      require("../../../database/models/password_manager.js")(
        this.seqClient,
        DataTypes
      );

    this.db.models.assignedAgentPasswords =
      require("../../../database/models/assigned_agent_to_passwords.js")(
        this.seqClient,
        DataTypes
      );

    this.db.models.SharedFiles =
      require("../../../database/models/shared_files.js")(
        this.seqClient,
        DataTypes
      );

    this.db.models.Supports =
      require("../../../database/models/supports.js")(
        this.seqClient,
        DataTypes
      );

    this.db.models.SupportAttachments =
      require("../../../database/models/support_attachments.js")(
        this.seqClient,
        DataTypes
      );

    this.db.models.Departments =
      require("../../../database/models/departments.js")(
        this.seqClient,
        DataTypes
    );

    this.db.models.ClientSubscriptionHistories =
    require("../../../database/models/client_subscription_histories.js")(
      this.seqClient,
      DataTypes
    );

    this.db.models.TaskSelectedLabels =
    require("../../../database/models/task_selected_labels.js")(
      this.seqClient,
      DataTypes
    );

    this.db.models.Cards =
    require("../../../database/models/cards.js")(
      this.seqClient,
      DataTypes
    );

    this.db.models.Keywords =
    require("../../../database/models/keywords.js")(
      this.seqClient,
      DataTypes
    );

    this.db.models.KeywordMails =
    require("../../../database/models/keyword_mails.js")(
      this.seqClient,
      DataTypes
    );


    this.db.models.ClientSubscriptionHistoryPlans =
    require("../../../database/models/client_subscription_history_plans.js")(
      this.seqClient,
      DataTypes
    );

    this.db.models.KeywordNotificationEmails =
    require("../../../database/models/keyword_notification_emails.js")(
      this.seqClient,
      DataTypes
    );

    this.db.models.UserTaskPermissions =
    require("../../../database/models/user_task_permissions.js")(
      this.seqClient,
      DataTypes
    );

    this.db.models.SupportChatMessages =
    require("../../../database/models/support_chat_messages.js")(
      this.seqClient,
      DataTypes
    );

    this.db.models.ProjectFilters =
    require("../../../database/models/project_filters.js")(
      this.seqClient,
      DataTypes
    );

    this.db.models.GlobalSettings =
    require("../../../database/models/global_settings.js")(
      this.seqClient,
      DataTypes
    );

    this.db.models.TaskChatMessages =
    require("../../../database/models/task_chat_messages.js")(
      this.seqClient,
      DataTypes
    );

    this.db.models.RolesAndPermissions =
    require("../../../database/models/roles_and_permissions.js")(
      this.seqClient,
      DataTypes
    );

    this.db.models.SubscriptionSettings =
    require("../../../database/models/subscription_settings.js")(
      this.seqClient,
      DataTypes
    );

    this.db.models.ReadNotifications =
    require("../../../database/models/read_notifications.js")(
      this.seqClient,
      DataTypes
    );

    this.db.models.AgentNotes =
    require("../../../database/models/agent_notes.js")(
      this.seqClient,
      DataTypes
    );
    
    
    /**Associations */
    this.db.models.AgentGroups.hasMany(this.db.models.AgentGroupMembers, {
      foreignKey: 'agent_group_id',
      as: 'group_members'
    });

    this.db.models.Users.hasMany(this.db.models.AssignedUsers, {
      foreignKey: 'user_id',
      as: 'assigned_clients'
    });

    this.db.models.ClientSubscriptions.hasMany(this.db.models.ClientSubscriptionPlans, {
      foreignKey: 'subscription_id',
      as: 'subscription_plans'
    });

    this.db.models.Users.hasMany(this.db.models.AgentAttachments, {
      foreignKey: 'agent_id',
      as: 'attachments'
    });

    this.db.models.Users.hasMany(this.db.models.ClientSubscriptions, {
      foreignKey: 'client_id',
      as: 'subscription_and_docusign'
    });

    this.db.models.Users.hasMany(this.db.models.Projects, {
      foreignKey: 'user_id',
      as: 'projects'
    });

    this.db.models.AgentGroupMembers.belongsTo(this.db.models.Users, {
      foreignKey: 'user_id',
      as: 'member_details'
    });

    this.db.models.AgentGroupMembers.belongsTo(this.db.models.AgentGroups, {
      foreignKey: 'agent_group_id',
      as: 'group_name'
    });

    this.db.models.Tasks.hasMany(this.db.models.TaskFiles, {
      foreignKey: 'task_id',
      as: 'task_files'
    });

    this.db.models.Tasks.hasMany(this.db.models.AssignedTaskUsers, {
      foreignKey: 'task_id',
      as: 'assigned_task_users',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    this.db.models.ProjectColumns.hasMany(this.db.models.Tasks, {
      foreignKey: 'project_column_id',
      as: 'tasks'
    });

    this.db.models.Users.hasMany(this.db.models.AssignedTaskUsers, {
      foreignKey: 'user_id',
      as: 'agent_projects',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    this.db.models.Users.hasMany(this.db.models.AssignedUsers, {
      foreignKey: 'agent_id',
      as: 'assigned_agent_client'
    });

    this.db.models.Users.hasMany(this.db.models.AssignedUsers, {
      foreignKey: 'account_manager_id',
      as: 'assigned_account_manager_client'
    });

    this.db.models.Tasks.hasMany(this.db.models.Tasks, {
      as: "sub_tasks",
      foreignKey: "parent_task_id",
    });

    this.db.models.PasswordManager.hasMany(this.db.models.assignedAgentPasswords, {
      foreignKey: 'password_manager_id',
      as: 'password_assigned_agent'
    });

    this.db.models.assignedAgentPasswords.belongsTo(this.db.models.PasswordManager, {
      foreignKey: 'password_manager_id',
      as: 'password_manager_details'
    });

    this.db.models.assignedAgentPasswords.belongsTo(this.db.models.Users, {
      foreignKey: 'agent_id',
      as: 'agent_details'
    });

    this.db.models.Supports.hasMany(this.db.models.SupportAttachments, {
      foreignKey: 'support_id',
      as: 'Support_Attachments_details'
    });

    this.db.models.AssignedUsers.belongsTo(this.db.models.Users, {
      foreignKey: 'account_manager_id',
      as: 'Account_manager_details'
    });


    this.db.models.Tasks.hasMany(this.db.models.TaskSelectedLabels, {
      foreignKey: 'task_id',
      as: 'task_selected_labels',
    });


    this.db.models.Supports.hasMany(this.db.models.SupportChatMessages, {
      foreignKey: 'support_id',
      as: 'support_chat'
    });

    this.db.models.SupportChatMessages.hasMany(this.db.models.SupportAttachments, {
      foreignKey: 'chat_id',
      as: 'support_chat_attachments'
    });

    this.db.models.Projects.hasMany(this.db.models.AssignedTaskUsers, {
      foreignKey: 'project_id',
      as: 'project_assignees'
    });


    this.db.models.TaskChatMessages.belongsTo(this.db.models.Users, {
      foreignKey: 'user_id',
      as: 'sender_detail'
    });

    this.db.models.TaskChatMessages.hasMany(this.db.models.TaskFiles, {
      foreignKey: 'chat_id',
      as: 'task_chat_files'
    });

    this.db.models.Users.hasMany(this.db.models.AssignedUsers, {
      foreignKey: 'account_manager_id',
      as: 'assigned_account_manager_agents'
    });

    this.db.models.ReadNotifications.belongsTo(this.db.models.RecentActivities, {
      foreignKey: 'notification_id',
      as: 'notifications'
    });


    this.db.sqlClient.sync({ alter: true });
  }

  async getDB() {
    return this.db;
  }
}
