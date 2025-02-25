import sequelize from 'sequelize';
const Op = sequelize.Op;
import { PAGINATION, PRODUCT_TYPE, PROJECT_DEFAULT_COLUMN, RESPONSE_CODES, ROLES, SLACK_NOTIFICATION_TYPE } from '../../../config/constants';
import path from "path";
import moment from "moment";
import { successResponse, errorResponse } from "../../../config/responseHelper";
import ProjectServices from "../Project/project.services";
import { sendSlackNotification } from "../helpers/commonFunction";
export default class Task {
  async init(db) {
    this.Models = db.models;
    this.ProjectServices = new ProjectServices();
    this.Models = db.models;
    await this.ProjectServices.init(db);
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

  /** Get client by client Id */
  findClientById = async (clientId) => {
    return this.Models.Users.findOne({
      where: {
        id: clientId,
        role_id: ROLES.CLIENT,
        deleted_at: null
      },
      raw: true
    })
  }
  

/** Get project by project Id */
  getProjectByProjectId = async (projectId) => {
    let getProject =  await this.Models.Projects.findOne({
      where: {
        id: projectId,
        deleted_at: null
      },
      raw: true
    });
    return getProject;
  }

/** Get project by project Id and User Id*/
  findProjectById = async (projectId, userId) => {
    let getProject =  await this.Models.Projects.findOne({
      where: {
        id: projectId,
        // user_id: userId,
        deleted_at: null
      },
      raw: true
    });
    return getProject;
  }


  findProjectColumnById = async (projectID, columnId) => {
    return await this.Models.ProjectColumns.findOne({
      where: {
        project_id : projectID,
        id: columnId,
        deleted_at: null
      },
    })
  }

  findColumnById = async (columnId) => {
    return await this.Models.ProjectColumns.findOne({
      where: {
        id: columnId,
        deleted_at: null
      },
      raw: true
    })
  }

  createTask = async (data) => {
    await this.Models.Tasks.create(data)
  }

  findAgentById = async (taskCreated, agent_id) => {
    return this.Models.AssignedTaskUsers.findOne({
      where: {
        task_id: taskCreated.id,
        project_id: taskCreated.project_id,
        user_id: agent_id,
        deleted_at: null
      },
      raw: true
    })
  }

  findAgentsById = async (agent_id) => {
    return await this.Models.Users.findOne({
      where: {
        id: agent_id,
        // role_id: ROLES.AGENT
        deleted_at: null
      },
      raw: true
    })
  }

  updateTaskDetails = async (data, taskId) => {
    return await this.Models.Tasks.update(
      data, {
      where: {
        id: taskId,
      }
    }
    )
  }

  taskFiles = async (files, data) => {
    let taskAttachment = [];
    if (files.length > 0) {
      for (const i in files) {
        taskAttachment.push({
          added_by: data.added_by,
          task_id: data.task_id,
          project_id : data.project_id,
          file: files[i].file_key,
        });
      }
      return await this.Models.TaskFiles.bulkCreate(taskAttachment);
    }
  };



  /** get all task list with pagination and search filter and total count*/
  getTaskList = async (body) => {

    let whereCondition = {
      project_id: body.project_id,
      parent_task_id: null,
      deleted_at: null
    };

    if (body.search) {
      whereCondition = {
        [Op.or]: [
          { title: { [Op.like]: `%${body.search}%` } },
        ],
        project_id: body.project_id,
        parent_task_id: null,
        deleted_at: null
      }
    }

    if(body.type ==1) {
      whereCondition.due_date_time = {
        [Op.ne]: null
      }
    };


    let havingCondition = {
      is_completed: 0
    };
    let mainOperator;
    let mainConditionObject = [];
    let finalOperator = 0;

    let saved_filter = null;
    let saved_group = null;
    let saved_sort = body.sort;

    let updateGroupSort = {};
    switch (true) {
      case (body.is_filter_save == 1 && body.sort.length == 0 && body.search == ""):
        updateGroupSort = {
          deleted_at: moment(new Date).unix(),
        };
        // getColumnslist.saved_sort_and_group = null;
        break;
    
      case (body.is_filter_save == 1 && body.search == ""):
        updateGroupSort = {
          search: "",
        };
        break;
    
      case (body.is_filter_save == 1 && body.sort.length == 0):
        updateGroupSort = {
          sort: "",
        };
        break;
    
      default:
        // No action needed, updateGroupSort will remain an empty object
        break;
    }

    console.log(updateGroupSort, "===updateGroupSort======")
    await this.updateProjectFilters(updateGroupSort, body.project_id, body.user_id, body.is_view);

    if(body.filter_id && body.filter_id !=0) {
      let getFilters = await this.getProjectFiltersByFilterId(body.filter_id);
      if(getFilters) {
        body.filter = (getFilters.filter !="") ? JSON.parse(getFilters.filter) : [];
      }
    }

    let getSortAndSearch = await this.getProjectGroupSortByProjectOrUserId(body.project_id, body.user_id, body.is_view);
    if(getSortAndSearch && getSortAndSearch.deleted_at == null) {
      if(body.search && body.search == "") {
        body.search = (getSortAndSearch.search !="") ? JSON.parse(getSortAndSearch.search) : "";
      }
      if(body.sort && body.sort.length == 0) {
        body.sort = (getSortAndSearch.sort !="") ? JSON.parse(getSortAndSearch.sort) : [];
      }
    }

    if (body.filter) {
  
      let filterCondition = await this.ProjectServices.applyFilters(body);
  
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

    let task_order = [
        [
          { model: this.Models.Tasks, as: "sub_tasks" },
          "sort_order",
          "ASC",
        ],
    ];
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
            task_order.push([sequelize.literal(`selected_labels ASC`)]);
          }else {
            task_order.push([sequelize.literal(`selected_labels DESC`)]);
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



    if((body.is_filter_save && body.is_filter_save == 1) && body.filter.length > 0) {
      let filterData = {
        name: body.filter_name,
        project_id: body.project_id,
        user_id: body.user_id,
        filter: (body.filter !="" || body.filter.length > 0) ? JSON.stringify(body.filter): "",
        is_view: body.is_view,
        deleted_at: null,
        is_filter: 1
      };

      if(body.filter_name !="") {
        await this.saveProjectFilters(filterData);
      }
    }

    if((body.is_filter_save && body.is_filter_save == 1) && (body.sort.length > 0 || body.search !="")) {
      let filterGroupData = {
        project_id: body.project_id,
        user_id: body.user_id,
        search: body.search,
        sort: (body.sort !="" || body.sort.length > 0) ? JSON.stringify(body.sort): "",                                       
        is_view: body.is_view,
        deleted_at: null,
        is_filter: 0
      };
      let checkFilterExist = await this.getProjectGroupSortByProjectOrUserId(body.project_id, body.user_id, body.is_view);
      if(!checkFilterExist) {
        await this.saveProjectFilters(filterGroupData);
      }else {
        await this.updateProjectFilters(filterGroupData, body.project_id, body.user_id, body.is_view);
      }
    }


    if(body.filter_id && body.filter_id !=0) {
      let getFilterExist = await this.getProjectFiltersByFilterId(body.filter_id);
        if(getFilterExist) {
          getFilterExist.filter = (body.filter && body.filter.length > 0) ? body.filter : (getFilterExist.filter !="") ? JSON.parse(getFilterExist.filter) : null;
          saved_filter = getFilterExist.filter;
        }
    }
    let getSortExist = await this.getProjectGroupSortByProjectOrUserId(body.project_id, body.user_id, body.is_view);
    if(getSortExist && getSortExist.deleted_at == null) {
      getSortExist.group = (body.group && body.group.key == null) ? body.group : (getSortExist.group && getSortExist.group !="" && getSortExist.group.key !=null) ? JSON.parse(getSortExist.group) : null;
      getSortExist.sort = (body.sort && body.sort.length > 0) ? body.sort : (getSortExist.sort !="") ? JSON.parse(getSortExist.sort) : [];
      saved_sort = getSortExist.sort;
      saved_group = getSortExist.group;

    }


    let getPrivateProjectIds = [];
    let getPrivateTaskIds = [];
    let getAllTaskIds = [];
    let getTaskIds = [];
    let getAllSubTaskIds = [];
    let combinedTasksId = [];
    let checkIsToggle = await this.getUserTaskPermission(body.projectCreator, body.user_id);

    if (body.role_id != ROLES.CLIENT && checkIsToggle == 1) {
      let getAssignedUsers = await this.Models.AssignedTaskUsers.findAll({
        attributes:["id", "task_id", "project_id", [sequelize.literal("(SELECT parent_task_id FROM tasks WHERE tasks.id = assigned_task_users.task_id)"), "parent_task_id"],[sequelize.literal("(SELECT is_private FROM projects WHERE projects.id = assigned_task_users.project_id)"), "is_private"]],
        where: {
          project_id: body.project_id,
          user_id: body.user_id,
          deleted_at: null
        },
        raw: true,
      });

      if (getAssignedUsers.length > 0) {
        // getPrivateProjectIds = getAssignedUsers.map(val=> {
        //   if(val.is_private == 1) {
        //     return val.project_id;
        //   }
        // });
        // if(getPrivateProjectIds.length > 0) {
        //   let getPrivatetasks = await this.Models.Tasks.findAll({
        //     attributes: ["id", "parent_task_id", "project_id", "deleted_at"],
        //     where: {
        //       deleted_at: null,
        //       project_id: getPrivateProjectIds
        //     },
        //     raw: true
        //   });
        //   getPrivateTaskIds =  getPrivatetasks.map(val => val.id);
        // }
        getTaskIds = getAssignedUsers.map(val => val.parent_task_id ? val.parent_task_id : val.task_id);
      }
      // getTaskIds = getPrivateTaskIds.concat(getAllTaskIds);
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
      combinedTasksId = getTaskIds.concat(getAllSubTaskIds);
      // whereCondition.id = combinedTasksId;
      whereCondition = {
        [Op.or]: [
          {
            id: combinedTasksId
          },
          {
            added_by: body.user_id
          }
        ],
        ...whereCondition
      };
    };

    const allTaskCount = await this.Models.Tasks.findAll({
      where: whereCondition,
    });

    const getAllTasks = await this.Models.Tasks.findAll({
      attributes: {include: [[sequelize.literal("(SELECT name FROM projects WHERE projects.id = project_id)"), "project_name"],[sequelize.literal("(SELECT name FROM project_columns WHERE project_columns.id = project_column_id)"), "column_name"],[sequelize.literal("(SELECT name FROM project_columns WHERE project_columns.id = tasks.project_column_id)"), "project_column_name"], [sequelize.fn('IFNULL', sequelize.col('priority'), 'No Priority'), 'priority_status'], [sequelize.literal(`CASE
      WHEN due_date_time IS NULL THEN 'No due date'
      WHEN due_date_time < NOW() THEN 'Overdue'
      WHEN DATE(due_date_time) = DATE(NOW()) THEN 'Today'
      WHEN DATE(due_date_time) = DATE(DATE_ADD(NOW(), INTERVAL 1 DAY)) THEN 'Tomorrow'
      WHEN due_date_time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 6 DAY) THEN DATE_FORMAT(due_date_time, '%W') ELSE 'Future' END`), 'due_date_status'],
      [sequelize.fn('IFNULL', sequelize.col('labels'), 'No Labels'), 'tags'], 
      [sequelize.literal(`IFNULL((
        SELECT GROUP_CONCAT(label_id ORDER BY label_id ASC SEPARATOR ',')
        FROM task_selected_labels
        WHERE task_selected_labels.task_id = tasks.id
        AND task_selected_labels.deleted_at IS NULL
      ), 'No Labels')`), "selected_labels"],
      [sequelize.literal(`IFNULL((
        SELECT GROUP_CONCAT(user_id ORDER BY user_id ASC SEPARATOR ',')
        FROM assigned_task_users
        WHERE assigned_task_users.task_id = tasks.id
        AND assigned_task_users.deleted_at IS NULL
      ), 'No Assignee')`), "assigned_user_ids"], 
      [sequelize.literal(`
        CASE 
          WHEN priority IS NULL THEN 0
          WHEN priority = 'High' THEN 1
          WHEN priority = 'Medium' THEN 2
          WHEN priority = 'Low' THEN 3
          ELSE 4
        END
      `), 'priority_value'],
      [sequelize.literal(`(SELECT name FROM project_columns WHERE project_columns.id = tasks.status AND tasks.deleted_at IS NULL)`), 'status_name'], [
        sequelize.literal(`(SELECT Count(*) FROM assigned_task_users WHERE assigned_task_users.task_id = tasks.id AND assigned_task_users.deleted_at IS NULL)`), "total_assignee",
      ], [sequelize.literal(`CASE WHEN (SELECT defalut_name FROM project_columns WHERE project_columns.id = tasks.status) = 'completed' THEN 1 ELSE 0 END`), 'is_completed']]},
      include: [
        {
          model: this.Models.Tasks,
          attributes: { include: [[sequelize.literal(`(SELECT name FROM project_columns WHERE project_columns.id = sub_tasks.status AND sub_tasks.deleted_at IS NULL)`), 'status_name'], [sequelize.literal(`CASE WHEN (SELECT defalut_name FROM project_columns WHERE project_columns.id = sub_tasks.status) = 'completed' THEN 1 ELSE 0 END`), 'is_completed']]},
          as: "sub_tasks",
          required: false,
          where: {
            deleted_at: null
          },
          include: [{
            model: this.Models.AssignedTaskUsers,
            as: "assigned_task_users",
            attributes: ["id", "user_id", ["user_id", "agent_id"], "project_id", "task_id",
            [sequelize.literal("(SELECT first_name FROM users WHERE users.id = `sub_tasks->assigned_task_users`.`user_id`)"), "first_name"],
            [sequelize.literal("(SELECT last_name FROM users WHERE users.id = `sub_tasks->assigned_task_users`.`user_id`)"), "last_name"],
            [sequelize.literal("(SELECT user_image FROM users WHERE users.id = `sub_tasks->assigned_task_users`.`user_id`)"), "user_image"]
            ],
            // attributes: {
            //   include: [
            //     [sequelize.literal("(SELECT first_name FROM users WHERE users.id = `sub_tasks->assigned_task_users`.`user_id`)"), "first_name"],
            //     [sequelize.literal("(SELECT last_name FROM users WHERE users.id = `sub_tasks->assigned_task_users`.`user_id`)"), "last_name"],
            //     [sequelize.literal("(SELECT user_image FROM users WHERE users.id = `sub_tasks->assigned_task_users`.`user_id`)"), "user_image"]
            //   ]
            // },
            required: false,
            where: {
              deleted_at: null
            }
          },
          {
            model: this.Models.TaskSelectedLabels,
            attributes: ["id", "label_id", "deleted_at", [sequelize.literal("(SELECT label FROM task_labels WHERE task_labels.id = `sub_tasks->task_selected_labels`.`label_id`)"), "label"]],
            as: "task_selected_labels",
            where: { deleted_at: null },
            required: false,
          }
        ]
        },
        {
          model: this.Models.TaskFiles,
          as: "task_files",
          where: { chat_id: null, deleted_at: null },
          required: false,
        },
        {
          model: this.Models.AssignedTaskUsers,

          attributes: ["id", "user_id", ["user_id", "agent_id"], "project_id", "task_id",
          [sequelize.literal("(SELECT first_name FROM users WHERE users.id = assigned_task_users.user_id)"), "first_name"],[sequelize.literal("(SELECT last_name FROM users WHERE users.id = assigned_task_users.user_id)"), "last_name"],[sequelize.literal("(SELECT user_image FROM users WHERE users.id = assigned_task_users.user_id)"), "user_image"]
          ],
          // attributes: {include: [[sequelize.literal("(SELECT first_name FROM users WHERE users.id = assigned_task_users.user_id)"), "first_name"],[sequelize.literal("(SELECT last_name FROM users WHERE users.id = assigned_task_users.user_id)"), "last_name"],[sequelize.literal("(SELECT user_image FROM users WHERE users.id = assigned_task_users.user_id)"), "user_image"]]},
          as: "assigned_task_users",
          where: { deleted_at: null },
          required: false,
        },
        {
          model: this.Models.TaskSelectedLabels,
          attributes: ["id", "label_id", "deleted_at", [sequelize.literal("(SELECT label FROM task_labels WHERE task_labels.id = `task_selected_labels`.`label_id`)"), "label"]],
          as: "task_selected_labels",
          where: { deleted_at: null },
          required: false,
        }
      ],
      where: whereCondition,
      having: havingCondition,
      order: task_order, 
      offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
      limit: (body.limit == -1) ? (allTaskCount.length == 0) ? 1 : allTaskCount.length : parseInt(body.limit) || PAGINATION.LIMIT,
    });

    return { list: getAllTasks, total_records: allTaskCount.length, filtered_records: getAllTasks.length, saved_filter, saved_sort, saved_group }
  };



  getTaskDetailById = async (taskId) => {
    return await this.Models.Tasks.findOne({
      attributes: {include: [[sequelize.literal("(SELECT name FROM projects WHERE projects.id = tasks.project_id)"), "project_name"],[sequelize.literal("(SELECT name FROM project_columns WHERE project_columns.id = tasks.project_column_id)"), "column_name"],[sequelize.literal(`(SELECT name FROM project_columns WHERE project_columns.id = tasks.status AND tasks.deleted_at IS NULL)`), 'status_name']]},
      include: [
        {
          model: this.Models.TaskFiles,
          as: "task_files",
          where: { chat_id: null, deleted_at: null },
          required: false,
        },
        {
          model: this.Models.AssignedTaskUsers,
          attributes: {include: [[sequelize.literal("(SELECT first_name FROM users WHERE users.id = assigned_task_users.user_id)"), "first_name"],[sequelize.literal("(SELECT last_name FROM users WHERE users.id = assigned_task_users.user_id)"), "last_name"],[sequelize.literal("(SELECT user_image FROM users WHERE users.id = assigned_task_users.user_id)"), "user_image"]]},
          as: "assigned_task_users",
          where: { deleted_at: null },
          required: false,
        },
        {
          model: this.Models.TaskSelectedLabels,
          attributes: ["id", "label_id", "deleted_at", [sequelize.literal("(SELECT label FROM task_labels WHERE task_labels.id = task_selected_labels.label_id)"), "label"]],
          as: "task_selected_labels",
          where: { deleted_at: null },
          required: false,
          
        }
      ],
      where: {
        id: taskId,
        deleted_at: null
      },
    });
  }


  updateTaskFiles = async (data, taskId) => {
    return await this.Models.TaskFiles.update(
      data, {
      where: {
        task_id: taskId,
      }
    })
  }

  updateTaskAssignedUsers = async (data, taskId) => {
    return await this.Models.AssignedTaskUsers.update(
      data, 
      {
      where: {
        task_id: taskId,
      }
    })
  };


  deleteSelectedTaskLabelsByTaskId = async (data, taskId) => {
    return await this.Models.TaskSelectedLabels.update(
      data, 
      {
      where: {
        task_id: taskId,
      }
    })
  }



  deleteTaskFiles = async (data, fileId) => {
    return await this.Models.TaskFiles.update(
      data, {
      where: {
        id: fileId,
      }
    })
  }

  deleteTaskAssignedUsers = async (data, assignedUserId, taskId) => {
    return await this.Models.AssignedTaskUsers.update(
      data, 
      {
      where: {
        task_id: taskId,
        user_id: assignedUserId,
      }
    })
  }

  getFileById = async (fileId) => {
    return await this.Models.TaskFiles.findOne({
      where: {
        id: fileId,
        deleted_at: null
      },
      raw: true
    });
  }


  /** sort task order */
  taskMovement = async (projectColumnId, taskIds) => {
    for (let i in taskIds) {
      await this.Models.Tasks.update({
        sort_order: +i + 1
      }, {
        where: {
          project_column_id: projectColumnId,
          id: taskIds[i],
          deleted_at: null
        },
      });
    }
    return true
  };

  /** sort sub task order */
  subTaskMovement = async (projectColumnId, taskIds, parentTaskId) => {
    for (let i in taskIds) {
      await this.Models.Tasks.update({
        sort_order: +i + 1
      }, {
        where: {
          project_column_id: projectColumnId,
          id: taskIds[i],
          deleted_at: null,
          parent_task_id: parentTaskId
        },
      });
    }
    return true
  };


  getTaskInColumn = async (projectColumnId, taskId) => {
    return await this.Models.Tasks.findOne({
      where: {
        id: taskId,
        project_column_id: projectColumnId,
        deleted_at: null
      },
      raw: true
    });
  }

  taskMoveInColumns = async (projectColumnId, taskId, userId) => {
    await this.Models.Tasks.update({
      project_column_id: projectColumnId,
      status: projectColumnId,
      updated_by: userId,
      sort_order: 0
    }, {
      where: {
        id: taskId
      },
    });
    return true
  };

  findTaskById = async (taskID) => {
    return await this.Models.Tasks.findOne({
       where : {
         id : taskID,
         deleted_at : null
       },
       raw: true
    })
  }

  findProjectColumnByIdForStatus = async (projectID, columnId) => {
    return await this.Models.ProjectColumns.findOne({
      where: {
        project_id : projectID,
        id: columnId,
        deleted_at: null
      },
    })
  }

  updateStatus = async (data, taskID) => {
    return await this.Models.Tasks.update(data,{
      where : {
        id : taskID,
        deleted_at : null
      }
    })
  }

  findProjectByIds = async (projectId) => {
    let getProject =  await this.Models.Projects.findOne({
      where: {
        id: projectId,
        deleted_at: null
      },
      raw: true
    });
    return getProject;
  }


  getCompletedColumnOfProject = async (projectId) => {
    return await this.Models.ProjectColumns.findOne({
      where: {
        project_id: projectId,
        defalut_name: PROJECT_DEFAULT_COLUMN.COMPLETED,
      },
      raw: true
    });
  }

  /** create recent activities */
  createRecentActivities = async (data) => {
    return await this.Models.RecentActivities.create(data);
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
  
/* create label*/
  createLabel = async (data) => {
    return await this.Models.TaskLabels.create(data)
  }

  /** get task label */
  getTaskLabel = async (data) => {
    return await this.Models.TaskLabels.findOne({
      where: {
        project_id: data.project_id,
        label: data.label
      },
      raw: true,
    });
  }

  /** Task label list for project  */
  getTaskLabelList = async (body) => {
    let whereCondition = {
      project_id: body.project_id,
      deleted_at: null
    };

    const allTaskLabelCount = await this.Models.TaskLabels.count({
      where: whereCondition,
    });

    const getAllTaskLabels = await this.Models.TaskLabels.findAll({
      where: whereCondition,
      order: [
        ['id', 'ASC'],
      ], 
      offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
      limit: (body.limit == -1) ? (allTaskLabelCount == 0) ? 1 : allTaskLabelCount : parseInt(body.limit) || PAGINATION.LIMIT,
    });

    return { list: getAllTaskLabels, total_records: allTaskLabelCount, filtered_records: getAllTaskLabels.length }
  };


 /** compare arrayes  */
  getDeletedAssignedUserIds = async (array1, array2) => {
    const result = array2.filter(value => !array1.includes(Number(value)));
    return result;
  };



  /** get all sub task list with pagination and search filter and total count*/
  getSubTaskList = async (body) => {

    let whereCondition = {
      parent_task_id: body.task_id,
      deleted_at: null
    };

    if (body.search) {
      whereCondition = {
        [Op.or]: [
          { title: { [Op.like]: `%${body.search}%` } },
        ],
        parent_task_id: body.task_id,
      }
    }

    const allTaskCount = await this.Models.Tasks.findAll({
      where: whereCondition,
    });

    let havingCondition = {};
    let attributes = {include: [[sequelize.literal("(SELECT name FROM projects WHERE projects.id = project_id)"), "project_name"],[sequelize.literal("(SELECT name FROM project_columns WHERE project_columns.id = project_column_id)"), "column_name"]]};
    
    let checkIsToggle = await this.getUserTaskPermission(body.projectCreator, body.user_id);
    if(body.role_id == ROLES.AGENT && checkIsToggle == 1) {
        attributes = {include: [[sequelize.literal("(SELECT name FROM projects WHERE projects.id = project_id)"), "project_name"],[sequelize.literal("(SELECT name FROM project_columns WHERE project_columns.id = project_column_id)"), "column_name"],[sequelize.literal(`(
          CASE
            WHEN EXISTS (SELECT 1 FROM assigned_task_users WHERE assigned_task_users.task_id = tasks.id AND assigned_task_users.user_id = ${body.user_id} AND assigned_task_users.deleted_at IS NULL)
            THEN 1
            ELSE 0
          END
        )`), "is_assigned"]
      ]};
      havingCondition = {
        is_assigned: 1,
      }
    }

    const getAllTasks = await this.Models.Tasks.findAll({
      attributes: attributes,
      include: [
        {
          model: this.Models.AssignedTaskUsers,
          attributes: {include: [[sequelize.literal("(SELECT first_name FROM users WHERE users.id = assigned_task_users.user_id)"), "first_name"],[sequelize.literal("(SELECT last_name FROM users WHERE users.id = assigned_task_users.user_id)"), "last_name"],[sequelize.literal("(SELECT user_image FROM users WHERE users.id = assigned_task_users.user_id)"), "user_image"]]},
          as: "assigned_task_users",
          where: { deleted_at: null },
          required: false,
        },
        {
          model: this.Models.TaskSelectedLabels,
          attributes: ["id", "label_id", "deleted_at", [sequelize.literal("(SELECT label FROM task_labels WHERE task_labels.id = label_id)"), "label"]],
          as: "task_selected_labels",
          where: { deleted_at: null },
          required: false,
          
        }
      ],
      where: whereCondition,
      having: havingCondition,
      order: [
        ['id', 'DESC'],
      ], 
      offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
      limit: (body.limit == -1) ? (allTaskCount.length == 0) ? 1 : allTaskCount.length : parseInt(body.limit) || PAGINATION.LIMIT,
    });

    return { list: getAllTasks, total_records: allTaskCount.length, filtered_records: getAllTasks.length }
  };


  getSubTaskDetailById = async (taskId) => {
    return await this.Models.Tasks.findOne({
      attributes: {include: [[sequelize.literal("(SELECT name FROM projects WHERE projects.id = tasks.project_id)"), "project_name"],[sequelize.literal("(SELECT name FROM project_columns WHERE project_columns.id = tasks.project_column_id)"), "column_name"]]},
      include: [
        {
          model: this.Models.AssignedTaskUsers,
          attributes: {include: [[sequelize.literal("(SELECT first_name FROM users WHERE users.id = assigned_task_users.user_id)"), "first_name"],[sequelize.literal("(SELECT last_name FROM users WHERE users.id = assigned_task_users.user_id)"), "last_name"],[sequelize.literal("(SELECT user_image FROM users WHERE users.id = assigned_task_users.user_id)"), "user_image"]]},
          as: "assigned_task_users",
          where: { deleted_at: null },
          required: false,
        },
        {
          model: this.Models.TaskSelectedLabels,
          attributes: ["id", "label_id", "deleted_at", [sequelize.literal("(SELECT label FROM task_labels WHERE task_labels.id = label_id)"), "label"]],
          as: "task_selected_labels",
          where: { deleted_at: null },
          required: false,
          
        }
      ],
      where: {
        id: taskId,
        deleted_at: null
      },
    });
  }


  getTaskAssignedToUser = async (taskId , userId) => {
    return await this.Models.AssignedTaskUsers.findOne({
      where: {
          task_id: taskId,
          user_id: userId,
          deleted_at: null
      },
      raw: true
    });
  }


  deleteSelectedTaskLabels = async (data, taskId, labelId) => {
    return await this.Models.TaskSelectedLabels.update(
      data, 
      {
      where: {
        task_id: taskId,
        label_id: labelId,
      }
    })
  }

 /* task Update */
  taskUpdate = async (data, taskId) => {
    await this.Models.Tasks.update(data, {
      where: {
        id: taskId
      },
    });
    return true
  };


   /* get Reminder Notification emails */
   getReminderEmails = async (clientId, taskId) => {
    let getReminders = await this.Models.Users.findOne({
      attributes: ["id", "email", "reminder_to_task_creator", "reminder_to_assignee", "reminder_to_everyone", "deleted_at"],
      where: {
        id: clientId,
        deleted_at: null
      },
      raw: true
    });

    let emails = [];
    if(getReminders.reminder_to_task_creator == 1) {
      emails.push(getReminders.email);
    }

    if(getReminders.reminder_to_assignee == 1) {
      let getAssignedUsers = await this.Models.AssignedTaskUsers.findAll({
        attributes: ["id", "task_id", "user_id", "deleted_at",[sequelize.literal("(SELECT email FROM users WHERE users.id = assigned_task_users.user_id)"), "email"]],
        where: {
          task_id: taskId,
          deleted_at: null
        },
        raw: true
      });

      for(let i in getAssignedUsers) {
        emails.push(getAssignedUsers[i].email);
      }
    } 
    
    if(getReminders.reminder_to_everyone == 1) {

      emails.push(getReminders.email);
      let getAdmin = await this.Models.Users.findOne({
        attributes: ["id", "email", "role_id", "deleted_at"],
        where: {
          role_id: [ROLES.ADMIN],
          deleted_at: null
        },
        raw: true
      });
      emails.push(getAdmin.email);

      let getAssignedClientUsers = await this.Models.Users.findAll({
        attributes: ["id", "email", "deleted_at"],
        where: {
          deleted_at: null,
          added_by: clientId
        },
        raw: true
      });

      for(let user in getAssignedClientUsers) {
        emails.push(getAssignedClientUsers[user].email);
      }

      let getAssignedUsers = await this.Models.AssignedTaskUsers.findAll({
        attributes: ["id", "task_id", "user_id", "deleted_at",[sequelize.literal("(SELECT email FROM users WHERE users.id = assigned_task_users.user_id)"), "email"]],
        where: {
          task_id: taskId,
          deleted_at: null
        },
        raw: true
      });

      for(let j in getAssignedUsers) {
        emails.push(getAssignedUsers[j].email);
      }

      let getAssignedAgent = await this.Models.AssignedUsers.findAll({
        attributes: ["id", "user_id", "agent_id", "account_manager_id", "deleted_at",[sequelize.literal("(SELECT email FROM users WHERE users.id = assigned_users.agent_id)"), "agent_email"], [sequelize.literal("(SELECT email FROM users WHERE users.id = assigned_users.account_manager_id)"), "account_manager_email"]],
        where: {
          user_id: clientId,
          deleted_at: null
        },
        raw: true
      });

      for(let i in getAssignedAgent) {
        if(getAssignedAgent[i].agent_email) {
          emails.push(getAssignedAgent[i].agent_email);
        }else if(getAssignedAgent[i].account_manager_email){
          emails.push(getAssignedAgent[i].account_manager_email);
        }
      }

    }

    if(emails.length > 0){
      const getReminderEmails = [...new Set(emails)];
      return getReminderEmails;
    }else {
      return [];
    }
  };


  /** Get Task Detail For Queue */
  getTaskDetailForQueue = async (taskId) => {
    return await this.Models.Tasks.findOne({
      attributes: ["id", "title", "description", "due_date_time", "deleted_at",[sequelize.literal("(SELECT name FROM projects WHERE projects.id = tasks.project_id)"), "project_name"]],
      where: {
          id: taskId,
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
  }


  /** Get task label by label Id */
  getTaskLabelById = async (labelId) => {
    return this.Models.TaskLabels.findOne({
      where: {
        id: labelId,
        deleted_at: null
      },
      raw: true
    });
  };

  /* update task label*/
  updateTaskLabel = async (data, labelId) => {
    return await this.Models.TaskLabels.update(
      data,
    {
      where: {
        id: labelId
      }
    });
  }


  /* update task label*/
  updateSelectedTaskLabel = async (data, labelId) => {
    return await this.Models.TaskSelectedLabels.update(
      data,
    {
      where: {
        label_id: labelId
      }
    });
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



  /** save project filters by project id and user id */
  saveProjectFilters = async (data) => {
    return await this.Models.ProjectFilters.create(data);
  };

  /** Get Project Filters ByProject Or UserId */
  getProjectFiltersByProjectOrUserId = async (projectId, userId, isView) => {
    return await this.Models.ProjectFilters.findOne({
      attributes: ["id", "sort", "group", "search", "deleted_at"],
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


  getTaskDetailByIdWithSubTask = async (taskId) => {
    return await this.Models.Tasks.findOne({
      attributes: {include: [[sequelize.literal("(SELECT name FROM projects WHERE projects.id = tasks.project_id)"), "project_name"],[sequelize.literal("(SELECT name FROM project_columns WHERE project_columns.id = tasks.project_column_id)"), "column_name"],[sequelize.literal(`(SELECT name FROM project_columns WHERE project_columns.id = tasks.status AND tasks.deleted_at IS NULL)`), 'status_name'],[sequelize.literal(`(SELECT count(*) FROM task_chat_messages WHERE task_chat_messages.task_id = ${taskId} AND deleted_at IS NULL)`), "total_message_count"]]},
      include: [
        {
          model: this.Models.TaskFiles,
          as: "task_files",
          where: { chat_id: null, deleted_at: null },
          required: false,
        },
        {
          model: this.Models.AssignedTaskUsers,
          attributes: {include: [[sequelize.literal("(SELECT first_name FROM users WHERE users.id = assigned_task_users.user_id)"), "first_name"],[sequelize.literal("(SELECT last_name FROM users WHERE users.id = assigned_task_users.user_id)"), "last_name"],[sequelize.literal("(SELECT user_image FROM users WHERE users.id = assigned_task_users.user_id)"), "user_image"]]},
          as: "assigned_task_users",
          where: { deleted_at: null },
          required: false,
        },
        {
          model: this.Models.TaskSelectedLabels,
          attributes: ["id", "label_id", "deleted_at", [sequelize.literal("(SELECT label FROM task_labels WHERE task_labels.id = task_selected_labels.label_id)"), "label"]],
          as: "task_selected_labels",
          where: { deleted_at: null },
          required: false,
          
        },
        {
          model: this.Models.Tasks,
          attributes: { include: [[sequelize.literal(`(SELECT name FROM project_columns WHERE project_columns.id = sub_tasks.status AND sub_tasks.deleted_at IS NULL)`), 'status_name'], [sequelize.literal(`CASE WHEN (SELECT defalut_name FROM project_columns WHERE project_columns.id = sub_tasks.status) = 'completed' THEN 1 ELSE 0 END`), 'is_completed']]},
          as: "sub_tasks",
          required: false,
          where: {
            deleted_at: null
          },
          include: [{
            model: this.Models.AssignedTaskUsers,
            as: "assigned_task_users",
            attributes: {
              include: [
                [sequelize.literal("(SELECT first_name FROM users WHERE users.id = `sub_tasks->assigned_task_users`.`user_id`)"), "first_name"],
                [sequelize.literal("(SELECT last_name FROM users WHERE users.id = `sub_tasks->assigned_task_users`.`user_id`)"), "last_name"],
                [sequelize.literal("(SELECT user_image FROM users WHERE users.id = `sub_tasks->assigned_task_users`.`user_id`)"), "user_image"]
              ]
            },
            required: false,
            where: {
              deleted_at: null
            }
          },
          {
            model: this.Models.TaskSelectedLabels,
            attributes: ["id", "label_id", "deleted_at", [sequelize.literal("(SELECT label FROM task_labels WHERE task_labels.id = `sub_tasks->task_selected_labels`.`label_id`)"), "label"]],
            as: "task_selected_labels",
            where: { deleted_at: null },
            required: false,
          }
        ]
        },
      ],
      where: {
        id: taskId,
        deleted_at: null,
      },
      order: [
        [
          { model: this.Models.Tasks, as: "sub_tasks" },
          "sort_order",
          "ASC",
        ],
      ]
    });
  }



  /** Create task messages  */
  createTaskChatMessages = async (data) => {
      return await this.Models.TaskChatMessages.create(data);
  };


  /** upload Multiple Files */
  uploadTaskMultipleFiles = async (files, data, chatId) => {
    let taskAttachment = [];
    if (files.length > 0) {
        for (const i in files) {
            taskAttachment.push({
              task_id: data.task_id,
              project_id: data.project_id,
              file: files[i].file_key,
              chat_id: chatId,
              file_type: files[i].type,
              added_by: data.user_id
            });
        }
        return await this.Models.TaskFiles.bulkCreate(taskAttachment);
    }
  };


  /** Get task chat Messages */
  getTaskChatMessages = async (taskId, body) => {

    const allTaskMessageCount = await this.Models.TaskChatMessages.count({
      where: {
        task_id: taskId,
        deleted_at: null
      },
    });

    let getAllMessages =  await this.Models.TaskChatMessages.findAll({
      include: [
        {
          model: this.Models.Users,
          attributes: ["id", "first_name", "last_name", "user_image"],
          as: "sender_detail",
          where: { deleted_at: null },
          required: false,
        },
        {
          model: this.Models.TaskFiles,
          as: "task_chat_files",
          where: { chat_id: { [Op.ne]: null }, deleted_at: null },
          required: false,
        },
      ],
      where: {
        task_id: taskId,
        deleted_at: null
      },
      order: [
        ['id', 'DESC'],
      ], 
      offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
      limit: (body.limit == -1) ? (allTaskMessageCount == 0) ? 1 : allTaskMessageCount : parseInt(body.limit) || PAGINATION.LIMIT,
    });

    getAllMessages = getAllMessages.reverse();
    return { list: getAllMessages, total_records: allTaskMessageCount, filtered_records: getAllMessages.length }

  }


    /** get last task sort order by project Id*/
  getTaskLastOrderByProjectId= async (projectId) => {
    return await this.Models.Tasks.findOne({
      attributes: ["id", "project_id", "sort_order", "deleted_at"],
      where : {
        project_id: projectId,
        deleted_at: null,
      },
      order: [["sort_order", "DESC"]],
      raw: true,
    });
  };


  /** Get task chat Messages by MessageId */
  getTaskChatMessageById = async (messageId) => {
    let getMessage =  await this.Models.TaskChatMessages.findOne({
      include: [
        {
          model: this.Models.Users,
          attributes: ["id", "first_name", "last_name", "user_image"],
          as: "sender_detail",
          where: { deleted_at: null },
          required: false,
        },
        {
          model: this.Models.TaskFiles,
          as: "task_chat_files",
          where: { chat_id: { [Op.ne]: null }, deleted_at: null },
          required: false,
        },
      ],
      where: {
        id: messageId,
        deleted_at: null
      },
    });
    return getMessage
  };


  getTaskAssignedUsersByTaskId = async (taskId) => {
    let getAllTaskAssignedUser =  await this.Models.AssignedTaskUsers.findAll({
      where: {
          task_id: taskId,
          deleted_at: null
      },
      raw: true
    });
    let getAllTaskAssignedUserIds = getAllTaskAssignedUser.map(val => val.user_id);
    return getAllTaskAssignedUserIds;
  };


  /**Get Roles And Permissions by Id*/
  getUserRolePermissions = async (permissionId) => {
    return this.Models.RolesAndPermissions.findOne({
      attributes: ["id", "is_project_access", "deleted_at"],
      where: {
        id: permissionId,
        deleted_at: null
      },
      raw: true
    });
  };

  /**Get User Roles Permissions Id*/
  getUserPermissionId = async (userId) => {
    let getPermissionId = await this.Models.Users.findOne({
      attributes: ["id", "role_permission_id", "deleted_at"],
      where: {
        id: userId,
        deleted_at: null
      },
      raw: true
    });
    if(getPermissionId) {
      return getPermissionId.role_permission_id;
    }
    return null
  };



  /**Get Project Assigned User*/
  getProjectAssignedUser = async (projectId, userId) => {
    let isProjectAssign = await this.Models.AssignedTaskUsers.findOne({
      attributes: ["id", "project_id", "user_id", "task_id", "deleted_at"],
      where: {
        project_id: projectId,
        user_id: userId,
        task_id: null,      
        deleted_at: null
      },
      raw: true
    });
    if(isProjectAssign) {
      return 1;
    }
    return 0
  };


  /**Function for send slack notifications to user*/
  slackNotificationUsers = async (userIds, messageType, messageData) => {

    let getSlackIntegratedUsers = await this.Models.Users.findAll({
      attributes: ["id", "first_name", "last_name", "deleted_at"],
      where: {
        id: userIds,
        slack_notification_url: {
          [Op.ne]: null
        },
        deleted_at: null
      },
      raw: true
    });

    console.log(getSlackIntegratedUsers, "===getSlackIntegratedUsers====");

    if(getSlackIntegratedUsers.length > 0)  {

      for (let i in getSlackIntegratedUsers) {

        if (getSlackIntegratedUsers[i].types_of_slack_notification && getSlackIntegratedUsers[i].types_of_slack_notification !="" && getSlackIntegratedUsers[i].types_of_slack_notification.split(",").includes(`${messageType}`)) {

          let userName = getSlackIntegratedUsers[i].first_name +' '+getSlackIntegratedUsers[i].last_name;

          switch (messageType) {
            case SLACK_NOTIFICATION_TYPE.PROJECT_CREATED:
              getSlackIntegratedUsers[i].message = `${userName} created the ${messageData.project_name} project successfully.`;
              break;
            case SLACK_NOTIFICATION_TYPE.TASK_CREATED:
              getSlackIntegratedUsers[i].message = `${userName} created the ${messageData.task_name} task successfully in the ${messageData.project_name} project.`;
              break;
            case SLACK_NOTIFICATION_TYPE.TASK_UPDATED:
              getSlackIntegratedUsers[i].message = `${userName} updated the ${messageData.task_name} task successfully in the ${messageData.project_name} project.`;
              break;
            case SLACK_NOTIFICATION_TYPE.TASK_MOVE:
              getSlackIntegratedUsers[i].message = `${userName} moved the ${messageData.task_name} task from ${messageData.project_column_name} list to  ${messageData.project_moved_column_name} list in the ${messageData.project_name} project.`;
              break;
            case SLACK_NOTIFICATION_TYPE.TASK_DELETE:
              getSlackIntegratedUsers[i].message = `${userName} deleted the ${messageData.task_name} task successfully in the ${messageData.project_name} project.`;
              break;
            case SLACK_NOTIFICATION_TYPE.PROJECT_DELETE:
              getSlackIntegratedUsers[i].message = `${userName} deleted the ${messageData.project_name} project successfully.`;
              break;
            case SLACK_NOTIFICATION_TYPE.TASK_COMPLETE:
              getSlackIntegratedUsers[i].message = `${userName} has successfully ${messageData.project_column_name} the ${messageData.task_name} task in the ${messageData.project_name} project successfully.`;
              break;
            case SLACK_NOTIFICATION_TYPE.COLUMN_CREATED:
                getSlackIntegratedUsers[i].message = `${userName} created the ${messageData.project_column_name} column in the ${messageData.project_name} project successfully.`;
                break;
            case SLACK_NOTIFICATION_TYPE.COLUMN_UPDATED:
                getSlackIntegratedUsers[i].message = `${userName} updated the ${messageData.project_column_name} column in the ${messageData.project_name} project successfully.`;
                break;
            case SLACK_NOTIFICATION_TYPE.COLUMN_DELETE:
              getSlackIntegratedUsers[i].message = `${userName} deleted the ${messageData.project_column_name} column in the ${messageData.project_name} project successfully.`;
              break;
            default:
              getSlackIntegratedUsers[i].message = "";
          }
          let messageDataForSlack = { text: `${getSlackIntegratedUsers[i].message}` }
          await sendSlackNotification(getSlackIntegratedUsers[i].slack_notification_url, messageDataForSlack);
        }
      }
    }
    return true;
  };


  /** Get google auth token  */
  getGoogleAuthTokenOfUser = async (userId) => {
    let getUserToken = await this.Models.Users.findOne({
      attributes: ["id", "sync_google_calendar", "google_auth_token"],
      where: {
        id: userId,
        sync_google_calendar: 1,
        deleted_at: null
      },
      raw: true
    });

    if(getUserToken && getUserToken.google_auth_token) {
      return getUserToken.google_auth_token
    }
    return null;
  }

    /** Get google auth token  */
    getOutlookAuthTokenOfUser = async (userId) => {
      let getUserToken = await this.Models.Users.findOne({
        attributes: ["id", "sync_outlook_calendar", "outlook_auth_token"],
        where: {
          id: userId,
          sync_outlook_calendar: 1,
          deleted_at: null
        },
        raw: true
      });
  
      if(getUserToken && getUserToken.sync_outlook_calendar) {

        return getUserToken.outlook_auth_token
      }
      return null;
    }

    slackNotificationProject = async (messageType,messageData)=>{
      let message
      if (messageData.types_of_slack_notification && messageData.types_of_slack_notification != "" && messageData.types_of_slack_notification.split(",").includes(messageType.toString())) {
    
      switch (messageType) {
        case SLACK_NOTIFICATION_TYPE.PROJECT_CREATED:
          message = `${messageData.userName} created the ${messageData.project_name} project successfully.`;
          break;
        case SLACK_NOTIFICATION_TYPE.TASK_CREATED:
          message = `${messageData.userName} created the ${messageData.task_name} task successfully in the ${messageData.project_name} project.`;
          break;
        case SLACK_NOTIFICATION_TYPE.TASK_UPDATED:
          message = `${messageData.userName} updated the ${messageData.task_name} task successfully in the ${messageData.project_name} project.`;
          break;
        case SLACK_NOTIFICATION_TYPE.TASK_MOVE:
          message = `${messageData.userName} moved the ${messageData.task_name} task from ${messageData.project_column_name} list to  ${messageData.project_moved_column_name} list in the ${messageData.project_name} project.`;
          break;
        case SLACK_NOTIFICATION_TYPE.TASK_DELETE:
          message = `${messageData.userName} deleted the ${messageData.task_name} task successfully in the ${messageData.project_name} project.`;
          break;
        case SLACK_NOTIFICATION_TYPE.PROJECT_DELETE:
          message = `${messageData.userName} deleted the ${messageData.project_name} project successfully.`;
          break;
        case SLACK_NOTIFICATION_TYPE.TASK_COMPLETE:
          message = `${messageData.userName} has successfully completed  the ${messageData.task_name} task in the ${messageData.project_name} project.`;
          break;
        case SLACK_NOTIFICATION_TYPE.COLUMN_CREATED:
            message = `${messageData.userName} created the ${messageData.project_column_name} column in the ${messageData.project_name} project successfully.`;
            break;
        case SLACK_NOTIFICATION_TYPE.COLUMN_UPDATED:
            message = `${messageData.userName} updated the ${messageData.project_column_name} column in the ${messageData.project_name} project successfully.`;
            break;
        case SLACK_NOTIFICATION_TYPE.COLUMN_DELETE:
          message = `${messageData.userName} deleted the ${messageData.project_column_name} column in the ${messageData.project_name} project successfully.`;
          break;
        default:
          message = "";
      }
      let messageDataForSlack = { text: `${message}` }
      await sendSlackNotification(messageData.slack_notification_url, messageDataForSlack);
    }
    }


}