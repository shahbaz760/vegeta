const Joi = require('@hapi/joi')

export const taskListValidator = Joi.object({
  project_id: Joi.number().min(1).required().messages({
      "any.required": 'Project id is required'
  }),
  start: Joi.number().optional().allow("", null),
  limit: Joi.number().optional().allow("", null),
  search: Joi.string().optional().allow("", null),
  type: Joi.number().optional().allow("", null),
  filter_name: Joi.string().optional().allow("", null),
  filter_id: Joi.number().optional().allow("", null),
  is_filter_save: Joi.number().min(0).max(1).optional().allow("", null), // if then then save filter
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
})

export const deleteFilesValidator = Joi.object({
    type: Joi.number().min(1).max(3).required().messages({
        "number.min": "Type should be 1=> Voice Recording, 2=> Screen Recording, 3=> Files",
        "number.max": "Type should be 1=> Voice Recording, 2=> Screen Recording, 3=> Files",
        "any.required": 'Type is required'
    }),
    file_id: Joi.number().min(1).required().messages({
        "number.min": "File id can't be 0",
        "any.required": 'File id is required'
    }),
})


export const sortTasks = Joi.object({
  project_column_id: Joi.number().min(1).messages({
    "number.min": "Project column id cannot be an 0",
    "any.required": "Project column id is required"
  }),
  task_ids: Joi.array().items(Joi.number().min(0)).required().messages({
    "number.min": `Task ids can't be zero.`,
    "any.required": 'Task ids is required'
  }),
  parent_task_id: Joi.number().optional().allow("", null),
})

export const moveTasksInColumns = Joi.object({
    project_column_id: Joi.number().min(0).messages({
        "any.required": "Project column id is required"
    }),
    task_id: Joi.number().min(1).messages({
        "number.min": "Task id cannot be an 0",
        "any.required": "Task id is required"
    }),
    column: Joi.string().optional().allow("", null),
})

export const changetaskStatus = Joi.object({
    status: Joi.number().min(1).messages({
        "number.min": "status cannot be an 0",
        "any.required": "status is required"
    }),
    task_id: Joi.number().min(1).messages({
        "number.min": "Task id cannot be an 0",
        "any.required": "Task id is required"
    }),
})


export const taskLabelValidator = Joi.object({
    project_id: Joi.number().min(1).required().messages({
      "number.min": "Project id can't be 0",
      "any.required": "Project id is required"
    }),
    label: Joi.string().required().messages({
      "string.empty": "label cannot be an empty field",
      "any.required": "label is required"
    }),
  })



export const taskLabelListValidator = Joi.object({
    project_id: Joi.number().min(1).required().messages({
      "number.min": "Project id can't be 0",
      "any.required": "Project id is required"
    }),
    start: Joi.number().optional().allow("", null),
    limit: Joi.number().optional().allow("", null),
  })


  export const subTaskListValidator = Joi.object({
    task_id: Joi.number().min(1).required().messages({
        "any.required": 'Task id is required'
    }),
    start: Joi.number().optional().allow("", null),
    limit: Joi.number().optional().allow("", null),
    search: Joi.string().optional().allow("", null),
})

  

