require("dotenv").config();
import nodemailer from "nodemailer";
const SibApiV3Sdk = require("sib-api-v3-sdk");

module.exports = {
  async sendMail(to, subject, html, attachment = false) {
    const sender = {
      name:process.env.MAIL_NAME,
      email: process.env.MAIL_FROM,
    };
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      secure: false,
      port: process.env.MAIL_PORT,
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    const mailOptions = {
       //from: process.env.MAIL_FROM,
      sender,
      to: to,
      subject: subject,
      html: html,
      attachments: attachment,
    };
    transporter.sendMail(mailOptions, function (err, info) {
      if (err) console.log("error", err.message);
      else console.log(info);
    });
  },

  async sendinBlueMail(mail, subject, htmlContent, attachment = false) {
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications["api-key"];
    apiKey.apiKey = process.env.SENDINBLUE_API_KEY;
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    const sender = {
      name:process.env.MAIL_NAME,
      email: process.env.MAIL_FROM,
    };
    const receiver = [
      {
        email: mail
      },
    ]
    apiInstance.sendTransacEmail({
        sender,
        to: receiver,
        subject:subject,
        htmlContent:htmlContent,
        attachments: attachment,
      })
      .then(
        function (data) {
          console.log("API called successfully. Returned data: " + data);
        },
        function (error) {
          console.error(error);
        }
      );
  },
};
