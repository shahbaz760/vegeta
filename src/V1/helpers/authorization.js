import { RESPONSE_CODES, ROLES, USER_STATUS, AGENT_PROFILE_COMPLETE_STATUS } from "../../../config/constants";
import { CommonMessages } from "../../../constants/message/common.js";
import { verifyToken, refreshToken } from "./jwt";
import sequelize from 'sequelize';
import moment from "moment";
// import DB from './db'
// let database = new DB();
import {errorResponse} from "../../../config/responseHelper.js"

export default class Authorization {
  async init(db) {
    this.Models = db.models;
  }

  // module.exports = authorize
  async authorize(roles = []) {
    return [
      async (req, res, next) => {
        /** Decode JWT Token */
        const decoded = verifyToken(req.headers.authorization);
        req.decoded = decoded;
        if (decoded === "jwt expired" || !req.headers.authorization) {
          return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
            status: 0,
            code: RESPONSE_CODES.UNAUTHORIZED,
            message: CommonMessages.UNAUTHORIZED_USER,
            data: null,
          });
        }
        /** Check user authorization */
        if(decoded == "invalid jwt"){
          return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
            status: 0,
            code: RESPONSE_CODES.UNAUTHORIZED,
            message: CommonMessages.UNAUTHORIZED_USER,
            data: null,
          });
        }
        if (decoded != "invalid signature") {
          /** check user exist or not */
          const user = await this.Models.Users.findOne({
            where: { 
              email: decoded.email,
              deleted_at: null
            },
            raw: true,
          });

          if(user && user.role_id != ROLES.AGENT) {
            if(user && user.status  == USER_STATUS.INACTIVE) {
              return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
                status: 0,
                code: RESPONSE_CODES.UNAUTHORIZED,
                message: CommonMessages.UNAUTHORIZED_USER,
                data: null,
              });
            }
          }

          if(user && user.role_id == ROLES.AGENT && user.	is_complete_profile == AGENT_PROFILE_COMPLETE_STATUS.APPROVE) {
            if(user && user.status  == USER_STATUS.INACTIVE) {
              return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
                status: 0,
                code: RESPONSE_CODES.UNAUTHORIZED,
                message: CommonMessages.UNAUTHORIZED_USER,
                data: null,
              });
            }
          }

          const checkUserDevices = await this.Models.UserLoginTime.findOne({
            where: {
              login_time: decoded.login_time,
            },
            raw: true,
          });
          if (!user || !checkUserDevices) {
          // if (!user) {
            return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
              status: 0,
              code: RESPONSE_CODES.UNAUTHORIZED,
              message: CommonMessages.UNAUTHORIZED_USER,
              data: null,
            });
          }
        
             /** Check user authorization */
        if (roles.includes(decoded.role_id)) {
          /** check user exist or not */

          const user = await this.Models.Users.findOne({
             where: { 
              email: decoded.email, 
              role_id: decoded.role_id,
              deleted_at: null
            }, 
            raw: true
          });
          if (!user) {
            return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
              status: 0,
              code: RESPONSE_CODES.UNAUTHORIZED,
              message: CommonMessages.UNAUTHORIZED_USER,
              data: null,
            });
          }

          if(user && user.role_id != ROLES.AGENT) {
            if(user && user.status  == USER_STATUS.INACTIVE) {
              return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
                status: 0,
                code: RESPONSE_CODES.UNAUTHORIZED,
                message: CommonMessages.UNAUTHORIZED_USER,
                data: null,
              });
            }
          }

          if(user && user.role_id == ROLES.AGENT && user.	is_complete_profile == AGENT_PROFILE_COMPLETE_STATUS.APPROVE) {
            if(user && user.status  == USER_STATUS.INACTIVE) {
              return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
                status: 0,
                code: RESPONSE_CODES.UNAUTHORIZED,
                message: CommonMessages.UNAUTHORIZED_USER,
                data: null,
              });
            }
          }

          // if(user.role_id == ROLES.CLIENT && decoded.is_admin == false){
          if(user.role_id == ROLES.CLIENT){
            let getUserDetail =  await this.Models.Users.findOne({
              attributes: ["id", "role_id", "first_name", "last_name","email", "user_image", "social_id", "social_type", "deleted_at", "address", "is_verified", "status", "createdAt", "updatedAt", [sequelize.literal("LOWER((SELECT name FROM roles WHERE roles.id = users.role_id limit 1))"), "role"],[sequelize.literal(`
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
              ELSE 0 END `), "is_subscription"],[sequelize.literal(`
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
                      AND client_subscriptions.status = 2
                      AND client_subscriptions.is_signed_docusign = 1 
                      LIMIT 1) > 0 THEN 'Pending'
                WHEN (SELECT COUNT(*) FROM client_subscriptions 
                      WHERE client_subscriptions.client_id = users.id 
                      AND deleted_at IS NULL 
                      AND client_subscriptions.status = 0 
                      AND client_subscriptions.is_signed_docusign = 0 
                      LIMIT 1) > 0 THEN 'Pending'
                WHEN (SELECT COUNT(*) FROM client_subscriptions 
                      WHERE client_subscriptions.client_id = users.id 
                      AND deleted_at IS NULL 
                      AND client_subscriptions.status = 3
                      AND client_subscriptions.is_signed_docusign = 0 
                      AND client_subscriptions.created_at < CURRENT_DATE 
                      LIMIT 1) > 0 THEN 'Suspended'
                WHEN (SELECT COUNT(*) FROM client_subscriptions 
                      WHERE client_subscriptions.client_id = users.id 
                      AND deleted_at IS NULL 
                      AND client_subscriptions.status = 5
                      AND client_subscriptions.is_signed_docusign = 1 
                      LIMIT 1) > 0 THEN 'Active'
                WHEN (SELECT COUNT(*) FROM client_subscriptions 
                    WHERE client_subscriptions.client_id = users.id 
                    AND deleted_at IS NULL 
                    AND client_subscriptions.status = 4 
                    AND client_subscriptions.is_signed_docusign = 1
                    LIMIT 1) > 0 THEN 'Pending'
                ELSE 'Pending'
              END
            `), 'subcription_status'],[sequelize.literal("(SELECT subscription_link FROM client_subscriptions WHERE client_subscriptions.client_id = users.id AND client_subscriptions.status = 0 limit 1)"), "subscription_link"], [sequelize.literal("(SELECT id FROM client_subscriptions WHERE client_subscriptions.client_id = users.id AND client_subscriptions.status = 0 limit 1)"), "pending_subscription_id"]],
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
                  attributes: ["id","user_id","name"],
                  as: "projects",
                  where: { 
                    deleted_at: null,
                  },
                  required: false,
                },
              ],
              where: {
                id: user.id,
                deleted_at: null,
                status:USER_STATUS.ACTIVE,
              },
            });

          if(getUserDetail){
            getUserDetail = getUserDetail.toJSON();

            if(getUserDetail.pending_subscription_id) {
              const pendingSubPayload = {
                subscription_id: getUserDetail.pending_subscription_id,
                client_id: getUserDetail.id,
                payment_status: "pending"
              }
              const subscriptionToken = refreshToken(pendingSubPayload);
              getUserDetail.subscription_link = `${process.env.BASE_URL}payment-method/${subscriptionToken}`;
            }

            if(getUserDetail.is_signed == 0){

              let finalUserDetail = getUserDetail;
              if(finalUserDetail && finalUserDetail.projects.length > 0) {
                delete finalUserDetail.projects;
                 finalUserDetail.projects = true;
              }else {
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
                user: clientResponse
              };
              const loginTime = moment(new Date()).unix();
              let createData = { 
                user_id: getUserDetail.id, 
                login_time: loginTime ,
              };

              await this.Models.UserLoginTime.create(createData);
              const token = refreshToken(payload);
              const finalUserData = {
                access_token: token,
                user: finalUserDetail,
              };
              return res.status(RESPONSE_CODES.GET).json({
                status: 1,
                code: RESPONSE_CODES.ONVERIFICATION,
                message: CommonMessages.NO_SIGN_DOCUMENT,
                data: finalUserData,
              });
            }
          }
        }
        req.user = user;
          /** return user */
         return next();
          } else {
            return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
              status: 0,
              code: RESPONSE_CODES.UNAUTHORIZED,
              message: CommonMessages.UNAUTHORIZED_USER,
              data: null,
            });
          }
    
        }
     
      },
    ];
  };



  async authorizeForDocusign(roles = []) {
    return [
      async (req, res, next) => {
        /** Decode JWT Token */
        const decoded = verifyToken(req.headers.authorization);
        req.decoded = decoded;
        if (decoded === "jwt expired" || !req.headers.authorization) {
          return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
            status: 0,
            code: RESPONSE_CODES.UNAUTHORIZED,
            message: CommonMessages.UNAUTHORIZED_USER,
            data: null,
          });
        }
        /** Check user authorization */
        if(decoded == "invalid jwt"){
          return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
            status: 0,
            code: RESPONSE_CODES.UNAUTHORIZED,
            message: CommonMessages.UNAUTHORIZED_USER,
            data: null,
          });
        }
        if (decoded != "invalid signature") {
          /** check user exist or not */
          const user = await this.Models.Users.findOne({
            where: { 
              email: decoded.email,
              deleted_at: null
            },
            raw: true,
          });

          if(user && user.role_id != ROLES.AGENT) {
            if(user && user.status  == USER_STATUS.INACTIVE) {
              return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
                status: 0,
                code: RESPONSE_CODES.UNAUTHORIZED,
                message: CommonMessages.UNAUTHORIZED_USER,
                data: null,
              });
            }
          }


          if(user && user.role_id == ROLES.AGENT && user.	is_complete_profile == AGENT_PROFILE_COMPLETE_STATUS.APPROVE) {
            if(user && user.status  == USER_STATUS.INACTIVE) {
              return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
                status: 0,
                code: RESPONSE_CODES.UNAUTHORIZED,
                message: CommonMessages.UNAUTHORIZED_USER,
                data: null,
              });
            }
          }

          const checkUserDevices = await this.Models.UserLoginTime.findOne({
            where: {
              login_time: decoded.login_time,
            },
            raw: true,
          });
          if (!user || !checkUserDevices) {
          // if (!user) {
            return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
              status: 0,
              code: RESPONSE_CODES.UNAUTHORIZED,
              message: CommonMessages.UNAUTHORIZED_USER,
              data: null,
            });
          }
        
             /** Check user authorization */
        if (roles.includes(decoded.role_id)) {
          /** check user exist or not */

          const user = await this.Models.Users.findOne({
             where: { 
              email: decoded.email, 
              role_id: decoded.role_id,
              deleted_at: null
            }, 
            raw: true
          });
          if (!user) {
            return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
              status: 0,
              code: RESPONSE_CODES.UNAUTHORIZED,
              message: CommonMessages.UNAUTHORIZED_USER,
              data: null,
            });
          }

          if(user && user.role_id != ROLES.AGENT) {
            if(user && user.status  == USER_STATUS.INACTIVE) {
              return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
                status: 0,
                code: RESPONSE_CODES.UNAUTHORIZED,
                message: CommonMessages.UNAUTHORIZED_USER,
                data: null,
              });
            }
          }

         req.user = user;
          /** return user */
         return next();
          } else {
            return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
              status: 0,
              code: RESPONSE_CODES.UNAUTHORIZED,
              message: CommonMessages.UNAUTHORIZED_USER,
              data: null,
            });
          }
        }
     
      },
    ];
  }

  async authorizeWithSecretKey() {
    return  async (req, res, next) => {
      let {headers} = req;
        if (!headers.secretkey || headers.secretkey !== process.env.PUBLIC_API_SECRET_KEY) {
          return res.status(RESPONSE_CODES.GET).send(errorResponse(!headers.secretkey ? CommonMessages.PROVIDE_SECRET_KEY : CommonMessages.SECRET_KEY, null, RESPONSE_CODES.BAD_REQUEST));
        }
        return next()
      }
    }
}
