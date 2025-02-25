const Joi = require('@hapi/joi')



export const supportListValidator = Joi.object({
    start: Joi.number().optional().allow("", null),
    limit: Joi.number().optional().allow("", null),
    search: Joi.string().optional().allow("", null),
});

export const addDepartmentValidator = Joi.object({
    name: Joi.string().required().messages({
        "string.empty": "Name cannot be an empty field",
        "any.required": 'Name is required'
    }),
});

export const departmentListValidator = Joi.object({
    start: Joi.number().optional().allow("", null),
    limit: Joi.number().optional().allow("", null),
    search: Joi.string().optional().allow("", null),
});


export const updateDepartmentValidator = Joi.object({
    department_id: Joi.number().min(1).required().messages({
        "number.min": "Department id cannot be an 0",
        "number.required": 'Department id is required'
    }),
    name: Joi.string().required().messages({
        "string.empty": "Name cannot be an empty field",
        "any.required": 'Name is required'
    }),
});

export const addKeywordValidator = Joi.object({
    key_name: Joi.string().required().messages({
        "string.empty": "keyword name cannot be an empty field",
        "any.required": 'keyword name is required'
    }),
});

export const keywordListValidator = Joi.object({
    start: Joi.number().optional().allow("", null),
    limit: Joi.number().optional().allow("", null),
});


export const updateKeywordValidator = Joi.object({
    keyword_id: Joi.number().min(1).required().messages({
        "number.min": "Keyword id cannot be an 0",
        "number.required": 'Keyword id is required'
    }),
    key_name: Joi.string().required().messages({
        "string.empty": "Keyword name cannot be an empty field",
        "any.required": 'Keyword name is required'
    }),
});


export const addKeywordMailValidator = Joi.object({
    received_by: Joi.string().required().messages({
        "number.min": "Received id cannot be an 0",
        "any.required": 'Received id is required'
    }),
    is_group: Joi.number().optional().allow("", null).default(0).min(0).max(1).message({
        "number.max": "set 1 if chat group id",
        "number.min": "set 0 if personal chat id",
    }),
    receiver_name : Joi.string().optional().allow("", null),
    keywords : Joi.string().optional().allow("", null),
    message :  Joi.string().optional().allow("", null),
    date_time: Joi.date().optional().allow("",null)
});



export const addKeywordNotificationEmailValidator = Joi.object({
    email : Joi.string().optional().allow("", null),
});

export const markAsCloseValidator = Joi.object({
    type: Joi.number().min(0).max(1).required().messages({
        "number.min": "Type should be 0=> Open, 1=> Close",
        "number.max": "Type should be 0=> Open, 1=> Close",
        "number.required": 'Type is required'
    }),
    support_ids: Joi.array().items(Joi.number().min(0)).required().messages({
        "number.min": `Menu ids can't be zero.`,
        "any.required": 'Menu ids is required'
    }),
});


export const updateSupportStatusValidator = Joi.object({
    support_id: Joi.number().min(1).required().messages({
        "number.min": "Support id cannot be an 0",
        "number.required": 'Support id is required'
    }),
    status: Joi.string().required().messages({
        "string.empty": "Status cannot be an empty field",
        "any.required": 'Status name is required'
    }),
});

