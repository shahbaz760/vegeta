const Joi = require('@hapi/joi')

export const createProduct = Joi.object({
  name: Joi.string().required().messages({
    "string.empty": "Name cannot be an empty field",
    "any.required": "Name is required"
  }),
  description: Joi.string().required().messages({
    "string.empty": "Description cannot be an empty field",
    "any.required": "Description is required"
  }),
  unit_price: Joi.number().min(1).required().messages({
    "number.min": "Unit price cannot be an 0",
    "any.required": "Unit price is required"
  }),
  is_private: Joi.number().min(0).max(1).optional().allow("", null),
})

export const listAllProducts = Joi.object({
  start: Joi.number().min(0).optional().allow("", null),
  limit: Joi.number().optional().allow("", null),
  search: Joi.string().optional().allow("", null),
  is_edit : Joi.number().min(0).max(1).optional().allow("", null),
  is_public : Joi.number().min(0).max(1).optional().allow("", null),
})

export const deleteProduct = Joi.object({
  product_id: Joi.number().min(1).required().messages({
    "number.min": "Product id cannot be an 0",
    "any.required": "Product id is required"
  }),
})

export const updateProduct = Joi.object({
  product_id: Joi.number().min(1).required().messages({
    "number.min": "Product id cannot be an 0",
    "any.required": "Product id is required"
  }),
  name: Joi.string().optional().allow("", null),
  description: Joi.string().optional().allow("", null),
  unit_price: Joi.number().optional().allow("", null),
  quantity: Joi.number().optional().allow("", null),
  billing_frequency: Joi.number().optional().allow("", null),
  billing_terms: Joi.number().optional().allow("", null),
  no_of_payments: Joi.number().optional().allow("", null),
  is_delay_in_billing: Joi.number().optional().allow("", null),
  billing_start_date: Joi.string().optional().allow("", null),
  is_private: Joi.number().min(0).max(1).optional().allow("", null),
})

export const createLineItems = Joi.object({
  name: Joi.string().required().messages({
    "string.empty": "Name cannot be an empty field",
    "any.required": "Name is required"
  }),
  description: Joi.string().required().messages({
    "string.empty": "Description cannot be an empty field",
    "any.required": "Description is required"
  }),
  unit_price: Joi.number().min(1).required().messages({
    "number.min": "Unit price cannot be an 0",
    "any.required": "Unit price is required"
  }),
  quantity: Joi.number().min(1).required().messages({
    "number.min": "Quantity cannot be an 0",
    "any.required": "Quantity is required"
  }),
  billing_frequency: Joi.number().min(1).max(7).required().messages({
    "number.min": "Billing frequency should be 1=> one time, 2=> monthly , 3=> quaterly, 4=> semi annually, 5=> annually, 6=> every 1 week, 7=> every 4 weeks",
    "number.max": "Billing frequency should be 1=> one time, 2=> monthly , 3=> quaterly, 4=> semi annually, 5=> annually, 6=> every 1 week, 7=> every 4 weeks",
    "any.required": "Billing frequency is required"
  }),
  billing_terms: Joi.number().min(1).max(2).required().messages({
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
  is_delay_in_billing: Joi.number().min(0).max(1).required().messages({
    "number.min": "Is delay in billing should be 0=> No, 1=> Yes",
    "number.max": "Is delay in billing should be 0=> No, 1=> Yes",
    "any.required": "Is delay in billing is required"
  }),
  billing_start_date: Joi.string().when("is_delay_in_billing", {
    is: 1,
    then: Joi.required().messages({
      "string.empty": `Billing start date cannot be an empty field`,
      "any.required": "Billing start date is required",
    }),
    otherwise: Joi.optional().allow("", null),
  }),
})




