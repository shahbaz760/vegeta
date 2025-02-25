require("dotenv").config();
import Services from "./project.services.js";
import { RESPONSE_CODES, ROLES, PROJECT_DEFAULT_COLUMN, PROJECT_MENU_NAME, PROJECT_MENUS, RECENT_ACTIVITY_TYPE, SLACK_NOTIFICATION_TYPE } from "../../../config/constants.js";
import {
  successResponse,
  errorResponse
} from "../../../config/responseHelper.js";
import { CommonMessages } from "../../../constants/message/common.js";
import { ProjectMessages } from "../../../constants/message/project.js";
import { ProjectColumnMessages } from "../../../constants/message/projectColumn.js";
import moment from "moment";
import AuthServices from "../Auth/auth.services.js";
import TaskServices from "../task/task.services.js";
import { v4 as uuidv4 } from 'uuid';

export default class Project {
  async init(db) {
    this.services = new Services();
    this.AuthServices = new AuthServices();
    this.TaskServices = new TaskServices();
    this.Models = db.models;
    await this.services.init(db);
    await this.AuthServices.init(db);
    await this.TaskServices.init(db);
  }

  /* add project */
  async addProject(req, res) {
    try {
      const { body, user } = req;
      body.added_by = user.id;
      body.user_id = user.id;
      body.type = 0;
      if(user.role_id == ROLES.USER) {
        let getUserDetail = await this.services.getUserDetailById(user.id);
        body.user_id = getUserDetail.added_by;
        body.type = 1;
      }
      let createProject = await this.services.createProject(body);
      await this.services.createDefaultProjectColumns(createProject.id, user.id);
      await this.services.createDefaultProjectMenus(createProject.id, user.id);
      await this.services.createDefaultProjectTaskLabels(createProject.id, user.id);

      let userIds = [];
      if(body.is_private == 1 && body.assign_users.length > 0) {
          let assignUsers = [...new Set(body.assign_users)];
          for (const i in assignUsers) {
              const userExist = await this.services.findUsersById(assignUsers[i]);
              if (userExist) {
                userIds.push({
                      task_id: null,
                      project_id: createProject.id,
                      user_id: assignUsers[i]
                  });
              }
          }
          await this.Models.AssignedTaskUsers.bulkCreate(userIds);
      };
      const getProjectDetails = await this.services.getProjectById(createProject.id);

      // let getRecentActivity = await this.services.getRecentActivities(user.id);
      // let sortOrder = 1;
      // if(getRecentActivity){
      //     sortOrder = getRecentActivity.sort_order+1;
      // }
      let recentActivity = {
          client_id: body.user_id,
          user_id: user.id,
          type: RECENT_ACTIVITY_TYPE.PROJECT_CREATED,
          project_column_id: null,
          project_id: createProject.id,
          task_id: null,
          // sort_order: sortOrder,
      }
      await this.services.createRecentActivities(recentActivity);

      return res
        .status(201)
        .send(
          successResponse(
            ProjectMessages.PROJECT_ADDED,
            getProjectDetails,
            RESPONSE_CODES.POST
          )
        );
    } catch (error) {
      console.log(error, "===error")
      return res
        .status(500)
        .send(
          errorResponse(
            CommonMessages.ERROR,
            null,
            RESPONSE_CODES.SERVER_ERROR
          )
        );
    }
  };


  /* Project list */
  async projectList(req, res) {
    try {
      const { body, user } = req;
      let getProjectlist ;
      if(user.role_id == ROLES.AGENT) {
        let agentProjectlist =  await this.AuthServices.getProjectsForAgentByAgentId(user.id);
        getProjectlist = { list: agentProjectlist, total_records: agentProjectlist.length, filtered_records: agentProjectlist.length }
      }else if (user.role_id == ROLES.USER){
        let userProjectlist =  await this.AuthServices.getAllProjectsForUserByUserId(user.id, user.added_by, user);
        getProjectlist = { list: userProjectlist, total_records: userProjectlist.length, filtered_records: userProjectlist.length }
      }else {
        getProjectlist = await this.services.getProjectList(body, user.id);
      }
      return res
        .status(200)
        .send(
          successResponse(ProjectMessages.GET_LIST, getProjectlist, RESPONSE_CODES.GET)
        );
    } catch (error) {
      return res
        .status(500)
        .send(
          errorResponse(
            CommonMessages.ERROR,
            null,
            RESPONSE_CODES.SERVER_ERROR
          )
        );
    }
  };

  /* delete project */
  async projectDelete(req, res) {
    try {
      const { body, user } = req;

      /** check project exist or not */
      const getProjectDetail = await this.services.getProjectById(body.project_id);
      if (!getProjectDetail) {
        return res
          .status(400)
          .send(
            errorResponse(
              ProjectMessages.PROJECT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      const updateData = {
        deleted_at: moment(new Date()).unix(),
        updated_by: user.id
      };
      await this.services.updateProjectdata(updateData, body.project_id);

      // let getRecentActivity = await this.services.getRecentActivities(user.id);
      // let sortOrder = 1;
      // if(getRecentActivity){
      //     sortOrder = getRecentActivity.sort_order+1;
      // }
      let recentActivity = {
          client_id: user.id,
          user_id: user.id,
          type: RECENT_ACTIVITY_TYPE.PROJECT_DELETE,
          project_column_id: null,
          project_id: getProjectDetail.id,
          task_id: null,
          // sort_order: sortOrder,
      }
      await this.services.createRecentActivities(recentActivity);

      return res
        .status(200)
        .send(
          successResponse(ProjectMessages.PROJECT_DELETE, {}, RESPONSE_CODES.POST)
        );
    } catch (error) {
      return res
        .status(500)
        .send(
          errorResponse(
            CommonMessages.ERROR,
            null,
            RESPONSE_CODES.SERVER_ERROR
          )
        );
    }
  };


  /* edit project info */
  async projectUpdate(req, res) {
    try {
      const { body, params, user } = req;
      /** check project exist or not */
      body.updated_by = user.id;
      const getProjectDetail = await this.services.getProjectById(params.project_id);
      if (!getProjectDetail) {
        return res
          .status(400)
          .send(
            errorResponse(
              ProjectMessages.PROJECT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      await this.services.updateProjectdata(body, params.project_id);

      let userIds = [];
      let deletedData = {
        deleted_at: moment(new Date()).unix(),
      }
      
      if(body.is_private == 1 && body.assign_users.length > 0) {
        await this.services.updateTaskAssignedUsers(deletedData, params.project_id);
        let assignUsers = [...new Set(body.assign_users)];
        for (const i in assignUsers) {
          const userExist = await this.services.findUsersById(assignUsers[i]);
          if (userExist) {
            let checkInAssignee = await this.Models.AssignedTaskUsers.findOne({
              where: {
                task_id: null,
                project_id: params.project_id,
                user_id: assignUsers[i],
                deleted_at: null
              },
              raw: true,
            });
            if(!checkInAssignee) {
              userIds.push({
                task_id: null,
                project_id: params.project_id,
                user_id: assignUsers[i]
              });
            }
          }
        }
        await this.Models.AssignedTaskUsers.bulkCreate(userIds);
      }else {
        await this.services.updateTaskAssignedUsers(deletedData, params.project_id);
      }

      return res
        .status(201)
        .send(
          successResponse(
            ProjectMessages.PROJECT_UPDATE,
            projectDetail,
            RESPONSE_CODES.POST
          )
        );
    } catch (error) {
      console.log(error, "==========error=========")
      return res
        .status(500)
        .send(
          errorResponse(
            CommonMessages.ERROR,
            null,
            RESPONSE_CODES.SERVER_ERROR
          )
        );
    }
  };

  /* Project Details */
  async projectDetail(req, res) {
    try {
      const { params } = req;
      const getProjectDetails = await this.services.getProjectById(params.project_id);
      if (!getProjectDetails) {
        return res
          .status(400)
          .send(
            errorResponse(
              ProjectMessages.PROJECT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      return res
        .status(200)
        .send(
          successResponse(ProjectMessages.GET_DATA, getProjectDetails, RESPONSE_CODES.GET)
        );
    } catch (error) {
      console.log(error, "=====error=====")
      return res
        .status(500)
        .send(
          errorResponse(
            CommonMessages.ERROR,
            null,
            RESPONSE_CODES.SERVER_ERROR
          )
        );
    }
  };

  async addColumns(req, res) {
    try {
      const { body, user } = req;
      body.added_by = user.id;
      const ProjectExist = await this.services.getProjectById(body.project_id)
      if (!ProjectExist) {
        return res
          .status(400)
          .send(
            errorResponse(
              ProjectMessages.PROJECT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      const checkProjectColumnName = await this.services.getProjectColumnByName(body.project_id, body.name)
      if (checkProjectColumnName) {
        return res
          .status(400)
          .send(
            errorResponse(
              ProjectColumnMessages.COLUMN_ALREADY_ADDED,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      let getSortOrder = await this.Models.ProjectColumns.findOne({
        where: {
          project_id: body.project_id,
          deleted_at: null
        },
        order: [["sort_order", "DESC"]],
        raw: true
      });
      
      body.sort_order = (getSortOrder && getSortOrder.sort_order != null) ? Number(getSortOrder.sort_order)+1 : 1;
      let createProjectColumn = await this.services.createColumn(body);
      if (ProjectExist.slack_notification_url) {
         /** Slack notification messages */
      let slackNotificationData = {
        userName: `${user.first_name} ${user.last_name}`,
        project_name: ProjectExist.name,
        task_name: null,
        project_column_name: body.name,
        slack_notification_url:ProjectExist.slack_notification_url,
        types_of_slack_notification:ProjectExist.types_of_slack_notification
      }

      await this.TaskServices.slackNotificationProject(SLACK_NOTIFICATION_TYPE.COLUMN_CREATED,slackNotificationData)
      }


      return res
        .status(201)
        .send(
          successResponse(
            ProjectColumnMessages.COLUMN_ADDED,
            createProjectColumn,
            RESPONSE_CODES.POST
          )
        );

    } catch (error) {
      console.log(error, "===error==");
      return res
        .status(500)
        .send(
          errorResponse(
            CommonMessages.ERROR,
            null,
            RESPONSE_CODES.SERVER_ERROR
          )
        );
    }
  }

  /* Project Columns list */
  async projectColumnsList(req, res) {
    try {
      const { body, user } = req;

      body.is_view = body.is_view ? body.is_view : 0;
      let updateGroupSort = {};
      switch (true) {
        case (body.is_filter_save == 1 && body.sort.length == 0 && body.search == "" && body.group.key == null):
          updateGroupSort = {
            deleted_at: moment(new Date).unix(),
          };
          // getColumnslist.saved_sort_and_group = null;
          break;
      
        case (body.is_filter_save == 1 && body.group.key == null):
          
          updateGroupSort.group = JSON.stringify({
            "key": null,
            "order": 0
          });
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
      await this.services.updateProjectFilters(updateGroupSort, body.project_id, user.id, body.is_view);

      let checkSortAndGroupExist = await this.services.getProjectGroupSortByProjectOrUserId(body.project_id, user.id, body.is_view);
      if((checkSortAndGroupExist && checkSortAndGroupExist.deleted_at == null && body.type != 1)) {
        body.is_filter = 1;
      }

      const ProjectExist = await this.services.getProjectById(body.project_id);
      if (!ProjectExist) {
        return res
          .status(400)
          .send(
            errorResponse(
              ProjectMessages.PROJECT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      let projectCreatorId = ProjectExist.user_id;
      const getCompletedColumn = await this.services.getCompletedColumnOfProject(body.project_id);
      const getToDoColumn = await this.services.getToDoColumnOfProject(body.project_id);
      let getColumnslist = [];
      if(body.is_filter == 0) {
        getColumnslist = await this.services.getColumnList(body, user, projectCreatorId);

      }else {

        if(body.filter_id && body.filter_id !=0) {
          let getFilters = await this.services.getProjectFiltersByFilterId(body.filter_id);
          if(getFilters) {
            body.filter = (getFilters.filter !="") ? JSON.parse(getFilters.filter) : [];
          }
        }

        let checkSortAndGroup = await this.services.getProjectGroupSortByProjectOrUserId(body.project_id, user.id, body.is_view);
   
        if(checkSortAndGroup && checkSortAndGroup.deleted_at == null) {
          if(body.search == "") {
            body.search = (checkSortAndGroup.search !="") ? JSON.parse(checkSortAndGroup.search) : "";
          }
          if(body.sort.length == 0) {
            body.sort = (checkSortAndGroup.sort !="") ? JSON.parse(checkSortAndGroup.sort) : [];
          }
          if(body.group.key ==null) {
            body.group = (checkSortAndGroup.group !="") ? JSON.parse(checkSortAndGroup.group) : body.group = {
              "key": null,
              "order": 0
            };
          }
        }

        getColumnslist = await this.services.getColumnListForFilter(body, user, projectCreatorId);
        getColumnslist.complete_column_id = getCompletedColumn ? getCompletedColumn.id : null;
        getColumnslist.to_do_column_id = getToDoColumn ? getToDoColumn.id : null;
        if(body.is_filter_save && body.is_filter_save == 1) {
          if(body.is_filter && body.is_filter == 1) {
            let filterData = {
              name: body.filter_name ? body.filter_name : null,
              project_id: body.project_id,
              user_id: user.id,
              filter: (body.filter !="" || body.filter.length > 0) ? JSON.stringify(body.filter): "",
              is_view: body.is_view,
              is_filter: 1
            };

            if(body.filter_name !=""){
              await this.services.saveProjectFilters(filterData);
            }

          }
          let filterGroupSortData = {
            project_id: body.project_id,
            user_id: user.id,
            search: body.search,
            group: JSON.stringify(body.group),
            sort: (body.sort !="" || body.sort.length > 0) ? JSON.stringify(body.sort): "",
            is_view: body.is_view,
            deleted_at: null,
            is_filter: 0
          };
          let checkFilterExist = await this.services.getProjectGroupSortByProjectOrUserId(body.project_id, user.id, body.is_view);
          if(!checkFilterExist) {
            await this.services.saveProjectFilters(filterGroupSortData);
          }else {
            await this.services.updateProjectFilters(filterGroupSortData, body.project_id, user.id, body.is_view);
          }
        }
      }

      getColumnslist.saved_filter = (body.filter && body.filter.length > 0) ? body.filter : null;
      getColumnslist.saved_sort = (body.sort && body.sort.length > 0) ? body.sort : [];
      getColumnslist.saved_group = (body.group && body.group.key == null) ? null : body.group;

      if(body.filter_id && body.filter_id !=0) {
        let getFilterExist = await this.services.getProjectFiltersByFilterId(body.filter_id);
        if(getFilterExist) {
          getFilterExist.filter = (body.filter && body.filter.length > 0) ? body.filter : (getFilterExist.filter !="") ? JSON.parse(getFilterExist.filter) : null;
          getColumnslist.saved_filter = getFilterExist.filter;
        }
      }

      let getSortAndGroup = await this.services.getProjectGroupSortByProjectOrUserId(body.project_id, user.id, body.is_view);
      if(getSortAndGroup && getSortAndGroup.deleted_at == null) {
        getSortAndGroup.sort = (getSortAndGroup.sort !="") ? JSON.parse(getSortAndGroup.sort) : [];
        getSortAndGroup.group = (getSortAndGroup.group !="") ? JSON.parse(getSortAndGroup.group) : {
          key: null,
          order: 0
        };
        getColumnslist.saved_sort = (body.sort && body.sort.length > 0) ? body.sort :  (getSortAndGroup.sort && getSortAndGroup.sort.length > 0) ? getSortAndGroup.sort : [];
        getColumnslist.saved_group = (body.group && body.group.key != null) ? body.group : (getSortAndGroup.group && getSortAndGroup.group.key != null) ? getSortAndGroup.group : null;
      }

      return res
        .status(200)
        .send(
          successResponse(ProjectColumnMessages.GET_LIST, getColumnslist, RESPONSE_CODES.GET)
        );
    } catch (error) {
      console.log(error, "====error===")
      return res
        .status(500)
        .send(
          errorResponse(
            CommonMessages.ERROR,
            null,
            RESPONSE_CODES.SERVER_ERROR
          )
        );
    }
  };

  /* delete project column */
  async projectColumnDelete(req, res) {
    try {
      const { params, user } = req;

      /** check column exist or not */
      const getProjectDetail = await this.services.getColumnById(params.column_id);
      if (!getProjectDetail) {
        return res
          .status(400)
          .send(
            errorResponse(
              ProjectColumnMessages.PROJECT_COLUMN_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      if(getProjectDetail.is_defalut == 1 || getProjectDetail.is_defalut == 2) {
        return res
          .status(400)
          .send(
            errorResponse(
              ProjectColumnMessages.DEFAULT_COLUMN_NOT_DELETED,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      const updateData = {
        deleted_at: moment(new Date()).unix(),
        updated_by: user.id,
      };
      await this.services.updateProjectColumn(updateData, params.column_id);
      await this.services.deleteColumnTasks(updateData, params.column_id);
      const projectInfo = await this.services.getProjectById(getProjectDetail.project_id)
      if (projectInfo.slack_notification_url) {
      /** Slack notification messages */
      let slackNotificationData = {
        userName: `${user.first_name} ${user.last_name}`,
        project_name: getProjectDetail.project_name,
        task_name: null,
        project_column_name: getProjectDetail.name,
        slack_notification_url:projectInfo.slack_notification_url,
        types_of_slack_notification:projectInfo.types_of_slack_notification
      }
      this.TaskServices.slackNotificationProject(SLACK_NOTIFICATION_TYPE.COLUMN_DELETE,slackNotificationData)
      }

      return res
        .status(200)
        .send(
          successResponse(ProjectColumnMessages.COLUMN_DELETE, getProjectDetail, RESPONSE_CODES.POST)
        );
    } catch (error) {
      return res
        .status(500)
        .send(
          errorResponse(
            CommonMessages.ERROR,
            null,
            RESPONSE_CODES.SERVER_ERROR
          )
        );
    }
  };

  /* edit project Column info */
  async columnUpdate(req, res) {
    try {
      const { body, params, user } = req;
      /** check Column exist or not */
      body.updated_by = user.id;
      const getColumnDetail = await this.services.getColumnById(params.column_id);
      if (!getColumnDetail) {
        return res
          .status(400)
          .send(
            errorResponse(
              ProjectColumnMessages.PROJECT_COLUMN_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      const checkProjectColumnName = await this.services.getProjectColumnByColumnIdAndName(params.column_id, getColumnDetail.project_id, body.name)

      if (checkProjectColumnName) {
        return res
          .status(400)
          .send(
            errorResponse(
              ProjectColumnMessages.COLUMN_ALREADY_ADDED,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      await this.services.updateProjectColumn(body, params.column_id);
      const getColumn = await this.services.getColumnById(params.column_id);
      const projectDetails = await this.services.findProject(getColumnDetail.project_id)
      if (projectDetails.slack_notification_url) {
             /** Slack notification messages */
      let slackNotificationData = {
        userName: `${user.first_name} ${user.last_name}`,
        project_name: getColumnDetail.project_name,
        task_name: null,
        project_column_name: body.name,
        slack_notification_url:projectDetails.slack_notification_url,
        types_of_slack_notification:projectDetails.types_of_slack_notification
      }
      this.TaskServices.slackNotificationProject(SLACK_NOTIFICATION_TYPE.COLUMN_UPDATED,slackNotificationData)
      }


      return res
        .status(201)
        .send(
          successResponse(
            ProjectColumnMessages.COLUMN_UPDATE,
            getColumn,
            RESPONSE_CODES.POST
          )
        );
    } catch (error) {
      console.log(error, "======error=====");
      return res
        .status(500)
        .send(
          errorResponse(
            CommonMessages.ERROR,
            null,
            RESPONSE_CODES.SERVER_ERROR
          )
        );
    }
  };

  /* Column Details */
  async ColumnDetail(req, res) {
    try {
      const { params } = req;
      const getColumnDetails = await this.services.getColumnById(params.column_id);
      if (!getColumnDetails) {
        return res
          .status(400)
          .send(
            errorResponse(
              ProjectColumnMessages.PROJECT_COLUMN_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      return res
        .status(200)
        .send(
          successResponse(ProjectColumnMessages.GET_DATA, getColumnDetails, RESPONSE_CODES.GET)
        );
    } catch (error) {
      return res
        .status(500)
        .send(
          errorResponse(
            CommonMessages.ERROR,
            null,
            RESPONSE_CODES.SERVER_ERROR
          )
        );
    }
  };



  async columnMove(req, res) {
    try {
      const { body } = req;

      const getProjectDetail = await this.services.getProjectById(body.project_id);
      if (!getProjectDetail) {
        return res
          .status(400)
          .send(
            errorResponse(
              ProjectMessages.PROJECT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      await this.services.columnMovement(body.project_id, body.column_ids);
      return res.status(200).send(successResponse(ProjectColumnMessages.COLUMN_MOVE, {}, RESPONSE_CODES.POST));
    } catch (error) {
      console.log(error, "=====error=====")
      return res.status(500).send(errorResponse(CommonMessages.ERROR, null, RESPONSE_CODES.SERVER_ERROR));
    }
  }



  /* Project Columns task status */
  async ColumnTaskStatus(req, res) {
    try {
      const { params } = req;
      const ProjectExist = await this.services.getProjectById(params.project_id)
      if (!ProjectExist) {
        return res
          .status(400)
          .send(
            errorResponse(
              ProjectMessages.PROJECT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      const getColumnslist = await this.services.getColumnTaskStatus(params);
      return res
        .status(200)
        .send(
          successResponse(ProjectColumnMessages.GET_LIST, getColumnslist, RESPONSE_CODES.GET)
        );
    } catch (error) {
      console.log(error, "====error===")
      return res
        .status(500)
        .send(
          errorResponse(
            CommonMessages.ERROR,
            null,
            RESPONSE_CODES.SERVER_ERROR
          )
        );
    }
  };

  async addWhiteBoard(req, res) {
    try {
      const { body, user } = req;
      let getProjectMenu  =  await this.services.getProjectMenuByMenuIdAndMenu(body.project_menu_id, 4);
      if(!getProjectMenu) {
        return res
          .status(400)
          .send(
            errorResponse(
              ProjectColumnMessages.PROJECT_MENU_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      const findProjectExist = await this.services.findProject(body.project_id)
      if (!findProjectExist) {
        return res
          .status(400)
          .send(
            errorResponse(
              ProjectColumnMessages.PROJECT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }


      const checkWhiteBoardExist = await this.services.getProjectWhiteBoardByMenuId(body.project_menu_id)
      if(checkWhiteBoardExist) {
        return res
        .status(400)
        .send(
          errorResponse(
            ProjectColumnMessages.WHITEBOARD_ALREADY_ADDED,
            null,
            RESPONSE_CODES.BAD_REQUEST
          )
        );
      }


      body.user_id = user.id;
      body.sort_order = 0;
      let getProjectWhiteBoard= await this.services.getProjectWhiteboardByProjectId(body.project_id);
      if(getProjectWhiteBoard) {
        body.sort_order = getProjectWhiteBoard.sort_order + 1;
      }
      let createWhiteBoard = await this.services.AddProjectWhiteboard(body);
      return res
        .status(200)
        .send(
          successResponse(ProjectMessages.PROJECT_WHITEBOARD_ADDED, createWhiteBoard, RESPONSE_CODES.POST)
        );

    } catch (error) {
      console.log(error, "====error===")
      return res
        .status(500)
        .send(
          errorResponse(
            CommonMessages.ERROR,
            null,
            RESPONSE_CODES.SERVER_ERROR
          )
        );
    }
  }

  async addProjectDoc(req, res) {
    try {
      const { body, user } = req;
      let getProjectMenu  =  await this.services.getProjectMenuByMenuIdAndMenu(body.project_menu_id, 5);
      if(!getProjectMenu) {
        return res
          .status(400)
          .send(
            errorResponse(
              ProjectColumnMessages.PROJECT_MENU_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      const findProjectExist = await this.services.findProject(body.project_id)
      if (!findProjectExist) {
        return res
          .status(400)
          .send(
            errorResponse(
              ProjectColumnMessages.PROJECT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      const checkDocumentExist = await this.services.getProjectDocumentByMenuId(body.project_menu_id);
      if(checkDocumentExist) {
        return res
        .status(400)
        .send(
          errorResponse(
            ProjectColumnMessages.DOCUMENT_ALREADY_ADDED,
            null,
            RESPONSE_CODES.BAD_REQUEST
          )
        );
      }

      body.user_id = user.id;
      body.sort_order = 0;
      let getProjectDocument= await this.services.getProjectDocumentByProjectId(body.project_id);
      if(getProjectDocument) {
        body.sort_order = getProjectDocument.sort_order + 1;
      }
      let createDocment = await this.services.AddProjectDocument(body);
      return res
        .status(200)
        .send(
          successResponse(ProjectMessages.PROJECT_DOCUMENT_ADDED, createDocment, RESPONSE_CODES.POST)
        );

    } catch (error) {
      return res
        .status(500)
        .send(
          errorResponse(
            CommonMessages.ERROR,
            null,
            RESPONSE_CODES.SERVER_ERROR
          )
        );
    }
  }


  async getDocument(req, res) {
    try {
      const { params, user } = req;
        const findProjectMenuExist = await this.services.getProjectMenuByMenuIdAndMenu(params.project_menu_id, 5);
      
        if (!findProjectMenuExist) {
          return res
            .status(400)
            .send(
              errorResponse(
                ProjectColumnMessages.PROJECT_DOCUMENT_NOT_FOUND,
                null,
                RESPONSE_CODES.BAD_REQUEST
              )
            );
        }
  
        const findProjectDocumentExist = await this.services.findProjectDocumentByMenuId(params.project_menu_id);
  
        if(!findProjectDocumentExist) {
         let createDoc =  await this.services.AddProjectDocument({
            project_menu_id: findProjectMenuExist.id,
            project_id: findProjectMenuExist.project_id,
            user_id: user.id,
            doc_file: "",
            name: "Document"
          });
          return res
          .status(200)
          .send(
            successResponse(ProjectMessages.PROJECT_DOCUMENT_GET, createDoc, RESPONSE_CODES.GET)
          );
        } 

        return res
        .status(200)
        .send(
          successResponse(ProjectMessages.PROJECT_DOCUMENT_GET, findProjectDocumentExist, RESPONSE_CODES.GET)
        );

    } catch (error) {
      return res
        .status(500)
        .send(
          errorResponse(
            CommonMessages.ERROR,
            null,
            RESPONSE_CODES.SERVER_ERROR
          )
        );
    }
  }

  async getWhiteboard(req, res) {
    try {
      const { params, user } = req;

      const findProjectMenuExist = await this.services.getProjectMenuByMenuIdAndMenu(params.project_menu_id, 4);
      
      if (!findProjectMenuExist) {
        return res
          .status(400)
          .send(
            errorResponse(
              ProjectColumnMessages.PROJECT_WHITEBOARD_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      const findProjectWhiteBoardExist = await this.services.findProjectWhiteboardByMenuId(params.project_menu_id, user.id);

      if(!findProjectWhiteBoardExist) {
       let createWhiteBoard =  await this.services.AddProjectWhiteboard({
          project_menu_id: findProjectMenuExist.id,
          project_id: findProjectMenuExist.project_id,
          user_id: user.id,
          xml_data: "",
          xml_img: "",
          name: "Whiteboard"
        });
        return res
        .status(200)
        .send(
          successResponse(ProjectMessages.GET_DATA, createWhiteBoard, RESPONSE_CODES.GET)
        );
      } 

      return res
        .status(200)
        .send(
          successResponse(ProjectMessages.GET_DATA, findProjectWhiteBoardExist, RESPONSE_CODES.GET)
        );

    } catch (error) {
      return res
        .status(500)
        .send(
          errorResponse(
            CommonMessages.ERROR,
            null,
            RESPONSE_CODES.SERVER_ERROR
          )
        );
    }
  };


  /* get assigned user ids acc. to auth token */
  async getAssignedUserIds(req, res) {
    try {
      const { params, user } = req;

      /** check project exist or not */
      const getProjectDetail = await this.services.getProjectById(params.project_id);
      if (!getProjectDetail) {
        return res
          .status(400)
          .send(
            errorResponse(
              ProjectMessages.PROJECT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      /** get assigned user ids for project */
      const getUsersIds = await this.services.getAssignedUserIdForAdminUser(params, getProjectDetail.user_id, user.role_id);
      return res
        .status(201)
        .send(
          successResponse(
            ProjectMessages.GET_DATA,
            getUsersIds,
            RESPONSE_CODES.POST
          )
        );
    } catch (error) {
      console.log(error, "====error===")
      return res
        .status(500)
        .send(
          errorResponse(
            CommonMessages.ERROR,
            null,
            RESPONSE_CODES.SERVER_ERROR
          )
        );
    }
  };

  /** Enable disable project menu list */

  async enable_menu(req, res) {
    try {
      const { body, user } = req;
      /** check project exist or not */
      const getProjectDetail = await this.services.getProjectById(body.project_id);
      if (!getProjectDetail) {
        return res
          .status(400)
          .send(
            errorResponse(
              ProjectMessages.PROJECT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      if (body.menu.length > 0) {
        // Only process menu IDs 4, 5, and 6
        let  allowedMenus = [];
        let menuName = "";
        if (body.menu.includes(4)) {
          allowedMenus.push(4);
        }
        if (body.menu.includes(5)) {
          allowedMenus.push(5);
        }
        if (body.menu.includes(6)) {
          allowedMenus.push(6);
        }

        if(allowedMenus.length > 0) {
  
            // Parallelize menu operations using Promise.all
            const menuPromises = allowedMenus.map(async (menuId) => {
              const getMenuDetail = await this.services.getProjectMenuByProjectIdAndMenu(body.project_id, menuId);

              if (getMenuDetail && getMenuDetail.is_disable === 0) {
                // Update menu if it exists and is enabled
                return this.services.updateProjectMenuByProjectIdAndMenu({ is_disable: 1 }, body.project_id, menuId);
              } else {

                // Fetch the last sort order once for all menu operations
                const getMenuLastOrder = await this.services.getMenuLastOrderByProjectId(body.project_id);
                let sortOrder = getMenuLastOrder.sort_order;

                if(menuId == 4) {
                  menuName = PROJECT_MENU_NAME.WHITE_BOARD;
                }else if(menuId == 5) {
                  menuName = PROJECT_MENU_NAME.DOCUMENT;
                }else if(menuId == 6) {
                  menuName = PROJECT_MENU_NAME.CHAT;
                }

                // Create a new menu if it doesn't exist or is disabled
                const menuData = {
                  project_id: body.project_id,
                  is_disable: 1,
                  menu: menuId,
                  user_id: user.id,
                  sort_order: sortOrder+1, // Increment sort order for each new menu
                  uuid: uuidv4(),
                  name: menuName,
                };
                return this.services.createProjectMenu(menuData);
              }
            });
            // Wait for all menu operations to complete
            await Promise.all(menuPromises);
        }

      }

      let getMenuList = await this.services.getProjectMenuList(body.project_id);
      return res
          .status(201)
          .send(
            successResponse(
              ProjectMessages.PROJECT_MENU_ADDED,
              getMenuList,
              RESPONSE_CODES.POST
            )
          );

    } catch (error) {
      console.log(error, "====error===")
      return res
        .status(500)
        .send(
          errorResponse(
            CommonMessages.ERROR,
            null,
            RESPONSE_CODES.SERVER_ERROR
          )
        );
    }
  }



  /** Get project menu list */
  async projectMenuList(req, res) {
    try {
      const { params } = req;
      /** check project exist or not */

    let checkProject = await this.services.getProjectById(params.project_id);
    if(!checkProject) {
      return res
      .status(400)
      .send(
        errorResponse(
          ProjectMessages.PROJECT_NOT_FOUND,
          null,
          RESPONSE_CODES.BAD_REQUEST
        )
      );
    }

    let getMenuList = await this.services.getProjectMenuList(params.project_id);
    return res
      .status(201)
      .send(
        successResponse(
          ProjectMessages.GET_LIST,
          getMenuList,
          RESPONSE_CODES.POST
        )
      );
    } catch (error) {
      console.log(error, "====error===")
      return res
        .status(500)
        .send(
          errorResponse(
            CommonMessages.ERROR,
            null,
            RESPONSE_CODES.SERVER_ERROR
          )
        );
    }
  }

  /** Get project menu detail */
  async projectMenuDetail(req, res) {
    try {
      const { params } = req;
      /** check project exist or not */
    let getMenuDetail = await this.services.getProjectMenuDetail(params.uuid);
    if(!getMenuDetail){
      return res
      .status(400)
      .send(
        errorResponse(
          ProjectMessages.PROJECT_MENU_NOT_FOUND,
          null,
          RESPONSE_CODES.BAD_REQUEST
        )
      );
    }
    return res
      .status(201)
      .send(
        successResponse(
          ProjectMessages.GET_DATA,
          getMenuDetail,
          RESPONSE_CODES.POST
        )
      );
    } catch (error) {
      console.log(error, "====error===")
      return res
        .status(500)
        .send(
          errorResponse(
            CommonMessages.ERROR,
            null,
            RESPONSE_CODES.SERVER_ERROR
          )
        );
    }
  }


  /** update project menu detail */
  async projectMenuUpdate(req, res) {
    try {
      const { body, user } = req;
      /** check project exist or not */
    let getMenuDetail = await this.services.getProjectMenuDetail(body.uuid);
    if(!getMenuDetail){
      return res
      .status(400)
      .send(
        errorResponse(
          ProjectMessages.PROJECT_MENU_NOT_FOUND,
          null,
          RESPONSE_CODES.BAD_REQUEST
        )
      );
    }
    let updatedData = {
      name: body.name
    };
    await this.services.updateProjectMenudata(updatedData, body.uuid);
    let getUpdatedMenuDetail = await this.services.getProjectMenuDetail(body.uuid);
    return res
      .status(201)
      .send(
        successResponse(
          ProjectMessages.PROJECT_MENU_UPDATE,
          getUpdatedMenuDetail,
          RESPONSE_CODES.POST
        )
      );
    } catch (error) {
      console.log(error, "====error===")
      return res
        .status(500)
        .send(
          errorResponse(
            CommonMessages.ERROR,
            null,
            RESPONSE_CODES.SERVER_ERROR
          )
        );
    }
  }



    /* Project filter dropDown */
    async projectFilterDropDown(req, res) {
      try {
        const { params, user } = req;
        const ProjectExist = await this.services.getProjectById(params.project_id)
        if (!ProjectExist) {
          return res
            .status(400)
            .send(
              errorResponse(
                ProjectMessages.PROJECT_NOT_FOUND,
                null,
                RESPONSE_CODES.BAD_REQUEST
              )
            );
        }
  
        let getColumnslist = await this.services.getFilterDropDownList(params.project_id, params.key);
        return res
          .status(200)
          .send(
            successResponse(ProjectColumnMessages.GET_LIST, getColumnslist, RESPONSE_CODES.GET)
          );
      } catch (error) {
        console.log(error, "====error===")
        return res
          .status(500)
          .send(
            errorResponse(
              CommonMessages.ERROR,
              null,
              RESPONSE_CODES.SERVER_ERROR
            )
          );
      }
    };


  // Get project whiteboard list
  async getProjectWhiteBoardList(req, res) {
    try {
      const { params, user } = req;
      const findProjectExist = await this.services.findProject(params.project_id)
      if (!findProjectExist) {
        return res
          .status(400)
          .send(
            errorResponse(
              ProjectColumnMessages.PROJECT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      let getWhiteBoardList = await this.services.getProjectWhiteboardList(params.project_id)
      return res
        .status(200)
        .send(
          successResponse(ProjectMessages.GET_LIST, getWhiteBoardList, RESPONSE_CODES.GET)
        );

    } catch (error) {
      return res
        .status(500)
        .send(
          errorResponse(
            CommonMessages.ERROR,
            null,
            RESPONSE_CODES.SERVER_ERROR
          )
        );
    }
  }

  // edit project whiteboard
  async editProjectWhiteBoard(req, res) {
    try {
      const { body, user } = req;
      // const findWhiteBoardExist = await this.services.findProjectWhiteboard(body.white_board_id);
      const findWhiteBoardExist = await this.services.getProjectMenuByMenuIdAndMenu(body.project_menu_id, 4);
      if (!findWhiteBoardExist) {
        return res
          .status(400)
          .send(
            errorResponse(
              ProjectColumnMessages.PROJECT_WHITEBOARD_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      body.name = (body.name =="") ? findWhiteBoardExist.name : body.name;
      body.xml_data = (body.xml_data =="") ? findWhiteBoardExist.xml_data : body.xml_data;
      body.xml_img = (body.xml_img =="") ? findWhiteBoardExist.xml_img : body.xml_img;

      await this.services.updateWhiteboardData(body, body.project_menu_id, user.id, findWhiteBoardExist.project_id);
      return res
        .status(200)
        .send(
          successResponse(ProjectMessages.PROJECT_WHITEBOARD_UPDATED, {}, RESPONSE_CODES.PUT)
        );
    } catch (error) {
      console.log(error, "=====error=====")
      return res
        .status(500)
        .send(
          errorResponse(
            CommonMessages.ERROR,
            null,
            RESPONSE_CODES.SERVER_ERROR
          )
        );
    }
  }


  // delete project whiteboard
  async deleteProjectWhiteBoard(req, res) {
    try {
      const { params, user } = req;
      const findWhiteBoardExist = await this.services.findProjectWhiteboard(params.white_board_id)
      if (!findWhiteBoardExist) {
        return res
          .status(400)
          .send(
            errorResponse(
              ProjectColumnMessages.PROJECT_WHITEBOARD_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      let deleteData = {
        deleted_at: moment(new Date()).unix(),
      };
      await this.services.updateWhiteboard(deleteData, params.white_board_id, user.id)
      return res
        .status(200)
        .send(
          successResponse(ProjectMessages.PROJECT_WHITEBOARD_DELETED, {}, RESPONSE_CODES.DELETE)
        );
    } catch (error) {
      console.log(error, "=====error=====")
      return res
        .status(500)
        .send(
          errorResponse(
            CommonMessages.ERROR,
            null,
            RESPONSE_CODES.SERVER_ERROR
          )
        );
    }
  }


  // edit project document
  async editProjectDocument(req, res) {
    try {
      const { body, user } = req;
      // const findProjectDocumentExist = await this.services.findProjectDocument(body.document_id);
      const findProjectDocumentExist = await this.services.getProjectMenuByMenuIdAndMenu(body.project_menu_id, 5);
      if (!findProjectDocumentExist) {
        return res
          .status(400)
          .send(
            errorResponse(
              ProjectColumnMessages.PROJECT_DOCUMENT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      body.name = (body.name =="") ? findProjectDocumentExist.name : body.name;
      body.doc_file = (body.doc_file =="") ? findProjectDocumentExist.doc_file : body.doc_file;

      await this.services.updateProjectDocument(body, body.project_menu_id)
      return res
        .status(200)
        .send(
          successResponse(ProjectMessages.PROJECT_DOCUMENT_UPDATED, {}, RESPONSE_CODES.PUT)
        );
    } catch (error) {
      console.log(error, "=====error=====")
      return res
        .status(500)
        .send(
          errorResponse(
            CommonMessages.ERROR,
            null,
            RESPONSE_CODES.SERVER_ERROR
          )
        );
    }
  };

  // Get project document list
  async getProjectDocumentList(req, res) {
    try {
      const { params, user } = req;
      const findProjectExist = await this.services.findProject(params.project_id)
      if (!findProjectExist) {
        return res
          .status(400)
          .send(
            errorResponse(
              ProjectColumnMessages.PROJECT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      let getDocumentList = await this.services.getProjectDocumentList(params.project_id)
      return res
        .status(200)
        .send(
          successResponse(ProjectMessages.GET_LIST, getDocumentList, RESPONSE_CODES.GET)
        );

    } catch (error) {
      return res
        .status(500)
        .send(
          errorResponse(
            CommonMessages.ERROR,
            null,
            RESPONSE_CODES.SERVER_ERROR
          )
        );
    }
  };


  // delete project document
  async deleteProjectDocument(req, res) {
    try {
      const { params, user } = req;
      const findProjectDocumentExist = await this.services.findProjectDocument(params.document_id);
      if (!findProjectDocumentExist) {
        return res
          .status(400)
          .send(
            errorResponse(
              ProjectColumnMessages.PROJECT_DOCUMENT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      let deleteData = {
        deleted_at: moment(new Date()).unix(),
      };
      await this.services.updateProjectDocument(deleteData, params.document_id);
      return res
        .status(200)
        .send(
          successResponse(ProjectMessages.PROJECT_DOCUMENT_DELETED, {}, RESPONSE_CODES.DELETE)
        );
    } catch (error) {
      console.log(error, "=====error=====")
      return res
        .status(500)
        .send(
          errorResponse(
            CommonMessages.ERROR,
            null,
            RESPONSE_CODES.SERVER_ERROR
          )
        );
    }
  };



  /** Sort project document or whiteboard */
  async sortProjectDocWhiteBoard(req, res) {
    try {
      const { body } = req;
      const getProjectDetail = await this.services.getProjectById(body.project_id);
      if (!getProjectDetail) {
        return res
          .status(400)
          .send(
            errorResponse(
              ProjectMessages.PROJECT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      await this.services.sortProjectDocOrBoard(body.project_id, body.ids, body.type);
      return res.status(200).send(successResponse(ProjectColumnMessages.PROJECT_DOC_OR_BOARD_SORT, {}, RESPONSE_CODES.POST));
    } catch (error) {
      console.log(error, "=====error=====")
      return res.status(500).send(errorResponse(CommonMessages.ERROR, null, RESPONSE_CODES.SERVER_ERROR));
    }
  }


  /** Sort projects */
  async dragDropProjects(req, res) {
    try {
      const { body, user } = req;
      await this.services.sortProjectDragDrop(body.project_ids, user.id);
      return res.status(200).send(successResponse(ProjectColumnMessages.PROJECT_DOC_OR_BOARD_SORT, {}, RESPONSE_CODES.POST));
    } catch (error) {
      console.log(error, "=====error=====")
      return res.status(500).send(errorResponse(CommonMessages.ERROR, null, RESPONSE_CODES.SERVER_ERROR));
    }
  }

  /** Sort projects menus*/
  async dragDropProjectMenus(req, res) {
    try {
      const { body, user } = req;
      const getProjectDetail = await this.services.getProjectById(body.project_id);
      if (!getProjectDetail) {
        return res
          .status(400)
          .send(
            errorResponse(
              ProjectMessages.PROJECT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      await this.services.sortProjectMenuDragDrop(body.project_id, body.menu_ids);
      return res.status(200).send(successResponse(ProjectColumnMessages.PROJECT_DOC_OR_BOARD_SORT, {}, RESPONSE_CODES.POST));
    } catch (error) {
      console.log(error, "=====error=====")
      return res.status(500).send(errorResponse(CommonMessages.ERROR, null, RESPONSE_CODES.SERVER_ERROR));
    }
  };


  /** delete project menu */
  async deleteProjectMenu(req, res) {
    try {
      const { params, user } = req;
      /** check project exist or not */
    let getMenuDetail = await this.services.getProjectMenuDetail(params.uuid);
    if(!getMenuDetail){
      return res
      .status(400)
      .send(
        errorResponse(
          ProjectMessages.PROJECT_MENU_NOT_FOUND,
          null,
          RESPONSE_CODES.BAD_REQUEST
        )
      );
    }

    if(getMenuDetail.menu !=4 && getMenuDetail.menu !=5 && getMenuDetail.menu !=6) {
      return res
      .status(400)
      .send(
        errorResponse(
          ProjectMessages.PROJECT_MENU_NOT_DELETE,
          null,
          RESPONSE_CODES.BAD_REQUEST
        )
      );
    }

    let updatedData = {
      deleted_at: moment(new Date()).unix()
    };
    await this.services.updateProjectMenudata(updatedData, params.uuid);
    let getMenuList = await this.services.getProjectMenuList(getMenuDetail.project_id);
    return res
      .status(201)
      .send(
        successResponse(
          ProjectMessages.PROJECT_MENU_DELETE,
          getMenuList,
          RESPONSE_CODES.POST
        )
      );
    } catch (error) {
      console.log(error, "====error===")
      return res
        .status(500)
        .send(
          errorResponse(
            CommonMessages.ERROR,
            null,
            RESPONSE_CODES.SERVER_ERROR
          )
        );
    }
  };

  /** pin project menu */
  async pinProjectMenu(req, res) {
    try {
      const { params, user } = req;
      /** check project exist or not */
    let getMenuDetail = await this.services.getProjectMenuDetail(params.uuid);
    if(!getMenuDetail){
      return res
      .status(400)
      .send(
        errorResponse(
          ProjectMessages.PROJECT_MENU_NOT_FOUND,
          null,
          RESPONSE_CODES.BAD_REQUEST
        )
      );
    }
    let isPin = 1;
    let message = ProjectMessages.PROJECT_MENU_PINNED;
    if(getMenuDetail.pin == 1) {
      isPin = 0;
      message = ProjectMessages.PROJECT_MENU_UNPINNED;
    }
    let updatedData = {
      pin: isPin
    };
    await this.services.updateProjectMenudata(updatedData, params.uuid);
    let getMenuList = await this.services.getProjectMenuList(getMenuDetail.project_id);
    return res
      .status(201)
      .send(
        successResponse(
          message,
          getMenuList,
          RESPONSE_CODES.POST
        )
      );
    } catch (error) {
      console.log(error, "====error===")
      return res
        .status(500)
        .send(
          errorResponse(
            CommonMessages.ERROR,
            null,
            RESPONSE_CODES.SERVER_ERROR
          )
        );
    }
  };

  /** get saved filters */
  async getSavedFilters(req, res) {
    try {
      const { params, query, user } = req;
      console.log(params, "====params===");
    let getFilterList = await this.services.getSavedFilterList(params, user.id, query);
    return res
      .status(201)
      .send(
        successResponse(
          ProjectMessages.GET_LIST,
          getFilterList,
          RESPONSE_CODES.GET
        )
      );
    } catch (error) {
      console.log(error, "====error===")
      return res
        .status(500)
        .send(
          errorResponse(
            CommonMessages.ERROR,
            null,
            RESPONSE_CODES.SERVER_ERROR
          )
        );
    }
  };

  /** delete filters */
  async deleteFilter(req, res) {
    try {
      const { params, user } = req;
    let getFilter = await this.services.getProjectFiltersByFilterId(params.filter_id);
    if(!getFilter) {
      return res
      .status(400)
      .send(
        errorResponse(
          ProjectMessages.FILTER_NOT_FOUND,
          null,
          RESPONSE_CODES.BAD_REQUEST
        )
      );
    }

    let deletedData = {
      deleted_at: moment(new Date()).unix(),
    }

    await this.services.updateFiltersByFilterId(deletedData, params.filter_id);
    return res
      .status(201)
      .send(
        successResponse(
          ProjectMessages.FILTER_DELETED,
          {},
          RESPONSE_CODES.DELETE
        )
      );
    } catch (error) {
      console.log(error, "====error===")
      return res
        .status(500)
        .send(
          errorResponse(
            CommonMessages.ERROR,
            null,
            RESPONSE_CODES.SERVER_ERROR
          )
        );
    }
  };



  /** update filters */
  async updateFilter(req, res) {
    try {
      const { body, user } = req;
    let getFilter = await this.services.getProjectFiltersByFilterId(body.filter_id);
    if(!getFilter) {
      return res
      .status(400)
      .send(
        errorResponse(
          ProjectMessages.FILTER_NOT_FOUND,
          null,
          RESPONSE_CODES.BAD_REQUEST
        )
      );
    }
    if(body.name && body.name == "") {
      return res
      .status(400)
      .send(
        errorResponse(
          "Filter name cannot be empty",
          null,
          RESPONSE_CODES.BAD_REQUEST
        )
      );
    }
    await this.services.updateFiltersByFilterId(body, body.filter_id);
    return res
      .status(201)
      .send(
        successResponse(
          ProjectMessages.FILTER_UPDATED,
          {},
          RESPONSE_CODES.DELETE
        )
      );
    } catch (error) {
      console.log(error, "====error===")
      return res
        .status(500)
        .send(
          errorResponse(
            CommonMessages.ERROR,
            null,
            RESPONSE_CODES.SERVER_ERROR
          )
        );
    }
  }

}
