require("dotenv").config();
import Services from "./client.services.js";
import AuthServices from "../Auth/auth.services.js";
import { verifyToken } from "../../V1/helpers/jwt.js";
import { RESPONSE_CODES, ROLES, ASSIGNED_USERS, STRIPE_ERROR, COMETCHATROLES, USER_STATUS, AGENT_PROFILE_COMPLETE_STATUS, SUBSCRIPTION_LOGID, RECENT_ACTIVITY_TYPE } from "../../../config/constants.js";
import {
  successResponse,
  errorResponse,
} from "../../../config/responseHelper.js";
import { CommonMessages } from "../../../constants/message/common";
import { ClientMessages } from "../../../constants/message/client";
import nodemailer from "../helpers/mail";
import randomstring from "randomstring";
import moment from "moment";
import fs from "fs";
import path from "path";
import { uploadFileForAll, s3RemoveSingleFile, createCometChatUser, updateCometChatUser, deleteCometChatUser, createCometChatGroupMembers, removeCometChatGroupMembers, deleteUserAndItsRecords,  deleteUserAndItsRecordsClass, uploadPrivateFile, generatePresignedUrl, uploadPdfToS3
} from "../helpers/commonFunction";
import sequelize from 'sequelize';
const Op = sequelize.Op;
import { docusign } from "../EmailTemplates/docusign.js";
import { refreshToken } from "../helpers/jwt";
const { convert } = require('html-to-text');
import { setPassword } from "../EmailTemplates/set_password.js"
import { resetPassword } from "../EmailTemplates/reset_password.js"

import { addSubscription } from "../EmailTemplates/buy_subscription.js"
import { paymentSuccess } from "../EmailTemplates/payment_success.js"
import { subscriptionReNew } from "../EmailTemplates/subscription_renew.js"
import { twoFactorAuthenticationOtp } from "../EmailTemplates/two_factor_authentication_otp"
import { docusignForAgent } from "../EmailTemplates/docusign_for_agent"
import { subscriptionOverdue } from "../EmailTemplates/subscription_overdue.js"
import { subscriptionReNewLink } from "../EmailTemplates/subscription_renew _link.js"

import axios from "axios";
import crypto from "crypto";

export default class Client {
  async init(db) {
    this.services = new Services();
    this.AuthServices = new AuthServices();
    // this.Models = this.Models;
    this.Models = db.models;
    await this.services.init(db);
    await this.AuthServices.init(db);
  }

  /* add Client */
  async addClient(req, res) {
    try {
      const { body, user } = req;
      /** check email exist or not */
      body.email = body.email.toLowerCase();
      const checkEmail = await this.services.getClientByMail(body.email);
      if (checkEmail) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.INVITE_ALREADY,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      body.is_verified = 0;
      body.role_id = ROLES.CLIENT;
      body.added_by = user.id;
      body.added_by_user = user.id;

      const clientData = await this.services.createClient(body);
      await createCometChatUser(
        body.first_name + " " + body.last_name,
        clientData.id,
        COMETCHATROLES[ROLES.CLIENT - 1],
        body.email,
        body.phone_number
      )
        .then((res) => res.json())
        .then(async (json) => {
          await this.services.updateClient(
            { cometUserCreated: 1 },
            clientData.id
          );
        })
        .catch((err) => console.error("error in creating Client:" + err));

      let message = ClientMessages.CLIENT_ADDED;
      if (body.is_welcome_email == 1) {
        message = ClientMessages.INVITE_LINK;
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
        const subject = "Client Invite link";
        let mailFunction = (process.env.PRODUCTION == true || process.env.PRODUCTION == "true") ? nodemailer.sendinBlueMail : nodemailer.sendMail;
        await mailFunction(to, subject, emailTemplate);
      }

      return res
        .status(201)
        .send(
          successResponse(
            message,
            null,
            RESPONSE_CODES.POST
          )
        );
    } catch (error) {
      console.log(error);
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

  /* set client password */
  async setClientPassword(req, res) {
    try {
      const { body } = req;

      let whereCondition = {
        invite_token: body.token,
        role_id: {
          [Op.ne]: ROLES.ADMIN
        },
        deleted_at: null
      };

      const findToken = await this.services.getClientByCondition(whereCondition);
      if (!findToken) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.INVALID_TOKEN,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      if (findToken.role_id != ROLES.ADMIN && findToken.status == USER_STATUS.INACTIVE) {
        const getadmin = await this.Models.Users.findOne({
          where: {
            role_id: ROLES.ADMIN,
            deleted_at: null
          }
        })

        return res
          .status(400)
          .send(
            errorResponse(
              `We regret to inform you that your account has been inactive. Please contact ${getadmin.email} for further assistance`,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }


      if (findToken.role_id != ROLES.ADMIN && findToken.two_factor_authentication == 1) {
        const otp = Math.floor(1000 + Math.random() * 9000);
        const otpExpiryTime = moment().add(5, 'minutes').unix();
        let otpField = {
          two_factor_otp: otp,
          two_factor_otp_expiry: otpExpiryTime,
        };
        await this.AuthServices.updateUser(otpField, findToken.id);
        /** Two factor authentication otp  */
        const emailTemplate = await twoFactorAuthenticationOtp(otp);
        const subject = "Two factor authentication otp";
        await nodemailer.sendinBlueMail(findToken.email, subject, emailTemplate);
      }


      const loginTime = moment(new Date()).unix();
      const payload = {
        id: findToken.id,
        role_id: findToken.role_id,
        first_name: findToken.first_name,
        last_name: findToken.last_name,
        email: findToken.email,
        login_time: loginTime,
      };

      let createData = {
        user_id: findToken.id,
        login_time: loginTime,
      };
      await this.services.createLoginTime(createData);
      let getUser = await this.AuthServices.getUserById(findToken.id);

      if (getUser && getUser.dataValues.role_id == ROLES.CLIENT && getUser.dataValues.subcription_status == "Cancelled") {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.CANCEL_STATUS,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      let agentDetail;
      let getUserDetail;
      if (getUser && getUser.dataValues.role_id == ROLES.AGENT && (getUser.dataValues.is_complete_profile == AGENT_PROFILE_COMPLETE_STATUS.NO_ACTION_PERFORM || getUser.dataValues.is_complete_profile == null)) {
        const templateTXT = await docusignForAgent(getUser);
        const text = convert(templateTXT);
        const base64Text = Buffer.from(text).toString('base64');
        let docusignLink = await this.AuthServices.createDosusignLink(getUser, base64Text);
        await this.AuthServices.updateUser({ docusign_link: docusignLink, is_complete_profile: 1 }, getUser.dataValues.id);
      }

      if (getUser && getUser.dataValues.role_id == ROLES.AGENT) {
        agentDetail = await this.AuthServices.getAgentByAgentId(getUser.dataValues.id);
        agentDetail.projects =  await this.services.getProjectsForAgentByAgentId(getUser.dataValues.id);
      }

      if (getUser && getUser.dataValues.role_id == ROLES.USER) {
        getUserDetail = await this.AuthServices.getAgentByAgentId(getUser.dataValues.id);
        getUserDetail.projects = await this.AuthServices.getAllProjectsForUserByUserId(getUser.dataValues.id, getUser.dataValues.added_by);
      }

      let finalUserDetail = (getUser && getUser.dataValues.role_id == ROLES.AGENT) ? agentDetail : (getUser && getUser.dataValues.role_id == ROLES.USER) ? getUserDetail : getUser.toJSON();

      if(finalUserDetail && finalUserDetail.projects.length>0) {
        delete finalUserDetail.projects;
        finalUserDetail.projects = true;
      }else {
        delete finalUserDetail.projects;
        finalUserDetail.projects = false;
      }

      /** generate token */
      const token = refreshToken(payload);
      const data = {
        access_token: token,
        user: finalUserDetail,
      };

      let updateData = {
        invite_token: "",
        password: body.password
      }
      await this.services.updateClient(updateData, findToken.id);

      return res.status(200).send(successResponse(ClientMessages.SET_PASSWORD, data, RESPONSE_CODES.POST));
    } catch (error) {
      console.log(error, "===error==")
      return res
        .status(500)
        .send(
          errorResponse(CommonMessages.ERROR, null, RESPONSE_CODES.SERVER_ERROR)
        );
    }
  }


  /* Get Client Detail */
  async getClient(req, res) {
    try {
      const { params, user } = req;

      let whereCondition = {
        id: params.client_id,
        role_id: ROLES.CLIENT
      }
      const getClientDetail = await this.services.getClientInformationByCondition(whereCondition, user);
      if (!getClientDetail) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.CLIENT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      if(user.role_id == ROLES.ACCOUNTMANAGER) {
        let setAttributes = ["id", "client_view","client_hide_info", "deleted_at"];
        let getPermission = await this.services.getAccountManagerRolePermissions(user.role_permission_id, setAttributes);
        if(getPermission && getPermission.client_view == 1) {
          let getClientOfManager = await this.Models.AssignedUsers.findOne({
            attribute: ["id", "type", "user_id", "account_manager_id", "deleted_at"],
            where: {
              account_manager_id: user.id,
              user_id: params.client_id,
              type: ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER,
              deleted_at: null
            },
            raw: true,
          });
          if(!getClientOfManager) {
            return res
            .status(400)
            .send(
              errorResponse(
                ClientMessages.CLIENT_NOT_ACCESS,
                null,
                RESPONSE_CODES.BAD_REQUEST
              )
            );
          }
        }
        if(getPermission && getPermission.client_hide_info == 1) {
          getClientDetail.email = "*****";
          getClientDetail.phone_number = "*****";
        }
      }

      let getCurrentPaidSubscription = await this.Models.ClientSubscriptionHistories.findOne({
        attributes: ["id", "client_id", "deleted_at", "start_date", ["price", "total_price"], "billing_frequency", [sequelize.literal("DATE_FORMAT(FROM_UNIXTIME(client_subscription_histories.start_date), '%M %e, %Y')"), "subscription_start_date"]],
        where: {
          client_id: getClientDetail.id,
          deleted_at: null,
          type: [1,2]
        },
        order: [["start_date", "desc"]],
        raw: true,
      });

      let getNextPaidSubscriptions = await this.Models.ClientSubscriptions.findAll({
        attributes: ["id", "client_id", "deleted_at", "status", "start_date", "total_price", "billing_frequency", [sequelize.literal("DATE_FORMAT(FROM_UNIXTIME(client_subscriptions.start_date), '%M %e, %Y')"), "subscription_start_date"], [sequelize.literal(`
        CASE 
          WHEN billing_frequency = 2 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(start_date), INTERVAL 1 MONTH), '%M %e, %Y')
          WHEN billing_frequency = 3 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(start_date), INTERVAL 3 MONTH), '%M %e, %Y')
          WHEN billing_frequency = 4 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(start_date), INTERVAL 6 MONTH), '%M %e, %Y')
          WHEN billing_frequency = 5 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(start_date), INTERVAL 1 YEAR), '%M %e, %Y')
          WHEN billing_frequency = 6 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(start_date), INTERVAL 7 DAY), '%M %e, %Y')
          WHEN billing_frequency = 7 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(start_date), INTERVAL 28 DAY), '%M %e, %Y')
          ELSE null END`), "end_date"], [sequelize.literal(`
          CASE 
            WHEN billing_frequency = 2 THEN UNIX_TIMESTAMP(DATE_ADD(FROM_UNIXTIME(start_date), INTERVAL 1 MONTH))
            WHEN billing_frequency = 3 THEN UNIX_TIMESTAMP(DATE_ADD(FROM_UNIXTIME(start_date), INTERVAL 3 MONTH))
            WHEN billing_frequency = 4 THEN UNIX_TIMESTAMP(DATE_ADD(FROM_UNIXTIME(start_date), INTERVAL 6 MONTH))
            WHEN billing_frequency = 5 THEN UNIX_TIMESTAMP(DATE_ADD(FROM_UNIXTIME(start_date), INTERVAL 1 YEAR))
            WHEN billing_frequency = 6 THEN UNIX_TIMESTAMP(DATE_ADD(FROM_UNIXTIME(start_date), INTERVAL 7 DAY))
            WHEN billing_frequency = 7 THEN UNIX_TIMESTAMP(DATE_ADD(FROM_UNIXTIME(start_date), INTERVAL 28 DAY))
            ELSE null
          END
        `), "end_date_unix"], [sequelize.literal("(SELECT SUM(net_price) FROM client_subscription_plans WHERE client_subscription_plans.subscription_id = client_subscriptions.id AND client_subscription_plans.billing_frequency != 1)"), "future_payment_amount"]],
        where: {
          client_id: getClientDetail.id,
          deleted_at: null,
          status: 1,
          billing_frequency: {
            [Op.ne]: 1
          }
        },
        having: {
          end_date_unix: {
            [Op.gte]: moment(new Date()).unix()
          }
        },
        raw: true,
        limit: 1,
        order: [["end_date_unix", "ASC"]]
      });

      getClientDetail.last_subscription_detail = getCurrentPaidSubscription;
      getClientDetail.next_subscription_detail = null;
      if (getNextPaidSubscriptions.length > 0) {
        getClientDetail.next_subscription_detail = getNextPaidSubscriptions[0];
      }
      return res
        .status(200)
        .send(
          successResponse(ClientMessages.GET_DATA, getClientDetail, RESPONSE_CODES.GET)
        );
    } catch (error) {
      console.log(error, "===error====");
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

  /* client's list */
  async clientList(req, res) {
    try {
      const { body, user } = req;
      body.user_id = user.id;
      body.role_id = user.role_id;
      const list = await this.services.getClientList(body, user);
      return res
        .status(200)
        .send(
          successResponse(ClientMessages.GET_LIST, list, RESPONSE_CODES.GET)
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

  /* delete Client */
  async deleteClient(req, res) {
    try {
      const { body } = req;
      const updateData = {
        deleted_at: moment(new Date()).unix(),
      };
      // await this.services.removeClient(updateData, body.client_ids);
      await deleteUserAndItsRecords(updateData, body.client_ids, this.Models);
      // Delete users from CometChat concurrently
      if(body.client_ids.length > 0) {
        const deleteCometChatPromises = body.client_ids.map(clientId => deleteCometChatUser(clientId));
        await Promise.all(deleteCometChatPromises);
      // Fetch subscriptions for the clients
        const getSubscriptions = await this.Models.ClientSubscriptions.findAll({
          attributes: ["stripe_subscription_id"],
          where: {
            client_id: body.client_ids,
            status: [1, 2],
            billing_frequency: {
              [Op.ne]: 1
            },
          },
          raw: true
        });

      // Cancel subscriptions concurrently
        if(getSubscriptions.length > 0) {
          const cancelSubscriptionPromises = getSubscriptions.map(subscription => 
            this.services.cancelSubscriptionImmediately(subscription.stripe_subscription_id)
          );

          await Promise.all(cancelSubscriptionPromises);
          await this.Models.ClientSubscriptions.update({
            status: 4,
            deleted_at: moment(new Date()).unix(),
          },{
            where: {
              client_id: body.client_ids,
              status: [1, 2],
              billing_frequency: {
                [Op.ne]: 1
              }
            },
          });
        }
      }

      return res
        .status(201)
        .send(
          successResponse(ClientMessages.DELETE_CLIENT, {}, RESPONSE_CODES.DELETE)
        );
    } catch (error) {
      console.log(error, "=====error====");

      if (
        error.type == STRIPE_ERROR.INVALID_REQUEST ||
        error.type == STRIPE_ERROR.ERROR
      ) {
        return res
          .status(201)
          .send(
            errorResponse(
              ClientMessages.DELETE_CLIENT,
              null,
              RESPONSE_CODES.DELETE
            )
          );
      } else {
        console.log(error, "=====error====")
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
  };



  /* update Client info */
  async updateClientInfo(req, res) {
    try {
      const { body, files, user } = req;

      if (!body.client_id) {
        return res
          .status(400)
          .send(
            errorResponse(
              "client id is required.",
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      /** check client exist or not */
      const getClient = await this.services.getClientInformation({ id: body.client_id, role_id: ROLES.CLIENT, deleted_at: null });

      if (!getClient) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.CLIENT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      if (files && files.length > 0) {
        let sendData = {
          files,
          id: body.client_id,
          folder: 'Users'
        }
        const uploadedImage = await uploadFileForAll(sendData);
        if (uploadedImage.length > 0) {
          body.user_image = uploadedImage[0].file_key
        }
      }

      if (body.status && body.status == "Active") {
        body.status = 1;
      } else if (body.status && body.status == "Inactive") {
        body.status = 2;
      } else {
        body.status = 1;
      }

      if(body.email && body.email == "*****") {
        body.email = getClient.emaill;
      }
      if(body.phone_number && body.phone_number == "*****") {
        body.phone_number = getClient.phone_number;
      }

      await this.services.updateClient(body, body.client_id);
      // const getClientDetail = await this.services.getClientById(body.client_id);
      let whereCondition = {
        id: body.client_id,
        role_id: ROLES.CLIENT
      }
      const getClientDetail = await this.services.getClientInformationByCondition(whereCondition, user);
      if(user.role_id == ROLES.ACCOUNTMANAGER) {
        let setAttributes = ["id", "client_view","client_hide_info", "deleted_at"];
        let getPermission = await this.services.getAccountManagerRolePermissions(user.role_permission_id, setAttributes);
        if(getPermission && getPermission.client_hide_info == 1) {
          getClientDetail.email = "*****";
          getClientDetail.phone_number = "*****";
        }
      }

      await updateCometChatUser(body.client_id, {
        name: getClientDetail.first_name + " " + getClientDetail.last_name,
        avatar: getClientDetail.user_image ? process.env.BASE_IMAGE_URL + getClientDetail.user_image : "",
        metadata: {
          "@private": {
            email: getClientDetail.email,
            contactNumber: getClientDetail.phone_number,
          },
        },
      }).then((res) => res.json())
        .then(async (json) => {
        })
        .catch((err) => console.error("error in updating client:" + err));

      return res
        .status(201)
        .send(
          successResponse(
            ClientMessages.CLIENT_UPDATE,
            getClientDetail,
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


  /* get client images */
  async getClientImage(req, res) {
    try {
      const url = req.params.user_image;
      const currentDir = __dirname;
      const desiredDir = path.join(currentDir, '..', 'Client', 'upload_files');
      const imagePath = path.join(desiredDir, url);
      // Check if the file exists
      if (fs.existsSync(imagePath)) {
        // Read the image file
        const image = fs.readFileSync(imagePath);
        // Set the appropriate content type based on the file extension
        const ext = path.extname(imagePath).toLowerCase();
        let contentType = 'image/png'; // default to PNG
        if (ext === '.jpg' || ext === '.jpeg') {
          contentType = 'image/jpeg';
        } else if (ext === '.gif') {
          contentType = 'image/gif';
        }
        // Set the response headers
        res.writeHead(200, {
          'Content-Type': contentType,
          'Content-Length': image.length,
        });

        // Send the image data
        res.end(image, 'binary');
      } else {
        // If the file doesn't exist, return a 200 response
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }

    } catch (error) {
      console.log(error, "==error====");
      return res.status(500).send(errorResponse(CommonMessages.ERROR, null, RESPONSE_CODES.SERVER_ERROR));
    }
  }

  /* send-set-password-link to the client */
  async set_password_link(req, res) {
    try {
      const client_id = req.body.client_id
      const client = await this.services.checkUserDetailById(client_id);
      if (!client) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.USER_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      const Client_Email = client.email;
      // const token = randomstring.generate(64);
      let getGlobalSetting = await this.Models.GlobalSettings.findOne({
        attributes: ["id", "user_role", "is_authenticate"],
        where: {
          user_role: 7
        },
        raw: true
      });
      const payload = {
        email: Client_Email,
        password_setting: getGlobalSetting ? getGlobalSetting.is_authenticate: 1
      };
      /** generate token */
      const token = refreshToken(payload);
      await this.Models.Users.update(
        { invite_token: token },
        { where: { email: Client_Email } }
      );

      const to = Client_Email.toLowerCase();
      const setPasswordLink = `${process.env.BASE_URL}reset-password/${token}`;

      const emailTemplate = await resetPassword(setPasswordLink);
      // const emailTemplate = `please click on this lnk to set your password ${setPasswordLink}`

      const subject = "Reset Password link";
      let mailFunction = (process.env.PRODUCTION == true || process.env.PRODUCTION == "true") ? nodemailer.sendinBlueMail : nodemailer.sendMail;
      await mailFunction(to, subject, emailTemplate);
      return res
        .status(201)
        .send(
          successResponse(
            "Reset password link sent successfully.",
            null,
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
  }



  /* search agents for assign to client */
  async searchAgent(req, res) {
    try {
      const { params } = req;
      const searchAgent = await this.services.getAgentList(params);
      return res
        .status(200)
        .send(
          successResponse(ClientMessages.GET_LIST, searchAgent, RESPONSE_CODES.GET)
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


  /* Asign Agents to client */
  async assignAgents(req, res) {
    try {
      const { body, user } = req;
      /** check client exist or not */
      const checkClient = await this.services.checkClientById(body.client_id);
      if (!checkClient) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.CLIENT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      let assignedAgents = [];
      if (body.agent_ids.length > 0) {
        const assignAgents = [];
        let getAgentIds = [...new Set(body.agent_ids)];
        for (const i in getAgentIds) {
          let getAgent = await this.Models.Users.findOne({
            where: {
              id: getAgentIds[i],
              deleted_at: null,
              role_id: ROLES.AGENT
            },
            raw: true,
          });

          if (getAgent) {
            let checkAlreadyExist = await this.Models.AssignedUsers.findOne({
              where: {
                agent_id: getAgent.id,
                user_id: body.client_id,
                deleted_at: null,
              },
              raw: true,
            });
            if (!checkAlreadyExist) {
              assignAgents.push({
                user_id: body.client_id,
                agent_id: getAgentIds[i],
                type: ASSIGNED_USERS.CLIENTS_TO_AGENT,
                is_default: 0,
                assigned_date: moment(new Date()).unix()
              });
            }
          }
        }
        assignedAgents = await this.Models.AssignedUsers.bulkCreate(assignAgents);
      }

      let assignedAgentInfo = [];
      if (assignedAgents.length > 0) {
        let allAssignedAgentIds = assignedAgents.map(val => val.agent_id);
        assignedAgentInfo = await this.services.getAssignedAgentsById(body.client_id, allAssignedAgentIds);
      }
      return res
        .status(201)
        .send(
          successResponse(
            ClientMessages.AGENT_ASSINGNED,
            assignedAgentInfo,
            RESPONSE_CODES.POST
          )
        );
    } catch (error) {
      console.log(error, "===error==")
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

  /* Assigned agents list to client */
  async assignedAgentList(req, res) {
    try {
      const { body, user } = req;

      body.user_id = user.id;
      if(user.role_id == ROLES.AGENT) {
        const projectExist = await this.services.getProjectById(body.client_id);
        if (!projectExist) {
          return res
            .status(400)
            .send(
              errorResponse(
                ClientMessages.PROJECT_NOT_FOUND,
                null,
                RESPONSE_CODES.BAD_REQUEST
              )
            );
        }
        let getUserDetail = await this.services.getUserDetailById(projectExist.user_id);

        if(getUserDetail.role_id == ROLES.USER) {
          body.client_id = getUserDetail.added_by;
        }else {
          body.client_id = getUserDetail.id;
        }
      }else if(user.role_id == ROLES.USER) {
        body.client_id = user.added_by;
      } else if (user.role_id == ROLES.CLIENT) {
        body.client_id = user.id;
      }else {
        body.client_id = body.client_id;
      }
      /** check client exist or not */
      const checkClient = await this.services.checkClientById(body.client_id);
      if (!checkClient) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.CLIENT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      const getAssignedAgentlist = await this.services.getAssignedAgentList(body, user);
      return res
        .status(200)
        .send(
          successResponse(ClientMessages.GET_LIST, getAssignedAgentlist, RESPONSE_CODES.GET)
        );
    } catch (error) {
      console.log(error, "======error===")
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



  /* Unasign Agents From client */
  async unassignAgents(req, res) {
    try {
      const { body, user } = req;
      /** check client exist or not */
      const checkClient = await this.services.checkClientById(body.client_id);
      if (!checkClient) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.CLIENT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      const checkAgent = await this.services.checkAgentById(body.agent_id);
      if (!checkAgent) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.AGENT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      let getAgentCondition = {
        agent_id: body.agent_id,
        user_id: body.client_id,
        type: ASSIGNED_USERS.CLIENTS_TO_AGENT,
        deleted_at: null
      };
      let getUnassignAgent = await this.services.checkAssignedUserByCondtion(getAgentCondition);
      if (!getUnassignAgent) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.NOT_ASSIGN_AGENT,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      let updateData = {
        deleted_at: moment(new Date()).unix(),
      };
      let unassignAgentCondition = {
        where: {
          agent_id: body.agent_id,
          user_id: body.client_id,
          type: ASSIGNED_USERS.CLIENTS_TO_AGENT,
        }
      };
      await this.services.unassignedClientByCondtion(updateData, unassignAgentCondition);
      return res
        .status(201)
        .send(
          successResponse(
            ClientMessages.UNASSIGN_AGENT,
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


  /** Give subscription to client */
  async addSubscription(req, res) {
    try {
      const { body } = req;
      /** check client exist or not */
      const getClient = await this.services.checkClientById(body.client_id);
      if (!getClient) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.CLIENT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      let paymentLink = "";
      let createSubscriptionData;

      if (body.subscription_data.length > 0) {
        let checkSubscriptionData = await this.services.checkMatchingData(body.subscription_data);
        if (checkSubscriptionData == 0) {
          return res
            .status(400)
            .send(
              errorResponse(
                ClientMessages.SUBSCRIPTION_DATA,
                null,
                RESPONSE_CODES.BAD_REQUEST
              )
            );
        }

        if (body.subscription_data[0].billing_start_date != "") {
          let getDate = new Date(body.subscription_data[0].billing_start_date);
          let currentDate = new Date();
          currentDate.setDate(currentDate.getDate() + 2);
          if (getDate <= currentDate) {
            return res
              .status(400)
              .send(
                errorResponse(
                  "Please select at least 2 days future date for start billing.",
                  null,
                  RESPONSE_CODES.BAD_REQUEST
                )
              );
          }
        }

        let getPriceIds = [];
        let paymentMode = 'subscription';
    


        getPriceIds = await this.services.getSubscriptionPriceId(body.subscription_data);

        // check if admin add subscription according to billing frequency  
        let customerId = getClient.customer_id;
        if (customerId == "" || customerId == null) {
          // create customer in stripe 
          customerId = await this.services.createStripeCustomer(getClient);
        }

        if (body.subscription_data.every(item => item.billing_frequency === 1)) {
          paymentMode = 'payment';
        }

        // create coupons in stripe  if discount is in request
        let discountId = null;
        if (body.one_time_discount_name && body.one_time_discount && body.one_time_discount_type) {
          discountId = await this.services.createCouponForSubscription(body.one_time_discount_name, body.one_time_discount, body.one_time_discount_type)
        }

        // create Subscription in stripe 
        let createSubscription = await this.services.createSubscriptionForClient(paymentMode, customerId, getPriceIds, body.client_id, body.subscription_data[0], discountId, body.subscription_data, body.is_manual_payment);

        let getGlobalProcessingFee = await this.Models.SubscriptionSettings.findOne({
          attributes: ["global_processing_fee","tax_rate_id", "global_processing_fee_description"],
          where: {
            deleted_at: null
          },
          raw: true
        });

        createSubscriptionData = {
          client_id: body.client_id,
          title: body.title,
          description: body.description,
          transaction_id: createSubscription.subscription_id,
          start_date: (body.subscription_data[0].billing_start_date != "") ? moment(new Date(body.subscription_data[0].billing_start_date)).unix() : createSubscription.start_date,
          billing_frequency: body.subscription_data[0].billing_frequency,
          billing_terms: body.subscription_data[0].billing_terms,
          no_of_payments: body.subscription_data[0].no_of_payments,
          one_time_discount_name: body.one_time_discount_name,
          one_time_discount_type: body.one_time_discount_type,
          one_time_discount: body.one_time_discount,
          stripe_discount_id: discountId,
          subtotal: createSubscription.subTotal,
          total_price: createSubscription.amount,
          subscription_link: createSubscription.payment_link,
          link_sent_time: moment(new Date()).unix(),
          global_processing_fee: getGlobalProcessingFee && (getGlobalProcessingFee.global_processing_fee !="") ? getGlobalProcessingFee.global_processing_fee: 0,
          tax_rate_id: getGlobalProcessingFee && (getGlobalProcessingFee.tax_rate_id !="") ? getGlobalProcessingFee.tax_rate_id: "",
          global_processing_fee_description: getGlobalProcessingFee && (getGlobalProcessingFee.global_processing_fee_description !="") ? getGlobalProcessingFee.global_processing_fee_description: "",
          is_manual_payment: body.is_manual_payment,
        }
        paymentLink = createSubscription.payment_link;


        console.log(getPriceIds, "====getPriceIds===");
        // create Subscription in Subscription Table for client refrence 
        let createClientSubscription = await this.services.createSubscription(createSubscriptionData);
        body.subscription_id = createClientSubscription.id;
        await this.services.createSubscriptionWithbank(createClientSubscription.id, paymentMode, customerId, getPriceIds, body.client_id, body.subscription_data[0], discountId, body.subscription_data, body.is_manual_payment);

        let subscriptionPlansData = [];
        if (createClientSubscription) {
          for (let i in body.subscription_data) {
            subscriptionPlansData.push({
              subscription_id: createClientSubscription.id,
              client_id: body.client_id,
              product_id: body.subscription_data[i].product_id,
              unit_price: body.subscription_data[i].unit_price,
              unit_discount_type: body.subscription_data[i].unit_discount_type,
              unit_discount: body.subscription_data[i].unit_discount ? body.subscription_data[i].unit_discount : 0,
              net_price: body.subscription_data[i].net_price,
              quantity: body.subscription_data[i].quantity,
              billing_frequency: body.subscription_data[i].billing_frequency,
              is_delay_in_billing: body.subscription_data[i].is_delay_in_billing,
              stripe_price_id: getPriceIds[i].price,
            });
          }
          // create Subscription Plans in Subscription Plan Table for client refrence 
          await this.Models.ClientSubscriptionPlans.bulkCreate(subscriptionPlansData);
        }
      }

      // send payment link to client via email for purchase a subscription
      const to = getClient.email.toLowerCase();
      let payload = {
        subscription_id: body.subscription_id,
        client_id: body.client_id,
      }
      const subscriptionToken = refreshToken(payload);
      let dynamicPaymentLink = `${process.env.BASE_URL}payment-method/${subscriptionToken}`;
      // let dynamicPaymentLink = `http://localhost:3000/payment-method/${subscriptionToken}`;
      const emailTemplate = await addSubscription(createSubscriptionData.total_price, dynamicPaymentLink);
      // const emailTemplate = await addSubscription(createSubscriptionData.total_price, paymentLink);
      const subject = "Subscription link";
      let mailFunction = (process.env.PRODUCTION == true || process.env.PRODUCTION == "true") ? nodemailer.sendinBlueMail : nodemailer.sendMail;
      await mailFunction(to, subject, emailTemplate);

      return res
        .status(201)
        .send(
          successResponse(
            ClientMessages.SUBSCRIPTION_ADDED,
            {},
            RESPONSE_CODES.POST
          )
        );
    } catch (error) {

      console.log(error, "=====error====")

      if (
        error.type == STRIPE_ERROR.INVALID_REQUEST ||
        error.type == STRIPE_ERROR.ERROR||
        error.type == STRIPE_ERROR.StripeCardError
      ) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.PAYMENT_FAILED,
              null,
              RESPONSE_CODES.POST
            )
          );
      } else {
        console.log(error, "=====error====")
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
  };


  /* get client subscriptions */
  async getClientSubscriptions(req, res) {
    try {
      const { body } = req;
      /** check client exist or not */
      const checkClient = await this.services.checkClientById(body.client_id);
      if (!checkClient) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.CLIENT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      const getClientSubscriptionList = await this.services.getClientSubscriptionList(body);
      let getSubscriptionSetting = await this.services.getSubscriptionSettingDetail();
        return res.status(200).send({
          status: 1,
          message: ClientMessages.GET_LIST,
          code: RESPONSE_CODES.GET,
          data: getClientSubscriptionList,
          subscription_setting: getSubscriptionSetting
        });
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


  /* check subscriptions paid via webhook result*/
  async subscriptionWebhook(req, res) {
    try {
      const event = req.body;

      let invoiceUrl = "";

      /** subscription  successfully pain on firt payment */
      if (event.type == 'checkout.session.completed') {
        const paymentDone = event.data.object;

        console.log(paymentDone, "=============paymentDone===================");

        if (paymentDone.payment_status == "paid" || paymentDone.payment_status == "unpaid") {


        console.log("=============enter here in that case===================");

          let getSubscription = await this.Models.ClientSubscriptions.findOne({
            attribute: ["id", "transaction_id", "bank_transaction_id"],
            where: {
              [Op.or]: [{
                transaction_id: paymentDone.id,
              },{
                bank_transaction_id: paymentDone.id,
              }]
            },
            raw: true
          });

          if(getSubscription) {
            let sessionId = null;
            if(paymentDone.metadata.payment_method == "bank") {
                sessionId = getSubscription.transaction_id;
            } else if(paymentDone.metadata.payment_method == "card") {
                sessionId = getSubscription.bank_transaction_id;
            }else {
              sessionId = null;
            }

            if(sessionId) {
              await this.services.expireCheckOutSessionLink(sessionId);
            }
          }

          let paidStatus = 0;
          if(paymentDone.payment_status == "paid") {
            paidStatus = 1;
          }

          await this.Models.ClientSubscriptions.update({
            stripe_subscription_id: (paymentDone.metadata.billing_frequency == 1) ? paymentDone.id : paymentDone.subscription,
            status: paidStatus,
            start_date: moment(new Date()).unix(),
          }, {
            where: {
              [Op.or]: [{
                transaction_id: paymentDone.id,
              },{
                bank_transaction_id: paymentDone.id,
              }]
            },
          });

          if (paymentDone.metadata.billing_terms == 1 && paymentDone.metadata.billing_frequency != 1) {
            let totalPayments = +paymentDone.metadata.no_of_payments;

            let totalMonths = (paymentDone.metadata.billing_frequency == 2) ? totalPayments : (paymentDone.metadata.billing_frequency == 3) ? totalPayments * 3 : (paymentDone.metadata.billing_frequency == 4) ? totalPayments * 6 : (paymentDone.metadata.billing_frequency == 5) ? totalPayments * 1 : (paymentDone.metadata.billing_frequency == 6) ? totalPayments * 1 : (paymentDone.metadata.billing_frequency == 7) ? totalPayments * 4 : totalPayments;

            let intervalSet = '';
            if(paymentDone.metadata.billing_frequency == 6 || paymentDone.metadata.billing_frequency == 7){
              intervalSet = 'week';
            }else if (paymentDone.metadata.billing_frequency == 5) {
              intervalSet = 'year';
            } else {
              intervalSet = 'month';
            }

            const cancelAt = moment().add(totalMonths, intervalSet).unix();
            await this.services.cancelAtSubscription(cancelAt, paymentDone.subscription)
          }


          if (paymentDone.metadata.is_manual_payment == 1) {
            let updateStripeSubscription = {
              collection_method: "send_invoice",
              days_until_due: 0
            }
            await this.services.updateSubscriptionsParam(paymentDone.subscription, updateStripeSubscription); 
          };

          let subscriptionHistoryId;
          let getClientInfo = await this.Models.ClientSubscriptions.findOne({
            attributes: { include: [[sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = client_subscriptions.client_id)"), "userName"], [sequelize.literal("(SELECT email FROM users WHERE users.id = client_subscriptions.client_id)"), "email"], [sequelize.literal("(SELECT company_name FROM users WHERE users.id = client_subscriptions.client_id)"), "company_name"], [sequelize.literal("(SELECT address FROM users WHERE users.id = client_subscriptions.client_id)"), "address"], [sequelize.literal("(SELECT customer_id FROM users WHERE users.id = client_subscriptions.client_id)"), "customer_id"]] },
            where: {
              [Op.or]: [{
                transaction_id: paymentDone.id,
              },{
                bank_transaction_id: paymentDone.id,
              }]
            },
            raw: true
          });

          /** Docusign implementation for subscription */
          
          if (getClientInfo) {

            if(paymentDone.metadata.payment_method == "bank") {
              getClientInfo.total_price = paymentDone.amount_total/100;
              getClientInfo.global_processing_fee = null;
              getClientInfo.global_processing_fee_description = null;
              getClientInfo.tax_rate_id = null;
            }

            let getUserInfo = await this.Models.Users.findOne({
              attributes: ["id", "address", "address2", "city", "state", "zipcode", "country"],
              where: {
                id: getClientInfo.client_id,
              },
              raw: true
            });

            let address = getUserInfo.address ? getUserInfo.address : "";
            let address2 = getUserInfo.address2 ? getUserInfo.address2 : "";
            let city = getUserInfo.city ? getUserInfo.city : "";
            let state = getUserInfo.state ? getUserInfo.state : "";
            let country = getUserInfo.country ? getUserInfo.country : "";
            let zipcode = getUserInfo.zipcode ? getUserInfo.zipcode : "";

            let makeAddress = address+', '+address2+', '+city+', '+state+', '+country+', '+zipcode;
            let clientData = {
              total_amount: getClientInfo.total_price,
              company_name: getClientInfo.company_name,
              address: getUserInfo.address ? makeAddress : "",
              client_name: getClientInfo.userName,
              name: getClientInfo.userName,
              email: getClientInfo.email,
              subscription_id: getClientInfo.id,
              subscription_title: getClientInfo.title,
              id: getClientInfo.client_id
            };

            let subscription_Data = [];
            let docusignUrl = "";

            let subscriptionData = await this.Models.ClientSubscriptionPlans.findAll({
              where: {
                subscription_id: getClientInfo.id
              },
              raw: true,
            });
            for (let i in subscriptionData) {

              const getProductDetail = await this.services.getProductById(subscriptionData[i].product_id);

              subscription_Data.push({
                name: getProductDetail.name,
                description: getProductDetail.description,
                quantity: subscriptionData[i].quantity,
                billing_frequency: (subscriptionData[i].billing_frequency == 1) ? "One Time" : (subscriptionData[i].billing_frequency == 2) ? "Monthly" : (subscriptionData[i].billing_frequency == 3) ? "Quaterly" : (subscriptionData[i].billing_frequency == 4) ? "Semi Annually" : (subscriptionData[i].billing_frequency == 5) ? "Annually" : (subscriptionData[i].billing_frequency == 6) ? "Every One Week" : (subscriptionData[i].billing_frequency == 7) ? "Every 4 Weeks" : "One Time"
              });
            }

            const templateTXT = await docusign(clientData, subscription_Data);
            const text = convert(templateTXT);
            const base64Text = Buffer.from(text).toString('base64');
            docusignUrl = await this.services.createDosusignLink(clientData, base64Text);
  
            let updateSubscriptionData = {
              is_signed_docusign: 0,
              docusign_link: docusignUrl,
              is_renew_count: getClientInfo.is_renew_count + 1
            };

            if(paymentDone.metadata.payment_method == "bank") {
              updateSubscriptionData.total_price = paymentDone.amount_total/100;
              updateSubscriptionData.global_processing_fee = null;
              updateSubscriptionData.global_processing_fee_description = null;
              updateSubscriptionData.tax_rate_id = null;
            }

            await this.services.updateSubscription(updateSubscriptionData, getClientInfo.id);

            if(paymentDone.invoice) {
              let getInvoiceUrl = await this.services.retrieveInvoicePdf(paymentDone.invoice);
              let getPdf = await uploadPdfToS3(getInvoiceUrl, 1);
              invoiceUrl = getPdf.Location
            }
            let getSubscriptionHistory = await this.Models.ClientSubscriptionHistories.findOne({
              where: {
                subscription_id: getClientInfo.id,
                type: SUBSCRIPTION_LOGID.ON_PURCHASE,
              },
              raw: true
            });

            if(!getSubscriptionHistory) {
              let subscriptionHistory = {
                client_id: getClientInfo.client_id,
                subscription_id: getClientInfo.id,
                description: getClientInfo.title,
                start_date: getClientInfo.start_date,
                billing_frequency: getClientInfo.billing_frequency,
                price: getClientInfo.total_price,
                invoice: invoiceUrl,
                type: SUBSCRIPTION_LOGID.ON_PURCHASE,
                global_processing_fee: getClientInfo.global_processing_fee,
                global_processing_fee_description: getClientInfo.global_processing_fee_description,
                tax_rate_id: getClientInfo.tax_rate_id,
                billing_terms: getClientInfo.billing_terms,
                no_of_payments: getClientInfo.no_of_payments,
                payment_method: getClientInfo.payment_method,
                card: getClientInfo.card,
                card_last_digit: getClientInfo.card_last_digit,
                is_manual_payment: getClientInfo.is_manual_payment,

              }
              // create Subscription history in Subscriptionhistory Table for client refrence 
              let createSubscriptionHistory = await this.services.createSubscriptionHistory(subscriptionHistory);

              subscriptionHistoryId = createSubscriptionHistory.id;

              let getAllPlans = await this.services.getAllSubscriptionPlans(getClientInfo.id);
              if(createSubscriptionHistory && getAllPlans.length > 0) {
                let subscriptionPlans = [];
                for(let i in getAllPlans) {
                  subscriptionPlans.push({
                    subscription_history_id: createSubscriptionHistory.id,
                    subscription_id: getClientInfo.id,
                    client_id: getClientInfo.client_id,
                    product_id: getAllPlans[i].product_id,
                    unit_price: getAllPlans[i].unit_price,
                    unit_discount_type: getAllPlans[i].unit_discount_type,
                    unit_discount: getAllPlans[i].unit_discount,
                    net_price: getAllPlans[i].net_price,
                    quantity: getAllPlans[i].quantity,
                    billing_frequency: getAllPlans[i].billing_frequency,
                    is_delay_in_billing: getAllPlans[i].is_delay_in_billing,
                    stripe_price_id: getAllPlans[i].stripe_price_id,
                  });
                }
                await this.Models.ClientSubscriptionHistoryPlans.bulkCreate(subscriptionPlans);
              }
            }


            if(paymentDone.payment_status == "paid") {
              const to = getClientInfo.email.toLowerCase();
              const emailTemplate = await paymentSuccess(getClientInfo, invoiceUrl, docusignUrl)
              const subject = "Subscription Payment successfully Paid.";
  
              let mailFunction = (process.env.PRODUCTION == true || process.env.PRODUCTION == "true") ? nodemailer.sendinBlueMail : nodemailer.sendMail;
              await mailFunction(to, subject, emailTemplate);
            }

            // ----------------- update card Detail --------------------- //

            let updateCardDetail = {};
            let getCardDetail;
            if (paymentDone.metadata.billing_frequency != 1) {

              let getDefaultpaymentMethod = await this.services.retrieveSubscription(paymentDone.subscription);
              getCardDetail = await this.services.retrievePaymentMethod(getDefaultpaymentMethod);

            } else {
              
              let getPaymentIntent = await this.services.retrieveSession(paymentDone.id);
              let getPaymentMethod = await this.services.retrievePaymentIntent(getPaymentIntent);
              getCardDetail = await this.services.retrievePaymentMethod(getPaymentMethod);

            }

            let cardBankName = null;
            let cardBankNumber = null;
            let payment_method = null;
   
            if (getCardDetail) {

              if (paymentDone.metadata.billing_frequency != 1) {
                await this.services.setDefaultSubscriptionPaymentMethod(paymentDone.subscription, getCardDetail.id);
              }
              
              if(getCardDetail.type == "card") {
                  
                // let paymentMethods = await this.services.getCardList(getClientInfo.customer_id);
                // let cardExists = paymentMethods.some(card => 
                //   card.brand.toLowerCase() === getCardDetail.card.brand.toLowerCase() && 
                //   card.exp_month === getCardDetail.card.exp_month && 
                //   card.exp_year === getCardDetail.card.exp_year && 
                //   card.last4 === getCardDetail.card.last4
                // );

                let getCardExpiry = moment(`${getCardDetail.card.exp_year}-${getCardDetail.card.exp_month}`, "YYYY-MM").endOf('month').unix();
           
                // if(cardExists == true) {

                //   let checkDefaultCardExist = await this.Models.Cards.findOne({
                //     where: {
                //       user_id: getClientInfo.client_id,
                //       is_default: 1,
                //     },
                //     raw: true,
                //   });
                //   if(!checkDefaultCardExist) {
                //     isDefault = 1;
                //     // await this.services.updateDefaultPaymentMethod(getClientInfo.customer_id, getCardDetail.id);
                //   }
                // }
                await this.Models.Cards.create({
                  payment_method_id: getCardDetail.id,
                  user_id: getClientInfo.client_id,
                  is_default: 1,
                  expiry_date: getCardExpiry,
                  last_digit: getCardDetail.card.last4,
                  type: 0,
                  subscription_id: getClientInfo.id
                });

                cardBankName = getCardDetail.card.brand;
                cardBankNumber = getCardDetail.card.last4;
                payment_method = "card";

              } else {

                // let paymentMethods = await this.services.getBankList(getClientInfo.customer_id);
        
                // let bankExists = paymentMethods.some(bank => 
                //   bank.bank_name.toLowerCase() === getCardDetail.us_bank_account.bank_name.toLowerCase() && 
                //   bank.last4 === getCardDetail.us_bank_account.last4
                // );

                // let isDefault = 0;
                // if(bankExists == true) {
                //   let checkDefaultCardExist = await this.Models.Cards.findOne({
                //     where: {
                //       user_id: getClientInfo.client_id,
                //       is_default: 1,
                //     },
                //     raw: true,
                //   });
                //   if(!checkDefaultCardExist) {
                //     isDefault = 1;
                //     // await this.services.updateDefaultPaymentMethod(getClientInfo.customer_id, getCardDetail.id);
                //   }
                // }

                await this.Models.Cards.create({
                  payment_method_id: getCardDetail.id,
                  user_id: getClientInfo.client_id,
                  is_default: 1,
                  last_digit: getCardDetail.us_bank_account.last4,
                  type: 1,
                  subscription_id: getClientInfo.id
                });

                cardBankName = getCardDetail.us_bank_account.bank_name;
                cardBankNumber = getCardDetail.us_bank_account.last4;
                payment_method = "bank_account";
              }
            }

            updateCardDetail = {
              card: cardBankName,
              card_last_digit: cardBankNumber,
              payment_method: payment_method
            }
            await this.services.updateSubscription(updateCardDetail, getClientInfo.id);
            if(subscriptionHistoryId) {
              await this.services.updateSubscriptionHistoryById(updateCardDetail, subscriptionHistoryId);
            }
          }
        }

      }

    /**------------------------------------------------------------------------------------------- */

    /**  one time  subscription complete */
    if (event.type == 'checkout.session.async_payment_succeeded') {
      const subscriptionComplete = event.data.object;
      let getSubscription = await this.Models.ClientSubscriptions.findOne({
        attributes: ["id", "client_id", "stripe_subscription_id", "status", "docusign_link"],
        where: {
          [Op.or]: [{
            stripe_subscription_id: subscriptionComplete.id,
          },{
            transaction_id: subscriptionComplete.id,
          },{
            bank_transaction_id: subscriptionComplete.id,
          }]
        },
        raw: true
      });

      let invoiceUrl = "";
      if(subscriptionComplete.invoice) {
        let getInvoiceUrl = await this.services.retrieveInvoicePdf(subscriptionComplete.invoice);
        let getPdf = await uploadPdfToS3(getInvoiceUrl, 1);
        invoiceUrl = getPdf.Location
      }

      if(getSubscription) {

        let getClientInfo = await this.Models.Users.findOne({
          where: {
            id: getSubscription.client_id,
          },
          raw: true
        });

        let updateSubscriptionData = {
          status: 1,
          start_date: moment(new Date()).unix(),
        };

        let updateSubscriptionHistoryData = {
          invoice: invoiceUrl,
        };
        await this.services.updateSubscription(updateSubscriptionData, getSubscription.id);
        await this.services.updateSubscriptionHistory(updateSubscriptionHistoryData, getSubscription.id);

        const to = getClientInfo.email.toLowerCase();
        const emailTemplate = await paymentSuccess(getClientInfo, invoiceUrl, getSubscription.docusign_link)
        const subject = "Subscription Payment successfully Paid.";

        let mailFunction = (process.env.PRODUCTION == true || process.env.PRODUCTION == "true") ? nodemailer.sendinBlueMail : nodemailer.sendMail;
        await mailFunction(to, subject, emailTemplate);

      }
    }

/**------------------------------------------------------------------------------------------- */

      /** subscription  payment failed*/
      if (event.type == 'invoice.payment_failed') {
        const subscriptionRenew = event.data.object;

        console.log(subscriptionRenew, "===subscriptionRenew===");
        let getSubscription = await this.Models.ClientSubscriptions.findOne({
          attributes: ["id", "client_id", "title", "total_price", "stripe_subscription_id", "billing_frequency", "is_renew_count", [sequelize.literal("(SELECT first_name FROM users WHERE users.id = client_subscriptions.client_id)"), "first_name"], [sequelize.literal("(SELECT last_name FROM users WHERE users.id = client_subscriptions.client_id)"), "last_name"]],
          where: {
            stripe_subscription_id: subscriptionRenew.subscription
          },
          raw: true,
        });

        if(getSubscription) {
          let getSubscriptionSetting = await this.AuthServices.checkSubscriptionSettings();
          let overdueSubscription = {
              status: 4,
          };

          if(getSubscriptionSetting && getSubscriptionSetting.overdue_period_days !="" && getSubscriptionSetting.overdue_period_days !="0") {
            
            let overdueDay = +getSubscriptionSetting.overdue_period_days;
            let suspendDay = +getSubscriptionSetting.suspend_period_days;
            let getFinalSuspendDays = suspendDay - overdueDay;
            let overDueDate = moment(new Date ()).add(overdueDay, 'days').unix();
            let suspendDate = moment.unix(overDueDate).add(getFinalSuspendDays, 'days').unix();
            overdueSubscription = {
              overdue_at: overDueDate,
              suspend_at: suspendDate
            };
          }
          await this.services.updateSubscription(overdueSubscription, getSubscription.id);
          // if(!subscriptionRenew.metadata.buy_with_client){
          //   let to = subscriptionRenew.customer_email;
          //   let emailTemplate = await subscriptionOverdue(getSubscription)
          //   let subject = "Subscription Overdue.";
          //   let mailFunction = (process.env.PRODUCTION == true || process.env.PRODUCTION == "true") ? nodemailer.sendinBlueMail : nodemailer.sendMail;
          //   await mailFunction(to, subject, emailTemplate);
          // }
        }
      }


/**------------------------------------------------------------------------------------------- */

      /** subscription  cancelled on stripe or our website*/
      if (event.type == 'customer.subscription.deleted') {
        const subscriptionCancel = event.data.object;
        let getSubscription = await this.Models.ClientSubscriptions.findOne({
          attributes: ["id", "stripe_subscription_id", "status"],
          where: {
            stripe_subscription_id: subscriptionCancel.id,
          },
          raw: true
        });
        if(getSubscription) {
          let updateSubscriptionData = {
            cancel_at: subscriptionCancel.canceled_at,
            status: 4,
          }
          await this.services.updateSubscription(updateSubscriptionData, getSubscription.id);

          // let subscriptionHistory = {
          //   client_id: getSubscription.client_id,
          //   subscription_id: getSubscription.id,
          //   description: getSubscription.title,
          //   start_date: subscriptionCancel.canceled_at,
          //   billing_frequency: getSubscription.billing_frequency,
          //   price: getSubscription.total_price,
          //   type: SUBSCRIPTION_LOGID.STATUS_CHANGE_CANCEL,
          // }
          // // create Subscription history in Subscriptionhistory Table for client refrence 
          // await this.services.createSubscriptionHistory(subscriptionHistory);

        }
      }



/**------------------------------------------------------------------------------------------- */

      /** Client buy a subscription */
      if (event.type == 'customer.subscription.created') {
        const subscriptionCreated = event.data.object;
        if(subscriptionCreated && subscriptionCreated.status == "active") {

          const getSubscription = await this.Models.ClientSubscriptions.findOne({
            where: {
              stripe_subscription_id: subscriptionCreated.id,
            },
            raw: true
          });
       
          if(getSubscription) {
            const getUserInfo = await this.Models.Users.findOne({
              where: {
                id: getSubscription.client_id,
              },
              raw: true
            });
  
            let address = getUserInfo.address ? getUserInfo.address : "";
            let address2 = getUserInfo.address2 ? getUserInfo.address2 : "";
            let city = getUserInfo.city ? getUserInfo.city : "";
            let state = getUserInfo.state ? getUserInfo.state : "";
            let country = getUserInfo.country ? getUserInfo.country : "";
            let zipcode = getUserInfo.zipcode ? getUserInfo.zipcode : "";
  
            let makeAddress = address+', '+address2+', '+city+', '+state+', '+country+', '+zipcode;
            let clientData = {
              total_amount: getSubscription.total_price,
              company_name: getUserInfo.company_name,
              address: getUserInfo.address ? makeAddress : "",
              client_name: getUserInfo.first_name +' '+getUserInfo.last_name,
              name: getUserInfo.first_name +' '+getUserInfo.last_name,
              email: getUserInfo.email,
              subscription_id: getSubscription.id,
              subscription_title: getSubscription.title,
              id: getSubscription.client_id
            };
  
            let subscription_Data = [];
            let docusignUrl = "";
  
            let subscriptionData = await this.Models.ClientSubscriptionPlans.findAll({
              where: {
                subscription_id: getSubscription.id
              },
              raw: true,
            });
            for (let i in subscriptionData) {
  
              const getProductDetail = await this.services.getProductById(subscriptionData[i].product_id);
              subscription_Data.push({
                name: getProductDetail.name,
                description: getProductDetail.description,
                quantity: subscriptionData[i].quantity,
                billing_frequency: (subscriptionData[i].billing_frequency == 1) ? "One Time" : (subscriptionData[i].billing_frequency == 2) ? "Monthly" : (subscriptionData[i].billing_frequency == 3) ? "Quaterly" : (subscriptionData[i].billing_frequency == 4) ? "Semi Annually" : (subscriptionData[i].billing_frequency == 5) ? "Annually" : (subscriptionData[i].billing_frequency == 6) ? "Every One Week" : (subscriptionData[i].billing_frequency == 7) ? "Every 4 Weeks" : "One Time"
              });
            }
  
            const templateTXT = await docusign(clientData, subscription_Data);
            const text = convert(templateTXT);
            const base64Text = Buffer.from(text).toString('base64');
            docusignUrl = await this.services.createDosusignLink(clientData, base64Text);
  
            let updateSubscriptionData = {
              status: 1,
              is_signed_docusign: 0,
              docusign_link: docusignUrl,
              is_renew_count: getSubscription.is_renew_count + 1
            };
  
  
            await this.services.updateSubscription(updateSubscriptionData, getSubscription.id);
            let getInvoiceUrl = await this.services.retrieveInvoicePdf(subscriptionCreated.latest_invoice);
            let getPdf = await uploadPdfToS3(getInvoiceUrl, 1);
            invoiceUrl = getPdf.Location
            let getSubscriptionHistory = await this.Models.ClientSubscriptionHistories.findOne({
              where: {
                subscription_id: getSubscription.id,
                type: SUBSCRIPTION_LOGID.ON_PURCHASE,
              },
              raw: true
            });
  
            if(!getSubscriptionHistory) {
              let subscriptionHistory = {
                client_id: getSubscription.client_id,
                subscription_id: getSubscription.id,
                description: getSubscription.title,
                start_date: getSubscription.start_date,
                billing_frequency: getSubscription.billing_frequency,
                price: getSubscription.total_price,
                invoice: invoiceUrl,
                type: SUBSCRIPTION_LOGID.ON_PURCHASE,
                global_processing_fee: getSubscription.global_processing_fee,
                global_processing_fee_description: getSubscription.global_processing_fee_description,
                tax_rate_id: getSubscription.tax_rate_id,
                billing_terms: getSubscription.billing_terms,
                no_of_payments: getSubscription.no_of_payments,
                payment_method: getSubscription.payment_method,
                card: getSubscription.card,
                card_last_digit: getSubscription.card_last_digit
              }
              // create Subscription history in Subscriptionhistory Table for client refrence 
              let createSubscriptionHistory = await this.services.createSubscriptionHistory(subscriptionHistory);
  
              let getAllPlans = await this.services.getAllSubscriptionPlans(getSubscription.id);
              if(createSubscriptionHistory && getAllPlans.length > 0) {
                let subscriptionPlans = [];
                for(let i in getAllPlans) {
                  subscriptionPlans.push({
                    subscription_history_id: createSubscriptionHistory.id,
                    subscription_id: getSubscription.id,
                    client_id: getSubscription.client_id,
                    product_id: getAllPlans[i].product_id,
                    unit_price: getAllPlans[i].unit_price,
                    unit_discount_type: getAllPlans[i].unit_discount_type,
                    unit_discount: getAllPlans[i].unit_discount,
                    net_price: getAllPlans[i].net_price,
                    quantity: getAllPlans[i].quantity,
                    billing_frequency: getAllPlans[i].billing_frequency,
                    is_delay_in_billing: getAllPlans[i].is_delay_in_billing,
                    stripe_price_id: getAllPlans[i].stripe_price_id,
                  });
                }
                await this.Models.ClientSubscriptionHistoryPlans.bulkCreate(subscriptionPlans);
              }
            }
          }
        }
      }



/**------------------------------------------------------------------------------------------- */
      /**    for subscription renew     */
      if (event.type == 'invoice.paid') {
        const subscriptionRenew = event.data.object;

        if(subscriptionRenew.subscription) {

          let getSubscription = await this.Models.ClientSubscriptions.findOne({
            attributes: ["id", "client_id", "title", "total_price", "stripe_subscription_id", "billing_frequency", "is_renew_count", "global_processing_fee", "global_processing_fee_description", "tax_rate_id", "billing_terms", "no_of_payments", "status"],
            where: {
              stripe_subscription_id: subscriptionRenew.subscription
            },
            raw: true,
          });
  
          if(subscriptionRenew.subscription_details.metadata && subscriptionRenew.subscription_details.metadata != null && (subscriptionRenew.subscription_details.metadata.is_edited == "true" || subscriptionRenew.subscription_details.metadata.is_edited == true)) {
  
            console.log("Subscription updated. No need to do perform any action");
  
          }else {
  
            console.log("Subscription enter to do for renew or first payment.");
  
            let cardBankName = null;
            let cardBankNumber = null;
            let payment_method = null;
  
          console.log(getSubscription, "====getSubscription=========renew======");
  
            if (subscriptionRenew.status == "paid") {
  
              if (getSubscription && getSubscription.stripe_subscription_id !=null && getSubscription.billing_frequency !=1) {
  
                if (getSubscription.is_renew_count != 0 && getSubscription.status ==1 ) {
  
                  let renewCountData = {
                    is_renew_count: getSubscription.is_renew_count + 1,
                    start_date: subscriptionRenew.created
                  };
                  await this.services.updateSubscription(renewCountData, getSubscription.id);
    
                  // invoiceUrl = await this.services.retriveChargeFromStripe(getInvoiceInfo.charge);
                  let getPdf = await uploadPdfToS3(subscriptionRenew.invoice_pdf, getSubscription.id);
                  let getInvoiceUrl = getPdf.Location
  
                  if(subscriptionRenew.payment_intent) {

                    let getPaymentMethod = await this.services.retrievePaymentIntent(subscriptionRenew.payment_intent);
  
                    if(getPaymentMethod) {
                        let getCardDetail = await this.services.retrievePaymentMethod(getPaymentMethod);
                      if (getCardDetail) {
                        if(getCardDetail.type == "card") {
                          cardBankName = getCardDetail.card.brand;
                          cardBankNumber = getCardDetail.card.last4;
                          payment_method = "card";
                        } else {
                          cardBankName = getCardDetail.us_bank_account.bank_name;
                          cardBankNumber = getCardDetail.us_bank_account.last4;
                          payment_method = "bank_account";
                        }
                      }
                    }
                  }
  
                  // Subscription history data 
                  let subscriptionHistory = {
                    client_id: getSubscription.client_id,
                    subscription_id: getSubscription.id,
                    description: getSubscription.title,
                    start_date: subscriptionRenew.created,
                    billing_frequency: getSubscription.billing_frequency,
                    price: (subscriptionRenew.amount_paid == 0) ? getSubscription.total_price : subscriptionRenew.amount_paid / 100 ,
                    invoice: getInvoiceUrl,
                    type: SUBSCRIPTION_LOGID.ON_RENEW,
                    global_processing_fee: getSubscription.global_processing_fee,
                    global_processing_fee_description: getSubscription.global_processing_fee_description,
                    tax_rate_id: getSubscription.tax_rate_id,
                    billing_terms: getSubscription.billing_terms,
                    no_of_payments: getSubscription.no_of_payments,
                    card: cardBankName,
                    card_last_digit: cardBankNumber,
                    payment_method: payment_method,
                    is_manual_payment: (payment_method == null) ? 1 : 0 
                  }

                  
                  // create Subscription history in Subscriptionhistory Table for client refrence 
                  let createSubscriptionHistory = await this.services.createSubscriptionHistory(subscriptionHistory);
    
                  let getAllPlans = await this.services.getAllSubscriptionPlans(getSubscription.client_id);
                  if(createSubscriptionHistory && getAllPlans.length > 0) {
                    let subscriptionPlans = [];
                    for(let i in getAllPlans) {
                      subscriptionPlans.push({
                        subscription_history_id: createSubscriptionHistory.id,
                        subscription_id: getSubscription.id,
                        client_id: getSubscription.client_id,
                        product_id: getAllPlans[i].product_id,
                        unit_price: getAllPlans[i].unit_price,
                        unit_discount_type: getAllPlans[i].unit_discount_type,
                        unit_discount: getAllPlans[i].unit_discount,
                        net_price: getAllPlans[i].net_price,
                        quantity: getAllPlans[i].quantity,
                        billing_frequency: getAllPlans[i].billing_frequency,
                        is_delay_in_billing: getAllPlans[i].is_delay_in_billing,
                        stripe_price_id: getAllPlans[i].stripe_price_id,
                      });
                    }
                    await this.Models.ClientSubscriptionHistoryPlans.bulkCreate(subscriptionPlans);
                  }
    
                  if (getSubscription && getSubscription.stripe_subscription_id !=null && getSubscription.billing_frequency !=1) {
  
                    const to = subscriptionRenew.customer_email;
                    const emailTemplate = await subscriptionReNew(getInvoiceUrl)
                    const subject = "Subscription Renewal successfully.";
                    let mailFunction = (process.env.PRODUCTION == true || process.env.PRODUCTION == "true") ? nodemailer.sendinBlueMail : nodemailer.sendMail;
                    await mailFunction(to, subject, emailTemplate);
                  }
  
                }
              }
            }
          }

        }

      }

    /**------------------------------------------------------------------------------------------- */

      /** Invoice finalized for renew manual subscription*/

      if (event.type == 'invoice.finalized') {
        const invoiceFinalized = event.data.object;

        console.log(invoiceFinalized, "===invoiceFinalized===");

        if(invoiceFinalized && (invoiceFinalized.status == "open" || invoiceFinalized.status == "draft")) {

          let getSubscription = await this.Models.ClientSubscriptions.findOne({
            attributes: { include : [[sequelize.literal("(SELECT first_name FROM users WHERE users.id = client_subscriptions.client_id)"), "first_name"], [sequelize.literal("(SELECT last_name FROM users WHERE users.id = client_subscriptions.client_id)"), "last_name"]]},
            where: {
              stripe_subscription_id: invoiceFinalized.subscription,
              is_manual_payment: 1,
              deleted_at: null
            },
            raw: true,
          });
  
          if(getSubscription) {

            let paymentMethodType = getSubscription.payment_method == "card" ? ['card'] : ["us_bank_account"];
            const updateInvoice = await this.services.updateInvoicePaymentMethod(invoiceFinalized.id, paymentMethodType);


            // overdue and suspended date saved
            let getSubscriptionSetting = await this.AuthServices.checkSubscriptionSettings();
            let overdueSubscription = {};
  
            if(getSubscriptionSetting && getSubscriptionSetting.overdue_period_days !="" && getSubscriptionSetting.overdue_period_days !="0") {
              
              let overdueDay = +getSubscriptionSetting.overdue_period_days;
              let suspendDay = +getSubscriptionSetting.suspend_period_days;
              let getFinalSuspendDays = suspendDay - overdueDay;
              let overDueDate = moment(new Date ()).add(overdueDay, 'days').unix();
              let suspendDate = moment.unix(overDueDate).add(getFinalSuspendDays, 'days').unix();
              overdueSubscription.overdue_at = overDueDate;
              overdueSubscription.suspend_at = suspendDate;
            }
            console.log(overdueSubscription, "==overdueSubscription=");
            await this.services.updateSubscription(overdueSubscription, getSubscription.id);
            console.log("==updated in db=getSubscription==is past_due=");
    
            
            let to = updateInvoice.customer_email;
            getSubscription.payment_link = updateInvoice.hosted_invoice_url;

            let emailTemplate = await subscriptionReNewLink(getSubscription)
            let subject = "Renew Your Subscription.";
            let mailFunction = (process.env.PRODUCTION == true || process.env.PRODUCTION == "true") ? nodemailer.sendinBlueMail : nodemailer.sendMail;
            await mailFunction(to, subject, emailTemplate);
          }
        }
      }


    /**------------------------------------------------------------------------------------------- */

    /** when subscription updated at past due status*/

    // if (event.type === 'customer.subscription.updated') {

    //   const subscriptionUpdated = event.data.object;
    //   if (subscriptionUpdated.status === 'past_due') {
    //     console.log(subscriptionUpdated, "===subscriptionUpdated==is past_due=");
    //     let getSubscription = await this.Models.ClientSubscriptions.findOne({
    //       attributes: ["id", "client_id", "title", "total_price", "stripe_subscription_id", "billing_frequency", "is_renew_count", "is_manual_payment", "status", "deleted_at", [sequelize.literal("(SELECT first_name FROM users WHERE users.id = client_subscriptions.client_id)"), "first_name"], [sequelize.literal("(SELECT last_name FROM users WHERE users.id = client_subscriptions.client_id)"), "last_name"], [sequelize.literal("(SELECT email FROM users WHERE users.id = client_subscriptions.client_id)"), "email"]],
    //       where: {
    //         stripe_subscription_id: subscriptionUpdated.id,
    //         deleted_at: null,
    //         is_manual_payment: 1
    //       },
    //       raw: true,
    //     });

    //     console.log(getSubscription, "===getSubscription==is past_due=");


    //   }
    // }

  /**------------------------------------------------------------------------------------------- */

      return res
        .status(200)
        .send(
          successResponse(ClientMessages.GET_LIST, {}, RESPONSE_CODES.GET)
        );
    } catch (error) {
      console.log(error, "==error===");
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



  /* Asign Account Manager to client */
  async assignAccountManagers(req, res) {
    try {
      const { body, user } = req;
      /** check client exist or not */
      const checkClient = await this.services.checkClientById(body.client_id);
      if (!checkClient) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.CLIENT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      let assignedAccountManager = [];
      if (body.account_manager_ids.length > 0) {
        const assignAccountManager = [];
        let getAccountManagerIds = [...new Set(body.account_manager_ids)];

        /**  Get all task group ids of client */
        // let getGroupIds = await this.services.getAllGroups(body.client_id);
        // if (getGroupIds.length > 0) {
        //   await Promise.all(
        //     getGroupIds.map(async (groupId) => {
        //       return createCometChatGroupMembers(groupId, getAccountManagerIds)
        //         .then((res) => res.json())
        //         .then((json) => {
        //           console.log("Group Members added...", json);
        //         })
        //         .catch((err) => {
        //           console.error("error in adding Group members: " + err);
        //         });
        //     })
        //   );
        // }

        for (const i in getAccountManagerIds) {
          let getAccountManager = await this.Models.Users.findOne({
            where: {
              id: getAccountManagerIds[i],
              deleted_at: null,
              role_id: ROLES.ACCOUNTMANAGER
            },
            raw: true,
          });

          if (getAccountManager) {
            let checkAlreadyExist = await this.Models.AssignedUsers.findOne({
              where: {
                account_manager_id: getAccountManager.id,
                user_id: body.client_id,
                deleted_at: null,
              },
              raw: true,
            });
            if (!checkAlreadyExist) {
              assignAccountManager.push({
                user_id: body.client_id,
                account_manager_id: getAccountManagerIds[i],
                type: ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER,
                is_default: 0,
                assigned_date: moment(new Date()).unix()
              });
            }
          }
        }
        const checkIsAnyDefaultClient = await this.services.checkDefaultClientCountAccountManagerById(body.client_id);
        if (checkIsAnyDefaultClient == 0) {
          if (assignAccountManager.length > 0) {
            assignAccountManager.forEach((client, index) => {
              client.is_default = index === 0 ? 1 : 0;
            });
          }
        }
        assignedAccountManager = await this.Models.AssignedUsers.bulkCreate(assignAccountManager);
      }

      let assignedAccountManagerInfo = [];
      if (assignedAccountManager.length > 0) {
        let allAssignedAccountManagerIds = assignedAccountManager.map(val => val.account_manager_id);
        assignedAccountManagerInfo = await this.services.getAssignedAccountManagersById(body.client_id, allAssignedAccountManagerIds);
      }
      
      return res
        .status(201)
        .send(
          successResponse(
            ClientMessages.ACCOUNT_MANAGER_ASSINGNED,
            assignedAccountManagerInfo,
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


  /* Assigned account Manager list to client */
  async assignedAccountmanagerList(req, res) {
    try {
      const { body } = req;
      /** check client exist or not */
      const checkClient = await this.services.checkClientById(body.client_id);
      if (!checkClient) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.CLIENT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      const getAssignedAccountManagerlist = await this.services.getAssignedAccountManagerList(body);
      return res
        .status(200)
        .send(
          successResponse(ClientMessages.GET_LIST, getAssignedAccountManagerlist, RESPONSE_CODES.GET)
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


  /* Unasign Account manager From client */
  async unssignAccountManager(req, res) {
    try {
      const { body, user } = req;
      /** check client exist or not */
      const checkClient = await this.services.checkClientById(body.client_id);
      if (!checkClient) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.CLIENT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      const checkAccountManager = await this.services.checkAccountManagerById(body.account_manager_id);
      if (!checkAccountManager) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.ACCOUNT_MANAGER_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      let getAgentCondition = {
        account_manager_id: body.account_manager_id,
        user_id: body.client_id,
        type: ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER,
        deleted_at: null
      };
      let getUnassignAgent = await this.services.checkAssignedUserByCondtion(getAgentCondition);
      if (!getUnassignAgent) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.NOT_ASSIGN_ACCOUNT_MANAGER,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      let updateData = {
        deleted_at: moment(new Date()).unix(),
      };
      let unassignAgentCondition = {
        where: {
          account_manager_id: body.account_manager_id,
          user_id: body.client_id,
          type: ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER,
        }
      };
      await this.services.unassignedClientByCondtion(updateData, unassignAgentCondition);

      const checkIsAnyDefaultClient = await this.services.checkDefaultClientCountAccountManagerById(body.client_id);

      if (checkIsAnyDefaultClient == 0) {
        await this.Models.AssignedUsers.update({
          is_default: 1,
        }, {
          where: {
            user_id: body.client_id,
            type: ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER,
            is_default: 0,
            deleted_at: null,
          },
          limit: 1,
        });
      }

      /**  Get all task group ids of client */
      // let getGroupIds = await this.services.getAllGroups(body.client_id);
      // if (getGroupIds.length > 0) {
      //   for (let i in getGroupIds) {
      //     await removeCometChatGroupMembers(
      //       getGroupIds[i],
      //       body.account_manager_id,
      //     )
      //       .then((res) => res.json())
      //       .then(async (json) => {
      //         console.log("Group Members removed...", json);
      //       })
      //       .catch((err) => console.error("error in remove Group members:" + err));
      //   }
      // }

      return res
        .status(201)
        .send(
          successResponse(
            ClientMessages.UNASSIGN_ACCOUNT_MANAGER,
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


  /* search agents for assign to client */
  async searchAccountManager(req, res) {
    try {
      const { params } = req;
      const searchAccountManager = await this.services.getAccountManagerList(params);
      return res
        .status(200)
        .send(
          successResponse(ClientMessages.GET_LIST, searchAccountManager, RESPONSE_CODES.GET)
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




  /* search agents for assign to client */
  async searchAccountManager(req, res) {
    try {
      const { params } = req;
      const searchAccountManager = await this.services.getAccountManagerList(params);
      return res
        .status(200)
        .send(
          successResponse(ClientMessages.GET_LIST, searchAccountManager, RESPONSE_CODES.GET)
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


  /* Set Account Manager as default  */
  async setDefaultAccountManager(req, res) {
    try {
      const { body } = req;

      //check client exist or not
      const checkClientExist = await this.services.getClientById(body.client_id)
      if (!checkClientExist) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.CLIENT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      //check account manager is exist or not
      const checkAccountManagerExist = await this.services.checkAccountManagerById(body.account_manager_id)
      if (!checkAccountManagerExist) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.ACCOUNT_MANAGER_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      // check account manager or client exist or not
      const checkExist = await this.services.checkaccountManagerAndClientExist(body)
      if (!checkExist) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.NOT_ASSIGN_ACCOUNT_MANAGER,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }


      //check account manager is_default 1 or not
      const accountManagerisDefault = await this.services.checkAccountManagerisDefault(body)
      if (accountManagerisDefault) {
        return res
          .status(200)
          .send(
            successResponse(ClientMessages.ACCOUNT_MANAGER_ALREADY_DEFAULT, RESPONSE_CODES.GET)
          );
      }
      //set Account Manager as Default
      const updatedAsDefault = this.services.setAccountManagerAsDefault(body)
      return res
        .status(200)
        .send(
          successResponse(ClientMessages.ACCOUNT_MANAGER_SET_DEFAULT, updatedAsDefault, RESPONSE_CODES.GET)
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

  /* Docusign completed */
  async docusignCompleted(req, res) {
    try {
      const { params, query } = req;

      if(query.envelopId) {
        let getEnvelope = await this.AuthServices.getDosusignEnvelop(query.envelopId);

        if(getEnvelope.status == "completed") {

          let updateSubscriptionData = {
            is_signed_docusign: 1,
          }
          await this.services.updateSubscription(updateSubscriptionData, params.subscription_id);
          let subscriptionDetail = [];
          if (query.client_id) {
            subscriptionDetail = await this.Models.ClientSubscriptions.findAll({
              where: {
                client_id: query.client_id,
                deleted_at: null,
                is_signed_docusign: 0,
                status: 1
              },
              raw: true
            });
          }

          let getProjectCount = await this.Models.Projects.count({
            where: {
              user_id: query.client_id,
              deleted_at: null,
            },
            raw: true
          });

          // res.redirect(`${process.env.BASE_URL}sign-document`);
          let getSubscription = await this.Models.ClientSubscriptions.findOne({
            attributes: ["id", "docusign_link_click", [sequelize.literal("(SELECT uuid FROM users WHERE users.id = client_subscriptions.client_id)"), "uuid"]],
            where: {
              id: params.subscription_id,
            },
            raw: true
          });
          
          if(getSubscription && getSubscription.docusign_link_click == 1) {
            res.redirect(`${process.env.BASE_URL}dashboard?ci=${getSubscription.uuid}`);
            // res.redirect(`http://localhost:3000/dashboard?ci=${getSubscription.uuid}`);

          }else if(getSubscription && getSubscription.docusign_link_click == 2){
            res.redirect(`${process.env.BASE_URL}accountManager/dashboard?ci=${getSubscription.uuid}`);
            // res.redirect(`http://localhost:3000/accountManager/dashboard?ci=${getSubscription.uuid}`);
          } else {
            res.redirect(`${process.env.BASE_URL}dashboard`);
            // res.redirect(`http://localhost:3000/dashboard`);
          }
          // res.redirect(`http://localhost:3000/sign-document`);

        } else {

          let getClientInfo = await this.Models.ClientSubscriptions.findOne({
            attributes: { include: [[sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = client_subscriptions.client_id)"), "userName"], [sequelize.literal("(SELECT email FROM users WHERE users.id = client_subscriptions.client_id)"), "email"], [sequelize.literal("(SELECT company_name FROM users WHERE users.id = client_subscriptions.client_id)"), "company_name"], [sequelize.literal("(SELECT address FROM users WHERE users.id = client_subscriptions.client_id)"), "address"], [sequelize.literal("(SELECT customer_id FROM users WHERE users.id = client_subscriptions.client_id)"), "customer_id"]] },
            where: {
              id: params.subscription_id,
            },
            raw: true
          });

          /** Docusign implementation for subscription */
          
          if (getClientInfo) {

            let clientData = {
              total_amount: getClientInfo.total_price,
              company_name: getClientInfo.company_name,
              address: getClientInfo.address,
              client_name: getClientInfo.userName,
              name: getClientInfo.userName,
              email: getClientInfo.email,
              subscription_id: getClientInfo.id,
              subscription_title: getClientInfo.title,
              id: getClientInfo.client_id
            };

            let subscription_Data = [];
            let docusignUrl = "";

            let subscriptionData = await this.Models.ClientSubscriptionPlans.findAll({
              where: {
                subscription_id: getClientInfo.id
              },
              raw: true,
            });
            for (let i in subscriptionData) {

              const getProductDetail = await this.services.getProductById(subscriptionData[i].product_id);

              subscription_Data.push({
                name: getProductDetail.name,
                description: getProductDetail.description,
                quantity: subscriptionData[i].quantity,
                billing_frequency: (subscriptionData[i].billing_frequency == 1) ? "One Time" : (subscriptionData[i].billing_frequency == 2) ? "Monthly" : (subscriptionData[i].billing_frequency == 3) ? "Quaterly" : (subscriptionData[i].billing_frequency == 4) ? "Semi Annually" : (subscriptionData[i].billing_frequency == 5) ? "Annually" : "One Time"
              })
            }
            const templateTXT = await docusign(clientData, subscription_Data);
            const text = convert(templateTXT);
            const base64Text = Buffer.from(text).toString('base64');
            docusignUrl = await this.services.createDosusignLink(clientData, base64Text);
            let updateSubscriptionData = {
              is_signed_docusign: 0,
              docusign_link: docusignUrl,
            }
            await this.services.updateSubscription(updateSubscriptionData, getClientInfo.id);

            if(docusignUrl != '') {
              res.redirect(`${docusignUrl}`);
            }else {
              res.redirect(`${process.env.BASE_URL}`);
            }
          }
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

  /* get client subscription detail */
  async getClientSubscriptionDetail(req, res) {
    try {
      const { params, query } = req;
      /** check subscription exist or not */
      const checkSubscription = await this.services.getSubscriptionDetail(params.subscription_id);
      if (!checkSubscription) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.SUBSCRIPTION_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      if(query.is_createdAt == 1) {
        delete checkSubscription.createdAt;
        checkSubscription.createdAt = null;
      }
      return res
        .status(200)
        .send(
          successResponse(ClientMessages.GET_LIST, checkSubscription, RESPONSE_CODES.GET)
        );
    } catch (error) {
      console.log(error, "==error=")
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


  /* get card detail */
  async getCardDetail(req, res) {
    try {
      const { body } = req;

      await this.services.getCardDetailOfClient();
      return res
        .status(200)
        .send(
          successResponse("Card detail updated successfully", {}, RESPONSE_CODES.GET)
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


  /* Recent Activity List */
  async recentActityList(req, res) {
    try {
      const { user } = req;
      let getRecentActivity = await this.services.getRecentActitvity(user.id, user);
      return res
        .status(200)
        .send(
          successResponse(ClientMessages.GET_LIST, getRecentActivity, RESPONSE_CODES.GET)
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



  /* due date task List */
  async dueTaskList(req, res) {
    try {
      const { query, user } = req;
      let getTaskList = await this.services.getTasksList(query, user.id, user);
      return res
        .status(200)
        .send(
          successResponse(ClientMessages.GET_LIST, getTaskList, RESPONSE_CODES.GET)
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

  async addPasswordManager(req, res) {
    try {
      const { body, user } = req;

      const clientExist = await this.services.findClientById(user.id)

      if (!clientExist) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.CLIENT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      body.user_id = user.id
      const PasswordManager = await this.Models.PasswordManager.create(body)

      if (body.agent_ids && body.agent_ids.length != 0) {
        const agentIds = []

        let assignAgents = body.agent_ids;
        for (const i in assignAgents) {

          const agentExistinDB = await this.services.findClientById(assignAgents[i])
          if (agentExistinDB) {
            // const agentassignedExist = await this.services.findAgentsById(assignAgents[i], user.id);

            // if (agentassignedExist) {
              agentIds.push({
                password_manager_id: PasswordManager.id,
                client_id: user.id,
                agent_id: assignAgents[i]
              })
            // }
          }
        }
        await this.Models.assignedAgentPasswords.bulkCreate(agentIds);
        let recentActivity = {
          client_id: user.id,
          user_id: user.id,
          type: RECENT_ACTIVITY_TYPE.PASSWORD_MANAGER_ASSIGN,
          project_column_id: null,
          password_manager_id: PasswordManager.id,
          project_id: null,
          task_id: null,
          is_notifictaion: 1,
        }
        
        let createActivity = await this.services.createRecentActivities(recentActivity);
        if(assignAgents.length > 0) {
            let createReadNotification = [];
            for(let i in assignAgents) {
                createReadNotification.push({
                    notification_id: createActivity.id,
                    user_id: assignAgents[i],
                    is_read:0,
                    notification_type: createActivity.type
                });
            }
            await this.Models.ReadNotifications.bulkCreate(createReadNotification);
        }

      }
      return res
        .status(200)
        .send(
          successResponse(ClientMessages.PASSWORD_MANAGER_ADDED, {}, RESPONSE_CODES.GET)
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
  }


  async listPasswordManager(req, res) {
    try {

      const { body, user } = req;
      const getPassManagersList = await this.services.getPasswordManagerslist(body, user)
      return res
        .status(200)
        .send(
          successResponse(ClientMessages.GET_LIST, getPassManagersList, RESPONSE_CODES.GET)
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
  }

  async updatePasswordManager(req, res) {
    try {
      const { user, body } = req;
      let userId = user.id;
      if(user.role_id == ROLES.USER) {
        userId = user.added_by;
      }

      const passManagerDataExist = await this.services.passwordDetailsExist(body.password_manager_id)
      if (!passManagerDataExist) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.PASSWORD_MANAGER_NOT_EXIST,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      const dataUpdate = {
        user_name: body.user_name,
        site_name: body.site_name,
        password: body.password
      }
      let assignAgents = [];
      const passwordUpdated = await this.services.updatePassManager(dataUpdate, body.password_manager_id)
      if (body.agent_ids && body.agent_ids.length > 0) {
          const agentIds = [];
            assignAgents = body.agent_ids;

          const getAllAssignedUserIds = await this.Models.assignedAgentPasswords.findAll({
            where: {
              password_manager_id: body.password_manager_id,
              client_id: userId,
              deleted_at: null
            }
          });
          let alreadyAssigner = getAllAssignedUserIds.map(val => val.agent_id);
          let deleteAssignerIds = await this.services.getDeletedAssignedUserIds(assignAgents, alreadyAssigner);
          let deletedData = {
            deleted_at: moment(new Date()).unix(),
          }
          if (deleteAssignerIds.length > 0) {
            await this.services.deleteAlreadyAssignedUsers(deletedData, body.password_manager_id, deleteAssignerIds);
          }

          await this.services.deleteAlreadyAssignedUsers(deletedData, body.password_manager_id, alreadyAssigner);

          for (const i in assignAgents) {
              const checkAgentExist = await this.services.findAgentsByID(assignAgents[i]);
              if (checkAgentExist) {
                agentIds.push({
                  password_manager_id: body.password_manager_id,
                  client_id: userId,
                  agent_id: assignAgents[i]
                });
              }
          }
          await this.Models.assignedAgentPasswords.bulkCreate(agentIds);
      } else {

        let deletedData = {
          deleted_at: moment(new Date()).unix(),
        }
        await this.services.deleteAssignedAgentsInPassword(deletedData, body.password_manager_id);
      }

      let recentActivity = {
        client_id: user.id,
        user_id: user.id,
        type: RECENT_ACTIVITY_TYPE.PASSWORD_MANAGER_ASSIGN,
        project_column_id: null,
        password_manager_id: body.password_manager_id,
        project_id: null,
        task_id: null,
        is_notifictaion: 1,
      }
      let createActivity = await this.services.createRecentActivities(recentActivity);
      if(assignAgents.length > 0) {
          assignAgents = assignAgents.filter(item => item !== user.id);
          let createReadNotification = [];
          for(let i in assignAgents) {
              createReadNotification.push({
                  notification_id: createActivity.id,
                  user_id: assignAgents[i],
                  is_read:0,
                  notification_type: createActivity.type
              });
          }
          await this.Models.ReadNotifications.bulkCreate(createReadNotification);
      }

      return res
        .status(200)
        .send(
          successResponse(ClientMessages.PASSWORD_MANAGER_UPDATED, passwordUpdated, RESPONSE_CODES.POST)
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
  }

  async delete_password_manager(req, res) {
    try {
      const { params, user } = req
      let userId = user.id;
      if(user.role_id == ROLES.USER){
        userId = user.added_by;
      }
      const passwordManagerDataExist = await this.services.passwordDetailsExist(params.password_manager_id)
      if (!passwordManagerDataExist) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.PASSWORD_MANAGER_NOT_EXIST,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      let deletedData = {
        deleted_at: moment(new Date()).unix(),
      }
      await this.services.deletePassManager(deletedData, passwordManagerDataExist.id, userId)
      return res
        .status(200)
        .send(
          successResponse(ClientMessages.PASSWORD_MANAGER_DELETED, {}, RESPONSE_CODES.POST)
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
  }

  async detail_password_manager(req, res) {
    try {
      const { params, user } = req;
      let userId = user.id;
      if(user.role_id == ROLES.USER) {
        userId = user.added_by;
      }
      const passManagerDetails = await this.services.passwordManagerdetails(params.password_manager_id, userId);
      if (!passManagerDetails) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.PASSWORD_MANAGER_NOT_EXIST,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      return res
        .status(200)
        .send(
          successResponse(ClientMessages.PASSWORD_MANAGER_DETAILS, passManagerDetails, RESPONSE_CODES.GET)
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
  }

  async create_shared_files(req, res) {
    try {
      const { body, files, user } = req;
      body.client_id = user.id;
      let userId = user.id;
      if(user.role_id == ROLES.USER) {
        userId = user.added;
      }
      if (files.file == null) {
        const msg = "A file is required. Please upload the file."
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
      const uploadFile = await this.services.uploadFileDetails(body)

      if (!uploadFile) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.FILE_NOT_CREATED,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      let sendData = {
        files: files.file,
        id: userId,
        folder: 'Shared-Files'
      }
      let uploadedSharedFile = await uploadPrivateFile(sendData);
      if (uploadedSharedFile.length > 0) {

        let SharedFile = {
          file: uploadedSharedFile[0].file_key,
          file_key: uploadedSharedFile[0].generate_file_key,
          file_type: uploadedSharedFile[0].type
        };
        const fileUpdated = await this.services.updateSharedFileDetails(SharedFile, uploadFile.id)
      }

      let recentActivity = {
        client_id: userId,
        user_id: user.id,
        type: RECENT_ACTIVITY_TYPE.SHARED_FILE_CREATE,
        project_column_id: null,
        shared_file_id: uploadFile.id,
        project_id: null,
        task_id: null,
        is_notifictaion: 1,
      };
      
      let createActivity = await this.services.createRecentActivities(recentActivity);
      let getAllAssignedUsers = await this.services.getAssignedAllUsersOfClient([userId, user.id]);
      if(getAllAssignedUsers.length > 0) {
        getAllAssignedUsers.push(body.client_id);
        getAllAssignedUsers = getAllAssignedUsers.filter(item => item !== user.id);
          let createReadNotification = [];
          for(let i in getAllAssignedUsers) {
              createReadNotification.push({
                  notification_id: createActivity.id,
                  user_id: getAllAssignedUsers[i],
                  is_read:0,
                  notification_type: createActivity.type
              });
          }
          await this.Models.ReadNotifications.bulkCreate(createReadNotification);
      }
      return res
        .status(200)
        .send(
          successResponse(ClientMessages.SHARED_FILE_CREATED, {}, RESPONSE_CODES.POST)
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
  }

  async delete_file(req, res) {
    try {
      const { params, user } = req
      let userId = user.id;
      if(user.role_id == ROLES.USER) {
        userId = user.added_by;
      }
      const checkFileExist = await this.services.sharedFileExist(params.file_id, userId)
      if (!checkFileExist) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.FILE_NOT_EXIST,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      s3RemoveSingleFile(checkFileExist.file);
      let deletedData = {
        deleted_at: moment(new Date()).unix(),
      }

      await this.services.updateSharedFileDetails(deletedData, checkFileExist.id)

      return res
        .status(200)
        .send(
          successResponse(ClientMessages.FILE_DELETED, {}, RESPONSE_CODES.POST)
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
  }

  async listFile(req, res) {
    try {
      const { user, body } = req;

      let userId = user.id;
      let client_ids = [user.id];
      if(user.role_id == ROLES.USER) {
        userId = user.added_by;

        let getUsersClientUser = await this.Models.Users.findAll({
          attributes: ["id", "added_by", "added_by_user", "deleted_at"],
          where: {
            added_by: user.added_by,
            deleted_at: null
          },
          raw: true
        });

        let getUsersClientUserIds = getUsersClientUser.map(val=> val.id);
        getUsersClientUserIds.push(user.id, user.added_by, user.added_by_user);

        // let getUsersClient = await this.Models.Users.findAll({
        //   attributes: ["id", "added_by", "deleted_at"],
        //   where: {
        //     added_by: user.added_by,
        //     deleted_at: null
        //   },
        //   raw: true
        // });
        // let getUsersId = getUsersClient.map(val=> val.id);
        // getUsersId.push(user.id);
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
        // finalUserIds.push(user.added_by);
        // finalUserIds.push(user.id);
        // client_ids = client_ids.concat(finalUserIds);

        client_ids = client_ids.concat(getUsersClientUserIds);
      }

      if(user.role_id == ROLES.AGENT) {
        let getClientOfAgent = await this.services.findAllAgentsOfClientById(user.id);
        let getClientIds = getClientOfAgent.map(val=> val.user_id);
        let getClientUsers = await this.Models.Users.findAll({
          attributes: ["id", "added_by", "deleted_at"],
          where: {
            added_by: getClientIds,
            deleted_at: null
          },
          raw: true
        });
        let getUserIds = getClientUsers.map(val=> val.id);
        let finalUserIds = getClientIds.concat(getUserIds);
        client_ids.concat(finalUserIds);
      }

      let allClientsOfAgentIds = await this.services.findAgentById(user.id);
      let allclientIds = await allClientsOfAgentIds.map(clients => clients.user_id);
      client_ids.push(allclientIds);

      const checkIsAgent = await this.services.findAllAgentsOfClientById(client_ids);
      if (checkIsAgent.length > 0) {
        let allAgentIds = await checkIsAgent.map(clients => clients.agent_id);
        client_ids.push(allAgentIds);
      }
      let allUserIds = await this.services.findAllUsersOfClientById(client_ids);
      client_ids.push(allUserIds);

      let finalUserIds = client_ids.flat();
      const getFilesList = await this.services.getFilesList(finalUserIds, body)
      if (!getFilesList) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.FILE_NOT_EXIST,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      return res
        .status(200)
        .send(
          successResponse(ClientMessages.GET_LIST, getFilesList, RESPONSE_CODES.POST)
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
  }

  async getDefaultAccountManager(req, res) {
    try {
      const { params, user } = req

      const getUserExist = await this.services.getClientDetailExist(params.client_id)
      if (!getUserExist) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.CLIENT_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      const getAssignedAccManager = await this.services.getDefaultAccManager(params.client_id);
      const decoded = verifyToken(req.headers.authorization);
      let adminId = decoded.admin_id ? decoded.admin_id : user.id;
      let getAdminDetail = await this.Models.Users.findOne({
        attributes: ["id", "role_id", "role_permission_id"],
        where: {
          id: adminId,
          deleted_at: null
        },
        raw: true,
      });

      if(getAdminDetail && getAdminDetail.role_id == ROLES.ACCOUNTMANAGER) {
        let setAttributes = ["id", "admin_hide_info", "deleted_at"];
        let getPermission = await this.services.getAccountManagerRolePermissions(getAdminDetail.role_permission_id, setAttributes);
        if(getAssignedAccManager && getPermission && getPermission.admin_hide_info == 1) {
          getAssignedAccManager['Account_manager_details.email'] = "*****";
        }
      }

      return res
        .status(200)
        .send(
          successResponse(ClientMessages.DEFAULT_ACC_MANAGER, getAssignedAccManager, RESPONSE_CODES.GET)
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
 

  /* add card */
  async addCard(req, res) {
    try {
      const { body, user } = req;
      const checkSubscription = await this.services.getSubscriptionInfoById(body.subscription_id);
      if (!checkSubscription) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.SUBSCRIPTION_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      let userId = user.id;
      if(user.role_id == ROLES.USER) {
        userId = user.added_by;
      }
      let getUserDetail = await this.services.checkClientById(userId);
      let customerId = getUserDetail.customer_id;
      if (!getUserDetail.customer_id) {
        customerId = await this.services.createStripeCustomer(getUserDetail);
      }

      let getCardDetail = await this.services.createPaymentMethodInStripe(body.token);
      if(getCardDetail) {
        let paymentMethods = await this.services.getCardList(customerId, body.subscription_id);
        // let cardExists = paymentMethods.some(card => 
        //   card.brand.toLowerCase() === getCardDetail.brand.toLowerCase() && 
        //   card.exp_month === getCardDetail.exp_month && 
        //   card.exp_year === getCardDetail.exp_year && 
        //   card.last4 === getCardDetail.last4
        // );

        body.exp_month = getCardDetail.exp_month;
        body.exp_year = getCardDetail.exp_year;
        body.last_digit = getCardDetail.last4;
        body.stripe_subscription_id = checkSubscription.stripe_subscription_id;
        body.payment_method = checkSubscription.payment_method;

        // if(cardExists == true) {
        //   return res
        //   .status(400)
        //   .send(
        //     errorResponse(
        //       ClientMessages.CARD_ALREADY_EXIST,
        //       null,
        //       RESPONSE_CODES.BAD_REQUEST
        //     )
        //   );
        // }
        await this.services.createCardInStripe(customerId, body, userId, getCardDetail.id);
      }

      return res
        .status(200)
        .send(
          successResponse(ClientMessages.CARD_ADDED, {}, RESPONSE_CODES.POST)
        );
    } catch (error) {
      console.log(error, "====error===");

      if (
        error.type == STRIPE_ERROR.INVALID_REQUEST ||
        error.type == STRIPE_ERROR.ERROR ||
        error.type == STRIPE_ERROR.StripeCardError
      ) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.CARD_NOT_ADDED,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      } else {
        console.log(error, "=====error====")
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
  };



  /* get client billing list */
  async getClientBillings(req, res) {
    try {
      const { body, user } = req;
      body.client_id = user.id;
      if(user.role_id == ROLES.USER) {
      body.client_id = user.added_by;
      }
      const getClientSubscriptionList = await this.services.getClientBillingList(body);
      return res
        .status(200)
        .send(
          successResponse(ClientMessages.GET_LIST, getClientSubscriptionList, RESPONSE_CODES.GET)
        );
    } catch (error) {
      console.log(error, "===error====")
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

  /* get card list */
  async getCardList(req, res) {
    try {
      const { params, user } = req;
      const checkSubscription = await this.services.getSubscriptionInfoById(params.subscription_id);
      if (!checkSubscription) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.SUBSCRIPTION_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      let userId = user.id
      if(user.role_id == ROLES.USER) {
        userId = user.added_by;
      }
      let getUserDetail = await this.services.checkClientById(userId);
      let getCardList;

      // if(checkSubscription.billing_frequency == 1) {
      //   getCardList = await this.services.getPaymentMethodOneTimeSubscription(params.subscription_id);
      // }else {
      //   if(getUserDetail && getUserDetail.customer_id) {
      //     getCardList = await this.services.getPaymentMethodList(getUserDetail.customer_id, params.subscription_id);
      //   }
      // }
      getCardList = await this.services.getPaymentMethodOneTimeSubscription(getUserDetail.customer_id, params.subscription_id);
      return res
        .status(200)
        .send(
          successResponse(ClientMessages.GET_LIST, getCardList, RESPONSE_CODES.GET)
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


  /* get card detail */
  async getCard(req, res) {
    try {
      const { params, user } = req;
      let cardInfoWhereCondition = {
        id: params.card_id,
        user_id: user.id,
        deleted_at: null
      };
      let getCardInfo = await this.services.getPaymentMethodInfoByCondition(cardInfoWhereCondition);

      let userId = user.id
      if(user.role_id == ROLES.USER) {
        userId = user.added_by;
      }
      let getUserDetail = await this.services.checkClientById(userId);
      let getCardDetail = await this.services.getCardData(getUserDetail.customer_id, getCardInfo.payment_method_id, getCardInfo.id);
      return res
        .status(200)
        .send(
          successResponse(ClientMessages.GET_DATA, getCardDetail, RESPONSE_CODES.GET)
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


  /* delete card detail */
  async deleteCard(req, res) {
    try {
      const { params, user } = req;

      let cardInfoWhereCondition = {
        subscription_id: params.subscription_id,
        id: params.card_id,
        user_id: user.id,
        deleted_at: null
      };
      let getCardInfo = await this.services.getPaymentMethodInfoByCondition(cardInfoWhereCondition);

      console.log(getCardInfo, "======getCardInfo=====");
      if(!getCardInfo){
        return res
        .status(400)
        .send(
          errorResponse(
            ClientMessages.CARD_NOT_FOUND,
            null,
            RESPONSE_CODES.BAD_REQUEST
          )
        );
      }
      let userId = user.id;
      if(user.role_id == ROLES.USER) {
        userId = user.added_by;
      };

      let messageReturn = ClientMessages.CARD_CANNOT_DELETE;
      let deleteMessage = ClientMessages.CARD_DELETED;
      let cardType = 0;
      if(getCardInfo.type == 1) {
        messageReturn = ClientMessages.BANK_CANNOT_DELETE;
        deleteMessage = ClientMessages.BANK_DELETED;
        cardType = 1;
      }

      let getUserDetail = await this.services.checkClientById(userId);
      let getCardsCount = await this.services.getCardsCount(userId, cardType, getCardInfo.subscription_id);

      if(getCardsCount == 1) {
        return res
          .status(400)
          .send(
            errorResponse(
              messageReturn,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      if(getCardsCount == 2) {
      let getValidCard = await this.services.checkValidCardNotDelete(getCardInfo.payment_method_id, userId);
        if(!getValidCard) {
          return res
            .status(400)
            .send(
              errorResponse(
                messageReturn,
                null,
                RESPONSE_CODES.BAD_REQUEST
              )
            );
        }
      }
      await this.services.deleteCardDetail(userId, getCardInfo.payment_method_id, getCardInfo, getUserDetail.customer_id);
      return res
        .status(200)
        .send(
          successResponse(deleteMessage, {}, RESPONSE_CODES.DELETE)
        );
    } catch (error) {
      console.log(error, "====error===");
      if (
        error.type == STRIPE_ERROR.INVALID_REQUEST ||
        error.type == STRIPE_ERROR.ERROR ||
        error.type == STRIPE_ERROR.StripeCardError
      ) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.CARD_NOT_ADDED,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      } else {
        console.log(error, "=====error====")
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
  };


  /* update card */
  async updateCard(req, res) {
    try {
      const { body, user } = req;
      let getCardInfo = await this.services.getCardInfoByCardId(body.card_id, user.id);

      console.log(getCardInfo, "====getCardInfo====");
      if(!getCardInfo){
        return res
        .status(400)
        .send(
          errorResponse(
            ClientMessages.CARD_NOT_FOUND,
            null,
            RESPONSE_CODES.BAD_REQUEST
          )
        );
      }
      body.subscription_id = getCardInfo.subscription_id;
      body.user_id = user.id;
      if(user.role_id == ROLES.USER) {
        body.user_id = user.added_by;
      }
      body.last_digit = getCardInfo.last_digit;
      body.expiry_date = getCardInfo.expiry_date;
      body.payment_method_id = getCardInfo.payment_method_id;
      let getUserDetail = await this.services.checkClientById(body.user_id);
      let customerId = getUserDetail.customer_id;
      await this.services.updateCardInStripe(customerId, body);
      return res
        .status(200)
        .send(
          successResponse(ClientMessages.CARD_UPDATED, {}, RESPONSE_CODES.POST)
        );
    } catch (error) {
      console.log(error, "====error===");

      if (
        error.type == STRIPE_ERROR.INVALID_REQUEST ||
        error.type == STRIPE_ERROR.ERROR ||
        error.type == STRIPE_ERROR.StripeCardError
      ) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.CARD_NOT_ADDED,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      } else {
        console.log(error, "=====error====")
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
  };



  /* get client billing history */
  async getClientBillingHistory(req, res) {
    try {
      const { body, user } = req;
      body.client_id = user.id;
      if(user.role_id == ROLES.USER) {
        body.client_id = user.added_by;
        }
      const getClientbillingHistory = await this.services.getClientBillingHistory(body);
      return res
        .status(200)
        .send(
          successResponse(ClientMessages.GET_LIST, getClientbillingHistory, RESPONSE_CODES.GET)
        );
    } catch (error) {
      console.log(error, "===error====")
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

  /* cancel client subscriptions */
  async cancelSubscription(req, res) {
    try {
      const { body, user } = req;
      const checkSubscription = await this.services.getSubscriptionDetail(body.subscription_id);
      if (!checkSubscription) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.SUBSCRIPTION_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }



      if (checkSubscription.status == 4) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.SUBSCRIPTION_ALREADY_CANCEL,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      if (user.role_id == ROLES.ADMIN) {

        if (!body.client_id || (body.client_id && body.client_id == 0)) {
          return res
            .status(400)
            .send(
              errorResponse(
                "client id is required.",
                null,
                RESPONSE_CODES.BAD_REQUEST
              )
            );
        }

        if (body.client_id && body.client_id != 0) {
          /** check client exist or not */
          const checkClient = await this.services.checkClientById(body.client_id);
          if (!checkClient) {
            return res
              .status(400)
              .send(
                errorResponse(
                  ClientMessages.CLIENT_NOT_FOUND,
                  null,
                  RESPONSE_CODES.BAD_REQUEST
                )
              );
          }
        }

      }

      /**  Cancel immediately  */
      let cancelDate = moment(new Date()).unix();
      /**  Cancel at end of billing cycle  */
      if (body.cancel_type == 1) {
        cancelDate = moment(new Date(checkSubscription.end_date)).unix();
      }

      /**  cancel at custom date  */
      if (body.cancel_type == 2) {
        cancelDate = moment(new Date(body.cancel_date)).unix();
      };

      if(checkSubscription.billing_frequency !=1) {
        
        /** cancel subscription in stripe immediately */
        if (body.cancel_type == 0) {
          await this.services.cancelSubscriptionImmediately(checkSubscription.stripe_subscription_id);
        }
        /** cancel subscription in stripe */
        if (body.cancel_type == 1 || body.cancel_type == 2) {
          await this.services.cancelAtSubscription(cancelDate, checkSubscription.stripe_subscription_id);
        }

      }


      let updateSubscriptionData = {
        cancelled_by: user.id,
        cancel_at: cancelDate,
        status: (body.cancel_type == 0) ? 4 : checkSubscription.status,
      };

      /** cancel subscription in table */
      await this.services.updateSubscription(updateSubscriptionData, body.subscription_id);

      if(body.cancel_type == 0) {
        let subscriptionHistory = {
          client_id: checkSubscription.client_id,
          subscription_id: checkSubscription.id,
          description: checkSubscription.title,
          start_date: cancelDate,
          billing_frequency: checkSubscription.billing_frequency,
          price: checkSubscription.total_price,
          type: SUBSCRIPTION_LOGID.STATUS_CHANGE_CANCEL,
        }
        // create Subscription history in Subscriptionhistory Table for client refrence 
        await this.services.createSubscriptionHistory(subscriptionHistory);
      }
      return res
        .status(200)
        .send(
          successResponse(ClientMessages.SUBSCRIPTION_CANCEL, {}, RESPONSE_CODES.GET)
        );
    } catch (error) {

      console.log(error, "=====error===");
      if (
        error.type == STRIPE_ERROR.INVALID_REQUEST ||
        error.type == STRIPE_ERROR.ERROR||
        error.type == STRIPE_ERROR.StripeCardError
      ) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.SUBSCRIPTION_NOT_CANCEL,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      } else {
        console.log(error, "=====error====")
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
  };


  /* get client billing detail */
  async getClientBillingDetail(req, res) {
    try {
      const { params } = req;
      /** check subscription exist or not */
      const checkSubscription = await this.services.getSubscriptionDetail(params.subscription_id);
      if (!checkSubscription) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.SUBSCRIPTION_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      const getBillingPlans = await this.services.getBillingPlans(params.subscription_id, checkSubscription.start_date);
      return res
        .status(200)
        .send(
          successResponse(ClientMessages.GET_LIST, getBillingPlans, RESPONSE_CODES.GET)
        );
    } catch (error) {
      console.log(error, "==error=")
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
  async agentRecentActivityList(req, res) {
    try {
      const { user, body } = req;
      let userId = user.id;
      body.role_id = user.role_id;

      // if(user.role_id == ROLES.USER) {
      //     userId = user.added_by;
      // };

      let getAgentRecentActivity = await this.services.getAgentRecentActitvity(body, user.id);
      return res
        .status(200)
        .send(
          successResponse(ClientMessages.GET_LIST, getAgentRecentActivity, RESPONSE_CODES.GET)
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

  /* get client Subscription Logs */
  async getClientSubscriptionLogs(req, res) {
    try {
      const { body, user } = req;
      body.client_id = user.id;

      const checkSubscription = await this.services.getSubscriptionDetail(body.subscription_id);
      if (!checkSubscription) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.SUBSCRIPTION_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      const getSubscriptionLogs = await this.services.getClientSubscriptionLogs(body);
      return res
        .status(200)
        .send(
          successResponse(ClientMessages.GET_LIST, getSubscriptionLogs, RESPONSE_CODES.GET)
        );
    } catch (error) {
      console.log(error, "===error====")
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



  /** edit subscription api */
  async editSubscription(req, res) {
    try {
      const { body, user } = req;
      /** check subscription exist or not */
      const checkSubscription = await this.services.getSubscriptionInfoById(body.subscription_id);

      if (!checkSubscription) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.SUBSCRIPTION_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      if(checkSubscription.status !=0 && checkSubscription.status !=1) {
        return res
        .status(400)
        .send(
          errorResponse(
            ClientMessages.SUBSCRIPTION_CANNOT_EDIT,
            null,
            RESPONSE_CODES.BAD_REQUEST
          )
        );
      }

      if (body.subscription_data.length > 0) {
        let checkSubscriptionData = await this.services.checkMatchingData(body.subscription_data);
        if (checkSubscriptionData == 0) {
          return res
            .status(400)
            .send(
              errorResponse(
                ClientMessages.SUBSCRIPTION_DATA,
                null,
                RESPONSE_CODES.BAD_REQUEST
              )
            );
        }

      }

      if(checkSubscription.status ==0) {

        if (body.subscription_data[0].billing_start_date != "") {
          let getDate = new Date(body.subscription_data[0].billing_start_date);
          let currentDate = new Date();
          currentDate.setDate(currentDate.getDate() + 2);
          if (getDate <= currentDate) {
            return res
              .status(400)
              .send(
                errorResponse(
                  "Please select at least 2 days future date for start billing.",
                  null,
                  RESPONSE_CODES.BAD_REQUEST
                )
              );
          }
        }

      }


      if (checkSubscription.billing_frequency === 1){
        return res.status(400).send(
          errorResponse(
            "You can't edit this subscription. Because this is a one time subscription.",
            null,
            RESPONSE_CODES.BAD_REQUEST
          )
        );
      }


      if (body.subscription_data.every(item => item.billing_frequency === 1)) {
        return res
            .status(400)
            .send(
              errorResponse(
                "You can't edit this subscription. Because in this have item have one time.",
                null,
                RESPONSE_CODES.BAD_REQUEST
              )
            );
      }

      let paymentLink = "";
      if(checkSubscription.status == 0) {

        /** In case when subscription in not paid but edit plans or add new plans */
        let createSubscriptionData;
        let getPriceIds = [];
        let paymentMode = 'subscription';

        await this.services.expireCheckoutSession(checkSubscription.transaction_id);

        const getClient = await this.services.checkClientById(checkSubscription.client_id);

        let deletedSubscription = {
          deleted_at: moment(new Date()).unix(),
        };
        await this.services.updateSubscription(deletedSubscription, checkSubscription.id);
        await this.services.deleteSubscriptionPlan(deletedSubscription, checkSubscription.id);

        getPriceIds = await this.services.getSubscriptionPriceId(body.subscription_data);
       
        // check if admin add subscription according to billing frequency  
        let customerId = getClient.customer_id;
        if (customerId == "" || customerId == null) {
          // create customer in stripe 
          customerId = await this.services.createStripeCustomer(getClient);
        }

        if (body.subscription_data.every(item => item.billing_frequency === 1)) {
          paymentMode = 'payment';
        }

        // create coupons in stripe  if discount is in request
        let discountId = null;
        if (body.one_time_discount_name && body.one_time_discount && body.one_time_discount_type) {
          discountId = await this.services.createCouponForSubscription(body.one_time_discount_name, body.one_time_discount, body.one_time_discount_type)
        }


        let getTaxRateId = "";
        if(body.global_processing_fee && (body.global_processing_fee !=0 || body.global_processing_fee !="")) {
          getTaxRateId = await this.services.createTaxRateInStripe(body);
        }

        let createSubscription = await this.services.createSubscriptionForClientInEdit(paymentMode, customerId, getPriceIds, checkSubscription.client_id, body.subscription_data[0], discountId, body.subscription_data, getTaxRateId, body.is_manual_payment);

        createSubscriptionData = {
          client_id: checkSubscription.client_id,
          title: body.title,
          description: body.description,
          transaction_id: createSubscription.subscription_id,
          start_date: (body.subscription_data[0].billing_start_date != "") ? moment(new Date(body.subscription_data[0].billing_start_date)).unix() : createSubscription.start_date,
          billing_frequency: body.subscription_data[0].billing_frequency,
          billing_terms: body.subscription_data[0].billing_terms,
          no_of_payments: body.subscription_data[0].no_of_payments,
          one_time_discount_name: body.one_time_discount_name,
          one_time_discount_type: body.one_time_discount_type,
          one_time_discount: body.one_time_discount,
          subtotal: createSubscription.subTotal,
          total_price: createSubscription.amount,
          subscription_link: createSubscription.payment_link,
          link_sent_time: moment(new Date()).unix(),
          global_processing_fee: (body.global_processing_fee != checkSubscription.global_processing_fee) ? body.global_processing_fee : checkSubscription.global_processing_fee,
          global_processing_fee_description: (body.global_processing_fee_description != checkSubscription.global_processing_fee_description) ? body.global_processing_fee_description : checkSubscription.global_processing_fee_description,
          tax_rate_id: getTaxRateId,
          is_manual_payment: body.is_manual_payment,
        }
        paymentLink = createSubscription.payment_link;

        // create Subscription in Subscription Table for client refrence 
        let createClientSubscription = await this.services.createSubscription(createSubscriptionData);

        let subscriptionPlansData = [];
        if (createClientSubscription) {
          for (let i in body.subscription_data) {
            subscriptionPlansData.push({
              subscription_id: createClientSubscription.id,
              client_id: body.client_id,
              product_id: body.subscription_data[i].product_id,
              unit_price: body.subscription_data[i].unit_price,
              unit_discount_type: body.subscription_data[i].unit_discount_type,
              unit_discount: body.subscription_data[i].unit_discount ? body.subscription_data[i].unit_discount : 0,
              net_price: body.subscription_data[i].net_price,
              quantity: body.subscription_data[i].quantity,
              billing_frequency: body.subscription_data[i].billing_frequency,
              is_delay_in_billing: body.subscription_data[i].is_delay_in_billing,
              stripe_price_id: getPriceIds[i].price,
            });
          }
          // create Subscription Plans in Subscription Plan Table for client refrence 
          await this.Models.ClientSubscriptionPlans.bulkCreate(subscriptionPlansData);
        }

          // send payment link to client via email for purchase a subscription
          const to = getClient.email.toLowerCase();
          const emailTemplate = await addSubscription(createSubscriptionData.total_price, paymentLink);
          const subject = "Subscription link";
          let mailFunction = (process.env.PRODUCTION == true || process.env.PRODUCTION == "true") ? nodemailer.sendinBlueMail : nodemailer.sendMail;
          await mailFunction(to, subject, emailTemplate);

      }else {

        /** In case when subscription paid but edit plans or add new plans */

        let subscriptionData = {
          client_id: checkSubscription.client_id,
          title: (body.title == "") ? checkSubscription.title : body.title,
          description: (body.description == "") ? checkSubscription.description : body.description,
          transaction_id: checkSubscription.transaction_id,
          start_date: checkSubscription.start_date,
          billing_frequency: body.subscription_data[0].billing_frequency,
          billing_terms: body.subscription_data[0].billing_terms,
          no_of_payments: body.subscription_data[0].no_of_payments,
          one_time_discount_name: body.one_time_discount_name,
          one_time_discount_type: body.one_time_discount_type,
          one_time_discount: body.one_time_discount,
          subtotal: body.subtotal,
          total_price: body.total_price,
          global_processing_fee: (body.global_processing_fee != checkSubscription.global_processing_fee) ? body.global_processing_fee : checkSubscription.global_processing_fee,
          global_processing_fee_description: (body.global_processing_fee_description != checkSubscription.global_processing_fee_description) ? body.global_processing_fee_description : checkSubscription.global_processing_fee_description,
          is_manual_payment: body.is_manual_payment,
        }
        await this.services.updateSubscription(subscriptionData, checkSubscription.id);


        // let discountId = null;
        // if (body.one_time_discount_name && body.one_time_discount && body.one_time_discount_type) {
        //   discountId = await this.services.createCouponForSubscription(body.one_time_discount_name, body.one_time_discount, body.one_time_discount_type)
        // }
        // await this.services.updateDiscountInStripeSubscription(checkSubscription.stripe_subscription_id, discountId);


        let createSubscriptionHistoryData = {
          subscription_id: checkSubscription.id,
          client_id: checkSubscription.client_id,
          title: (body.title == "") ? checkSubscription.title : body.title,
          description: (body.description == "") ? checkSubscription.description : body.description,
          transaction_id: checkSubscription.transaction_id,
          start_date: checkSubscription.start_date,
          billing_frequency: body.subscription_data[0].billing_frequency,
          billing_terms: body.subscription_data[0].billing_terms,
          no_of_payments: body.subscription_data[0].no_of_payments,
          one_time_discount_name: body.one_time_discount_name,
          one_time_discount_type: body.one_time_discount_type,
          one_time_discount: body.one_time_discount,
          subtotal: body.subtotal,
          total_price: body.total_price,
          price: body.total_price,
          type: SUBSCRIPTION_LOGID.ON_UPDATE,
          is_manual_payment: body.is_manual_payment,
        }
        // create Subscription history in Subscription history Table for client refrence 
        let createClientSubscription = await this.services.createSubscriptionHistory(createSubscriptionHistoryData);

        let subscriptionPlansData = [];
        let createPriceId;
        if(body.subscription_data.length > 0) {

          if (body.subscription_data.every(item => item.plan_id != 0)) {
            let getPriceId = await this.Models.ClientSubscriptionPlans.findAll({
              attributes: ["id", "subscription_id", "stripe_price_id", "deleted_at"],
              where: {
                subscription_id: body.subscription_id,
                deleted_at: null,
                billing_frequency: {
                  [Op.ne]: 1
                }
              },
              order: [["id", "desc"]],
              raw: true
            });

            if(getPriceId.length> 0) {

              let getStripePriceId = getPriceId.map(val => val.stripe_price_id);

              let interval = (body.subscription_data[0].billing_frequency == 6 || body.subscription_data[0].billing_frequency == 7) ? "week" : (body.subscription_data[0].billing_frequency == 5) ? "year" : "month";


              let cancelAt;
              if (body.subscription_data[0].billing_terms == 1) {
                let totalPayments = +body.subscription_data[0].no_of_payments;
    
                let totalMonths = (body.subscription_data[0].billing_frequency == 2) ? totalPayments : (body.subscription_data[0].billing_frequency == 3) ? totalPayments * 3 : (body.subscription_data[0].billing_frequency == 4) ? totalPayments * 6 : (body.subscription_data[0].billing_frequency == 5) ? totalPayments * 1 : (body.subscription_data[0].billing_frequency == 6) ? totalPayments * 1 : (body.subscription_data[0].billing_frequency == 7) ? totalPayments * 4 : totalPayments;
    
                let intervalSet = '';
                if(body.subscription_data[0].billing_frequency == 6 || body.subscription_data[0].billing_frequency == 7){
                  intervalSet = 'week';
                }else if (body.subscription_data[0].billing_frequency == 5) {
                  intervalSet = 'year';
                } else {
                  intervalSet = 'month';
                }
                cancelAt = moment().add(totalMonths, intervalSet).unix();
              }


              let getSubscriptionItem = await this.services.retriveSubscriptionItemsFromStripe(checkSubscription.stripe_subscription_id, getStripePriceId, body.subscription_data[0].unit_price, body.subscription_data[0].quantity, interval, body.subscription_data);

              if(getSubscriptionItem.length > 0) {

                body.global_processing_fee_description = checkSubscription.global_processing_fee_description;

                await this.services.updateSubscriptionInStripe(checkSubscription.stripe_subscription_id, getSubscriptionItem, cancelAt, body);
              }

              let getSubscriptionPlan = await this.services.retriveSubscriptionPlansFromStripe(checkSubscription.stripe_subscription_id);

              if(getSubscriptionPlan.length > 0) {

                for(let plan in body.subscription_data && getSubscriptionPlan) {
                  let updateSubscriptionPlans = {
                    product_id: body.subscription_data[plan].product_id,
                    unit_price: body.subscription_data[plan].unit_price,
                    unit_discount_type: body.subscription_data[plan].unit_discount_type,
                    unit_discount: body.subscription_data[plan].unit_discount ? body.subscription_data[plan].unit_discount : 0,
                    net_price: body.subscription_data[plan].net_price,
                    quantity: body.subscription_data[plan].quantity,
                    billing_frequency: body.subscription_data[plan].billing_frequency,
                    is_delay_in_billing: body.subscription_data[plan].is_delay_in_billing,
                    stripe_price_id: getSubscriptionPlan[plan].price_id,
                  };

                  await this.services.updateSubscriptionPlan(updateSubscriptionPlans, body.subscription_data[plan].plan_id);
                }
              }
            }

          } else {

            for(let i in body.subscription_data) {

              if(body.subscription_data[i].plan_id == 0) {

                body.subscription_data[i].name = (body.title == "") ? checkSubscription.title : body.title;
                createPriceId = await this.services.createSubscriptionPrice(body.subscription_data[i]);
          
                let getSubscriptionItem = await this.services.createSubscriptionItemsInStripe(checkSubscription.stripe_subscription_id, createPriceId, body.subscription_data[i].quantity);
  
                body.subscription_data[i].subscription_id = checkSubscription.id;
                body.subscription_data[i].client_id = checkSubscription.client_id;
                body.subscription_data[i].stripe_price_id = createPriceId;
                await this.services.createSubscriptionPlan(body.subscription_data[i]);
  
                subscriptionPlansData.push({
                  subscription_history_id: createClientSubscription.id,
                  subscription_id: checkSubscription.id,
                  client_id: checkSubscription.client_id,
                  product_id: body.subscription_data[i].product_id,
                  unit_price: body.subscription_data[i].unit_price,
                  unit_discount_type: body.subscription_data[i].unit_discount_type,
                  unit_discount: body.subscription_data[i].unit_discount ? body.subscription_data[i].unit_discount : 0,
                  net_price: body.subscription_data[i].net_price,
                  quantity: body.subscription_data[i].quantity,
                  billing_frequency: body.subscription_data[i].billing_frequency,
                  is_delay_in_billing: body.subscription_data[i].is_delay_in_billing,
                  stripe_price_id: (body.subscription_data[i].plan_id ==0) ? createPriceId : null,
                });

              }
            }
          }
          await this.Models.ClientSubscriptionHistoryPlans.bulkCreate(subscriptionPlansData);

          // If subscription updated as manual or automatic
          if (checkSubscription.is_manual_payment != body.is_manual_payment) {
            let updateStripeSubscription = {};
            if(body.is_manual_payment && body.is_manual_payment == 1) {
              updateStripeSubscription = {
                collection_method: "send_invoice",
                days_until_due: 2
              }
            }else {
              updateStripeSubscription = {
                collection_method: "charge_automatically",
              }
            }
            await this.services.updateSubscriptionsParam(checkSubscription.stripe_subscription_id, updateStripeSubscription); 
          };

        }
      }

      return res
        .status(201)
        .send(
          successResponse(
            ClientMessages.SUBSCRIPTION_UPDATED,
            {},
            RESPONSE_CODES.POST
          )
        );
    } catch (error) {

      console.log(error, "=====error====")

      if (
        error.type == STRIPE_ERROR.INVALID_REQUEST ||
        error.type == STRIPE_ERROR.ERROR||
        error.type == STRIPE_ERROR.StripeCardError
      ) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.SUBSCRIPTION_NOT_EDIT,
              null,
              RESPONSE_CODES.POST
            )
          );
      } else {
        console.log(error, "=====error====")
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
  };


  /* resend client subscription link */
  async resendSubscriptionLink(req, res) {
    try {
      const { params, query } = req;
      /** check subscription exist or not */
      const findResendSubscriptionLink = await this.Models.ClientSubscriptions.findOne({
        attributes: ["id", "client_id", "title", "start_date", "billing_frequency", "total_price", "cancel_at", "status", "created_at", "subscription_link", "deleted_at", "stripe_discount_id", "link_sent_time", "tax_rate_id", "is_manual_payment", [sequelize.literal("(SELECT customer_id FROM users WHERE users.id = client_id limit 1)"), "customer_id"], [sequelize.literal("(SELECT email FROM users WHERE users.id = client_id limit 1)"), "customer_email"]],
        where: {
          id: params.subscription_id,
          deleted_at: null,
        },
        raw: true,
      });

      if (!findResendSubscriptionLink) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.SUBSCRIPTION_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      if(findResendSubscriptionLink.status !=0) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.SUBSCRIPTION_LINK_NOT_SEND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      const currentDate = Math.floor(Date.now() / 1000);
      // Add 1 day to startOfDay
      let paymentLink = findResendSubscriptionLink.subscription_link;
      let totalPrice = findResendSubscriptionLink.total_price;

      let subscriptionResendLinkTime = findResendSubscriptionLink.link_sent_time + 86400; // Add 1 day in seconds

      if(subscriptionResendLinkTime <= currentDate) {
        let subscriptionDataAll = [];
        let priceIds = [];
          let getPlans = await this.Models.ClientSubscriptionPlans.findAll({
            where: {
              subscription_id: findResendSubscriptionLink.id,
              deleted_at: null
            },
            raw: true,
          });
  
        if(getPlans.length > 0) {

          for(let i in getPlans) {
            subscriptionDataAll.push({
              "product_id": getPlans[i].product_id,
              "unit_price": getPlans[i].unit_price,
              "unit_discount_type": getPlans[i].unit_discount_type,
              "unit_discount": getPlans[i].unit_discount,
              "net_price": getPlans[i].net_price,
              "quantity": getPlans[i].quantity,
              "billing_frequency": getPlans[i].billing_frequency,
              "billing_terms": getPlans[i].billing_terms ? getPlans[i].billing_terms : 0,
              "no_of_payments": getPlans[i].no_of_payments ? getPlans[i].no_of_payments : 0,
              "is_delay_in_billing": getPlans[i].is_delay_in_billing ? getPlans[i].is_delay_in_billing : 0,
              "billing_start_date": ""
            });
  
            priceIds.push({ price: getPlans[i].stripe_price_id, quantity: getPlans[i].quantity });
          }
  
          let paymentMode = 'subscription';
      
          if (subscriptionDataAll.every(item => item.billing_frequency === 1)) {
            paymentMode = 'payment';
          }
  
          let discountId = findResendSubscriptionLink.stripe_discount_id ? findResendSubscriptionLink.stripe_discount_id : null;

          let createSubscription = await this.services.resendSubscriptionForClient(paymentMode, findResendSubscriptionLink.customer_id, priceIds, findResendSubscriptionLink.client_id, subscriptionDataAll[0], discountId, subscriptionDataAll, findResendSubscriptionLink.tax_rate_id, findResendSubscriptionLink.is_manual_payment);

          await this.services.createSubscriptionWithbank(params.subscription_id, paymentMode, findResendSubscriptionLink.customer_id, priceIds, findResendSubscriptionLink.client_id, subscriptionDataAll[0], discountId, subscriptionDataAll, findResendSubscriptionLink.is_manual_payment);

          paymentLink = createSubscription.payment_link;
          totalPrice = findResendSubscriptionLink.total_price
          await this.Models.ClientSubscriptions.update({
            transaction_id: createSubscription.subscription_id,
            subscription_link: createSubscription.payment_link,
            link_sent_time: moment(new Date()).unix(),
          },{
            where: {
              id: params.subscription_id,
            }
          });
        }
      }
        
      let dynamicPaymentLink = "";
      if(query.type != 1) {
        const to = findResendSubscriptionLink.customer_email.toLowerCase();
        let payload = {
          subscription_id: params.subscription_id,
          client_id: findResendSubscriptionLink.client_id,
        }
        const subscriptionToken = refreshToken(payload);
        dynamicPaymentLink = `${process.env.BASE_URL}payment-method/${subscriptionToken}`;
        // let dynamicPaymentLink = `http://localhost:3000/payment-method/${subscriptionToken}`;
        const emailTemplate = await addSubscription(totalPrice, dynamicPaymentLink);
        // const emailTemplate = await addSubscription(totalPrice, paymentLink);
        const subject = "Subscription link";
        let mailFunction = (process.env.PRODUCTION == true || process.env.PRODUCTION == "true") ? nodemailer.sendinBlueMail : nodemailer.sendMail;
        await mailFunction(to, subject, emailTemplate);
      }

      let paymentLinkData = {
        // payment_link: paymentLink
        payment_link: dynamicPaymentLink
      };

      return res
        .status(200)
        .send(
          successResponse(ClientMessages.SUBSCRIPTION_LINK_RESEND, paymentLinkData, RESPONSE_CODES.GET)
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



  async deleteBillingHistory(req, res) {
    try {
      const { params } = req;

      await this.Models.ClientSubscriptionHistories.update({
        deleted_at: moment(new Date()).unix(),
      },{
        where: {
          id: params.id,
        },
      });

      return res
        .status(200)
        .send(
          successResponse("Deleted", {}, RESPONSE_CODES.DELETE)
        );
    } catch (error) {
      console.log(error, "===error====")
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


 // update Reminder Setting
  async updateReminderSetting(req, res) {
    try {
      const { body, user } = req;

      let userId = user.id;
      if(user.role_id == ROLES.USER) {
        userId = user.added_by;
      }

      let updateReminderData = {};
      if(body.reminder.length > 0) {
        for(let i in body.reminder) {
          if(body.reminder[i].key == "Send reminder to task creator"){
            updateReminderData.reminder_to_task_creator = body.reminder[i].value;
          }
          if(body.reminder[i].key == "Send reminder to assignees"){
            updateReminderData.reminder_to_assignee = body.reminder[i].value;
          }
          if(body.reminder[i].key == "Send reminder to everyone"){
            updateReminderData.reminder_to_everyone = body.reminder[i].value;
          }
        }
      }

      await this.Models.Users.update(updateReminderData,{
        where: {
          id: userId,
        },
      });
      return res
        .status(200)
        .send(
          successResponse(ClientMessages.REMINDER_UPDATED, {}, RESPONSE_CODES.POST)
        );
    } catch (error) {
      console.log(error, "===error====")
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

  // Get Reminder Setting
   async getReminderSetting(req, res) {
    try {
      const { user } = req;
      let userId = user.id;
      if(user.role_id == ROLES.USER) {
        userId = user.added_by;
        let setAttributes = ["id", "is_settings", "deleted_at"];
        let getPermission = await this.services.getAccountManagerRolePermissions(user.role_permission_id, setAttributes);
        if(getPermission && getPermission.is_settings == 0) {
          return res
          .status(400)
          .send(
            errorResponse(
              `You don't have permission to access reminder`,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
        }
      };
      let getReminderSetting = await this.Models.Users.findOne({
        attributes: ["id", "reminder_to_task_creator", "reminder_to_assignee", "reminder_to_everyone"],
        where: {
          id: userId,
        },
        raw: true
      });

      let reminderData = [
        {
          "key": "Send reminder to task creator",
          "value": getReminderSetting.reminder_to_task_creator
        },
        {
          "key": "Send reminder to assignees",
          "value": getReminderSetting.reminder_to_assignee
        },
        {
          "key": "Send reminder to everyone",
          "value": getReminderSetting.reminder_to_everyone
        }
      ];

      return res
        .status(200)
        .send(
          successResponse(ClientMessages.GET_DATA, reminderData, RESPONSE_CODES.GET)
        );
    } catch (error) {
      console.log(error, "===error====")
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


  // function for toggle to on-off assigned task 
  async assignedTaskOnly(req, res) {
    try {
      const { params, user } = req;
      let userId = user.id;
      if(user.role_id == ROLES.USER) {
          userId = user.added_by;
      }
      let getUser = await this.services.checkUserDetailById(params.user_id);
      if(!getUser) {
        return res
        .status(400)
        .send(
          errorResponse(
            ClientMessages.USER_NOT_FOUND,
            null,
            RESPONSE_CODES.BAD_REQUEST
          )
        );
      }
      
      let message = ClientMessages.TASK_ACCESS_ENABLED;
      let checkPermisiion = await this.services.checkUserTaskPermission(userId, params.user_id);
      if(checkPermisiion && checkPermisiion.is_toggle == 1){
        await this.services.updateUserTaskPermission(userId, params.user_id, 0);
        message = ClientMessages.TASK_ACCESS_DISABLED;
      } else if(checkPermisiion && checkPermisiion.is_toggle == 0) {
        await this.services.updateUserTaskPermission(userId, params.user_id, 1);
        message = ClientMessages.TASK_ACCESS_ENABLED;
      } else {
        let createPermission = {
          client_id: userId,
          user_id: params.user_id,
          is_toggle: 1
        }
        await this.services.createUserTaskPermission(createPermission);
      }

      return res
        .status(200)
        .send(
          successResponse(message, {}, RESPONSE_CODES.GET)
        );
    } catch (error) {
      console.log(error, "===error====")
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


  // function for pasuse subscription 
  async pauseSubscription(req, res) {
    try {
      const { params, user } = req;
      let getSubscription = await this.services.getSubscriptionInfoById(params.subscription_id);
      if(!getSubscription) {
        return res
        .status(400)
        .send(
          errorResponse(
            ClientMessages.SUBSCRIPTION_NOT_FOUND,
            null,
            RESPONSE_CODES.BAD_REQUEST
          )
        );
      }

      if(getSubscription && getSubscription.billing_frequency == 1) {
        return res
        .status(400)
        .send(
          errorResponse(
            ClientMessages.SUBSCRIPTION_NOT_PAUSED_ONE_TIME,
            null,
            RESPONSE_CODES.BAD_REQUEST
          )
        );
      }

      if(getSubscription && getSubscription.status != 1) {
        return res
        .status(400)
        .send(
          errorResponse(
            ClientMessages.SUBSCRIPTION_NOT_PAUSED,
            null,
            RESPONSE_CODES.BAD_REQUEST
          )
        );
      }
      let pauseSubscription = await this.services.pauseSubscriptionInStripe(getSubscription.stripe_subscription_id);
      if(pauseSubscription.pause_collection.behavior == "void"){
        await this.services.updateSubscription({status: 2}, getSubscription.id);
      }
      return res
        .status(200)
        .send(
          successResponse(ClientMessages.SUBSCRIPTION_PAUSED, {}, RESPONSE_CODES.GET)
        );
    } catch (error) {
      console.log(error, "===error====")
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


  // function for pasuse subscription 
  async resumeSubscription(req, res) {
    try {
      const { params, user } = req;
      let getSubscription = await this.services.getSubscriptionInfoById(params.subscription_id);
      if(!getSubscription) {
        return res
        .status(400)
        .send(
          errorResponse(
            ClientMessages.SUBSCRIPTION_NOT_FOUND,
            null,
            RESPONSE_CODES.BAD_REQUEST
          )
        );
      }

      if(getSubscription && getSubscription.billing_frequency == 1) {
        return res
        .status(400)
        .send(
          errorResponse(
            ClientMessages.SUBSCRIPTION_NOT_PAUSED_ONE_TIME,
            null,
            RESPONSE_CODES.BAD_REQUEST
          )
        );
      }

      if(getSubscription && getSubscription.status != 2) {
        return res
        .status(400)
        .send(
          errorResponse(
            ClientMessages.SUBSCRIPTION_NOT_RESUME,
            null,
            RESPONSE_CODES.BAD_REQUEST
          )
        );
      }
      await this.services.resumeSubscriptionInStripe(getSubscription.stripe_subscription_id);
      await this.services.updateSubscription({status: 1, resume_date_time: moment(new Date()).unix()}, getSubscription.id);
      return res
        .status(200)
        .send(
          successResponse(ClientMessages.SUBSCRIPTION_RESUMED, {}, RESPONSE_CODES.GET)
        );
    } catch (error) {
      console.log(error, "===error====")
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


  /* get client Shared File */
  async getClientSharedFile(req, res) {
    try {

      const userAgent = req.headers['user-agent'];
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const acceptLang = req.headers['accept-language'];
      const fingerprint = crypto.createHash('sha256').update(userAgent + ip + acceptLang).digest('hex');

      const fileName = req.params.file_name;
      const userId = req.user.id;
      const userRole = req.user.role_id;
  
      const decoded = verifyToken(req.headers.authorization);
      let getFileSavedBy = await this.Models.SharedFiles.findOne({
        where: {
          file_key: fileName,
          deleted_at: null
        },
        raw: true
      });

      if(!getFileSavedBy) {
        return res
        .status(400)
        .send(
          errorResponse(
            ClientMessages.NOT_ACCESS_FILE,
            null,
            RESPONSE_CODES.BAD_REQUEST
          )
        );
      }

      if(userRole == ROLES.CLIENT) {
        let userIds = [userId, getFileSavedBy.client_id];
        let checkUserOfClient = await this.Models.Users.count({
          where: {
            added_by :  userIds,
            deleted_at: null
          },
          raw: true
        });

        if(checkUserOfClient == 0 && userId != getFileSavedBy.client_id) {
          return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.NOT_ACCESS_FILE,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
        }
      }

      if(userRole == ROLES.ACCOUNTMANAGER) {
        let checkUserPermission = await this.Models.AssignedUsers.findOne({
          attributes: ["id", "user_id"],
          where: {
            account_manager_id: userId,
            user_id: getFileSavedBy.client_id,
            deleted_at: null
          },
          raw: true
        });

        if(!checkUserPermission) {
          return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.NOT_ACCESS_FILE,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
        }
      };


      if(userRole == ROLES.AGENT) {
        let getAllUsersOfClient = await this.services.findAgentById(req.user.id);
        let getClientIds = getAllUsersOfClient.map(val=> val.user_id);
        getClientIds.push(getFileSavedBy.client_id);
        let checkUserPermission = await this.Models.AssignedUsers.findOne({
          attributes: ["id", "user_id"],
          where: {
            agent_id: userId,
            user_id: getClientIds,
            deleted_at: null
          },
          raw: true
        });

        if(!checkUserPermission) {
          return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.NOT_ACCESS_FILE,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
        }
      };

      if(userRole == ROLES.USER) {

        let userIds = [req.user.added_by, userId, getFileSavedBy.client_id];
        let getUserPermission = await this.Models.Users.count({
          where: {
            added_by :  userIds,
            deleted_at: null
          },
          raw: true
        });

        if(getUserPermission == 0 && userId !=getFileSavedBy.client_id) {
          return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.NOT_ACCESS_FILE,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
        }
      };

      
      const payload = {
        id: userId,
        role_id: userRole,
        email: decoded.email,
        login_time: decoded.login_time,
        is_admin: false,
        finger_print: fingerprint,
        file_name: getFileSavedBy.file,
      };

      /** generate token */
      const getToken = refreshToken(payload);
      let makeImageUrl = `${process.env.API_IMAGE_URL}access-shared-file/${getToken}`;

      return res
        .status(200)
        .send(
          successResponse(ClientMessages.FILE_ACCESSED, makeImageUrl, RESPONSE_CODES.GET)
        );

    } catch (error) {
      console.log(error, "==error====");
      return res.status(500).send(errorResponse(CommonMessages.ERROR, null, RESPONSE_CODES.SERVER_ERROR));
    }
  };



  /* client's list for assignees */
  async clientListForAssign(req, res) {
    try {
      const { body, user } = req;
      body.user_id = user.id;
      body.role_id = user.role_id;
      const list = await this.services.getClientListForAssign(body, user);
      return res
        .status(200)
        .send(
          successResponse(ClientMessages.GET_LIST, list, RESPONSE_CODES.GET)
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


  async subscriptionHistorySaved(req, res) {
    try {
      const { body } = req;
      let createHistory = await this.services.createSubscriptionHistory(body);
      if(body.subscription_plan_data && body.subscription_plan_data.length > 0) {
      for(let i in body.subscription_plan_data){
        body.subscription_plan_data[i].subscription_history_id = createHistory.id;
      }
      await this.Models.ClientSubscriptionHistoryPlans.bulkCreate(body.subscription_plan_data);
      }
      return res
        .status(200)
        .send(
          successResponse("History Saved", {}, RESPONSE_CODES.POST)
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


  async clickDocusignLinkSave(req, res) {
    try {
      const { body, user } = req;

      let docusignUrl = "";
      let getClientInfo = await this.Models.ClientSubscriptions.findOne({
        attributes: { include: [[sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = client_subscriptions.client_id)"), "userName"], [sequelize.literal("(SELECT email FROM users WHERE users.id = client_subscriptions.client_id)"), "email"], [sequelize.literal("(SELECT company_name FROM users WHERE users.id = client_subscriptions.client_id)"), "company_name"], [sequelize.literal("(SELECT address FROM users WHERE users.id = client_subscriptions.client_id)"), "address"], [sequelize.literal("(SELECT customer_id FROM users WHERE users.id = client_subscriptions.client_id)"), "customer_id"]] },
        where: {
          id: body.link_click.subscription_id,
        },
        raw: true
      });

      /** Docusign implementation for subscription */
      if (getClientInfo) {

        let clientData = {
          total_amount: getClientInfo.total_price,
          company_name: getClientInfo.company_name,
          address: getClientInfo.address,
          client_name: getClientInfo.userName,
          name: getClientInfo.userName,
          email: getClientInfo.email,
          subscription_id: getClientInfo.id,
          subscription_title: getClientInfo.title,
          id: getClientInfo.client_id
        };

        let subscription_Data = [];

        let subscriptionData = await this.Models.ClientSubscriptionPlans.findAll({
          where: {
            subscription_id: getClientInfo.id
          },
          raw: true,
        });

        for (let i in subscriptionData) {
          const getProductDetail = await this.services.getProductById(subscriptionData[i].product_id);
          subscription_Data.push({
            name: getProductDetail.name,
            description: getProductDetail.description,
            quantity: subscriptionData[i].quantity,
            billing_frequency: (subscriptionData[i].billing_frequency == 1) ? "One Time" : (subscriptionData[i].billing_frequency == 2) ? "Monthly" : (subscriptionData[i].billing_frequency == 3) ? "Quaterly" : (subscriptionData[i].billing_frequency == 4) ? "Semi Annually" : (subscriptionData[i].billing_frequency == 5) ? "Annually" : (subscriptionData[i].billing_frequency == 6) ? "Every One Week" : (subscriptionData[i].billing_frequency == 7) ? "Every 4 Weeks" : "One Time"
          });
        }

        const templateTXT = await docusign(clientData, subscription_Data);
        const text = convert(templateTXT);
        const base64Text = Buffer.from(text).toString('base64');
        docusignUrl = await this.services.createDosusignLink(clientData, base64Text);

        await this.Models.ClientSubscriptions.update({
          docusign_link_click: body.link_click.login_as_client,
          docusign_link: docusignUrl,
        },{
          where: {
            id: body.link_click.subscription_id,
            client_id: body.link_click.client_id
          }
        });
      }
      let result = {
        url: docusignUrl,
      }
      return res
        .status(200)
        .send(
          successResponse("Link clicked", result, RESPONSE_CODES.POST)
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


  // add Roles And Permission
  async addRolesAndPermissionForUser(req, res) {
    try {
      const { body, user } = req;
      let checkRoleExist = await this.services.getRolesAndPermissionsForAdd(body.name, user.id);
      if(checkRoleExist) {
        return res
        .status(400)
        .send(
          errorResponse(
            ClientMessages.ROLE_ALREADY_EXIST,
            null,
            RESPONSE_CODES.BAD_REQUEST
          )
        );
      };

      body.added_by = user.id;
      body.type = 1; // For Users Added by client
      let finalBodyData = {
        ...body,
      };
 
      await this.services.createRolesAndPermissions(finalBodyData);
      return res
        .status(200)
        .send(
          successResponse(ClientMessages.ROLE_AND_PERMISSION_ADDED, {}, RESPONSE_CODES.POST)
        );
    } catch (error) {
      console.log(error, "===error====")
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



  // update Roles And Permission
  async updateRolesAndPermissionForUser(req, res) {
    try {
      const { params, body, user } = req;
      let checkRoleExist = await this.services.getRolesAndPermissionsById(params.role_permission_id);
      if(!checkRoleExist) {
        return res
        .status(400)
        .send(
          errorResponse(
            ClientMessages.ROLE_NOT_FOUND,
            null,
            RESPONSE_CODES.BAD_REQUEST
          )
        );
      };

      // let checkFieldExist = await this.services.checkFields(body);
      
      // if(checkFieldExist == 0){
      //   return res
      //   .status(400)
      //   .send(
      //     errorResponse(
      //       ClientMessages.ENABLE_ONE_PERMISSION,
      //       null,
      //       RESPONSE_CODES.BAD_REQUEST
      //     )
      //   );
      // }
      await this.services.updateRolesAndPermissions(body, params.role_permission_id);
      return res
        .status(200)
        .send(
          successResponse(ClientMessages.ROLE_AND_PERMISSION_UPDATED, {}, RESPONSE_CODES.POST)
        );
    } catch (error) {
      console.log(error, "===error====")
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


  async expireSubscriptionLinkCronFunction(req, res) {
    try {
      /** check subscription exist or not */
      const findResendSubscriptionLink = await this.Models.ClientSubscriptions.findAll({
        attributes: ["id", "client_id", "title", "start_date", "billing_frequency", "total_price", "cancel_at", "status", "created_at", "subscription_link", "deleted_at", "stripe_discount_id", "link_sent_time", "tax_rate_id", "is_manual_payment", [sequelize.literal("(SELECT customer_id FROM users WHERE users.id = client_id limit 1)"), "customer_id"], [sequelize.literal("(SELECT email FROM users WHERE users.id = client_id limit 1)"), "customer_email"]],
        where: {
          status: 0,
          deleted_at: null,
        },
        raw: true,
      });

      const currentDate = Math.floor(Date.now() / 1000);
      // Add 1 day to startOfDay
      let paymentLink = "";
      for(let i in findResendSubscriptionLink) {
        let subscriptionResendLinkTime = findResendSubscriptionLink[i].link_sent_time + 86400; // Add 1 day in seconds
        if(subscriptionResendLinkTime <= currentDate) {
          let subscriptionDataAll = [];
          let priceIds = [];
            let getPlans = await this.Models.ClientSubscriptionPlans.findAll({
              where: {
                subscription_id: findResendSubscriptionLink[i].id,
                deleted_at: null
              },
              raw: true,
            });
    
          if(getPlans.length > 0) {
  
            for(let i in getPlans) {
              subscriptionDataAll.push({
                "product_id": getPlans[i].product_id,
                "unit_price": getPlans[i].unit_price,
                "unit_discount_type": getPlans[i].unit_discount_type,
                "unit_discount": getPlans[i].unit_discount,
                "net_price": getPlans[i].net_price,
                "quantity": getPlans[i].quantity,
                "billing_frequency": getPlans[i].billing_frequency,
                "billing_terms": getPlans[i].billing_terms ? getPlans[i].billing_terms : 0,
                "no_of_payments": getPlans[i].no_of_payments ? getPlans[i].no_of_payments : 0,
                "is_delay_in_billing": getPlans[i].is_delay_in_billing ? getPlans[i].is_delay_in_billing : 0,
                "billing_start_date": ""
              });
    
              priceIds.push({ price: getPlans[i].stripe_price_id, quantity: getPlans[i].quantity });
            }
    
            let paymentMode = 'subscription';
        
            if (subscriptionDataAll.every(item => item.billing_frequency === 1)) {
              paymentMode = 'payment';
            }
    
            let discountId = findResendSubscriptionLink[i].stripe_discount_id ? findResendSubscriptionLink[i].stripe_discount_id : null;
  
            let createSubscription = await this.services.resendSubscriptionForClient(paymentMode, findResendSubscriptionLink[i].customer_id, priceIds, findResendSubscriptionLink[i].client_id, subscriptionDataAll[0], discountId, subscriptionDataAll, findResendSubscriptionLink[i].tax_rate_id, findResendSubscriptionLink[i].is_manual_payment);

            await this.services.createSubscriptionWithbank(findResendSubscriptionLink[i].id, paymentMode, findResendSubscriptionLink[i].customer_id, priceIds, findResendSubscriptionLink[i].client_id, subscriptionDataAll[0], discountId, subscriptionDataAll, findResendSubscriptionLink[i].is_manual_payment);
  
            let payload = {
              subscription_id: findResendSubscriptionLink[i].id,
              client_id: findResendSubscriptionLink[i].client_id,
            }
            const subscriptionToken = refreshToken(payload);
            let dynamicPaymentLink = `${process.env.BASE_URL}payment-method/${subscriptionToken}`;
            // let dynamicPaymentLink = `http://localhost:3000/payment-method/${subscriptionToken}`;
            paymentLink = dynamicPaymentLink;
      
            // paymentLink = createSubscription.payment_link;
            await this.Models.ClientSubscriptions.update({
              transaction_id: createSubscription.subscription_id,
              subscription_link: createSubscription.payment_link,
              link_sent_time: moment(new Date()).unix(),
            },{
              where: {
                id: findResendSubscriptionLink[i].id,
              }
            });

            // send payment link to client via email for purchase a subscription
            const to = findResendSubscriptionLink[i].customer_email.toLowerCase();
            const emailTemplate = await addSubscription(findResendSubscriptionLink.total_price, createSubscription.payment_link);
            const subject = "Subscription link";
            let mailFunction = (process.env.PRODUCTION == true || process.env.PRODUCTION == "true") ? nodemailer.sendinBlueMail : nodemailer.sendMail;
            await mailFunction(to, subject, emailTemplate);
          }
        }
      }
      return res
        .status(200)
        .send(
          successResponse("Expire payment link re-generated successfully.", {}, RESPONSE_CODES.GET)
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


  // get Subscription Payment Link
  async getSubscriptionPaymentLink(req, res) {
    try {
      const { params } = req;
      const getSubscription = await this.Models.ClientSubscriptions.findOne({
        attributes: ["id", ["subscription_link", "card_payment_link"], "bank_payment_link", "status", "deleted_at"],
        where: {
          id: params.subscription_id,
          deleted_at: null
        },
        raw: true
      });
      if (!getSubscription) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.SUBSCRIPTION_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      getSubscription.payment_status = "pending";
      if(getSubscription && getSubscription.status !=0){
        getSubscription.card_payment_link = "";
        getSubscription.bank_payment_link = "";
        getSubscription.payment_status = "paid";
      }

      return res
        .status(200)
        .send(
          successResponse(ClientMessages.GET_DATA, getSubscription, RESPONSE_CODES.GET)
        );
    } catch (error) {
      console.log(error, "===error====")
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


  /** Add Bank account for client */
  async addBank(req, res) {
    const { body, user } = req;
    try {
      const checkSubscription = await this.services.getSubscriptionInfoById(body.subscription_id);
      if (!checkSubscription) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.SUBSCRIPTION_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      let userId = user.id;
      if(user.role_id == ROLES.USER) {
        userId = user.added_by;
      }
      let getUserDetail = await this.services.checkClientById(userId);
      let customerId = getUserDetail.customer_id;
      if (!getUserDetail.customer_id) {
        customerId = await this.services.createStripeCustomer(getUserDetail);
      }
      body.customer_id = customerId;
      body.stripe_subscription_id = checkSubscription.stripe_subscription_id;
      let getBankDetail = await this.services.createBankAsPaymentMethodInStripe(body);
      if(getBankDetail) {
        body.bank_name = getBankDetail.bank_name;
        body.last_digit = getBankDetail.last4;
        body.account_holder_name = getBankDetail.account_holder_name;
        await this.services.createBankInStripe(customerId, body, userId, getBankDetail.id);
      }
      return res
        .status(200)
        .send(
          successResponse(ClientMessages.BANK_ADDED, {}, RESPONSE_CODES.POST)
        );
    } catch (error) {
      console.log(error, "====error===");
      if (
        error.type == STRIPE_ERROR.INVALID_REQUEST ||
        error.type == STRIPE_ERROR.ERROR ||
        error.type == STRIPE_ERROR.StripeCardError
      ) {

        if(error.code == "bank_account_exists") {
          let getBankInfoCondition = {
            user_id: user.id,
            deleted_at: null,
            type: 1,
            last_digit: body.account_number.slice(-4),
          };
          let getBankInfo = await this.services.getPaymentMethodInfoByCondition(getBankInfoCondition);

            if(getBankInfo) {
              let bankExistCondition = {
                subscription_id: body.subscription_id,
                user_id: user.id,
                deleted_at: null,
                type: 1,
                last_digit: body.account_number.slice(-4),
              };
              let isBankExist = await this.services.getPaymentMethodInfoByCondition(bankExistCondition);
              if(isBankExist){
                return res
                .status(400)
                .send(
                  errorResponse(
                    ClientMessages.BANK_ALREADY_EXIST,
                    null,
                    RESPONSE_CODES.BAD_REQUEST
                  )
                );
              }
              body.bank_name = getBankInfo.name;
              body.last_digit = getBankInfo.last_digit;
              body.account_holder_name = getBankInfo.account_holder_name;
              let bankAdded = await this.services.createBankInStripe(user.id, body, user.id, getBankInfo.payment_method_id);

              if(bankAdded) {
                return res
                .status(200)
                .send(
                  successResponse(ClientMessages.BANK_ADDED, {}, RESPONSE_CODES.POST)
                );
              }
            }
        }else {
          return res
          .status(400)
          .send(
            errorResponse(
              error.message,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
        }

      } else {
        console.log(error, "=====error====")
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
  };



  /* update Bank */
  async updateBank(req, res) {
    try {
      const { body, user } = req;
      let getBankInfo = await this.services.getCardInfoByCardId(body.bank_id, user.id);
      if(!getBankInfo){
        return res
        .status(400)
        .send(
          errorResponse(
            ClientMessages.BANK_NOT_FOUND,
            null,
            RESPONSE_CODES.BAD_REQUEST
          )
        );
      }
      body.subscription_id = getBankInfo.subscription_id;
      body.last_digit = getBankInfo.last_digit;
      body.name = getBankInfo.name;
      body.account_holder_name = getBankInfo.account_holder_name,
      body.payment_method_id = getBankInfo.payment_method_id;
      body.user_id = user.id;
      if(user.role_id == ROLES.USER) {
        body.user_id = user.added_by;
      }
      let getUserDetail = await this.services.checkClientById(body.user_id);
      let customerId = getUserDetail.customer_id;
      await this.services.updateBankInStripe(customerId, body);
      return res
        .status(200)
        .send(
          successResponse(ClientMessages.BANK_UPDATED, {}, RESPONSE_CODES.POST)
        );
    } catch (error) {
      console.log(error, "====error===");

      if (
        error.type == STRIPE_ERROR.INVALID_REQUEST ||
        error.type == STRIPE_ERROR.ERROR ||
        error.type == STRIPE_ERROR.StripeCardError
      ) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.BANK_NOT_ADDED,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      } else {
        console.log(error, "=====error====")
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
  };


  /** Buy a subscription for client */
  async buySubscription(req, res) {
    let { body } = req;
    try {
      /** check email exist or not */
      body.email = body.email.toLowerCase();
      const getClient = await this.services.getClientByMail(body.email);
      if (getClient) {
        return res
          .status(400)
          .send(
            errorResponse(
              ClientMessages.INVITE_ALREADY,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      if (body.subscription_data.every(item => item.billing_frequency === 1)) {
        return res
          .status(400)
          .send(
            errorResponse(
              "You can't buy a subscription with one time frequency.",
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      if (body.subscription_data.length > 0) {
        let checkSubscriptionData = await this.services.checkMatchingDataForClient(body.subscription_data);
        if (checkSubscriptionData == 0) {
          return res
            .status(400)
            .send(
              errorResponse(
                ClientMessages.SUBSCRIPTION_DATA,
                null,
                RESPONSE_CODES.BAD_REQUEST
              )
            );
        }

      }
      body.is_verified = 0;
      body.role_id = ROLES.CLIENT;

      const clientData = await this.services.createClient(body);
      body.client_id = clientData.id;

      await createCometChatUser(
        body.first_name + " " + body.last_name,
        clientData.id,
        COMETCHATROLES[ROLES.CLIENT - 1],
        body.email,
        body.phone_number
      ).then((res) => res.json())
        .then(async (json) => {
          await this.services.updateClient(
            { 
              cometUserCreated: 1,
              added_by_user: clientData.id,
              added_by: clientData.id,
            },
            clientData.id
          );
      }).catch((err) => console.error("error in creating Client:" + err));

      let getPaymentId ;
      let customerId = null;
      if (customerId == "" || customerId == null) {
        // create customer in stripe 
        const customerData = {
          email: body.email,
          id: clientData.id
        }
        customerId = await this.services.createStripeCustomer(customerData);
      }

      console.log(customerId, "====customerId====");

      let getCardDetail = await this.services.createPaymentMethodInStripe(body.token);
      if(getCardDetail) {

        body.exp_month = getCardDetail.exp_month;
        body.exp_year = getCardDetail.exp_year;
        body.last_digit = getCardDetail.last4;
        body.is_default = 1;
        body.payment_method = "card";

        await this.services.attachPaymentMethodToCustomer(customerId, getCardDetail.id);
        getPaymentId = getCardDetail.id;
        
      }

      console.log(getPaymentId, "====getPaymentId=========");

      let createSubscriptionData;
      if (body.subscription_data.length > 0) {

        let getPriceIds = [];
        getPriceIds = await this.services.getSubscriptionPriceId(body.subscription_data);

        // create Subscription in stripe 
        let createSubscription= await this.services.buySubscriptionByClient(customerId, getPriceIds, body.client_id, body.subscription_data[0], getPaymentId);


        if(createSubscription.status != "active") {
          await this.Models.Users.destroy({where: {id: body.client_id}});
          return res
          .status(400)
          .send(
            errorResponse(
              "Payment unsuccessful. Please try again.",
              null,
              RESPONSE_CODES.POST
            )
          );
        }

        let getGlobalProcessingFee = await this.Models.SubscriptionSettings.findOne({
          attributes: ["global_processing_fee","tax_rate_id", "global_processing_fee_description"],
          where: {
            deleted_at: null
          },
          raw: true
        });

        createSubscriptionData = {
          client_id: body.client_id,
          title: body.title,
          stripe_subscription_id: createSubscription.subscription_id,
          transaction_id: createSubscription.subscription_id,
          start_date: createSubscription.start_date,
          billing_frequency: body.subscription_data[0].billing_frequency,
          billing_terms: body.subscription_data[0].billing_terms,
          no_of_payments: body.subscription_data[0].no_of_payments,
          subtotal: body.subtotal,
          total_price: body.total_price,
          global_processing_fee: getGlobalProcessingFee && (getGlobalProcessingFee.global_processing_fee !="") ? getGlobalProcessingFee.global_processing_fee: 0,
          tax_rate_id: getGlobalProcessingFee && (getGlobalProcessingFee.tax_rate_id !="") ? getGlobalProcessingFee.tax_rate_id: "",
          global_processing_fee_description: getGlobalProcessingFee && (getGlobalProcessingFee.global_processing_fee_description !="") ? getGlobalProcessingFee.global_processing_fee_description: "",
          status : (createSubscription.status == "active" ? 1 : 0),
          card_last_digit: getCardDetail.last4,
          payment_method: "card",
          card: getCardDetail.brand,
        }
        // create Subscription in Subscription Table for client refrence 

        let createClientSubscription = await this.services.createSubscription(createSubscriptionData);
        body.subscription_id = createClientSubscription.id;
        body.stripe_subscription_id = createSubscription.subscription_id;
        await this.services.createCardInStripe(customerId, body, clientData.id, getCardDetail.id);

        let subscriptionPlansData = [];
        if (createClientSubscription) {
          for (let i in body.subscription_data) {
            subscriptionPlansData.push({
              subscription_id: createClientSubscription.id,
              client_id: body.client_id,
              product_id: body.subscription_data[i].product_id,
              unit_price: body.subscription_data[i].unit_price,
              net_price: body.subscription_data[i].net_price,
              quantity: body.subscription_data[i].quantity,
              billing_frequency: body.subscription_data[i].billing_frequency,
              stripe_price_id: getPriceIds[i].price,
            });
          }
          // create Subscription Plans in Subscription Plan Table for client refrence 
          await this.Models.ClientSubscriptionPlans.bulkCreate(subscriptionPlansData);
        }
      }

      // send payment link to client via email for purchase a subscription
      const to = body.email.toLowerCase();
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

      if(createSubscriptionData.status == 1) {
        const inviteUserLink = `${process.env.BASE_URL}set-password/${token}`;
        const emailTemplate = await setPassword(inviteUserLink)
        const subject = "Set your password.";
        let mailFunction = (process.env.PRODUCTION == true || process.env.PRODUCTION == "true") ? nodemailer.sendinBlueMail : nodemailer.sendMail;
        await mailFunction(to, subject, emailTemplate);
      }

      return res
        .status(201)
        .send(
          successResponse(
            ClientMessages.CLIENT_REGISTERED,
            {},
            RESPONSE_CODES.POST
          )
        );
    } catch (error) {
      console.log(error, "=====error====")
      if (
        error.type == STRIPE_ERROR.INVALID_REQUEST ||
        error.type == STRIPE_ERROR.ERROR||
        error.type == STRIPE_ERROR.StripeCardError
      ) {

        await this.Models.Users.destroy({where: {id: body.client_id}});
        await this.Models.ClientSubscriptions.destroy({where: {client_id: body.client_id}});
        await this.Models.ClientSubscriptionPlans.destroy({where: {client_id: body.client_id}});
        await this.Models.ClientSubscriptionHistories.destroy({where: {client_id: body.client_id}});
        await this.Models.ClientSubscriptionHistoryPlans.destroy({where: {client_id: body.client_id}});

        return res
          .status(400)
          .send(
            errorResponse(
              error.message,
              null,
              RESPONSE_CODES.POST
            )
          );
      } else {
        console.log(error, "=====error====")
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
  };

  /* get access shared file */
  async accessSharedFileUrl(req, res) {
    try {
      const token = req.params.token;
      if(!token) {
        return res
        .status(400)
        .send(
          errorResponse(
            ClientMessages.NOT_ACCESS_FILE,
            null,
            RESPONSE_CODES.BAD_REQUEST
          )
        );
      }

      let finalToken = `Bearer ${token}`;
      const decoded = verifyToken(finalToken);

      const userAgent = req.headers['user-agent'];
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const acceptLang = req.headers['accept-language'];
      const fingerprint = crypto.createHash('sha256').update(userAgent + ip + acceptLang).digest('hex');
      
      if (decoded.finger_print && decoded.finger_print != fingerprint) {
        return res
        .status(400)
        .send(
          errorResponse(
            ClientMessages.NOT_ACCESS_FILE,
            null,
            RESPONSE_CODES.BAD_REQUEST
          )
        );
      }

      let findUserLoginOrNot = await this.Models.UserLoginTime.findOne({
        where: {
          user_id: decoded.id,
          login_time: decoded.login_time,
        },
        raw: true
      });

      if(!findUserLoginOrNot) {
        return res
        .status(400)
        .send(
          errorResponse(
            ClientMessages.NOT_ACCESS_FILE,
            null,
            RESPONSE_CODES.BAD_REQUEST
          )
        );
      }

      let getImage = await generatePresignedUrl(decoded.file_name);
      const imageResponse = await axios.get(getImage, { responseType: 'arraybuffer' }); // Important!
      if (imageResponse.status !== 200) {
          throw new Error(`Error fetching image: ${imageResponse.status} ${imageResponse.statusText}`);
      }
      const imageBuffer = Buffer.from(imageResponse.data, 'binary') // added this line
      res.set('Content-Type', imageResponse.headers['content-type']);
      res.send(imageBuffer);

    } catch (error) {
      console.log(error, "==error====");
      return res.status(500).send(errorResponse(CommonMessages.ERROR, null, RESPONSE_CODES.SERVER_ERROR));
    }
  };

}
