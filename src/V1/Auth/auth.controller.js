require("dotenv").config();
import Services from "./auth.services";
import bcrypt from "bcrypt";
import { RESPONSE_CODES, ROLES, TOKEN_TYPE, AGENT_PROFILE_COMPLETE_STATUS, USER_STATUS, ASSIGNED_USERS, COMETCHATROLES, STRIPE_ERROR ,CALENDAR_SYNC} from "../../../config/constants";
import { successResponse, errorResponse } from "../../../config/responseHelper";
import { AuthMessages } from "../../../constants/message/auth";
import { CommonMessages } from "../../../constants/message/common";
import { refreshToken } from "../helpers/jwt";
import nodemailer from "../helpers/mail";
import { forgetPasswordOtp } from "../EmailTemplates/forget_password_otp"
import { docusignForAgent } from "../EmailTemplates/docusign_for_agent"
import { twoFactorAuthenticationOtp } from "../EmailTemplates/two_factor_authentication_otp"
import randomstring from "randomstring";
import moment from "moment";
const { convert } = require('html-to-text');
import sequelize from "sequelize";
const Op = sequelize.Op;
import { uploadFileForAll, updateCometChatUser, getCometChatUser, createCometChatUser, deActivateCometChatUser, reActivateCometChatUser, addGoogleCalenderEvent } from "../helpers/commonFunction"
import { v4 as uuidv4 } from 'uuid';
import ClientServices from "../Client/client.services.js";
const qs = require('qs');
const axios = require('axios');


const crypto = require("crypto-js");
const key = process.env.REDIRECT_SECURITY_KEY;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

const { OAuth2Client } = require('google-auth-library');
const { google } = require("googleapis");
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);
// const oauth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);

export default class Auth {
  async init(db) {
    this.services = new Services();
    this.ClientServices = new ClientServices();
    this.Models = db.models;
    this.sequelize = db.sequelize;
    await this.services.init(db);
    await this.ClientServices.init(db);
  }

  /* login */
  async userLogin(req, res) {
    try {
      const { email, password, device_id, device_type, fcm_token } = req.body;
      /** check user email */
      const checkEmail = await this.services.getByEmail(email);
      if (!checkEmail) {
        return res
          .status(400)
          .send(
            errorResponse(
              AuthMessages.INVALID_EMAIL,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      if (checkEmail.deleted_at != null) {
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
              `We regret to inform you that your account has been deleted. Please contact ${getadmin.email} for further assistance.`,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      if (checkEmail.password == "" || checkEmail.password == null) {
        return res
          .status(400)
          .send(
            errorResponse(
              AuthMessages.PASSWORD_NOT_SET,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      /** check user password */
      const checkPassword = await bcrypt.compare(password, checkEmail.password);
      if (!checkPassword) {
        return res
          .status(400)
          .send(
            errorResponse(
              AuthMessages.INVALID_PASSWORD,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }


      if (checkEmail.role_id != ROLES.ADMIN && checkEmail.status == USER_STATUS.INACTIVE) {
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

      if (checkEmail.global_two_factor == 1) {
        const otp = Math.floor(1000 + Math.random() * 9000);
        const otpExpiryTime = moment().add(5, 'minutes').unix();
        let otpField = {
          two_factor_otp: otp,
          two_factor_otp_expiry: otpExpiryTime,
        };
        await this.services.updateUser(otpField, checkEmail.id);
        /** Two factor authentication otp  */
        const emailTemplate = await twoFactorAuthenticationOtp(otp);
        const subject = "Two factor authentication otp";
        await nodemailer.sendinBlueMail(email, subject, emailTemplate);

      } else {

        if (checkEmail.two_factor_authentication == 1) {
          const otp = Math.floor(1000 + Math.random() * 9000);
          const otpExpiryTime = moment().add(5, 'minutes').unix();
          let otpField = {
            two_factor_otp: otp,
            two_factor_otp_expiry: otpExpiryTime,
          };
          await this.services.updateUser(otpField, checkEmail.id);
          /** Two factor authentication otp  */
          const emailTemplate = await twoFactorAuthenticationOtp(otp);
          const subject = "Two factor authentication otp";
          await nodemailer.sendinBlueMail(email, subject, emailTemplate);
        }

      }

      let uuid = 0;
      if (checkEmail.uuid == "" || checkEmail.uuid == null) {
        uuid = uuidv4();
        let updateUuid = {
          uuid: uuid,
        };
        await this.services.updateUser(updateUuid, checkEmail.id);
      }

      const loginTime = moment(new Date()).unix();
      let createData = {
        user_id: checkEmail.id,
        login_time: loginTime,
        device_id: device_id,
        device_type: device_type,
        fcm_token: fcm_token
      };
      await this.services.createLoginTime(createData);
      let getUser = await this.services.getUserById(checkEmail.id);

      if (getUser && getUser.dataValues.role_id == ROLES.CLIENT) {
        if (getUser.dataValues.pending_subscription_id) {
          const pendingSubPayload = {
            subscription_id: getUser.dataValues.pending_subscription_id,
            client_id: checkEmail.id,
          }
          const subscriptionToken = refreshToken(pendingSubPayload);
          getUser.dataValues.subscription_link = `${process.env.BASE_URL}payment-method/${subscriptionToken}`;
          // let dynamicPaymentLink = `http://localhost:3000/payment-method/${subscriptionToken}`;
        }
      }
      let agentDetail;
      let getUserDetail;
      if (getUser && getUser.dataValues.role_id == ROLES.AGENT && (getUser.dataValues.is_complete_profile == AGENT_PROFILE_COMPLETE_STATUS.NO_ACTION_PERFORM || getUser.dataValues.is_complete_profile == AGENT_PROFILE_COMPLETE_STATUS.SEND_DOCUSIGN_LINK || getUser.dataValues.is_complete_profile == null)) {
        const templateTXT = await docusignForAgent(getUser);
        const text = convert(templateTXT);
        const base64Text = Buffer.from(text).toString('base64');
        let docusignLink = await this.services.createDosusignLink(getUser, base64Text);
        await this.services.updateUser({ docusign_link: docusignLink, is_complete_profile: 1 }, getUser.dataValues.id);
      }

      if (getUser && getUser.dataValues.role_id == ROLES.AGENT) {
        agentDetail = await this.services.getAgentByAgentId(getUser.dataValues.id);
        agentDetail.projects = await this.services.getProjectsForAgentByAgentId(getUser.dataValues.id);
      }

      if (getUser && getUser.dataValues.role_id == ROLES.USER) {
        getUserDetail = await this.services.getAgentByAgentId(getUser.dataValues.id);
        getUserDetail.projects = await this.services.getAllProjectsForUserByUserId(getUser.dataValues.id, getUser.dataValues.added_by, getUserDetail);
      }

      let finalUserDetail = (getUser && getUser.dataValues.role_id == ROLES.AGENT) ? agentDetail : (getUser && getUser.dataValues.role_id == ROLES.USER) ? getUserDetail : getUser.toJSON();


      if (finalUserDetail && finalUserDetail.projects.length > 0) {
        delete finalUserDetail.projects;
        finalUserDetail.projects = true;
      } else {
        delete finalUserDetail.projects;
        finalUserDetail.projects = false;
      }

      if (checkEmail.global_two_factor == 1) {
        finalUserDetail.two_factor_authentication = 1
      };

      let { docusign_link, subscription_link, subscription_and_docusign, ...clientResponse } = finalUserDetail;

      const payload = {
        id: checkEmail.id,
        role_id: checkEmail.role_id,
        first_name: checkEmail.first_name,
        last_name: checkEmail.last_name,
        email: checkEmail.email,
        login_time: loginTime,
        device_id: device_id,
        uuid: (checkEmail.uuid == "" || checkEmail.uuid == null) ? uuid : checkEmail.uuid,
        user: clientResponse,
        is_admin: false,
      };

      /** generate token */
      const token = refreshToken(payload);
      const data = {
        access_token: token,
        user: finalUserDetail
      };

      let userExistInCometChat = await getCometChatUser(finalUserDetail.id)
        .then((res) => {
          return res.data;
        })
        .catch((err) => {
          console.error("error in get User: " + err);
        });

      if (!userExistInCometChat) {
        await createCometChatUser(
          finalUserDetail.first_name + " " + finalUserDetail.last_name,
          finalUserDetail.id,
          COMETCHATROLES[finalUserDetail.role_id - 1],
          finalUserDetail.email,
          finalUserDetail.phone_number
        )
          .then((res) => res.json())
          .then(async (json) => {
            await this.services.updateUser(
              { cometUserCreated: 1 },
              finalUserDetail.id
            );
          })
          .catch((err) => console.error("error in creating Client:" + err));
      }

      return res
        .status(201)
        .send(
          successResponse(AuthMessages.LOGIN_SUCCESS, data, RESPONSE_CODES.POST)
        );
    } catch (error) {
      console.log(error, "===error===")
      return res.status(500).send(errorResponse(CommonMessages.ERROR, null, RESPONSE_CODES.SERVER_ERROR));
    }
  }


  /* logout */
  async logout(req, res) {
    try {
      await this.services.logoutUser(req.headers.authorization);
      return res
        .status(201)
        .send(
          successResponse(
            AuthMessages.LOGOUT_SUCCESS,
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


  /* forgot password */
  async forgotPassword(req, res) {
    try {
      const { body } = req;
      /** check email */
      body.email = body.email.toLowerCase();
      const checkEmail = await this.services.getByEmail(body.email);
      if (!checkEmail) {
        return res
          .status(404)
          .send(
            errorResponse(
              AuthMessages.EMAIL_NOT_FOUND,
              null,
              RESPONSE_CODES.NOT_FOUND
            )
          );
      }
      let otpExpiryTime = moment().add(5, 'minutes').unix();
      const otp = Math.floor(1000 + Math.random() * 9000);
      let otpField = {
        otp: otp,
        otp_expiry: otpExpiryTime,
      };
      await this.services.updateUser(otpField, checkEmail.id);
      /** forgot password link */
      const emailTemplate = await forgetPasswordOtp(otp);
      const subject = "Forgot password otp";

      let mailFunction = (process.env.PRODUCTION == true || process.env.PRODUCTION == "true") ? nodemailer.sendinBlueMail : nodemailer.sendMail;
      await mailFunction(body.email, subject, emailTemplate);

      return res
        .status(201)
        .send(
          successResponse(
            AuthMessages.FORGOT_PASSWORD_LINK,
            { expiry_time: otpExpiryTime },
            RESPONSE_CODES.POST
          )
        );
    } catch (error) {
      console.log(error, "==error==")
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

  /* verify otp */
  async verifyOtp(req, res) {
    try {
      const { body } = req;
      body.email = body.email.toLowerCase();
      const findUserByEmail = await this.services.getByEmail(body.email);
      if (!findUserByEmail) {
        return res
          .status(404)
          .send(
            errorResponse(
              AuthMessages.INVALID_EMAIL,
              null,
              RESPONSE_CODES.NOT_FOUND
            )
          );
      }
      let data = {};
      let otpField = {};
      if (body.type && body.type == 1) {

        if (findUserByEmail && moment.utc(findUserByEmail.two_factor_otp_expiry) < moment.utc(new Date()).unix()) {

          return res
            .status(404)
            .send(
              errorResponse(
                AuthMessages.OTP_EXPIRED,
                null,
                RESPONSE_CODES.NOT_FOUND
              )
            );
        }

        if (findUserByEmail && findUserByEmail.two_factor_otp != body.otp) {
          return res
            .status(404)
            .send(
              errorResponse(
                AuthMessages.INVALID_OTP,
                null,
                RESPONSE_CODES.NOT_FOUND
              )
            );
        }

        const loginTime = moment(new Date()).unix();
        const payload = {
          id: findUserByEmail.id,
          role_id: findUserByEmail.role_id,
          first_name: findUserByEmail.first_name,
          last_name: findUserByEmail.last_name,
          email: findUserByEmail.email,
          login_time: loginTime,
        };

        let createData = {
          user_id: findUserByEmail.id,
          login_time: loginTime,
        };
        await this.services.createLoginTime(createData);
        let getUser = await this.services.getUserById(findUserByEmail.id);
        if (getUser && getUser.dataValues.role_id == ROLES.CLIENT && getUser.dataValues.subcription_status == "Cancelled") {
          return res
            .status(400)
            .send(
              errorResponse(
                AuthMessages.CANCEL_STATUS,
                null,
                RESPONSE_CODES.BAD_REQUEST
              )
            );
        }
        let agentDetail;
        if (getUser && getUser.dataValues.role_id == ROLES.AGENT && (getUser.dataValues.is_complete_profile == AGENT_PROFILE_COMPLETE_STATUS.NO_ACTION_PERFORM || getUser.dataValues.is_complete_profile == null)) {
          const templateTXT = await docusignForAgent(getUser);
          const text = convert(templateTXT);
          const base64Text = Buffer.from(text).toString('base64');
          let docusignLink = await this.services.createDosusignLink(getUser, base64Text);
          await this.services.updateUser({ docusign_link: docusignLink, is_complete_profile: 1 }, getUser.dataValues.id);
        }

        if (getUser && getUser.dataValues.role_id == ROLES.AGENT) {
          agentDetail = await this.services.getAgentByAgentId(getUser.dataValues.id);
          agentDetail.projects = await this.services.getProjectsForAgentByAgentId(getUser.dataValues.id);
        }
        /** generate token */
        const token = refreshToken(payload);

        let finalUserDetail = (getUser && getUser.dataValues.role_id == ROLES.AGENT) ? agentDetail : getUser.toJSON();

        if (finalUserDetail && finalUserDetail.projects.length > 0) {
          delete finalUserDetail.projects;
          finalUserDetail.projects = true;
        } else {
          delete finalUserDetail.projects;
          finalUserDetail.projects = false;
        }

        data = {
          access_token: token,
          user: finalUserDetail,
        };

        otpField = {
          two_factor_otp: 0,
          two_factor_otp_expiry: 0
        };
        await this.services.updateUser(otpField, findUserByEmail.id);

      } else {

        if (findUserByEmail && moment.utc(findUserByEmail.otp_expiry) < moment.utc(new Date()).unix()) {
          return res
            .status(404)
            .send(
              errorResponse(
                AuthMessages.OTP_EXPIRED,
                null,
                RESPONSE_CODES.NOT_FOUND
              )
            );
        }

        if (findUserByEmail && findUserByEmail.otp != body.otp) {
          return res
            .status(404)
            .send(
              errorResponse(
                AuthMessages.INVALID_OTP,
                null,
                RESPONSE_CODES.NOT_FOUND
              )
            );
        }
        otpField = {
          otp: 0,
          otp_expiry: 0
        };

        let getGlobalSetting = await this.Models.GlobalSettings.findOne({
          attributes: ["id", "user_role", "is_authenticate"],
          where: {
            user_role: 7
          },
          raw: true
        });

        const loginTime = moment(new Date()).unix();
        const payload = {
          email: findUserByEmail.email,
          login_time: loginTime,
          password_setting: getGlobalSetting.is_authenticate
        };
        /** generate token */
        const token = refreshToken(payload);
        data = {
          token: token,
        };
      }
      await this.services.updateUser(otpField, findUserByEmail.id);
      return res
        .status(200)
        .send(successResponse(AuthMessages.OTP_VERIFIED, data, RESPONSE_CODES.POST));
    } catch (error) {
      return res
        .status(500)
        .send(
          errorResponse(CommonMessages.ERROR, null, RESPONSE_CODES.SERVER_ERROR)
        );
    }
  }

  /* reset password */
  async resetPassword(req, res) {
    try {
      const { body } = req;
      body.email = body.email.toLowerCase();
      const checkEmail = await this.services.getByEmail(body.email);
      if (!checkEmail) {
        return res
          .status(400)
          .send(
            errorResponse(
              AuthMessages.INVALID_EMAIL,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }


      if (checkEmail.role_id != ROLES.ADMIN && checkEmail.status == USER_STATUS.INACTIVE) {
        const getadmin = await this.Models.Users.findOne({
          where: {
            role_id: 1,
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


      if (checkEmail.role_id != ROLES.ADMIN && checkEmail.two_factor_authentication == 1) {
        const otp = Math.floor(1000 + Math.random() * 9000);
        const otpExpiryTime = moment().add(5, 'minutes').unix();
        let otpField = {
          two_factor_otp: otp,
          two_factor_otp_expiry: otpExpiryTime,
        };
        await this.services.updateUser(otpField, checkEmail.id);
        /** Two factor authentication otp  */
        const emailTemplate = await twoFactorAuthenticationOtp(otp);
        const subject = "Two factor authentication otp";
        await nodemailer.sendinBlueMail(body.email, subject, emailTemplate);
      }

      const loginTime = moment(new Date()).unix();
      const payload = {
        id: checkEmail.id,
        role_id: checkEmail.role_id,
        first_name: checkEmail.first_name,
        last_name: checkEmail.last_name,
        email: checkEmail.email,
        login_time: loginTime,
      };

      let createData = {
        user_id: checkEmail.id,
        login_time: loginTime,
      };
      await this.services.createLoginTime(createData);
      let getUser = await this.services.getUserById(checkEmail.id);

      if (getUser && getUser.dataValues.role_id == ROLES.CLIENT && getUser.dataValues.subcription_status == "Cancelled") {
        return res
          .status(400)
          .send(
            errorResponse(
              AuthMessages.CANCEL_STATUS,
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
        let docusignLink = await this.services.createDosusignLink(getUser, base64Text);
        await this.services.updateUser({ docusign_link: docusignLink, is_complete_profile: 1 }, getUser.dataValues.id);
      }

      if (getUser && getUser.dataValues.role_id == ROLES.AGENT) {
        agentDetail = await this.services.getAgentByAgentId(getUser.dataValues.id);
        agentDetail.projects = await this.services.getProjectsForAgentByAgentId(getUser.dataValues.id);
      }


      if (getUser && getUser.dataValues.role_id == ROLES.USER) {
        getUserDetail = await this.services.getAgentByAgentId(getUser.dataValues.id);
        getUserDetail.projects = await this.services.getAllProjectsForUserByUserId(getUser.dataValues.id, getUser.dataValues.added_by, getUserDetail);
      }

      let finalUserDetail = (getUser && getUser.dataValues.role_id == ROLES.AGENT) ? agentDetail : (getUser && getUser.dataValues.role_id == ROLES.USER) ? getUserDetail : getUser.toJSON();

      if (finalUserDetail && finalUserDetail.projects.length > 0) {
        delete finalUserDetail.projects;
        finalUserDetail.projects = true;
      } else {
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
        otp: "",
        password: body.password,
      };
      await this.services.updateUser(updateData, checkEmail.id);

      return res
        .status(201)
        .send(
          successResponse(
            AuthMessages.RESET_PASSWORD,
            data,
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
  }

  /* change password */
  async changePassword(req, res) {
    try {
      const { user, body, headers } = req;

      if (body.type == 1) {
        const passwordMatch = await bcrypt.compare(
          body.old_password,
          user.password
        );
        if (!passwordMatch) {
          return res
            .status(400)
            .send(
              errorResponse(
                AuthMessages.WRONG_PASSWORD,
                null,
                RESPONSE_CODES.BAD_REQUEST
              )
            );
        }

        if (body.old_password === body.new_password) {
          return res
            .status(400)
            .send(
              errorResponse(
                AuthMessages.NEW_PASSWORD_COMPARISON,
                null,
                RESPONSE_CODES.BAD_REQUEST
              )
            );
        }
      }
      if (body.type == 2) {
        const getClientDetail = await this.services.getClientById(body.client_id);

        if (!getClientDetail) {
          return res
            .status(400)
            .send(
              errorResponse(
                AuthMessages.USER_NOT_FOUND,
                null,
                RESPONSE_CODES.BAD_REQUEST
              )
            )
        }
      }

      await this.services.updateUser({ password: body.new_password }, (body.type == 1) ? user.id : body.client_id);
      // await this.services.logoutUser(body.type, (body.type == 1) ? headers.authorization : body.client_id);
      return res
        .status(201)
        .send(
          successResponse(
            AuthMessages.PASSWORD_CHANGE_SUCCESS,
            null,
            RESPONSE_CODES.POST
          )
        );
    } catch (error) {
      console.log(error, "===error===");
      return res
        .status(500)
        .send(
          errorResponse(CommonMessages.ERROR, null, RESPONSE_CODES.SERVER_ERROR)
        );
    }
  }


  async refreshToken(req, res) {
    try {
      const { user } = req;
      const checkEmail = await this.services.getByEmail(user.email);
      if (!checkEmail) {
        return res
          .status(400)
          .send(
            errorResponse(
              AuthMessages.INVALID_EMAIL,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      const loginTime = moment(new Date()).unix();

      let createData = {
        user_id: checkEmail.id,
        login_time: loginTime,
      };
      await this.services.createLoginTime(createData);
      let getUser = await this.services.getUserById(checkEmail.id);

      if (getUser && getUser.dataValues.role_id == ROLES.CLIENT) {
        if (getUser.dataValues.pending_subscription_id) {
          const pendingSubPayload = {
            subscription_id: getUser.dataValues.pending_subscription_id,
            client_id: checkEmail.id,
            payment_status: "pending",
          }
          const subscriptionToken = refreshToken(pendingSubPayload);
          getUser.dataValues.subscription_link = `${process.env.BASE_URL}payment-method/${subscriptionToken}`;
        }
      }

      let agentDetail;
      let getUserDetail;
      if (getUser && getUser.dataValues.role_id == ROLES.AGENT) {
        agentDetail = await this.services.getAgentByAgentId(getUser.dataValues.id);
        agentDetail.projects = await this.services.getProjectsForAgentByAgentId(getUser.dataValues.id);
      }

      if (getUser && getUser.dataValues.role_id == ROLES.USER) {
        getUserDetail = await this.services.getAgentByAgentId(getUser.dataValues.id);
        getUserDetail.projects = await this.services.getAllProjectsForUserByUserId(getUser.dataValues.id, getUser.dataValues.added_by, getUserDetail);
      }

      let finalUserDetail = (getUser && getUser.dataValues.role_id == ROLES.AGENT) ? agentDetail : (getUser && getUser.dataValues.role_id == ROLES.USER) ? getUserDetail : getUser.toJSON();

      if (finalUserDetail && finalUserDetail.projects.length > 0) {
        delete finalUserDetail.projects;
        finalUserDetail.projects = true;
      } else {
        delete finalUserDetail.projects;
        finalUserDetail.projects = false;
      }

      let { docusign_link, subscription_link, subscription_and_docusign, ...clientResponse } = finalUserDetail;

      const payload = {
        id: checkEmail.id,
        role_id: user.role_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: checkEmail.email,
        login_time: loginTime,
        uuid: checkEmail.uuid,
        user: clientResponse,
      };
      /** generate token */
      const token = refreshToken(payload);
      const data = {
        access_token: token,
        user: finalUserDetail,
      };
      return res
        .status(201)
        .send(
          successResponse(AuthMessages.TOKEN_SUCCESS, data, RESPONSE_CODES.GET)
        );
    } catch (error) {
      console.log(error,)
      return res.status(500).send(errorResponse(CommonMessages.ERROR, null, RESPONSE_CODES.SERVER_ERROR));
    }
  }


  async socialLogin(req, res) {
    try {
      const { body } = req;

      let payload = {};
      let createData = {};
      const loginTime = moment(new Date()).unix();
      let checkEmail = await this.services.getUserByEmailOrSocialId(body.email, body.social_id);
      if (checkEmail) {

        if (checkEmail && checkEmail.role_id != ROLES.CLIENT) {
          return res
            .status(400)
            .send(
              errorResponse(
                AuthMessages.NOT_CLIENT_EMAIL,
                null,
                RESPONSE_CODES.BAD_REQUEST
              )
            );
        }

        const getadmin = await this.Models.Users.findOne({
          where: {
            role_id: ROLES.ADMIN,
            deleted_at: null
          }
        });

        if (checkEmail.deleted_at != null) {
          return res
            .status(400)
            .send(
              errorResponse(
                `We regret to inform you that your account has been deleted. Please contact ${getadmin.email} for further assistance.`,
                null,
                RESPONSE_CODES.BAD_REQUEST
              )
            );
        }

        if (checkEmail.status == USER_STATUS.INACTIVE) {
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

        payload = {
          id: checkEmail.id,
          role_id: checkEmail.role_id,
          first_name: checkEmail.first_name,
          last_name: checkEmail.last_name,
          email: checkEmail.email,
          login_time: loginTime,
        };

        createData = {
          user_id: checkEmail.id,
          login_time: loginTime,
        };

      } else {

        body.is_verified = 0;
        body.role_id = ROLES.CLIENT;
        let createUser = await this.services.createUser(body);
        payload = {
          id: createUser.id,
          role_id: createUser.role_id,
          first_name: createUser.first_name,
          last_name: createUser.last_name,
          email: createUser.email,
          login_time: loginTime,
        };

        createData = {
          user_id: createUser.id,
          login_time: loginTime,
        };
      }

      await this.services.createLoginTime(createData);
      let getUser = await this.services.getUserById(payload.id);

      if (getUser && getUser.dataValues.role_id == ROLES.CLIENT && getUser.dataValues.subcription_status == "Cancelled") {
        return res
          .status(400)
          .send(
            errorResponse(
              AuthMessages.CANCEL_STATUS,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      let finalUserDetail = getUser.toJSON();
      if (finalUserDetail && finalUserDetail.projects.length > 0) {
        delete finalUserDetail.projects;
        finalUserDetail.projects = true;
      } else {
        delete finalUserDetail.projects;
        finalUserDetail.projects = false;
      }

      if (finalUserDetail.global_two_factor == 1) {
        finalUserDetail.two_factor_authentication = 1;
      }
      /** generate token */
      const token = refreshToken(payload);
      const data = {
        access_token: token,
        user: finalUserDetail,
      };
      return res
        .status(201)
        .send(
          successResponse(AuthMessages.LOGIN_SUCCESS, data, RESPONSE_CODES.POST)
        );
    } catch (error) {
      console.log(error, "==========error========")
      return res.status(500).send(errorResponse(CommonMessages.ERROR, null, RESPONSE_CODES.SERVER_ERROR));
    }
  }


  /* user status update */
  async userStatusUpdate(req, res) {
    try {
      const { body } = req;
      const user = await this.services.findUserDetailById(body.user_id);
      if (!user) {
        return res
          .status(400)
          .send(
            errorResponse(
              AuthMessages.USER_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      let updateData = {
        status: body.status,
      };
      await this.services.updateUser(updateData, user.id);

      if (body.status == 1) {
        await reActivateCometChatUser(user.id);
      } else {
        await deActivateCometChatUser(user.id);
      }

      if (user.role_id == ROLES.CLIENT) {

        let getSubscriptionCondition = {
          client_id: user.id,
          status: [1, 2],
          billing_frequency: {
            [Op.ne]: 1
          },
        }

        const getSubscriptions = await this.Models.ClientSubscriptions.findAll({
          attributes: ["stripe_subscription_id"],
          where: getSubscriptionCondition,
          raw: true
        });


        // Cancel subscriptions concurrently
        if (getSubscriptions.length > 0) {

          let updateStatus = {};
          if (body.status == 1) {
            const resumeSubscriptionPromises = getSubscriptions.map(subscription =>
              this.ClientServices.resumeSubscriptionInStripe(subscription.stripe_subscription_id)
            );
            await Promise.all(resumeSubscriptionPromises);
            updateStatus.status = 1;
          } else {
            const pauseSubscriptionPromises = getSubscriptions.map(subscription =>
              this.ClientServices.pauseSubscriptionInStripe(subscription.stripe_subscription_id)
            );
            await Promise.all(pauseSubscriptionPromises);
            updateStatus.status = 2;
          }

          await this.Models.ClientSubscriptions.update(updateStatus, {
            where: getSubscriptionCondition,
          });
        }
      }

      return res
        .status(201)
        .send(
          successResponse(
            AuthMessages.STATUS_UPDATED,
            null,
            RESPONSE_CODES.POST
          )
        );
    } catch (error) {
      console.log(error, "=====error=====")

      if (
        error.type == STRIPE_ERROR.INVALID_REQUEST ||
        error.type == STRIPE_ERROR.ERROR
      ) {
        return res
          .status(201)
          .send(
            errorResponse(
              AuthMessages.STATUS_UPDATED,
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
  }


  /* enable -disable two-factor-authentication */
  async userTwoFactorAuthentication(req, res) {
    try {
      const { body } = req;
      const user = await this.services.findUserDetailById(body.user_id);
      if (!user) {
        return res
          .status(400)
          .send(
            errorResponse(
              AuthMessages.USER_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      let updateData = {
        two_factor_authentication: body.status,
      };
      await this.services.updateUser(updateData, user.id);
      return res
        .status(201)
        .send(
          successResponse(
            AuthMessages.STATUS_UPDATED,
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


  /* country list */
  async getCountryList(req, res) {
    try {
      const { query } = req;
      let getCountries = await this.services.getAllCountries(query);
      return res
        .status(201)
        .send(
          successResponse(
            AuthMessages.GET_DATA,
            getCountries,
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


  /* state list */
  async getStateList(req, res) {
    try {
      const { params, query } = req;

      let getCountry = await this.Models.Countries.findOne({
        where: {
          name: params.country_name
        },
        raw: true,
      });
      if (!getCountry) {
        return res
          .status(400)
          .send(
            errorResponse(
              AuthMessages.COUNTRY_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      let getCountries = await this.services.getAllStates(getCountry.iso_code, query);
      return res
        .status(201)
        .send(
          successResponse(
            AuthMessages.GET_DATA,
            getCountries,
            RESPONSE_CODES.GET
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


  /* get dashboard Count */
  async getDashboardCount(req, res) {
    try {
      const { body, user } = req;
      let getAllActiveClients = 0;
      let getAllActiveAgents = 0;
      let getAllActiveManager = 0;
      let getClientIds = [0];
      let getAgentIds = [];

      getAllActiveAgents = await this.services.getActiveAgents();
      getAllActiveManager = await this.services.getActiveAccountManager();
      getClientIds = await this.services.getActiveClientIds();
      getAllActiveClients = getClientIds.length;

      if (user.role_id == ROLES.ACCOUNTMANAGER) {

        let setAttributes = ["id", "is_client_access", "client_view", "is_agent_access", "agent_view", "deleted_at"];
        let getPermission = await this.services.getAccountManagerRolePermissions(user.role_permission_id, setAttributes);
        getClientIds = await this.services.getAccountManagerClients(user.id);

        if (getPermission && getPermission.is_client_access == 1 && getPermission.client_view == 1) {
          getAllActiveClients = getClientIds.length;
        }

        if (getPermission && getPermission.is_agent_access == 1 && getPermission.agent_view == 1) {
          getAgentIds = await this.services.getAllAgentsOfClients(getClientIds);
          getAllActiveAgents = getAgentIds.length;
        }

      }

      let clientPast7DayData = [];
      let salesPast7DayData = [];

      let clientData = [];
      let salesData = [];


      let currentDate = moment(new Date());
      let newDate = currentDate.subtract(6, 'days');
      let past7dayDate = moment(new Date(newDate));

      let days = [];
      for (var i = 0; i <= 6; i++) {
        days.push({ day: moment(past7dayDate).add(i, 'days').format("ddd"), date: moment(past7dayDate).add(i, 'days').format("YYYY-MM-DD") });
      }

      for (i = 0; i < days.length; i++) {
        let user_query = await this.sequelize.query("select COUNT(*) as total from users where role_id = 2 AND id IN(" + getClientIds + ") AND  date((`created_at`)) = '" + days[i].date + "' ", {
          model: this.Models.Users,
          mapToModel: true,
          raw: true,
          type: this.sequelize.QueryTypes.SELECT
        });

        let sales_query = await this.sequelize.query("select COUNT(*) as total, SUM(total_price) as total_price from client_subscriptions where status = 1 AND client_id IN(" + getClientIds + ") AND  date((`created_at`)) = '" + days[i].date + "' ", {
          model: this.Models.ClientSubscriptions,
          mapToModel: true,
          raw: true,
          type: this.sequelize.QueryTypes.SELECT
        });

        clientPast7DayData.push({ name: days[i].day, date: days[i].date, total: user_query[0].total });
        salesPast7DayData.push({ name: days[i].day, date: days[i].date, total: sales_query[0].total, total_price: sales_query[0].total_price ? sales_query[0].total_price : 0 })
      }


      if (body.start_date && body.start_date != "" && body.end_date && body.end_date != "") {

        let startDate = moment(new Date(body.start_date)).format("YYYY-MM-DD");
        let endDate = moment(new Date(body.end_date)).format("YYYY-MM-DD");

        let getArray = await this.services.getDateDifferenceArray(startDate, endDate)

        for (i = 0; i < getArray.length; i++) {

          if (body.type == 1) {
            let user_query = await this.sequelize.query("select COUNT(*) as total from users where role_id = 2 AND id IN(" + getClientIds + ") AND  date((`created_at`)) between '" + getArray[i].start_day + "' and '" + getArray[i].end_day + "' ", {
              model: this.Models.Users,
              mapToModel: true,
              raw: true,
              type: this.sequelize.QueryTypes.SELECT
            });

            clientData.push({ name: getArray[i].day, total: user_query[0].total });
          }

          if (body.type == 2) {
            let sales_query = await this.sequelize.query("select COUNT(*) as total, SUM(total_price) as total_price from client_subscriptions where status = 1 AND client_id IN(" + getClientIds + ") AND  date((`created_at`))  between '" + getArray[i].start_day + "' and '" + getArray[i].end_day + "' ", {
              model: this.Models.ClientSubscriptions,
              mapToModel: true,
              raw: true,
              type: this.sequelize.QueryTypes.SELECT
            });
            salesData.push({ name: getArray[i].day, total: sales_query[0].total, total_price: sales_query[0].total_price ? sales_query[0].total_price : 0 });
          }
        }

      }

      let finalRecord = {
        total_active_clients: getAllActiveClients,
        total_active_agents: getAllActiveAgents,
        total_active_manager: getAllActiveManager,
        new_clients: (body.type == 0) ? clientPast7DayData : (body.type == 1) ? clientData : clientPast7DayData,
        new_sales: (body.type == 0) ? salesPast7DayData : (body.type == 2) ? salesData : salesPast7DayData
      }
      return res
        .status(201)
        .send(
          successResponse(
            AuthMessages.GET_DATA,
            finalRecord,
            RESPONSE_CODES.GET
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

  /* resend otp */
  async resendOtp(req, res) {
    try {
      const { body } = req;
      let emailTemplate = "";
      let subject = "";
      const findUserByEmail = await this.services.getByEmail(body.email);
      if (!findUserByEmail) {
        return res
          .status(404)
          .send(
            errorResponse(
              AuthMessages.INVALID_EMAIL,
              null,
              RESPONSE_CODES.NOT_FOUND
            )
          );
      }
      let data = {};
      let otpField = {};
      const otp = Math.floor(1000 + Math.random() * 9000);
      const otpExpiryTime = moment().add(5, 'minutes').unix();
      if (body.type && body.type == 1) {
        otpField = {
          two_factor_otp: otp,
          two_factor_otp_expiry: otpExpiryTime,
        };
        emailTemplate = await twoFactorAuthenticationOtp(otp);
        subject = "Two factor authentication otp";
      } else {
        otpField = {
          otp: otp,
          otp_expiry: otpExpiryTime
        };
        emailTemplate = await forgetPasswordOtp(otp);
        subject = "Forgot password otp";
      }
      let mailFunction = (process.env.PRODUCTION == true || process.env.PRODUCTION == "true") ? nodemailer.sendinBlueMail : nodemailer.sendMail;
      await mailFunction(body.email, subject, emailTemplate);

      await this.services.updateUser(otpField, findUserByEmail.id);
      return res
        .status(200)
        .send(successResponse(AuthMessages.RESEND_OTP, data, RESPONSE_CODES.POST));
    } catch (error) {
      return res
        .status(500)
        .send(
          errorResponse(CommonMessages.ERROR, null, RESPONSE_CODES.SERVER_ERROR)
        );
    }
  }

  async userProfileDetails(req, res) {
    try {
      const { user } = req;
      const getuserdata = await this.services.getUserProfileDetails(user.id)
      return res
        .status(200)
        .send(successResponse(AuthMessages.PROFILE_DETAILS, getuserdata, RESPONSE_CODES.POST));
    } catch (error) {
      console.log(error, "==error=-")
      return res
        .status(500)
        .send(
          errorResponse(CommonMessages.ERROR, null, RESPONSE_CODES.SERVER_ERROR)
        );
    }
  }

  async userProfileUpdate(req, res) {
    try {
      const { user, body, files } = req
      const data = {
        first_name: body.first_name,
        last_name: body.last_name,
        phone_number: body.phone_number,
        address: body.address,
        address2: body.address2,
        state: body.state,
        city: body.city,
        zipcode: body.zipcode,
        country: body.country
      }
      if (files && files.length > 0) {

        let sendData = {
          files,
          id: user.id,
          folder: 'Users'
        }
        const uploadedImage = await uploadFileForAll(sendData);

        if (uploadedImage.length > 0) {
          data.user_image = uploadedImage[0].file_key
        }
      }

      await this.services.updateProfile(data, user.id)
       await updateCometChatUser(user.id, {
        name: data.first_name + " " + data.last_name,
        avatar: data.user_image ? process.env.BASE_IMAGE_URL + data.user_image : process.env.BASE_IMAGE_URL + user.user_image,
        metadata: {
          "@private": {
            email: user.email,
            contactNumber: data.phone_number ? data.phone_number : user.phone_number,
          },
        },
      }).then((res) => res.json())
        .catch((err) => console.error("error in updating User:" + err));
      return res
        .status(200)
        .send(successResponse(AuthMessages.PROFILE_UPDATED, {}, RESPONSE_CODES.POST));
    } catch (error) {
      console.log(error, "=====error=====");
      return res
        .status(500)
        .send(
          errorResponse(CommonMessages.ERROR, null, RESPONSE_CODES.SERVER_ERROR)
        );
    }
  };



  /* admin Login As Client */
  async adminLoginAsClient(req, res) {
    try {

      const { user, params } = req;

      let whereCondition = {
        deleted_at: null,
        id: params.user_id
      }

      let isAdmin = false;
      let adminId = user.id;
      if (user.role_id == ROLES.ADMIN || user.role_id == ROLES.ACCOUNTMANAGER) {
        whereCondition.role_id = ROLES.CLIENT;
        isAdmin = true;
      }


      if (user.role_id == ROLES.CLIENT) {
        whereCondition.role_id = ROLES.ADMIN;
      }

      let getUserDetail = await this.services.getUserDetailByUserId(whereCondition);
      if (!getUserDetail) {
        return res
          .status(400)
          .send(
            errorResponse(
              AuthMessages.USER_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      if (getUserDetail.role_id == ROLES.CLIENT && getUserDetail.status == USER_STATUS.INACTIVE) {
        const getadmin = await this.Models.Users.findOne({
          where: {
            role_id: ROLES.ADMIN,
            deleted_at: null
          }
        });
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

      let uuid = 0;
      if (getUserDetail.uuid == "" || getUserDetail.uuid == null) {
        uuid = uuidv4();
        let updateUuid = {
          uuid: uuid,
        };
        await this.services.updateUser(updateUuid, getUserDetail.id);
      }

      const loginTime = moment(new Date()).unix();
      let createData = {
        user_id: getUserDetail.id,
        login_time: loginTime,
      };
      await this.services.createLoginTime(createData);
      let getUser = await this.services.getUserById(getUserDetail.id);

      let finalUserDetail = getUser.toJSON();
      if (finalUserDetail && finalUserDetail.projects.length > 0) {
        delete finalUserDetail.projects;
        finalUserDetail.projects = true;
      } else {
        finalUserDetail.projects = false;
      }

      let { docusign_link, subscription_link, subscription_and_docusign, ...clientResponse } = finalUserDetail;

      const payload = {
        id: getUserDetail.id,
        role_id: getUserDetail.role_id,
        first_name: getUserDetail.first_name,
        last_name: getUserDetail.last_name,
        email: getUserDetail.email,
        login_time: loginTime,
        is_admin: isAdmin,
        admin_id: adminId,
        user: clientResponse,
        uuid: (getUserDetail.uuid == "" || getUserDetail.uuid == null) ? uuid : getUserDetail.uuid
      };

      /** generate token */
      const token = refreshToken(payload);
      const data = {
        access_token: token,
        is_admin: isAdmin,
        admin_id: adminId,
        uuid: (getUserDetail.uuid == "" || getUserDetail.uuid == null) ? uuid : getUserDetail.uuid,
        user: getUser,
      };
      return res
        .status(201)
        .send(
          successResponse(AuthMessages.ACCESS_GRANTED, data, RESPONSE_CODES.POST)
        );
    } catch (error) {
      console.log(error, "===error===")
      return res.status(500).send(errorResponse(CommonMessages.ERROR, null, RESPONSE_CODES.SERVER_ERROR));
    }
  };



  /* get churn report */
  async getChurnReport(req, res) {
    try {
      const { body, user } = req;
      let finalChurnReport = [];
      let months = [];

      let totalVoluntaryChurnArray = [];
      let totalDelinquentChurnArray = [];
      let totalRevenueChurnArray = [];
      let totalChurnArray = [];

      let totalVoluntaryChurn;
      let totalDelinquentChurn;
      let totalRevenueChurn;
      let totalChurnRate;

      if (body.type == 0) {

        for (let i = 0; i < 12; i++) {
          let monthStart = moment().subtract(1, 'year').startOf('year').add(i, 'months');  // Start of each month in the previous year
          let monthEnd = moment().subtract(1, 'year').startOf('year').add(i, 'months').endOf('month'); // End of each month in the previous year

          months.push({
            day: monthStart.format("MMM"),   // Full month name, e.g., January
            date: monthStart.format("YYYY-MM-DD"),
            start_day: monthStart.format("YYYY-MM-DD"),  // First day of the month
            end_day: monthEnd.format("YYYY-MM-DD")   // Last day of the month
          });
        }

      } else if (body.type == 1) {

        let lastWeekStart = moment().subtract(1, 'weeks').startOf('isoWeek');  // Start of last week (Monday)
        let lastWeekEnd = moment().subtract(1, 'weeks').endOf('isoWeek');      // End of last week (Sunday)
        for (let i = 0; i < 7; i++) {
          let day = moment(lastWeekStart).add(i, 'days');
          months.push({
            day: day.format("ddd"),   // Full month name, e.g., January
            date: day.format("YYYY-MM-DD"),
            start_day: day.format("YYYY-MM-DD"), // First day of the month
            end_day: day.format("YYYY-MM-DD")   // Last day of the month
          });
        }

      } else if (body.type == 2) {

        for (let i = 0; i < 12; i++) {
          let monthStart = moment().startOf('year').add(i, 'months');  // Start of each month in the current year
          let monthEnd = moment().startOf('year').add(i, 'months').endOf('month'); // End of each month in the current year

          months.push({
            day: monthStart.format("MMM"),  // Full month name, e.g., January
            date: monthStart.format("YYYY-MM-DD"),
            start_day: monthStart.format("YYYY-MM-DD"),  // First day of the month
            end_day: monthEnd.format("YYYY-MM-DD")   // Last day of the month
          });
        }

      } else if (body.type == 3) {

        let startDate = moment(new Date(body.start_date)).format("YYYY-MM-DD");
        let endDate = moment(new Date(body.end_date)).format("YYYY-MM-DD");
        months = await this.services.getDateDifferenceArrayForReports(startDate, endDate)

      }

      for (let j = 0; j < months.length; j++) {

        /** Get voluntary subscription (cancelled)*/
        // let voluntary_churn = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 4 AND deleted_at IS NULL AND DATE(`created_at`) BETWEEN '" + months[j].start_day + "' AND '" + months[j].end_day + "'",
        // {
        //   model: this.Models.ClientSubscriptions,
        //   mapToModel: true,
        //   raw: true,
        //   type: this.sequelize.QueryTypes.SELECT
        // });

        /** Get voluntary subscription (cancelled)*/
        let voluntary_churn = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 4 AND deleted_at IS NULL AND DATE(FROM_UNIXTIME(`cancel_at`)) BETWEEN '" + months[j].start_day + "' AND '" + months[j].end_day + "'", {
          model: this.Models.ClientSubscriptions,
          mapToModel: true,
          raw: true,
          type: this.sequelize.QueryTypes.SELECT
        });


        /** Get delinquent subscription (not activate)*/
        let delinquent_churn = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 0 AND deleted_at IS NULL AND DATE(`created_at`) BETWEEN '" + months[j].start_day + "' AND '" + months[j].end_day + "'", {
          model: this.Models.ClientSubscriptions,
          mapToModel: true,
          raw: true,
          type: this.sequelize.QueryTypes.SELECT
        });

        /** Get sum of voluntary+delinquent  subscription*/

        // let total_revenue_churn = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status IN (0,4) AND deleted_at IS NULL AND DATE(`created_at`) BETWEEN '" + months[j].start_day + "' AND '" + months[j].end_day + "'", {
        //   model: this.Models.ClientSubscriptions,
        //   mapToModel: true,
        //   raw: true,
        //   type: this.sequelize.QueryTypes.SELECT
        // });

        let total_revenue_churn = await this.sequelize.query(`
          SELECT 
            COUNT(DISTINCT client_id) as total_clients,
            SUM(CASE 
                  WHEN status = 4 AND DATE(FROM_UNIXTIME(cancel_at)) BETWEEN :start_day AND :end_day THEN total_price 
                  ELSE 0 
                END) as voluntary_total_price,
            SUM(CASE 
                  WHEN status = 0 AND DATE(created_at) BETWEEN :start_day AND :end_day THEN total_price 
                  ELSE 0 
                END) as delinquent_total_price,
            (SUM(CASE 
                  WHEN status = 4 AND DATE(FROM_UNIXTIME(cancel_at)) BETWEEN :start_day AND :end_day THEN total_price 
                  ELSE 0 
                END) + 
             SUM(CASE 
                  WHEN status = 0 AND DATE(created_at) BETWEEN :start_day AND :end_day THEN total_price 
                  ELSE 0 
                END)
            ) as total_price
          FROM client_subscriptions 
          WHERE status IN (0, 4) 
            AND deleted_at IS NULL
        `, {
          replacements: {
            start_day: months[j].start_day,
            end_day: months[j].end_day
          },
          model: this.Models.ClientSubscriptions,
          mapToModel: true,
          raw: true,
          type: this.sequelize.QueryTypes.SELECT
        });


        /** Get total Clients  who's subscription is renew continue*/
        let totalClients = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients FROM client_subscriptions WHERE status = 1 AND deleted_at IS NULL AND is_renew_count >= 1 AND DATE(`created_at`) BETWEEN '" + months[j].start_day + "' AND '" + months[j].end_day + "'", {
          model: this.Models.ClientSubscriptions,
          mapToModel: true,
          raw: true,
          type: this.sequelize.QueryTypes.SELECT
        });

        let cancelledUser = +Number(total_revenue_churn[0].total_clients);


        let totalClientCount = totalClients ? +totalClients[0].total_clients : 0;

        /** churnRate = cancelledUser/totalClientCount *100 */
        let churnRate = (cancelledUser / totalClientCount) * 100;
        churnRate = (churnRate == Infinity || churnRate == -Infinity) ? 0 : (churnRate != null) ? +churnRate : 0;

        let finalChurnRate = churnRate ? churnRate : 0;
        finalChurnRate = finalChurnRate.toFixed(2);

        totalVoluntaryChurnArray.push(voluntary_churn ? +voluntary_churn[0].total_price : 0);
        totalDelinquentChurnArray.push(delinquent_churn ? +delinquent_churn[0].total_price : 0);
        totalRevenueChurnArray.push(total_revenue_churn ? +total_revenue_churn[0].total_price : 0);
        totalChurnArray.push(+finalChurnRate);

        finalChurnReport.push({
          name: months[j].day,
          date: months[j].date,
          voluntaryChurn: voluntary_churn ? +voluntary_churn[0].total_price : 0,
          delinquentChurn: delinquent_churn ? +delinquent_churn[0].total_price : 0,
          totalChurn: total_revenue_churn ? +total_revenue_churn[0].total_price : 0,
          churnRate: +finalChurnRate,
        });
      }

      totalVoluntaryChurn = totalVoluntaryChurnArray.reduce((partialSum, a) => partialSum + a, 0);
      totalVoluntaryChurn = totalVoluntaryChurn.toFixed(2);
      totalDelinquentChurn = totalDelinquentChurnArray.reduce((partialSum, a) => partialSum + a, 0);
      totalDelinquentChurn = totalDelinquentChurn.toFixed(2);
      totalRevenueChurn = totalRevenueChurnArray.reduce((partialSum, a) => partialSum + a, 0);
      totalRevenueChurn = totalRevenueChurn.toFixed(2);
      totalChurnRate = totalChurnArray.reduce((partialSum, a) => partialSum + a, 0);
      totalChurnRate = totalChurnRate.toFixed(2);

      let overAllReport = {
        "total_voluntary_churn": +totalVoluntaryChurn,
        "total_delinquent_churn": +totalDelinquentChurn,
        "total_revenue_churn": +totalRevenueChurn,
        "total_churn_rate": +totalChurnRate,
      }

      let financialReport = {
        over_all_report: overAllReport,
        churnData: finalChurnReport
      }
      return res
        .status(201)
        .send(
          successResponse(
            AuthMessages.GET_DATA,
            financialReport,
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



  /* get Retention report */
  async getRetentionReport(req, res) {
    try {
      const { body, user } = req;
      let finalRetentionReport = [];
      let months = [];

      let totalRetentionArray = [];
      let totalLeftArray = [];
      let totalNetArray = [];
      let totalRetentionRateArray = [];
      let totalDeliquentArray = [];


      let totalRetention;
      let totalLeft;
      let totalNet;
      let totalDeliquent;
      let totalRetentionRate;

      if (body.type == 0) {

        for (let i = 0; i < 12; i++) {
          let monthStart = moment().subtract(1, 'year').startOf('year').add(i, 'months');  // Start of each month in the previous year
          let monthEnd = moment().subtract(1, 'year').startOf('year').add(i, 'months').endOf('month'); // End of each month in the previous year

          months.push({
            day: monthStart.format("MMM"),   // Full month name, e.g., January
            date: monthStart.format("YYYY-MM-DD"),
            start_day: monthStart.format("YYYY-MM-DD"),  // First day of the month
            end_day: monthEnd.format("YYYY-MM-DD")   // Last day of the month
          });
        }

      } else if (body.type == 1) {

        let lastWeekStart = moment().subtract(1, 'weeks').startOf('isoWeek');  // Start of last week (Monday)
        let lastWeekEnd = moment().subtract(1, 'weeks').endOf('isoWeek');      // End of last week (Sunday)
        for (let i = 0; i < 7; i++) {
          let day = moment(lastWeekStart).add(i, 'days');
          months.push({
            day: day.format("ddd"),   // Full month name, e.g., January
            date: day.format("YYYY-MM-DD"),
            start_day: day.format("YYYY-MM-DD"), // First day of the month
            end_day: day.format("YYYY-MM-DD")   // Last day of the month
          });
        }

      } else if (body.type == 2) {

        for (let i = 0; i < 12; i++) {
          let monthStart = moment().startOf('year').add(i, 'months');  // Start of each month in the current year
          let monthEnd = moment().startOf('year').add(i, 'months').endOf('month'); // End of each month in the current year

          months.push({
            day: monthStart.format("MMM"),  // Full month name, e.g., January
            date: monthStart.format("YYYY-MM-DD"),
            start_day: monthStart.format("YYYY-MM-DD"),  // First day of the month
            end_day: monthEnd.format("YYYY-MM-DD")   // Last day of the month
          });
        }

      } else if (body.type == 3) {

        let startDate = moment(new Date(body.start_date)).format("YYYY-MM-DD");
        let endDate = moment(new Date(body.end_date)).format("YYYY-MM-DD");
        months = await this.services.getDateDifferenceArrayForReports(startDate, endDate)

      }

      for (let j = 0; j < months.length; j++) {

        /** Get reactivate subscription (continue renew)*/
        let reactivate_subscription = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 1 AND deleted_at IS NULL AND is_renew_count > 1 AND resume_date_time IS NULL AND DATE(FROM_UNIXTIME(`start_date`)) BETWEEN '" + months[j].start_day + "' AND '" + months[j].end_day + "'",
          {
            model: this.Models.ClientSubscriptions,
            mapToModel: true,
            raw: true,
            type: this.sequelize.QueryTypes.SELECT
          });

        /** Get left subscription (cancelled)*/
        let left_subscription = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 4 AND deleted_at IS NULL AND DATE(FROM_UNIXTIME(`cancel_at`)) BETWEEN '" + months[j].start_day + "' AND '" + months[j].end_day + "'", {
          model: this.Models.ClientSubscriptions,
          mapToModel: true,
          raw: true,
          type: this.sequelize.QueryTypes.SELECT
        });

        /** Get delinquent subscription (not active)*/
        let delinquent_churn = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 0 AND deleted_at IS NULL AND DATE(`created_at`) BETWEEN '" + months[j].start_day + "' AND '" + months[j].end_day + "'", {
          model: this.Models.ClientSubscriptions,
          mapToModel: true,
          raw: true,
          type: this.sequelize.QueryTypes.SELECT
        });


        /** Get net total subscription (total subscription (new + renew))*/
        let net_total_subscription = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 1 AND deleted_at IS NULL AND is_renew_count >= 1 AND DATE(FROM_UNIXTIME(`start_date`)) BETWEEN '" + months[j].start_day + "' AND '" + months[j].end_day + "'", {
          model: this.Models.ClientSubscriptions,
          mapToModel: true,
          raw: true,
          type: this.sequelize.QueryTypes.SELECT
        });


        /** Get new subscription (only new)*/
        let new_subscription = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 1 AND deleted_at IS NULL AND is_renew_count = 1 AND DATE(FROM_UNIXTIME(`start_date`)) BETWEEN '" + months[j].start_day + "' AND '" + months[j].end_day + "'", {
          model: this.Models.ClientSubscriptions,
          mapToModel: true,
          raw: true,
          type: this.sequelize.QueryTypes.SELECT
        });


        /** finalRetention = reactivate_subscription-left_subscription*/
        let finalRetention = Number(reactivate_subscription ? reactivate_subscription[0].total_price : 0) - Number(left_subscription ? left_subscription[0].total_price : 0);

        let finalNetTotal = net_total_subscription ? net_total_subscription[0].total_price : 0;


        /** totalNetAmount = finalNetTotal+new_subscription-left_subscription+delinquent_churn*/
        let totalNetAmount = Number(finalNetTotal) + Number(new_subscription ? new_subscription[0].total_price : 0) - (Number(left_subscription ? left_subscription[0].total_price : 0) + Number(delinquent_churn ? delinquent_churn[0].total_price : 0));


        /** retentaionRate = finalRetention/totalNetAmount * 100 */
        let retentaionRate = (finalRetention / totalNetAmount) * 100;
        let finalRetentaionRate = retentaionRate ? retentaionRate : 0;
        finalRetentaionRate = finalRetentaionRate.toFixed(2);

        totalRetentionArray.push(reactivate_subscription ? reactivate_subscription[0].total_price : 0);

        totalLeftArray.push(left_subscription ? left_subscription[0].total_price : 0);

        totalDeliquentArray.push(delinquent_churn ? delinquent_churn[0].total_price : 0)

        totalRetentionRateArray.push(+finalRetentaionRate);
        totalNetArray.push(totalNetAmount);

        let finalTotalNetAmount = totalNetAmount.toFixed(2);

        let monthlyReactivation = Number(reactivate_subscription ? +reactivate_subscription[0].total_price : 0);
        monthlyReactivation = monthlyReactivation.toFixed(2);

        let monthlyRetention = Number(reactivate_subscription ? +reactivate_subscription[0].total_price : 0) - Number(left_subscription ? +left_subscription[0].total_price : 0);
        monthlyRetention = monthlyRetention.toFixed(2);

        let monthlyChurn = Number(left_subscription ? +left_subscription[0].total_price : 0) + Number(delinquent_churn ? delinquent_churn[0].total_price : 0);
        monthlyChurn = monthlyChurn.toFixed(2);

        finalRetentionReport.push({
          name: months[j].day,
          date: months[j].date,
          reactivation: Number(monthlyReactivation),
          retention: Number(monthlyRetention),
          churn: Number(monthlyChurn),
          total_net: +finalTotalNetAmount,
          retention_rate: (finalRetentaionRate == -Infinity) ? 0 : (finalRetentaionRate != null) ? +finalRetentaionRate : 0,
        });
      }

      totalRetention = totalRetentionArray.reduce((partialSum, a) => partialSum + a, 0);
      totalRetention = totalRetention.toFixed(2);

      totalLeft = totalLeftArray.reduce((partialSum, a) => partialSum + a, 0);
      totalLeft = totalLeft.toFixed(2);

      totalNet = totalNetArray.reduce((partialSum, a) => partialSum + a, 0);

      totalNet = totalNet.toFixed(2);
      totalRetentionRate = totalRetentionRateArray.reduce((partialSum, a) => partialSum + a, 0);
      totalRetentionRate = totalRetentionRate.toFixed(2);

      totalDeliquent = totalDeliquentArray.reduce((partialSum, a) => partialSum + a, 0);
      totalDeliquent = totalDeliquent.toFixed(2);

      let churn = Number(totalLeft) + Number(totalDeliquent);
      let churnFinal = churn.toFixed(2);
      let retention = Number(totalRetention) - Number(totalLeft);
      let retentionFinal = retention.toFixed(2);

      let overAllReport = {
        "reactivation": +totalRetention,
        "retention": +retentionFinal,
        "churn": +churnFinal,
        "total_net": +totalNet,
        "retention_rate": (totalRetentionRate == -Infinity) ? 0 : (totalRetentionRate != null) ? +totalRetentionRate : 0,
      }


      let financialReport = {
        over_all_report: overAllReport,
        retentionData: finalRetentionReport
      }
      return res
        .status(201)
        .send(
          successResponse(
            AuthMessages.GET_DATA,
            financialReport,
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
  };



  /* get customer overview report */
  async getCustomerOverviewReport(req, res) {
    try {
      const { body, user } = req;
      let finalCustomerOverviewReport = [];
      let months = [];

      let totalNewCustomerArray = [];
      let totalReactivateCustomerArray = [];
      let totalExistingCustomerArray = [];
      let totalvoluntaryCustomerArray = [];
      let totalDeliquentCustomerArray = [];
      let totalActiveCustomerArray = [];
      let totalAllCustomerArray = [];


      let totalNewCustomer;
      let totalReactivateCustomer;
      let totalExistingCustomer;
      let totalvoluntaryCustomer;
      let totalDeliquentCustomer;
      let totalAllCustomer;
      let totalActiveCustomer;


      if (body.type == 0) {

        for (let i = 0; i < 12; i++) {
          let monthStart = moment().subtract(1, 'year').startOf('year').add(i, 'months');  // Start of each month in the previous year
          let monthEnd = moment().subtract(1, 'year').startOf('year').add(i, 'months').endOf('month'); // End of each month in the previous year

          months.push({
            day: monthStart.format("MMM"),   // Full month name, e.g., January
            date: monthStart.format("YYYY-MM-DD"),
            start_day: monthStart.format("YYYY-MM-DD"),  // First day of the month
            end_day: monthEnd.format("YYYY-MM-DD")   // Last day of the month
          });
        }

      } else if (body.type == 1) {

        let lastWeekStart = moment().subtract(1, 'weeks').startOf('isoWeek');  // Start of last week (Monday)
        let lastWeekEnd = moment().subtract(1, 'weeks').endOf('isoWeek');      // End of last week (Sunday)
        for (let i = 0; i < 7; i++) {
          let day = moment(lastWeekStart).add(i, 'days');
          months.push({
            day: day.format("ddd"),   // Full month name, e.g., January
            date: day.format("YYYY-MM-DD"),
            start_day: day.format("YYYY-MM-DD"), // First day of the month
            end_day: day.format("YYYY-MM-DD")   // Last day of the month
          });
        }

      } else if (body.type == 2) {

        for (let i = 0; i < 12; i++) {
          let monthStart = moment().startOf('year').add(i, 'months');  // Start of each month in the current year
          let monthEnd = moment().startOf('year').add(i, 'months').endOf('month'); // End of each month in the current year

          months.push({
            day: monthStart.format("MMM"),  // Full month name, e.g., January
            date: monthStart.format("YYYY-MM-DD"),
            start_day: monthStart.format("YYYY-MM-DD"),  // First day of the month
            end_day: monthEnd.format("YYYY-MM-DD")   // Last day of the month
          });
        }

      } else if (body.type == 3) {

        let startDate = moment(new Date(body.start_date)).format("YYYY-MM-DD");
        let endDate = moment(new Date(body.end_date)).format("YYYY-MM-DD");
        months = await this.services.getDateDifferenceArrayForReports(startDate, endDate)

      }

      for (let j = 0; j < months.length; j++) {

        /** Get new cutomers have first subcription */
        let new_cutomers = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 1 AND is_renew_count = 1 AND DATE(FROM_UNIXTIME(`start_date`)) BETWEEN '" + months[j].start_day + "' AND '" + months[j].end_day + "'",
          {
            model: this.Models.ClientSubscriptions,
            mapToModel: true,
            raw: true,
            type: this.sequelize.QueryTypes.SELECT
          });

        /** Get cutomers have resume their subcription */
        let reactivation_customers = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 1 AND is_renew_count > 1 AND DATE(FROM_UNIXTIME(`resume_date_time`)) BETWEEN '" + months[j].start_day + "' AND '" + months[j].end_day + "'",
          {
            model: this.Models.ClientSubscriptions,
            mapToModel: true,
            raw: true,
            type: this.sequelize.QueryTypes.SELECT
          });


        /** Get cutomers whos subcription continue renew */
        let existing_customers = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 1 AND is_renew_count > 1 AND resume_date_time IS NULL AND DATE(FROM_UNIXTIME(`start_date`)) BETWEEN '" + months[j].start_day + "' AND '" + months[j].end_day + "'",
          {
            model: this.Models.ClientSubscriptions,
            mapToModel: true,
            raw: true,
            type: this.sequelize.QueryTypes.SELECT
          });

        /** Get cutomers have cancelled their subcription */
        let voluntary_churn = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 4 AND DATE(FROM_UNIXTIME(`cancel_at`)) BETWEEN '" + months[j].start_day + "' AND '" + months[j].end_day + "'", {
          model: this.Models.ClientSubscriptions,
          mapToModel: true,
          raw: true,
          type: this.sequelize.QueryTypes.SELECT
        });

        /** Get cutomers have not active their subcription */
        let deliquent_churn = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 0 AND DATE(FROM_UNIXTIME(`start_date`)) BETWEEN '" + months[j].start_day + "' AND '" + months[j].end_day + "'", {
          model: this.Models.ClientSubscriptions,
          mapToModel: true,
          raw: true,
          type: this.sequelize.QueryTypes.SELECT
        });


        /** Get active cutomers who's subscription is active*/
        let active_customers = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 1 AND DATE(FROM_UNIXTIME(`start_date`)) BETWEEN '" + months[j].start_day + "' AND '" + months[j].end_day + "'", {
          model: this.Models.ClientSubscriptions,
          mapToModel: true,
          raw: true,
          type: this.sequelize.QueryTypes.SELECT
        });

        // /** Get all cutomers in db */
        // let all_customers = await this.sequelize.query("select COUNT(*) as total_clients from users where role_id = 2 AND deleted_at IS NULL AND DATE((`created_at`)) BETWEEN '" + months[j].start_day + "' AND '" + months[j].end_day + "'", {
        //   model: this.Models.Users,
        //   mapToModel: true,
        //   raw: true,
        //   type: this.sequelize.QueryTypes.SELECT
        // });


        totalNewCustomerArray.push(new_cutomers ? new_cutomers[0].total_clients : 0);
        totalReactivateCustomerArray.push(reactivation_customers ? reactivation_customers[0].total_clients : 0);
        totalExistingCustomerArray.push(existing_customers ? existing_customers[0].total_clients : 0);
        totalvoluntaryCustomerArray.push(voluntary_churn ? voluntary_churn[0].total_clients : 0);
        totalDeliquentCustomerArray.push(deliquent_churn ? deliquent_churn[0].total_clients : 0);
        // totalAllCustomerArray.push(all_customers ? all_customers[0].total_clients : 0);
        totalActiveCustomerArray.push(active_customers ? active_customers[0].total_clients : 0);


        /** activeMonthlyCustomers*/
        let activeMonthlyCustomers = Number(active_customers ? active_customers[0].total_clients : 0);

        let allCustomerCount = Number(new_cutomers ? new_cutomers[0].total_clients : 0) + Number(reactivation_customers ? reactivation_customers[0].total_clients : 0) + Number(existing_customers ? existing_customers[0].total_clients : 0) - Number(voluntary_churn ? voluntary_churn[0].total_clients : 0) - Number(deliquent_churn ? deliquent_churn[0].total_clients : 0);
        allCustomerCount = allCustomerCount.toFixed(2);

        /** activeMonthlyCutomersPercentage =  activeMonthlyCustomers/all_customers * 100  */
        let activeMonthlyCutomersPercentage = (activeMonthlyCustomers == 0 && +allCustomerCount == 0) ? 0 : (Number(activeMonthlyCustomers) / Number(allCustomerCount)) * 100;

        activeMonthlyCutomersPercentage = (activeMonthlyCutomersPercentage == NaN) ? 0 : activeMonthlyCutomersPercentage;

        let finalMonthlyActiveCutomersPercentage = activeMonthlyCutomersPercentage.toFixed(2);
        finalCustomerOverviewReport.push({
          name: months[j].day,
          date: months[j].date,
          new: Number(new_cutomers ? new_cutomers[0].total_clients : 0),
          reactivation: Number(reactivation_customers ? reactivation_customers[0].total_clients : 0),
          existing: Number(existing_customers ? existing_customers[0].total_clients : 0),
          voluntary_churn: Number(voluntary_churn ? voluntary_churn[0].total_clients : 0),
          deliquent_churn: Number(deliquent_churn ? deliquent_churn[0].total_clients : 0),
          total_customers: Number(allCustomerCount),
          active_cutomers: Number(activeMonthlyCustomers),
          active_cutomers_percentage: (finalMonthlyActiveCutomersPercentage == -Infinity) ? 0 : (finalMonthlyActiveCutomersPercentage != null) ? Number(finalMonthlyActiveCutomersPercentage) : 0,
        });

      }

      totalNewCustomer = totalNewCustomerArray.reduce((partialSum, a) => partialSum + a, 0);
      totalNewCustomer = totalNewCustomer.toFixed(2);
      totalReactivateCustomer = totalReactivateCustomerArray.reduce((partialSum, a) => partialSum + a, 0);
      totalReactivateCustomer = totalReactivateCustomer.toFixed(2);
      totalExistingCustomer = totalExistingCustomerArray.reduce((partialSum, a) => partialSum + a, 0);
      totalExistingCustomer = totalExistingCustomer.toFixed(2);
      totalvoluntaryCustomer = totalvoluntaryCustomerArray.reduce((partialSum, a) => partialSum + a, 0);
      totalvoluntaryCustomer = totalvoluntaryCustomer.toFixed(2);
      totalDeliquentCustomer = totalDeliquentCustomerArray.reduce((partialSum, a) => partialSum + a, 0);
      totalDeliquentCustomer = totalDeliquentCustomer.toFixed(2);
      // totalAllCustomer = totalAllCustomerArray.reduce((partialSum, a) => partialSum + a, 0);
      // totalAllCustomer = totalAllCustomer.toFixed(2);

      totalActiveCustomer = totalActiveCustomerArray.reduce((partialSum, a) => partialSum + a, 0);
      totalActiveCustomer = totalActiveCustomer.toFixed(2);


      let totalCustomerCount = Number(totalNewCustomer) + Number(totalReactivateCustomer) + Number(totalExistingCustomer) - Number(totalvoluntaryCustomer) - Number(totalDeliquentCustomer);
      totalCustomerCount = totalCustomerCount.toFixed(2);


      let activeCutomersPercentage = (Number(totalActiveCustomer) == 0 && Number(totalCustomerCount) == 0) ? 0 : (Number(totalActiveCustomer) / Number(totalCustomerCount)) * 100;

      let finalActiveCutomersPercentage = activeCutomersPercentage.toFixed(2);

      let overAllReport = {
        "active_cutomers": Number(totalActiveCustomer),
        "new": Number(totalNewCustomer),
        "reactivation": Number(totalReactivateCustomer),
        "existing": Number(totalExistingCustomer),
        "voluntary_churn": Number(totalvoluntaryCustomer),
        "deliquent_churn": Number(totalDeliquentCustomer),
        "total_customers": Number(totalCustomerCount),
        "active_cutomers_percentage": (finalActiveCutomersPercentage == -Infinity) ? 0 : (finalActiveCutomersPercentage != null) ? +finalActiveCutomersPercentage : 0,
      }

      let customerOverviewReport = {
        over_all_report: overAllReport,
        customer_overview: finalCustomerOverviewReport
      }
      return res
        .status(201)
        .send(
          successResponse(
            AuthMessages.GET_DATA,
            customerOverviewReport,
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
  };



  /* get growth rate report */
  async getGrowthRateReport(req, res) {
    try {
      const { body, user } = req;
      let finalGrowthRateReport = [];
      let months = [];

      let totalNewSubscriptionArray = [];
      let totalReactivateSubscriptionArray = [];
      let totalChurnArray = [];
      let totalExistingSubscriptionsArray = [];
      let totalNetNewMMRArray = [];
      let totalGrowthRateArray = [];


      let totalNewSubscription;
      let totalReactivateSubscription;
      let totalChurn;
      let totalExistingSubscriptions
      let totalNetNewMMR;
      let totalGrowthRate;


      if (body.type == 0) {

        for (let i = 0; i < 12; i++) {
          let monthStart = moment().subtract(1, 'year').startOf('year').add(i, 'months');  // Start of each month in the previous year
          let monthEnd = moment().subtract(1, 'year').startOf('year').add(i, 'months').endOf('month'); // End of each month in the previous year

          months.push({
            day: monthStart.format("MMM"),   // Full month name, e.g., January
            date: monthStart.format("YYYY-MM-DD"),
            start_day: monthStart.format("YYYY-MM-DD"),  // First day of the month
            end_day: monthEnd.format("YYYY-MM-DD")   // Last day of the month
          });
        }

      } else if (body.type == 1) {

        let lastWeekStart = moment().subtract(1, 'weeks').startOf('isoWeek');  // Start of last week (Monday)
        let lastWeekEnd = moment().subtract(1, 'weeks').endOf('isoWeek');      // End of last week (Sunday)
        for (let i = 0; i < 7; i++) {
          let day = moment(lastWeekStart).add(i, 'days');
          months.push({
            day: day.format("ddd"),   // Full month name, e.g., January
            date: day.format("YYYY-MM-DD"),
            start_day: day.format("YYYY-MM-DD"), // First day of the month
            end_day: day.format("YYYY-MM-DD")   // Last day of the month
          });
        }

      } else if (body.type == 2) {

        for (let i = 0; i < 12; i++) {
          let monthStart = moment().startOf('year').add(i, 'months');  // Start of each month in the current year
          let monthEnd = moment().startOf('year').add(i, 'months').endOf('month'); // End of each month in the current year

          months.push({
            day: monthStart.format("MMM"),  // Full month name, e.g., January
            date: monthStart.format("YYYY-MM-DD"),
            start_day: monthStart.format("YYYY-MM-DD"),  // First day of the month
            end_day: monthEnd.format("YYYY-MM-DD")   // Last day of the month
          });
        }

      } else if (body.type == 3) {

        let startDate = moment(new Date(body.start_date)).format("YYYY-MM-DD");
        let endDate = moment(new Date(body.end_date)).format("YYYY-MM-DD");
        months = await this.services.getDateDifferenceArrayForReports(startDate, endDate)

      }

      for (let j = 0; j < months.length; j++) {


        /** Get new subscription created*/
        let new_subscriptions = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 1 AND deleted_at IS NULL AND is_renew_count = 1 AND DATE(FROM_UNIXTIME(`start_date`)) BETWEEN '" + months[j].start_day + "' AND '" + months[j].end_day + "'",
          {
            model: this.Models.ClientSubscriptions,
            mapToModel: true,
            raw: true,
            type: this.sequelize.QueryTypes.SELECT
          });

        /** Get reactivation subscriptions (resume subscriptions)*/
        let reactivation_subscriptions = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 1 AND deleted_at IS NULL AND is_renew_count > 1 AND DATE(FROM_UNIXTIME(`resume_date_time`)) BETWEEN '" + months[j].start_day + "' AND '" + months[j].end_day + "'",
          {
            model: this.Models.ClientSubscriptions,
            mapToModel: true,
            raw: true,
            type: this.sequelize.QueryTypes.SELECT
          });

        /** Get existing subscriptions (continue renew)*/
        let existing_subscriptions = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 1 AND deleted_at IS NULL AND is_renew_count > 1 AND resume_date_time IS NULL AND DATE(FROM_UNIXTIME(`start_date`)) BETWEEN '" + months[j].start_day + "' AND '" + months[j].end_day + "'",
          {
            model: this.Models.ClientSubscriptions,
            mapToModel: true,
            raw: true,
            type: this.sequelize.QueryTypes.SELECT
          });

        /** Get cancelled subscriptions */
        let voluntary_churn = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 4 AND deleted_at IS NULL AND DATE(FROM_UNIXTIME(`cancel_at`)) BETWEEN '" + months[j].start_day + "' AND '" + months[j].end_day + "'", {
          model: this.Models.ClientSubscriptions,
          mapToModel: true,
          raw: true,
          type: this.sequelize.QueryTypes.SELECT
        });

        /** Get subscriptions are not active*/
        let deliquent_churn = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 0 AND deleted_at IS NULL AND DATE(FROM_UNIXTIME(`start_date`)) BETWEEN '" + months[j].start_day + "' AND '" + months[j].end_day + "'", {
          model: this.Models.ClientSubscriptions,
          mapToModel: true,
          raw: true,
          type: this.sequelize.QueryTypes.SELECT
        });


        totalNewSubscriptionArray.push(new_subscriptions ? new_subscriptions[0].total_price : 0);

        totalReactivateSubscriptionArray.push(reactivation_subscriptions ? reactivation_subscriptions[0].total_price : 0);

        totalChurnArray.push(Number(voluntary_churn ? voluntary_churn[0].total_price : 0) + Number(deliquent_churn ? deliquent_churn[0].total_price : 0));

        totalExistingSubscriptionsArray.push(Number(existing_subscriptions ? existing_subscriptions[0].total_price : 0));


        /** churn = voluntary_churn+deliquent_churn */
        let finalChurn = Number(voluntary_churn ? voluntary_churn[0].total_price : 0) + Number(deliquent_churn ? deliquent_churn[0].total_price : 0);
        finalChurn = finalChurn.toFixed(2);

        /** netNewMMR = (new_subscriptions+reactivation_subscriptions)-churn */
        let netNewMMR = (Number(new_subscriptions ? new_subscriptions[0].total_price : 0) + Number(reactivation_subscriptions ? reactivation_subscriptions[0].total_price : 0)) - Number(finalChurn);
        netNewMMR = netNewMMR.toFixed(2);
        totalNetNewMMRArray.push(+netNewMMR);

        /** totalMMR = (new_subscriptions+reactivation_subscriptions+existing_subscriptions)-churn */
        let totalMMR = ((Number(new_subscriptions ? new_subscriptions[0].total_price : 0) + Number(reactivation_subscriptions ? reactivation_subscriptions[0].total_price : 0) + Number(existing_subscriptions ? existing_subscriptions[0].total_price : 0)) - Number(finalChurn));

        let growthRate = (Number(netNewMMR) == 0 && Number(totalMMR) == 0) ? 0 : Number(netNewMMR) / Number(totalMMR) * 100;
        growthRate = growthRate.toFixed(2);
        totalGrowthRateArray.push(+growthRate);

        let newSubscriptions = Number(new_subscriptions ? new_subscriptions[0].total_price : 0);
        newSubscriptions = newSubscriptions.toFixed(2);

        let reactivations = Number(reactivation_subscriptions ? reactivation_subscriptions[0].total_price : 0);
        reactivations = reactivations.toFixed(2);

        finalGrowthRateReport.push({
          name: months[j].day,
          date: months[j].date,
          new: Number(newSubscriptions),
          reactivation: Number(reactivations),
          churn: Number(finalChurn),
          net_new_mrr: Number(netNewMMR),
          growth_rate: Number(growthRate)
        });

      }

      totalNewSubscription = totalNewSubscriptionArray.reduce((partialSum, a) => partialSum + a, 0);
      totalNewSubscription = totalNewSubscription.toFixed(2);

      totalReactivateSubscription = totalReactivateSubscriptionArray.reduce((partialSum, a) => partialSum + a, 0);
      totalReactivateSubscription = totalReactivateSubscription.toFixed(2);

      totalChurn = totalChurnArray.reduce((partialSum, a) => partialSum + a, 0);
      totalChurn = totalChurn.toFixed(2);


      totalNetNewMMR = totalNetNewMMRArray.reduce((partialSum, a) => partialSum + a, 0);
      totalNetNewMMR = totalNetNewMMR.toFixed(2);

      totalGrowthRate = totalGrowthRateArray.reduce((partialSum, a) => partialSum + a, 0);
      totalGrowthRate = totalGrowthRate.toFixed(2);

      let overAllReport = {
        "new": Number(totalNewSubscription),
        "reactivation": Number(totalReactivateSubscription),
        "churn": Number(totalChurn),
        "net_new_mrr": Number(totalNetNewMMR),
        "growth_rate": (totalGrowthRate == -Infinity) ? 0 : (totalGrowthRate != null) ? +totalGrowthRate : 0,
      }

      let growthRateReport = {
        over_all_report: overAllReport,
        customer_overview: finalGrowthRateReport
      }
      return res
        .status(201)
        .send(
          successResponse(
            AuthMessages.GET_DATA,
            growthRateReport,
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
  };



  /* get mmr overview report */
  async getMmrOverviewReport(req, res) {
    try {
      const { body, user } = req;
      let finalMmrOverviewReport = [];
      let months = [];

      let totalNewSubscriptionArray = [];
      let totalReactivateSubscriptionArray = [];
      let totalChurnArray = [];
      let totalExistingSubscriptionsArray = [];
      let totalNetNewMMRArray = [];

      let totalNewSubscription;
      let totalReactivateSubscription;
      let totalExistingSubscriptions;
      let totalChurn;
      let totalNetNewMMR;

      if (body.type == 0) {

        for (let i = 0; i < 12; i++) {
          let monthStart = moment().subtract(1, 'year').startOf('year').add(i, 'months');  // Start of each month in the previous year
          let monthEnd = moment().subtract(1, 'year').startOf('year').add(i, 'months').endOf('month'); // End of each month in the previous year

          months.push({
            day: monthStart.format("MMM"),   // Full month name, e.g., January
            date: monthStart.format("YYYY-MM-DD"),
            start_day: monthStart.format("YYYY-MM-DD"),  // First day of the month
            end_day: monthEnd.format("YYYY-MM-DD")   // Last day of the month
          });
        }

      } else if (body.type == 1) {

        let lastWeekStart = moment().subtract(1, 'weeks').startOf('isoWeek');  // Start of last week (Monday)
        let lastWeekEnd = moment().subtract(1, 'weeks').endOf('isoWeek');      // End of last week (Sunday)
        for (let i = 0; i < 7; i++) {
          let day = moment(lastWeekStart).add(i, 'days');
          months.push({
            day: day.format("ddd"),   // Full month name, e.g., January
            date: day.format("YYYY-MM-DD"),
            start_day: day.format("YYYY-MM-DD"), // First day of the month
            end_day: day.format("YYYY-MM-DD")   // Last day of the month
          });
        }

      } else if (body.type == 2) {

        for (let i = 0; i < 12; i++) {
          let monthStart = moment().startOf('year').add(i, 'months');  // Start of each month in the current year
          let monthEnd = moment().startOf('year').add(i, 'months').endOf('month'); // End of each month in the current year

          months.push({
            day: monthStart.format("MMM"),  // Full month name, e.g., January
            date: monthStart.format("YYYY-MM-DD"),
            start_day: monthStart.format("YYYY-MM-DD"),  // First day of the month
            end_day: monthEnd.format("YYYY-MM-DD")   // Last day of the month
          });
        }

      } else if (body.type == 3) {

        let startDate = moment(new Date(body.start_date)).format("YYYY-MM-DD");
        let endDate = moment(new Date(body.end_date)).format("YYYY-MM-DD");
        months = await this.services.getDateDifferenceArrayForReports(startDate, endDate)

      }

      for (let j = 0; j < months.length; j++) {


        /** Get new subscription created*/
        let new_subscriptions = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 1 AND deleted_at IS NULL AND is_renew_count = 1 AND DATE(FROM_UNIXTIME(`start_date`)) BETWEEN '" + months[j].start_day + "' AND '" + months[j].end_day + "'",
          {
            model: this.Models.ClientSubscriptions,
            mapToModel: true,
            raw: true,
            type: this.sequelize.QueryTypes.SELECT
          });

        /** Get reactivation subscriptions (resume subscriptions)*/
        let reactivation_subscriptions = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 1 AND deleted_at IS NULL AND is_renew_count > 1 AND DATE(FROM_UNIXTIME(`resume_date_time`)) BETWEEN '" + months[j].start_day + "' AND '" + months[j].end_day + "'",
          {
            model: this.Models.ClientSubscriptions,
            mapToModel: true,
            raw: true,
            type: this.sequelize.QueryTypes.SELECT
          });


        /** Get existing subscriptions (continue renew)*/
        let existing_subscriptions = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 1 AND deleted_at IS NULL AND is_renew_count > 1 AND resume_date_time IS NULL AND DATE(FROM_UNIXTIME(`start_date`)) BETWEEN '" + months[j].start_day + "' AND '" + months[j].end_day + "'",
          {
            model: this.Models.ClientSubscriptions,
            mapToModel: true,
            raw: true,
            type: this.sequelize.QueryTypes.SELECT
          });

        /** Get cancelled subscriptions */
        let voluntary_churn = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 4 AND deleted_at IS NULL AND DATE(FROM_UNIXTIME(`cancel_at`)) BETWEEN '" + months[j].start_day + "' AND '" + months[j].end_day + "'", {
          model: this.Models.ClientSubscriptions,
          mapToModel: true,
          raw: true,
          type: this.sequelize.QueryTypes.SELECT
        });

        /** Get subscriptions are not active*/
        let deliquent_churn = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 0 AND deleted_at IS NULL AND DATE(FROM_UNIXTIME(`start_date`)) BETWEEN '" + months[j].start_day + "' AND '" + months[j].end_day + "'", {
          model: this.Models.ClientSubscriptions,
          mapToModel: true,
          raw: true,
          type: this.sequelize.QueryTypes.SELECT
        });


        totalNewSubscriptionArray.push(new_subscriptions ? new_subscriptions[0].total_price : 0);

        totalReactivateSubscriptionArray.push(reactivation_subscriptions ? reactivation_subscriptions[0].total_price : 0);

        totalChurnArray.push(Number(voluntary_churn ? voluntary_churn[0].total_price : 0) + Number(deliquent_churn ? deliquent_churn[0].total_price : 0));

        totalExistingSubscriptionsArray.push(Number(existing_subscriptions ? existing_subscriptions[0].total_price : 0));

        /** churn = voluntary_churn+deliquent_churn */
        let finalChurn = Number(voluntary_churn ? voluntary_churn[0].total_price : 0) + Number(deliquent_churn ? deliquent_churn[0].total_price : 0);
        finalChurn = finalChurn.toFixed(2);


        /** netNewMMR = (new_subscriptions+reactivation_subscriptions+existing_subscriptions)-churn */
        let netMMR = (Number(new_subscriptions ? new_subscriptions[0].total_price : 0) + Number(reactivation_subscriptions ? reactivation_subscriptions[0].total_price : 0) + Number(existing_subscriptions ? existing_subscriptions[0].total_price : 0)) - Number(finalChurn);
        netMMR = netMMR.toFixed(2);

        totalNetNewMMRArray.push(+netMMR);

        let newSubscriptions = Number(new_subscriptions ? new_subscriptions[0].total_price : 0);
        newSubscriptions = newSubscriptions.toFixed(2);

        let reactivations = Number(reactivation_subscriptions ? reactivation_subscriptions[0].total_price : 0);
        reactivations = reactivations.toFixed(2);

        let existingSubscriptions = Number(existing_subscriptions ? existing_subscriptions[0].total_price : 0);
        existingSubscriptions = existingSubscriptions.toFixed(2);


        finalMmrOverviewReport.push({
          name: months[j].day,
          date: months[j].date,
          new: Number(newSubscriptions),
          reactivation: Number(reactivations),
          existing: Number(existingSubscriptions),
          churn: Number(finalChurn),
          mrr: Number(netMMR),
        });

      }

      totalNewSubscription = totalNewSubscriptionArray.reduce((partialSum, a) => partialSum + a, 0);
      totalNewSubscription = totalNewSubscription.toFixed(2);

      totalReactivateSubscription = totalReactivateSubscriptionArray.reduce((partialSum, a) => partialSum + a, 0);
      totalReactivateSubscription = totalReactivateSubscription.toFixed(2);

      totalExistingSubscriptions = totalExistingSubscriptionsArray.reduce((partialSum, a) => partialSum + a, 0);
      totalExistingSubscriptions = totalExistingSubscriptions.toFixed(2);

      totalChurn = totalChurnArray.reduce((partialSum, a) => partialSum + a, 0);
      totalChurn = totalChurn.toFixed(2);

      totalNetNewMMR = totalNetNewMMRArray.reduce((partialSum, a) => partialSum + a, 0);
      totalNetNewMMR = totalNetNewMMR.toFixed(2);


      let overAllReport = {
        "new": Number(totalNewSubscription),
        "reactivation": Number(totalReactivateSubscription),
        "existing": Number(totalExistingSubscriptions),
        "churn": Number(totalChurn),
        "mrr": Number(totalNetNewMMR),
      }

      let growthRateReport = {
        over_all_report: overAllReport,
        customer_overview: finalMmrOverviewReport
      }
      return res
        .status(201)
        .send(
          successResponse(
            AuthMessages.GET_DATA,
            growthRateReport,
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
  };


  /* get financial report */
  async getFinancialReport(req, res) {
    try {
      const { body, user } = req;
      let finalGrowthReport = [];
      let finalNewCustomerReport = [];
      let finalChurnReport = [];
      let finalReactivationReport = [];

      let months = [];
      let totalReactivateSubscriptionArray = [];
      let totalChurnArray = [];
      let totalExistingSubscriptionsArray = [];


      let totalNetMMRArray = [];
      let totalActiveCustomersArray = [];
      let totalCurrentCustomersArray = [];

      let totalNetMMR;
      let totalActiveCustomers;
      let totalCurrentCustomers;


      let thisMonthStartDate;
      let thisMonthEndDate;

      if (body.type == 1) {

        let lastMonthStart = moment().subtract(1, 'months').startOf('month');  // First day of last month
        let lastMonthEnd = moment().subtract(1, 'months').endOf('month');
        let startDate = moment(new Date(lastMonthStart)).format("YYYY-MM-DD");
        let endDate = moment(new Date(lastMonthEnd)).format("YYYY-MM-DD");
        months = await this.services.getDateDifferenceArrayForReports(startDate, endDate);

        thisMonthStartDate = startDate;
        thisMonthEndDate = endDate;


      } else {

        let currentMonthStart = moment().startOf('month');  // First day of the current month
        let currentMonthEnd = moment().endOf('month');      // Last day of the current month
        let startDate = moment(new Date(currentMonthStart)).format("YYYY-MM-DD");
        let endDate = moment(new Date(currentMonthEnd)).format("YYYY-MM-DD");
        months = await this.services.getDateDifferenceArrayForReports(startDate, endDate);

        thisMonthStartDate = startDate;
        thisMonthEndDate = endDate;
      }

      let getThismonthGrowthRate = await this.services.getMonthGrowthRate(thisMonthStartDate, thisMonthEndDate);

      let getLastMonthStart = moment(new Date(thisMonthStartDate)).subtract(1, 'months').startOf('month');  // First day of last month
      let getLastMonthEnd = moment(new Date(thisMonthEndDate)).subtract(1, 'months').endOf('month');

      let NewGetLastMonthStart = moment(new Date(getLastMonthStart)).format("YYYY-MM-DD");
      let NewGetLastMonthEnd = moment(new Date(getLastMonthEnd)).format("YYYY-MM-DD");

      let getLastmonthGrowthRate = await this.services.getMonthGrowthRate(NewGetLastMonthStart, NewGetLastMonthEnd);

      let finalGrowthValue = getThismonthGrowthRate.total_growth;
      /** GrowthRate = Current Month Growth - Last month Growth / Last month Growth * 100  */
      let finalGrowthRate = (Number(getThismonthGrowthRate.total_growth) == 0 && Number(getLastmonthGrowthRate.total_growth) == 0) ? 0 : Number(getLastmonthGrowthRate.total_growth) == 0 ? 0 : (Number(finalGrowthValue) - Number(getLastmonthGrowthRate.total_growth) / Number(getLastmonthGrowthRate.total_growth)) * 100;
      finalGrowthRate = finalGrowthRate.toFixed(2);



      let finalNewCustomerValue = getThismonthGrowthRate.total_customers;
      /** customerRate = Current Month Customer - Last month Customer / Last month Customer * 100  */
      let finalNewCustomerRate = (Number(getThismonthGrowthRate.total_customers) == 0 && Number(getLastmonthGrowthRate.total_customers) == 0) ? 0 : Number(getLastmonthGrowthRate.total_customers) == 0 ? 0 : (Number(finalNewCustomerValue) - Number(getLastmonthGrowthRate.total_customers) / Number(getLastmonthGrowthRate.total_customers)) * 100;
      finalNewCustomerRate = finalNewCustomerRate.toFixed(2);


      let finalChurnValue = getThismonthGrowthRate.total_churn;
      /** churnRate = Current Month Churn - Last month Churn / Last month Churn * 100  */
      let finalChurnRate = (Number(getThismonthGrowthRate.total_churn) == 0 && Number(getLastmonthGrowthRate.total_churn) == 0) ? 0 : Number(getLastmonthGrowthRate.total_churn) == 0 ? 0 : (Number(finalChurnValue) - Number(getLastmonthGrowthRate.total_churn) / Number(getLastmonthGrowthRate.total_churn)) * 100;
      finalChurnRate = finalChurnRate.toFixed(2);



      let finalReactivationValue = getThismonthGrowthRate.total_reactivations;
      /** reactivation = Current Month reactivation - Last month reactivation / Last month reactivation * 100  */
      let finalReactivationRate = (Number(getThismonthGrowthRate.total_reactivations) == 0 && Number(getLastmonthGrowthRate.total_reactivations) == 0) ? 0 : Number(getLastmonthGrowthRate.total_reactivations) == 0 ? 0 : (Number(finalChurnRate) - Number(getLastmonthGrowthRate.total_reactivations) / Number(getLastmonthGrowthRate.total_reactivations)) * 100;
      finalReactivationRate = finalReactivationRate.toFixed(2);


      for (let j = 0; j < months.length; j++) {

        /** Get new subscription created*/
        let new_subscriptions = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 1 AND deleted_at IS NULL AND is_renew_count = 1 AND DATE(FROM_UNIXTIME(`start_date`)) BETWEEN '" + months[j].start_day + "' AND '" + months[j].end_day + "'",
          {
            model: this.Models.ClientSubscriptions,
            mapToModel: true,
            raw: true,
            type: this.sequelize.QueryTypes.SELECT
          });

        /** Get reactivation subscriptions (resume subscriptions)*/
        let reactivation_subscriptions = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 1 AND deleted_at IS NULL AND is_renew_count > 1 AND DATE(FROM_UNIXTIME(`resume_date_time`)) BETWEEN '" + months[j].start_day + "' AND '" + months[j].end_day + "'",
          {
            model: this.Models.ClientSubscriptions,
            mapToModel: true,
            raw: true,
            type: this.sequelize.QueryTypes.SELECT
          });


        /** Get existing subscriptions (continue renew)*/
        let existing_subscriptions = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 1 AND deleted_at IS NULL AND is_renew_count > 1 AND resume_date_time IS NULL AND DATE(FROM_UNIXTIME(`start_date`)) BETWEEN '" + months[j].start_day + "' AND '" + months[j].end_day + "'",
          {
            model: this.Models.ClientSubscriptions,
            mapToModel: true,
            raw: true,
            type: this.sequelize.QueryTypes.SELECT
          });


        /** Get cancelled subscriptions */
        let voluntary_churn = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 4 AND deleted_at IS NULL AND DATE(FROM_UNIXTIME(`cancel_at`)) BETWEEN '" + months[j].start_day + "' AND '" + months[j].end_day + "'", {
          model: this.Models.ClientSubscriptions,
          mapToModel: true,
          raw: true,
          type: this.sequelize.QueryTypes.SELECT
        });

        /** Get subscriptions are not active*/
        let deliquent_churn = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 0 AND deleted_at IS NULL AND DATE(FROM_UNIXTIME(`start_date`)) BETWEEN '" + months[j].start_day + "' AND '" + months[j].end_day + "'", {
          model: this.Models.ClientSubscriptions,
          mapToModel: true,
          raw: true,
          type: this.sequelize.QueryTypes.SELECT
        });


        totalReactivateSubscriptionArray.push(reactivation_subscriptions ? reactivation_subscriptions[0].total_price : 0);

        totalChurnArray.push(Number(voluntary_churn ? voluntary_churn[0].total_price : 0) + Number(deliquent_churn ? deliquent_churn[0].total_price : 0));

        totalExistingSubscriptionsArray.push(Number(existing_subscriptions ? existing_subscriptions[0].total_price : 0));

        /** churn = voluntary_churn+deliquent_churn */
        let finalChurn = Number(voluntary_churn ? voluntary_churn[0].total_price : 0) + Number(deliquent_churn ? deliquent_churn[0].total_price : 0);
        finalChurn = finalChurn.toFixed(2);

        let newCustomers = Number(new_subscriptions ? new_subscriptions[0].total_clients : 0);

        /** totalGrowth = (new_subscriptions+reactivation_subscriptions)-churn */
        let totalGrowth = (Number(new_subscriptions ? new_subscriptions[0].total_price : 0) + Number(reactivation_subscriptions ? reactivation_subscriptions[0].total_price : 0) + Number(existing_subscriptions ? existing_subscriptions[0].total_price : 0)) - Number(finalChurn);
        totalGrowth = totalGrowth.toFixed(2);


        let newSubscriptions = Number(new_subscriptions ? new_subscriptions[0].total_price : 0);
        newSubscriptions = newSubscriptions.toFixed(2);

        let reactivations = Number(reactivation_subscriptions ? reactivation_subscriptions[0].total_price : 0);
        reactivations = reactivations.toFixed(2);

        let existingSubscriptions = Number(existing_subscriptions ? existing_subscriptions[0].total_price : 0);
        existingSubscriptions = existingSubscriptions.toFixed(2);


        finalGrowthReport.push({
          name: months[j].day,
          date: months[j].date,
          growth: Number(totalGrowth),
        });

        finalNewCustomerReport.push({
          name: months[j].day,
          date: months[j].date,
          customers: Number(newCustomers),
        });

        finalChurnReport.push({
          name: months[j].day,
          date: months[j].date,
          churn: Number(finalChurn),
        });

        finalReactivationReport.push({
          name: months[j].day,
          date: months[j].date,
          reactivation: Number(reactivations),
        });

      }


      /** Get new subscription created*/
      let get_new_subscriptions = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 1 AND deleted_at IS NULL AND is_renew_count = 1",
        {
          model: this.Models.ClientSubscriptions,
          mapToModel: true,
          raw: true,
          type: this.sequelize.QueryTypes.SELECT
        });

      /** Get reactivation subscriptions (resume subscriptions)*/
      let get_reactivation_subscriptions = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 1 AND deleted_at IS NULL AND is_renew_count > 1",
        {
          model: this.Models.ClientSubscriptions,
          mapToModel: true,
          raw: true,
          type: this.sequelize.QueryTypes.SELECT
        });


      /** Get existing subscriptions (continue renew)*/
      let get_existing_subscriptions = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 1 AND deleted_at IS NULL AND is_renew_count > 1 AND resume_date_time IS NULL",
        {
          model: this.Models.ClientSubscriptions,
          mapToModel: true,
          raw: true,
          type: this.sequelize.QueryTypes.SELECT
        });

      /** Get cancelled subscriptions */
      let get_voluntary_churn = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 4 AND deleted_at IS NULL", {
        model: this.Models.ClientSubscriptions,
        mapToModel: true,
        raw: true,
        type: this.sequelize.QueryTypes.SELECT
      });

      /** Get subscriptions are not active*/
      let get_deliquent_churn = await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 0 AND deleted_at IS NULL", {
        model: this.Models.ClientSubscriptions,
        mapToModel: true,
        raw: true,
        type: this.sequelize.QueryTypes.SELECT
      });


      /** Get active cutomers who's subscription is active*/
      // let total_active_customers =  await this.sequelize.query("SELECT COUNT(DISTINCT client_id) as total_clients, SUM(total_price) as total_price FROM client_subscriptions WHERE status = 1",{
      //   model: this.Models.ClientSubscriptions,
      //   mapToModel: true,
      //   raw: true,
      //   type: this.sequelize.QueryTypes.SELECT
      // });

      let total_active_customers = await this.sequelize.query(`
        SELECT COUNT(DISTINCT cs.client_id) as total_clients, 
               SUM(cs.total_price) as total_price 
        FROM client_subscriptions cs
        JOIN users u ON cs.client_id = u.id
        WHERE cs.status = 1
          AND cs.deleted_at IS NULL
          AND cs.is_signed_docusign = 1
          AND u.status = 1
          AND u.deleted_at IS NULL
      `, {
        model: this.Models.ClientSubscriptions,
        mapToModel: true,
        raw: true,
        type: this.sequelize.QueryTypes.SELECT
      });


      /** Get all clients in db */
      let total_current_customers = await this.sequelize.query("select COUNT(*) as total_clients from users where role_id = 2 AND deleted_at IS NULL", {
        model: this.Models.Users,
        mapToModel: true,
        raw: true,
        type: this.sequelize.QueryTypes.SELECT
      });


      totalNetMMRArray.push((Number(get_new_subscriptions ? get_new_subscriptions[0].total_price : 0) + Number(get_reactivation_subscriptions ? get_reactivation_subscriptions[0].total_price : 0) + Number(get_existing_subscriptions ? get_existing_subscriptions[0].total_price : 0)) - (Number(get_voluntary_churn ? get_voluntary_churn[0].total_price : 0) - Number(get_deliquent_churn ? get_deliquent_churn[0].total_price : 0)));

      totalActiveCustomersArray.push(Number(total_active_customers ? total_active_customers[0].total_clients : 0));

      totalCurrentCustomersArray.push(Number(total_current_customers ? total_current_customers[0].total_clients : 0));

      totalNetMMR = totalNetMMRArray.reduce((partialSum, a) => partialSum + a, 0);
      totalNetMMR = totalNetMMR.toFixed(2);

      totalActiveCustomers = totalActiveCustomersArray.reduce((partialSum, a) => partialSum + a, 0);
      totalActiveCustomers = totalActiveCustomers.toFixed(2);

      totalCurrentCustomers = totalCurrentCustomersArray.reduce((partialSum, a) => partialSum + a, 0);
      totalCurrentCustomers = totalCurrentCustomers.toFixed(2);

      let overAllReport = {
        "current_mmr": Number(totalNetMMR),
        "current_customers": Number(totalCurrentCustomers),
        "active_customers": Number(totalActiveCustomers),
      }

      let growthRateReport = {
        "over_all_report": overAllReport,
        "growth": {
          "growth": +finalGrowthValue,
          "growth_rate": +finalGrowthRate,
          "growth_data": finalGrowthReport
        },
        "new_customers": {
          "new_customer_count": +finalNewCustomerValue,
          "new_customer_rate": +finalNewCustomerRate,
          "new_customer_data": finalNewCustomerReport
        },
        "churn": {
          "churn_count": +finalChurnValue,
          "churn_data_rate": +finalChurnRate,
          "churn_data": finalChurnReport
        },
        "reactivation": {
          "reactivation_count": +finalReactivationValue,
          "reactivation_data_rate": +finalReactivationRate,
          "reactivation_data": finalReactivationReport
        }
      }
      return res
        .status(201)
        .send(
          successResponse(
            AuthMessages.GET_DATA,
            growthRateReport,
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
  };



  /* get customer activity */
  async getCustomerActivity(req, res) {
    try {
      const { query } = req;
      query.start = query.start ? query.start : 0;
      query.limit = query.limit ? query.limit : 20;
      const getCustomerActivity = await this.services.getCustomerActivityList(query);
      return res
        .status(200)
        .send(
          successResponse(AuthMessages.GET_DATA, getCustomerActivity, RESPONSE_CODES.POST)
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


  // Get Two Factor Setting
  async getTwoFactorSetting(req, res) {
    try {
      const { user } = req;
      let getGlobalSetting = await this.Models.GlobalSettings.findAll({
        attributes: ["id", "user_role", "is_authenticate"],
        raw: true
      });

      let globalData = [];

      if (getGlobalSetting.length > 0) {

        for (let i in getGlobalSetting) {

          if (getGlobalSetting[i].user_role == ROLES.CLIENT) {
            globalData.push({
              "key": "Enable 2FA for Clients",
              "user_role": ROLES.CLIENT,
              "is_authenticate": getGlobalSetting[i].is_authenticate
            });
          } else if (getGlobalSetting[i].user_role == ROLES.AGENT) {
            globalData.push({
              "key": "Enable 2FA for Agents",
              "user_role": ROLES.AGENT,
              "is_authenticate": getGlobalSetting[i].is_authenticate
            });
          } else if (getGlobalSetting[i].user_role == ROLES.ACCOUNTMANAGER) {
            globalData.push({
              "key": "Enable 2FA for Admin users",
              "user_role": ROLES.ACCOUNTMANAGER,
              "is_authenticate": getGlobalSetting[i].is_authenticate
            });
          } else if (getGlobalSetting[i].user_role == ROLES.USER) {
            globalData.push({
              "key": "Enable 2FA for Users",
              "user_role": ROLES.USER,
              "is_authenticate": getGlobalSetting[i].is_authenticate
            });
          } else if (getGlobalSetting[i].user_role == 6) {
            globalData.push({
              "key": "Allow clients to cancel their subscriptions directly from their dashboard",
              "user_role": 6,
              "is_authenticate": getGlobalSetting[i].is_authenticate
            });
          } else {
            globalData.push({
              "key": "Password Setting",
              "user_role": 7,
              "is_authenticate": getGlobalSetting[i].is_authenticate
            });
          }
        }
      } else {
        globalData = [
          {
            "key": "Enable 2FA for Clients",
            "user_role": ROLES.CLIENT,
            "is_authenticate": 0
          },
          {
            "key": "Enable 2FA for Agents",
            "user_role": ROLES.AGENT,
            "is_authenticate": 0
          },
          {
            "key": "Enable 2FA for Admin users",
            "user_role": ROLES.ACCOUNTMANAGER,
            "is_authenticate": 0
          },
          {
            "key": "Enable 2FA for Users",
            "user_role": ROLES.USER,
            "is_authenticate": 0
          },
          {
            "key": "Allow clients to cancel their subscriptions directly from their dashboard",
            "user_role": 6,
            "is_authenticate": 0
          },
          {
            "key": "Password Setting",
            "user_role": 7,
            "is_authenticate": 3
          }
        ];
        await this.Models.GlobalSettings.bulkCreate(globalData);
      }

      return res
        .status(200)
        .send(
          successResponse(AuthMessages.GET_DATA, globalData, RESPONSE_CODES.GET)
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

  // update Two Factor Setting
  async updateTwoFactorSetting(req, res) {
    try {
      const { body } = req;
      if (body.two_factor_setting.length > 0) {
        for (let i in body.two_factor_setting) {
          await this.Models.GlobalSettings.update(
            {
              is_authenticate: body.two_factor_setting[i].is_authenticate
            }, {
            where: {
              user_role: body.two_factor_setting[i].user_role,
            },
          });
        }
      }
      return res
        .status(200)
        .send(
          successResponse(AuthMessages.TWO_FACTOR_SETTING, {}, RESPONSE_CODES.POST)
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


  // add Roles And Permission
  async addRolesAndPermission(req, res) {
    try {
      const { body, user } = req;

      let checkRoleExist = await this.services.getRolesAndPermissions(body.name);
      // if(checkRoleExist) {
      //   return res
      //   .status(400)
      //   .send(
      //     errorResponse(
      //       AuthMessages.ROLE_ALREADY_EXIST,
      //       null,
      //       RESPONSE_CODES.BAD_REQUEST
      //     )
      //   );
      // };

      body.added_by = user.id;
      let bodyData = { ...body.client_access, ...body.agent_access, ...body.report_access, ...body.chat_access, ...body.support_access, ...body.admin_access, ...body.agent_group_access };
      let finalBodyData = {
        ...body,
        ...bodyData
      };
      finalBodyData.support_access = body.support_access.support_access_allow;
      finalBodyData.agent_group_view = body.agent_access.agent_view;
      delete finalBodyData.client_access;
      delete finalBodyData.agent_access;
      delete finalBodyData.report_access;
      delete finalBodyData.chat_access;
      delete finalBodyData.admin_access;
      delete finalBodyData.agent_group_access

      let checkFieldExist = await this.services.checkFields(finalBodyData);

      if (checkFieldExist == 0) {
        return res
          .status(400)
          .send(
            errorResponse(
              AuthMessages.ENABLE_ONE_PERMISSION,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      await this.services.createRolesAndPermissions(finalBodyData);
      return res
        .status(200)
        .send(
          successResponse(AuthMessages.ROLE_AND_PERMISSION_ADDED, {}, RESPONSE_CODES.POST)
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

  // get Roles And Permission
  async getRolesAndPermission(req, res) {
    try {
      const { params, user } = req;
      if (params.role_permission_id == user.role_permission_id) {
        return res
          .status(400)
          .send(
            errorResponse(
              AuthMessages.ROLE_PERMISSION_NOT_ACCESS,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      let checkRoleExist = await this.services.getRolesAndPermissionsByIdAndRole(params.role_permission_id, user);
      if (!checkRoleExist) {
        return res
          .status(400)
          .send(
            errorResponse(
              AuthMessages.ROLE_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      };
      checkRoleExist.support_access_allow = checkRoleExist.support_access;
      return res
        .status(200)
        .send(
          successResponse(AuthMessages.GET_DATA, checkRoleExist, RESPONSE_CODES.GET)
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


  // get Roles And Permission list
  async getRolesAndPermissionList(req, res) {
    try {
      const { body, user } = req;
      let getRolesPermissions = await this.services.getRolesAndPermissionList(body, user);
      return res
        .status(200)
        .send(
          successResponse(AuthMessages.GET_DATA, getRolesPermissions, RESPONSE_CODES.GET)
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

  // delete Roles And Permission
  async deleteRolesAndPermission(req, res) {
    try {
      const { params } = req;
      let checkRoleExist = await this.services.getRolesAndPermissionsById(params.role_permission_id);
      if (!checkRoleExist) {
        return res
          .status(400)
          .send(
            errorResponse(
              AuthMessages.ROLE_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      };
      let checkRolesAndPermissionsInUsers = await this.services.checkRolesAndPermissionsInUsersById(params.role_permission_id);
      if (checkRolesAndPermissionsInUsers) {
        let message = AuthMessages.USER_ROLE_CANNOT_DELETE;
        if (checkRolesAndPermissionsInUsers.role_id == ROLES.ACCOUNTMANAGER) {
          message = AuthMessages.ROLE_CANNOT_DELETE;
        }
        return res
          .status(400)
          .send(
            errorResponse(
              message,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      };

      let deletedData = {
        deleted_at: moment(new Date()).unix(),
      };

      await this.services.updateRolesAndPermissions(deletedData, params.role_permission_id);
      return res
        .status(200)
        .send(
          successResponse(AuthMessages.ROLE_DELETED, {}, RESPONSE_CODES.GET)
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
  async updateRolesAndPermission(req, res) {
    try {
      const { body, params } = req;

      let checkRoleExist = await this.services.getRolesAndPermissionsById(params.role_permission_id);
      if (!checkRoleExist) {
        return res
          .status(400)
          .send(
            errorResponse(
              AuthMessages.ROLE_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      };

      let checkRoleNameExist = await this.services.getRolesAndPermissionsByNameOrId(body.name, params.role_permission_id);
      if (checkRoleNameExist) {
        return res
          .status(400)
          .send(
            errorResponse(
              AuthMessages.ROLE_ALREADY_EXIST,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      };

      let bodyData = { ...body.client_access, ...body.agent_access, ...body.report_access, ...body.chat_access, ...body.support_access, ...body.admin_access, ...body.agent_group_access };
      let finalBodyData = {
        ...body,
        ...bodyData
      };
      finalBodyData.support_access = body.support_access.support_access_allow;
      finalBodyData.agent_group_view = body.agent_access.agent_view;
      delete finalBodyData.client_access;
      delete finalBodyData.agent_access;
      delete finalBodyData.report_access;
      delete finalBodyData.chat_access;
      delete finalBodyData.admin_access;
      delete finalBodyData.agent_group_access

      let checkFieldExist = await this.services.checkFields(finalBodyData);
      if (checkFieldExist == 0) {
        return res
          .status(400)
          .send(
            errorResponse(
              AuthMessages.ENABLE_ONE_PERMISSION,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      await this.services.updateRolesAndPermissions(finalBodyData, params.role_permission_id);
      return res
        .status(200)
        .send(
          successResponse(AuthMessages.ROLE_AND_PERMISSION_UPDATED, {}, RESPONSE_CODES.POST)
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



  // get User Roles And Permission
  async getUserRolesAndPermission(req, res) {
    try {
      const { user } = req;
      let getRolePermission = await this.services.getRolesAndPermissionsByIdAndRole(user.role_permission_id, user);
      if (getRolePermission && getRolePermission.support_access) {
        getRolePermission.support_access_allow = getRolePermission.support_access;
      }
      if (getRolePermission && getRolePermission.is_agent_access == 0 && getRolePermission.is_agent_group_access == 0) {
        getRolePermission.is_agents_list = 0;
      } else if (getRolePermission && getRolePermission.is_agent_access == 1 && getRolePermission.is_agent_group_access == 1) {
        getRolePermission.is_agents_list = 1;
      }
      return res
        .status(200)
        .send(
          successResponse(AuthMessages.GET_DATA, getRolePermission, RESPONSE_CODES.GET)
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



  // subscription setting update
  async subscriptionSettingUpdate(req, res) {
    try {
      let { body, user } = req;

      let getSetting = await this.services.checkSubscriptionSettings();
      if (getSetting && getSetting.global_processing_fee != "" && (getSetting.global_processing_fee != body.global_processing_fee || getSetting.global_processing_fee_description != body.global_processing_fee_description)) {
        let getTaxId = await this.services.createSubscriptionTaxRate(body.global_processing_fee, body.global_processing_fee_description);
        body.tax_rate_id = getTaxId;
      }

      if (!getSetting) {
        await this.services.createSubscriptionSettings(body);
      } else {
        await this.services.updateSubscriptionSettings(body, getSetting.id);
      }

      return res
        .status(200)
        .send(
          successResponse(AuthMessages.SUBSCRIPTION_SETTING, {}, RESPONSE_CODES.POST)
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

  // get subscription setting 
  async getSubscriptionSetting(req, res) {
    try {
      const { user } = req;
      let getSetting = await this.services.checkSubscriptionSettings();
      return res
        .status(200)
        .send(
          successResponse(AuthMessages.GET_DATA, getSetting, RESPONSE_CODES.GET)
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


  // get Notification List
  async getNotificationList(req, res) {
    try {
      const { body, user } = req;
      let getAllNotificationList = await this.services.getAllNotifications(body, user);
      return res
        .status(200)
        .send(
          successResponse(AuthMessages.GET_DATA, getAllNotificationList, RESPONSE_CODES.GET)
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

  // read Notification
  async readNotification(req, res) {
    try {
      const { params, user } = req;
      let notificationIds = [params.notification_id];
      if (params.notification_id != 0) {
        let getNotification = await this.services.getNotificationById(params.notification_id, user.id);
        if (!getNotification) {
          return res
            .status(400)
            .send(
              errorResponse(
                AuthMessages.NOTIFICATION_NOT_FOUND,
                null,
                RESPONSE_CODES.BAD_REQUEST
              )
            );
        }
      } else {
        notificationIds = await this.services.getAllNotificationsById(user.id);
      }
      await this.services.updateNotificationById(notificationIds);
      return res
        .status(200)
        .send(
          successResponse(AuthMessages.NOTIFICATION_READ, {}, RESPONSE_CODES.GET)
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


  /** Get notification count */
  async notificationCount(req, res) {
    try {
      const { user } = req;
      let whereCondition = {
        deleted_at: null,
        user_id: user.id,
        is_read: 0
      };
      const getNotificationCount = await this.Models.ReadNotifications.count({
        where: whereCondition
      });

      let notificationCount = {
        total_count: (getNotificationCount == 0) ? 0 : getNotificationCount
      }
      return res
        .status(200)
        .send(
          successResponse(AuthMessages.NOTIFICATION_COUNT, notificationCount, RESPONSE_CODES.GET)
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


  // Get Password Setting
  async getPasswordSetting(req, res) {
    try {
      const { user } = req;
      let getGlobalSetting = await this.Models.GlobalSettings.findOne({
        attributes: ["id", "user_role", "is_authenticate"],
        where: {
          user_role: 7
        },
        raw: true
      });

      let globalData = {};

      if (getGlobalSetting) {

        globalData.password_setting = {
          "key": "Password Setting",
          "user_role": 7,
          "is_authenticate": getGlobalSetting.is_authenticate
        };

      } else {

        globalData.password_setting = {
          "key": "Password Setting",
          "user_role": 7,
          "is_authenticate": 3
        };

        // await this.Models.GlobalSettings.create(globalData.password_setting);
      }

      return res
        .status(200)
        .send(
          successResponse(AuthMessages.GET_DATA, globalData, RESPONSE_CODES.GET)
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



  /** Slack integartion link */
  async slackIntegrationLink(req, res) {
    try {

      const { user, query } = req;
      if (!query.project_id) {
        
      }


      let checkUserIntegration = await this.Models.Users.findOne({
        attributes: ["id"],
        where: {
          id: user.id,
          deleted_at: null
        },
        raw: true,
      });

      if (!checkUserIntegration) {
        return res
          .status(400)
          .send(
            errorResponse(
              AuthMessages.USER_NOT_FOUND,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      // if(checkUserIntegration && checkUserIntegration.slack_notification_url !="") {
      //   return res
      //   .status(400)
      //   .send(
      //     errorResponse(
      //       AuthMessages.ALREADY_INTEGRATE_SLACK,
      //       null,
      //       RESPONSE_CODES.BAD_REQUEST
      //     )
      //   );
      // }

      let decodeData = {
        userId: user.id,
        type: (query.type == 1) ? 1 : 0,
        project_id:query.project_id
      };
      decodeData = JSON.stringify(decodeData);
      console.log(key, "======key============");
      var decodeDataToString = crypto.AES.encrypt(decodeData, key).toString();
      decodeDataToString = crypto.enc.Base64.parse(decodeDataToString);
      decodeDataToString = decodeDataToString.toString(crypto.enc.Hex);
      console.log(decodeDataToString, "======decodeDataToString============");


      const slackAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=incoming-webhook&user_scope=&redirect_uri=${process.env.SLACK_REDIRECT_URI}&state=${decodeDataToString}`;

      let integrationLink = {
        url: slackAuthUrl
      };

      return res
        .status(200)
        .send(
          successResponse(AuthMessages.GET_DATA, integrationLink, RESPONSE_CODES.GET)
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


  async SlackRedirect(req, res) {
    const code = req.query.code;
    const state = req.query.state;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    if (!state) {
      return res.status(400).json({ error: 'State is required' });
    }

    var decodeDataBase64 = crypto.enc.Hex.parse(state).toString(crypto.enc.Base64);
    var bytes = crypto.AES.decrypt(decodeDataBase64, key);
    var decryptedData = bytes.toString(crypto.enc.Utf8);
    var decodedObject = JSON.parse(decryptedData);
    console.log(decodedObject, "======decodedObject============");
    const userId = decodedObject.userId;
    const redirectType = decodedObject.type;
    console.log(userId, "======userId============");
    console.log(redirectType, "======redirectType============");
    const projectId = decodedObject.project_id


    try {
      // URL-encoded body
      const requestBody = qs.stringify({
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        code: code,
        redirect_uri: process.env.SLACK_REDIRECT_URI
      });

      // Make the POST request to Slack

      const response = await axios.post(`${process.env.SLACK_API_URL}`, requestBody, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      // Extract the incoming_webhook URL
      const incomingWebhookUrl = response.data?.incoming_webhook?.url;
      const incomingConfigUrl = response.data?.incoming_webhook?.configuration_url;
      const channelName = response.data?.incoming_webhook?.channel;

      if (incomingWebhookUrl) {
        let updateSlackConfig = {
          slack_notification_url: incomingWebhookUrl,
          slack_channel_name: channelName,
          slack_configuration_url: incomingConfigUrl,
        };
        await this.services.updateProject(updateSlackConfig,projectId)

        if (redirectType == 1) {
          const getUserUuid = await this.services.findUserDetailById(userId);
          res.redirect(`${process.env.BASE_URL}integration?ci=${getUserUuid.uuid}`);
        } else {
          res.redirect(`${process.env.BASE_URL}integration`);
        }

        // return res
        // .status(200)
        // .send(
        //   successResponse(AuthMessages.SLACK_CHANNEL_SELECTED, {}, RESPONSE_CODES.GET)
        // );
      } else {
        res.status(400).json({ error: 'Incoming webhook URL not found in the response' });
      }
    } catch (error) {
      console.error(error);
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


  /** Update types of slack notification */
  async updateTypesOfSlackNotification(req, res) {
    try {
      const { body, user } = req;
      const projectId = body.project_id
      delete body.project_id
      await this.services.updateProject(body,projectId)
      return res
        .status(200)
        .send(
          successResponse(AuthMessages.SLACK_NOTIFICATION_TYPE_SAVED, {}, RESPONSE_CODES.PUT)
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




  /** Google calendar integartion link */
  async googleIntegrationLink(req, res) {
    try {

      const { user, query } = req;
      const userId = user.id;

      let decodeData = {
        userId: userId,
        type: (query.type == 1) ? 1 : 0,
      };
      decodeData = JSON.stringify(decodeData);
      console.log(key, "======key============");
      var decodeDataToString = crypto.AES.encrypt(decodeData, key).toString();
      decodeDataToString = crypto.enc.Base64.parse(decodeDataToString);
      decodeDataToString = decodeDataToString.toString(crypto.enc.Hex);
      console.log(decodeDataToString, "======decodeDataToString============");

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: "consent", // Forces consent screen every time
        scope: ['https://www.googleapis.com/auth/calendar.events','https://www.googleapis.com/auth/calendar.readonly'],
        state: decodeDataToString,
      });
      console.log(authUrl, "====authUrl====")

      let integrationLink = {
        url: authUrl
      };
      return res
        .status(200)
        .send(
          successResponse(AuthMessages.GET_DATA, integrationLink, RESPONSE_CODES.GET)
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



  async googleCalendarRedirect(req, res) {
    const code = req.query.code;
    const state = req.query.state;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    if (!state) {
      return res.status(400).json({ error: 'State is required' });
    }


    var decodeDataBase64 = crypto.enc.Hex.parse(state).toString(crypto.enc.Base64);
    var bytes = crypto.AES.decrypt(decodeDataBase64, key);
    var decryptedData = bytes.toString(crypto.enc.Utf8);
    var decodedObject = JSON.parse(decryptedData);
    console.log(decodedObject, "======decodedObject============");
    const userId = decodedObject.userId;
    const redirectType = decodedObject.type;
    console.log(userId, "======userId============");
    console.log(redirectType, "======redirectType============");

    try {
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
      let googleAuthConfig = {
        google_auth_token: credentials,
      };
      await this.services.updateUser(googleAuthConfig, userId);

      if (redirectType == 1) {
        const getUserUuid = await this.services.findUserDetailById(userId);
        res.redirect(`${process.env.BASE_URL}integration?ci=${getUserUuid.uuid}`);
      } else {
        res.redirect(`${process.env.BASE_URL}integration`);
      }

      // return res
      // .status(200)
      // .send(
      //   successResponse(AuthMessages.SLACK_CHANNEL_SELECTED, {}, RESPONSE_CODES.GET)
      // );
    } catch (error) {
      console.error(error);
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


  async addGoogleEvent(req, res) {
    try {
      const { body, user } = req;
      let getUserToken = await this.Models.Users.findOne({
        attributes: ["id", "google_auth_token"],
        where: {
          id: user.id,
          deleted_at: null
        },
        raw: true
      });

      if (getUserToken && !getUserToken.google_auth_token) {
        return res
          .status(400)
          .send(
            errorResponse(
              AuthMessages.GOOGLE_AUTHENTICATION_REQUIRED,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }
      body.tokens = getUserToken.google_auth_token;
      let createEvent = await addGoogleCalenderEvent(body);
      console.log(createEvent, "=====createEvent=====");
      return res
        .status(200)
        .send(
          successResponse(AuthMessages.GOOGLE_AUTHENTICATION_REQUIRED, {}, RESPONSE_CODES.GET)
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


  async privacyPolicy(req, res) {
    try {

      let data = "This is a privacy policy."
      return res
        .status(200)
        .send(
          successResponse("Get privacy policy", data, RESPONSE_CODES.GET)
        );

    } catch (error) {
      console.error(error);
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



  async termCondition(req, res) {
    try {

      let data = "This is a Terms & conditions."
      return res
        .status(200)
        .send(
          successResponse("Get Terms & conditions", data, RESPONSE_CODES.GET)
        );

    } catch (error) {
      console.error(error);
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

  /** enable calendar syncing */
  async enableCalendarSync(req, res) {
    try {
      const { body, user } = req;
      let data = {};
      if (body.type == 1) {
        data.sync_google_calendar = body.is_enable;
      } else {
        data.sync_outlook_calendar = body.is_enable;
      }
      await this.services.updateUser(data, user.id)
      return res
        .status(200)
        .send(
          successResponse(body.is_enable == CALENDAR_SYNC.TRUE ? AuthMessages.CALENDAR_SYNC_SUCCESS:AuthMessages.CALENDAR_UNSYNC_SUCCESS, {}, RESPONSE_CODES.POST)
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

  async outlookCalendarRedirect(req, res) {
    try {
      const code = req.query.code;
      const state = req.query.state;
      if (!code) {
        return res.status(400).send("Authorization code not found.");
      }
      if (!state) {
        return res.status(400).json({ error: 'State is required' });
      }
      var decodeDataBase64 = crypto.enc.Hex.parse(state).toString(crypto.enc.Base64);
      var bytes = crypto.AES.decrypt(decodeDataBase64, key);
      var decryptedData = bytes.toString(crypto.enc.Utf8);
      var decodedObject = JSON.parse(decryptedData);
      const userId = decodedObject.userId;
      const redirectType = decodedObject.type;

      const tokenResponse = await axios.request({
        method: "post",
        url: `https://login.microsoftonline.com/consumers/oauth2/v2.0/token`,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        data: {
          client_id: process.env.AZURE_CLIENT_ID,
          client_secret: process.env.AZURE_CLIENT_SECRET,
          code: code,
          redirect_uri: process.env.AZURE_REDIRECT_URI,
          grant_type: "authorization_code",
        }
      })


      if (tokenResponse && tokenResponse.status == 200) {
        const refreshToken = tokenResponse.data.refresh_token;
        let outlookAuthConfig = {
          outlook_auth_token: refreshToken
        }
        await this.services.updateUser(outlookAuthConfig, userId)
        if (redirectType == 1) {
          const getUserUuid = await this.services.findUserDetailById(userId);
          res.redirect(`${process.env.BASE_URL}integration?ci=${getUserUuid.uuid}`);
        } else {
          res.redirect(`${process.env.BASE_URL}integration`);
        }
      }
   

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
  }



  /** slack Calendar Sync */
  async getslackCalendarSync(req, res) {
    try {
      const { user ,query} = req;
      let getCalendarSync = await this.Models.Users.findOne({
        where: {
          id: user.id,
          deleted_at: null
        },
        raw: true
      });
      const userId = user.id;
      let slackSyncedProjects
      if (user.role_id == ROLES.CLIENT) {
       slackSyncedProjects = await this.services.getProjectsForSlackIntegration(user.id)
        
      } else {
        slackSyncedProjects = []
      }
      slackSyncedProjects.forEach((obj)=>{
        let decodeData = {
          userId: userId,
          type: (query.type == 1) ? 1 : 0,
          project_id:obj.id
        };
        decodeData = JSON.stringify(decodeData);
        let decodeDataToString = crypto.AES.encrypt(decodeData, key).toString();
        decodeDataToString = crypto.enc.Base64.parse(decodeDataToString);
        decodeDataToString = decodeDataToString.toString(crypto.enc.Hex);
         const slackConfigUri=`https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=incoming-webhook&user_scope=&redirect_uri=${process.env.SLACK_REDIRECT_URI}&state=${decodeDataToString}`
         obj.slackConfigUri =obj.is_slack_sync ? slackConfigUri: null
         obj.types_of_slack_notification  = obj.types_of_slack_notification ?obj.types_of_slack_notification.split(","):[]
        //  delete obj.id
      })  
      let syncData = {
        slackSyncedProjects,
        is_google_calendar_sync: getCalendarSync.google_auth_token ? 1 : 0,
        is_google_calendar_enable: getCalendarSync.sync_google_calendar,
        is_outlook_calendar_sync: getCalendarSync.outlook_auth_token ? 1 : 0,
        is_outlook_calendar_enable: getCalendarSync.sync_outlook_calendar,
      }

      return res
        .status(200)
        .send(
          successResponse(AuthMessages.GET_DATA, syncData, RESPONSE_CODES.GET)
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
  }

  async authOutlook(req, res) {
    try {
      const { user, query } = req;
      const userId = user.id;
      let decodeData = {
        userId: userId,
        type: (query.type == 1) ? 1 : 0,
      };

      decodeData = JSON.stringify(decodeData);
      var decodeDataToString = crypto.AES.encrypt(decodeData, key).toString();
      decodeDataToString = crypto.enc.Base64.parse(decodeDataToString);
      decodeDataToString = decodeDataToString.toString(crypto.enc.Hex);

      const authUrl = `https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?client_id=${process.env.AZURE_CLIENT_ID}&response_type=code&redirect_uri=${process.env.AZURE_REDIRECT_URI}&response_mode=query&scope=offline_access%20User.Read%20Mail.Read%20Calendars.Read%20Calendars.ReadWrite&state=${decodeDataToString}`
      let integrationLink = {
        url: authUrl
      };
      return res
        .status(200)
        .send(
          successResponse(AuthMessages.GET_DATA, integrationLink, RESPONSE_CODES.GET)
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

  }

  async validateJwtToken(req,res){
    try {
      const {user}= req
      let userData= {
        email:user.email,
        first_name:user.first_name,
        last_name:user.last_name
      }

      return res
      .status(200)
      .send(
        successResponse(AuthMessages.GET_DATA, userData, RESPONSE_CODES.GET)
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
   
  }

  async removeCalendarSync(req,res){
    try {
      const { body, user } = req;
      let data = {};
      if (body.type == 1) {
        data = {
          ...data,
          google_auth_token:null,
          sync_google_calendar:0
        }
      } else if(body.type == 2){
        data = {
          ...data,
          sync_outlook_calendar:0,
          outlook_auth_token:null
        }
      }else if(body.type == 3){
        data = {
          ...data,
          slack_notification_url:null,
          slack_channel_name:null,
          slack_configuration_url:null,
          types_of_slack_notification:null
        }
      }
      if (body.type == 3) {
        await this.services.updateProject(data, body.project_id)
      } else {
        await this.services.updateUser(data, user.id)
      }
      return res
      .status(200)
      .send(
        successResponse(AuthMessages.UPDATE_INFO , {}, RESPONSE_CODES.POST)
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
  }

}
