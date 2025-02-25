const Joi = require('@hapi/joi')

export const createAgent = Joi.object({
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
  })
})

export const listAllAgents = Joi.object({
  start: Joi.number().min(0).optional().allow("", null),
  limit: Joi.number().optional().allow("", null),
  search: Joi.string().optional().allow("", null),
  client_id: Joi.number().optional().allow("", null),
  group_id: Joi.number().optional().allow("", null),
})


export const createAgentGroup = Joi.object({
  group_name: Joi.string().required().messages({
    "string.empty": "Group name cannot be an empty field",
    "any.required": "Group name is required"
  }),
})

export const AgentGroupList = Joi.object({
  start: Joi.number().min(0).optional().allow("", null),
  limit: Joi.number().optional().allow("", null),
  search: Joi.string().optional().allow("", null),
})

export const AddMemberInAgentGroup = Joi.object({
  group_id: Joi.number().required().messages({
    "any.required": "Group id is required"
  }),
  // agent_ids: Joi.array()
  // .items(Joi.number().min(1).required())
  // .required()
  // .messages({
  //   "string.empty": `Agent ids cannot be an empty field`,
  //   "any.required": "Agent ids is required",
  // }),
  agent_ids: Joi.array()
  .items(Joi.number().min(1).optional())
  .optional().allow("", null),

  delete_agent_ids: Joi.array()
  .items(Joi.number().min(1).optional())
  .optional().allow("", null)
})

export const editAgentGroup = Joi.object({
  group_id: Joi.number().required().messages({
    "any.required": "Group id is required"
  }),
  group_name: Joi.string().required().messages({
    "string.empty": `Group name cannot be an empty field`,
    "any.required": "Group name is required"
  }),
  agent_ids: Joi.array()
  .items(Joi.number().min(1).optional())
  .optional().allow("", null),

  delete_agent_ids: Joi.array()
  .items(Joi.number().min(1).optional())
  .optional().allow("", null)
})

export const DeleteAgentGroup = Joi.object({
  group_id: Joi.number().required().messages({
    "any.required": "Group id is required"
  }),
})


export const DeleteAgentAttachment = Joi.object({
  attachment_id: Joi.number().required().messages({
    "any.required": "Attachment id is required"
  }),
})


export const editAgentInfo = Joi.object({
  first_name: Joi.string().optional().allow("", null),
  last_name: Joi.string().optional().allow("", null),
  phone_number: Joi.string().optional().allow("", null),
  address: Joi.string().optional().allow("", null),
})


export const DeleteAgentGroupMember = Joi.object({
  member_id: Joi.number().required().messages({
    "any.required": "Member id is required"
  }),
})


export const listAllAssignedClients = Joi.object({
  agent_id: Joi.number().min(1).optional().allow("", null),
  start: Joi.number().min(0).optional().allow("", null),
  limit: Joi.number().optional().allow("", null),
  search: Joi.string().optional().allow("", null),
})


export const agentApproveRejectVaidator = Joi.object({
  agent_id: Joi.number().min(1).required().messages({
    "any.required": "Agent id is required"
  }),
  status: Joi.number().min(1).max(2).required().messages({
    "number.min": `Status should be 1-> Approve, 2-> Reject`,
    "any.required": "Status is required"
  }),
  reject_reason: Joi.string().when("status", {
    is: 2,
    then: Joi.required().messages({
      "string.empty": `Reject reason cannot be an empty field`,
      "any.required": "Reject reason is required",
    }),
    otherwise: Joi.optional().allow("", null),
  }),

})

export const addNoteVaidator = Joi.object({
  agent_id: Joi.number().min(1).required().messages({
    "any.required": "Agent id is required"
  }),
  note: Joi.string().required().messages({
    "string.empty": `Note cannot be an empty field`,
    "any.required": "Note is required"
  }),
})


export const listAllAgentNotes = Joi.object({
  agent_id: Joi.number().min(1).required().messages({
    "any.required": "Agent id is required"
  }),
  start: Joi.number().min(0).optional().allow("", null),
  limit: Joi.number().optional().allow("", null),
})


export const editNoteVaidator = Joi.object({
  note: Joi.string().required().messages({
    "string.empty": `Note cannot be an empty field`,
    "any.required": "Note is required"
  }),
})
