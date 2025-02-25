import cron from "node-cron";
import moment from "moment";
import sequelize from "sequelize";
import nodemailer from "../helpers/mail";
const Op = sequelize.Op;
import { SUBSCRIPTION_LOGID } from "../../../config/constants.js";
import axios from  "axios";

export const cronFunction = (db) => {

  //---------------------------------When subscription cancel then status update in table---------------

  cron.schedule("5 0 * * *", async () => {
  // cron.schedule("*/10 * * * * *", async () => {

    console.log("Run cron every day at 12:05 AM");  

    let currentDate = moment(new Date()).unix();
    const startOfDay = moment.unix(currentDate).startOf('day').unix();
    const endOfDay = moment.unix(currentDate).endOf('day').unix();

    let findSubscriptionsForCancel = await db.models.ClientSubscriptions.findAll({
      attributes: ["id", "client_id", "title", "start_date", "billing_frequency", "total_price", "cancel_at", "status"],
      having: {
        status: {
          [Op.ne]: 4
        },
        [Op.and]: [{
          cancel_at: {
            [Op.ne]: null
          },
        },{
          cancel_at: {
            [Op.between]: [startOfDay, endOfDay],
          }
        }]
      },
      raw: true,
    });
    
    if(findSubscriptionsForCancel.length > 0) {

      let subscriptionHistory = [];
      for(let i in findSubscriptionsForCancel) {
        await db.models.ClientSubscriptions.update({
          status: 4,
        },{
          where: {
            id: findSubscriptionsForCancel[i].id,
          }
        });

        subscriptionHistory.push({
          client_id: findSubscriptionsForCancel[i].client_id,
          subscription_id: findSubscriptionsForCancel[i].id,
          description: findSubscriptionsForCancel[i].title,
          start_date: findSubscriptionsForCancel[i].start_date,
          billing_frequency: findSubscriptionsForCancel[i].billing_frequency,
          price: findSubscriptionsForCancel[i].total_price,
          type: SUBSCRIPTION_LOGID.STATUS_CHANGE_CANCEL,
        });
      }
      // create Subscription history in Subscriptionhistory Table for client refrence 
      await db.models.ClientSubscriptionHistories.bulkCreate(subscriptionHistory);
    }
  });


  /** Cron job for subscription expire then resend link of subscription */
  cron.schedule("*/5 * * * *", async () => {
      // console.log("Run cron every 5 minute");  
      let requestUrl = `${process.env.BASE_URL}v1/client/regenerate-subscription-link-cron`;
      const response = await axios({
        method: 'GET',
        url: requestUrl,
      });

      // let currentDate = Math.floor(new Date().getTime() / 1000);
      // let findResendSubscriptionLink = await db.models.ClientSubscriptions.findAll({
      //   attributes: ["id", "client_id", "link_sent_time", "billing_frequency", "status", "deleted_at", [sequelize.literal("(SELECT customer_id FROM users WHERE users.id = client_id)"), "customer_id"],[sequelize.literal("link_sent_time + 86400"), "link_sent_time_plus_one_day"]],
      //   where: {
      //     status: 0,
      //     link_sent_time_plus_one_day: {
      //       [Op.lte]: currentDate,
      //     },
      //     billing_frequency: {
      //       [Op.ne]: 1
      //     },
      //     deleted_at: null,
      //   },
      //   raw: true,
      // });

      // if(findResendSubscriptionLink) {

      //   for(let i in findResendSubscriptionLink) {
      //     await db.models.ClientSubscriptions.update({
      //       status: 3,
      //     },{
      //       where: {
      //         id: findResendSubscriptionLink[i].id,
      //       }
      //     });
      //   }
      // }
  });


  /** Update Client status inactive subscription is not paid */
  cron.schedule("5 0 * * *", async () => {
    // cron.schedule("*/10 * * * * *", async () => {
      console.log("subscription setting cron api hit");
      let requestUrl = `${process.env.BASE_URL}v1/subscription-setting/cron`;
      const response = await axios({
        method: 'GET',
        url: requestUrl,
      });
  });


}
