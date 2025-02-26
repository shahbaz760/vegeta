"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateAccountManager = exports.listAllAccountManager = exports.deleteAccountManagerValidator = exports.createAccountManager = exports.assignClientsValidator = exports.assignAgentsValidator = exports.AssignClientToAccountManager = void 0;
var Joi = require('@hapi/joi');
var createAccountManager = exports.createAccountManager = Joi.object({
  first_name: Joi.string().required().messages({
    "string.empty": "First name cannot be an empty field",
    "any.required": "First name is required"
  }),
  last_name: Joi.string().required().messages({
    "string.empty": "Last name cannot be an empty field",
    "any.required": "Last name is required"
  }),
  country_code: Joi.string().optional().allow("", null),
  phone_number: Joi.string().required().messages({
    "string.empty": "Phone Number cannot be an empty field",
    "any.required": "Phone Number is required"
  }),
  email: Joi.string().email().required().messages({
    "string.empty": "Email cannot be an empty field",
    "any.required": "Email address is required"
  }),
  address: Joi.string().required().messages({
    "string.empty": "Address cannot be an empty field",
    "any.required": "Address is required"
  }),
  client_ids: Joi.array().items(Joi.number().min(1).optional()).optional().allow("", null)
});
var deleteAccountManagerValidator = exports.deleteAccountManagerValidator = Joi.object({
  accountManger_id: Joi.number().min(1).required().messages({
    "number.min": "Account manager id can't be 0",
    "any.required": "Account manager id is required"
  })
});
var listAllAccountManager = exports.listAllAccountManager = Joi.object({
  start: Joi.number().min(0).optional().allow("", null),
  limit: Joi.number().optional().allow("", null),
  search: Joi.string().optional().allow("", null),
  client_id: Joi.number().optional().allow("", null)
});
var AssignClientToAccountManager = exports.AssignClientToAccountManager = Joi.object({
  first_name: Joi.string().optional().allow("", null),
  last_name: Joi.string().optional().allow("", null),
  country_code: Joi.string().optional().allow("", null),
  phone_number: Joi.string().optional().allow("", null),
  address: Joi.string().optional().allow("", null),
  account_manager_id: Joi.number().min(1).required().messages({
    "number.min": "Account manager id can't be 0",
    "any.required": "Account manager is required"
  }),
  client_ids: Joi.array().items(Joi.number().min(1).optional()).optional().allow("", null),
  unassign_client_ids: Joi.array().items(Joi.number().min(1).optional()).optional().allow("", null)
});
var updateAccountManager = exports.updateAccountManager = Joi.object({
  first_name: Joi.string().optional().allow("", null),
  last_name: Joi.string().optional().allow("", null),
  country_code: Joi.string().optional().allow("", null),
  phone_number: Joi.string().optional().allow("", null),
  address: Joi.string().optional().allow("", null)
});
var assignClientsValidator = exports.assignClientsValidator = Joi.object({
  account_manager_id: Joi.number().min(1).required().messages({
    "number.min": "Account manager id can't be 0",
    "any.required": "Account manager id is required"
  }),
  client_ids: Joi.array().items(Joi.number().min(1).required()).required().messages({
    "string.empty": "Client ids cannot be an empty field",
    "any.required": "Client ids is required"
  })
});
var assignAgentsValidator = exports.assignAgentsValidator = Joi.object({
  account_manager_id: Joi.number().min(1).required().messages({
    "number.min": "Account manager id can't be 0",
    "any.required": "Account manager id is required"
  }),
  agent_ids: Joi.array().items(Joi.number().min(1).required()).required().messages({
    "string.empty": "Agent ids cannot be an empty field",
    "any.required": "Agent ids is required"
  })
});
module.exports = {
  createAccountManager: createAccountManager,
  deleteAccountManagerValidator: deleteAccountManagerValidator,
  listAllAccountManager: listAllAccountManager,
  AssignClientToAccountManager: AssignClientToAccountManager,
  updateAccountManager: updateAccountManager,
  assignClientsValidator: assignClientsValidator,
  assignAgentsValidator: assignAgentsValidator
};