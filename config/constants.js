export const RESPONSE_CODES = {
  GET: 200,
  POST: 201,
  DELETE: 204,
  PUT: 204,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
  ONVERIFICATION: 402,
  UNAUTHORIZED: 401,
  BAD_REQUEST: 400,
};

// if you are changing anything in this please make sure to change order in comet role also so if admin value is 1 cometrole index is 0
export const ROLES = {
  ADMIN: 1,
  CLIENT: 2,
  AGENT: 3,
  ACCOUNTMANAGER: 4,
  USER: 5,
};

// please change index here if you are changing roles
export const COMETCHATROLES = [
  "admin",
  "client",
  "agent",
  "accountmanager",
  "user"
];

export const PAGINATION = {
  START: 0,
  LIMIT: 10,
};

export const TOKEN_TYPE = {
  FORGOT: 1,
  SET_PROFILE: 2,
};

export const BILLING_FREQUENCY = {
  ONE_TIME: 1,
  MONTHLY: 2,
  QUATERLY: 3,
  SEMI_ANNUALLY: 4,
  ANNUALLY: 5,
};

export const BILLING_TERMS = {
  FIXED_NUMBER_OF_PAYMENTS: 1,
  AUTOMATICALLY_RENEW: 2,
};

export const PRODUCT_TYPE = {
  GLOBAL_PRODUCT: 0,
  LINE_ITEM: 1,
};

export const ASSIGNED_USERS = {
  CLIENTS_TO_AGENT: 1, // Assign Agents to -> client
  CLIENTS_TO_ACCOUNT_MANAGER: 2, // Assign account manager to -> client
  AGENTS_TO_ACCOUNT_MANAGER: 3, // Assign account manager to -> client
};


export const STRIPE_ERROR = {
  INVALID_REQUEST: "StripeInvalidRequestError",
  ERROR: "StripeError",
  StripeCardError: "StripeCardError",
};



export const AGENT_PROFILE_COMPLETE_STATUS = {
  NO_ACTION_PERFORM: 0,
  SEND_DOCUSIGN_LINK: 1,
  DOCUSIGN_COMPLETE: 2,
  COMPLETE_KYC: 3,
  COMPLETE_CAPTURE: 4,
  REJECT: 6,
  APPROVE: 5
};


export const USER_STATUS = {
  PENDING: 0,
  ACTIVE: 1,
  INACTIVE: 2,
};

export const RECENT_ACTIVITY_TYPE = {
  PROJECT_CREATED: 0,
  TASK_CREATED: 1,
  TASK_UPDATED: 2,
  TASK_MOVE: 3,
  TASK_DELETE: 4,
  PROJECT_DELETE: 5,
  TASK_COMPLETE: 6,
  PASSWORD_MANAGER_ASSIGN: 7,
  SHARED_FILE_CREATE: 8,
  TASK_COMMENT_ADD: 9
};

export const PROJECT_DEFAULT_COLUMN = {
  COMPLETED: "Completed",
  TO_DO: "To Do",
  IN_PROGRESS: "In Progress"
};

export const PROJECT_MENUS = {
  KANBAN_BOARD: 0,
  TASK_TABLE: 1,
  TASK_LIST: 2,
  CALENDAR: 3,
  WHITE_BOARD: 4,
  DOCUMENT: 5,
  CHAT: 6,
};

export const PROJECT_MENU_NAME = {
  KANBAN_BOARD: "Kanban Board",
  TASK_TABLE: "Task Table",
  TASK_LIST: "Task List",
  CALENDAR: "Calendar",
  WHITE_BOARD: "White Board",
  DOCUMENT: "Document",
  CHAT: "Chat",
};

export const SUBSCRIPTION_LOGS_MESSAGE = {
  ON_PURCHASE: "Subscription purchased successfully.",
  ON_RENEW: "Subscription renewal successfully.",
  ON_DECLINE: "Subscription declined.",
  ON_RENEW_MAIL: "Renewal mail sent successfully.",
  STATUS_CHANGE_CANCEL: "Subscription has been cancelled.",
  STATUS_CHANGE_PAUSE: "Subscription has been paused.",
  STATUS_CHANGE_EXPIRE: "Subscription has been expired.",
  ON_UPDATE: "Subscription updated successfully."
};

export const SUBSCRIPTION_LOGID = {
  ON_PURCHASE: 1,
  ON_RENEW: 2,
  ON_DECLINE: 3,
  ON_RENEW_MAIL: 4,
  STATUS_CHANGE_CANCEL: 5,
  STATUS_CHANGE_PAUSE: 6,
  STATUS_CHANGE_EXPIRE: 7,
  ON_UPDATE: 8,
};


export const SLACK_NOTIFICATION_TYPE = {
  COLUMN_CREATED: 1,
  COLUMN_UPDATED: 2,
  COLUMN_DELETE: 3,
  TASK_CREATED: 4,
  TASK_DELETE: 5,
  TASK_UPDATED: 6,
  TASK_MOVE: 7,
  TASK_COMPLETE: 8,
  PROJECT_CREATED: 9,
  PROJECT_DELETE: 10,
};

export const CALENDAR_SYNC = {
  TRUE: 1,
  FALSE: 0,
};


