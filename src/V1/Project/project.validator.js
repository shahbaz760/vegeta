const Joi = require('@hapi/joi')

export const createProject = Joi.object({
  name: Joi.string().required().messages({
    "string.empty": "Name cannot be an empty field",
    "any.required": "Name is required"
  }),
  // is_private: Joi.number().min(0).max(1).optional().allow("", null), // 0-> public, 1-> private
  // assign_users: Joi.array().items(Joi.number()).optional().allow("", null),
  is_private: Joi.number().min(0).max(1).required().messages({
    "number.min": "Is private should be 0-> Public, 1-> Private",
    "number.max": "Is private should be 0-> Public, 1-> Private",
    "any.required": "Is private is required"
  }),
  assign_users: Joi.when("is_private", {
    is: 1,
    then: Joi.array()
      .items(Joi.number().min(1).required())
      .required()
      .messages({
        "number.min": "Assign users can't be an empty array",
        "any.required": "Assign users is required",
      }),
    otherwise: Joi.optional().allow(null, ""),
  }),
})

export const listAllProjects = Joi.object({
  start: Joi.number().min(0).optional().allow("", null),
  limit: Joi.number().optional().allow("", null),
  search: Joi.string().optional().allow("", null),
})

export const deleteProject = Joi.object({
  project_id: Joi.number().min(1).required().messages({
    "number.min": "Project id cannot be an 0",
    "any.required": "Project id is required"
  }),
})

export const updateProject = Joi.object({
  name: Joi.string().required().messages({
    "any.required": "Project name cannot be null"
  }),
  // is_private: Joi.number().min(0).max(1).optional().allow("", null), // 0-> public, 1-> private
  // assign_users: Joi.array().items(Joi.number()).optional().allow("", null),
  is_private: Joi.number().min(0).max(1).required().messages({
    "number.min": "Is private should be 0-> Public, 1-> Private",
    "number.max": "Is private should be 0-> Public, 1-> Private",
    "any.required": "Is private is required"
  }),
  assign_users: Joi.when("is_private", {
    is: 1,
    then: Joi.array()
      .items(Joi.number().min(1).required())
      .required()
      .messages({
        "number.min": "Assign users can't be an empty array",
        "any.required": "Assign users is required",
      }),
    otherwise: Joi.optional().allow(null, ""),
  }),
})

//Project Columns data
export const createProjectColumns = Joi.object({
  project_id: Joi.number().min(1).required().messages({
    "number.min": "Project id cannot be an 0",
    "any.required": "Project id is required"
  }),
  name: Joi.string().required().messages({
    "string.empty": "Name cannot be an empty field",
    "any.required": "Name is required"
  })
})

export const listProjectsColumns = Joi.object({
  project_id: Joi.number().min(1).required().messages({
    "number.min": "Project id cannot be an 0",
    "any.required": "Project id is required"
  }),
  start: Joi.number().min(0).optional().allow("", null),
  limit: Joi.number().optional().allow("", null),
  search: Joi.string().optional().allow("", null),
  task_start: Joi.number().min(0).optional().allow("", null),
  task_limit: Joi.number().optional().allow("", null),
  project_column_id: Joi.number().optional().allow("", null),
  filter_name: Joi.string().optional().allow("", null),
  filter_id: Joi.number().optional().allow("", null),
  is_filter: Joi.number().min(0).max(1).optional().allow("", null),
  is_filter_save: Joi.number().min(0).max(1).optional().allow("", null), // if 1 then save filter
  is_view: Joi.number().min(0).max(3).optional().allow("", null), // if then then save filter
  group: Joi.object({
    key: Joi.number().min(0).max(4).optional().allow("", null),
    order: Joi.number().min(0).max(1).optional().allow("", null),
  }).optional(), // Make the entire filter object optional
  sort: Joi.array().items(
    Joi.object({
      key: Joi.number().min(0).max(6).optional().allow(),
      order: Joi.number().min(0).max(1).optional().allow(),
    })
  ),
  filter: Joi.array().items(
    Joi.object({
      applyOp: Joi.string().optional().allow("", null),
      condition: Joi.array().items(
        Joi.object({
          applyOp: Joi.string().optional().allow("", null),
          key: Joi.number().min(0).max(6).optional().allow(),
          op: Joi.number().min(0).max(3).optional().allow("", null),
          value: Joi.array()
          .items(Joi.string().optional())
          .optional().allow("", null),
        })
      )
    })
  ),
  type: Joi.number().min(0).max(1).optional().allow("", null),
})

export const deleteColumn = Joi.object({
  column_id: Joi.number().min(1).messages({
    "number.min": "Column id cannot be an 0",
    "any.required": "Project id is required"
  })
})

export const moveColumn = Joi.object({
  project_id: Joi.number().min(1).messages({
    "number.min": "Project id cannot be an 0",
    "any.required": "Project id is required"
  }),
  column_ids: Joi.array().items(Joi.number().min(0)).required().messages({
    "number.min": `Column ids can't be zero.`,
    "any.required": 'Column ids is required'
  }),
})


export const updateColumn = Joi.object({
  name: Joi.string().required().messages({
    "any.required": "Project name cannot be null"
  }),
})



export const createProjectDoc = Joi.object({
  project_menu_id: Joi.number().required().messages({
    "number.empty": "Project menu id cannot be an empty field",
    "any.required": "Project menu id is required"
  }),
  
  project_id: Joi.number().required().messages({
    "number.empty": "Project id cannot be an empty field",
    "any.required": "Project id is required"
  }),
  name: Joi.string().required().messages({
    "number.empty": "Name cannot be an empty field",
    "any.required": "Name is required"
  }),
  doc_file: Joi.string().optional().allow("", null),
})

export const createProjectWhiteBoard = Joi.object({
  project_menu_id: Joi.number().required().messages({
    "number.empty": "Project menu id cannot be an empty field",
    "any.required": "Project menu id is required"
  }),
  project_id: Joi.number().required().messages({
    "number.empty": "Project id cannot be an empty field",
    "any.required": "Project id is required"
  }),
  name: Joi.string().required().messages({
    "number.empty": "Name cannot be an empty field",
    "any.required": "Name is required"
  }),
  xml_data: Joi.string().optional().allow("", null),
  xml_img: Joi.string().optional().allow("", null),
})

export const addMenu = Joi.object({
  project_id: Joi.number().min(1).required().messages({
    "number.min": "Project id cannot be an 0",
    "any.required": "Project id is required"
  }),
  menu: Joi.array().items(Joi.number().min(0).max(6)).required().messages({
    "number.max": `menu can't be more then 6.`,
    "any.required": 'menu is required'
  }),
})

export const updateProjectMenu = Joi.object({
  uuid: Joi.string().required().messages({
    "number.min": "UUID cannot be an 0",
    "any.required": "UUID is required"
  }),
  name: Joi.string().required().messages({
    "number.min": "Name cannot be an empty field",
    "any.required": "Name is required"
  }),
})


export const editProjectWhiteBoard = Joi.object({
  project_menu_id: Joi.number().required().messages({
    "number.empty": "Project menu id cannot be an empty field",
    "any.required": "Project menu id is required"
  }),
  name: Joi.string().optional().allow("", null),
  xml_data: Joi.string().optional().allow("", null),
  xml_img: Joi.string().optional().allow("", null),
})


export const editProjectDocument = Joi.object({
  project_menu_id: Joi.number().required().messages({
    "number.empty": "Project menu id cannot be an empty field",
    "any.required": "Project menu id is required"
  }),
  name: Joi.string().optional().allow("", null),
  doc_file: Joi.string().optional().allow("", null),
})


export const sortDocOrBoard = Joi.object({
  project_id: Joi.number().min(1).messages({
    "number.min": "Project id cannot be an 0",
    "any.required": "Project id is required"
  }),
  type: Joi.number().min(0).max(1).messages({
    "number.min": "Type should be an 0=> Document, 1=> Whiteboard",
    "number.max": "Type should be an 0=> Document, 1=> Whiteboard",
    "any.required": "Type is required"
  }),
  ids: Joi.array().items(Joi.number().min(0)).required().messages({
    "number.min": `Ids can't be zero.`,
    "any.required": 'Ids is required'
  }),
})


export const sortProjects = Joi.object({
  project_ids: Joi.array().items(Joi.number().min(0)).required().messages({
    "number.min": `Project ids can't be zero.`,
    "any.required": 'Project ids is required'
  }),
})

export const sortProjectMenus = Joi.object({
  project_id: Joi.number().min(1).messages({
    "number.min": "Project id cannot be an 0",
    "any.required": "Project id is required"
  }),
  menu_ids: Joi.array().items(Joi.number().min(0)).required().messages({
    "number.min": `Menu ids can't be zero.`,
    "any.required": 'Menu ids is required'
  }),
});


export const updateFiltervalidator = Joi.object({
  filter_id: Joi.number().required().messages({
    "number.empty": "Filter id cannot be an empty field",
    "any.required": "Filter id is required"
  }),
  name: Joi.string().required().messages({
    "number.empty": "Filter name cannot be empty",
    "any.required": "Filter name is required"
  }),
})


