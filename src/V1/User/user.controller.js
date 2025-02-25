require("dotenv").config();
import Services from "./user.services";
import { RESPONSE_CODES, ROLES, COMETCHATROLES } from "../../../config/constants.js";
import {
  successResponse,
  errorResponse,
} from "../../../config/responseHelper.js";
import { CommonMessages } from "../../../constants/message/common";
import { UserMessages } from "../../../constants/message/user";
import nodemailer from "../helpers/mail";
import randomstring from "randomstring";
import moment from "moment";
import { generateHash } from "../helpers/jwt";

import {
  uploadFileForAll,
  s3RemoveSingleFile,
  createCometChatUser,
  updateCometChatUser,
  deleteCometChatUser,
  deleteUserAndItsRecords
} from "../helpers/commonFunction.js"

import { updateLoginDetails } from "../EmailTemplates/update_login_detail.js";

import { loginDetails } from "../EmailTemplates/login_detail.js";

import bcrypt from "bcrypt";
import { saltRounds } from "../../../config/keys.js";
import sequelize from "sequelize";
const Op = sequelize.Op;

import { subscriptionOverdue } from "../EmailTemplates/subscription_overdue.js"
import { subscriptionReminderBeforeOverdue } from "../EmailTemplates/subscription_reminder_before_overdue.js"
import { cardExpiryReminder } from "../EmailTemplates/card_expiry_reminder.js"
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Bull = require('bull');

import DB from "../helpers/db";

// Create a new Bull queue for reminders
const paymentOverdueRetryQueue = new Bull('paymentOverdueRetryQueue', {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
  }
});

paymentOverdueRetryQueue.process(async (job) => {
  const { payment_intent_id, subscription_id, user_id } = job.data;
  try{
    const dbObj = new DB();
    await dbObj.init();
    const db = await dbObj.getDB();

    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    const customer = await stripe.customers.retrieve(paymentIntent.customer);

    let getDefaultPaymentMethod = await db.models.Cards.findOne({
      attributes: ["id", "payment_method_id", "subscription_id", "is_default", "deleted_at"],
      where: {
        subscription_id: subscription_id,
        is_default: 1,
        deleted_at: null
      },
      raw: true
    });

    let paymentMethodId = customer.invoice_settings.default_payment_method;
    if(getDefaultPaymentMethod) {
      paymentMethodId = getDefaultPaymentMethod.payment_method_id;
    }

    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: paymentIntent.customer,
    });
 
    const paymentIntentResult = await stripe.paymentIntents.confirm(paymentIntent.id, {
      payment_method: paymentMethodId,
    });

    if (paymentIntentResult.status === 'succeeded') {
      console.log('Payment retried and succeeded.');
      await db.models.ClientSubscriptions.update({status: 1}, {
        where: {
          id: subscription_id
        }
      });
      await db.models.Users.update({status: 1}, {
        where: {
          id: user_id
        }
      });
    } else {
      console.log('Payment retry failed.');
      // return false;
    }
  }catch (error) {
    console.log(error, "error");
  }

});

paymentOverdueRetryQueue.on('completed', (job) => {
  console.log(`Payment Overdue Retry job completed with result: ${job}`);
});

paymentOverdueRetryQueue.on('failed', (job) => {
  console.log(`Payment Overdue Retry job failed with result: ${job}`);
});


export default class User {
  async init(db) {
    this.services = new Services();
    this.Models = db.models;
    await this.services.init(db);
  }

  /* add user */
  async addUser(req, res) {
    try {

      const { body,user, files } = req;
      body.role_id = ROLES.USER
      body.status = 1
      body.added_by = user.id;
      body.added_by_user = user.id;
 
      if(user.role_id == ROLES.CLIENT) {
        body.added_by = user.id;
      }else if(user.role_id == ROLES.USER) {
        body.added_by = user.added_by;
      }

      if (!body.first_name) {
        let msg = "first name is required";
        return this.services.errorFunction(req, res, msg);
      }

      if (!body.last_name) {
        let msg = "last name is required";
        return this.services.errorFunction(req, res, msg);
      }

      if (!body.email) {
        let msg = "email is required";
        return await this.services.errorFunction(req, res, msg);
      }
      body.email = body.email.toLowerCase();

      if (!body.password) {
        let msg = "password is required";
        return await this.services.errorFunction(req, res, msg);
      }

      // if (!body.user_role) {
      //   let msg = "User Role is required";
      //   return this.services.errorFunction(req, res, msg);
      // }

      if (!body.role_permission_id) {
        let msg = "Role permission id is required";
        return this.services.errorFunction(req, res, msg);
      }

      /** check email exist or not */
      const checkEmail = await this.services.getUserByMail(body.email);
      if (checkEmail) {
        return res
          .status(400)
          .send(
            errorResponse(
              UserMessages.USER_ALREADY_EXIST,
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
      }

      const userData = await this.services.createUser(body);
      if (files && files.length > 0) {
        let sendData = {
          files,
          id: userData.id,
          folder: 'Users'
        }

        const uploadedImage = await uploadFileForAll(sendData);

        if (uploadedImage.length > 0) {
          body.user_image = uploadedImage[0].file_key
        }
      }
      const userImg = {
        user_image: body.user_image
      }

      await this.services.updateUser(userImg, userData.id)

      const loginCredentials = {
        email : body.email,
        password : body.password
      }

      await createCometChatUser(
        body.first_name + " " + body.last_name,
        userData.id,
        COMETCHATROLES[ROLES.USER - 1],
        body.email,
        body.phone_number
      )
        .then((res) => res.json())
        .then(async (json) => {
          console.log("Client created...", json);
          await this.services.updateUser(
            { cometUserCreated: 1 },
            userData.id
          );
        })
        .catch((err) => console.error("error in creating Client:" + err));

      let message = UserMessages.LOGIN_CREDENTIALS_SENT;
        
        const to = body.email.toLowerCase();

        const emailTemplate = await loginDetails(loginCredentials)
        const subject = "User Log in credentials";
        let mailFunction = (process.env.PRODUCTION == true || process.env.PRODUCTION == "true") ? nodemailer.sendinBlueMail : nodemailer.sendMail;
        await mailFunction(to, subject, emailTemplate);


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
      console.log("====error===", error)
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

  /* user's list */
  async getUserDetail(req, res) {
    try {
      const { params } = req;
      const details = await this.services.getUserDetails(params.user_id);
      return res
        .status(200)
        .send(
          successResponse(UserMessages.USER_DETAILS, details, RESPONSE_CODES.GET)
        );
    } catch (error) {
      console.log("====error===", error)
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

  async deleteUserDetail(req, res) {
    try {
      const { params } = req
      const getUser = await this.services.getUserDetails(params.user_id);
      if (!getUser) {
        return res
          .status(404)
          .send(
            errorResponse(
              UserMessages.USER_NOT_FOUND,
              null,
              RESPONSE_CODES.NOT_FOUND
            )
          );
      }
      const updateData = {
        deleted_at: moment(new Date()).unix(),
      };

      await deleteUserAndItsRecords(updateData, params.user_id, this.Models);
      if(getUser.user_image) {
        await s3RemoveSingleFile(getUser.user_image);
      }
      return res
        .status(200)
        .send(
          successResponse(UserMessages.DELETE_USER, {}, RESPONSE_CODES.DELETE)
        );
    } catch (error) {
      console.log(error, "====error====");
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


  async listUser(req, res) {
    try {
      const { body, user } = req;
      let userId = user.id;
      if(user.role_id == ROLES.USER) {
        userId = user.added_by;
      }
      const getList = await this.services.getUsersList(body, userId, user);
      return res
        .status(200)
        .send(
          successResponse(UserMessages.DELETE_USER, getList, RESPONSE_CODES.POST)
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
  }

  async editUser(req, res) {
    try {
      const { body, files } = req;

      if (!body.user_id) {
        let msg = "User id is required";
        return this.services.errorFunction(req, res, msg);
      }

      // if (!body.user_role) {
      //   let msg = "User role is required";
      //   return this.services.errorFunction(req, res, msg);
      // }

      if (!body.role_permission_id) {
        let msg = "Role permission id is required";
        return this.services.errorFunction(req, res, msg);
      }

      /** check user role exist or not */
      // const checkUserRole = await this.services.getUserRoleByRoleId(body.user_role);
      // if (!checkUserRole) {
      //   return res
      //     .status(400)
      //     .send(
      //       errorResponse(
      //         UserMessages.USER_ROLE_NOT_FOUND,
      //         null,
      //         RESPONSE_CODES.BAD_REQUEST
      //       )
      //     );
      // }

      const getUser = await this.services.getUserDetails(body.user_id);
      if(body.password && (body.password != "" || body.password != null)) {
        const passwordMatch = await bcrypt.compare(
          body.password,
          getUser.password
        );
        if (passwordMatch) {
          return res
            .status(400)
            .send(
              errorResponse(
                UserMessages.USER_OLD_PASSWORD_MATCH,
                null,
                RESPONSE_CODES.BAD_REQUEST
              )
            );
        }
        const loginCredentials = {
          email : getUser.email,
          password : body.password
        }
        const to = getUser.email.toLowerCase();
        const emailTemplate = await updateLoginDetails(loginCredentials)
        const subject = "Password updated";
        let mailFunction = (process.env.PRODUCTION == true || process.env.PRODUCTION == "true") ? nodemailer.sendinBlueMail : nodemailer.sendMail;
        await mailFunction(to, subject, emailTemplate);
      }


      if (files && files.length > 0) {
        let sendData = {
          files,
          id: body.user_id,
          folder: 'Users'
        }
        const uploadedImage = await uploadFileForAll(sendData);
        if (uploadedImage.length > 0) {
          body.user_image = uploadedImage[0].file_key
        }
      }

      let userUpdateDetail = {
        first_name: body.first_name,
        last_name: body.last_name,
        role_permission_id: body.role_permission_id,
        user_image: body.user_image,
      }

      if(body.password && (body.password != "" || body.password != null)) {
        userUpdateDetail.password = body.password;
      }

      await this.services.updateUser(userUpdateDetail, body.user_id)

      await updateCometChatUser(body.user_id, {
        name: body.first_name ? body.first_name + " " + body.last_name : getUser.first_name + " " + getUser.last_name,
        avatar: body.user_image ? process.env.BASE_IMAGE_URL + body.user_image : getUser.user_image,
        metadata: {
          "@private": {
            contactNumber: body.phone_number ? body.phone_number : getUser.phone_number,
          },
        }
      });

      const getUpdatedUser = await this.services.getUserDetails(body.user_id)
      return res
        .status(200)
        .send(
          successResponse(UserMessages.USER_UPDATED, getUpdatedUser, RESPONSE_CODES.PUT)
        );
    } catch (error) {
      console.log(error, "====error====");
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


  /** subscription setting updation  */
  async subscriptionSettingCron(req, res) {
    try {

      let getSubscriptionSetting = await this.Models.SubscriptionSettings.findOne({
        where: {
          deleted_at: null
        },
        raw: true,
      });

      /** Overdue status change */
      const startOfDayToOverdue = moment(new Date()).startOf('day').unix();
      const endOfDayToOverdue = moment(new Date()).endOf('day').unix();
      let findSubscriptionsForSuspend = await this.Models.ClientSubscriptions.findAll({
        attributes: ["id", "client_id", "title", "overdue_at", "status", [sequelize.literal("(SELECT email FROM users WHERE users.id = client_subscriptions.client_id)"), "email"],[sequelize.literal("(SELECT first_name FROM users WHERE users.id = client_subscriptions.client_id)"), "first_name"], [sequelize.literal("(SELECT last_name FROM users WHERE users.id = client_subscriptions.client_id)"), "last_name"]],
        having: {
          status: 1,
          overdue_at: {
            [Op.between]: [startOfDayToOverdue, endOfDayToOverdue],
          }
        },
        raw: true,
      });

      if(findSubscriptionsForSuspend.length > 0) {

        for(let i in findSubscriptionsForSuspend) {
          await this.Models.ClientSubscriptions.update({
            status: 5,
          },{
            where: {
              id: findSubscriptionsForSuspend[i].id,
            }
          });

          let to = findSubscriptionsForSuspend[i].email;
          let emailTemplate = await subscriptionOverdue(findSubscriptionsForSuspend[i])
          let subject = "Subscription Overdue.";
          let mailFunction = (process.env.PRODUCTION == true || process.env.PRODUCTION == "true") ? nodemailer.sendinBlueMail : nodemailer.sendMail;
          await mailFunction(to, subject, emailTemplate);
        }
      }
  
      /** suspend status update */
      if(getSubscriptionSetting && getSubscriptionSetting.suspend_period_days !="" && getSubscriptionSetting.suspend_period_days !="0") {
  
        const startOfDay = moment(new Date()).startOf('day').unix();
        const endOfDay = moment(new Date()).endOf('day').unix();
  
        let findSubscriptionsForSuspend = await this.Models.ClientSubscriptions.findAll({
          attributes: ["id", "client_id", "title", "overdue_at", "suspend_at", "status"],
          having: {
            status: 5,
            suspend_at: {
              [Op.between]: [startOfDay, endOfDay],
            }
          },
          raw: true,
        });

        if(findSubscriptionsForSuspend.length > 0) {
  
          for(let i in findSubscriptionsForSuspend) {
            await this.Models.ClientSubscriptions.update({
              status: 6,
            },{
              where: {
                id: findSubscriptionsForSuspend[i].id,
              }
            });
  
            let getUserSubscriptionCount = await this.Models.ClientSubscriptions.count({
              attributes: ["id", "client_id", "status"],
              where: {
                client_id: findSubscriptionsForSuspend[i].client_id,
                status: 1
              },
              raw: true,
            });
  
            if(getUserSubscriptionCount == 0) {
  
              await this.Models.Users.update({
                status: 2,
              },{
                where: {
                  id: findSubscriptionsForSuspend[i].client_id,
                }
              });
  
            }
  
          }
        }
      }
  
      /** Send Reminder email of subscriptions are due date is near as per setting days */
      if(getSubscriptionSetting && getSubscriptionSetting.automatic_reminder_email_days !="" && getSubscriptionSetting.automatic_reminder_email_days !="0") {
        let getReminderDays = getSubscriptionSetting.automatic_reminder_email_days.split(',').map(Number);
        let makeSubReminder = [];
        let whereConditionReminder =  {
          deleted_at: null,
          status: 1,
          billing_frequency: {
            [Op.ne]: 1
          }
        };

        let havingConditionReminder =  {};

        if(getReminderDays.length > 0) {
          for(let i in getReminderDays) {
            let getStartDate = moment(new Date ()).add(getReminderDays[i], 'days').startOf('day').unix();
            let getEndDate = moment(new Date ()).add(getReminderDays[i], 'days').endOf('day').unix();
            makeSubReminder.push({
              [Op.between]: [getStartDate, getEndDate]
            });
          }
        }

        if(makeSubReminder.length > 1) {
          havingConditionReminder = {
            end_date_unix: {
              [Op.or]: makeSubReminder
            },
          }
        }else if (makeSubReminder.length == 1) {
          havingConditionReminder = {
            end_date_unix: makeSubReminder[0],
          }
        }
  
        let getSubscriptionReminder = await this.Models.ClientSubscriptions.findAll({
          attributes: ["id", "title", "client_id", "deleted_at", "status", "start_date", "total_price", "billing_frequency", 
            [sequelize.literal("(SELECT first_name FROM users WHERE users.id = client_id LIMIT 1)"), "first_name"], [sequelize.literal("(SELECT last_name FROM users WHERE users.id = client_id LIMIT 1)"), "last_name"],
            [sequelize.literal("(SELECT email FROM users WHERE users.id = client_id LIMIT 1)"), "email"],
            [sequelize.literal(`
              CASE 
                WHEN billing_frequency = 2 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(start_date), INTERVAL 1 MONTH), '%M %e, %Y')
                WHEN billing_frequency = 3 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(start_date), INTERVAL 3 MONTH), '%M %e, %Y')
                WHEN billing_frequency = 4 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(start_date), INTERVAL 6 MONTH), '%M %e, %Y')
                WHEN billing_frequency = 5 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(start_date), INTERVAL 1 YEAR), '%M %e, %Y')
                WHEN billing_frequency = 6 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(start_date), INTERVAL 7 DAY), '%M %e, %Y')
                WHEN billing_frequency = 7 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(start_date), INTERVAL 28 DAY), '%M %e, %Y')
                ELSE null END`), "end_date"],
            [sequelize.literal(`
            CASE 
              WHEN billing_frequency = 2 THEN UNIX_TIMESTAMP(DATE_ADD(FROM_UNIXTIME(start_date), INTERVAL 1 MONTH))
              WHEN billing_frequency = 3 THEN UNIX_TIMESTAMP(DATE_ADD(FROM_UNIXTIME(start_date), INTERVAL 3 MONTH))
              WHEN billing_frequency = 4 THEN UNIX_TIMESTAMP(DATE_ADD(FROM_UNIXTIME(start_date), INTERVAL 6 MONTH))
              WHEN billing_frequency = 5 THEN UNIX_TIMESTAMP(DATE_ADD(FROM_UNIXTIME(start_date), INTERVAL 1 YEAR))
              WHEN billing_frequency = 6 THEN UNIX_TIMESTAMP(DATE_ADD(FROM_UNIXTIME(start_date), INTERVAL 7 DAY))
              WHEN billing_frequency = 7 THEN UNIX_TIMESTAMP(DATE_ADD(FROM_UNIXTIME(start_date), INTERVAL 28 DAY))
              ELSE null
            END
          `), "end_date_unix"]],
          where: whereConditionReminder,
          having: havingConditionReminder,
          raw: true,
          order: [["id", "DESC"]]
        });
  
        if(getSubscriptionReminder.length > 0) {
  
          for(let i in getSubscriptionReminder) {
          
            const to = getSubscriptionReminder[i].email;
            let emailTemplate = await subscriptionReminderBeforeOverdue(getSubscriptionReminder[i])
            let subject = "Reminder Email: Subscription Due Date is Near.";
            let mailFunction = (process.env.PRODUCTION == true || process.env.PRODUCTION == "true") ? nodemailer.sendinBlueMail : nodemailer.sendMail;
            await mailFunction(to, subject, emailTemplate);
  
          }
        }
      }
  
      /** Send Reminder email of subscriptions are due date is over due as per setting days */
      if(getSubscriptionSetting && getSubscriptionSetting.overdue_reminder_email_days !="" && getSubscriptionSetting.overdue_reminder_email_days !="0") {
        let getOverdueReminderDays = getSubscriptionSetting.overdue_reminder_email_days.split(',').map(Number);
        let makeSubOverdueReminder = [];
        let whereConditionOverdueReminder =  {
          deleted_at: null,
          status: 5,
          billing_frequency: {
            [Op.ne]: 1
          }
        };

        let havingConditionOverdueReminder =  {};

        if(getOverdueReminderDays.length > 0) {
          for(let i in getOverdueReminderDays) {
            let getStartDate = moment(new Date ()).subtract(getOverdueReminderDays[i], 'days').startOf('day').unix();
            let getEndDate = moment(new Date ()).subtract(getOverdueReminderDays[i], 'days').endOf('day').unix();
            makeSubOverdueReminder.push({
              [Op.between]: [getStartDate, getEndDate]
            });
          }
        }

        if(makeSubOverdueReminder.length > 1) {
          havingConditionOverdueReminder = {
            overdue_at: {
              [Op.or]: makeSubOverdueReminder
            },
          }
        }else if (makeSubOverdueReminder.length == 1) {
          havingConditionOverdueReminder = {
            overdue_at: makeSubOverdueReminder[0],
          }
        }
  
        let getOverdueSubscriptionReminder = await this.Models.ClientSubscriptions.findAll({
          attributes: ["id", "title", "client_id", "deleted_at", "status", "start_date", "total_price", "billing_frequency", "overdue_at",
            [sequelize.literal("(SELECT first_name FROM users WHERE users.id = client_id LIMIT 1)"), "first_name"], [sequelize.literal("(SELECT last_name FROM users WHERE users.id = client_id LIMIT 1)"), "last_name"],
            [sequelize.literal("(SELECT email FROM users WHERE users.id = client_id LIMIT 1)"), "email"],
            [sequelize.literal(`
              CASE 
                WHEN billing_frequency = 2 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(start_date), INTERVAL 1 MONTH), '%M %e, %Y')
                WHEN billing_frequency = 3 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(start_date), INTERVAL 3 MONTH), '%M %e, %Y')
                WHEN billing_frequency = 4 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(start_date), INTERVAL 6 MONTH), '%M %e, %Y')
                WHEN billing_frequency = 5 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(start_date), INTERVAL 1 YEAR), '%M %e, %Y')
                WHEN billing_frequency = 6 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(start_date), INTERVAL 7 DAY), '%M %e, %Y')
                WHEN billing_frequency = 7 THEN DATE_FORMAT(DATE_ADD(FROM_UNIXTIME(start_date), INTERVAL 28 DAY), '%M %e, %Y')
                ELSE null END`), "end_date"],
            [sequelize.literal(`
            CASE 
              WHEN billing_frequency = 2 THEN UNIX_TIMESTAMP(DATE_ADD(FROM_UNIXTIME(start_date), INTERVAL 1 MONTH))
              WHEN billing_frequency = 3 THEN UNIX_TIMESTAMP(DATE_ADD(FROM_UNIXTIME(start_date), INTERVAL 3 MONTH))
              WHEN billing_frequency = 4 THEN UNIX_TIMESTAMP(DATE_ADD(FROM_UNIXTIME(start_date), INTERVAL 6 MONTH))
              WHEN billing_frequency = 5 THEN UNIX_TIMESTAMP(DATE_ADD(FROM_UNIXTIME(start_date), INTERVAL 1 YEAR))
              WHEN billing_frequency = 6 THEN UNIX_TIMESTAMP(DATE_ADD(FROM_UNIXTIME(start_date), INTERVAL 7 DAY))
              WHEN billing_frequency = 7 THEN UNIX_TIMESTAMP(DATE_ADD(FROM_UNIXTIME(start_date), INTERVAL 28 DAY))
              ELSE null
            END
          `), "end_date_unix"]],
          where: whereConditionOverdueReminder,
          having: havingConditionOverdueReminder,
          raw: true,
          order: [["id", "DESC"]]
        });
  
        if(getOverdueSubscriptionReminder.length > 0) {
  
          for(let i in getOverdueSubscriptionReminder) {
          
            const to = getOverdueSubscriptionReminder[i].email;
            let emailTemplate = await subscriptionOverdue(getOverdueSubscriptionReminder[i])
            let subject = "Subscription Overdue: Immediate Attention Required.";
            let mailFunction = (process.env.PRODUCTION == true || process.env.PRODUCTION == "true") ? nodemailer.sendinBlueMail : nodemailer.sendMail;
            await mailFunction(to, subject, emailTemplate);
  
          }
        }
  
      }
  
      /** card expiry reminder emails sent */
      if(getSubscriptionSetting && (getSubscriptionSetting.card_expiry_reminder_email_days !="" && getSubscriptionSetting.card_expiry_reminder_email_days !="0")){
  
          let getEmailReminderDays = getSubscriptionSetting.card_expiry_reminder_email_days.split(',').map(Number);
          let makeExpiry = [];
          let whereConditionCardExpiry =  {
            deleted_at: null,
            type: 0,
            is_default: 1,
          };

          let havingConditionCardExpiry =  {};

          if(getEmailReminderDays.length > 0) {
            for(let i in getEmailReminderDays) {
              let getStartDate = moment(new Date ()).add(getEmailReminderDays[i], 'days').format("DD/MM/YYYY");
              makeExpiry.push({
                [Op.eq]: getStartDate,
              });
            }
          }

          if(makeExpiry.length > 1) {
            havingConditionCardExpiry = {
              expire_date_format: {
                [Op.or]: makeExpiry
              },
            }
          }else if (makeExpiry.length == 1) {
            havingConditionCardExpiry = {
              expire_date_format: makeExpiry[0],
            }
          }
  
        let getExpireSoonCards = await this.Models.Cards.findAll({
          attributes: ["id", "user_id", "expiry_date", "last_digit", "type", "deleted_at", [sequelize.literal("(SELECT first_name FROM users WHERE users.id = user_id LIMIT 1)"), "first_name"], [sequelize.literal("(SELECT last_name FROM users WHERE users.id = user_id LIMIT 1)"), "last_name"], [sequelize.literal("(SELECT email FROM users WHERE users.id = user_id LIMIT 1)"), "email"], [sequelize.literal("DATE_FORMAT(FROM_UNIXTIME(cards.expiry_date), '%m/%Y')"), "expire_date"],[sequelize.literal("DATE_FORMAT(FROM_UNIXTIME(cards.expiry_date), '%d/%m/%Y')"), "expire_date_format"]],
          where: whereConditionCardExpiry,
          having: havingConditionCardExpiry,
          raw: true,
          order: [["id", "DESC"]]
        });

  
        if(getExpireSoonCards.length > 0) {
  
          for(let i in getExpireSoonCards) {
            const to = getExpireSoonCards[i].email;
            let emailTemplate = await cardExpiryReminder(getExpireSoonCards[i])
            let subject = "Update Needed: Your Card is About to Expire.";
            let mailFunction = (process.env.PRODUCTION == true || process.env.PRODUCTION == "true") ? nodemailer.sendinBlueMail : nodemailer.sendMail;
            await mailFunction(to, subject, emailTemplate);
  
          }
        }
      }
  
      /** Automatic Payment Retry in Overdue Status times per day */
  
      if(getSubscriptionSetting && getSubscriptionSetting.payment_retry_overdue_status_days !="" && getSubscriptionSetting.payment_retry_overdue_status_days !="0") {
  
        let getOverduePaymentSubscription = await this.Models.ClientSubscriptions.findAll({
          attributes: ["id", "client_id", "stripe_subscription_id", "billing_frequency", "status", "deleted_at"],
          where: {
            deleted_at: null,
            status: 5,
            billing_frequency: {
              [Op.ne]: 1
            },
            is_manual_payment: 0
          },
          raw: true,
          order: [["id", "DESC"]]
        });

        for(let i in getOverduePaymentSubscription) {
          let subscription = await stripe.subscriptions.retrieve(getOverduePaymentSubscription[i].stripe_subscription_id);
  
          if (subscription.latest_invoice) {
            const invoice = await stripe.invoices.retrieve(subscription.latest_invoice);
      
            if (invoice.status === 'open' && invoice.paid === false) {
              // Attempt to pay the invoice
              let timeZone = "Asia/Calcutta";
              let count = +getSubscriptionSetting.payment_retry_overdue_status_days;
              const startOfDay = new Date(); // 12:00 AM today
              const endOfDay = moment().endOf('day');     // 11:59 PM today
              
              // Calculate the duration of each partition in seconds
              const partitionDuration = endOfDay.diff(startOfDay, 'seconds') / count;
            
              // Generate partition points
              const partitionTimes = [];
              for (let i = 0; i < count; i++) {
                // Calculate the midpoint for each partition
                const partitionTime = moment(startOfDay).add((i + 0.5) * partitionDuration, 'seconds');
                partitionTimes.push(Math.floor(partitionTime.toDate().getTime() / 1000)); // Convert to Unix timestamp in seconds and round down
              }
            
              // return partitionTimes;
  
              for(let j in partitionTimes) {
  
                let now = moment.tz(new Date(), timeZone).toDate().getTime();
                now = now/1000;
                let delay = (parseInt(partitionTimes[j]) - parseInt(now));// Calculate delay in milliseconds
                await paymentOverdueRetryQueue.add({ payment_intent_id: invoice.payment_intent, subscription_id: getOverduePaymentSubscription[i].id, user_id: getOverduePaymentSubscription[i].client_id }, { delay: delay, jobId: parseInt(partitionTimes[j]), attempts: 3 });
                console.log(`Reminder for payment retry ${parseInt(partitionTimes[j])} scheduled with ${delay} ms delay.`);
  
              }
            
            } else {
              console.log('No unpaid invoice found or payment already settled.');
            }
  
          }
        }
  
      }
  
      /** Automatic Payment Retry in Suspended Status  times per day */
      if(getSubscriptionSetting && getSubscriptionSetting.payment_retry_suspended_status_days !="" && getSubscriptionSetting.payment_retry_suspended_status_days !="0") {
  
  
        let getSuspendPaymentSubscription = await this.Models.ClientSubscriptions.findAll({
          attributes: ["id", "client_id", "stripe_subscription_id", "billing_frequency", "status", "deleted_at"],
          where: {
            deleted_at: null,
            status: 6,
            billing_frequency: {
              [Op.ne]: 1
            },
            is_manual_payment: 0
          },
          raw: true,
          order: [["id", "DESC"]]
        });
  
        for(let i in getSuspendPaymentSubscription) {
          let subscription = await stripe.subscriptions.retrieve(getSuspendPaymentSubscription[i].stripe_subscription_id);
  
          if (subscription.latest_invoice) {
            const invoice = await stripe.invoices.retrieve(subscription.latest_invoice);
      
            if (invoice.status === 'open' && invoice.paid === false) {
              // Attempt to pay the invoice
              let timeZone = "Asia/Calcutta";
              let count = +getSubscriptionSetting.payment_retry_suspended_status_days;
              const startOfDay = new Date(); // 12:00 AM today
              const endOfDay = moment().endOf('day');     // 11:59 PM today
              
              // Calculate the duration of each partition in seconds
              const partitionDuration = endOfDay.diff(startOfDay, 'seconds') / count;
              // Generate partition points
              const partitionTimes = [];
              for (let i = 0; i < count; i++) {
                // Calculate the midpoint for each partition
                const partitionTime = moment(startOfDay).add((i + 0.5) * partitionDuration, 'seconds');
                partitionTimes.push(Math.floor(partitionTime.toDate().getTime() / 1000)); // Convert to Unix timestamp in seconds and round down
              }
            
              // return partitionTimes;
              for(let j in partitionTimes) {
  
                let now = moment.tz(new Date(), timeZone).toDate().getTime();
                now = now/1000;
                let delay = (parseInt(partitionTimes[j]) - parseInt(now));// Calculate delay in milliseconds
                
                await paymentOverdueRetryQueue.add({ payment_intent_id: invoice.payment_intent, subscription_id: getSuspendPaymentSubscription[i].id, user_id: getSuspendPaymentSubscription[i].client_id }, { delay: delay, jobId: parseInt(partitionTimes[j]), attempts: 3 });
                console.log(`Reminder for payment retry ${parseInt(partitionTimes[j])} scheduled with ${delay} ms delay.`);
              }
            
            } else {
              console.log('No unpaid invoice found or payment already settled.');
            }
          }
        }
  
      }
  
      return res
        .status(200)
        .send(
          successResponse("Subscription settings updated successfully.", {}, RESPONSE_CODES.GET)
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


  /* user assigned task List */
  async userTaskList(req, res) {
    try {
      const { body, user } = req;
      let getTaskList = await this.services.getUserTasksList(body, user);
      return res
        .status(200)
        .send(
          successResponse(UserMessages.GET_LIST, getTaskList, RESPONSE_CODES.GET)
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
}

