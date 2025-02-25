const Joi = require('@hapi/joi')

export const createUser = Joi.object({
  email: Joi.string().email().max(50).required(),
  role_id: Joi.number().required()
})
export const serProfileValidator = Joi.object({
  token: Joi.string().required(),
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  password: Joi.string().min(8).max(20).pattern(new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,10}$/)).message("Minimum 8 Characters (1 uppercase, lowercase, number and special character). Maximum 20 Characters are allowed.").required()
})

export const listAllUser = Joi.object({
  start: Joi.number().optional().allow("", null),
  limit: Joi.number().optional().allow("", null),
  search: Joi.string().optional().allow("", null),
  filter: Joi.object({
    role: Joi.number().optional().allow("", null),
    two_factor_authentication: Joi.number().optional().allow("", null),
  }).optional(), // Make the entire filter object optional
});

export const resendInvite = Joi.object({
  email: Joi.string().required().messages({
    "string.empty": "Email cannot be an empty field",
    "any.required": "Email address is required"
  })
});

export const userTaskListValidator = Joi.object({
  start: Joi.number().optional().allow("", null),
  limit: Joi.number().optional().allow("", null),
  search: Joi.string().optional().allow("", null),
  type: Joi.number().min(0).max(1).optional().allow("", null),
  date: Joi.string().optional().allow("", null),
})