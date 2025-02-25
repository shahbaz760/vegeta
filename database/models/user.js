import bcrypt from "bcrypt";
import { saltRounds } from "../../config/keys";

module.exports = (sequelize, DataTypes) => {
  const users = sequelize.define(
    "users",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: true,
        primaryKey: true,
      },
      uuid: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "1=admin, 2=Client, 3=Agent,  4= Account Manager, 5= User",
      },
      first_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      last_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },
      country_code: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      phone_number: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      user_image: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      social_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      social_type: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "1=Google, 2=Facebook",
      },
      docusign_link: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      kyc_front_pic: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      kyc_back_pic: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      captured_pic: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      company_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      otp: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      otp_expiry: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      invite_token: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_verified: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "0=No, 1= YES",
      },
      added_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "saved client id of user",
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
        comment: "0=> Pending, 1=> Active, 2=> Inactive"
      },
      cometUserCreated: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "0=No, 1= YES",
      },
      two_factor_authentication: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: "0= OFF, 1= ON",
      },
      two_factor_otp: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      two_factor_otp_expiry: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      reset_password_token: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      customer_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      is_complete_profile: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "For Agent 0=>No any step perform, 1=>Send docusign link, 2= Signed Document, 3=> ID proof upload complete, 4=> capture image complete (In Review), 5=> Reject, 6=> Approve",
      },
      reject_reason: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
      },
      address2: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      state: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      zipcode: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      country: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      is_welcome_email: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: "0= Password email not sent, 1= sent",
      },
      user_role: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      reminder_to_task_creator: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
        comment: "0=> OFF, 1=> ON"
      },
      reminder_to_assignee: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
        comment: "0=> OFF, 1=> ON"
      },
      reminder_to_everyone: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: "0=> OFF, 1=> ON"
      },
      role_permission_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      added_by_user: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "saved user id",
      },
 
   
      google_auth_token: {
        type: DataTypes.JSON, // Define as JSON
        allowNull: true, // Adjust based on requirements
      },
      outlook_auth_token: {
        type: DataTypes.STRING(255), // Define as JSON
        allowNull: true, // Adjust based on requirements
      },
      sync_google_calendar: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: "0-> No, 1-> Yes"
      },
      sync_outlook_calendar: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: "0-> No, 1-> Yes"
      },
      outlook_auth_token: {
        type: DataTypes.JSON, // Define as JSON
        allowNull: true, // Adjust based on requirements
      },
      deleted_at: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      hooks: {
        beforeCreate: async (user) => {
          /**  password encryption **/
          if (user && user.password) {
            user.password = await bcrypt.hash(user.password, saltRounds);
          }
        },
        beforeBulkUpdate: async (user) => {
          if (user && user.attributes && user.attributes.password) {
            // eslint-disable-next-line no-param-reassign
            user.attributes.password = await bcrypt.hash(
              user.attributes.password,
              saltRounds
            );
          }
          if (user && user.attributes && user.attributes.email) {
            // eslint-disable-next-line no-param-reassign
            user.attributes.email = user.attributes.email.toLowerCase();
          }
        },
      },
    }
  );
  return users;
};
