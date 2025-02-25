const Joi = require('@hapi/joi')

export const createClient = Joi.object({
  first_name: Joi.string().required().messages({
    "string.empty": "First name cannot be an empty field",
    "any.required": "First name is required"
  }),
  last_name: Joi.string().required().messages({
    "string.empty": "Last name cannot be an empty field",
    "any.required": "Last name is required"
  }),
  email: Joi.string().email().required().messages({
    "string.empty": "Email cannot be an empty field",
    "any.required": "Email address is required"
  }),
  company_name: Joi.string().required().messages({
    "string.empty": "Company name cannot be an empty field",
    "any.required": "Company name is required"
  }),
  is_welcome_email: Joi.number().min(0).max(1).optional().allow("", null),
})
export const setClientPasswordValidator = Joi.object({
  token: Joi.string().required().messages({
    "string.empty": "Token cannot be an empty field",
    "any.required": "Token is required"
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password cannot be an empty field",
    "any.required": "Password is required"
  }),
})

export const deleteClientValidator = Joi.object({
  client_ids: Joi.array()
  .items(Joi.number().min(1).required())
  .required()
  .messages({
    "string.empty": `Client ids cannot be an empty field`,
    "any.required": "Client ids is required",
  }),
})

export const listAllClients = Joi.object({
  start: Joi.number().min(0).optional().allow("", null),
  limit: Joi.number().optional().allow("", null),
  search: Joi.string().optional().allow("", null),
  type: Joi.number().optional().allow("", null),
})

export const updateClientValidator = Joi.object({
  first_name: Joi.string().required().messages({
    "string.empty": "First name cannot be an empty field",
    "any.required": "First name is required"
  }),
  last_name: Joi.string().required().messages({
    "string.empty": "Last name cannot be an empty field",
    "any.required": "Last name is required"
  }),
  country_code: Joi.string().optional().allow("", null),
  phone_number: Joi.string().optional().allow("", null),
  company_name: Joi.string().optional().allow("", null),
  address: Joi.string().optional().allow("", null),
  status: Joi.string().optional().allow("", null),
})


export const assignAgentValidator = Joi.object({
  client_id: Joi.number().min(1).required().messages({
    "number.min": "Client id can't be 0",
    "any.required": "Client id is required"
  }),
  agent_ids: Joi.array()
  .items(Joi.number().min(1).required())
  .required()
  .messages({
    "string.empty": `Agent ids cannot be an empty field`,
    "any.required": "Agent ids is required",
  }),
})


export const listAllAgentsAssignToClient = Joi.object({
  client_id: Joi.number().min(1).required().messages({
    "number.min": "Client id can't be 0",
    "any.required": "Client id is required"
  }),
  start: Joi.number().min(0).optional().allow("", null),
  limit: Joi.number().optional().allow("", null),
  search: Joi.string().optional().allow("", null),
  is_agent: Joi.number().optional().allow("", null),
  is_user: Joi.number().optional().allow("", null),
  project_id: Joi.number().optional().allow("", null),
})

export const unassignAgentValidator = Joi.object({
  client_id: Joi.number().min(1).required().messages({
    "number.min": "Client id can't be 0",
    "any.required": "Client id is required"
  }),
  agent_id: Joi.number().min(1).required().messages({
    "number.min": "Agent id can't be 0",
    "any.required": "Agent id is required"
  }),
})

export const addSubscription = Joi.object({
  client_id: Joi.number().min(1).required().messages({
    "number.min": "Client id can't be 0",
    "any.required": "Client id is required"
  }),
  title: Joi.string().required().messages({
    "string.empty": "Title cannot be an empty field",
    "any.required": "Title is required"
  }),
  description: Joi.string().optional().allow("", null),
  subscription_data: Joi.array().items(
    Joi.object({
      product_id: Joi.number()
        .min(1)
        .required()
        .messages({
          "number.min": `Product id can be a number greater than zero`,
          "any.required": "Product id is required",
      }),
      quantity: Joi.number()
      .min(1)
      .required()
      .messages({
        "number.min": `Quantity can't be 0.`,
        "any.required": "Quantity is required",
      }),
      unit_price: Joi.number()
        .min(1)
        .required()
        .messages({
          "number.min": `Unit price can't be 0.`,
          "any.required": "Unit price is required",
      }),

      unit_discount_type: Joi.number().optional().allow("", null),
      unit_discount: Joi.number().optional().allow("", null),
      net_price: Joi.number()
      .min(1)
      .required()
      .messages({
        "number.min": `Net price cam't be 0.`,
        "any.required": "Net price is required",
      }),

      billing_frequency: Joi.number()
      .min(1)
      .max(7)
      .required()
      .messages({
        "number.min": "Billing frequency should be 1=> one time, 2=> monthly , 3=> quaterly, 4=> semi annually, 5=> annually, 6=> every 1 week, 7=> every 4 weeks",
        "number.max": "Billing frequency should be 1=> one time, 2=> monthly , 3=> quaterly, 4=> semi annually, 5=> annually, 6=> every 1 week, 7=> every 4 weeks",
        "any.required": "Billing frequency is required"
      }),
      billing_terms: Joi.number()
      .min(1)
      .max(5)
      .required()
      .messages({
        "number.min": "Billing terms should be 1=> Fixed number of payments, 2=> Automatically renew unit cancel",
        "number.max": "Billing terms should be 1=> Fixed number of payments, 2=> Automatically renew unit cancel",
        "any.required": "Billing terms is required"
      }),
      no_of_payments: Joi.number().when("billing_terms", {
        is: 1,
        then: Joi.required().messages({
          "number.min": `No of payments cannot be an 0`,
          "any.required": "No of payments is required",
        }),
        otherwise: Joi.optional().allow("", null),
      }),
      is_delay_in_billing: Joi.number().optional().allow("", null),
      billing_start_date: Joi.string().optional().allow("", null),
    })
  ),
  is_manual_payment: Joi.number().min(0).max(1).optional().allow("", null),
  one_time_discount_name: Joi.string().optional().allow("", null),
  one_time_discount_type: Joi.number().optional().allow("", null),
  one_time_discount: Joi.number().optional().allow("", null),
  subtotal: Joi.number()
  .min(1)
  .required()
  .messages({
    "number.min": `Subtotal can't be 0.`,
    "any.required": "Subtotal is required",
  }),
  total_price: Joi.number()
  .min(1)
  .required()
  .messages({
    "number.min": `Total price can't be 0.`,
    "any.required": "Total price is required",
  }),
});


export const assignAccountManagerValidator = Joi.object({
  client_id: Joi.number().min(1).required().messages({
    "number.min": "Client id can't be 0",
    "any.required": "Client id is required"
  }),
  account_manager_ids: Joi.array()
  .items(Joi.number().min(1).required())
  .required()
  .messages({
    "string.empty": `Account manager ids cannot be an empty field`,
    "any.required": "Account manager ids is required",
  }),
})

export const unassignAccountManagerValidator = Joi.object({
  client_id: Joi.number().min(1).required().messages({
    "number.min": "Client id can't be 0",
    "any.required": "Client id is required"
  }),
  account_manager_id: Joi.number().min(1).required().messages({
    "number.min": "Account manager id can't be 0",
    "any.required": "Account manager id is required"
  }),
})

export const setDefaultAccountManagerValidator = Joi.object({
  client_id: Joi.number().min(1).required().messages({
    "number.min": "Client id can't be 0",
    "any.required": "Client id is required"
  }),
  account_manager_id: Joi.number().min(1).required().messages({
    "number.min": "Account manager id can't be 0",
    "any.required": "Account manager id is required"
  }),
})

export const addPassManagers = Joi.object({
  site_name: Joi.string().required().messages({
    "string.empty": "Site name cannot be an empty field",
    "any.required": "Site name is required"
  }),
  user_name: Joi.string().required().messages({
    "string.empty": "User name cannot be an empty field",
    "any.required": "User name is required"
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password cannot be an empty field",
    "any.required": "Password is required"
  }),
  agent_ids: Joi.array()
});


export const addCardValidator = Joi.object({
  token: Joi.string().required().messages({
    "string.empty": "Card holder name cannot be an empty field",
    "any.required": "Card holder name is required"
  }),
  subscription_id: Joi.number().min(1).required().messages({
    "number.min": "Subscription id should be greater than 0.",
    "any.required": "Subscription id is required"
  }),
  is_default: Joi.number().min(0).max(2).required().messages({
    "number.min": "Is default should be 0=> No, 1=> Yes, 2-> Global default for all subscriptions",
    "any.required": "Is default is required"
  }),
});


export const billingListValidator = Joi.object({
  start: Joi.number().min(0).optional().allow("", null),
  limit: Joi.number().optional().allow("", null),
  search: Joi.string().optional().allow("", null),
});

export const updateCardValidator = Joi.object({
  // card_id: Joi.string().required().messages({
  //   "string.empty": "Card id cannot be an empty field",
  //   "any.required": "Card id is required"
  // }),
  card_id: Joi.number().min(1).required().messages({
    "number.min": "Card id should be greater than 0.",
    "any.required": "Card id is required"
  }),
  exp_date: Joi.string().optional().allow("", null),
  is_default: Joi.number().min(0).max(2).optional().allow("", null),
});


export const billingHistoryValidator = Joi.object({
  start: Joi.number().min(0).optional().allow("", null),
  limit: Joi.number().optional().allow("", null),
  search: Joi.string().optional().allow("", null),
  filter: Joi.object({
    month: Joi.number().optional().allow("", null),
    year: Joi.number().optional().allow("", null),
  }).optional(), // Make the entire filter object optional
});


export const cancelSubscriptionValidator = Joi.object({
  client_id: Joi.number().min(0).optional().allow("", null),
  subscription_id: Joi.number().min(1).required().messages({
    "number.min": "Subscription id can't be 0",
    "any.required": "Subscription id is required"
  }),
  cancel_type: Joi.number().min(0).max(2).required().messages({
    "number.min": `Cancel type should be 0=> Cancel Immediately, 1=> Cancel at end of billing cycle, 2=> cancel at custom date.`,
    "number.max": `Cancel type should be 0=> Cancel Immediately, 1=> Cancel at end of billing cycle, 2=> cancel at custom date.`,
    "any.required": "Cancel typeis required",
  }),
  cancel_date: Joi.string().when("cancel_type", {
    is: 2,
    then: Joi.required().messages({
      "string.empty": "Cancel date cannot be an empty field",
      "any.required": "Cancel date is required"
    }),
    otherwise: Joi.optional().allow("", null),
  }),
});

export const AgentRecentActivityList = Joi.object({
  project_id: Joi.number().min(1).required().messages({
    "number.min": "project id can't be 0",
    "any.required": "project id is required"
  }),
  start: Joi.number().min(0).optional().allow("", null),
  limit: Joi.number().optional().allow("", null),
});


export const subscriptionLogValidator = Joi.object({
  subscription_id: Joi.number().min(1).required().messages({
    "number.min": "Subscription id can't be 0",
    "any.required": "Subscription id is required"
  }),
  start: Joi.number().min(0).optional().allow("", null),
  limit: Joi.number().optional().allow("", null),
  search: Joi.string().optional().allow("", null),
});


export const editSubscription = Joi.object({
  subscription_id: Joi.number().min(1).required().messages({
    "number.min": "Subscription id can't be 0",
    "any.required": "Subscription id is required"
  }),
  title: Joi.string().optional().allow("", null),
  description: Joi.string().optional().allow("", null),
  subscription_data: Joi.array().items(
    Joi.object({
      plan_id: Joi.number()
      .required()
      .messages({
        "string.empty": `Plan id can't be 0`,
        "any.required": "Plan id is required",
    }),
      product_id: Joi.number()
        .required()
        .messages({
          "string.empty": `Product id can't be 0`,
          "any.required": "Product id is required",
      }),
      quantity: Joi.number()
      .min(1)
      .required()
      .messages({
        "number.min": `Quantity can't be 0.`,
        "any.required": "Quantity is required",
      }),
      unit_price: Joi.number()
        .min(1)
        .required()
        .messages({
          "number.min": `Unit price can't be 0.`,
          "any.required": "Unit price is required",
      }),
      unit_discount_type: Joi.number().optional().allow("", null),
      unit_discount: Joi.number().optional().allow("", null),
      net_price: Joi.number()
      .min(1)
      .required()
      .messages({
        "number.min": `Net price cam't be 0.`,
        "any.required": "Net price is required",
      }),
      billing_frequency: Joi.number()
      .min(1)
      .max(7)
      .required()
      .messages({
        "number.min": "Billing frequency should be 1=> one time, 2=> monthly , 3=> quaterly, 4=> semi annually, 5=> annually, 6=> every 1 week, 7=> every 4 weeks",
        "number.max": "Billing frequency should be 1=> one time, 2=> monthly , 3=> quaterly, 4=> semi annually, 5=> annually, 6=> every 1 week, 7=> every 4 weeks",
        "any.required": "Billing frequency is required"
      }),
      billing_terms: Joi.number()
      .min(1)
      .max(2)
      .required()
      .messages({
        "number.min": "Billing terms should be 1=> Fixed number of payments, 2=> Automatically renew unit cancel",
        "number.max": "Billing terms should be 1=> Fixed number of payments, 2=> Automatically renew unit cancel",
        "any.required": "Billing terms is required"
      }),
      no_of_payments: Joi.number().when("billing_terms", {
        is: 1,
        then: Joi.required().messages({
          "number.min": `No of payments cannot be an 0`,
          "any.required": "No of payments is required",
        }),
        otherwise: Joi.optional().allow("", null),
      }),
      is_delay_in_billing: Joi.number().optional().allow("", null),
      billing_start_date: Joi.string().optional().allow("", null),
    })
  ),
  is_manual_payment: Joi.number().min(0).max(1).optional().allow("", null),
  one_time_discount_name: Joi.string().optional().allow("", null),
  one_time_discount_type: Joi.number().optional().allow("", null),
  one_time_discount: Joi.number().optional().allow("", null),
  subtotal: Joi.number()
  .min(1)
  .required()
  .messages({
    "number.min": `Subtotal can't be 0.`,
    "any.required": "Subtotal is required",
  }),
  total_price: Joi.number()
  .min(1)
  .required()
  .messages({
    "number.min": `Total price can't be 0.`,
    "any.required": "Total price is required",
  }),
  global_processing_fee: Joi.number().optional().allow("", null),
  global_processing_fee_description: Joi.string().optional().allow("", null),
});

export const updateReminderSettingValidator = Joi.object({
  reminder: Joi.array().items(
    Joi.object({
      key: Joi.string().optional().allow(),
      value: Joi.number().min(0).max(1).optional().allow(),
    })
  ),
});

export const listAllClientsForAssign = Joi.object({
  start: Joi.number().min(0).optional().allow("", null),
  limit: Joi.number().optional().allow("", null),
  search: Joi.string().optional().allow("", null),
  type: Joi.number().optional().allow("", null),
  account_manager_id: Joi.number().optional().allow("", null),
});


export const subscriptionHistorySaved = Joi.object({
  subscription_id: Joi.string().optional().allow("", null),
  description: Joi.string().optional().allow("", null),
  client_id: Joi.string().optional().allow("", null),
  type: Joi.string().optional().allow("", null),
  price: Joi.string().optional().allow("", null),
  start_date: Joi.string().optional().allow("", null),
  billing_frequency: Joi.string().optional().allow("", null),
  subscription_plan_data: Joi.array().items(
    Joi.object({
      subscription_id: Joi.string().optional().allow("", null),
      client_id: Joi.string().optional().allow("", null),
      product_id: Joi.string().optional().allow("", null),
      type: Joi.string().optional().allow("", null),
      unit_price: Joi.string().optional().allow("", null),
      quantity: Joi.string().optional().allow("", null),
      billing_frequency: Joi.string().optional().allow("", null),
      unit_discount_type: Joi.string().optional().allow("", null),
      unit_discount: Joi.string().optional().allow("", null),
      net_price: Joi.string().optional().allow("", null),
    })
  ),
});


export const clickDocusignLinkValidator = Joi.object({
  link_click: Joi.object({
    client_id: Joi.number().min(1).optional().allow(),
    subscription_id: Joi.number().min(1).optional().allow(),
    login_as_client: Joi.number().min(0).max(2).optional().allow(),
  }),
});


export const addRolesPermissionValidator = Joi.object({
  name: Joi.string().required().messages({
    "string.empty": `Name cannot be an empty field`,
    "any.required": 'Name is required'
  }),
  description: Joi.string().optional().allow("", null),
  is_project_access: Joi.number().min(0).max(1).required().messages({
    "number.min": `Is project access should be 0-> No, 1-> Yes`,
    "number.max": `Is project access should be 0-> No, 1-> Yes`,
    "any.required": 'Is project access is required'
  }),
  is_shared_files: Joi.number().min(0).max(1).required().messages({
    "number.min": `Is shared files should be 0-> No, 1-> Yes`,
    "number.max": `Is shared files should be 0-> No, 1-> Yes`,
    "any.required": 'Is shared access is required'
  }),
  is_password_manager: Joi.number().min(0).max(1).required().messages({
    "number.min": `Is password manager should be 0-> No, 1-> Yes`,
    "number.max": `Is password manager should be 0-> No, 1-> Yes`,
    "any.required": 'Is password manager access is required'
  }),
  is_agent_access: Joi.number().min(0).max(1).required().messages({
    "number.min": `Is agent access should be 0-> No, 1-> Yes`,
    "number.max": `Is agent access should be 0-> No, 1-> Yes`,
    "any.required": 'Is agent access is required'
  }),
  is_chat: Joi.number().min(0).max(1).required().messages({
    "number.min": `Is chat should be 0-> No, 1-> Yes`,
    "number.max": `Is chat should be 0-> No, 1-> Yes`,
    "any.required": 'Is chat is required'
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
  is_billing_access: Joi.number().min(0).max(1).required().messages({
    "number.min": `Is billing access should be 0-> No, 1-> Yes`,
    "number.max": `Is billing access should be 0-> No, 1-> Yes`,
    "any.required": 'Is billing access is required'
  }),
  is_users_access: Joi.number().min(0).max(1).required().messages({
    "number.min": `Is users access should be 0-> No, 1-> Yes`,
    "number.max": `Is users access should be 0-> No, 1-> Yes`,
    "any.required": 'Is users access is required'
  }),
});


export const addBankValidator = Joi.object({
  account_holder_name: Joi.string().required().messages({
    "string.empty": "Account holder name cannot be an empty field",
    "any.required": "Account Card holder name is required"
  }),
  account_number: Joi.string().required().messages({
    "string.empty": "Account number cannot be an empty field",
    "any.required": "Account number is required"
  }),
  routing_number: Joi.string().required().messages({
    "string.empty": "Routing number cannot be an empty field",
    "any.required": "Routing number is required"
  }),
  is_default: Joi.number().min(0).max(2).required().messages({
    "number.min": "Is default should be 0=> No, 1=> Yes, 2-> Global default for all subscriptions",
    "any.required": "Is default is required"
  }),
  subscription_id: Joi.number().min(1).required().messages({
    "number.min": "Subscription id should be greater than 0.",
    "any.required": "Subscription id is required"
  }),
});

export const updateBankValidator = Joi.object({
  // bank_id: Joi.string().required().messages({
  //   "string.empty": "Bank id cannot be an empty field",
  //   "any.required": "Bank id is required"
  // }),
  bank_id: Joi.number().min(1).required().messages({
    "number.min": "Bank id should be greater than 0.",
    "any.required": "Bank id is required"
  }),
  account_holder_name: Joi.string().optional().allow("", null),
  is_default: Joi.number().min(0).max(2).optional().allow("", null),
});


export const buySubscription = Joi.object({
  first_name: Joi.string().required().messages({
    "string.empty": "First name cannot be an empty field",
    "any.required": "First name is required"
  }),
  last_name: Joi.string().required().messages({
    "string.empty": "Last name cannot be an empty field",
    "any.required": "Last name is required"
  }),
  email: Joi.string().email().message("Email must be a valid email").required().messages({
    "string.empty": `Email address cannot be an empty field`,
    "any.required": 'Email address is required'
  }),
  phone_number: Joi.string().optional().allow("", null),
  company_name: Joi.string().required().messages({
    "string.empty": "Company name cannot be an empty field",
    "any.required": "Company name is required"
  }),
  token: Joi.string().required().messages({
    "string.empty": "Token cannot be an empty field",
    "any.required": "Token is required"
  }),
  country: Joi.string().required().messages({
    "string.empty": "Country cannot be an empty field",
    "any.required": "Country is required"
  }),
  title: Joi.string().required().messages({
    "string.empty": "Title cannot be an empty field",
    "any.required": "Title is required"
  }),
  subscription_data: Joi.array().items(
    Joi.object({
      product_id: Joi.number()
        .min(1)
        .required()
        .messages({
          "number.min": `Product id can be a number greater than zero`,
          "any.required": "Product id is required",
      }),
      quantity: Joi.number()
      .min(1)
      .required()
      .messages({
        "number.min": `Quantity can't be 0.`,
        "any.required": "Quantity is required",
      }),
      unit_price: Joi.number()
        .min(1)
        .required()
        .messages({
          "number.min": `Unit price can't be 0.`,
          "any.required": "Unit price is required",
      }),
      net_price: Joi.number()
      .min(1)
      .required()
      .messages({
        "number.min": `Net price cam't be 0.`,
        "any.required": "Net price is required",
      }),

      billing_frequency: Joi.number()
      .min(1)
      .max(7)
      .required()
      .messages({
        "number.min": "Billing frequency should be 1=> one time, 2=> monthly , 3=> quaterly, 4=> semi annually, 5=> annually, 6=> every 1 week, 7=> every 4 weeks",
        "number.max": "Billing frequency should be 1=> one time, 2=> monthly , 3=> quaterly, 4=> semi annually, 5=> annually, 6=> every 1 week, 7=> every 4 weeks",
        "any.required": "Billing frequency is required"
      }),
      billing_terms: Joi.number()
      .min(1)
      .max(5)
      .required()
      .messages({
        "number.min": "Billing terms should be 1=> Fixed number of payments, 2=> Automatically renew unit cancel",
        "number.max": "Billing terms should be 1=> Fixed number of payments, 2=> Automatically renew unit cancel",
        "any.required": "Billing terms is required"
      }),
      no_of_payments: Joi.number().when("billing_terms", {
        is: 1,
        then: Joi.required().messages({
          "number.min": `No of payments cannot be an 0`,
          "any.required": "No of payments is required",
        }),
        otherwise: Joi.optional().allow("", null),
      }),
    })
  ),
  subtotal: Joi.number()
  .min(1)
  .required()
  .messages({
    "number.min": `Subtotal can't be 0.`,
    "any.required": "Subtotal is required",
  }),
  total_price: Joi.number()
  .min(1)
  .required()
  .messages({
    "number.min": `Total price can't be 0.`,
    "any.required": "Total price is required",
  }),
});

