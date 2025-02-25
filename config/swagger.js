const { describe, description } = require("@hapi/joi/lib/base");
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    opneapi: "3.0.0",
    info: {
      description: "RCW-Dashboard Api's.",
      title: "RCW-Dashboard",
      version: "1.0.0",
    },
    host: process.env.API_BASE_URL,
  },
  apis: [],
};

// '../src/user/index'

const swaggerSpec = swaggerJsdoc(options);
swaggerSpec.tags = ["Admin", "Client", "Agent", "Account Manager", "User"];

swaggerSpec.paths = {

  "/auth/login": {
    post: {
      tags: ["Auth"],
      summary: "Login Api",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              email: {
                type: "string",
                default: "admin@yopmail.com",
              },
              password: {
                type: "string",
                default: "Test@123",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
    },
  },

  "/auth/logout": {
    post: {
      tags: ["Auth"],
      summary: "APi for Logout",
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/auth/forgot-password": {
    post: {
      tags: ["Auth"],
      summary: "APi for forgot password",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              email: {
                type: "string",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
    },
  },

  "/otp-verify": {
    post: {
      tags: ["Auth"],
      summary: "APi for verify otp",
      description: "(type=1) => If you verify the two factor authentication OTP then send type =1",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              email: {
                type: "string",
              },
              otp: {
                type: "string",
              },
              type: {
                type: "number",
                default: 0
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
    },
  },

  "/auth/reset-password": {
    post: {
      tags: ["Auth"],
      summary: "APi for reset password",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              email: {
                type: "string",
              },
              password: {
                type: "string",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
    },
  },

  "/auth/change-password": {
    post: {
      tags: ["Auth"],
      summary: "APi for change password",
      description: "Send Type-> 1 for Own Password Change, Type-2 For if admin change client password.",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              type: {
                type: "number",
              },
              client_id: {
                type: "number",
              },
              old_password: {
                type: "string",
              },
              new_password: {
                type: "string",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/auth/refresh-token": {
    get: {
      tags: ["Auth"],
      summary: "Regresh Token  Api",
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/auth/social-login": {
    post: {
      tags: ["Auth"],
      summary: "API for social login",
      description: "social_type should be -> 1 for Google, Type-2 For Facebook.",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              social_id: {
                type: "string",
              },
              social_type: {
                type: "number",
                default: 1
              },
              first_name: {
                type: "string",
              },
              last_name: {
                type: "string",
              },
              email: {
                type: "string",
                default: "admin@yopmail.com",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
    },
  },


  "/user/status-update": {
    post: {
      tags: ["Auth"],
      summary: "APi for update user Status",
      description: "Status should be 1=> Active, 2=Inactive",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              user_id: {
                type: "number",
              },
              status: {
                type: "number",
                default: 1
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },



  "/user/two-factor-authentication": {
    post: {
      tags: ["Auth"],
      summary: "APi for update user two-factor-authentication",
      description: "Status should be 0=> Off, 1=On",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              user_id: {
                type: "number",
              },
              status: {
                type: "number",
                default: 0
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/country-list": {
    get: {
      tags: ["Auth"],
      summary: "country-list api",
      parameters: [
        {
          name: "start",
          in: "query",
          required: false,
          type: "number",
        },
        {
          name: "limit",
          in: "query",
          required: false,
          type: "number",
        }
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      // security: [
      //   {
      //     authorization: [],
      //   },
      // ],
    },
  },

  "/state-list/{country_name}": {
    get: {
      tags: ["Auth"],
      summary: "country-list api",
      parameters: [
        {
          name: "country_name",
          in: "path",
          required: false,
          type: "string",
        },
        {
          name: "start",
          in: "query",
          required: false,
          type: "number",
        },
        {
          name: "limit",
          in: "query",
          required: false,
          type: "number",
        }
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/get-dashboard-count": {
    post: {
      tags: ["Auth"],
      summary: "get-dashboard-count api",
      parameters: [
        {
          name: "body",
          in: "body",
          required: false,
          type: "object",
          schema: {
            properties: {
              type: {
                type: "number",
                default: 0
              },
              start_date: {
                type: "string",
                default: ""
              },
              end_date: {
                type: "string",
                default: ""
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  /**  client section apis */
  "/client/add": {
    post: {
      tags: ["Client-> Admin Side"],
      summary: "APi for Add Client",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              first_name: {
                type: "string",
              },
              last_name: {
                type: "string",
              },
              email: {
                type: "string",
              },
              company_name: {
                type: "string",
              },
              is_welcome_email: {
                type: "number",
                default: 0
              }
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/client/set-password": {
    post: {
      tags: ["Client"],
      summary: "APi for set client password",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              token: {
                type: "string",
              },
              password: {
                type: "string",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
    },
  },

  "/client/detail/{client_id}": {
    get: {
      tags: ["Client-> Admin Side"],
      summary: "APi for get client detail by client_id",
      parameters: [
        {
          name: "client_id",
          in: "path",
          type: "number",
          required: true,
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/client/delete": {
    post: {
      tags: ["Client-> Admin Side"],
      summary: "APi for delete clients by client ids",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              client_ids: {
                type: "array",
                items: {
                  type: "number",
                  default: 2,
                },
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/client/list": {
    post: {
      tags: ["Client-> Admin Side"],
      summary: "APi for get client",
      description: "search--> first_name or last_name, email or company_name \n\n If send type 0 or not send type param All client list return. if type->1  => Active, 2 => Paused, 3=> Cancelled, 4=> Past due",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              start: {
                type: "number",
              },
              limit: {
                type: "number",
                default: 10
              },
              search: {
                type: "string",
              },
              type: {
                type: "number",
                default: 0
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/client/update-profile": {
    put: {
      tags: ["Client-> Admin Side"],
      summary: "APi for update client information",
      consumes: "- multipart/form-data",
      parameters: [
        {
          name: "client_id",
          in: "formData",
          type: "string",
          required: true,
        },
        {
          name: "first_name",
          in: "formData",
          type: "string",
          required: true,
        },
        {
          name: "last_name",
          in: "formData",
          type: "string",
          required: true,
        },
        {
          name: "phone_number",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "company_name",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "address",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "address2",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "country",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "state",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "city",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "zipcode",
          in: "formData",
          type: "number",
          required: false,
        },
        {
          name: "status",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "files",
          in: "formData",
          required: false,
          type: "file",
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/client/set-password-link": {
    post: {
      tags: ["Client-> Admin Side"],
      summary: "APi for send set_password url to the client",
      consumes: "- multipart/form-data",
      parameters: [
        {
          name: "client_id",
          in: "formData",
          type: "number",
          required: true,
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  /**  Agent section apis */

  "/agent/add": {
    post: {
      tags: ["Agent-> Admin Side"],
      summary: "API for Add Agent",
      consumes: "- multipart/form-data",
      parameters: [
        {
          name: "first_name",
          in: "formData",
          type: "string",
          required: true,
        },
        {
          name: "last_name",
          in: "formData",
          type: "string",
          required: true,
        },
        {
          name: "email",
          in: "formData",
          type: "string",
          required: true,
        },
        {
          name: "phone_number",
          in: "formData",
          type: "string",
          required: true,
        },
        {
          name: "address",
          in: "formData",
          type: "string",
          required: true,
        },
        {
          name: "address2",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "country",
          in: "formData",
          type: "string",
          required: true,
        },
        {
          name: "state",
          in: "formData",
          type: "string",
          required: true,
        },
        {
          name: "city",
          in: "formData",
          type: "string",
          required: true,
        },
        {
          name: "zipcode",
          in: "formData",
          type: "number",
          required: true,
        },
        {
          name: "profile_picture",
          in: "formData",
          required: false,
          type: "file",
        },
        {
          name: "files",
          in: "formData",
          required: false,
          type: "file",
        },
        {
          name: "is_welcome_email",
          in: "formData",
          required: false,
          type: "number",
        }
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },




  "/agent/list": {
    post: {
      tags: ["Agent-> Admin Side"],
      summary: "APi for get agent",
      description: "search--> first_name or last_name",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              start: {
                type: "number",
              },
              limit: {
                type: "number",
                default: 10
              },
              search: {
                type: "string",
              },
              client_id: {
                type: "number",
              },
              group_id: {
                type: "number",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/agent/detail/{agent_id}": {
    post: {
      tags: ["Agent-> Admin Side"],
      summary: "APi for get agent detail by agent_id",
      parameters: [
        {
          name: "agent_id",
          in: "path",
          type: "number",
          required: true,
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },



  "/agent/upload-attachments": {
    post: {
      tags: ["Agent-> Admin Side"],
      summary: "API for upload attachments for Agent",
      consumes: "- multipart/form-data",
      parameters: [
        {
          name: "agent_id",
          in: "formData",
          type: "number",
          required: true,
        },
        {
          name: "files",
          in: "formData",
          required: false,
          type: "file",
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/agent/delete-attachment": {
    post: {
      tags: ["Agent-> Admin Side"],
      summary: "API for delete Agent attachment",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              attachment_id: {
                type: "number",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/agent/edit": {
    put: {
      tags: ["Agent-> Admin Side"],
      summary: "API for Edit Agent",
      consumes: "- multipart/form-data",
      parameters: [
        {
          name: "agent_id",
          in: "formData",
          type: "number",
          required: true,
        },
        {
          name: "first_name",
          in: "formData",
          type: "string",
          required: true,
        },
        {
          name: "last_name",
          in: "formData",
          type: "string",
          required: true,
        },
        {
          name: "phone_number",
          in: "formData",
          type: "string",
          required: true,
        },
        {
          name: "address",
          in: "formData",
          type: "string",
          required: true,
        },
        {
          name: "address2",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "country",
          in: "formData",
          type: "string",
          required: true,
        },
        {
          name: "state",
          in: "formData",
          type: "string",
          required: true,
        },
        {
          name: "city",
          in: "formData",
          type: "string",
          required: true,
        },
        {
          name: "zipcode",
          in: "formData",
          type: "number",
          required: true,
        },
        {
          name: "profile_picture",
          in: "formData",
          required: false,
          type: "file",
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },



  /**   Agent Group Section  */
  "/agent-group/add": {
    post: {
      tags: ["Agent Group-> Admin Side"],
      summary: "API for Add Agent Group",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              group_name: {
                type: "string",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/agent-group/list": {
    post: {
      tags: ["Agent Group-> Admin Side"],
      summary: "API for get agent group list",
      description: "search--> group_name",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              start: {
                type: "number",
              },
              limit: {
                type: "number",
                default: 10
              },
              search: {
                type: "string",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/agent-group/addMember": {
    post: {
      tags: ["Agent Group-> Admin Side"],
      summary: "API for Add Members In Agent Group",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              group_id: {
                type: "number",
              },
              agent_ids: {
                type: "array",
                items: {
                  type: "number",
                  default: 1,
                },
              },
              delete_agent_ids: {
                type: "array",
                items: {
                  type: "number",
                  default: 1,
                },
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/agent-group/edit": {
    put: {
      tags: ["Agent Group-> Admin Side"],
      summary: "API for edit Agent Group",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              group_id: {
                type: "number",
              },
              group_name: {
                type: "string",
              },
              agent_ids: {
                type: "array",
                items: {
                  type: "number",
                  default: 1,
                },
              },
              delete_agent_ids: {
                type: "array",
                items: {
                  type: "number",
                  default: 1,
                },
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/agent-group/delete": {
    post: {
      tags: ["Agent Group-> Admin Side"],
      summary: "API for delete Agent Group",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              group_id: {
                type: "number",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/agent-group/{group_id}": {
    get: {
      tags: ["Agent Group-> Admin Side"],
      summary: "APi for get agent group detail",
      parameters: [
        {
          name: "group_id",
          in: "path",
          type: "number",
          required: true,
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/agent-group-member/delete": {
    post: {
      tags: ["Agent Group-> Admin Side"],
      summary: "API for delete Agent attachment",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              member_id: {
                type: "number",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/client/search-agent/{search}": {
    get: {
      tags: ["Client-> Admin Side"],
      summary: "APi for search agents for Assign to client",
      parameters: [
        {
          name: "search",
          in: "path",
          type: "string",
          required: true,
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/client/assign-agents": {
    post: {
      tags: ["Client-> Admin Side"],
      summary: "API for Assign Agents to client",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              client_id: {
                type: "number",
              },
              agent_ids: {
                type: "array",
                items: {
                  type: "number",
                  default: 2,
                },
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/client/assign-agents-list": {
    post: {
      tags: ["Client-> Admin Side"],
      summary: "API for Assign Agents List",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              client_id: {
                type: "number",
              },
              start: {
                type: "number",
              },
              limit: {
                type: "number",
                default: 10
              },
              search: {
                type: "string",
              },
              is_user: {
                type: "number",
                default: 0
              },
              project_id: {
                type: "number",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/client/unassign-agent": {
    post: {
      tags: ["Client-> Admin Side"],
      summary: "API for Assign Agents List",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              client_id: {
                type: "number",
              },
              agent_id: {
                type: "number",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/client/assign-account-manager": {
    post: {
      tags: ["Client-> Admin Side"],
      summary: "API for Assign Account manager to client",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              client_id: {
                type: "number",
              },
              account_manager_ids: {
                type: "array",
                items: {
                  type: "number",
                  default: 2,
                },
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/client/assign-account-manager-list": {
    post: {
      tags: ["Client-> Admin Side"],
      summary: "API for Assign Account Manager List",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              client_id: {
                type: "number",
              },
              start: {
                type: "number",
              },
              limit: {
                type: "number",
                default: 10
              },
              search: {
                type: "string",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/client/unassign-account-manager": {
    post: {
      tags: ["Client-> Admin Side"],
      summary: "API for unAssign Account Manager",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              client_id: {
                type: "number",
              },
              account_manager_id: {
                type: "number",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },




  "/client/search-account-manager/{search}": {
    get: {
      tags: ["Client-> Admin Side"],
      summary: "APi for search account manager for Assign to client",
      parameters: [
        {
          name: "search",
          in: "path",
          type: "string",
          required: true,
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  /**  Account Manager section */

  "/accountManager/add": {
    post: {
      tags: ["Account-Manager-> Admin Side"],
      summary: "API for add account manager",
      consumes: "- multipart/form-data",
      parameters: [
        {
          name: "first_name",
          in: "formData",
          type: "string",
          required: true,
        },
        {
          name: "last_name",
          in: "formData",
          type: "string",
          required: true,
        },
        {
          name: "email",
          in: "formData",
          type: "string",
          required: true,
        },
        {
          name: "phone_number",
          in: "formData",
          type: "string",
          required: true,
        },
        {
          name: "address",
          in: "formData",
          type: "string",
          required: true,
        },
        {
          name: "address2",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "country",
          in: "formData",
          type: "string",
          required: true,
        },
        {
          name: "state",
          in: "formData",
          type: "string",
          required: true,
        },
        {
          name: "city",
          in: "formData",
          type: "string",
          required: true,
        },
        {
          name: "zipcode",
          in: "formData",
          type: "number",
          required: true,
        },
        {
          name: "role_permission_id",
          in: "formData",
          required: true,
          type: "number",
        },
        {
          name: "files",
          in: "formData",
          required: false,
          type: "file",
        },
        {
          name: "is_welcome_email",
          in: "formData",
          required: false,
          type: "number",
        }
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/accountManager/list': {
    post: {
      tags: ["Account-Manager-> Admin Side"],
      summary: "APi for get Account Manager",
      description: "search--> first_name or last_name",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              start: {
                type: "number",
              },
              limit: {
                type: "number",
                default: 10
              },
              search: {
                type: "string",
              },
              client_id: {
                type: "number",
              }
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/accountManager/detail/{accountManager_Id}': {
    get: {
      tags: ["Account-Manager-> Admin Side"],
      summary: "APi for Account Manager Details",
      description: "",
      parameters: [
        {
          name: "accountManager_Id",
          in: "path",
          type: "number",
          required: true,
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/accountManager/delete": {
    post: {
      tags: ["Account-Manager-> Admin Side"],
      summary: "APi for delete Account Manager by Account Manager id",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              accountManger_id: {
                type: "number",
                default: 2,
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/accountManager/update": {
    put: {
      tags: ["Account-Manager-> Admin Side"],
      summary: "API for update account manager",
      consumes: "- multipart/form-data",
      parameters: [
        {
          name: "account_manager_id",
          in: "formData",
          type: "number",
          required: true,
        },
        {
          name: "first_name",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "last_name",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "phone_number",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "address",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "address2",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "country",
          in: "formData",
          type: "string",
          required: true,
        },
        {
          name: "state",
          in: "formData",
          type: "string",
          required: true,
        },
        {
          name: "city",
          in: "formData",
          type: "string",
          required: true,
        },
        {
          name: "zipcode",
          in: "formData",
          type: "number",
          required: true,
        },
        {
          name: "files",
          in: "formData",
          required: false,
          type: "file",
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },



  '/accountManager/AssignClients': {
    post: {
      tags: ["Account-Manager-> Admin Side"],
      summary: "APi for assign Clients to Account Manager or edit api functionality",
      description: "",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              first_name: {
                type: "string",
              },
              last_name: {
                type: "string",
              },
              // country_code: {
              //   type: "string",
              //   default : ""
              // },
              phone_number: {
                type: "string",
              },
              address: {
                type: "string",
              },
              account_manager_id: {
                type: "number",
              },
              client_ids: {
                type: "array",
                items: {
                  type: "number",
                },
              },
              unassign_client_ids: {
                type: "array",
                items: {
                  type: "number",
                },
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  '/accountManager/client-list': {
    get: {
      tags: ["Account-Manager-> Admin Side"],
      summary: "APi for get all clients for Account Manager",
      parameters: [
        {
          name: "account_Manager_id",
          in: "query",
          type: "number",
          required: false,
        },
        {
          name: "type",
          in: "query",
          type: "number",
          required: false,
        },
        {
          name: "search",
          in: "query",
          type: "string",
          required: false,
        },
        {
          name: "start",
          in: "query",
          type: "number",
          required: false,
        },
        {
          name: "limit",
          in: "query",
          type: "number",
          required: false,
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  /** Product section (GLobal) */

  "/product/add": {
    post: {
      tags: ["Product-> Admin Side"],
      summary: "API for Add product",
      description: "is_private (0-> Public, 1-> Private)",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              name: {
                type: "string",
              },
              description: {
                type: "string",
              },
              unit_price: {
                type: "number",
                default: 1.00
              },
              is_private: {
                type: "number",
                default: 1
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/product/list': {
    post: {
      tags: ["Product-> Admin Side"],
      summary: "API for Get Product List",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              start: {
                type: "number",
              },
              limit: {
                type: "number",
                default: 10
              },
              search: {
                type: "",
              },
              is_edit: {
                type: "number",
                default: 0
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },



  '/public-product/list': {
    post: {
      tags: ["Product-> Admin Side"],
      summary: "API for Get Public Product List",
      description: "search--> name",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              start: {
                type: "number",
              },
              limit: {
                type: "number",
                default: 10
              },
              search: {
                type: "",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
    },
  },

  '/product/detail/{product_id}': {
    get: {
      tags: ["Product-> Admin Side"],
      summary: "API for Get Product detail",
      parameters: [
        {
          name: "product_id",
          in: "path",
          type: "number",
          required: true,
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/product/delete': {
    delete: {
      tags: ["Product-> Admin Side"],
      summary: "API for Product delete",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              product_id: {
                type: "number",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/product/update': {
    put: {
      tags: ["Product-> Admin Side"],
      summary: "API for update Product info",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              product_id: {
                type: "number",
              },
              name: {
                type: "string",
              },
              description: {
                type: "string",
              },
              unit_price: {
                type: "number",
                default: 1.00
              },
              quantity: {
                type: "number",
                default: 1
              },
              billing_frequency: {
                type: "number",
                default: 1
              },
              billing_terms: {
                type: "number",
                default: 1
              },
              no_of_payments: {
                type: "number",
                default: 0
              },
              is_delay_in_billing: {
                type: "number",
                default: 0
              },
              billing_start_date: {
                type: "string",
                default: "2024-09-04"
              },
              is_private: {
                type: "number",
                default: 1
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  /**  Product Line Item  */
  "/line-item/add": {
    post: {
      tags: ["Product-> Admin Side"],
      summary: "API for Add line item",
      description: "<b>billing_frequency</b> should be 1=> one time, 2=> monthly , 3=> quaterly, 4=> semi annually, 5=> annually \n\n <b>billing_terms</b> should be 1=> Fixed number of payments, 2=> Automatically renew until cancelled \n\n If <b>billing_terms</b> => 1 then <b>no_of_payments</b> is required \n\n <b>is_delay_in_billing</b> should be 0=> No, 1=> Yes \n\n if <b>is_delay_in_billing</b> => 1 then <b>billing_start_date</b> is required.",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              name: {
                type: "string",
              },
              description: {
                type: "string",
              },
              unit_price: {
                type: "number",
                default: 1.00
              },
              quantity: {
                type: "number",
                default: 1
              },
              billing_frequency: {
                type: "number",
                default: 1
              },
              billing_terms: {
                type: "number",
                default: 1
              },
              no_of_payments: {
                type: "number",
                default: 0
              },
              is_delay_in_billing: {
                type: "number",
                default: 0
              },
              billing_start_date: {
                type: "string",
                default: ""
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  /**  Add subscription for client  */
  "/client/add-subscription": {
    post: {
      tags: ["Subscription For Client-> Admin Side"],
      summary: "API for Add subscription for client",
      description: "<b>billing_frequency</b> should be 1=> one time, 2=> monthly , 3=> quaterly, 4=> semi annually, 5=> annually \n\n <b>billing_terms</b> should be 1=> Fixed number of payments, 2=> Automatically renew until cancelled \n\n If <b>billing_terms</b> => 1 then <b>no_of_payments</b> is required \n\n <b>is_delay_in_billing</b> should be 0=> No, 1=> Yes \n\n if <b>is_delay_in_billing</b> => 1 then <b>billing_start_date</b> is required.",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              client_id: {
                type: "number",
              },
              title: {
                type: "string",
              },
              subscription_data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    product_id: {
                      type: "number",
                      default: 1,
                    },
                    unit_price: {
                      type: "number",
                      default: 1.00
                    },
                    unit_discount_type: {
                      type: "number",
                    },
                    unit_discount: {
                      type: "number",
                    },
                    net_price: {
                      type: "number",
                    },
                    quantity: {
                      type: "number",
                      default: 1
                    },
                    billing_frequency: {
                      type: "number",
                      default: 1
                    },
                    billing_terms: {
                      type: "number",
                      default: 2
                    },
                    no_of_payments: {
                      type: "number",
                      default: 0
                    },
                    is_delay_in_billing: {
                      type: "number",
                      default: 0
                    },
                    billing_start_date: {
                      type: "string",
                      default: ""
                    },
                  },

                },
              },
              is_manual_payment: {
                type: "number",
                default: 0
              },
              one_time_discount_name: {
                type: "string",
              },
              one_time_discount_type: {
                type: "number",
              },
              one_time_discount: {
                type: "number",
              },
              subtotal: {
                type: "number",
              },
              total_price: {
                type: "number",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/client/subscription-list': {
    post: {
      tags: ["Subscription For Client-> Admin Side"],
      summary: "APi for get client subscription list",
      description: "search--> first_name or last_name",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              client_id: {
                type: "number",
              },
              start: {
                type: "number",
              },
              limit: {
                type: "number",
                default: 10
              },
              search: {
                type: "",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  '/client/subscription-detail/{subscription_id}': {
    get: {
      tags: ["Subscription For Client-> Admin Side"],
      summary: "APi for get client subscription detail",
      parameters: [
        {
          name: "subscription_id",
          in: "path",
          required: true,
          type: "number",
        },
        {
          name: "is_createdAt",
          in: "query",
          required: false,
          type: "number",
        }
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  /** Project section Apis */

  "/project/add": {
    post: {
      tags: ["Project"],
      summary: "API for Add [project]",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              name: {
                type: "string",
              },
              is_private: {
                type: "number",
                default: 0
              },
              assign_users: {
                type: "array",
                items: {
                  type: "number",
                  default: 1,
                },
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/project/list': {
    post: {
      tags: ["Project"],
      summary: "API for Get Project List",
      description: "search--> Project_name",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              start: {
                type: "number",
              },
              limit: {
                type: "number",
                default: 10
              },
              search: {
                type: "string",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/project/delete': {
    delete: {
      tags: ["Project"],
      summary: "API for Project delete",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              project_id: {
                type: "number",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/project/update/{project_id}': {
    put: {
      tags: ["Project"],
      summary: "API for update Project info",
      parameters: [
        {
          name: "project_id",
          in: "path",
          required: true,
          type: "number",
        },
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              name: {
                type: "string",
              },
              is_private: {
                type: "number",
                default: 0
              },
              assign_users: {
                type: "array",
                items: {
                  type: "number",
                  default: 1,
                },
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/project/detail/{project_id}': {
    get: {
      tags: ["Project"],
      summary: "API for Get Project detail",
      parameters: [
        {
          name: "project_id",
          in: "path",
          type: "number",
          required: true,
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/project/column/add": {
    post: {
      tags: ["Project Column"],
      summary: "API for Add [project column]",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              project_id: {
                type: "number",
              },
              name: {
                type: "string",
              }
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/project/columns/list': {
    post: {
      tags: ["Project Column"],
      summary: "API for Get Project Columns List",
      description: "If tasks scroll then send project column id otherwise sent it 0, \n\n If is_filter-> 1 then data return acc. to filter, \n\n In group Object (Key should be (0=>status, 1=>Assignee, 2=>Priority, 3=>Tags, 4=>due date) and order should be (0=> Ascending, 1=> Descending) \n\n  In sort send array of objects if sort otherwise empty send empty sort arrya. (Key should be (1=>Task Title, 2=> Status, 3=>Assignee, 4=>Priority, 5=>Tags, 6=>due date)) and (order should be (0=> Ascending, 1=> Descending)) \n\n\n  In case of filter --> applyOp should be OR , AND otherwise '' \n Key should be (0=>status, 1=>Assignee, 2=>Priority, 3=>Tags, 4=>due date, 5 => Created By) \n op should be (0=> is, 1=> is not 2=> is set, 3=> is not set) and send  value in array like [1,2,3] or ['high', 'medium'] \n\n is_filter_save if send 1 then it saves the filter \n\n for is_view -> 0-> Kanban, 1-> Task Table, 2-> Task List, 3-> Calendar",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              project_id: {
                type: "number",
                default: 1
              },
              start: {
                type: "number",
              },
              limit: {
                type: "number",
                default: 10
              },
              search: {
                type: "string",
                default: ""
              },
              task_start: {
                type: "number",
              },
              task_limit: {
                type: "number",
                default: 10
              },
              project_column_id: {
                type: "number",
                default: 0
              },
              filter_name: {
                type: "string",
                default: ""
              },
              filter_id: {
                type: "number",
                default: 0
              },
              is_filter: {
                type: "number",
                default: 0
              },
              is_filter_save: {
                type: "number",
                default: 0,
                comment: "If 1 then save filter"
              },
              is_view: {
                type: "number",
                default: 0,
                comment: "0-> Kanban, 1-> Task Table, 2-> Task List, 3-> Calendar"
              },
              group: {
                type: "object",
                description: "Filter users based on specific criteria",
                properties: {
                  key: {
                    type: "number",
                    description: "Key should be (0=>status, 1=>Assignee, 2=>Priority, 3=>Tags, 4=>due date)",
                  },
                  order: {
                    type: "number",
                    description: "order should be (0=> Ascending, 1=> Descending)",
                  },
                },
              },
              sort: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    key: {
                      type: "number",
                      default: 1,
                      description: "key should be (1=> Task Title, 2=> status, 3=> Assignee, 4=> Priority, 5=> Labels, 6=> Due date)",
                    },
                    order: {
                      type: "number",
                      default: 0,
                      description: "order should be (0=> Ascending, 1=> Descending)",
                    },
                  },
                },
              },
              filter: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    applyOp: {
                      type: "string",
                      default: "",
                      description: "applyOp should be OR , AND otherwise ''",
                    },
                    condition: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          applyOp: {
                            type: "string",
                            default: "",
                            description: "applyOp should be OR , AND otherwise empty string ''",
                          },
                          key: {
                            type: "number",
                            default: 0,
                            description: "Key should be (0=>status, 1=>Assignee, 2=>Priority, 3=>Tags, 4=>due date, 5 => Created By)",
                          },
                          op: {
                            type: "number",
                            default: 0,
                            description: "op should be (0=> is, 1=> is not 2=> is set, 3=> is not set)",
                          },
                          value: {
                            type: "array",
                            items: {
                              type: "string",
                              default: "1",
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/column/delete/{column_id}': {
    delete: {
      tags: ["Project Column"],
      summary: "API for Project delete",
      parameters: [
        {
          name: "column_id",
          in: "path",
          type: "number",
          required: true
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/column/update/{column_id}': {
    put: {
      tags: ["Project Column"],
      summary: "API for update Project Column info",
      parameters: [
        {
          name: "column_id",
          in: "path",
          required: true,
          type: "number",
        },
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              name: {
                type: "string",
              }
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/project/column/detail/{column_id}': {
    get: {
      tags: ["Project Column"],
      summary: "API for Get Project Column detail",
      parameters: [
        {
          name: "column_id",
          in: "path",
          type: "number",
          required: true,
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/project/column-move": {
    post: {
      tags: ["Project Column"],
      summary: "APi for move project columns left right",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              project_id: {
                type: "number",
                default: 2,
              },
              column_ids: {
                type: "array",
                items: {
                  type: "number",
                  default: 2,
                },
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/client/set-default-account-manager": {
    post: {
      tags: ["Client-> Admin Side"],
      summary: "API for set Account manager as default",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              client_id: {
                type: "number",
              },
              account_manager_id: {
                type: "number",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/agent-group-members": {
    post: {
      tags: ["Agent Group-> Admin Side"],
      summary: "APi for get agent group detail",
      consumes: "- multipart/form-data",
      parameters: [
        {
          name: "body",
          in: "body",
          type: "object",
          required: true,
          schema: {
            properties: {
              group_id: {
                type: "number",
              },
              start: {
                type: "number",
              },
              limit: {
                type: "number",
                default: 10
              },
            }
          }
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },





  /**  Project task apis  */

  "/project/task/add": {
    post: {
      tags: ["Project Task"],
      summary: "API for Add task",
      consumes: "- multipart/form-data",
      description: "if add sub task then add task_id in a parent_task_id param, Send label_id in labels field in comma seprated",
      parameters: [
        {
          name: "parent_task_id",
          in: "formData",
          type: "number",
          required: false,
        },
        {
          name: "project_id",
          in: "formData",
          type: "number",
          required: true,
        },
        {
          name: "project_column_id",
          in: "formData",
          type: "number",
          required: true,
        },
        {
          name: "title",
          in: "formData",
          type: "string",
          required: true,
        },
        {
          name: "description",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "priority",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "labels",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "status",
          in: "formData",
          type: "number",
          required: false,
        },
        {
          name: "agent_ids",
          in: "formData",
          type: "string",
          required: false,
          default: "4,5",
        },
        {
          name: "voice_record_file",
          in: "formData",
          required: false,
          type: "file",
        },
        {
          name: "files",
          in: "formData",
          required: false,
          type: "file",
        },
        {
          name: "screen_record_file",
          in: "formData",
          required: false,
          type: "file",
        },
        {
          name: "due_date_time",
          in: "formData",
          type: "string",
          required: false,
          default: "2024-09-06"
        },
        {
          name: "business_due_date",
          in: "formData",
          type: "string",
          required: false,
          default: "In 1 bussiness day"
        },
        {
          name: "reminders",
          in: "formData",
          type: "string",
          required: false,
          default: "2024-09-06"
        },
        {
          name: "group_id",
          in: "formData",
          type: "number",
          required: false,
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },

  },


  "/project/task/list": {
    post: {
      tags: ["Project Task"],
      summary: "API for get task list",
      description: "If sent type 1 then only those tasks return which have due date time. otherwise sent 0",
      parameters: [
        {
          name: "body",
          in: "body",
          type: "object",
          required: true,
          schema: {
            properties: {
              project_id: {
                type: "number",
              },
              start: {
                type: "number",
              },
              limit: {
                type: "number",
                default: 10
              },
              search: {
                type: "string",
                default: ""
              },
              type: {
                type: "number",
                default: 0
              },
              filter_id: {
                type: "number",
                default: 0
              },
              filter_name: {
                type: "string",
                default: ""
              },
              is_filter_save: {
                type: "number",
                default: 0,
                comment: "If 1 then save filter"
              },
              is_view: {
                type: "number",
                default: 0,
                comment: "0-> Kanban, 1-> Task Table, 2-> Task List, 3-> Calendar"
              },
              group: {
                type: "object",
                description: "Filter users based on specific criteria",
                properties: {
                  key: {
                    type: "number",
                    description: "Key should be (0=>status, 1=>Assignee, 2=>Priority, 3=>Tags, 4=>due date)",
                  },
                  order: {
                    type: "number",
                    description: "order should be (0=> Ascending, 1=> Descending)",
                  },
                },
              },
              sort: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    key: {
                      type: "number",
                      default: 1,
                      description: "key should be (1=> Task Title, 2=> status, 3=> Assignee, 4=> Priority, 5=> Labels, 6=> Due date)",
                    },
                    order: {
                      type: "number",
                      default: 0,
                      description: "order should be (0=> Ascending, 1=> Descending)",
                    },
                  },
                },
              },
              filter: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    applyOp: {
                      type: "string",
                      default: "",
                      description: "applyOp should be OR , AND otherwise ''",
                    },
                    condition: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          applyOp: {
                            type: "string",
                            default: "",
                            description: "applyOp should be OR , AND otherwise empty string ''",
                          },
                          key: {
                            type: "number",
                            default: 0,
                            description: "Key should be (0=>status, 1=>Assignee, 2=>Priority, 3=>Tags, 4=>due date, 5 => Created By)",
                          },
                          op: {
                            type: "number",
                            default: 0,
                            description: "op should be (0=> is, 1=> is not 2=> is set, 3=> is not set)",
                          },
                          value: {
                            type: "array",
                            items: {
                              type: "string",
                              default: "1",
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            }
          }
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/project/task-detail/{task_id}": {
    get: {
      tags: ["Project Task"],
      summary: "API for get task detail",
      parameters: [
        {
          name: "task_id",
          in: "path",
          type: "number",
          required: true,
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/project/task-delete/{task_id}": {
    delete: {
      tags: ["Project Task"],
      summary: "API for delete task",
      parameters: [
        {
          name: "task_id",
          in: "path",
          type: "number",
          required: true,
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/project/task/edit": {
    post: {
      tags: ["Project Task"],
      summary: "API for Edit task",
      consumes: "- multipart/form-data",
      description: "Send label_id in labels field in comma seprated",
      parameters: [
        {
          name: "task_id",
          in: "formData",
          type: "number",
          required: true,
        },
        {
          name: "title",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "description",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "priority",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "labels",
          in: "formData",
          type: "string",
          required: false,
          default: "1,2",
        },
        {
          name: "status",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "agent_ids",
          in: "formData",
          type: "string",
          required: false,
          default: "4,5",
        },
        {
          name: "voice_record_file",
          in: "formData",
          required: false,
          type: "file",
        },
        {
          name: "files",
          in: "formData",
          required: false,
          type: "file",
        },
        {
          name: "screen_record_file",
          in: "formData",
          required: false,
          type: "file",
        },
        {
          name: "due_date_time",
          in: "formData",
          type: "string",
          required: false,
          default: "2024-09-06"
        },
        {
          name: "business_due_date",
          in: "formData",
          type: "string",
          required: false,
          default: "In 1 bussiness day"
        },
        {
          name: "reminders",
          in: "formData",
          type: "string",
          required: false,
          default: "2024-09-06"
        },
        {
          name: "delete_agent_ids",
          in: "formData",
          type: "string",
          required: false,
          default: "1,2",
        },
        {
          name: "delete_file_ids",
          in: "formData",
          type: "string",
          required: false,
          default: "1,2",
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },

  },


  "/project/task/delete-files": {
    post: {
      tags: ["Project Task"],
      summary: "API for delete task files",
      description: "type=1 (voice_record_file) \n\n type=2 (screen_record_file) \n\n type=3 (files)\n\n If type 1 and 2 then send task_id in a file_id param. If type =>3 then send file_id of files.",
      parameters: [
        {
          name: "body",
          in: "body",
          type: "object",
          required: true,
          schema: {
            properties: {
              type: {
                type: "number",
                default: 1
              },
              file_id: {
                type: "number",
              },
            }
          }
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/project/task/sort": {
    post: {
      tags: ["Project Task"],
      summary: "APi for sort task up-down",
      description: "sort tasks within the column up-down",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              project_column_id: {
                type: "number",
                default: 2,
              },
              task_ids: {
                type: "array",
                items: {
                  type: "number",
                  default: 2,
                },
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/project/task/move-in-column": {
    post: {
      tags: ["Project Task"],
      summary: "APi for move task left right column to column",
      description: "move tasks from one column to another column left right \n\n  Key should be (0=>status, 1=>Assignee, 2=>Priority, 3=>Tags, 4=>due date) ",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              project_column_id: {
                type: "number",
                default: 2,
              },
              task_id: {
                type: "number",
                default: 2,
              },
              column: {
                type: "string",
                default: "",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  '/project/columns/task-status/{project_id}': {
    get: {
      tags: ["Project Task"],
      summary: "API for Get Project Columns status",
      parameters: [
        {
          name: "project_id",
          in: "path",
          required: true,
          type: "number",
        }
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/project/complete-task/{task_id}": {
    get: {
      tags: ["Project Task"],
      summary: "APi for move task left right column to column",
      description: "complete task",
      parameters: [
        {
          name: "task_id",
          in: "path",
          required: true,
          type: "number",
        }
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  /** ----------- Agent Section API ----------- */

  "/agent/upload-kyc": {
    post: {
      tags: ["Agent-> On Board"],
      summary: "API for upload kyc for Agent",
      consumes: "- multipart/form-data",
      parameters: [
        {
          name: "front_id",
          in: "formData",
          type: "file",
          required: true,
        },
        {
          name: "back_id",
          in: "formData",
          required: true,
          type: "file",
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/agent/capture-image": {
    post: {
      tags: ["Agent-> On Board"],
      summary: "API for upload capture image for Agent",
      consumes: "- multipart/form-data",
      parameters: [
        {
          name: "files",
          in: "formData",
          type: "file",
          required: false,
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/get-assigned-userIds": {
    get: {
      tags: ["Agent-> On Board"],
      summary: "APi for get user ids",
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/project/assigned-userIds/{project_id}": {
    get: {
      tags: ["Agent-> On Board"],
      summary: "APi for get user ids for project",
      parameters: [
        {
          name: "project_id",
          in: "path",
          type: "number",
          required: true,
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/agent/complete-profile": {
    get: {
      tags: ["Agent-> On Board"],
      summary: "API for complete profile of Agent",
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  /** project task apis------------- */

  '/project/task/status-update': {
    post: {
      tags: ["Project Task"],
      summary: "APi for update task status",
      description: "update tasks status",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              status: {
                type: "number",
                default: 2,
              },
              task_id: {
                type: "number",
                default: 2,
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/project/document/add": {
    post: {
      tags: ["Project Document"],
      summary: "APi for Add Product Document",
      description: "add Product Document",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              project_menu_id: {
                type: "number",
                default: 2
              },
              project_id: {
                type: "number",
                default: 2,
              },
              name: {
                type: "string",
              },
              doc_file: {
                type: "string",
              }
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/project/WhiteBoard/add": {
    post: {
      tags: ["Project Whiteboard"],
      summary: "APi for Add Project WhiteBoard",
      description: "add Project WhiteBoard",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              project_menu_id: {
                type: "number",
                default: 2
              },
              project_id: {
                type: "number",
                default: 2
              },
              name: {
                type: "string"
              },
              xml_data: {
                type: "string"
              },
              xml_img: {
                type: "string"
              }
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/project/document/get/{project_menu_id}": {
    get: {
      tags: ["Project Document"],
      summary: "APi for get Project Document",
      description: "get Project Document",
      parameters: [
        {
          name: "project_menu_id",
          in: "path",
          required: true,
          type: "string",
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/project/whiteboard/get/{project_menu_id}": {
    get: {
      tags: ["Project Whiteboard"],
      summary: "API for get Project Whiteboard",
      description: "get Project Whiteboard",
      parameters: [
        {
          name: "project_menu_id",
          in: "path",
          required: true,
          type: "number",
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/project/enable-menu": {
    post: {
      tags: ["Project menu"],
      summary: "APi for Add Project menu",
      description: "Send Menu id for 1=> chat, 2=> Docuemnt, 3=> whiteboard,  4=> Kanban Board, 5=> Task Table, 6=> Task List, 7=> Calendar",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              project_id: {
                type: "number",
                default: 2
              },
              menu: {
                type: "array",
                items: {
                  type: "number",
                  default: 0
                }
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/project/menu-list/{project_id}": {
    get: {
      tags: ["Project menu"],
      summary: "APi for Get Project menu",
      description: "Get Project menu",
      parameters: [
        {
          name: "project_id",
          in: "path",
          required: true,
          type: "number",
        }
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/client/recent-activity": {
    get: {
      tags: ["Client"],
      summary: "APi for get recent-activity for client",
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/client/task-list": {
    get: {
      tags: ["Client"],
      summary: "APi for get today due date task list for client",
      parameters: [
        {
          name: "start",
          in: "query",
          required: false,
          type: "number",
        },
        {
          name: "limit",
          in: "query",
          required: false,
          type: "number",
        },
        {
          name: "date",
          in: "query",
          required: false,
          type: "string",
        }
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/project/task-label/add": {
    post: {
      tags: ["Project Task"],
      summary: "API for add task label",
      parameters: [
        {
          name: "body",
          in: "body",
          type: "object",
          required: true,
          schema: {
            properties: {
              project_id: {
                type: "number",
              },
              label: {
                type: "string",
                default: ""
              },
            }
          }
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/project/task-label/list": {
    post: {
      tags: ["Project Task"],
      summary: "API for get list task label",
      parameters: [
        {
          name: "body",
          in: "body",
          type: "object",
          required: true,
          schema: {
            properties: {
              project_id: {
                type: "number",
              },
              start: {
                type: "number",
                default: 0
              },
              limit: {
                type: "number",
                default: 10
              },
            }
          }
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/project/sub-task/list": {
    post: {
      tags: ["Project Task"],
      summary: "API for get sub task list",
      parameters: [
        {
          name: "body",
          in: "body",
          type: "object",
          required: true,
          schema: {
            properties: {
              task_id: {
                type: "number",
              },
              start: {
                type: "number",
              },
              limit: {
                type: "number",
                default: 10
              },
              search: {
                type: "string",
                default: ""
              },
            }
          }
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/resend-otp": {
    post: {
      tags: ["Auth"],
      summary: "APi for resend-otp",
      description: "(type=1) => If you resend the two factor authentication OTP then send type =1",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              email: {
                type: "string",
              },
              type: {
                type: "number",
                default: 0
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
    },
  },



  "/project/sub-task-detail/{task_id}": {
    get: {
      tags: ["Project Task"],
      summary: "API for get sub task detail",
      parameters: [
        {
          name: "task_id",
          in: "path",
          type: "number",
          required: true,
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/client/add-password-manager": {
    post: {
      tags: ["Client"],
      summary: "APi for creating password manager ",
      description: "create password manager for client",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              site_name: {
                type: "string",
              },
              user_name: {
                type: "string",
              },
              password: {
                type: "string"
              },
              agent_ids: {
                type: "array",
                items: {
                  type: "number",
                  default: 0
                },
              }
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/client/list-password-manager": {
    post: {
      tags: ["Client"],
      summary: "APi for List of password manager ",
      description: "list password manager for client and agent",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              search: {
                type: "string",
              },
              start: {
                type: "number",
                default: 0
              },
              limit: {
                type: "number",
                default: 10
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/client/update-password-manager': {
    put: {
      tags: ["Client"],
      summary: "APi for List of password manager ",
      description: "list password manager for client",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              password_manager_id: {
                type: "number",
              },
              user_name: {
                type: "string",
              },
              site_name: {
                type: "string",
              },
              password: {
                type: "string"
              },
              agent_ids: {
                type: "array",
                items: {
                  type: "number",
                  default: 0
                },
              }
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/client/delete-password-manager/{password_manager_id}': {
    delete: {
      tags: ["Client"],
      summary: "APi for deletion of password manager and its assigned Agents",
      parameters: [
        {
          name: "password_manager_id",
          in: "path",
          type: "number",
          required: true,
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/client/details-password-manager/{password_manager_id}": {
    get: {
      tags: ["Client"],
      summary: "APi for get details of password manager and its assigned Agents",
      parameters: [
        {
          name: "password_manager_id",
          in: "path",
          type: "number",
          required: true,
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/client/shared-file-upload': {
    post: {
      tags: ["Client"],
      summary: "API for shared file upload by client",
      consumes: "- multipart/form-data",
      parameters: [
        {
          name: "file_name",
          in: "formData",
          type: "string",
          required: true,
        },
        {
          name: "file",
          in: "formData",
          required: false,
          type: "file",
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/client/shared-file-delete/{file_id}': {
    delete: {
      tags: ["Client"],
      summary: "APi for get deletion of shared File",
      parameters: [
        {
          name: "file_id",
          in: "path",
          type: "number",
          required: true,
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/client/shared-files-list': {
    post: {
      tags: ["Client"],
      summary: "APi for List of shared file ",
      description: "list of shared file",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              search: {
                type: "string",
              },
              start: {
                type: "number",
                default: 0
              },
              limit: {
                type: "number",
                default: 10
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/project-menu/detail/{uuid}": {
    get: {
      tags: ["Project menu"],
      summary: "APi for Get Project menu detail",
      parameters: [
        {
          name: "uuid",
          in: "path",
          required: true,
          type: "string",
        }
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/project-menu/update": {
    put: {
      tags: ["Project menu"],
      summary: "APi for update Project menu",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              uuid: {
                type: "string",
                default: ""
              },
              name: {
                type: "string",
                default: ""
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/project/task-group-detail/{task_id}": {
    get: {
      tags: ["Project Task"],
      summary: "API for get task group detail",
      parameters: [
        {
          name: "task_id",
          in: "path",
          type: "number",
          required: true,
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/user-profile/details': {
    get: {
      tags: ["Auth"],
      summary: "get user profile details",
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/user-profile/update': {
    put: {
      tags: ["Auth"],
      summary: "API for Update user Profile",
      consumes: "- multipart/form-data",
      parameters: [
        {
          name: "first_name",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "last_name",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "phone_number",
          in: "formData",
          type: "number",
          required: false,
        },
        {
          name: "address1",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "address2",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "city",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "state",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "zipcode",
          in: "formData",
          type: "number",
          required: false,
        },
        {
          name: "country",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "files",
          in: "formData",
          required: false,
          type: "file",
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  /** Support Section */

  '/support/add': {
    post: {
      tags: ["Support"],
      summary: "API for Add Supports",
      consumes: "- multipart/form-data",
      parameters: [
        {
          name: "department_id",
          in: "formData",
          type: "number",
          required: true,
        },
        {
          name: "subject",
          in: "formData",
          type: "string",
          required: true,
        },
        {
          name: "message",
          in: "formData",
          type: "string",
          required: true,
        },
        {
          name: "status",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "priority",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "files",
          in: "formData",
          required: false,
          type: "file",
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/support/list': {
    post: {
      tags: ["Support"],
      summary: "APi for List of support data ",
      description: "list of support data",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              search: {
                type: "string",
              },
              start: {
                type: "number",
                default: 0
              },
              limit: {
                type: "number",
                default: 10
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/support/details/{support_id}': {
    get: {
      tags: ["Support"],
      summary: "API for get Support detail",
      parameters: [
        {
          name: "support_id",
          in: "path",
          type: "number",
          required: true,
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/support/delete/{support_id}': {
    delete: {
      tags: ["Support"],
      summary: "API for delete Support detail and its attachments",
      parameters: [
        {
          name: "support_id",
          in: "path",
          type: "number",
          required: true,
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/support/update': {
    put: {
      tags: ["Support"],
      summary: "API for Add Supports",
      consumes: "- multipart/form-data",
      parameters: [
        {
          name: "support_id",
          in: "formData",
          type: "number",
          required: true,
        },
        {
          name: "department_id",
          in: "formData",
          type: "number",
          required: true,
        },
        {
          name: "subject",
          in: "formData",
          type: "string",
          required: true,
        },
        {
          name: "message",
          in: "formData",
          type: "string",
          required: true,
        },
        {
          name: "status",
          in: "formData",
          type: "string",
          required: true,
        },
        {
          name: "priority",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "files",
          in: "formData",
          required: false,
          type: "file",
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  '/support/delete-attachment/{attachment_id}': {
    delete: {
      tags: ["Support"],
      summary: "API for delete Support attachment",
      parameters: [
        {
          name: "attachment_id",
          in: "path",
          type: "number",
          required: true,
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  '/user-role/list': {
    get: {
      tags: ["Support"],
      summary: "API for get user role list",
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  /** Department section */

  '/department/add': {
    post: {
      tags: ["Department -> Admin Side"],
      summary: "APi for add Department ",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              name: {
                type: "string",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  '/department/list': {
    post: {
      tags: ["Department -> Admin Side"],
      summary: "APi for get Department list",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              search: {
                type: "string",
              },
              start: {
                type: "number",
                default: 0
              },
              limit: {
                type: "number",
                default: 10
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  '/department/details/{department_id}': {
    get: {
      tags: ["Department -> Admin Side"],
      summary: "API for get department detail",
      parameters: [
        {
          name: "department_id",
          in: "path",
          type: "number",
          required: true,
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/department/delete/{department_id}': {
    delete: {
      tags: ["Department -> Admin Side"],
      summary: "API for delete department",
      parameters: [
        {
          name: "department_id",
          in: "path",
          type: "number",
          required: true,
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/department/update': {
    put: {
      tags: ["Department -> Admin Side"],
      summary: "API for update department",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              department_id: {
                type: "number",
                default: 1
              },
              name: {
                type: "string",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  /** User section  */

  '/user/add': {
    post: {
      tags: ["User"],
      summary: "API for Add User",
      consumes: "- multipart/form-data",
      parameters: [
        {
          name: "first_name",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "last_name",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "email",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "password",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "user_role",
          in: "formData",
          type: "number",
          required: false,
        },
        {
          name: "files",
          in: "formData",
          required: false,
          type: "file",
        },
        {
          name: "role_permission_id",
          in: "formData",
          required: true,
          type: "number",
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/users/detail/{user_id}': {
    get: {
      tags: ["User"],
      summary: "API for User Detail",
      parameters: [
        {
          name: "user_id",
          in: "path",
          type: "number",
          required: true,
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/users/delete/{user_id}': {
    delete: {
      tags: ["User"],
      summary: "API for delete User",
      parameters: [
        {
          name: "user_id",
          in: "path",
          type: "number",
          required: true,
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/users/list': {
    post: {
      tags: ["User"],
      summary: "APi for get Users list",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              search: {
                type: "string",
              },
              start: {
                type: "number",
                default: 0
              },
              limit: {
                type: "number",
                default: 10
              },
              filter: {
                type: "object",
                description: "Filter users based on specific criteria",
                properties: {
                  role: {
                    type: "number",
                    description: "Filter users by role ID (e.g., 5, 6, 7)",
                  },
                  two_factor_authentication: {
                    type: "number",
                    description: "Filter users by two-factor authentication status (e.g., 1 for enabled, 2 for disable)",
                  },
                },
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/users/edit': {
    put: {
      tags: ["User"],
      summary: "API for Edit User",
      consumes: "- multipart/form-data",
      parameters: [
        {
          name: "user_id",
          in: "formData",
          type: "number",
          required: false,
        },
        {
          name: "first_name",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "last_name",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "password",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "user_role",
          in: "formData",
          type: "number",
          required: false,
        },
        {
          name: "status",
          in: "formData",
          type: "number",
          required: false,
        },
        {
          name: "files",
          in: "formData",
          required: false,
          type: "file",
        },
        {
          name: "role_permission_id",
          in: "formData",
          required: true,
          type: "number",
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/client/default-Account-Manager/{client_id}': {
    get: {
      tags: ["Client"],
      summary: "API for get default Account Manager details",
      parameters: [
        {
          name: "client_id",
          in: "path",
          type: "number",
          required: true,
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },



  /** Billing Section */
  '/client/add-card': {
    post: {
      tags: ["Billing For Client"],
      summary: "APi for add card",
      description: "is_default should be 0=> No, 1=> yes, 2-> Global default for all subscriptions",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              token: {
                type: "string",
              },
              subscription_id: {
                type: "number",
              },
              is_default: {
                type: "number",
                default: 0
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/client/billing-list': {
    post: {
      tags: ["Billing For Client"],
      summary: "APi for get client billing list",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              start: {
                type: "number",
              },
              limit: {
                type: "number",
                default: 10
              },
              search: {
                type: "string",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/client/card-list/{subscription_id}': {
    get: {
      tags: ["Billing For Client"],
      summary: "APi for get client card list",
      parameters: [
        {
          name: "subscription_id",
          in: "path",
          required: true,
          type: "number",
        }
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/client/card-detail/{card_id}/{subscription_id}': {
    get: {
      tags: ["Billing For Client"],
      summary: "APi for get client card detail",
      parameters: [
        {
          name: "card_id",
          in: "path",
          type: "string",
          required: true,
        },
        {
          name: "subscription_id",
          in: "path",
          type: "string",
          required: true,
        }
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  '/client/card-delete/{card_id}': {
    delete: {
      tags: ["Billing For Client"],
      summary: "APi for delete card",
      parameters: [
        {
          name: "card_id",
          in: "path",
          type: "string",
          required: true,
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  '/client/update-card': {
    put: {
      tags: ["Billing For Client"],
      summary: "APi for update card",
      description: "is_default should be 0=> No, 1=> yes",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              card_id: {
                type: "string",
              },
              exp_date: {
                type: "string",
              },
              is_default: {
                type: "number",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/client/billing-history': {
    post: {
      tags: ["Billing For Client"],
      summary: "APi for get client billing history",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              start: {
                type: "number",
              },
              limit: {
                type: "number",
                default: 10
              },
              search: {
                type: "string",
              },
              filter: {
                type: "object",
                description: "Filter users based on specific criteria",
                properties: {
                  month: {
                    type: "number",
                    description: "Filter billing by month (e.g., 1, 2, 3)",
                  },
                  year: {
                    type: "number",
                    description: "Filter billing by year (e.g., 2023, 2024)",
                  },
                },
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  '/client/billing-detail/{subscription_id}': {
    get: {
      tags: ["Billing For Client"],
      summary: "APi for get billing plans",
      parameters: [
        {
          name: "subscription_id",
          in: "path",
          required: true,
          type: "number",
        }
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  '/client/cancel-subscription': {
    post: {
      tags: ["Subscription For Client-> Admin Side"],
      summary: "API for cancel subscription for client",
      description: "cancel_type should be 0=> Cancel Immediately, 1=> Cancel at end of billing cycle, 2=> cancel at custom date.",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              client_id: {
                type: "number",
              },
              subscription_id: {
                type: "number",
              },
              cancel_type: {
                type: "number",
                default: 0
              },
              cancel_date: {
                type: "string",
                default: ""
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/client/agent-recent-activity': {
    post: {
      tags: ["Client"],
      summary: "API for agent recent activity for client",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              project_id: {
                type: "number",
              },
              start: {
                type: "number",
              },
              limit: {
                type: "number",
                default: 10
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },



  '/project/filter-drop-down/{project_id}/{key}': {
    get: {
      tags: ["Project Column"],
      summary: "API for get filter drop down in project column list filter",
      description: "Key should be (0=>status, 1=>Assignee, 2=>Priority, 3=>Tags, 4=>due date, 5 => Created By)",
      parameters: [
        {
          name: "project_id",
          in: "path",
          required: true,
          type: "number",
        },
        {
          name: "key",
          in: "path",
          required: true,
          type: "number",
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/auth/admin-login-as-client/{user_id}": {
    get: {
      tags: ["Auth"],
      summary: "admin-login-as-client  Api",
      parameters: [
        {
          name: "user_id",
          in: "path",
          required: true,
          type: "number",
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/add/keyword': {
    post: {
      tags: ["Support"],
      summary: "API for Add Keyword",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              key_name: {
                type: "string"
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/keyword/list': {
    post: {
      tags: ["Support"],
      summary: "API for get keywords list for Admin",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              start: {
                type: "number",
              },
              limit: {
                type: "number",
                default: 10
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/keyword/update': {
    put: {
      tags: ["Support"],
      summary: "API for update keyword name",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              keyword_id: {
                required: true,
                type: "number",
              },
              key_name: {
                type: "string",
              }
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/keyword/delete/{keyword_id}': {
    delete: {
      tags: ["Support"],
      summary: "delete keyword Api by admin",
      parameters: [
        {
          name: "keyword_id",
          in: "path",
          required: true,
          type: "number",
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/keyword/mail': {
    post: {
      tags: ["Support"],
      summary: "API for send mail to admin for detected the use of a prohibited keyword in a message on CometChat.",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              received_by: {
                required: true,
                type: "number",
              },
              is_group: {
                default: 0,
                type: "number",
              },
              keywords: {
                required: true,
                type: "string",
              },
              message: {
                required: true,
                type: "string",
              },
              date_time: {
                type: "string",
              }
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/project/WhiteBoard/list/{project_id}": {
    get: {
      tags: ["Project Whiteboard"],
      summary: "APi for get Project WhiteBoard list",
      parameters: [
        {
          name: "project_id",
          in: "path",
          required: true,
          type: "number",
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/project/document/edit": {
    post: {
      tags: ["Project Document"],
      summary: "APi for Add Product Document",
      description: "add Product Document",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              project_menu_id: {
                type: "number",
                default: 2,
              },
              doc_file: {
                type: "string",
              }
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/project/WhiteBoard/edit": {
    put: {
      tags: ["Project Whiteboard"],
      summary: "APi for Edit Project WhiteBoard",
      description: "Edit Project WhiteBoard",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              project_menu_id: {
                type: "number",
              },
              name: {
                type: "string"
              },
              xml_data: {
                type: "string"
              },
              xml_img: {
                type: "string"
              }
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/project/WhiteBoard/delete/{white_board_id}": {
    delete: {
      tags: ["Project Whiteboard"],
      summary: "APi for delete Project WhiteBoard",
      description: "Delete Project WhiteBoard",
      parameters: [
        {
          name: "white_board_id",
          in: "path",
          required: true,
          type: "number",
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },



  "/project/document/edit": {
    put: {
      tags: ["Project Document"],
      summary: "APi for edit Product Document",
      description: "Edit Product Document",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              document_id: {
                type: "number",
                default: 2,
              },
              name: {
                type: "string",
              },
              doc_file: {
                type: "string",
              }
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/project/document/list/{project_id}": {
    get: {
      tags: ["Project Document"],
      summary: "APi for get Project document list",
      parameters: [
        {
          name: "project_id",
          in: "path",
          required: true,
          type: "number",
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/project/document/delete/{document_id}": {
    delete: {
      tags: ["Project Document"],
      summary: "APi for delete Project WhiteBoard",
      description: "Delete Project WhiteBoard",
      parameters: [
        {
          name: "document_id",
          in: "path",
          required: true,
          type: "number",
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  '/client/subscription-logs': {
    post: {
      tags: ["Subscription For Client-> Admin Side"],
      summary: "APi for get subscription logs",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              subscription_id: {
                type: "number",
              },
              start: {
                type: "number",
              },
              limit: {
                type: "number",
                default: 10
              },
              search: {
                type: "string",
                default: ""
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },



  /**  edit subscription for client  */
  "/client/edit-subscription": {
    post: {
      tags: ["Subscription For Client-> Admin Side"],
      summary: "API for Edit subscription for client",
      description: "<b>billing_frequency</b> should be 1=> one time, 2=> monthly , 3=> quaterly, 4=> semi annually, 5=> annually \n\n <b>billing_terms</b> should be 1=> Fixed number of payments, 2=> Automatically renew until cancelled \n\n If <b>billing_terms</b> => 1 then <b>no_of_payments</b> is required \n\n <b>is_delay_in_billing</b> should be 0=> No, 1=> Yes \n\n if <b>is_delay_in_billing</b> => 1 then <b>billing_start_date</b> is required.",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              subscription_id: {
                type: "number",
              },
              title: {
                type: "string",
              },
              description: {
                type: "string",
              },
              subscription_data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    plan_id: {
                      type: "number",
                      default: 0,
                    },
                    product_id: {
                      type: "number",
                      default: 1,
                    },
                    unit_price: {
                      type: "number",
                      default: 1.00
                    },
                    unit_discount_type: {
                      type: "number",
                    },
                    unit_discount: {
                      type: "number",
                    },
                    net_price: {
                      type: "number",
                    },
                    quantity: {
                      type: "number",
                      default: 1
                    },
                    billing_frequency: {
                      type: "number",
                      default: 1
                    },
                    billing_terms: {
                      type: "number",
                      default: 2
                    },
                    no_of_payments: {
                      type: "number",
                      default: 0
                    },
                    is_delay_in_billing: {
                      type: "number",
                      default: 0
                    },
                    billing_start_date: {
                      type: "string",
                      default: ""
                    },
                  },

                },
              },
              one_time_discount_name: {
                type: "string",
              },
              one_time_discount_type: {
                type: "number",
              },
              one_time_discount: {
                type: "number",
              },
              subtotal: {
                type: "number",
              },
              total_price: {
                type: "number",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  /**  resend link of subscription for client  */
  "/client/resend-subscription-link/{subscription_id}": {
    get: {
      tags: ["Subscription For Client-> Admin Side"],
      summary: "API for resend link of subscription for client",
      parameters: [
        {
          name: "subscription_id",
          in: "path",
          required: true,
          type: "number",
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/project/sort-document-whiteboard": {
    post: {
      tags: ["Project Document or Whiteboard"],
      summary: "APi for sort project Document or Whiteboard",
      description: "Type should be an 0=> Document, 1=> Whiteboard",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              project_id: {
                type: "number",
                default: 2,
              },
              type: {
                type: "number",
                default: 0,
              },
              ids: {
                type: "array",
                items: {
                  type: "number",
                  default: 2,
                },
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/keyword-notification-email/add": {
    post: {
      tags: ["Support"],
      summary: "APi for add keyword-notification-email",
      description: "Send comma seprated emails",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              email: {
                type: "string",
                default: "",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/project/sorting": {
    post: {
      tags: ["Project"],
      summary: "APi for sort projects",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              project_ids: {
                type: "array",
                items: {
                  type: "number",
                  default: 2,
                },
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },



  "/project/menu-sorting": {
    post: {
      tags: ["Project menu"],
      summary: "APi for sort project menus",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              project_id: {
                type: "number",
                default: 1,
              },
              menu_ids: {
                type: "array",
                items: {
                  type: "number",
                  default: 2,
                },
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/support/mark-as-close": {
    post: {
      tags: ["Support"],
      summary: "APi for mark to close a support",
      description: "type should be 0=> Open, 1=> Close",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              type: {
                type: "number",
                default: 1,
              },
              support_ids: {
                type: "array",
                items: {
                  type: "number",
                  default: 2,
                },
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/client/update-reminder-setting": {
    post: {
      tags: ["Client"],
      summary: "APi for update-reminder-setting",
      description: "value should be 0=> Off, 1=> On",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              reminder: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    key: {
                      type: "string",
                      default: "",
                    },
                    value: {
                      type: "number",
                      default: 0,
                    },
                  },
                },
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/client/get-reminder-setting": {
    get: {
      tags: ["Client"],
      summary: "APi for get-reminder-setting",
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/client/assigned-task-olny/{user_id}": {
    get: {
      tags: ["Client"],
      summary: "API for assigned task toggle ON/OFF of user or agent",
      parameters: [
        {
          name: "user_id",
          in: "path",
          required: true,
          type: "number",

        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  '/support/add-message': {
    post: {
      tags: ["Support"],
      summary: "API for Add Supports Message",
      consumes: "- multipart/form-data",
      parameters: [
        {
          name: "support_id",
          in: "formData",
          type: "number",
          required: true,
        },
        {
          name: "receiver_id",
          in: "formData",
          type: "number",
          required: true,
        },
        {
          name: "message",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "files",
          in: "formData",
          required: false,
          type: "file",
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  '/support/update-status': {
    put: {
      tags: ["Support"],
      summary: "API for update Supports status",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              support_id: {
                type: "number",
                default: 1,
              },
              status: {
                type: "string",
                default: "",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/project/task-label/delete/{label_id}": {
    delete: {
      tags: ["Project Task"],
      summary: "API for delete task label",
      parameters: [
        {
          name: "label_id",
          in: "path",
          type: "number",
          required: true,
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/project-menu/delete/{uuid}": {
    delete: {
      tags: ["Project menu"],
      summary: "APi for delete Project menu",
      parameters: [
        {
          name: "uuid",
          in: "path",
          required: true,
          type: "string",
        }
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },



  "/project-menu/pin/{uuid}": {
    get: {
      tags: ["Project menu"],
      summary: "APi for pin Project menu",
      parameters: [
        {
          name: "uuid",
          in: "path",
          required: true,
          type: "string",
        }
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/get-churn-report": {
    post: {
      tags: ["Auth"],
      summary: "get-churn-report api",
      description: "type should be 0-> Past Year, 1-> Past Week, 2-> Current year, 3-> Custom , \n\n If type 3 then start date and end date is required.",
      parameters: [
        {
          name: "body",
          in: "body",
          required: false,
          type: "object",
          schema: {
            properties: {
              type: {
                type: "number",
                default: 0
              },
              start_date: {
                type: "string",
                default: ""
              },
              end_date: {
                type: "string",
                default: ""
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/get-retention-report": {
    post: {
      tags: ["Auth"],
      summary: "get-retention-report api",
      description: "type should be 0-> Past Year, 1-> Past Week, 2-> Current year, 3-> Custom , \n\n If type 3 then start date and end date is required.",
      parameters: [
        {
          name: "body",
          in: "body",
          required: false,
          type: "object",
          schema: {
            properties: {
              type: {
                type: "number",
                default: 0
              },
              start_date: {
                type: "string",
                default: ""
              },
              end_date: {
                type: "string",
                default: ""
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/get-customer-overview-report": {
    post: {
      tags: ["Auth"],
      summary: "get-customer-overview-report api",
      description: "type should be 0-> Past Year, 1-> Past Week, 2-> Current year, 3-> Custom , \n\n If type 3 then start date and end date is required.",
      parameters: [
        {
          name: "body",
          in: "body",
          required: false,
          type: "object",
          schema: {
            properties: {
              type: {
                type: "number",
                default: 0
              },
              start_date: {
                type: "string",
                default: ""
              },
              end_date: {
                type: "string",
                default: ""
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/get-growth-rate-report": {
    post: {
      tags: ["Auth"],
      summary: "get-growth-rate-report api",
      description: "type should be 0-> Past Year, 1-> Past Week, 2-> Current year, 3-> Custom , \n\n If type 3 then start date and end date is required.",
      parameters: [
        {
          name: "body",
          in: "body",
          required: false,
          type: "object",
          schema: {
            properties: {
              type: {
                type: "number",
                default: 0
              },
              start_date: {
                type: "string",
                default: ""
              },
              end_date: {
                type: "string",
                default: ""
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/get-mmr-overview-report": {
    post: {
      tags: ["Auth"],
      summary: "get-mmr-overview-report api",
      description: "type should be 0-> Past Year, 1-> Past Week, 2-> Current year, 3-> Custom , \n\n If type 3 then start date and end date is required.",
      parameters: [
        {
          name: "body",
          in: "body",
          required: false,
          type: "object",
          schema: {
            properties: {
              type: {
                type: "number",
                default: 0
              },
              start_date: {
                type: "string",
                default: ""
              },
              end_date: {
                type: "string",
                default: ""
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/get-financial-report": {
    post: {
      tags: ["Auth"],
      summary: "get-financial-report api",
      description: "type should be 0-> Current Month, 1-> Last month",
      parameters: [
        {
          name: "body",
          in: "body",
          required: false,
          type: "object",
          schema: {
            properties: {
              type: {
                type: "number",
                default: 0
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/get-customer-activity": {
    get: {
      tags: ["Auth"],
      summary: "get-customer-activity api",
      parameters: [
        {
          name: "start",
          in: "query",
          required: false,
          type: "number",
        },
        {
          name: "limit",
          in: "query",
          required: false,
          type: "number",
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/client/subscription-pause/{subscription_id}": {
    get: {
      tags: ["Client-> Admin Side"],
      summary: "API for subscription-pause",
      parameters: [
        {
          name: "subscription_id",
          in: "path",
          required: true,
          type: "number",
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/client/subscription-resume/{subscription_id}": {
    get: {
      tags: ["Client-> Admin Side"],
      summary: "API for subscription-resume",
      parameters: [
        {
          name: "subscription_id",
          in: "path",
          required: true,
          type: "number",
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/project/get-saved-filters/{project_id}/{is_view}": {
    get: {
      tags: ["Project Column"],
      summary: "API for get-saved-filters",
      parameters: [
        {
          name: "project_id",
          in: "path",
          required: true,
          type: "number",
        },
        {
          name: "is_view",
          in: "path",
          required: true,
          type: "number",
        },
        {
          name: "search",
          in: "query",
          required: false,
          type: "string",
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/project/delete-filters/{filter_id}": {
    delete: {
      tags: ["Project Column"],
      summary: "API for delete-filters",
      parameters: [
        {
          name: "filter_id",
          in: "path",
          required: true,
          type: "number",
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/project/update-filters": {
    put: {
      tags: ["Project Column"],
      summary: "API for update-filters",
      parameters: [
        {
          name: "body",
          in: "body",
          required: false,
          type: "object",
          schema: {
            properties: {
              filter_id: {
                type: "number",
                default: 0
              },
              name: {
                type: "string",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/client/get-shared-file/{file_name}": {
    get: {
      tags: ["Files"],
      summary: "API for get-shared-file",
      parameters: [
        {
          name: "file_name",
          in: "path",
          required: true,
          type: "string",
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/global/two-factor-authentication/get": {
    get: {
      tags: ["Global Setting"],
      summary: "API for get-two-factor-authentication",
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/global/two-factor-authentication/update": {
    post: {
      tags: ["Global Setting"],
      summary: "APi for update-global/two-factor-authentication",
      description: "value should be 0=> Off, 1=> On",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              two_factor_setting: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    key: {
                      type: "string",
                      default: "",
                    },
                    user_role: {
                      type: "number",
                      default: 0,
                    },
                    is_authenticate: {
                      type: "number",
                      default: 0,
                    },
                  },
                },
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  '/project/task/add-message': {
    post: {
      tags: ["Task Messages"],
      summary: "API for Add task message",
      consumes: "- multipart/form-data",
      parameters: [
        {
          name: "task_id",
          in: "formData",
          type: "number",
          required: true,
        },
        {
          name: "message",
          in: "formData",
          type: "string",
          required: false,
        },
        {
          name: "files",
          in: "formData",
          required: false,
          type: "file",
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/project/task-chat/{task_id}": {
    get: {
      tags: ["Task Messages"],
      summary: "API for get-task-chat",
      parameters:[
        {
          name: "task_id",
          in: "path",
          required: true,
          type: "number",
        },
        {
          name: "start",
          in: "query",
          required: false,
          type: "number",
        },
        {
          name: "limit",
          in: "query",
          required: false,
          type: "number",
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/accountManager/assign-clients": {
    post: {
      tags: ["Account-Manager-> Admin Side"],
      summary: "API for Assign client to Account manager",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              account_manager_id: {
                type: "number",
              },
              client_ids: {
                type: "array",
                items: {
                  type: "number",
                  default: 2,
                },
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/setting/role-and-permission/add": {
    post: {
      tags: ["Global Setting"],
      summary: "API for add role-and-permission",
      description: "is_client_access/is_agent_access/is_report_access/is_manage_products/is_chat/is_keywords/is_settings/is_supports/is_admin_users ->( should be 0-> No, 1-> Yes) \n\n\n In permission_access -> ( view -> (0-> All, 1-> Assigned Only) edit-> (0-> All, 1-> Assigned Only, 2-> None) delete-> (0-> All, 1-> Assigned Only, 2-> None))",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              name: {
                type: "string",
              },
              description: {
                type: "string",
              },
              is_client_access: {
                type: "number",
                default: 0,
              },
              client_access: {
                type: "object",
                properties: {
                  client_view: {
                    type: "number",
                  },
                  client_edit: {
                    type: "number",
                  },
                  client_delete: {
                    type: "number",
                  },
                  client_subscriptions: {
                    type: "number",
                  },
                  client_as_login: {
                    type: "number",
                  },
                  client_account_manager: {
                    type: "number",
                  },
                  client_assigned_agent: {
                    type: "number",
                  },
                  client_hide_info: {
                    type: "number",
                  },
                },
              },
              is_agent_access: {
                type: "number",
                default: 0,
              },
              agent_access: {
                type: "object",
                properties: {
                  agent_view: {
                    type: "number",
                  },
                  agent_edit: {
                    type: "number",
                  },
                  agent_delete: {
                    type: "number",
                  },
                  agent_hide_info: {
                    type: "number",
                  },
                },
              },
              is_agent_group_access: {
                type: "number",
                default: 0,
              },
              agent_group_access: {
                type: "object",
                properties: {
                  aagent_group_view: {
                    type: "number",
                  },
                  agent_group_edit: {
                    type: "number",
                  },
                  agent_group_delete: {
                    type: "number",
                  },
                },
              },
              is_report_access: {
                type: "number",
                default: 0,
              },
              report_access: {
                type: "object",
                properties: {
                  report_financial: {
                    type: "number",
                  },
                  report_churn: {
                    type: "number",
                  },
                  report_retantion: {
                    type: "number",
                  },
                  report_customer: {
                    type: "number",
                  },
                  report_growth: {
                    type: "number",
                  },
                  report_mmr: {
                    type: "number",
                  },
                },
              },
              is_manage_products: {
                type: "number",
                default: 0,
              },
              is_chat: {
                type: "number",
                default: 0,
              },
              chat_access: {
                type: "object",
                properties: {
                  chat: {
                    type: "number",
                  },
                },
              },
              is_keywords: {
                type: "number",
                default: 0,
              },
              is_settings: {
                type: "number",
                default: 0,
              },
              is_supports: {
                type: "number",
                default: 0,
              },
              support_access: {
                type: "object",
                properties: {
                  support_access_allow: {
                    type: "number",
                  },
                  support_department: {
                    type: "number",
                  },
                },
              },
              is_admin_users: {
                type: "number",
                default: 0,
              },
              admin_access: {
                type: "object",
                properties: {
                  admin_view: {
                    type: "number",
                  },
                  admin_edit: {
                    type: "number",
                  },
                  admin_delete: {
                    type: "number",
                  },
                  admin_hide_info: {
                    type: "number",
                  },
                },
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/client/list-for-assign": {
    post: {
      tags: ["Client-> Admin Side"],
      summary: "APi for get client list-for-assign",
      description: "search--> first_name or last_name",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              start: {
                type: "number",
              },
              limit: {
                type: "number",
                default: 10
              },
              search: {
                type: "string",
              },
              account_manager_id: {
                type: "number",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/setting/get-role-and-permission/{role_permission_id}": {
    get: {
      tags: ["Global Setting"],
      summary: "APi for get role-and-permission",
      parameters: [
        {
          name: "role_permission_id",
          in: "path",
          required: true,
          type: "number",
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/setting/role-and-permission/list": {
    post: {
      tags: ["Global Setting"],
      summary: "APi for get role-and-permission/list",
      description: "search--> name",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              start: {
                type: "number",
              },
              limit: {
                type: "number",
                default: 10
              },
              search: {
                type: "string",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },



  "/setting/delete-role-and-permission/{role_permission_id}": {
    delete: {
      tags: ["Global Setting"],
      summary: "APi for delete role-and-permission",
      parameters: [
        {
          name: "role_permission_id",
          in: "path",
          required: true,
          type: "number",
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/setting/update-role-and-permission/{role_permission_id}": {
    put: {
      tags: ["Global Setting"],
      summary: "API for update role-and-permission",
      description: "is_client_access/is_agent_access/is_report_access/is_manage_products/is_chat/is_keywords/is_settings/is_supports/is_admin_users ->( should be 0-> No, 1-> Yes) \n\n\n In permission_access -> ( view -> (0-> All, 1-> Assigned Only) edit-> (0-> All, 1-> Assigned Only, 2-> None) delete-> (0-> All, 1-> Assigned Only, 2-> None))",
      parameters: [
        {
          name: "role_permission_id",
          in: "path",
          required: true,
          type: "number",
        },
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              name: {
                type: "string",
              },
              description: {
                type: "string",
              },
              is_client_access: {
                type: "number",
                default: 0,
              },
              client_access: {
                type: "object",
                properties: {
                  client_view: {
                    type: "number",
                  },
                  client_edit: {
                    type: "number",
                  },
                  client_delete: {
                    type: "number",
                  },
                  client_subscriptions: {
                    type: "number",
                  },
                  client_as_login: {
                    type: "number",
                  },
                  client_account_manager: {
                    type: "number",
                  },
                  client_assigned_agent: {
                    type: "number",
                  },
                  client_hide_info: {
                    type: "number",
                  },
                },
              },
              is_agent_access: {
                type: "number",
                default: 0,
              },
              agent_access: {
                type: "object",
                properties: {
                  agent_view: {
                    type: "number",
                  },
                  agent_edit: {
                    type: "number",
                  },
                  agent_delete: {
                    type: "number",
                  },
                  agent_hide_info: {
                    type: "number",
                  },
                },
              },
              is_agent_group_access: {
                type: "number",
                default: 0,
              },
              agent_group_access: {
                type: "object",
                properties: {
                  aagent_group_view: {
                    type: "number",
                  },
                  agent_group_edit: {
                    type: "number",
                  },
                  agent_group_delete: {
                    type: "number",
                  },
                },
              },
              is_report_access: {
                type: "number",
                default: 0,
              },
              report_access: {
                type: "object",
                properties: {
                  report_financial: {
                    type: "number",
                  },
                  report_churn: {
                    type: "number",
                  },
                  report_retantion: {
                    type: "number",
                  },
                  report_customer: {
                    type: "number",
                  },
                  report_growth: {
                    type: "number",
                  },
                  report_mmr: {
                    type: "number",
                  },
                },
              },
              is_manage_products: {
                type: "number",
                default: 0,
              },
              is_chat: {
                type: "number",
                default: 0,
              },
              chat_access: {
                type: "object",
                properties: {
                  chat: {
                    type: "number",
                  },
                },
              },
              is_keywords: {
                type: "number",
                default: 0,
              },
              is_settings: {
                type: "number",
                default: 0,
              },
              is_supports: {
                type: "number",
                default: 0,
              },
              support_access: {
                type: "object",
                properties: {
                  support_access_allow: {
                    type: "number",
                  },
                  support_department: {
                    type: "number",
                  },
                },
              },
              is_admin_users: {
                type: "number",
                default: 0,
              },
              admin_access: {
                type: "object",
                properties: {
                  admin_view: {
                    type: "number",
                  },
                  admin_edit: {
                    type: "number",
                  },
                  admin_delete: {
                    type: "number",
                  },
                  admin_hide_info: {
                    type: "number",
                  },
                },
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/auth/get-user-permission": {
    get: {
      tags: ["Auth"],
      summary: "APi for get user role-and-permission",
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/global/subscription-setting": {
    post: {
      tags: ["Global Setting"],
      summary: "APi for save/update subscription-setting",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              overdue_period_days: {
                type: "string",
              },
              suspend_period_days: {
                type: "string",
              },
              automatic_reminder_email_days: {
                type: "string",
              },
              overdue_reminder_email_days: {
                type: "string",
              },
              card_expiry_reminder_email_days: {
                type: "string",
              },
              payment_retry_overdue_status_days: {
                type: "string",
              },
              payment_retry_suspended_status_days: {
                type: "string",
              },
              global_processing_fee_description: {
                type: "string",
              },
              global_processing_fee: {
                type: "string",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/global/get-subscription-setting": {
    get: {
      tags: ["Global Setting"],
      summary: "APi for get subscription-setting",
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/client/click-docusign-link": {
    post: {
      tags: ["Docusign Link Save"],
      summary: "API for save click-docusign-link",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              link_click: {
                type: "object",
                properties: {
                  client_id: {
                    type: "number",
                  },
                  subscription_id: {
                    type: "number",
                  },
                  login_as_client: {
                    type: "number",
                  },
                },
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/agent/assigned-client-list": {
    post: {
      tags: ["Agent"],
      summary: "APi for get assigned client list",
      description: "search--> first_name or last_name",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              start: {
                type: "number",
              },
              limit: {
                type: "number",
                default: 10
              },
              search: {
                type: "string",
              },
              agent_id: {
                type: "number",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/agent/recent-activity": {
    get: {
      tags: ["Agent"],
      summary: "APi for get recent activity for agents",
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/agent/approve-reject": {
    post: {
      tags: ["Agent-> Admin Side"],
      summary: "APi for agent-approve-reject",
      description: "status-> 1-> Approve, 2-> Reject",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              agent_id: {
                type: "number",
              },
              status: {
                type: "number",
                default: 1
              },
              reject_reason: {
                type: "string",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/agent/update-kyc-detail": {
    post: {
      tags: ["Agent-> On Board"],
      summary: "API for agent update-kyc-detail",
      consumes: "- multipart/form-data",
      description: "If Kyc complete then send is_finalized = 1 otherwise no need to sent param or sent 0",
      parameters: [
        {
          name: "front_id",
          in: "formData",
          type: "file",
          required: false,
        },
        {
          name: "back_id",
          in: "formData",
          required: false,
          type: "file",
        },
        {
          name: "captured_pic",
          in: "formData",
          required: false,
          type: "file",
        },
        {
          name: "is_finalized",
          in: "formData",
          required: false,
          type: "number",
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/accountManager/assign-agents": {
    post: {
      tags: ["Account-Manager-> Admin Side"],
      summary: "API for Assign agents to Account manager",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              account_manager_id: {
                type: "number",
              },
              agent_ids: {
                type: "array",
                items: {
                  type: "number",
                  default: 2,
                },
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  '/accountManager/agent-list': {
    get: {
      tags: ["Account-Manager-> Admin Side"],
      summary: "APi for get all agent for Account Manager",
      parameters: [
        {
          name: "account_Manager_id",
          in: "query",
          type: "number",
          required: false,
        },
        {
          name: "type",
          in: "query",
          type: "number",
          required: false,
        },
        {
          name: "search",
          in: "query",
          type: "string",
          required: false,
        },
        {
          name: "start",
          in: "query",
          type: "number",
          required: false,
        },
        {
          name: "limit",
          in: "query",
          type: "number",
          required: false,
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/client/setting/role-and-permission/add": {
    post: {
      tags: ["Client-> Setting"],
      summary: "API for add role-and-permission",
      description: "is_project_access -> (0-> No, 1-> Yes) \n\n is_agent_access/is_users_access/is_billing_access/is_chat/is_shared_files/is_settings/is_supports/is_password_manager ->( should be 0-> No, 1-> Yes)",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              name: {
                type: "string",
              },
              description: {
                type: "string",
              },
              is_project_access: {
                type: "number",
                default: 0,
              },
              is_agent_access: {
                type: "number",
                default: 0,
              },
              is_users_access: {
                type: "number",
                default: 0,
              },
              is_billing_access: {
                type: "number",
                default: 0,
              },
              is_shared_files: {
                type: "number",
                default: 0,
              },
              is_chat: {
                type: "number",
                default: 0,
              },
              is_password_manager: {
                type: "number",
                default: 0,
              },
              is_settings: {
                type: "number",
                default: 0,
              },
              is_supports: {
                type: "number",
                default: 0,
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/client/setting/update-role-and-permission/{role_permission_id}": {
    put: {
      tags: ["Client-> Setting"],
      summary: "API for update role-and-permission",
      description: "is_project_access -> (0-> No, 1-> Yes) \n\n is_agent_access/is_users_access/is_billing_access/is_chat/is_shared_files/is_settings/is_supports/is_password_manager ->( should be 0-> No, 1-> Yes)",
      parameters: [
        {
          name: "role_permission_id",
          in: "path",
          required: true,
          type: "number",
        },
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              name: {
                type: "string",
              },
              description: {
                type: "string",
              },
              is_project_access: {
                type: "number",
                default: 0,
              },
              is_agent_access: {
                type: "number",
                default: 0,
              },
              is_users_access: {
                type: "number",
                default: 0,
              },
              is_billing_access: {
                type: "number",
                default: 0,
              },
              is_shared_files: {
                type: "number",
                default: 0,
              },
              is_chat: {
                type: "number",
                default: 0,
              },
              is_password_manager: {
                type: "number",
                default: 0,
              },
              is_settings: {
                type: "number",
                default: 0,
              },
              is_supports: {
                type: "number",
                default: 0,
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/notification-list": {
    post: {
      tags: ["Notification List"],
      summary: "API for get notification list",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              start: {
                type: "number",
                default: 0
              },
              limit: {
                type: "number",
                default: 10
              },
              is_mark: {
                type: "number",
                default: 0
              }
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/notification-read/{notification_id}": {
    get: {
      tags: ["Notification List"],
      summary: "API for read notification",
      description: "notification_id (0-> All Read notification, or if sent any id in notification_id param then read that particular notification",
      parameters: [
        {
          name: "notification_id",
          in: "path",
          required: true,
          type: "number",
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/users/task-list": {
    post: {
      tags: ["User"],
      summary: "API for get user task list",
      description: "type (0-> All Assigned Task, 1-> Due date task or if sent date return acc. to date all task) ",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              start: {
                type: "number",
                default: 0
              },
              limit: {
                type: "number",
                default: 10
              },
              search: {
                type: "string",
              },
              type: {
                type: "number",
                default: 0
              },
              date: {
                type: "string",
              }
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/notification-count": {
    get: {
      tags: ["Notification List"],
      summary: "API for get notification count",
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/global/get-password-setting": {
    get: {
      tags: ["Global Setting"],
      summary: "API for get-password-setting",
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/agent/add-note": {
    post: {
      tags: ["Agent"],
      summary: "API for add notes for agent",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              agent_id: {
                type: "number",
              },
              note: {
                type: "string",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/agent/get-notes": {
    post: {
      tags: ["Agent"],
      summary: "API for get notes of agent",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              agent_id: {
                type: "number",
              },
              start: {
                type: "number",
                default: 0,
              },
              limit: {
                type: "number",
                default: 10,
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/agent/edit-note/{note_id}": {
    put: {
      tags: ["Agent"],
      summary: "API for update note for agent",
      parameters: [
        {
          name: "note_id",
          in: "path",
          type: "number",
          required: true,
        },
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              note: {
                type: "string",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  "/agent/delete-note/{note_id}": {
    delete: {
      tags: ["Agent"],
      summary: "API for delete note for agent",
      parameters: [
        {
          name: "note_id",
          in: "path",
          type: "number",
          required: true,
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/client/get-subscription-payment-link/{subscription_id}": {
    get: {
      tags: ["Subscription For Client-> Admin Side"],
      summary: "API for get-subscription-payment-link",
      parameters: [
        {
          name: "subscription_id",
          in: "path",
          type: "number",
          required: true,
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
    },
  },

  /** Add Bank */
  '/client/add-bank': {
    post: {
      tags: ["Billing For Client"],
      summary: "APi for add bank",
      description: "is_default should be 0=> No, 1=> yes, 2-> Global Default for all subscriptions",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              account_holder_name: {
                type: "string",
              },
              account_number: {
                type: "string",
              },
              routing_number: {
                type: "string",
              },
              is_default: {
                type: "number",
              },
              subscription_id: {
                type: "number",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  /** edit Bank */
  '/client/update-bank': {
    post: {
      tags: ["Billing For Client"],
      summary: "APi for update-bank",
      description: "is_default should be 0=> No, 1=> yes",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              bank_id: {
                type: "string",
              },
              account_holder_name: {
                type: "string",
              },
              is_default: {
                type: "number",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },


  /**  Buy subscription for client  */
  "/client/buy-subscription": {
    post: {
      tags: ["Subscription For Client-> Web"],
      summary: "API for Buy subscription for client",
      description: "<b>billing_frequency</b> should be 1=> one time, 2=> monthly , 3=> quaterly, 4=> semi annually, 5=> annually \n\n <b>billing_terms</b> should be 1=> Fixed number of payments, 2=> Automatically renew until cancelled \n\n If <b>billing_terms</b> => 1 then <b>no_of_payments</b> is required",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              first_name: {
                type: "string",
              },
              last_name: {
                type: "string",
              },
              email: {
                type: "string",
              },
              phone_number: {
                type: "string",
              },
              company_name: {
                type: "string",
              },
              token: {
                type: "string",
              },
              country: {
                type: "string",
              },
              title: {
                type: "string",
              },
              subscription_data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    product_id: {
                      type: "number",
                      default: 1,
                    },
                    unit_price: {
                      type: "number",
                      default: 1.00
                    },
                    net_price: {
                      type: "number",
                    },
                    quantity: {
                      type: "number",
                      default: 1
                    },
                    billing_frequency: {
                      type: "number",
                      default: 1
                    },
                    billing_terms: {
                      type: "number",
                      default: 2
                    },
                    no_of_payments: {
                      type: "number",
                      default: 0
                    },
                  },

                },
              },
              subtotal: {
                type: "number",
              },
              total_price: {
                type: "number",
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
    },
  },


  "/auth/slack-integration-link": {
    get: {
      tags: ["Third party integration"],
      summary: "APi for get link to integrate with slack",
      parameters: [
        {
          name: "type",
          in: "query",
          type: "number",
          default: 0,
          required: true,
        },
        {
          name: "project_id",
          in: "query",
          type: "number",
          default: null,
          required: true,
        }
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/auth/types-of-slack-notification/update": {
    put: {
      tags: ["Third party integration"],
      summary: "API for update types-of-slack-notification",
      description: "Values sent in types_of_slack_notification param For (COLUMN_CREATED: 1, COLUMN_UPDATED: 2, COLUMN_DELETE: 3, TASK_CREATED: 4, TASK_DELETE: 5)",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              types_of_slack_notification: {
                type: "string",
                defaultValue: "1,2"
              },
              project_id: {
                type: "string",
                defaultValue: "",
                required: true,
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ], 
    },
  },


  "/auth/enable-calendar-sync": {
    post: {
      tags: ["Third party integration"],
      summary: "API for enable-calendar-sync",
      description: "type should be 1-> google, 2-> outlook,  is_enable should be 0-> disable, 1-> enable",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              type: {
                type: "number",
                defaultValue: 1
              },
              is_enable: {
                type: "number",
                defaultValue: 1
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ], 
    },
  },


  "/auth/get-slack-calendar-sync": {
    get: {
      tags: ["Third party integration"],
      summary: "API for get-slack-calendar-sync",
      description: "values should be 0-> disable, 1-> enable",
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ], 
    },
  },

  "/auth/google-integration-link": {
    get: {
      tags: ["Third party integration"],
      summary: "APi for get link to integrate with google calendar",
      parameters: [
        {
          name: "type",
          in: "query",
          type: "number",
          default: 0,
          required: true,
        }
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },
  "/outlook/auth": {
    get: {
      tags: ["Third party integration"],
      summary: "APi for get link to integrate with outlook calendar",
      parameters: [
        {
          name: "type",
          in: "query",
          type: "number",
          default: 0,
          required: true,
        }
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

  "/auth/validate-jwt": {
    get: {
      tags: ["Auth"],
      summary: "API to validate jwt token",
      parameters: [
        {
          name: "secretkey",
          in: "header",
          type: "string",
          default: null,
          required: true,
        }
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },
  "/auth/remove-calender-sync": {
    post: {
      tags: ["Third party integration"],
      summary: "API to remove calender account for google and outlook",
      description: "values should be 1->google , 2-> outlook, 3-> slack ,",
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          type: "object",
          schema: {
            properties: {
              type: {
                type: "number",
                defaultValue: 1
              },
              project_id: {
                type: "number",
                defaultValue: null,
              }
            },
          },
        },
      ],
      responses: {
        200: {
          description: "ok",
        },
      },
      security: [
        {
          authorization: [],
        },
      ],
    },
  },

},

  swaggerSpec.securityDefinitions = {
    authorization: {
      type: "apiKey",
      name: "authorization",
      in: "header",
    },
  };

module.exports = swaggerSpec;
