require("dotenv").config();
import Services from "./accountManager.services";
import bcrypt from "bcrypt";
import {
  RESPONSE_CODES,
  ROLES,
  TOKEN_TYPE,
  ASSIGNED_USERS,
  COMETCHATROLES,
  USER_STATUS
} from "../../../config/constants";
import { successResponse, errorResponse } from "../../../config/responseHelper";
import { AccountManagerMessages } from "../../../constants/message/accountManager";
import { CommonMessages } from "../../../constants/message/common";
import { refreshToken } from "../helpers/jwt";
import nodemailer from "../helpers/mail";
import randomstring from "randomstring";
import moment from "moment";
import {setPassword} from "../EmailTemplates/set_password"
import {
  uploadFileForAll,
  s3RemoveSingleFile,
  createCometChatUser,
  updateCometChatUser,
  deleteCometChatUser,
  deleteUserAndItsRecords
} from "../helpers/commonFunction";

export default class AccountManager {
  async init(db) {
    (this.services = new Services()),
      (this.Models = db.models),
      await this.services.init(db);
      
  }

  /* add Account Manager */
  async addAccountManager(req, res) {
    try {
      const { body, user } = req;
      /** check email exist or not */
      const checkEmail = await this.services.getAccountManagerByMail(
        body.email
      );
      if (checkEmail) {
        return res
          .status(400)
          .send(
            errorResponse(
              AccountManagerMessages.ALREADY_ADDED,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      body.role_id = ROLES.ACCOUNTMANAGER;
      body.added_by = user.id;
      await this.services.createAccountManager(body);

      return res
        .status(201)
        .send(
          successResponse(
            AccountManagerMessages.ACCOUNT_MANAGER_ADDED,
            null,
            RESPONSE_CODES.POST
          )
        );
    } catch (error) {
      console.log(error, "====err-r");
      return res
        .status(500)
        .send(
          errorResponse(CommonMessages.ERROR, null, RESPONSE_CODES.SERVER_ERROR)
        );
    }
  }

  /* account manager's list */
  async accountManagerList(req, res) {
    try {
      const { body, user } = req;
      body.role_id = user.role_id;
      body.user_id = user.id;
      const list = await this.services.getAccountManagersList(body);
      return res
        .status(200)
        .send(
          successResponse(
            AccountManagerMessages.GET_LIST,
            list,
            RESPONSE_CODES.GET
          )
        );
    } catch (error) {
      console.log(error, "===error==");
      return res
        .status(500)
        .send(
          errorResponse(CommonMessages.ERROR, null, RESPONSE_CODES.SERVER_ERROR)
        );
    }
  }

  //delete Account Manager
  async accountManagerDelete(req, res) {
    try {
      const { body } = req;
      let updateData = {
        deleted_at: moment(new Date()).unix(),
      };
      // await this.services.removeAccountManager(
      //   updateData,
      //   body.accountManger_id
      // );
      await deleteUserAndItsRecords(updateData, body.accountManger_id, this.Models);
      await deleteCometChatUser(body.accountManger_id);
      return res
        .status(201)
        .send(
          successResponse(
            AccountManagerMessages.DELETE_ACCOUNT_MANAGER,
            {},
            RESPONSE_CODES.DELETE
          )
        );
    } catch (error) {
      console.log("====error====",error)
      return res
        .status(500)
        .send(
          errorResponse(CommonMessages.ERROR, null, RESPONSE_CODES.SERVER_ERROR)
        );
    }
  }

  // Account Manager Detail Page
  async accountManagerDetailPage(req, res) {
    try {
      const { params, user } = req;
      const getAccountManagerDetails = await this.services.getAccountManagerByManagerId(
        params.accountManager_Id, user
      );
      if (!getAccountManagerDetails) {
        return res
          .status(400)
          .send(
            errorResponse(
              AccountManagerMessages.ACCOUNT_MANAGER_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      if(user.role_id == ROLES.ACCOUNTMANAGER) {
        let setAttributes = ["id", "admin_hide_info", "deleted_at"];
        let getPermission = await this.services.getAccountManagerRolePermissions(user.role_permission_id, setAttributes);
        if(getPermission && getPermission.admin_hide_info == 1) {
          getAccountManagerDetails.email = "*****";
          getAccountManagerDetails.phone_number = "*****";
        }
      }

      return res
        .status(200)
        .send(
          successResponse(
            AccountManagerMessages.GET_DATA,
            getAccountManagerDetails,
            RESPONSE_CODES.GET
          )
        );
    } catch (error) {
      console.log(error, "====error===");
      return res
        .status(500)
        .send(
          errorResponse(CommonMessages.ERROR, null, RESPONSE_CODES.SERVER_ERROR)
        );
    }
  }

  //Assign Clients to Account Manager
  async assignClients(req, res) {
    try {
      const { body, user } = req;
      const checkAccountManager = await this.services.checkAccount_ManagerById(
        body.account_manager_id
      );
      if (!checkAccountManager) {
        return res
          .status(400)
          .send(
            errorResponse(
              AccountManagerMessages.ACCOUNT_MANAGER_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      let AssignClients = [];

      if (body.client_ids.length == 0) {
        const totalClients = await this.services.allClientsData();
        const clientids = await totalClients.map((client) => client.id);

        for (const i in clientids) {
          const checkAlreadyExist = await this.Models.AssignedUsers.findOne({
            where: {
              user_id: body.account_manager_id,
              type: ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER,
              client_id: clientids[i],
            },
          });
          if (!checkAlreadyExist) {
            AssignClients.push({
              user_id: body.account_manager_id,
              client_id: clientids[i],
              type: ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER,
              is_default: 0,
              assigned_date: moment(new Date()).unix(),
            });
          }
        }
      } else {
        let getClientIds = [...new Set(body.client_ids)];

        for (const i in getClientIds) {
          const checkAlreadyExist = await this.Models.AssignedUsers.findOne({
            where: {
              user_id: body.account_manager_id,
              type: ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER,
              client_id: getClientIds[i],
            },
          });
          if (!checkAlreadyExist) {
            AssignClients.push({
              user_id: body.account_manager_id,
              client_id: getClientIds[i],
              type: ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER,
              is_default: 0,
              assigned_date: moment(new Date()).unix(),
            });
          }
        }
      }

      const checkIsAnyDefaultClient =
        await this.services.checkDefaultClientCountAccountManagerById(
          body.account_manager_id
        );
      if (checkIsAnyDefaultClient == 0) {
        if (AssignClients.length > 0) {
          AssignClients.forEach((client, index) => {
            client.is_default = index === 0 ? 1 : 0;
          });
        }
      }
      await this.Models.AssignedUsers.bulkCreate(AssignClients);

      return res
        .status(201)
        .send(
          successResponse(
            AccountManagerMessages.CLIENTS_ASSIGNED,
            {},
            RESPONSE_CODES.POST
          )
        );
    } catch (error) {
      return res
        .status(500)
        .send(
          errorResponse(CommonMessages.ERROR, null, RESPONSE_CODES.SERVER_ERROR)
        );
    }
  }

  // Client list for Account Manager
  async accountManagerClientList(req, res) {
    try {
      const { query } = req;

      console.log(query, "===query====");
      if (!query.account_Manager_id) {
        return res
          .status(400)
          .send(
            errorResponse(
              "Account manager id is required.",
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      if (query.account_Manager_id != "") {
        const getAccountManagerDetails = await this.services.getUserById(
          query.account_Manager_id
        );
        if (!getAccountManagerDetails) {
          return res
            .status(400)
            .send(
              errorResponse(
                AccountManagerMessages.ACCOUNT_MANAGER_NOT_FOUND,
                null,
                RESPONSE_CODES.BAD_REQUEST
              )
            );
        }
      }

      const getAllClientList = await this.services.getAllClientList(query);
      return res
        .status(200)
        .send(
          successResponse(
            AccountManagerMessages.GET_DATA,
            getAllClientList,
            RESPONSE_CODES.GET
          )
        );
    } catch (error) {
      console.log(error, "===error====")
      return res
        .status(500)
        .send(
          errorResponse(CommonMessages.ERROR, null, RESPONSE_CODES.SERVER_ERROR)
        );
    }
  }

  //update Account Manager
  async updateAccountManager(req, res) {
    try {
      const { body } = req;

      const getAccountManagerDetails = await this.services.getUserById(
        body.account_manager_id
      );
      if (!getAccountManagerDetails) {
        return res
          .status(400)
          .send(
            errorResponse(
              AccountManagerMessages.ACCOUNT_MANAGER_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      await this.services.updateAccountManager(body, body.account_manager_id);
      return res
        .status(201)
        .send(
          successResponse(
            AccountManagerMessages.UPDATE_ACCOUNT_MANAGER,
            {},
            RESPONSE_CODES.DELETE
          )
        );
    } catch (error) {
      return res
        .status(500)
        .send(
          errorResponse(CommonMessages.ERROR, null, RESPONSE_CODES.SERVER_ERROR)
        );
    }
  }

  async updateAccountManagerInfo(req, res) {
    try {
      const { body, files, user } = req;

      if (!body.account_manager_id) {
        return res
          .status(400)
          .send(
            errorResponse(
              "Account manager id is required.",
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      if (body.zipcode && body.zipcode == "" || body.zipcode == "0" || body.zipcode == "null") {
        body.zipcode = null;
      }

      const getAccountManagerDetails = await this.services.getAccountManagerByManagerId(
        body.account_manager_id, user
      );
      if (!getAccountManagerDetails) {
        return res
          .status(400)
          .send(
            errorResponse(
              AccountManagerMessages.ACCOUNT_MANAGER_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      if (body.email && body.email == "*****") {
        body.email = getAccountManagerDetails.email;
      }
      if (body.phone_number && body.phone_number == "*****") {
        body.phone_number = getAccountManagerDetails.phone_number;
      }

      if (files && files.length > 0) {
        let sendData = {
          files,
          id: body.account_manager_id,
          folder: "Users",
        };
        let uploadedProfile = await uploadFileForAll(sendData);
        if (uploadedProfile.length > 0) {
          body.user_image = uploadedProfile[0].file_key;
        }
      }

      await this.services.updateAccountManager(body, body.account_manager_id);
      const getAccountManagerInfo = await this.services.getUserById(
        body.account_manager_id
      );
    

      await updateCometChatUser(body.account_manager_id, {
        name:
          getAccountManagerInfo.first_name +
          " " +
          getAccountManagerInfo.last_name,
        avatar: getAccountManagerInfo.user_image ? process.env.BASE_IMAGE_URL + getAccountManagerInfo.user_image : "",
        metadata: {
          "@private": {
            email: getAccountManagerInfo.email,
            contactNumber: getAccountManagerInfo.phone_number,
          },
        },
      }).then((res) => res.json())
        .then(async (json) => {
          console.log("User updated...", json);
          await this.services.updateAccountManager(
            { cometUserCreated: 1 },
            body.account_manager_id
          );
        })
        .catch((err) => console.error("error in updating User:" + err));

      if(user.role_id == ROLES.ACCOUNTMANAGER) {
        let setAttributes = ["id", "admin_hide_info", "deleted_at"];
        let getPermission = await this.services.getAccountManagerRolePermissions(user.role_permission_id, setAttributes);
        if(getPermission && getPermission.admin_hide_info == 1) {
          getAccountManagerInfo.email = "*****";
          getAccountManagerInfo.phone_number = "*****";
        }
      }

      return res
        .status(201)
        .send(
          successResponse(
            AccountManagerMessages.UPDATE_ACCOUNT_MANAGER,
            getAccountManagerInfo,
            RESPONSE_CODES.POST
          )
        );
    } catch (error) {
      console.log(error, "====error====");
      return res
        .status(500)
        .send(
          errorResponse(CommonMessages.ERROR, null, RESPONSE_CODES.SERVER_ERROR)
        );
    }
  }

  async addAccountManagerInfo(req, res) {
    try {
      const { body, files, user } = req;

      if (!body.first_name) {
        let msg = "First name is required";
        return this.services.errorFunction(req, res, msg);
      }

      if (!body.last_name) {
        let msg = "Last name is required";
        return this.services.errorFunction(req, res, msg);
      }

      if (!body.email) {
        let msg = "Email address is required";
        return this.services.errorFunction(req, res, msg);
      }
      body.email = body.email.toLowerCase();

      // if (!body.address) {
      //   let msg = "Address is required";
      //   return this.services.errorFunction(req, res, msg);
      // }

      if (!body.role_permission_id) {
        let msg = "Role permission id is required";
        return this.services.errorFunction(req, res, msg);
      }

      if (body.zipcode && body.zipcode == "" || body.zipcode == "0" || body.zipcode == "null") {
          body.zipcode = null;
      }

      /** check email exist or not */
      const checkEmail = await this.services.getAccountManagerByMail(
        body.email
      );
      if (checkEmail) {
        return res
          .status(400)
          .send(
            errorResponse(
              AccountManagerMessages.ALREADY_ADDED,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      body.role_id = ROLES.ACCOUNTMANAGER;
      body.added_by = user.id;
      body.status = USER_STATUS.ACTIVE;
      let createManager = await this.services.createAccountManager(body);
      await createCometChatUser(
        body.first_name + " " + body.last_name,
        createManager.id,
        COMETCHATROLES[ROLES.ACCOUNTMANAGER - 1],
        body.email,
        body.phone_number
      )
        .then((res) => res.json())
        .then(async (json) => {
          await this.services.updateAccountManager(
            { cometUserCreated: 1 },
            createManager.id
          );
        })
        .catch((err) => console.error("error in creating Account Manager:" + err));

      if (files && files.length > 0) {
        let sendData = {
          files,
          id: createManager.id,
          folder: "Users",
        };
        let uploadedProfile = await uploadFileForAll(sendData);
        if (uploadedProfile.length > 0) {
          let profiledata = {
            user_image: uploadedProfile[0].file_key,
          };
          await this.services.updateAccountManager(
            profiledata,
            createManager.id
          );

          await updateCometChatUser(createManager.id, {
            avatar: process.env.BASE_IMAGE_URL + profiledata.user_image,
          });
        }
      }

      let message = AccountManagerMessages.ACCOUNT_MANAGER_ADDED;
      if(body.is_welcome_email == 1){
        message = AccountManagerMessages.INVITE_LINK;
        // const token = randomstring.generate(64);

        let getGlobalSetting = await this.Models.GlobalSettings.findOne({
          attributes: ["id", "user_role", "is_authenticate"],
          where: {
            user_role: 7
          },
          raw: true
        });

        const payload = {
          email: body.email,
          password_setting: getGlobalSetting ? getGlobalSetting.is_authenticate: 1
        };
        /** generate token */
        const token = refreshToken(payload);

        await this.Models.Users.update(
          { invite_token: token },
          { where: { email: body.email } }
        );
        const to = body.email.toLowerCase();
        const inviteUserLink = `${process.env.BASE_URL}set-password/${token}`;
        const emailTemplate = await setPassword(inviteUserLink)
        const subject = "Account Manager Invite link";
        let mailFunction = (process.env.PRODUCTION == true || process.env.PRODUCTION == "true") ? nodemailer.sendinBlueMail : nodemailer.sendMail;
        await mailFunction(to, subject, emailTemplate);
      }

      return res
        .status(201)
        .send(
          successResponse(
            message,
            {},
            RESPONSE_CODES.POST
          )
        );
    } catch (error) {
      console.log(error, "====error====");
      return res
        .status(500)
        .send(
          errorResponse(CommonMessages.ERROR, null, RESPONSE_CODES.SERVER_ERROR)
        );
    }
  };



  /* Asign Clients To Account Manager */
  async assignClientsToAccountManagers(req, res) {
    try {
      const { body, user } = req;
      /** check account manager exist or not */
      const getAccountManagerDetails = await this.services.getUserById(
        body.account_manager_id
      );
      if (!getAccountManagerDetails) {
        return res
          .status(400)
          .send(
            errorResponse(
              AccountManagerMessages.ACCOUNT_MANAGER_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      if (body.client_ids.length > 0) {
        const assignClients = [];
        let getClientIds = [...new Set(body.client_ids)];

        for (const i in getClientIds) {
          let getClient = await this.Models.Users.findOne({
            where: {
              id: getClientIds[i],
              deleted_at: null,
              role_id: ROLES.CLIENT
            },
            raw: true,
          });

          if (getClient) {
            let checkAlreadyExist = await this.Models.AssignedUsers.findOne({
              where: {
                account_manager_id: body.account_manager_id,
                user_id: getClient.id,
                deleted_at: null,
              },
              raw: true,
            });
            if (!checkAlreadyExist) {
              assignClients.push({
                user_id: getClientIds[i],
                account_manager_id: body.account_manager_id,
                type: ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER,
                is_default: 0,
                assigned_date: moment(new Date()).unix()
              });
            }
          }
        }
        await this.Models.AssignedUsers.bulkCreate(assignClients);
      }

      // let assignedClientsInfo = [];
      // if (assignedClients.length > 0) {
      //   let allAssignedAccountManagerIds = assignedClients.map(val => val.account_manager_id);
      //   assignedClientsInfo = await this.services.getAssignedAccountManagersById(body.client_id, allAssignedAccountManagerIds);
      // }
      
      return res
        .status(201)
        .send(
          successResponse(
            AccountManagerMessages.CLIENT_ASSINGNED,
            {},
            RESPONSE_CODES.POST
          )
        );
    } catch (error) {
      console.log(error, "=====error===")
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


  /* Asign Agents To Account Manager */
  async assignAgentsToAccountManagers(req, res) {
    try {
      const { body } = req;
      /** check account manager exist or not */
      const getAccountManagerDetails = await this.services.getUserById(
        body.account_manager_id
      );
      if (!getAccountManagerDetails) {
        return res
          .status(400)
          .send(
            errorResponse(
              AccountManagerMessages.ACCOUNT_MANAGER_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      if (body.agent_ids.length > 0) {
        const assignAgents = [];
        let getAgentsIds = [...new Set(body.agent_ids)];

        for (const i in getAgentsIds) {
          let getAgent = await this.Models.Users.findOne({
            where: {
              id: getAgentsIds[i],
              deleted_at: null,
              role_id: ROLES.AGENT
            },
            raw: true,
          });

          if (getAgent) {
            let checkAlreadyExist = await this.Models.AssignedUsers.findOne({
              where: {
                agent_id: getAgent.id,
                account_manager_id: body.account_manager_id,
                type: ASSIGNED_USERS.AGENTS_TO_ACCOUNT_MANAGER,
                deleted_at: null,
              },
              raw: true,
            });
            if (!checkAlreadyExist) {
              assignAgents.push({
                agent_id: getAgentsIds[i],
                account_manager_id: body.account_manager_id,
                type: ASSIGNED_USERS.AGENTS_TO_ACCOUNT_MANAGER,
                is_default: 0,
                assigned_date: moment(new Date()).unix()
              });
            }
          }
        }
        await this.Models.AssignedUsers.bulkCreate(assignAgents);
      }
      return res
        .status(201)
        .send(
          successResponse(
            AccountManagerMessages.AGENT_ASSINGNED,
            {},
            RESPONSE_CODES.POST
          )
        );
    } catch (error) {
      console.log(error, "=====error===")
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




  // Agent list for Account Manager
  async accountManagerAgentList(req, res) {
    try {
      const { query, user } = req;
      if (!query.account_Manager_id) {
        let msg = "Account manager id is required.";
        return this.services.errorFunction(req, res, msg);
      }

      if ((query.account_Manager_id != "")) {
        const getAccountManagerDetails = await this.services.getUserById(
          query.account_Manager_id
        );
        if (!getAccountManagerDetails) {
          return res
            .status(400)
            .send(
              errorResponse(
                AccountManagerMessages.ACCOUNT_MANAGER_NOT_FOUND,
                null,
                RESPONSE_CODES.BAD_REQUEST
              )
            );
        }
      }

      const getAllAgentList = await this.services.getAllAssignedAgentList(query, user);
      return res
        .status(200)
        .send(
          successResponse(
            AccountManagerMessages.GET_DATA,
            getAllAgentList,
            RESPONSE_CODES.GET
          )
        );
    } catch (error) {
      console.log(error, "===error===")
      return res
        .status(500)
        .send(
          errorResponse(CommonMessages.ERROR, null, RESPONSE_CODES.SERVER_ERROR)
        );
    }
  }

}
