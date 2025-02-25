import { description } from '@hapi/joi/lib/base';

const Joi = require('@hapi/joi')

const loginValidator = Joi.object({
  email: Joi.string().email().message("Please enter valid email address").required().messages({
    "string.empty": `Email cannot be an empty field`,
    "any.required": 'Email address is required'
  }),
  password: Joi.string().required().messages({
    "string.empty": `Password cannot be an empty field`,
    "any.required": 'Password is required'
  }),
  fcm_token: Joi.string().optional().allow("", null),
  device_type: Joi.number().optional().allow("", null),
  device_id: Joi.string().optional().allow("", null),
});

const forgotPasswordValidator = Joi.object().keys({
  email: Joi.string().email().trim().required().messages({
    "string.empty": `Email cannot be an empty field`,
    "any.required": 'Email address is required'
  }),
});

const otpVerifyValidator = Joi.object().keys({
  email: Joi.string().email().trim().required().messages({
    "string.empty": `Email cannot be an empty field`,
    "any.required": 'Email address is required'
  }),
  otp: Joi.string().max(4).required().messages({
    "any.required": 'Otp is required',
    "string.min": 'Otp should be 4 digit.',
    "string.max": 'Otp should be 4 digit.',
  }),
  type: Joi.number().min(0).max(1).optional().allow("", null),
});

const resetPasswordValidator = Joi.object().keys({
  email: Joi.string().email().trim().required().messages({
    "string.empty": `Email cannot be an empty field`,
    "any.required": 'Email address is required'
  }),
  password: Joi.string().required().messages({
    "string.empty": `Password cannot be an empty field`,
    "any.required": 'Password is required'
  }),
});

const changePasswordValidator = Joi.object().keys({
  type: Joi.number().min(1).max(2).required().messages({
    "number.min": `Type should be 1 for Admin password or 2 for Client password`,
    "any.required": 'Type is required'
  }),
  old_password: Joi.string().when("type", {
    is: 1,
    then: Joi.required().messages({
      "string.empty": `Old Password cannot be an empty field`,
      "any.required": "Old Password is required",
    }),
    otherwise: Joi.optional().allow(""),
  }),
  client_id: Joi.number().when("type", {
    is: 2,
    then: Joi.required().messages({
      "string.empty": `User id cannot be an empty field`,
      "any.required": "User id is required",
    }),
    otherwise: Joi.optional().allow(""),
  }),
  new_password: Joi.string().required().messages({
    "string.empty": `New Password cannot be an empty field`,
    "any.required": 'New Password is required'
  }),
})

const updateInfoValidator = Joi.object().keys({
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  phone_number: Joi.string().optional().allow("", null),
})


const socialLoginValidator = Joi.object({
  social_id: Joi.string().trim().required().messages({
    "string.empty": `Social id be an empty field`,
    "any.required": 'Social id is required'
  }),
  social_type: Joi.number().min(1).max(2).required().messages({
    "number.min": `Social type should be 1=> Google, 2=Facebook`,
    "number.max": `Social type should be 1=> Google, 2=Facebook`,
    "any.required": 'Social type is required'
  }),
  first_name: Joi.string().trim().required().messages({
    "string.empty": `First name be an empty field`,
    "any.required": 'First name is required'
  }),
  last_name: Joi.string().optional().allow("", null),
  email: Joi.string().email().trim().required().messages({
    "string.empty": `Email cannot be an empty field`,
    "any.required": 'Email address is required'
  }),
});


const updateUserStatus = Joi.object({
  user_id: Joi.number().min(1).required().messages({
    "number.min": `User id can't be 0`,
    "any.required": 'User id is required'
  }),
  status: Joi.number().min(1).max(2).required().messages({
    "number.min": `Status should be 1=> Active, 2=Inactive`,
    "number.max": `Status should be 1=> Active, 2=Inactive`,
    "any.required": 'Status is required'
  }),
});

const updateAuthenticationStatus = Joi.object({
  user_id: Joi.number().min(1).required().messages({
    "number.min": `User id can't be 0`,
    "any.required": 'User id is required'
  }),
  status: Joi.number().min(0).max(1).required().messages({
    "number.min": `Status should be 0=> disable, 1=enable`,
    "number.max": `Status should be 0=> disable, 1=enable`,
    "any.required": 'Status is required'
  }),
});

const getDashboardCount = Joi.object({
  type: Joi.number().min(0).max(2).optional().allow("", null),
  start_date: Joi.string().optional().allow("", null),
  end_date: Joi.string().optional().allow("", null),
});

const resendOtpValidator = Joi.object().keys({
  email: Joi.string().email().trim().required().messages({
    "string.empty": `Email cannot be an empty field`,
    "any.required": 'Email address is required'
  }),
  type: Joi.number().min(0).max(1).optional().allow("", null),
});


const adminLoginASClientValidator = Joi.object().keys({
  user_id: Joi.number().min(1).required().messages({
    "number.min": `User id can't be 0`,
    "any.required": 'User id is required'
  }),
});


const getFinanceReportValidator = Joi.object({
  type: Joi.number().min(0).max(3).required().messages({
    "number.min": `Type should be 0-> Past Year, 1-> Past Week, 2-> Current year, 3-> Custom`,
    "number.max": `Type should be 0-> Past Year, 1-> Past Week, 2-> Current year, 3-> Custom`,
    "any.required": 'Type is required'
  }),
  start_date: Joi.string().when("type", {
    is: 3,
    then: Joi.required().messages({
      "any.required": "Start date is required",
    }),
    otherwise: Joi.optional().allow("", null),
  }),
  end_date: Joi.string().when("type", {
    is: 3,
    then: Joi.required().messages({
      "any.required": "End date is required",
    }),
    otherwise: Joi.optional().allow("", null),
  }),
});

const financialReportValidator = Joi.object({
  type: Joi.number().min(0).max(2).required().messages({
    "number.min": `Type should be 0-> Current Month, 1-> Last month`,
    "number.max": `Type should be 0-> Current Month, 1-> Last month`,
    "any.required": 'Type is required'
  }),
});


export const updateTwoFactorSettingValidator = Joi.object({
  two_factor_setting: Joi.array().items(
    Joi.object({
      key: Joi.string().optional().allow(),
      user_role: Joi.number().min(2).max(7).optional().allow(),
      is_authenticate: Joi.number().min(0).max(4).optional().allow(),
    })
  ),
});


const addRolesPermissionValidator = Joi.object({
  name: Joi.string().required().messages({
    "string.empty": `Name cannot be an empty field`,
    "any.required": 'Name is required'
  }),
  // description: Joi.string().required().messages({
  //   "string.empty": `Description cannot be an empty field`,
  //   "any.required": 'Description is required'
  // }),
  description: Joi.string().optional().allow("", null),
  is_client_access: Joi.number().min(0).max(1).required().messages({
    "number.min": `Is client access should be 0-> No, 1-> Yes`,
    "number.max": `Is client access should be 0-> No, 1-> Yes`,
    "any.required": 'Is client access is required'
  }),
  client_access: Joi.object({
    client_view: Joi.number().min(0).max(1).optional().allow(),
    client_edit: Joi.number().min(0).max(2).optional().allow(),
    client_delete: Joi.number().min(0).max(2).optional().allow(),
    client_subscriptions: Joi.number().min(0).max(1).optional().allow(),
    client_as_login: Joi.number().min(0).max(1).optional().allow(),
    client_account_manager: Joi.number().min(0).max(1).optional().allow(),
    client_assigned_agent: Joi.number().min(0).max(1).optional().allow(),
    client_hide_info: Joi.number().min(0).max(1).optional().allow(),
  }),
  is_agent_access: Joi.number().min(0).max(1).required().messages({
    "number.min": `Is agent access should be 0-> No, 1-> Yes`,
    "number.max": `Is agent access should be 0-> No, 1-> Yes`,
    "any.required": 'Is agent access is required'
  }),
  agent_access: Joi.object({
    agent_view: Joi.number().min(0).max(1).optional().allow(),
    agent_edit: Joi.number().min(0).max(2).optional().allow(),
    agent_delete: Joi.number().min(0).max(2).optional().allow(),
    agent_hide_info: Joi.number().min(0).max(1).optional().allow(),
  }),
  is_report_access: Joi.number().min(0).max(1).required().messages({
    "number.min": `Is report access should be 0-> No, 1-> Yes`,
    "number.max": `Is report access should be 0-> No, 1-> Yes`,
    "any.required": 'Is report access is required'
  }),
  report_access: Joi.object({
    report_financial: Joi.number().min(0).max(1).optional().allow(),
    report_churn: Joi.number().min(0).max(1).optional().allow(),
    report_retantion: Joi.number().min(0).max(1).optional().allow(),
    report_customer: Joi.number().min(0).max(1).optional().allow(),
    report_growth: Joi.number().min(0).max(1).optional().allow(),
    report_mmr: Joi.number().min(0).max(1).optional().allow(),
  }),
  is_manage_products: Joi.number().min(0).max(1).required().messages({
    "number.min": `Is manage products should be 0-> No, 1-> Yes`,
    "number.max": `Is manage products should be 0-> No, 1-> Yes`,
    "any.required": 'Is manage products is required'
  }),
  is_chat: Joi.number().min(0).max(1).required().messages({
    "number.min": `Is chat should be 0-> No, 1-> Yes`,
    "number.max": `Is chat should be 0-> No, 1-> Yes`,
    "any.required": 'Is chat is required'
  }),
  chat_access: Joi.object({
    chat: Joi.number().min(0).max(1).optional().allow(),
  }),
  is_keywords: Joi.number().min(0).max(1).required().messages({
    "number.min": `Is keywords should be 0-> No, 1-> Yes`,
    "number.max": `Is keywords should be 0-> No, 1-> Yes`,
    "any.required": 'Is keywords is required'
  }),
  is_settings: Joi.number().min(0).max(1).required().messages({
    "number.min": `Is settings should be 0-> No, 1-> Yes`,
    "number.max": `Is settings should be 0-> No, 1-> Yes`,
    "any.required": 'Is settings is required'
  }),
  is_supports: Joi.number().min(0).max(1).required().messages({
    "number.min": `Is supports should be 0-> No, 1-> Yes`,
    "number.max": `Is supports should be 0-> No, 1-> Yes`,
    "any.required": 'Is supports is required'
  }),
  support_access: Joi.object({
    support_access_allow: Joi.number().min(0).max(1).optional().allow(),
    support_department: Joi.number().min(0).max(1).optional().allow(),
  }),
  is_admin_users: Joi.number().min(0).max(1).required().messages({
    "number.min": `Is admin users should be 0-> No, 1-> Yes`,
    "number.max": `Is admin users should be 0-> No, 1-> Yes`,
    "any.required": 'Is admin users is required'
  }),
  admin_access: Joi.object({
    admin_view: Joi.number().min(0).max(1).optional().allow(),
    admin_edit: Joi.number().min(0).max(2).optional().allow(),
    admin_delete: Joi.number().min(0).max(2).optional().allow(),
    admin_hide_info: Joi.number().min(0).max(1).optional().allow(),
  }),
  is_agent_group_access: Joi.number().min(0).max(1).required().messages({
    "number.min": `Is agent group access should be 0-> No, 1-> Yes`,
    "number.max": `Is agent group access should be 0-> No, 1-> Yes`,
    "any.required": 'Is agent group access is required'
  }),
  agent_group_access: Joi.object({
    agent_group_view: Joi.number().min(0).max(1).optional().allow(),
    agent_group_edit: Joi.number().min(0).max(2).optional().allow(),
    agent_group_delete: Joi.number().min(0).max(2).optional().allow(),
  }),
});


export const listAllRoles = Joi.object({
  start: Joi.number().min(0).optional().allow("", null),
  limit: Joi.number().optional().allow("", null),
  search: Joi.string().optional().allow("", null),
});


export const notificationListValidator = Joi.object({
  start: Joi.number().min(0).optional().allow("", null),
  limit: Joi.number().optional().allow("", null),
  is_mark: Joi.number().min(0).optional().allow("", null),
});


const subscriptionSettingValidator = Joi.object({
  overdue_period_days: Joi.string().required().messages({
    "string.empty": `Overdue period days cannot be an empty field`,
    "any.required": 'Overdue period days is required'
  }),
  suspend_period_days: Joi.string().required().messages({
    "string.empty": `Suspend period days cannot be an empty field`,
    "any.required": 'Suspend is required'
  }),
  automatic_reminder_email_days: Joi.string().required().messages({
    "string.empty": `Automatic reminder email days cannot be an empty field`,
    "any.required": 'Automatic reminder email days is required'
  }),
  overdue_reminder_email_days: Joi.string().required().messages({
    "string.empty": `Overdue reminder email days cannot be an empty field`,
    "any.required": 'Overdue reminder email days is required'
  }),
  card_expiry_reminder_email_days: Joi.string().required().messages({
    "string.empty": `Card expiry reminder email days cannot be an empty field`,
    "any.required": 'Card expiry reminder email days is required'
  }),
  payment_retry_overdue_status_days: Joi.string().required().messages({
    "string.empty": `Payment retry overdue status days cannot be an empty field`,
    "any.required": 'Payment retry overdue status days is required'
  }),
  payment_retry_suspended_status_days: Joi.string().required().messages({
    "string.empty": `Payment retry suspended status days cannot be an empty field`,
    "any.required": 'Payment retry suspended status days is required'
  }),
  global_processing_fee_description: Joi.string().required().messages({
    "string.empty": `Global processing fee description cannot be an empty field`,
    "any.required": 'Global processing fee description is required'
  }),
  global_processing_fee: Joi.string().required().messages({
    "string.empty": `Global processing fee % cannot be an empty field`,
    "any.required": 'Global processing fee is required'
  }),

});


export const slackNotificationTypeValidator = Joi.object({
  types_of_slack_notification: Joi.string().required().messages({
    "string.empty": `Types of slack notification cannot be an empty field`,
    "any.required": 'Types of slack notification is required'
  }),
  project_id: Joi.string().required().messages({
    "string.empty": `Project Id cannot be an empty field`,
    "any.required": 'Project Id is required'
  }),
});


export const enablecalendarValidator = Joi.object({
  type: Joi.number().min(1).max(2).required().messages({
    "string.empty": `Type should be 1-> google, 2-> outlook`,
    "any.required": 'Types of slack notification is required'
  }),
  is_enable: Joi.number().min(0).max(1).required().messages({
    "string.empty": `Is enable should be 0-> disable, 1-> enable`,
    "any.required": 'Is enable is required'
  }),
});

export const removeCalendarValidator = Joi.object({
  type: Joi.number().min(1).max(3).required().messages({
    "string.empty": `Type should be 1-> google, 2-> outlook, 3->slack`,
    "any.required": 'Types of slack notification is required'
  }),
  project_id: Joi.when('type', {
    is: 3,
    then: Joi.number().required().messages({
      "any.required": "Project ID is required when type is 3 (Slack)"
    }),
    otherwise: Joi.forbidden()
  })
});



module.exports = { loginValidator, forgotPasswordValidator, otpVerifyValidator, resetPasswordValidator, changePasswordValidator, updateInfoValidator, socialLoginValidator, updateUserStatus, updateAuthenticationStatus, getDashboardCount, resendOtpValidator, adminLoginASClientValidator, getFinanceReportValidator, financialReportValidator, updateTwoFactorSettingValidator, addRolesPermissionValidator, listAllRoles, subscriptionSettingValidator, notificationListValidator, slackNotificationTypeValidator, enablecalendarValidator,removeCalendarValidator }
