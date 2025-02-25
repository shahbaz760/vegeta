import sequelize from 'sequelize';
const Op = sequelize.Op;
import { PAGINATION, RESPONSE_CODES, ROLES } from '../../../config/constants';
import { UserMessages } from '../../../constants/message/user';
import { errorResponse } from '../../../config/responseHelper';
import moment from 'moment';

export default class User {
  async init(db) {
    this.Models = db.models;
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

  /** create user */
  createUser = async (data) => {
    return await this.Models.Users.create(data);
  };

  /** check user by invite_token */
  getUserBytoken = async (token) => {
    return this.Models.Users.findOne({ where: { invite_token: token } });
  };

  /** update user's profile by invite_token*/
  updateProfile = async (data, token) => {
    await this.Models.Users.update(data, { where: { invite_token: token } });
  };

  /** get user by email*/
  getUserByMail = async (email) => {
    return this.Models.Users.findOne({ where: { email: email }, raw: true });
  };

  /** get all users list with pagination and search filter and total count*/
  getUserList = async (query, orgId) => {
    let whereCondition = {
      deleted_at: null,
      role_id: ROLES.USER,
    };
    const allUserCount = await this.Models.Users.count({
      where: whereCondition,
    });
    if (query.search) {
      whereCondition = {
        [Op.or]: [{ first_name: { [Op.like]: `%${query.search}%` } },
        { last_name: { [Op.like]: `%${query.search}%` } }],
        org_id: orgId,
        deleted_at: null,
        role_id: { [Op.ne]: 3 },
        invite_status: 1
      }
    }
    const allUsers = await this.Models.Users.findAll({
      where: whereCondition,
      order: [
        ['id', 'DESC'],
      ],
      offset: (parseInt(query.start) == 0) ? 0 : (parseInt(query.start) || PAGINATION.START) * (parseInt(query.limit) || PAGINATION.LIMIT) || PAGINATION.START,
      limit: (query.limit == -1) ? allUserCount : parseInt(query.limit) || PAGINATION.LIMIT,
      raw: true,
    });

    return { list: allUsers, total_records: allUserCount, filtered_records: allUsers.length }
  };

  /** get all pending users list with pagination and total count*/
  getAllPendingUsersList = async (query, orgId) => {
    let data = {
      org_id: orgId,
      role_id: { [Op.ne]: 3 },
      invite_status: 0
    }
    const allPendingUserCount = await this.Models.Users.count({
      where: data,
    });
    const allPendingUsers = await this.Models.Users.findAll({
      where: data,
      attributes: {
        exclude: ["password", "invite_token", "reset_password_token"],
      },
      order: [
        ['id', 'DESC'],
      ],
      offset: (parseInt(query.start) == 0) ? 0 : (parseInt(query.start) || PAGINATION.START) * (parseInt(query.limit) || PAGINATION.LIMIT) || PAGINATION.START,
      limit: (query.limit == -1) ? allPendingUserCount : parseInt(query.limit) || PAGINATION.LIMIT,
      raw: true,
    });
    return { list: allPendingUsers, total_records: allPendingUserCount, filtered_records: allPendingUsers.length }

  };


  /** delete user by user id */
  removeUser = async (data, Id) => {
    return this.Models.Users.update(data, { where: { id: Id } });
  };

  /** update user by user id */
  updateUser = async (data, id) => {
    return await this.Models.Users.update(data, { where: { id } });
  };

  getUserDetails = async (userID) => {
    return await this.Models.Users.findOne({
      attributes: ["id", "first_name", "last_name", "password",  "user_role", "status", "email", "user_image", "two_factor_authentication", "role_permission_id", "created_at", [sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = users.id)"), "userName"], [sequelize.literal("(SELECT FROM_UNIXTIME(login_time, '%Y-%m-%d %H:%i:%s') FROM user_login_times WHERE user_login_times.user_id = users.id ORDER BY user_login_times.id DESC limit 1)"), "last_login"], [sequelize.literal("(SELECT name FROM roles WHERE roles.id = users.user_role)"), "user_role_name"]],
      where: {
        id: userID,
        deleted_at: null
      },
      raw: true
    })
  }


  deleteUser = async (data, userID) => {
    return await this.Models.Users.update(data, {
      where: {
        id: userID,
        deleted_at: null
      }
    })
  }

  getUsersList = async (body, userId, userDetail) => {

    let whereCondition = {
      role_id: ROLES.USER,
      deleted_at: null,
      added_by: userId
    }

    if (body.search) {
      whereCondition = {
        [Op.or]: [
          { first_name: { [Op.like]: `%${body.search}%` } },
          { last_name: { [Op.like]: `%${body.search}%` } },
          { email: { [Op.like]: `%${body.search}%` } },
        ],
        role_id: ROLES.USER,
        deleted_at: null,
        added_by: userId
      }
    }



    if(userDetail.role_id == ROLES.USER) {

      let getUsersClient = await this.Models.Users.findAll({
        attributes: ["id", "added_by", "added_by_user", "deleted_at"],
        where: {
          added_by: userDetail.added_by,
          deleted_at: null
        },
        raw: true
      });
      let getUsersId = getUsersClient.map(val=> val.id);

      // getUsersId.push(userDetail.id);
      // getUsersId.push(userDetail.id, userDetail.added_by);
      // console.log(getUsersId, "===getUsersId=====");

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

      // finalUserIds = finalUserIds.filter(item => item !== userDetail.id);
      let finalUserIds = getUsersId.filter(item => item !== userDetail.id);

      whereCondition = {
        role_id: ROLES.USER,
        deleted_at: null,
        id: finalUserIds
      }
      if (body.search) {
        whereCondition = {
          [Op.or]: [
            { first_name: { [Op.like]: `%${body.search}%` } },
            { last_name: { [Op.like]: `%${body.search}%` } },
            { email: { [Op.like]: `%${body.search}%` } },
          ],
          role_id: ROLES.USER,
          deleted_at: null,
          id: finalUserIds
        }
      }
    }

    if(userDetail.role_id == ROLES.CLIENT) {
      let getUsersClient = await this.Models.Users.findAll({
        attributes: ["id", "added_by", "deleted_at"],
        where: {
          added_by: userDetail.id,
          deleted_at: null
        },
        raw: true
      });
      let getUsersId = getUsersClient.map(val=> val.id);

      let getUserClientUsers = await this.Models.Users.findAll({
        attributes: ["id", "added_by", "deleted_at"],
        where: {
          added_by: getUsersId,
          deleted_at: null
        },
        raw: true
      });
      let getUserClientUserId = getUserClientUsers.map(val=> val.id);
      let finalUserIds = getUsersId.concat(getUserClientUserId);

      whereCondition = {
        role_id: ROLES.USER,
        deleted_at: null,
        id: finalUserIds
      }
      if (body.search) {
        whereCondition = {
          [Op.or]: [
            { first_name: { [Op.like]: `%${body.search}%` } },
            { last_name: { [Op.like]: `%${body.search}%` } },
            { email: { [Op.like]: `%${body.search}%` } },
          ],
          role_id: ROLES.USER,
          deleted_at: null,
          id: finalUserIds
        }
      }
    }


    if (body.filter) {
      if(body.filter.role !=0) {
          whereCondition.role_permission_id = body.filter.role;
      }
      if(body.filter.two_factor_authentication == 1 || body.filter.two_factor_authentication == "1") {
        whereCondition.two_factor_authentication = 1;
      } else if (body.filter.two_factor_authentication ==2 || body.filter.two_factor_authentication == "2"){
        whereCondition.two_factor_authentication = 0;
      }
    }

    const getCountWithSearch = await this.Models.Users.count({
      where: whereCondition
    })

    const getCountWithoutSearch = await this.Models.Users.count({
      where: whereCondition
    })

    const getAllUsersList = await this.Models.Users.findAll({
      attributes: ["id", "user_role", "status", "email", "user_image", "two_factor_authentication","added_by", "role_permission_id", "added_by_user", "created_at", [sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = users.id)"), "userName"], [sequelize.literal("(SELECT FROM_UNIXTIME(login_time, '%Y-%m-%d %H:%i:%s') FROM user_login_times WHERE user_login_times.user_id = users.id ORDER BY user_login_times.id DESC limit 1)"), "last_login"], [sequelize.literal("(SELECT name FROM roles WHERE roles.id = users.user_role)"), "user_role_name"],[sequelize.literal(`
      (SELECT COALESCE(
        (SELECT CASE 
          WHEN user_task_permissions.is_toggle = 0 THEN 0 
          WHEN user_task_permissions.is_toggle = 1 THEN 1 
          ELSE 0
        END 
        FROM user_task_permissions
        WHERE user_task_permissions.client_id = ${userId} 
        AND user_task_permissions.user_id = users.id), 0)
      )
    `), 'is_toggle'], [sequelize.literal("(SELECT name FROM roles_and_permissions WHERE roles_and_permissions.id = users.role_permission_id)"), "role_name"]],
      where: whereCondition,
      raw: true,
      order: [["id", "DESC"]]
    })

    return { list: getAllUsersList, total_records: getCountWithSearch, filtered_records: getAllUsersList.length, total_count: getCountWithoutSearch }
  };


  /** get user role by roleId*/
  getUserRoleByRoleId = async (roleId) => {
    return this.Models.Roles.findOne({ 
      where: { 
        id: roleId,
        parent_role_id: ROLES.USER,
      }, 
    raw: true });
  };


  updateSubscription = async (data, subscriptionId) => {
    return await this.Models.ClientSubscriptions.update(data, {
      where: {
        id: subscriptionId
      }
    });
  };


  getUserTasksList = async (body, userDetail) => {

    let currentDate = new Date();
    let getAllAssignedTaskOfUser =  await this.Models.AssignedTaskUsers.findAll({
      where: {
        user_id: userDetail.id,
        task_id: {
          [Op.ne]: null
        },
        deleted_at: null
      },
      raw: true
    });

    let getAllAssignedTaskIds = getAllAssignedTaskOfUser.map(val => val.task_id);
    let whereCondition = {
      id: getAllAssignedTaskIds,
      deleted_at: null,
    };
    let havingCondition = {
      project_deleted_at: null
    }

    if (body.type == 1) {

        whereCondition = {
          id: getAllAssignedTaskIds,
          deleted_at: null,
          due_date_time: {
            [Op.gt]: currentDate
          }
        };

        havingCondition.project_column_status = {
          [Op.ne]: "Completed"
        };
    }

    if (body.date && body.date != "") {
      whereCondition = {
        id: getAllAssignedTaskIds,
        deleted_at: null,
        due_date_time: {
          [Op.between]: [moment(new Date(body.date)).startOf("day"), moment(new Date(body.date)).endOf("day")],
        }
      };

      havingCondition.project_column_status = {
        [Op.ne]: "Completed"
      };

    }

    if (body.search && body.search != "") {
      whereCondition = {
        title: { [Op.like]: `%${body.search}%` },
        ...whereCondition
      }
    }

    const allTaskCount = await this.Models.Tasks.findAll({
      attributes: { include: [[sequelize.literal("(SELECT name FROM project_columns WHERE project_columns.id = tasks.status)"), "project_column_status"], [sequelize.literal("(SELECT deleted_at FROM projects WHERE projects.id = tasks.project_id)"), "project_deleted_at"]] },
      where: whereCondition,
      having: havingCondition,
    });

    const getAllTasks = await this.Models.Tasks.findAll({
      attributes: { include: [[sequelize.literal("(SELECT name FROM project_columns WHERE project_columns.id = tasks.status)"), "project_column_status"], [sequelize.literal("(SELECT deleted_at FROM projects WHERE projects.id = tasks.project_id)"), "project_deleted_at"]] },
      where: whereCondition,
      having: havingCondition,
      offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
      limit: (body.limit == -1) ? allTaskCount.length : parseInt(body.limit) || PAGINATION.LIMIT,
      order: [
        ['id', 'DESC'],
      ],
      raw: true,
    });
    return { list: getAllTasks, total_records: allTaskCount.length, filtered_records: getAllTasks.length }
  };


}

