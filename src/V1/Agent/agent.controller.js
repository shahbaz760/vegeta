require("dotenv").config();
import Services from "./agent.services.js";
import AuthServices from "../Auth/auth.services.js";
import { RESPONSE_CODES, ROLES, AGENT_PROFILE_COMPLETE_STATUS, COMETCHATROLES, USER_STATUS, ASSIGNED_USERS } from "../../../config/constants.js";
import {
  successResponse,
  errorResponse,
} from "../../../config/responseHelper.js";
import { CommonMessages } from "../../../constants/message/common";
import { AgentMessages } from "../../../constants/message/agent";
import nodemailer from "../helpers/mail";
import randomstring from "randomstring";
import moment from "moment";
import fs from "fs";
import { uploadFileForAll, s3RemoveSingleFile, s3RemoveMultipleFiles, createCometChatUser, updateCometChatUser } from "../helpers/commonFunction";
import {setPassword} from "../EmailTemplates/set_password.js"
import { refreshToken } from "../helpers/jwt";

import { kycApproved } from "../EmailTemplates/kyc_approved.js"
import { kycRejected } from "../EmailTemplates/kyc_rejected.js"


export default class agent {
  async init(db) {
    this.services = new Services();
    this.AuthServices = new AuthServices();
    this.Models = db.models;
    await this.services.init(db);
    await this.AuthServices.init(db);
  }

  /* add Agent */
  async addAgent(req, res) {
    try {
      const { body, user, files } = req;
      /** check email exist or not */

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
   
      if (!body.address) {
        let msg = "Address is required";
        return this.services.errorFunction(req, res, msg);
      }

      const checkEmail = await this.services.getAgentByMail(body.email);
      if (checkEmail) {
        return res
          .status(400)
          .send(
            errorResponse(
              AgentMessages.AGENT_ALREADY_ADDED,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      body.is_verified = 0;
      body.role_id = ROLES.AGENT;
      body.added_by = user.id;
      body.is_complete_profile = 0;
      body.status = USER_STATUS.PENDING;

      const newAgent = await this.services.createAgent(body);
      await createCometChatUser(
        body.first_name + " " + body.last_name,
        newAgent.id,
        COMETCHATROLES[ROLES.AGENT - 1],
        body.email,
        body.phone_number
      )
        .then((res) => res.json())
        .then(async (json) => {
          await this.services.updateAgentDetail(
            { cometUserCreated: 1 },
            newAgent.id
          );
        })
        .catch((err) => console.error("error in creating Agent:" + err));
      if (files && files.profile_picture && files.profile_picture.length > 0) {

          let sendData = {
            files: files.profile_picture,
            id: newAgent.id,
            folder: 'Users'
          }
          let uploadedProfile = await uploadFileForAll(sendData);
          if(uploadedProfile.length > 0) {
            let profileImage  = {
              user_image: uploadedProfile[0].file_key
            };
            await this.services.updateAgentDetail(profileImage, newAgent.id);
            await updateCometChatUser(newAgent.id, {
              avatar: process.env.BASE_IMAGE_URL + profileImage.user_image,
            });
          }
      }

      if (files && files.files && files.files.length > 0) {
          let sendData = {
            files: files.files,
            id: newAgent.id,
            folder: 'Agent-Attachmets'
          }
          const uploadedImage = await uploadFileForAll(sendData);
          if(uploadedImage.length > 0) {
            let whereData = {
              added_by: user.id,
              agent_id: newAgent.id,
            }
            await this.services.addAttachments(uploadedImage, whereData)
        }
      }

      let message = AgentMessages.AGENT_ADDED;
      if(body.is_welcome_email == 1){
        message = AgentMessages.INVITE_LINK;
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
        const subject = "Agent Invite link";
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
      console.log(error, "====error====")
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

  /* Get agent Detail */
  async getAgent(req, res) {
    try {
      const { params, user} = req;
      let whereCondition = {
        id: params.agent_id,
        role_id: ROLES.AGENT,
      };
      const getAgentDetail = await this.services.getAgentDetailByAgentId(whereCondition, user);
      if (!getAgentDetail) {
        return res
          .status(400)
          .send(
            errorResponse(
              AgentMessages.AGENT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
          
      };

      if(user.role_id == ROLES.ACCOUNTMANAGER) {
        let setAttributes = ["id", "agent_view", "agent_hide_info", "deleted_at"];
        let getPermission = await this.services.getAccountManagerRolePermissions(user.role_permission_id, setAttributes);
        if(getPermission && getPermission.agent_view == 1) {
          let getAllClientOfAgents = await this.Models.AssignedUsers.findAll({
            attribute: ["id", "type", "user_id", "agent_id", "account_manager_id", "deleted_at"],
            where: {
              account_manager_id: user.id,
              type: [ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER, ASSIGNED_USERS.AGENTS_TO_ACCOUNT_MANAGER],
              deleted_at: null
            },
            raw: true,
          });
          let getClientIds = getAllClientOfAgents.map(val => val.user_id);
          let getAgentsAccess = await this.Models.AssignedUsers.findOne({
            attribute: ["id", "type", "user_id", "agent_id", "deleted_at"],
            where: {
              agent_id: params.agent_id,
              user_id: getClientIds,
              type: ASSIGNED_USERS.CLIENTS_TO_AGENT,
              deleted_at: null
            },
            raw: true,
          });

          let checkOwnAgentsAccess = await this.Models.AssignedUsers.findOne({
            attribute: ["id", "type", "user_id", "agent_id", "deleted_at"],
            where: {
              agent_id: params.agent_id,
              account_manager_id: user.id,
              type: ASSIGNED_USERS.AGENTS_TO_ACCOUNT_MANAGER,
              deleted_at: null
            },
            raw: true,
          });

          if(!getAgentsAccess && !checkOwnAgentsAccess) {
            return res
            .status(400)
            .send(
              errorResponse(
                AgentMessages.AGENT_NOT_ACCESS,
                null,
                RESPONSE_CODES.BAD_REQUEST
              )
            );
          }
        }
        if(getPermission && getPermission.agent_hide_info == 1) {
          getAgentDetail.email = "*****";
          getAgentDetail.phone_number = "*****";
        }
      }

      const getAgentAccessData = await this.services.getAgentAccess(params.agent_id, user);
      getAgentDetail.dataValues.is_delete_access = getAgentAccessData.is_delete_access;
      getAgentDetail.dataValues.is_edit_access = getAgentAccessData.is_edit_access;
      return res
        .status(200)
        .send(
          successResponse(AgentMessages.GET_DATA, getAgentDetail, RESPONSE_CODES.GET)
        );
    } catch (error) {
      console.log(error, "=====error======")
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

  /* agents's list */
  async agentList(req, res) {
    try {
      const { body, user } = req;
      const list = await this.services.getAgentList(body, user);
      return res
        .status(200)
        .send(
          successResponse(AgentMessages.GET_LIST, list, RESPONSE_CODES.GET)
        );
    } catch (error) {
      console.log(error, "==error===")
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

   /* add Agent  Group*/
  async addAgentGroup(req, res) {
    try {
      const { body, user } = req;
      /** check group name exist or not */
      const checkGroup = await this.services.getAgentGroupByName(body.group_name);
      if (checkGroup) {
        return res
          .status(400)
          .send(
            errorResponse(
              AgentMessages.GROUP_NAME_ALREADY_ADDED,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      body.user_id = user.id;
      await this.services.createAgentGroup(body);
      return res
        .status(201)
        .send(
          successResponse(
            AgentMessages.GROUP_ADDED,
            {},
            RESPONSE_CODES.POST
          )
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


  /* agents's Group list */
  async agentGroupList(req, res) {
    try {
      const { body, user } = req;
      const getGroupList = await this.services.getAgentGroupList(body, user);
      return res
        .status(200)
        .send(
          successResponse(AgentMessages.GET_LIST, getGroupList, RESPONSE_CODES.GET)
        );
    } catch (error) {
      console.log(error, "====error=====");
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


  /* add Agents in Group*/
  async addMemberInAgentGroup(req, res) {
    try {
      const { body, user } = req;
      /** check group exist or not */
      const checkGroup = await this.services.getAgentGroupById(body.group_id);
      if (!checkGroup) {
        return res
          .status(400)
          .send(
            errorResponse(
              AgentMessages.GROUP_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      let memberids = [];
      body.user_id = user.id;
      if(body.agent_ids.length > 0) {
        const groupMemberData = [];
        let groupMembers = [...new Set(body.agent_ids)];
        for (const i in groupMembers) {
          let getGroupMember = await this.Models.AgentGroupMembers.findOne({
            where: {
              user_id: groupMembers[i],
              agent_group_id: body.group_id,
              deleted_at: null
            },
            raw: true,
          });
          if(!getGroupMember){
            groupMemberData.push({
              agent_group_id: body.group_id,
              user_id: groupMembers[i],
            });
          }
        }
        memberids = await this.Models.AgentGroupMembers.bulkCreate(groupMemberData);
      }

      if(body.delete_agent_ids.length > 0) {
        await this.Models.AgentGroupMembers.update({
          deleted_at: moment(new Date()).unix(),
        },{
          where: {
            agent_group_id: body.group_id,
            user_id: body.delete_agent_ids,
          },
          raw: true,
        });
      }

      let membersInfo = [];
      if(memberids.length > 0){
        let allMemberIds = memberids.map(val => val.id);
        membersInfo = await this.services.getGroupMembersByMemberId(allMemberIds);
      }
      return res
        .status(201)
        .send(
          successResponse(
            AgentMessages.GROUP_MEMBER_ADDED,
            membersInfo,
            RESPONSE_CODES.POST
          )
        );
  } catch (error) {
    console.log(error, "===error===")
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



  /* edit Agent group and members */
  async editAgentGroup(req, res) {
    try {
      const { body, user } = req;

      /** check group exist or not */
      const checkGroup = await this.services.getAgentGroupById(body.group_id);
      if (!checkGroup) {
        return res
          .status(400)
          .send(
            errorResponse(
              AgentMessages.GROUP_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      /** check group name already exist or not */
      const checkGroupName = await this.services.checkAgentGroupNameById(body.group_name, body.group_id);
      if (checkGroupName) {
        return res
          .status(400)
          .send(
            errorResponse(
              AgentMessages.GROUP_NAME_ALREADY_ADDED,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      let groupInfo = {
        group_name: body.group_name,
      };

      await this.services.updateAgentGroup(groupInfo, body.group_id)
      body.user_id = user.id;
      if(body.agent_ids.length > 0) {
        const groupMemberData = [];
        let groupMembers = [...new Set(body.agent_ids)];
        for (const i in groupMembers) {
          let getGroupMember = await this.Models.AgentGroupMembers.findOne({
            where: {
              user_id: groupMembers[i],
              deleted_at: null
            },
            raw: true,
          });
          if(!getGroupMember){
            groupMemberData.push({
              agent_group_id: body.group_id,
              user_id: groupMembers[i],
            });
          }
        }
        await this.Models.AgentGroupMembers.bulkCreate(groupMemberData);
      }

      if(body.delete_agent_ids.length > 0) {
          await this.Models.AgentGroupMembers.update({
            deleted_at: moment(new Date()).unix(),
          },{
            where: {
              agent_group_id: body.group_id,
              user_id: body.delete_agent_ids,
            },
            raw: true,
          });
      }
      return res
        .status(201)
        .send(
          successResponse(
            AgentMessages.GROUP_UPDATE,
            {},
            RESPONSE_CODES.POST
          )
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



  /* delete agent Group */
  async deleteAgentGroup(req, res) {
    try {
      const { body } = req;
      /** check group exist or not */
      const checkGroup = await this.services.getAgentGroupById(body.group_id);
      if (!checkGroup) {
        return res
          .status(400)
          .send(
            errorResponse(
              AgentMessages.GROUP_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      const updateData = {
        deleted_at: moment(new Date()).unix(),
      };
      await this.services.updateAgentGroup(updateData, body.group_id);
      await this.Models.AgentGroupMembers.update({
        deleted_at: moment(new Date()).unix(),
      },{
        where: {
          agent_group_id: body.group_id,
        },
        raw: true,
      });
      return res
        .status(200)
        .send(
          successResponse(AgentMessages.GROUP_DELETE, {}, RESPONSE_CODES.POST)
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




  /* get Agent group detail */
  async agentGroupDetail(req, res) {
    try {
      const { params, user } = req;

      /** check group exist or not */
      const getGroupInfo = await this.services.getAgentGroupInfo(params.group_id, user);
      if (!getGroupInfo) {
        return res
          .status(400)
          .send(
            errorResponse(
              AgentMessages.GROUP_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      return res
        .status(201)
        .send(
          successResponse(
            AgentMessages.GET_DATA,
            getGroupInfo,
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


  /* upload attachments */
  async uploadAttachments(req, res) {
    try {
      const { body, user, files } = req;
      /** check email exist or not */
      let getAllAttachments = [];
      if (!body.agent_id) {
        let msg = "Agent is required";
        return this.services.errorFunction(req, res, msg);
      }

      let whereCondition = {
        id: body.agent_id,
        role_id: ROLES.AGENT,
        deleted_at: null,
      }
      const getAgentDetail = await this.services.getAgentInformation(whereCondition);
      if (!getAgentDetail) {
        return res
          .status(400)
          .send(
            errorResponse(
              AgentMessages.AGENT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      if (files.length == 0) {
        let msg = "Attachments is required";
        return this.services.errorFunction(req, res, msg);
      }

      if (files && files.length > 0) {
        let sendData = {
          files,
          id: body.agent_id,
          folder: 'Agent-Attachmets'
        }
        const uploadedImage = await uploadFileForAll(sendData);
        if(uploadedImage.length > 0) {
          let whereData = {
            added_by: user.id,
            agent_id: body.agent_id,
          }
          getAllAttachments = await this.services.addAttachments(uploadedImage, whereData)
        }
      }

      return res
        .status(201)
        .send(
          successResponse(
            AgentMessages.AGENT_ATTACHMENT_ADDED,
            getAllAttachments,
            RESPONSE_CODES.POST
          )
        );
    } catch (error) {
      console.log(error, "====error====")
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


  /* delete Agent attachment */
  async deleteAgentAttachment(req, res) {
    try {
      const { body } = req;
      /** check group exist or not */
      const checkAttachment = await this.services.getAttachmentById(body.attachment_id);
      if (!checkAttachment) {
        return res
          .status(400)
          .send(
            errorResponse(
              AgentMessages.ATTACHMENT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      const updateData = {
        deleted_at: moment(new Date()).unix(),
      };
      await this.services.updateAgentAttachment(updateData, body.attachment_id);
      await s3RemoveSingleFile(checkAttachment.file);
      return res
        .status(200)
        .send(
          successResponse(AgentMessages.ATTACHMENT_DELETE, {}, RESPONSE_CODES.POST)
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



    /* edit Agent info */
    async editAgent(req, res) {
      try {
        const { body, files, user } = req;

        if (!body.agent_id) {
          let msg = "Agent id is required";
          return this.services.errorFunction(req, res, msg);
        }

        if (!body.first_name) {
          let msg = "First name is required";
          return this.services.errorFunction(req, res, msg);
        }
  
        if (!body.last_name) {
          let msg = "Last name is required";
          return this.services.errorFunction(req, res, msg);
        }

        if (!body.address) {
          let msg = "Address is required";
          return this.services.errorFunction(req, res, msg);
        }

        let whereCondition = {
          id: body.agent_id,
          role_id: ROLES.AGENT,
          deleted_at: null,
        }
        /** check agent exist or not */
        const getAgentDetail = await this.services.getAgentInformation(whereCondition);
        if (!getAgentDetail) {
          return res
            .status(400)
            .send(
              errorResponse(
                AgentMessages.AGENT_NOT_FOUND,
                null,
                RESPONSE_CODES.BAD_REQUEST
              )
            );
        }

        if(body.email && body.email == "*****") {
          body.email = getAgentDetail.email;
        }

        if(body.phone_number && body.phone_number == "*****") {
          body.phone_number = getAgentDetail.phone_number;
        }

        if (files && files.length > 0) {

          if(getAgentDetail.user_image) {
            await s3RemoveSingleFile(getAgentDetail.user_image);
          }
          let sendData = {
            files: files,
            id: body.agent_id,
            folder: 'Users'
          }
          let uploadedProfile = await uploadFileForAll(sendData);
          if(uploadedProfile.length > 0) {
              body.user_image = uploadedProfile[0].file_key
          }
        }

        await this.services.updateAgentDetail(body, body.agent_id);
        const getAgentInfo = await this.services.getAgentDetailByAgentId(whereCondition, user);
        const getAgentAccessData = await this.services.getAgentAccess(body.agent_id, user);
        getAgentInfo.dataValues.is_delete_access = getAgentAccessData.is_delete_access;
        getAgentInfo.dataValues.is_edit_access = getAgentAccessData.is_edit_access;

        if(user.role_id == ROLES.ACCOUNTMANAGER) {
          let setAttributes = ["id", "agent_view", "agent_hide_info", "deleted_at"];
          let getPermission = await this.services.getAccountManagerRolePermissions(user.role_permission_id, setAttributes);
          if(getPermission && getPermission.agent_hide_info == 1) {
            getAgentInfo.email = "*****";
            getAgentInfo.phone_number = "*****";
          }
        }

        await updateCometChatUser(body.agent_id, {
          name: getAgentInfo.first_name + " " + getAgentInfo.last_name,
          avatar: getAgentInfo.user_image ? process.env.BASE_IMAGE_URL + getAgentInfo.user_image : "",
          metadata: {
            "@private": {
              email: getAgentInfo.email,
              contactNumber: getAgentInfo.phone_number,
            },
          },
        }).then((res) => res.json())
          .then(async (json) => {
          })
          .catch((err) => console.error("error in updating agent:" + err));
        

        return res
          .status(201)
          .send(
            successResponse(
              AgentMessages.AGENT_UPDATE,
              getAgentInfo,
              RESPONSE_CODES.POST
            )
          );
    } catch (error) {
      console.log(error, "======error====")
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


  /* delete Agent group member */
  async deleteAgentGroupMember(req, res) {
    try {
      const { body } = req;
      /** check member exist or not */
      const checkMember = await this.services.getGroupMemberById(body.member_id);
      if (!checkMember) {
        return res
          .status(400)
          .send(
            errorResponse(
              AgentMessages.GROUP_MEMBER_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      const updateData = {
        deleted_at: moment(new Date()).unix(),
      };
      await this.services.updateAgentGroupMemberDetail(updateData, body.member_id);
      return res
        .status(200)
        .send(
          successResponse(AgentMessages.GROUP_MEMBER_DELETE, {}, RESPONSE_CODES.POST)
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

    /* get Agent group memebers list */
    async agentGroupMemeberList(req, res) {
      try {
        const {body, user } = req;
        /** check group exist or not */
        const getGroupInfo = await this.services.getAgentGroupMemberList(body.group_id,body, user);
        if (!getGroupInfo) {
          return res
            .status(400)
            .send(
              errorResponse(
                AgentMessages.GROUP_NOT_FOUND,
                null,
                RESPONSE_CODES.BAD_REQUEST
              )
            );
        }
  
        return res
          .status(201)
          .send(
            successResponse(
              AgentMessages.GET_DATA,
              getGroupInfo,
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



  /* upload KYC */
  async uploadKyc(req, res) {
    try {
      const { user, files } = req;
      /** check email exist or not */

      if(user.is_complete_profile < AGENT_PROFILE_COMPLETE_STATUS.DOCUSIGN_COMPLETE){
        let msg = "Please complete your docusign first.";
        return this.services.errorFunction(req, res, msg);
      }

      if(user.is_complete_profile >= AGENT_PROFILE_COMPLETE_STATUS.COMPLETE_KYC){
        let msg = "You already upload your kyc detail.";
        return this.services.errorFunction(req, res, msg);
      }

      let updateAgentKyc = {}
      if (!files) {
        let msg = "Front id is required";
        return this.services.errorFunction(req, res, msg);
      }
      if (files && !files.front_id) {
        let msg = "Front id is required";
        return this.services.errorFunction(req, res, msg);
      }

      if (files && !files.back_id) {
        let msg = "Back id is required";
        return this.services.errorFunction(req, res, msg);
      }

      if (files && files.front_id && files.front_id.length > 0) {
          let sendData = {
            files: files.front_id,
            id: user.id,
            folder: 'Agent-Attachmets'
          }
        let uploadFrontKyc = await uploadFileForAll(sendData);
        if(uploadFrontKyc.length > 0) {
            updateAgentKyc.kyc_front_pic = uploadFrontKyc[0].file_key
        }
      }

      if (files && files.back_id && files.back_id.length > 0) {

        let sendData = {
          files: files.back_id,
          id: user.id,
          folder: 'Agent-Attachmets'
        }
        let uploadBackKyc = await uploadFileForAll(sendData);
        if(uploadBackKyc.length > 0) {
            updateAgentKyc.kyc_back_pic = uploadBackKyc[0].file_key
        }
      }
      updateAgentKyc.is_complete_profile = AGENT_PROFILE_COMPLETE_STATUS.COMPLETE_KYC;
      await this.services.updateAgentDetail(updateAgentKyc, user.id)
      return res
        .status(201)
        .send(
          successResponse(
            AgentMessages.KYC_UPLOADED,
            {},
            RESPONSE_CODES.POST
          )
        );
    } catch (error) {
      console.log(error, "====error====")
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


  /* upload Capture Image */
  async uploadCaptureImage(req, res) {
    try {
      const { user, files } = req;
      /** check email exist or not */

      if(user.is_complete_profile < AGENT_PROFILE_COMPLETE_STATUS.COMPLETE_KYC){
        let msg = "Please complete your kyc first.";
        return this.services.errorFunction(req, res, msg);
      }

      if(user.is_complete_profile >= AGENT_PROFILE_COMPLETE_STATUS.COMPLETE_CAPTURE){
        let msg = "You already upload your captured image.";
        return this.services.errorFunction(req, res, msg);
      }

      let updateAgentCaptureImage = {}
      if (!files) {
        let msg = "Capture image is required";
        return this.services.errorFunction(req, res, msg);
      }

      if (files && files.length > 0) {
        let sendData = {
          files: files,
          id: user.id,
          folder: 'Agent-Attachmets'
        }
        let uploadCaptureImage = await uploadFileForAll(sendData);
        if(uploadCaptureImage.length > 0) {
          updateAgentCaptureImage.captured_pic = uploadCaptureImage[0].file_key
        }
      }

      updateAgentCaptureImage.is_complete_profile = AGENT_PROFILE_COMPLETE_STATUS.COMPLETE_CAPTURE;
      await this.services.updateAgentDetail(updateAgentCaptureImage, user.id)
      return res
        .status(201)
        .send(
          successResponse(
            AgentMessages.CAPTURE_IMAGE_UPLOADED,
            {},
            RESPONSE_CODES.POST
          )
        );
    } catch (error) {
      console.log(error, "====error====")
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

    /* Docusign completed */
    async docusignCompleted(req, res) {
      try {
        const { params, query } = req;

        if(query.envelopId) {
          let getEnvelope = await this.AuthServices.getDosusignEnvelop(query.envelopId);

          if(getEnvelope.status == "completed") {
            let updateAgentDocusign = {
              is_complete_profile: AGENT_PROFILE_COMPLETE_STATUS.DOCUSIGN_COMPLETE,
            }
            await this.services.updateAgentDetail(updateAgentDocusign ,params.agent_id);
            // res.redirect(`${process.env.BASE_URL}kyc`);
    
            let getAgent = await this.services.getAgentByAgentId(params.agent_id);
    
            const loginTime = moment(new Date()).unix();
            const payload = {
              id: getAgent.id,
              role_id: getAgent.role_id,
              first_name: getAgent.first_name,
              last_name: getAgent.last_name,
              email: getAgent.email,
              login_time: loginTime,
            };
      
            let createData = { 
              user_id: getAgent.id, 
              login_time: loginTime ,
            };
            await this.services.createLoginTime(createData);
            const token = refreshToken(payload);
            res.redirect(`${process.env.BASE_URL}kyc-doc/${token}`);
          }else {
            res.redirect(`${process.env.BASE_URL}`);
          }
        }
      } catch (error) {
        console.log(error, "=====error======");
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
        const { user } = req;
        /** check group exist or not */
        const getUsersIds = await this.services.getAssignedUserIdForAdminUser(user.id, user.role_id, user.added_by,user);
        return res
          .status(201)
          .send(
            successResponse(
              AgentMessages.GET_DATA,
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



  /* complete Profile */
  async completeProfile(req, res) {
    try {
      const { user } = req;

      if(user.is_complete_profile < AGENT_PROFILE_COMPLETE_STATUS.COMPLETE_CAPTURE){
        let msg = "Please upload your capture image first.";
        return this.services.errorFunction(req, res, msg);
      }

      if(user.is_complete_profile >= AGENT_PROFILE_COMPLETE_STATUS.COMPLETE_PROFILE){
        let msg = "You already completed your profile.";
        return this.services.errorFunction(req, res, msg);
      }
      let completeProfile = {
        is_complete_profile: AGENT_PROFILE_COMPLETE_STATUS.COMPLETE_PROFILE,
        // status: USER_STATUS.ACTIVE,
      }
      
      await this.services.updateAgentDetail(completeProfile, user.id)
      return res
        .status(201)
        .send(
          successResponse(
            AgentMessages.PROFILE_COMPLETE,
            {},
            RESPONSE_CODES.POST
          )
        );
    } catch (error) {
      console.log(error, "====error====")
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


  /* assigned client list */
  async assignedClientList(req, res) {
    try {
      const { body, user } = req;
      const list = await this.services.getAssignedClientList(body, user);
      return res
        .status(200)
        .send(
          successResponse(AgentMessages.GET_LIST, list, RESPONSE_CODES.GET)
        );
    } catch (error) {
      console.log(error, "==error===")
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

  /* Agent Recent Activity List */
  async recentActivityListForAgent(req, res) {
    try {
      const { user, body } = req;
      let getAgentRecentActivity = await this.services.getAgentRecentActitvity(user.id);
      return res
        .status(200)
        .send(
          successResponse(AgentMessages.GET_LIST, getAgentRecentActivity, RESPONSE_CODES.GET)
        );
    } catch (error) {
      console.log(error, "====error===");
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


  /* agent profile aprove reject*/
  async agentApproveReject(req, res) {
    try {
      const { body, user } = req;
      const getAgentDetail = await this.services.getAgentByAgentId(body.agent_id);
      if (!getAgentDetail) {
        return res
          .status(400)
          .send(
            errorResponse(
              AgentMessages.AGENT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      };

      if (getAgentDetail && getAgentDetail.deleted_at !=null) {
        return res
          .status(400)
          .send(
            errorResponse(
              AgentMessages.AGENT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      };

      if (getAgentDetail && getAgentDetail.is_complete_profile == 5) {
        return res
          .status(400)
          .send(
            errorResponse(
              `${AgentMessages.AGENT_STATUS_ALREADY} rejected.`,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      };

      if (getAgentDetail && getAgentDetail.is_complete_profile == 6) {
        return res
          .status(400)
          .send(
            errorResponse(
              `${AgentMessages.AGENT_STATUS_ALREADY} approved.`,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      };

      if(getAgentDetail.is_complete_profile < AGENT_PROFILE_COMPLETE_STATUS.COMPLETE_CAPTURE){
        let msg = "Please upload your capture image first.";
        return this.services.errorFunction(req, res, msg);
      }

      let approveRejectStatus = {
        is_complete_profile: body.status == 1 ? AGENT_PROFILE_COMPLETE_STATUS.APPROVE : AGENT_PROFILE_COMPLETE_STATUS.REJECT,
        reject_reason: body.reject_reason,
        status: body.status == 1 ? USER_STATUS.ACTIVE : USER_STATUS.PENDING,
      };
      await this.services.updateAgentDetail(approveRejectStatus, body.agent_id);
      let message = body.status == 1 ? "KYC approved successfully." : "KYC rejected successfully";
      const getUpdatedAgentDetail = await this.services.getAgentByAgentId(body.agent_id);
      const to = getUpdatedAgentDetail.email;
      let emailTemplate;
      let subject;
      if(body.status == 1) {
        emailTemplate = await kycApproved(getUpdatedAgentDetail)
        subject = "Congratulations! Your KYC Has Been Approved.";
      }else {
        emailTemplate = await kycRejected(getUpdatedAgentDetail)
        subject = "Action Required: KYC Rejected.";
      }
      let mailFunction = (process.env.PRODUCTION == true || process.env.PRODUCTION == "true") ? nodemailer.sendinBlueMail : nodemailer.sendMail;
      await mailFunction(to, subject, emailTemplate);


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
      console.log(error, "====error====")
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


  /* update KYC detail */
  async updateKycDetail(req, res) {
    try {
      const { body, user, files } = req;
      /** check email exist or not */
      let getUserDetail = await this.services.getAgentByAgentId(user.id);
      if(user.is_complete_profile == AGENT_PROFILE_COMPLETE_STATUS.REJECT){

        let updateAgentKyc = {};
        let deleteFiles = [];
        if (files && files.front_id && files.front_id.length > 0) {
            let sendData = {
              files: files.front_id,
              id: user.id,
              folder: 'Agent-Attachmets'
            }
          let uploadFrontKyc = await uploadFileForAll(sendData);
          if(uploadFrontKyc.length > 0) {
              updateAgentKyc.kyc_front_pic = uploadFrontKyc[0].file_key
          }
          if(getUserDetail.kyc_front_pic) {
            deleteFiles.push(getUserDetail.kyc_front_pic);
          }
        }
  
        if (files && files.back_id && files.back_id.length > 0) {
          let sendData = {
            files: files.back_id,
            id: user.id,
            folder: 'Agent-Attachmets'
          }
          let uploadBackKyc = await uploadFileForAll(sendData);
          if(uploadBackKyc.length > 0) {
              updateAgentKyc.kyc_back_pic = uploadBackKyc[0].file_key
          }
          if(getUserDetail.kyc_back_pic) {
            deleteFiles.push(getUserDetail.kyc_back_pic);
          }
        }


        if (files && files.captured_pic && files.captured_pic.length > 0) {
          let sendData = {
            files: files.captured_pic,
            id: user.id,
            folder: 'Agent-Attachmets'
          }
          let uploadBackKyc = await uploadFileForAll(sendData);
          if(uploadBackKyc.length > 0) {
              updateAgentKyc.captured_pic = uploadBackKyc[0].file_key
          }
          if(getUserDetail.captured_pic) {
            deleteFiles.push(getUserDetail.captured_pic);
          }
        }

        if(deleteFiles.length > 0) {
          await s3RemoveMultipleFiles(deleteFiles);
        }
        if(body.is_finalized == 1){
          updateAgentKyc.is_complete_profile = AGENT_PROFILE_COMPLETE_STATUS.COMPLETE_CAPTURE;
        }
        await this.services.updateAgentDetail(updateAgentKyc, user.id);
        return res
          .status(201)
          .send(
            successResponse(
              AgentMessages.KYC_DETAIL_UPDATED,
              {},
              RESPONSE_CODES.POST
            )
          );
      }else {
        let msg = "If your KYC rejected then you can upload again documents otherwise firstly send your detail to review.";
        return this.services.errorFunction(req, res, msg);
      }

    } catch (error) {
      console.log(error, "====error====")
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


    /* Get agent Client List */
    async getAgentClients(req, res) {
      try {
        const { params, query, user} = req;
        let whereCondition = {
          id: params.agent_id,
          role_id: ROLES.AGENT,
        };
        const getAgentDetail = await this.services.getAgentDetailByAgentId(whereCondition, user);
        if (!getAgentDetail) {
          return res
            .status(400)
            .send(
              errorResponse(
                AgentMessages.AGENT_NOT_FOUND,
                null,
                RESPONSE_CODES.BAD_REQUEST
              )
            );
            
        };
        const getAgentAccessData = await this.services.getAgentAccess(params.agent_id, user);
        getAgentDetail.dataValues.is_delete_access = getAgentAccessData.is_delete_access;
        getAgentDetail.dataValues.is_edit_access = getAgentAccessData.is_edit_access;
        return res
          .status(200)
          .send(
            successResponse(AgentMessages.GET_DATA, getAgentDetail, RESPONSE_CODES.GET)
          );
      } catch (error) {
        console.log(error, "=====error======")
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


  /* Add agent node */
  async addNoteForAgent(req, res) {
  try {
    const { body, user} = req;
    body.added_by = user.id;
    const getAgentDetail = await this.services.getUserDetail(body.agent_id);
    if (!getAgentDetail) {
      return res
        .status(400)
        .send(
          errorResponse(
            AgentMessages.AGENT_NOT_FOUND,
            null,
            RESPONSE_CODES.BAD_REQUEST
          )
        );
    };
    let createNote = await this.services.createAgentNote(body);
    return res
      .status(200)
      .send(
        successResponse(AgentMessages.NOTE_CREATED, createNote, RESPONSE_CODES.POST)
      );
  } catch (error) {
    console.log(error, "=====error======")
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



  /* get Notes OF Agent */
  async getNotesOFAgent(req, res) {
    try {
      const { body, user } = req;
      const getAgentDetail = await this.services.getUserDetail(body.agent_id);
      if (!getAgentDetail) {
        return res
          .status(400)
          .send(
            errorResponse(
              AgentMessages.AGENT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      };
      const list = await this.services.getAllAgentNotes(body, user);
      return res
        .status(200)
        .send(
          successResponse(AgentMessages.GET_LIST, list, RESPONSE_CODES.GET)
        );
    } catch (error) {
      console.log(error, "==error===")
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



  /* edit agent node */
  async editNoteForAgent(req, res) {
    try {
      const { body, params, user} = req;
      const getNoteDetail = await this.services.getNoteDetail(params.note_id);
      if (!getNoteDetail) {
        return res
          .status(400)
          .send(
            errorResponse(
              AgentMessages.NOTE_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      };
      let updatedData = {
        note: body.note,
      }
      await this.services.updateAgentNote(params.note_id, updatedData);
      let getUpdatedNote = await this.services.getNoteDetail(params.note_id);
      return res
        .status(200)
        .send(
          successResponse(AgentMessages.NOTE_UPDATED, getUpdatedNote, RESPONSE_CODES.PUT)
        );
    } catch (error) {
      console.log(error, "=====error======")
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


  /* delete agent node */
  async deleteNoteForAgent(req, res) {
    try {
      const { params } = req;
      const getNoteDetail = await this.services.getNoteDetail(params.note_id);
      if (!getNoteDetail) {
        return res
          .status(400)
          .send(
            errorResponse(
              AgentMessages.NOTE_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      };
      let updatedData = {
        deleted_at: moment(new Date()).unix(),
      }
      await this.services.updateAgentNote(params.note_id, updatedData);
      return res
        .status(200)
        .send(
          successResponse(AgentMessages.NOTE_DELETED, {}, RESPONSE_CODES.DELETE)
        );
    } catch (error) {
      console.log(error, "=====error======")
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

  

}
