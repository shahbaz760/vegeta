import sequelize, { Sequelize } from 'sequelize';
const Op = sequelize.Op;
import { PAGINATION, RESPONSE_CODES, ROLES, ASSIGNED_USERS, PROJECT_DEFAULT_COLUMN, PROJECT_MENU_NAME, PROJECT_MENUS } from '../../../config/constants';
import { v4 as uuidv4 } from 'uuid';
import moment from "moment";
import { raw } from '@hapi/joi/lib/base';
import { attempt, required } from '@hapi/joi';

export default class Project {
  async init(db) {
    this.Models = db.models;
  }

  /** create project */
  createProject = async (data) => {
    return await this.Models.Projects.create(data);
  };

  /** get project by name*/
  getProjectByName = async (name) => {
    return this.Models.Projects.findOne({
      where: {
        name: name,
      },
      raw: true
    });
  };

  /** get all project list with pagination and search filter and total count*/
  getProjectList = async (body, userId) => {
    let whereCondition = {
      deleted_at: null,
      user_id: userId
    };

    if (body.search) {
      whereCondition = {
        [Op.or]: [
          { name: { [Op.like]: `%${body.search}%` } },
        ],
        deleted_at: null,
        user_id: userId
      }
    }

    const allProjectCount = await this.Models.Projects.count({
      where: whereCondition,
    });

    const getAllProjects = await this.Models.Projects.findAll({
      attributes: { include: [[sequelize.literal("(SELECT id FROM project_columns WHERE project_columns.project_id = projects.id AND project_columns.is_defalut = 1 AND project_columns.defalut_name = 'To Do' AND project_columns.deleted_at IS NULL limit 1)"), "project_column_id"]]},
      include: [{
        model: this.Models.AssignedTaskUsers,
        attributes: { include: [[sequelize.literal("(SELECT concat(first_name, ' ', last_name) FROM users WHERE users.id = project_assignees.user_id limit 1)"), "user_name"]]},
        as: "project_assignees",
        required: false,
        where: {
          deleted_at: null,
          task_id: null
        },
      }],
      where: whereCondition,
      order: [
        ['sort_order', 'ASC'],
      ],
      offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
      limit: (body.limit == -1) ? allProjectCount : parseInt(body.limit) || PAGINATION.LIMIT,
      // raw: true,
    });

    return { list: getAllProjects, total_records: allProjectCount, filtered_records: getAllProjects.length }
  };


  /** get project by id*/
  getProjectById = async (projectId) => {
    return this.Models.Projects.findOne({
      include: [{
        model: this.Models.AssignedTaskUsers,
        attributes: { include: [[sequelize.literal("(SELECT concat(first_name, ' ', last_name) FROM users WHERE users.id = project_assignees.user_id limit 1)"), "user_name"]]},
        as: "project_assignees",
        required: false,
        where: {
          deleted_at: null,
          task_id: null
        },
      }],
      where: {
        id: projectId,
        deleted_at: null
      },
    });
  };


  /** get project column by name or project id*/
  getProjectColumnByName = async (projectId, projectName) => {
    return await this.Models.ProjectColumns.findOne({
      where: {
        project_id: projectId,
        name: projectName,
        deleted_at: null
      },
      raw: true
    });
  };

  /** get project column by name or column id*/
  getProjectColumnByColumnIdAndName = async (columnId, projectId, projectName) => {
    return await this.Models.ProjectColumns.findOne({
      where: {
        id: {
          [Op.ne]: columnId
        },
        project_id: projectId,
        name: projectName,
        deleted_at: null
      },
      raw: true
    });
  };

  /** update project by condition*/
  updateProjectdata = async (data, projectId) => {
    return await this.Models.Projects.update(data, { where: { id: projectId } });
  };

  createColumn = async (data) => {
    return await this.Models.ProjectColumns.create(data);
  }

  getColumnList = async (body, userDetail, projectCreator) => {

    let whereCondition = {
      deleted_at: null,
      project_id: body.project_id
    };

    let taskWhereCondition = {
      deleted_at: null,
      parent_task_id: null
    };

    if (body.search) {
      taskWhereCondition = {
        [Op.or]: [
          { title: { [Op.like]: `%${body.search}%` } },
          { description: { [Op.like]: `%${body.search}%` } },
        ],
        deleted_at: null,
        parent_task_id: null
      }
    }

    let taskAssignedUserCondition = {
      deleted_at: null
    };
    let taskAssignedUserRequire = false;

    let getPrivateProjectIds = [];
    let getPrivateTaskIds = [];
    let getUsersIds = [];
    let getAllTaskIds = [];
    let getTaskIds = [];
    let getAllSubTaskIds = [];
    let getSubUserIds = [];
    let combinedTasksId = [];

    let checkIsToggle = await this.getUserTaskPermission(projectCreator, userDetail.id);
  
    if (userDetail.role_id != ROLES.CLIENT && checkIsToggle == 1) {
      let getAssignedUsers = await this.Models.AssignedTaskUsers.findAll({
        attributes:["id", "task_id", "project_id", [sequelize.literal("(SELECT parent_task_id FROM tasks WHERE tasks.id = assigned_task_users.task_id)"), "parent_task_id"], [sequelize.literal("(SELECT is_private FROM projects WHERE projects.id = assigned_task_users.project_id)"), "is_private"]],
        where: {
          project_id: body.project_id,
          user_id: userDetail.id,
          deleted_at: null,
        },
        raw: true,
      });

      if (getAssignedUsers.length > 0) {
        getPrivateProjectIds = getAssignedUsers.map(val=> {
          if(val.is_private == 1) {
            return val.project_id;
          }
        });

        if(getPrivateProjectIds.length > 0) {
          let getPrivatetasks = await this.Models.Tasks.findAll({
            attributes: ["id", "parent_task_id", "project_id", "deleted_at"],
            where: {
              deleted_at: null,
              project_id: getPrivateProjectIds
            },
            raw: true
          });
          getPrivateTaskIds =  getPrivatetasks.map(val => val.id);
        }
        
        getUsersIds = getAssignedUsers.map(val => val.id);
        getAllTaskIds = getAssignedUsers.map(val => val.parent_task_id ? val.parent_task_id : val.task_id);
      }
      getTaskIds = getPrivateTaskIds.concat(getAllTaskIds);

      if(getTaskIds.length > 0) {
        let getAllSubTasks = await this.Models.Tasks.findAll({
          attributes: ["id", "parent_task_id", "deleted_at"],
          where: {
            deleted_at: null,
            parent_task_id: getTaskIds
          },
          raw: true
        });

        if(getAllSubTasks.length > 0){
          getAllSubTaskIds = getAllSubTasks.map(val => val.parent_task_id);

          let getSubTaskAssignedUsers = await this.Models.AssignedTaskUsers.findAll({
            attributes: ["id", "task_id"],
            where: {
              task_id: getAllSubTaskIds,
              deleted_at: null
            },
            raw: true,
          });
          getSubUserIds = getSubTaskAssignedUsers.map(val => val.id);
        }
      }

      combinedTasksId = getTaskIds.concat(getAllSubTaskIds);

      let combinedTasksUserId = getUsersIds.concat(getSubUserIds);
      taskAssignedUserCondition.id = getSubUserIds;
      taskWhereCondition = {
        [Op.or]: [
          {
            id: combinedTasksId
          },
          {
            added_by: userDetail.id
          }
        ],
        ...taskWhereCondition
      };
      taskAssignedUserRequire = true;
    };

    let task_offset = (parseInt(body.task_start) == 0) ? 0 : (parseInt(body.task_start) || PAGINATION.START) * (parseInt(body.task_limit) || PAGINATION.LIMIT) || PAGINATION.START;
    let task_limit = parseInt(body.task_limit) || PAGINATION.LIMIT;


    let attributes = { include: [[sequelize.literal(`(SELECT Count(*) FROM tasks WHERE tasks.project_column_id = project_columns.id AND tasks.deleted_at IS NULL AND tasks.parent_task_id IS NULL)`), "total_tasks"], [sequelize.literal(`(SELECT Count(*) FROM tasks WHERE tasks.project_column_id = project_columns.id AND tasks.deleted_at IS NULL AND tasks.parent_task_id IS NULL LIMIT ${task_limit} OFFSET ${task_offset})`), "filtered_tasks"]] };


    if (body.project_column_id != 0) {
      whereCondition.id = body.project_column_id;
      taskWhereCondition.project_column_id = body.project_column_id;


      whereCondition = {
        deleted_at: null,
        project_id: body.project_id,
        id: body.project_column_id
      };
  
      taskWhereCondition = {
        deleted_at: null,
        project_column_id: body.project_column_id,
        parent_task_id: null,
      };


      if(combinedTasksId !=undefined && combinedTasksId.length > 0) {
        let newCombinedTaskId = [...new Set(combinedTasksId)];
        taskWhereCondition = {
          deleted_at: null,
          project_column_id: body.project_column_id,
          parent_task_id: null,
          id: newCombinedTaskId,
        };
      }

      attributes = {
        include: [[sequelize.literal(`(SELECT Count(*) FROM tasks WHERE tasks.project_column_id = ${body.project_column_id} AND tasks.deleted_at IS NULL AND tasks.parent_task_id IS NULL)`), "total_tasks"], [
          sequelize.literal(`(SELECT COUNT(*) FROM (SELECT 1 FROM tasks WHERE tasks.project_column_id = ${body.project_column_id} AND tasks.deleted_at IS NULL AND tasks.parent_task_id IS NULL LIMIT ${task_limit} OFFSET ${task_offset}) AS limited_tasks)`), 'filtered_tasks']]
      };
    }

    const allColumnsCount = await this.Models.ProjectColumns.count({
      where: whereCondition,
    });


    const getAllColumns = await this.Models.ProjectColumns.findAll({
      attributes: attributes,
      include: [{
        model: this.Models.Tasks,
        attributes: { include: [[
          sequelize.literal(`(SELECT COUNT(*) FROM tasks AS subTasks WHERE subTasks.parent_task_id = tasks.id AND subTasks.deleted_at IS NULL)`),'total_sub_tasks'], [sequelize.literal(`CASE WHEN (SELECT defalut_name FROM project_columns WHERE project_columns.id = tasks.status) = 'completed' THEN 1 ELSE 0 END`), 'is_completed'],[sequelize.literal(`(SELECT name FROM project_columns WHERE project_columns.id = tasks.status AND tasks.deleted_at IS NULL)`), 'status_name'],[sequelize.literal(`IFNULL((
            SELECT GROUP_CONCAT(tl.label ORDER BY tl.id ASC SEPARATOR ', ')
            FROM task_selected_labels tsl
            JOIN task_labels tl ON tl.id = tsl.label_id
            WHERE tsl.task_id = tasks.id
            AND tsl.deleted_at IS NULL
            AND tl.deleted_at IS NULL
          ), 'No Labels')`), "task_label_name"]]},
        as: "tasks",
        where: taskWhereCondition,
        required: false,
        include: [
          {
            model: this.Models.Tasks,
            as: "sub_tasks",
            attributes: { include: [[sequelize.literal("CASE WHEN (SELECT defalut_name FROM project_columns WHERE project_columns.id = `tasks->sub_tasks`.`status`) = 'Completed' THEN 1 ELSE 0 END"), 'is_completed'], [sequelize.literal("(SELECT name FROM project_columns WHERE project_columns.id = `tasks->sub_tasks`.`status`)"), 'status_name'],[sequelize.literal(`IFNULL((
              SELECT GROUP_CONCAT(tl.label ORDER BY tl.id ASC SEPARATOR ', ')
              FROM task_selected_labels tsl
              JOIN task_labels tl ON tl.id = tsl.label_id
              WHERE tsl.task_id = tasks.id
              AND tsl.deleted_at IS NULL
              AND tl.deleted_at IS NULL
            ), 'No Labels')`), "task_label_name"]]},
            required: false,
            where: {
              deleted_at: null
            },
            include: [
              {
              model: this.Models.AssignedTaskUsers,
              as: "assigned_task_users",
              attributes: ["id", "user_id", ["user_id", "agent_id"], "project_id", "task_id",[sequelize.literal("(SELECT first_name FROM users WHERE users.id = `tasks->assigned_task_users`.`user_id`)"), "first_name"], [sequelize.literal("(SELECT last_name FROM users WHERE users.id = `tasks->assigned_task_users`.`user_id`)"), "last_name"], [sequelize.literal("(SELECT user_image FROM users WHERE users.id = `tasks->assigned_task_users`.`user_id`)"), "user_image"]
              ],
              required: false,
              where: {
                deleted_at: null
              }
            },
            {
              model: this.Models.TaskSelectedLabels,
              attributes: ["id", "label_id", "deleted_at", [sequelize.literal("(SELECT label FROM task_labels WHERE task_labels.id = `tasks->sub_tasks->task_selected_labels`.`label_id`)"), "label"]],
              as: "task_selected_labels",
              where: {
                deleted_at: null,
              },
              required: false,
            }]
          },
          {
          model: this.Models.AssignedTaskUsers,
          as: "assigned_task_users",
          attributes: ["id", "user_id", ["user_id", "agent_id"], "project_id", "task_id", 
          [sequelize.literal("(SELECT first_name FROM users WHERE users.id = `tasks->assigned_task_users`.`user_id`)"), "first_name"],[sequelize.literal("(SELECT last_name FROM users WHERE users.id = `tasks->assigned_task_users`.`user_id`)"), "last_name"], [sequelize.literal("(SELECT user_image FROM users WHERE users.id = `tasks->assigned_task_users`.`user_id`)"), "user_image"]
          ],
          required: false,
          where: {
            deleted_at: null
          }
        },
        {
          model: this.Models.TaskSelectedLabels,
          attributes: ["id", "label_id", "deleted_at", [sequelize.literal("(SELECT label FROM task_labels as taskLabel WHERE taskLabel.id = `tasks->task_selected_labels`.`label_id`)"), "label"]],
          as: "task_selected_labels",
          where: {
            deleted_at: null,
          },
          required: false,
        },
      ],
      }],
      where: whereCondition,
      order: [
        ['sort_order', 'ASC'],
        [
          { model: this.Models.Tasks, as: "tasks" }, 
          { model: this.Models.Tasks, as: "sub_tasks" }, 
          "sort_order", 
          "ASC"
        ]
      ],
      offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
      limit: (body.limit == -1) ? allColumnsCount : parseInt(body.limit) || PAGINATION.LIMIT,
    });
    return { list: getAllColumns, total_records: allColumnsCount, filtered_records: getAllColumns.length }
  };


  /** get column by id */
  getColumnById = async (columnId) => {
    return await this.Models.ProjectColumns.findOne({
      attributes: { include: [[sequelize.literal("(SELECT name FROM projects WHERE projects.id = project_columns.project_id)"), "project_name"]]},
      where: {
        id: columnId,
        deleted_at: null
      },
      raw: true
    });
  };

  //Delete Project Column
  updateProjectColumn = async (data, ColumnId) => {
    return await this.Models.ProjectColumns.update(data, { where: { id: ColumnId } });
  };


  deleteColumnTasks = async (data, ColumnId) => {
    return await this.Models.Tasks.update(
      data, {
      where: {
        project_column_id: ColumnId,
      }
    }
    )
  }


  /** sort order */
  columnMovement = async (projectId, columnIds) => {
    for (let i in columnIds) {
      await this.Models.ProjectColumns.update({
        sort_order: +i + 1
      }, {
        where: {
          project_id: projectId,
          id: columnIds[i],
          deleted_at: null
        },
      });
    }
    return true
  };




  getColumnTaskStatus = async (body) => {
    let whereCondition = {
      deleted_at: null,
      project_id: body.project_id
    };

    const getAllColumns = await this.Models.ProjectColumns.findAll({
      attributes: ["id", "name"],
      where: whereCondition,
      order: [
        ['id', 'DESC'],
      ],
    });
    return { list: getAllColumns }
  };


  findProject = async (projectID) => {
    return await this.Models.Projects.findOne({
      where: {
        id: projectID,
        deleted_at: null
      },
      raw: true
    })
  }

  findProjectDocument = async (documentId) => {
    return await this.Models.ProjectDocument.findOne({
      where: {
        id: documentId,
        deleted_at: null
      },
      raw: true
    })
  };


  findProjectDocumentByMenuId = async (menuId) => {
    return await this.Models.ProjectDocument.findOne({
      where: {
        project_menu_id: menuId,
        deleted_at: null
      },
      raw: true
    })
  }

  /** create project Document */
  AddProjectWhiteboard = async (data) => {
    return await this.Models.ProjectWhiteboard.create(data);
  };

  checkuserAndProjectById = async (projectID, userID) => {
    return await this.Models.ProjectWhiteboard.findOne({
      attributes: ["id", "user_id", "project_id", "xml_data", "xml_img"],
      where: {
        project_id: projectID,
        user_id: userID,
        deleted_at: null
      },
      raw: true
    })
  }

  /** Get project whiteboard by project id */
  getProjectWhiteboardByProjectId = async (projectID) => {
    return await this.Models.ProjectWhiteboard.findOne({
      attributes: ["id", "user_id", "project_id", "xml_data", "xml_img", "sort_order", "deleted_at"],
      where: {
        project_id: projectID,
        deleted_at: null
      },
      raw: true
    })
  }

  updateWhiteboard = async (data, projectMenuId,  user_id) => {
    return await this.Models.ProjectWhiteboard.update(data, { 
      where: { 
        project_menu_id: projectMenuId, 
        user_id: user_id 
      } });
  };

  /** create project Document */
  AddProjectDocument = async (data) => {
    return await this.Models.ProjectDocument.create(data);
  };

  checkuserAndProjectByIdForDoc = async (projectID, userID) => {
    return await this.Models.ProjectDocument.findOne({
      attributes: ["id", "user_id", "project_id", "doc_file"],
      where: {
        project_id: projectID,
        user_id: userID,
        deleted_at: null
      },
      raw: true
    })
  }


  /** Get project document by project id */
  getProjectDocumentByProjectId = async (projectID) => {
    return await this.Models.ProjectDocument.findOne({
      attributes: ["id", "user_id", "project_id", "doc_file", "sort_order", "deleted_at"],
      where: {
        project_id: projectID,
        deleted_at: null
      },
      raw: true
    })
  };

  updateDocument = async (body, userId) => {
    return await this.Models.ProjectDocument.update({ doc_file: body.doc_file }, { where: { project_id: body.project_id, user_id: userId } });
  };


  /** Update Project Document */
  updateProjectDocument = async (body, documentId) => {
    return await this.Models.ProjectDocument.update(body, { where: { project_menu_id: documentId} });
  };


  /** get assigned user ids acc. to auth token  */
  getAssignedUserIdForAdminUser = async (body, projectOwnerId, roleId) => {
    let allUserIds = [projectOwnerId];
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

    let getAssignedAccountmanager = await this.Models.AssignedUsers.findAll({
      attributes: ["account_manager_id", "deleted_at", "user_id", "type"],
      where: {
        deleted_at: null,
        user_id: projectOwnerId,
        type: ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER
      },
      raw: true,
    });

    let getAccountmanagerIds = getAssignedAccountmanager.map(val => val.account_manager_id);
    allUserIds.push(getAccountmanagerIds);

    if (roleId == ROLES.CLIENT) {
      let getAssignedAgent = await this.Models.AssignedTaskUsers.findAll({
        attributes: ["project_id", "deleted_at", "user_id", "task_id"],
        group: ["user_id"],
        where: {
          deleted_at: null,
          project_id: body.project_id
        },
        raw: true,
      });
      let getAgentIds = getAssignedAgent.map(val => val.user_id);
      allUserIds.push(getAgentIds);
    }
    let findUserIds = allUserIds.flat();
    return findUserIds
  };

  checkMenu = async (projectID, userID) => {
    return await this.Models.ProjectMenu.findAll({
      where: {
        project_id: projectID,
        user_id: userID,
        deleted_at: null
      }
    })

  }

  createMenu = async (body, userID) => {
    let menu = [1, 2, 3]
    for (let i in menu) {
      await this.Models.ProjectMenu.create({
        user_id: userID,
        project_id: body.project_id,
        menu: menu[i],
        is_disable: 0
      })
    }
    return true
  }

  addEnabledMenu = async (body, userID) => {

      await this.Models.ProjectMenu.update({ is_disable: 0 },{
        where : {
          user_id: userID,
          project_id: body.project_id,
          is_disable: 1
        }
      })

    for (let i in body.menu) {
      await this.Models.ProjectMenu.update({ is_disable: 1 },
        {
          where: {
            user_id: userID,
            project_id: body.project_id,
            menu: body.menu[i]
          }
        })
    }
    return true
  }

  disableMenu = async (body, userID) => {
    return await this.Models.ProjectMenu.update({ is_disable: 0 },{
      where : {
        user_id: userID,
        project_id: body.project_id,
        is_disable: 1
      }
    });
  }

  getProjectMenuList = async (projectId) => {
    let projectMenuList =  await this.Models.ProjectMenu.findAll({
      where : {
        project_id: projectId,
        deleted_at: null,
        is_disable: 1
      },
      order: [
        ["pin", "DESC"],
        ["sort_order", "ASC"]
      ],
      raw: true,
    });

    for(let i in projectMenuList) {
      projectMenuList[i].menu = projectMenuList[i].menu+`.${i}`;
    }
    return projectMenuList;
  }


  /** Create default project columns */
  createDefaultProjectColumns = async (projectId, userId) => {
    let completedProjectColumn = [
      {
        project_id: projectId,
        name: PROJECT_DEFAULT_COLUMN.TO_DO,
        is_defalut: 1,
        sort_order: 1,
        defalut_name: PROJECT_DEFAULT_COLUMN.TO_DO,
        added_by: userId,
      },
      {
        project_id: projectId,
        name: PROJECT_DEFAULT_COLUMN.IN_PROGRESS,
        is_defalut: 0,
        sort_order: 2,
        defalut_name: PROJECT_DEFAULT_COLUMN.IN_PROGRESS,
        added_by: userId,
      },
      {
      project_id: projectId,
      name: PROJECT_DEFAULT_COLUMN.COMPLETED,
      is_defalut: 1,
      sort_order: 3,
      defalut_name: PROJECT_DEFAULT_COLUMN.COMPLETED,
      added_by: userId,
    }];
    return await this.Models.ProjectColumns.bulkCreate(completedProjectColumn);
  }


  /** Create default project menus */
  createDefaultProjectMenus = async (projectId, userId) => {
    let projectMenus = [
      {
        project_id: projectId,
        uuid: uuidv4(),
        user_id: userId,
        name: PROJECT_MENU_NAME.KANBAN_BOARD,
        menu: PROJECT_MENUS.KANBAN_BOARD,
        is_default: 1,
        is_disable: 1,
        sort_order: 1,
      },
      {
        project_id: projectId,
        uuid: uuidv4(),
        user_id: userId,
        name: PROJECT_MENU_NAME.TASK_TABLE,
        menu: PROJECT_MENUS.TASK_TABLE,
        is_default: 1,
        is_disable: 1,
        sort_order: 2,
      },
      {
        project_id: projectId,
        uuid: uuidv4(),
        user_id: userId,
        name: PROJECT_MENU_NAME.TASK_LIST,
        menu: PROJECT_MENUS.TASK_LIST,
        is_default: 1,
        is_disable: 1,
        sort_order: 3,
      },
      {
        project_id: projectId,
        uuid: uuidv4(),
        user_id: userId,
        name: PROJECT_MENU_NAME.CALENDAR,
        menu: PROJECT_MENUS.CALENDAR,
        is_default: 1,
        is_disable: 1,
        sort_order: 4,
      },
      {
        project_id: projectId,
        uuid: uuidv4(),
        user_id: userId,
        name: PROJECT_MENU_NAME.WHITE_BOARD,
        menu: PROJECT_MENUS.WHITE_BOARD,
        is_default: 0,
        is_disable: 0,
        sort_order: 5,
      },
      {
        project_id: projectId,
        uuid: uuidv4(),
        user_id: userId,
        name: PROJECT_MENU_NAME.DOCUMENT,
        menu: PROJECT_MENUS.DOCUMENT,
        is_default: 0,
        is_disable: 0,
        sort_order: 7,
      },
      {
        project_id: projectId,
        uuid: uuidv4(),
        user_id: userId,
        name: PROJECT_MENU_NAME.CHAT,
        menu: PROJECT_MENUS.CHAT,
        is_default: 0,
        is_disable: 0,
        sort_order: 6,
      },
    ];
    return await this.Models.ProjectMenu.bulkCreate(projectMenus);
  }

  /** get project menu detail */
  getProjectMenuDetail = async (uuid) => {
    return await this.Models.ProjectMenu.findOne({
      where : {
        uuid: uuid,
        deleted_at: null,
      },
      raw: true,
    });
  }

  /** update project menu by condition*/
  updateProjectMenudata = async (data, uuid) => {
    return await this.Models.ProjectMenu.update(data, { where: { uuid: uuid } });
  };

  /** Project Column list with filter conditions*/
  getColumnListForFilter = async (body, userDetail, projectCreator) => {

    let whereCondition = {
      project_id: body.project_id,
      parent_task_id: null,
      deleted_at: null,
    };

    let havingCondition = {};

    let task_order = [];

    if(!body.sort || body.sort && body.sort.length == 0) {
      task_order = [];
    }

    let order = [
      ['sort_order', 'ASC']
    ];

    let getColumns = [];

    let key1;
    let key2;
    let totalRecords = 0;

  /** --------------------------------------------------------------------------------------------------*/

    // Assecending or Descending orders acc. to Status (Project Columns) 
    if(body.group.key == 0 || body.group.key == null) {

      if(body.group.order == 0){
        order = [
          [sequelize.literal(`sort_order ASC`)],
        ]
      }else {
        order = [
          [sequelize.literal(`sort_order DESC`)],
        ]
      }

      totalRecords = await this.Models.ProjectColumns.count({
        where: {
          project_id: body.project_id,
          deleted_at: null,
        },
        raw: true,
      });

      getColumns = await this.Models.ProjectColumns.findAll({
        attributes: ["id", "name", "sort_order", ["id", "column_ids"], "is_defalut", "defalut_name"],
        where: {
          project_id: body.project_id,
          deleted_at: null,
        },
        raw: true,
        order: order,
        offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
        limit: (body.limit == -1) ? totalRecords : parseInt(body.limit) || PAGINATION.LIMIT,
      });

      key1 = "name";
      key2 = "project_column_name";
    }


  /** --------------------------------------------------------------------------------------------------*/
    // Assecending or Descending orders acc. to Assignee (Task Assigned Users) 



    if(body.group.order == 0){
      order = [
        [sequelize.literal(`assignee_count ASC`)],
      ]
    }else {
      order = [
        [sequelize.literal(`assignee_count DESC`)],
      ]
    }

    if(body.group.key == 1) {

        let getTotalRecords = await this.Models.Tasks.findAll({
          attributes: ["id", "project_id", "deleted_at", [sequelize.literal(`IFNULL((
            SELECT GROUP_CONCAT(user_id ORDER BY user_id ASC SEPARATOR ',')
            FROM assigned_task_users
            WHERE assigned_task_users.task_id = tasks.id
            AND assigned_task_users.deleted_at IS NULL
          ), 'No Assignee')`), "assigned_user_ids"]],
          group: ["assigned_user_ids"],
          where: {
            project_id: body.project_id,
            deleted_at: null,
          },
          raw: true,
        });
        totalRecords = getTotalRecords.length;

        getColumns = await this.Models.Tasks.findAll({
          attributes: ["id", "project_id", "deleted_at", [sequelize.literal(`IFNULL((
            SELECT GROUP_CONCAT(user_id ORDER BY user_id ASC SEPARATOR ',')
            FROM assigned_task_users
            WHERE assigned_task_users.task_id = tasks.id
            AND assigned_task_users.deleted_at IS NULL
          ), 'No Assignee')`), "assigned_user_ids"], [sequelize.literal(`IFNULL((
            SELECT COUNT(user_id)
            FROM assigned_task_users
            WHERE assigned_task_users.task_id = tasks.id
            AND assigned_task_users.deleted_at IS NULL
          ), 0)`), "assignee_count"], [sequelize.literal("(SELECT is_defalut FROM project_columns WHERE project_columns.id = tasks.project_column_id)"), "is_defalut"]],
          group: ["assigned_user_ids"],
          where: {
            project_id: body.project_id,
            deleted_at: null,
          },
          raw: true,
          order: order,
          offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
          limit: (body.limit == -1) ? totalRecords : parseInt(body.limit) || PAGINATION.LIMIT,
        });

        for(let i in getColumns) {
          let assineeIds = (getColumns[i].assigned_user_ids == "No Assignee") ? "" : getColumns[i].assigned_user_ids.split(",");
          let getUserName = await this.Models.Users.findAll({
            attributes: ["id", "first_name", "last_name", "deleted_at", [sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = users.id)"), "userName"]],
            where: {
              id: assineeIds,
              deleted_at: null
            },
            raw: true,
          });
          let getUser = getUserName.map(val => val.userName);
          let getUserIds = getUserName.map(val => val.id);
          let userName = (getUser.length > 0) ? getUser.toString(", ") : "No Assignee";
          getColumns[i].name = userName;
          getColumns[i].column_ids = (getUserIds.length > 0) ? getUserIds.toString(","): "0";
        }
  
        key1 = "assigned_user_ids";
        key2 = "assigned_user_ids";
    }


  /** --------------------------------------------------------------------------------------------------*/


    if(body.group.order == 0){
      order = [
        [sequelize.literal(`priority_value ASC`)],
      ]
    }else {
      order = [
        [sequelize.literal(`priority_value DESC`)],
      ]
    }


    // Assecending or Descending orders acc. to Priority (Task Priority) 
    if(body.group.key == 2) {

      let getTotalRecords = await this.Models.Tasks.findAll({
        attributes: ["priority"],
        group: ["priority"],
        where: {
          project_id: body.project_id,
          deleted_at: null,
        },
        raw: true,
      });

      totalRecords = getTotalRecords.length;

      getColumns = await this.Models.Tasks.findAll({
        attributes: ["id", 
          [sequelize.fn('IFNULL', sequelize.col('priority'), 'No Priority'), 'name'],
          [sequelize.fn('IFNULL', sequelize.col('priority'), 'No Priority'), 'column_ids'],
          [sequelize.literal("(SELECT is_defalut FROM project_columns WHERE project_columns.id = tasks.project_column_id)"), "is_defalut"],[sequelize.literal(`
            CASE 
              WHEN priority IS NULL THEN 0
              WHEN priority = 'High' THEN 1
              WHEN priority = 'Medium' THEN 2
              WHEN priority = 'Low' THEN 3
              ELSE 4
            END
          `), 'priority_value']
        ],
        group: ["priority"],
        where: {
          project_id: body.project_id,
          deleted_at: null,
        },
        order: ["priority_value", "ASC"],
        raw: true,
        order: order,
        offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
        limit: (body.limit == -1) ? totalRecords.length : parseInt(body.limit) || PAGINATION.LIMIT,
      });

      key1 = "name";
      key2 = "priority_status";
    }


  /** --------------------------------------------------------------------------------------------------*/
    // Assecending or Descending orders acc. to Tags (Task Labels) 

    if(body.group.key == 3){

      if(body.group.order == 0){
        order = [
          [sequelize.literal(`labels_count ASC`)],
        ]
      }else {
        order = [
          [sequelize.literal(`labels_count DESC`)],
        ]
      }

      let getTotalRecords = await this.Models.Tasks.findAll({
        attributes: ["labels"],
        group: ["labels"],
        where: {
          project_id: body.project_id,
          deleted_at: null,
        },
        raw: true,
      });
      totalRecords = getTotalRecords.length;

      let lableCoulumns = await this.Models.Tasks.findAll({
        attributes: ["id",
          [sequelize.literal("(SELECT is_defalut FROM project_columns WHERE project_columns.id = tasks.project_column_id)"), "is_defalut"],
          [sequelize.literal(`IFNULL((
            SELECT GROUP_CONCAT(label_id ORDER BY label_id ASC SEPARATOR ',')
            FROM task_selected_labels
            WHERE task_selected_labels.task_id = tasks.id
            AND task_selected_labels.deleted_at IS NULL
          ), 'No Labels')`), "labels"],
          [sequelize.literal(`IFNULL((
            SELECT GROUP_CONCAT(label_id ORDER BY label_id ASC SEPARATOR ',')
            FROM task_selected_labels
            WHERE task_selected_labels.task_id = tasks.id
            AND task_selected_labels.deleted_at IS NULL
          ), '0')`), "column_ids"],
          [sequelize.literal(`IFNULL((
            SELECT COUNT (label_id)
            FROM task_selected_labels
            WHERE task_selected_labels.task_id = tasks.id
            AND task_selected_labels.deleted_at IS NULL
          ),0)`), "labels_count"]
        ],
        group: ["labels"],
        where: {
          project_id: body.project_id,
          deleted_at: null,
        },
        raw: true,
        order: order,
        offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
        limit: (body.limit == -1) ? totalRecords.length : parseInt(body.limit) || PAGINATION.LIMIT,
      });


      const seen = new Set();
      getColumns = lableCoulumns.filter(item => {
        if (seen.has(item.labels)) {
          return false; // Skip duplicate
        } else {
          seen.add(item.labels);
          return true; // Keep unique
        }
      });



      for(let i in getColumns) {

        let labelIds = (getColumns[i].labels == "No Labels") ? "" : getColumns[i].labels.split(",");
        let getLabelName = await this.Models.TaskLabels.findAll({
          attributes: ["label"],
          where: {
            id: labelIds
          },
          raw: true,
        });
        let getLabel = getLabelName.map(val => val.label);
        let labelsName = (getLabel.length > 0) ? getLabel.toString(",") : "No Labels";
        getColumns[i].name = labelsName;

      }

      key1 = "labels";
      key2 = "labels";
    }

    
  /** --------------------------------------------------------------------------------------------------*/

    // Assecending or Descending orders acc. to Due Date (Due Date) 
    if(body.group.key == 4) {

      let currentDate = moment(new Date());
      let numberOfDays = 8;
      getColumns.push(
        {
        "id": 1,
        "name": "Overdue",
        "column_ids": await this.getDate(-1),
        "sort_order": 1,
        "is_defalut": 0,
        }
      );

      for (let i = 1; i < numberOfDays; i++) {
        let date = moment(currentDate).add((i-1), 'days');
        let dayName;
      
        if (i === 1) {
          dayName = 'Today';
        } else if (i === 2) {
          dayName = 'Tomorrow';
        } else {
          dayName = date.format("dddd");
        }
        getColumns.push({ "id": i+1, "name": dayName, "column_ids": await this.getDate(i-1), "sort_order": i+1, "is_defalut": 0 });
      }

      getColumns.push({
        "id": 9,
        "name": "Future",
        "column_ids": await this.getDate(8),
        "sort_order": 9,
        "is_defalut": 0,
      },
      {
        "id": 10,
        "name": "No due date",
        "column_ids": null,
        "sort_order": 10,
        "is_defalut": 0,
      });
      

      if(body.group.order == 0){

        getColumns.sort((a, b) => a.sort_order - b.sort_order);

      }else {

        getColumns.sort((a, b) => b.sort_order - a.sort_order);

      }

      key1 = "name";
      key2 = "due_date_status";
      totalRecords = getColumns.length;
    }
  /** --------------------------------------------------------------------------------------------------*/
  // With dynamic filter consditions

  let mainOperator;
  let mainConditionObject = [];
  let finalOperator = 0;

  if (body.filter) {

    let filterCondition = await this.applyFilters(body);

    if(finalOperator == 1) {
      mainConditionObject.push({ 
        [mainOperator]: filterCondition
      });
    }else {

      mainConditionObject.push(filterCondition)
     
    }

    if(mainConditionObject.length > 0) {
  
        mainConditionObject.forEach(item => {
          Object.assign(havingCondition, item);
        });
        
    }

  }

  /** --------------------------------------------------------------------------------------------------*/

  // With search text filter tasks
    if (body.search) {
      whereCondition = {
        [Op.or]: [
          { title: { [Op.like]: `%${body.search}%` } },
          { description: { [Op.like]: `%${body.search}%` } },
        ],
        project_id: body.project_id,
        parent_task_id: null,
        deleted_at: null,
      }
    }


  /** --------------------------------------------------------------------------------------------------*/

  // Sorting By Task Title, Status, Assignee, priority, Labels, Due date

    if (body.sort && body.sort.length > 0) {
      // Iterate over the sort array and check each object
      body.sort.forEach(item => {
        // Example conditions based on key and order values
        if (item.key === 1) {
          if(item.order === 0) {
            task_order.push(["title", "ASC"]);
          }else {
            task_order.push(["title", "DESC"]);
          }
        } else if (item.key === 2) {
          if(item.order === 0) {
            task_order.push(["status", "ASC"]);
          }else {
            task_order.push(["status", "DESC"]);
          }
        } else if (item.key === 3) {
          if(item.order === 0) {
            task_order.push([sequelize.literal(`total_assignee ASC`)]);
          }else {
            task_order.push([sequelize.literal(`total_assignee DESC`)]);
          }
        } else if (item.key === 4) {
          if(item.order === 0) {
            task_order.push([sequelize.literal(`priority_value ASC`)]);
          }else {
            task_order.push([sequelize.literal(`priority_value DESC`)]);
          }
        } else if (item.key === 5) {
          if(item.order === 0) {
            task_order.push([sequelize.literal(`labels ASC`)]);
          }else {
            task_order.push([sequelize.literal(`labels DESC`)]);
          }
        } else if (item.key === 6) {
          if(item.order === 0) {
            task_order.push([sequelize.literal(`due_date_time ASC`)]);
          }else {
            task_order.push([sequelize.literal(`due_date_time DESC`)]);
          }
        }
      });
    }


  /** --------------------------------------------------------------------------------------------------*/


    let filteredArray = [];
    if(body.project_column_id !=0) {
      filteredArray = getColumns.filter(item => item.id === body.project_column_id);
    }

    /** Get task when agent login */
    let checkIsToggle = await this.getUserTaskPermission(projectCreator, userDetail.id);
    if (userDetail.role_id != ROLES.CLIENT && checkIsToggle == 1) {

      let getAllSubTaskIds;
      let getTaskIds;
      let getPrivateProjectIds = [];
      let getPrivateTaskIds = [];
      let getAllTaskIds = [];

      let getAssignedUsers = await this.Models.AssignedTaskUsers.findAll({
        attributes:["id", "task_id", "project_id", [sequelize.literal("(SELECT parent_task_id FROM tasks WHERE tasks.id = assigned_task_users.task_id)"), "parent_task_id"],[sequelize.literal("(SELECT is_private FROM projects WHERE projects.id = assigned_task_users.project_id)"), "is_private"]],
        where: {
          project_id: body.project_id,
          user_id: userDetail.id,
          deleted_at: null
        },
        raw: true,
      });

      if (getAssignedUsers.length > 0) {

        getPrivateProjectIds = getAssignedUsers.map(val=> {
          if(val.is_private == 1) {
            return val.project_id;
          }
        });

        if(getPrivateProjectIds.length > 0) {
          let getPrivatetasks = await this.Models.Tasks.findAll({
            attributes: ["id", "parent_task_id", "project_id", "deleted_at"],
            where: {
              deleted_at: null,
              project_id: getPrivateProjectIds
            },
            raw: true
          });
          getPrivateTaskIds =  getPrivatetasks.map(val => val.id);
        }

        getAllTaskIds = getAssignedUsers.map(val => val.parent_task_id ? val.parent_task_id : val.task_id);
      }
      getTaskIds = getPrivateTaskIds.concat(getAllTaskIds);

      if(getTaskIds.length > 0) {
        let getAllSubTasks = await this.Models.Tasks.findAll({
          attributes: ["id", "parent_task_id", "deleted_at"],
          where: {
            deleted_at: null,
            parent_task_id: getTaskIds
          },
          raw: true
        });

        if(getAllSubTasks.length > 0){
          getAllSubTaskIds = getAllSubTasks.map(val => val.parent_task_id);
        }
      }

      let combinedTasksId = getTaskIds.concat(getAllSubTaskIds);
      whereCondition = {
        [Op.or]: [
          {
            id: combinedTasksId
          },
          {
            added_by: userDetail.id
          }
        ],
        ...whereCondition
      };
    };

    
    let getAllTasks= await this.Models.Tasks.findAll({
      attributes: { include: [[sequelize.literal("(SELECT name FROM project_columns WHERE project_columns.id = tasks.project_column_id)"), "project_column_name"], [sequelize.fn('IFNULL', sequelize.col('tasks.priority'), 'No Priority'), 'priority_status'], [sequelize.literal(`CASE
        WHEN tasks.due_date_time IS NULL THEN 'No due date'
        WHEN tasks.due_date_time < NOW() THEN 'Overdue'
        WHEN DATE(tasks.due_date_time) = DATE(NOW()) THEN 'Today'
        WHEN DATE(tasks.due_date_time) = DATE(DATE_ADD(NOW(), INTERVAL 1 DAY)) THEN 'Tomorrow'
        WHEN tasks.due_date_time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 6 DAY) THEN DATE_FORMAT(tasks.due_date_time, '%W') ELSE 'Future' END`), 'due_date_status'],
        [sequelize.literal(`
          CASE 
            WHEN tasks.priority IS NULL THEN 0
            WHEN tasks.priority = 'High' THEN 1
            WHEN tasks.priority = 'Medium' THEN 2
            WHEN tasks.priority = 'Low' THEN 3
            ELSE 4
          END
        `), 'priority_value'],
        [sequelize.literal(`IFNULL((
          SELECT GROUP_CONCAT(user_id ORDER BY user_id ASC SEPARATOR ',')
          FROM assigned_task_users
          WHERE assigned_task_users.task_id = tasks.id
          AND assigned_task_users.deleted_at IS NULL
        ), 'No Assignee')`), "assigned_user_ids"],
        [sequelize.literal(`IFNULL((
          SELECT GROUP_CONCAT(label_id ORDER BY label_id ASC SEPARATOR ',')
          FROM task_selected_labels
          WHERE task_selected_labels.task_id = tasks.id
          AND task_selected_labels.deleted_at IS NULL
        ), 'No Labels')`), "labels"],
        [sequelize.literal(`IFNULL((
          SELECT GROUP_CONCAT(label_id ORDER BY label_id ASC SEPARATOR ',')
          FROM task_selected_labels
          WHERE task_selected_labels.task_id = tasks.id
          AND task_selected_labels.deleted_at IS NULL
        ), 'No Labels')`), "task_label_ids"],[
          sequelize.literal(`(SELECT Count(*) FROM assigned_task_users WHERE assigned_task_users.task_id = tasks.id AND assigned_task_users.deleted_at IS NULL)`), "total_assignee",
        ], [sequelize.literal(`IFNULL((
          SELECT GROUP_CONCAT(user_id ORDER BY user_id ASC SEPARATOR ',')
          FROM assigned_task_users
          WHERE assigned_task_users.task_id = tasks.id
          AND assigned_task_users.deleted_at IS NULL
        ), 'No Assignee')`), "task_assigned_agent"],[sequelize.literal(`CASE WHEN (SELECT defalut_name FROM project_columns WHERE project_columns.id = tasks.project_column_id) = 'completed' THEN 1 ELSE 0 END`), 'is_completed'], [sequelize.literal(`(SELECT name FROM project_columns WHERE project_columns.id = tasks.status AND tasks.deleted_at IS NULL)`), 'status_name'],
        [sequelize.literal(`IFNULL((
          SELECT GROUP_CONCAT(tl.label ORDER BY tl.id ASC SEPARATOR ', ')
          FROM task_selected_labels tsl
          JOIN task_labels tl ON tl.id = tsl.label_id
          WHERE tsl.task_id = tasks.id
          AND tsl.deleted_at IS NULL
          AND tl.deleted_at IS NULL
        ), 'No Labels')`), "task_label_name"]
      ]},
      include: [
        {
          model: this.Models.Tasks,
          attributes: { include: [[sequelize.literal("(SELECT name FROM project_columns WHERE project_columns.id = status)"), 'status_name'], 
          [sequelize.literal(`CASE WHEN (SELECT defalut_name FROM project_columns WHERE project_columns.id = project_column_id) = 'completed' THEN 1 ELSE 0 END`), 'is_completed'],
          ]},
          as: "sub_tasks",
          required: false,
          where: {
            deleted_at: null
          },
          separate: true, // Use separate queries for associated models
          order: [["sort_order", "ASC"]],
          include: [{
            model: this.Models.AssignedTaskUsers,
            as: "assigned_task_users",
            attributes: ["id", "user_id", ["user_id", "agent_id"], "project_id", "task_id",
            [sequelize.literal("(SELECT first_name FROM users WHERE users.id = `assigned_task_users`.`user_id`)"), "first_name"],
                [sequelize.literal("(SELECT last_name FROM users WHERE users.id = `assigned_task_users`.`user_id`)"), "last_name"],
                [sequelize.literal("(SELECT user_image FROM users WHERE users.id = `assigned_task_users`.`user_id`)"), "user_image"]
            ],
            required: false,
            where: {
              deleted_at: null
            }
          },
          {
            model: this.Models.TaskSelectedLabels,
            attributes: ["id", "label_id", "deleted_at", [sequelize.literal("(SELECT label FROM task_labels WHERE task_labels.id = `task_selected_labels`.`label_id`)"), "label"]],
            as: "task_selected_labels",
            where: { deleted_at: null },
            required: false,
          }
        ]
        },
        {
        model: this.Models.AssignedTaskUsers,
        as: "assigned_task_users",
        attributes: ["id", "user_id", ["user_id", "agent_id"], "project_id", "task_id",
        [sequelize.literal("(SELECT first_name FROM users WHERE users.id = `assigned_task_users`.`user_id`)"), "first_name"],
            [sequelize.literal("(SELECT last_name FROM users WHERE users.id = `assigned_task_users`.`user_id`)"), "last_name"],
            [sequelize.literal("(SELECT user_image FROM users WHERE users.id = `assigned_task_users`.`user_id`)"), "user_image"]
        ],
        required: false,
        where: {
          deleted_at: null
        }
      },
      {
        model: this.Models.TaskSelectedLabels,
        attributes: ["id", "label_id", "deleted_at", [sequelize.literal("(SELECT label FROM task_labels WHERE task_labels.id = `task_selected_labels`.`label_id`)"), "label"]],
        as: "task_selected_labels",
        where: { deleted_at: null },
        required: false,
      }],
      where: whereCondition,
      having: havingCondition,
      order: task_order,
    });
    

    let task_offset = (parseInt(body.task_start) == 0) ? 0 : (parseInt(body.task_start) || PAGINATION.START) * (parseInt(body.task_limit) || PAGINATION.LIMIT) || PAGINATION.START;
    let task_limit =  (body.task_limit == -1) ? getAllTasks.length : parseInt(body.task_limit) || PAGINATION.LIMIT;

    const processedTasks = getAllTasks.map(task => {
      const taskData = task.get({ plain: true }); // Convert to plain object
      if (!task.task_selected_labels || task.task_selected_labels.length === 0) {
        taskData.task_selected_labels = [];
      }
      if (!task.assigned_task_users || task.assigned_task_users.length === 0) {
        taskData.assigned_task_users = [];
      }

      if (!task.sub_tasks || task.sub_tasks.length === 0) {
        taskData.sub_tasks = [];
      }
      return taskData;
    });

    let finalResult = await this.getColumnsTaskDynamic( (body.project_column_id !=0) ? filteredArray : getColumns, processedTasks, key1, key2);
    // const paginatedColumns = finalResult.map(column => {
    //   const paginatedTasks = column.tasks.slice(task_offset * task_limit, (task_offset + 1) * task_limit);
    //   return {
    //     ...column,  // Convert to plain object
    //     filtered_tasks: paginatedTasks.length,  
    //     tasks: paginatedTasks
    //   };
    // });
    return { list: finalResult, total_records: (body.project_column_id !=0) ? filteredArray.length : totalRecords, filtered_records: finalResult.length }
  };


  /* Using for project column list in case of filter combined tasks acc. to columns */
  getColumnsTaskDynamic(array1, array2, key1, key2) {
    return array1.map(item1 => {
      // Find matching items in array2 based on the key
      const matchingItems = array2.filter(item2 => item1[key1] === item2[key2]);
      // Add the matching items as a nested array
      return { ...item1, total_tasks: matchingItems.length, filtered_tasks: 0, tasks: matchingItems };
    });
  }


  /* Get Project Completed column id */
  getCompletedColumnOfProject = async (projectId) => {
    return await this.Models.ProjectColumns.findOne({
      where: {
        project_id: projectId,
        defalut_name: PROJECT_DEFAULT_COLUMN.COMPLETED,
        is_defalut: 1,
      },
      raw: true
    });
  }

  /* Get Project To DO column id */
  getToDoColumnOfProject = async (projectId) => {
    return await this.Models.ProjectColumns.findOne({
      where: {
        project_id: projectId,
        defalut_name: PROJECT_DEFAULT_COLUMN.TO_DO,
        is_defalut: 1,
      },
      raw: true
    });
  }

  /* Get Project Filter Drop Down List */
  getFilterDropDownList = async (projectId, key) => {

    let whereCondition = {
      project_id: projectId,
      deleted_at: null
    };

   let getColumns = [];
   
    if(key == 0) {

      getColumns = await this.Models.ProjectColumns.findAll({
        attributes: ["id", "name", ["id", "column"]],
        where: whereCondition,
        raw: true,
      });

    }else if(key == 1) {

      getColumns = await this.Models.AssignedTaskUsers.findAll({
        attributes: ["id", ["user_id", "column"],"project_id", [sequelize.literal("(SELECT concat(first_name, ' ', last_name) FROM users WHERE users.id = assigned_task_users.user_id AND assigned_task_users.deleted_at IS Null)"), "name"],
        ],
        group: ["project_id", "user_id"],
        where: whereCondition,
        raw: true,
      });

    }else if(key == 2){

      let priorityColumns = await this.Models.Tasks.findAll({
        attributes: ["id",
          [sequelize.fn('IFNULL', sequelize.col('priority'), 'No Priority'), 'name'],
          [sequelize.fn('IFNULL', sequelize.col('priority'), 'No Priority'), 'column'],
        ],
        group: ["priority"],
        where: whereCondition,
        raw: true,
      });

      const seen = new Set();
      getColumns = priorityColumns.filter(item => {
        if (seen.has(item.name)) {
          return false; // Skip duplicate
        } else {
          seen.add(item.name);
          return true; // Keep unique
        }
      });

    }else if(key == 3) {

      let lableCoulumns = await this.Models.TaskLabels.findAll({
        attributes: ["id", ["id", "column"], ["label", "name"]],
        where: {
          project_id: projectId,
          deleted_at: null
        },
        raw: true,
      });

      const seen = new Set();
      getColumns = lableCoulumns.filter(item => {
        if (seen.has(item.name)) {
          return false; // Skip duplicate
        } else {
          seen.add(item.name);
          return true; // Keep unique
        }
      });
      
    }else if(key == 4) {

      let currentDate = moment(new Date());
      let numberOfDays = 8;
      
      getColumns.push(
        {
        "id": 1,
        "name": "Overdue",
        "column": "Overdue",
        "sort_order": 1
        }
      );

      for (let i = 1; i < numberOfDays; i++) {
        let date = moment(currentDate).add((i-1), 'days');
        let dayName;
      
        if (i === 1) {
          dayName = 'Today';
        } else if (i === 2) {
          dayName = 'Tomorrow';
        } else {
          dayName = date.format("dddd");
        }
        getColumns.push({ "id": i+1, "name": dayName, "column": dayName, "sort_order": i+1 });
      }

      getColumns.push({
        "id": 9,
        "name": "Future",
        "column": "Future",
        "sort_order": 9,
      },
      {
        "id": 10,
        "name": "No due date",
        "column": "No due date",
        "sort_order": 10,
      });

    }else {

      getColumns = await this.Models.Tasks.findAll({
        attributes: ["id", ["added_by", "column"], [sequelize.literal("(SELECT concat(first_name, ' ', last_name) FROM users WHERE users.id = tasks.added_by AND users.deleted_at IS Null)"), "name"],
        ],
        group: ["added_by"],
        where: whereCondition,
        raw: true,
      });

    }

    return { list: getColumns, total_records:getColumns.length }
 
  }

  getDate = async (days) => {
    return moment().add(days, 'days').format('YYYY-MM-DD 11:59:00');
  };

  getAssignedUserTaskId = async (projectId, userIds, getFilteredTaskId) => {

    let getAssignedUsers = await this.Models.AssignedTaskUsers.findAll({
      where: {
        project_id: projectId,
        user_id: userIds,
        task_id: getFilteredTaskId,
        deleted_at: null
      },
      raw: true,
    });
    let getTaskIds = getAssignedUsers.map(val=> val.task_id);
    return getTaskIds;
  }

  getNotAssignedUserTaskId = async (projectId, userIds) => {

    let getNotAssignedUser = await this.Models.AssignedTaskUsers.findAll({
      attributes: {include: [[sequelize.literal(`
        (
          SELECT COUNT(*) 
          FROM assigned_task_users AS atu 
          WHERE atu.task_id = assigned_task_users.task_id
          AND atu.user_id IN (${userIds.join(',')}) 
          AND atu.deleted_at IS NULL
        )`), 'user_count' // Subquery to count users per task_id excluding specific userIds
      ]]},
      where: {
        project_id: projectId,
        deleted_at: null,
        user_id: {
            [Op.notIn]: userIds
        },
      },
      having: sequelize.literal('user_count = 0'),
      raw: true
    });

    let getNotAssignedTaskId = getNotAssignedUser.map(val=> val.task_id);

    let getAssignedUsers = await this.Models.Tasks.findAll({
      attributes: ["id", "project_id", "deleted_at", [
        sequelize.literal(`(SELECT Count(*) FROM assigned_task_users WHERE assigned_task_users.task_id = tasks.id AND assigned_task_users.deleted_at IS NULL)`), "total_assignee",
      ]],
      where: {
        project_id: projectId,
        deleted_at: null,
        [Op.or]: [
          sequelize.literal(`(SELECT Count(*) FROM assigned_task_users WHERE assigned_task_users.task_id = tasks.id AND assigned_task_users.deleted_at IS NULL) = 0`),
          {
            id: getNotAssignedTaskId,
          }
        ]
      },
    });

    let getTaskIds = getAssignedUsers.map(val=> val.id);
    return getTaskIds;
  }


  getSelectedLabelTaskId = async (projectId, labelIds, getAllFilteredTaskId) => {
    let getSelectedLabels = await this.Models.TaskSelectedLabels.findAll({
      where: {
        project_id: projectId,
        label_id: labelIds,
        task_id: getAllFilteredTaskId,
        deleted_at: null
      },
      raw: true,
    });
    let getTaskIds = getSelectedLabels.map(val=> val.task_id);
    return getTaskIds;
  };

  getNotSelectedLabelsTaskIds = async (projectId, labelIds) => {

    let getNotSelectedLabels = await this.Models.TaskSelectedLabels.findAll({
      where: {
        project_id: projectId,
        deleted_at: null,
        label_id: {
            [Op.notIn]: labelIds
        },
      },
      raw: true
    });

    let getNotSelectedLabelId = getNotSelectedLabels.map(val=> val.task_id);
    let getSelectedLabels = await this.Models.Tasks.findAll({
      attributes: ["id", "project_id", "deleted_at", [
        sequelize.literal(`(SELECT Count(*) FROM task_selected_labels WHERE task_selected_labels.task_id = tasks.id AND task_selected_labels.deleted_at IS NULL)`), "total_labels",
      ]],
      where: {
        project_id: projectId,
        deleted_at: null,
        [Op.or]: [
          sequelize.literal(`(SELECT Count(*) FROM task_selected_labels WHERE task_selected_labels.task_id = tasks.id AND task_selected_labels.deleted_at IS NULL) = 0`),
          {
            id: {
              [Op.notIn]: getNotSelectedLabelId
            }
          }
        ]
      },
    });

    // let getSelectedLabels = await this.Models.Tasks.findAll({
    //   attributes: ["id", "project_id", "deleted_at", [
    //     sequelize.literal(`(SELECT Count(*) FROM task_selected_labels WHERE task_selected_labels.task_id = tasks.id AND task_selected_labels.deleted_at IS NULL)`), "total_labels",
    //   ]],
    //   where: {
    //     project_id: projectId,
    //     deleted_at: null,
    //     [Op.or]: [
    //       sequelize.literal(`(SELECT Count(*) FROM task_selected_labels WHERE task_selected_labels.task_id = tasks.id AND task_selected_labels.deleted_at IS NULL) = 0`),
    //       {
    //         '$task_selected_labels.label_id$': {
    //           [Op.notIn]: labelIds
    //         }
    //       }
    //     ]
    //   },
    //   include: [{
    //     model: this.Models.TaskSelectedLabels,
    //     as: "task_selected_labels",
    //     where: {
    //       // label_id: {
    //       //   [Op.notIn]: labelIds
    //       // },
    //       deleted_at: null
    //     },
    //     required: true
    //   }],
    // });
    let getTaskIds = getSelectedLabels.map(val=> val.id);
    return getTaskIds;
  };

  getNotSelectedLabelTaskId = async (projectId, labelIds) => {
    let getSelectedLabels = await this.Models.TaskSelectedLabels.findAll({
      where: {
        project_id: projectId,
        label_id: {
          [Op.notIn]:labelIds
        },
        deleted_at: null
      },
      raw: true,
    });
    let getTaskIds = getSelectedLabels.map(val=> val.task_id);
    return getTaskIds;
  };

  getTaskIdNotAssignedUser = async (projectId , type) => {

    let havingCondition = {
      total_assignee: 0
    }
    if(type == 1){
      havingCondition = {
        total_assignee: {
          [Op.ne]: 0
        }
      }
    }

    let getTaskIdNotAssignedUser= await this.Models.Tasks.findAll({
      attributes: ["id", "project_id", "deleted_at", [
        sequelize.literal(`(SELECT Count(*) FROM assigned_task_users WHERE assigned_task_users.task_id = tasks.id AND assigned_task_users.deleted_at IS NULL)`), "total_assignee",
      ]],
      where: {
        project_id: projectId,
        deleted_at: null
      },
      having: havingCondition,
      raw: true,
    });

    let getTaskIds = getTaskIdNotAssignedUser.map(val=> val.id);

    return getTaskIds;
  }


  getTaskIdNotSelectedLabel = async (projectId, type) => {

    let havingCondition = {
      total_labels: 0
    }
    if(type == 1){
      havingCondition = {
        total_labels: {
          [Op.ne]: 0
        }
      }
    }

    let getTaskIdNotSelectedLabel= await this.Models.Tasks.findAll({
      attributes: ["id", "project_id", "deleted_at", [
        sequelize.literal(`(SELECT Count(*) FROM task_selected_labels WHERE task_selected_labels.task_id = tasks.id AND task_selected_labels.deleted_at IS NULL)`), "total_labels",
      ]],
      where: {
        project_id: projectId,
        deleted_at: null
      },
      having: havingCondition,
      raw: true,
    });
    let getTaskIds = getTaskIdNotSelectedLabel.map(val=> val.id);
    return getTaskIds;
  }



applyFilters = async (body) => {
  let filterCondition = {};
  let conditionObject = [];

  let innerOperatorArray = [];

  let outerMainOperator = Op.or;

  for (const mainCondition of body.filter) {


    let innerOperator = Op.or;
    // Determine the main operator (AND/OR) for the conditions
    let mainOperator = (mainCondition.applyOp == "OR") ? Op.or : Op.and;
    outerMainOperator = (mainCondition.applyOp == "OR") ? Op.or : Op.and;

    let innerConditionObject = {};
    let newConditionObject = [];
    
    // Iterate over each condition
    for (const condition of mainCondition.condition) {
      let filterKey;
      let conditionValue = condition.value;
      let mainOp = Op.in;


      switch (condition.key) {
        case 1:
          filterKey = "id";
          break;
        case 2:
          filterKey = "priority_status";
          break;
        case 3:
          filterKey = "id";
          break;
        case 4:
          filterKey = "due_date_status";
          break;
        case 5:
          filterKey = "added_by";
          break;
        default:
          filterKey = "status";
      }


      let getAllFilteredTaskId = await this.getFilteredTaskId(body.project_id, mainCondition.condition);

      // Special handling for specific filter keys
      if (filterKey === "id") {

          if (condition.key == 1 ) {

            if (conditionValue.join(', ') == "No Assignee") {
          
              conditionValue = {
                [Op.in]: await this.getTaskIdNotAssignedUser(body.project_id, 0),
              };
              
            } else {

              let userAssigned = conditionValue.map(ele => parseInt(ele));

              if (condition.op == 0) {

                conditionValue = {
                  [Op.in]: await this.getAssignedUserTaskId(body.project_id, userAssigned, getAllFilteredTaskId),
                };

              }else if (condition.op == 1){
                conditionValue = {
                  [Op.in]: await this.getNotAssignedUserTaskId(body.project_id, userAssigned),
                };

              }

            }

          } else if (condition.key == 3) {

            if (conditionValue.join(', ') === "No Labels") {
              // conditionValue = "No Labels";
              conditionValue = {
                [Op.in]: await this.getTaskIdNotSelectedLabel(body.project_id, 0),
              };
            } else {
              let valueInNum = conditionValue.map(ele => parseInt(ele));
              if (condition.op === 1) {
                conditionValue = { [Op.in]: await this.getNotSelectedLabelsTaskIdsWithOp(body.project_id, valueInNum) };
              }else {
                conditionValue = { [Op.in]: await this.getSelectedLabelTaskId(body.project_id, valueInNum, getAllFilteredTaskId) };
              }
            }
          }
      } else {

        if (condition.op === 0) {
          mainOp = Op.in;
        } else if (condition.op === 1) {
          mainOp = Op.notIn;
        }
      }

      // Add condition to the list based on operator
      if (condition.applyOp != "") {
        const operator = (condition.applyOp == "OR") ? Op.or : Op.and;
        innerOperator = (condition.applyOp == "OR") ? Op.or : Op.and;

        if (condition.op === 0) {

          if(condition.key == 1 || condition.key == 2 || condition.key == 3) {
 
            newConditionObject.push({ [filterKey]: conditionValue });

          }else {
            newConditionObject.push({ [filterKey]: { [mainOp]: conditionValue } });

          }


        } else if (condition.op === 1) {

          newConditionObject.push({ [filterKey]: { [mainOp]: conditionValue } });


        } else if (condition.op === 2) {

          if(condition.key == 1) {
            conditionValue = {
              [Op.in]: await this.getTaskIdNotAssignedUser(body.project_id, 1),
            };
      
            newConditionObject.push({
              [filterKey]: conditionValue
            });
            
          } else if(condition.key == 3) {
            conditionValue = {
              [Op.in]: await this.getTaskIdNotSelectedLabel(body.project_id, 1),
            };
       
            newConditionObject.push({
              [filterKey]: conditionValue
            });
            
          }else {

            newConditionObject.push({
              [filterKey]: {
                [Op.or]: [{ [Op.ne]: null }, { [Op.ne]: "" }]
              }
            });
          }

        } else if (condition.op === 3) {

          if(condition.key == 1) {
            conditionValue = {
              [Op.in]: await this.getTaskIdNotAssignedUser(body.project_id, 0),
            };
          
            newConditionObject.push({
              [filterKey]: conditionValue
            });

          } else if(condition.key == 3) {

            conditionValue = {
              [Op.in]: await this.getTaskIdNotSelectedLabel(body.project_id, 0),
            };
         
            newConditionObject.push({
              [filterKey]: conditionValue
            });

          }else {
            newConditionObject.push({ [filterKey]: null });
          }

        }

        filterCondition = { [mainOperator]:  { [operator]:  newConditionObject } };

      } else {


        if (condition.op === 0) {

          if(condition.key == 2 || condition.key == 4) {

            newConditionObject.push({ [filterKey]: { [mainOp]: conditionValue } });

          }else {

            newConditionObject.push({ [filterKey]: conditionValue });
            
          }

        } else if (condition.op === 1) {

          if(condition.key == 0 || condition.key == 2 || condition.key == 4 || condition.key == 5) {

            newConditionObject.push({ [filterKey]: { [mainOp]: conditionValue } });

            
          }else {
            newConditionObject.push({ [filterKey]: conditionValue });

          }


        } else if (condition.op === 2) {

            if(condition.key == 1) {

              conditionValue = {
                [Op.in]: await this.getTaskIdNotAssignedUser(body.project_id, 1),
              };
              newConditionObject.push({
                [filterKey]: conditionValue
              });

            } else if(condition.key == 3) {

              conditionValue = {
                [Op.in]: await this.getTaskIdNotSelectedLabel(body.project_id, 1),
              };
              newConditionObject.push({
                [filterKey]: conditionValue
              });

            }else if(condition.key == 2){

                conditionValue = "No Priority";
                newConditionObject.push({
                  [filterKey]: { 
                    [Op.ne]: conditionValue 
                  }
                });

    
            }else if(condition.key == 4){
    
                conditionValue = "No due date";
                newConditionObject.push({
                  [filterKey]: { 
                    [Op.ne]: conditionValue 
                  }
                });

            } else {
              newConditionObject.push({
                [filterKey]: {
                  [Op.or]: [{ [Op.ne]: null }, { [Op.ne]: "" }]
                }
              });
              
            }

        } else if (condition.op === 3) {

          if(condition.key == 1) {
            conditionValue = {
              [Op.in]: await this.getTaskIdNotAssignedUser(body.project_id, 0),
            };

            newConditionObject.push({
              [filterKey]: conditionValue
            });
          } else if(condition.key == 3) {

            conditionValue = {
              [Op.in]: await this.getTaskIdNotSelectedLabel(body.project_id, 0),
            };
            newConditionObject.push({
              [filterKey]: conditionValue
            });

          }else if(condition.key == 2){

            conditionValue = "No Priority";
            newConditionObject.push({
              [filterKey]: conditionValue
            });

            
          }else if(condition.key == 4){

            conditionValue = "No due date";
            newConditionObject.push({
              [filterKey]: conditionValue
            });

          }else {
            newConditionObject.push({ [filterKey]: null });
          }

        }
        filterCondition = { [mainOperator]: newConditionObject };
      }

    }

    innerOperatorArray.push({ [innerOperator]: newConditionObject});

  }

  if(innerOperatorArray && innerOperatorArray.length > 0) {
    filterCondition = { [outerMainOperator]: innerOperatorArray };
  }else {
    filterCondition = {};
  }
  return filterCondition;
}

  /** get project whiteboardList */
  getProjectWhiteboardList = async (projectId) => {
    return await this.Models.ProjectWhiteboard.findAll({
      where: {
        project_id: projectId,
        deleted_at: null
      },
      raw: true,
      order: [["sort_order", "ASC"]],
    });
  };

  /** get project whiteboard */
  findProjectWhiteboard = async (whiteBoardId) => {
    return await this.Models.ProjectWhiteboard.findOne({
      where: {
        id: whiteBoardId,
        deleted_at: null
      },
      raw: true
    })
  };


  /** get project whiteboard By Menu ID */
  findProjectWhiteboardByMenuId = async (menuId, userId) => {
    return await this.Models.ProjectWhiteboard.findOne({
      where: {
        project_menu_id: menuId,
        deleted_at: null,
        // user_id: userId
      },
      raw: true
    })
  };


  /** get project document list */
  getProjectDocumentList = async (projectId) => {
    return await this.Models.ProjectDocument.findAll({
      where: {
        project_id: projectId,
        deleted_at: null
      },
      order: [["sort_order", "ASC"]],
      raw: true
    });
  };



  /** sort order of Project Doc Or Board*/
  sortProjectDocOrBoard = async (projectId, columnIds, type) => {
    let model = this.Models.ProjectDocument;
    if(type == 1) {
      model = this.Models.ProjectWhiteboard;
    }
    for (let i in columnIds) {
      await model.update({
        sort_order: +i + 1
      }, {
        where: {
          project_id: projectId,
          id: columnIds[i],
          deleted_at: null
        },
      });
    }
    return true
  };


  /** sort order of Projects*/
  sortProjectDragDrop = async (projectIds, userId) => {
    for (let i in projectIds) {
      await this.Models.Projects.update({
        sort_order: +i + 1
      }, {
        where: {
          id: projectIds[i],
          user_id: userId,
          deleted_at: null
        },
      });
    }
    return true
  };


  /** sort order of Project Menus*/
  sortProjectMenuDragDrop = async (projectId, menuIds) => {
    for (let i in menuIds) {
      await this.Models.ProjectMenu.update({
        sort_order: +i + 1
      }, {
        where: {
          id: menuIds[i],
          deleted_at: null
        },
      });
    }
    return true
  };


  /** get user tasks permission */
  getUserTaskPermission = async (clientId, userId) => {
    let checkPermission = await this.Models.UserTaskPermissions.findOne({
      where: {
        client_id: clientId,
        user_id: userId,
        deleted_at: null
      },
      raw: true
    });
    let is_toggle = 0;
    if(checkPermission && checkPermission.is_toggle == 1){
      is_toggle = 1;
    }else if(checkPermission && checkPermission.is_toggle == 0){
      is_toggle = 0;
    }
    return is_toggle;
  };



/** create Default Project Task Labels */
  createDefaultProjectTaskLabels = async (projectId, userId) => {
    let projectTasklabels = [
      {
        user_id: userId,
        project_id: projectId,
        label: "Important Task",
        is_default: 1,
      },
      {
        user_id: userId,
        project_id: projectId,
        label: "High Priority",
        is_default: 1,
      },
      {
        user_id: userId,
        project_id: projectId,
        label: "Medium Priority",
        deleted_at: null,
        is_default: 1,
      },
      {
        user_id: userId,
        project_id: projectId,
        label: "Responsive",
        is_default: 1,
      }];
    return await this.Models.TaskLabels.bulkCreate(projectTasklabels);
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


  /** get project menu detail by projectId And Menu*/
  getProjectMenuByProjectIdAndMenu = async (projectId, menu) => {
    return await this.Models.ProjectMenu.findOne({
      where : {
        project_id: projectId,
        menu: menu,
        deleted_at: null,
      },
      raw: true,
    });
  };


  /** update project menu by projectId And Menu*/
  updateProjectMenuByProjectIdAndMenu = async (data, projectId, menu) => {
    return await this.Models.ProjectMenu.update(data, {
      where: { 
        project_id: projectId,
        menu: menu 
      } 
    });
  };

  /** create Project Menu*/

  createProjectMenu = async (data) => {
    return await this.Models.ProjectMenu.create(data);
  };


   /** get last menu order by projectId*/
   getMenuLastOrderByProjectId= async (projectId) => {
    return await this.Models.ProjectMenu.findOne({
      attributes: ["id", "project_id", "sort_order", "deleted_at"],
      where : {
        project_id: projectId,
        deleted_at: null,
      },
      order: [["sort_order", "DESC"]],
      raw: true,
    });
  };



  /** get project menu by menu id And Menu*/
  getProjectMenuByMenuIdAndMenu = async (menuId, menu) => {
    return await this.Models.ProjectMenu.findOne({
      where : {
        id: menuId,
        menu: menu,
        deleted_at: null,
      },
      raw: true,
    });
  };


  /** Get project document by menu id */
  getProjectDocumentByMenuId = async (menuId) => {
    return await this.Models.ProjectDocument.findOne({
      where: {
        project_menu_id: menuId,
        deleted_at: null
      },
      raw: true
    })
  };

  /** Get project whiteboard by menu id */
  getProjectWhiteBoardByMenuId = async (menuId) => {
    return await this.Models.ProjectWhiteboard.findOne({
      where: {
        project_menu_id: menuId,
        deleted_at: null
      },
      raw: true
    })
  };


  /** save project filters by project id and user id */
  saveProjectFilters = async (data) => {
    return await this.Models.ProjectFilters.create(data);
  };

  /** Get Project Filters ByProject Or UserId */
  getProjectFiltersByProjectOrUserId = async (projectId, userId, isView) => {
    return await this.Models.ProjectFilters.findOne({
      attributes: ["id", "search", "group", "sort", "is_filter", "is_view", "deleted_at"],
      where: {
        project_id: projectId,
        user_id: userId,
        // is_view: isView,
        is_filter: 0
        // deleted_at: null
      },
      raw: true
    })
  };


  /** Get Project group and sort By Project Or UserId */
  getProjectGroupSortByProjectOrUserId = async (projectId, userId, isView) => {
    return await this.Models.ProjectFilters.findOne({
      attributes: ["id", "search", "group", "sort", "is_filter", "is_view", "deleted_at"],
      where: {
        project_id: projectId,
        user_id: userId,
        is_view: isView,
        is_filter: 0
      },
      raw: true
    })
  };

  /** update project filters by project id and user id */
  updateProjectFilters = async (data, projectId, userId, isView) => {
    return await this.Models.ProjectFilters.update(data, {
      where: {
        project_id: projectId,
        user_id: userId,
        is_view: isView,
        is_filter: 0
      }
    });
  };

  findUsersById = async (agent_id) => {
    return await this.Models.Users.findOne({
      where: {
        id: agent_id,
        deleted_at: null
      },
      raw: true
    })
  };


  updateTaskAssignedUsers = async (data, projectId) => {
    return await this.Models.AssignedTaskUsers.update(
      data, 
      {
      where: {
        project_id: projectId,
        task_id: null
      }
    });
  };

  /** Get project filter list */
  getSavedFilterList = async (body, userId, query) => {

    let whereCondition = {
      project_id: +body.project_id,
      // is_view: +body.is_view,
      user_id: userId,
      deleted_at: null,
      is_filter: 1,
      name: {
        [Op.ne]: null
      }
    };

    if (query.search) {
      whereCondition = {
        [Op.or]: [
          { name: { [Op.like]: `%${query.search}%` } },
        ],
        ...whereCondition,
      }
    }

    let getProjectFilter =  await this.Models.ProjectFilters.findAll({
      attributes: ["id", "name"],
      where : whereCondition,
      order: [
        ["id", "DESC"],
      ],
      raw: true,
    });

    return getProjectFilter;
  };



  /** Get Project Filters By filter id */
  getProjectFiltersByFilterId = async (filterId) => {
    return await this.Models.ProjectFilters.findOne({
      where: {
        id: filterId,
        deleted_at: null
      },
      raw: true
    })
  };

  /** update Project Filters By filter id */
  updateFiltersByFilterId = async (data, filterId) => {
    return await this.Models.ProjectFilters.update(data,{
      where: {
        id: filterId,
      },
    });
  };



  updateWhiteboardData = async (data, projectMenuId,  user_id, projectId) => {
    return await this.Models.ProjectWhiteboard.update(data, { 
      where: { 
        project_menu_id: projectMenuId,
        project_id: projectId,
        // user_id: user_id 
      } });
  };



  getNotSelectedLabelsTaskIdsWithOp = async (projectId, labelIds) => {

    let getNotSelectedLabels = await this.Models.TaskLabels.findAll({
      where: {
        project_id: projectId,
        deleted_at: null,
        id: {
            [Op.notIn]: labelIds
        },
      },
      raw: true
    });

    let getNotSelectedLabelId = getNotSelectedLabels.map(val=> val.id);

    let getTaskIdsOfSelectedLabel = await this.Models.TaskSelectedLabels.findAll({
      where: {
        label_id: getNotSelectedLabelId,
        project_id: projectId,
        deleted_at: null,
      },
      raw: true
    });

    let getSelectedLabelTaskId = getTaskIdsOfSelectedLabel.map(val=> val.task_id);

    let getSelectedLabels = await this.Models.Tasks.findAll({
      attributes: ["id", "project_id", "deleted_at", [
        sequelize.literal(`(SELECT Count(*) FROM task_selected_labels WHERE task_selected_labels.task_id = tasks.id AND task_selected_labels.deleted_at IS NULL)`), "total_labels",
      ],
      [sequelize.literal(`
        (
          SELECT COUNT(*) 
          FROM task_selected_labels AS tsk 
          WHERE tsk.task_id = tasks.id
          AND tsk.label_id IN (${labelIds.join(',')}) 
          AND tsk.deleted_at IS NULL
        )`), 'label_count' // Subquery to count users per task_id excluding specific userIds
      ],
    ],
      where: {
        project_id: projectId,
        deleted_at: null,
        [Op.or]: [
          sequelize.literal(`(SELECT Count(*) FROM task_selected_labels WHERE task_selected_labels.task_id = tasks.id AND task_selected_labels.deleted_at IS NULL) = 0`),
          {
            id: getSelectedLabelTaskId
          }
        ]
      },
      having: sequelize.literal('label_count = 0'),
    });

    let getTaskIds = getSelectedLabels.map(val=> val.id);
    return getTaskIds;
  };



  getFilteredTaskId = async (projectId, condition) => {
    let whereCondition = [];
    let taskWhere = {
      deleted_at: null,
      project_id: projectId,
    }
    if(condition.length > 0) {
  
      for(let i in condition) {
        let filterKey;

        if(condition[i].key == 2) {
          filterKey = "priority_status";
        }else if(condition[i].key == 4) {
          filterKey = "due_date_status";
        }else if(condition[i].key == 5) {
          filterKey = "added_by";
        }else if(condition[i].key == 0) {
          filterKey = "status";
        }
  
        if(filterKey != undefined) {
  
          if(condition[i].op == 0) {
            whereCondition.push({
              [filterKey]: {
                [Op.in]: condition[i].value
              }
            });
          }else if(condition[i].op == 1) {
            whereCondition.push({
              [filterKey]: {
                [Op.notIn]: condition[i].value
              }
            });
          }else if(condition[i].op == 2) {
            whereCondition.push({
              [filterKey]: {
                [Op.ne]: null
              }
            });
          }else {
            whereCondition.push({
              [filterKey]: {
                [Op.eq]: null
              }
            });
          }
        }
  
      };

      if(whereCondition.length > 0) {
        whereCondition.forEach(item => {
          Object.assign(taskWhere, item);
        });
      }
    }

    let getTasks = await this.Models.Tasks.findAll({
      attributes: ["id", "project_id", "added_by", "status", "priority", "due_date_time", "deleted_at", [sequelize.fn('IFNULL', sequelize.col('tasks.priority'), 'No Priority'), 'priority_status'], [sequelize.literal(`CASE
        WHEN tasks.due_date_time IS NULL THEN 'No due date'
        WHEN tasks.due_date_time < NOW() THEN 'Overdue'
        WHEN DATE(tasks.due_date_time) = DATE(NOW()) THEN 'Today'
        WHEN DATE(tasks.due_date_time) = DATE(DATE_ADD(NOW(), INTERVAL 1 DAY)) THEN 'Tomorrow'
        WHEN tasks.due_date_time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 6 DAY) THEN DATE_FORMAT(tasks.due_date_time, '%W') ELSE 'Future' END`), 'due_date_status']
      ],
      having: taskWhere,
      raw: true,
    });
    let getAllTaskIds = getTasks.map(val=> val.id);
    return getAllTaskIds;
  };

  /** get recent activities */
  getRecentActivities = async (clientId) => {
    return await this.Models.RecentActivities.findOne({
      where: {
        client_id: clientId
      },
      order: [["id", "DESC"]],
      raw: true
    });
  };

  /** create recent activities */
  createRecentActivities = async (data) => {
    return await this.Models.RecentActivities.create(data);
  };
  

}
