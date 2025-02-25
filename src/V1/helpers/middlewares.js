import { RESPONSE_CODES } from "../../../config/constants";
import Logger from "./logger";
import { CommonMessages } from "../../../constants/message/common";

const authMiddleWare = async (req, res, next) => {
  try {
    const logger = new Logger();
    await logger.init();
    const ignorePaths = [
      "/",
      "/api-docs",
      "/v1/",
      "/v1/logout",
      "/v1/health",
      "/v1/auth/login",
      "/v1/auth/forgot-password",
      "/v1/auth/reset-password",
      "/v1/otp-verify",
      "/v1/client/set-password",
      "/v1/client/image",
      "/v1/subscription-webhook",
      "/v1/docusign-completed",
      "/v1/auth/social-login",
      "/v1/agent-docusign-completed",
      "/v1/client/get-card-detail",
      "/v1/resend-otp",
      "/v1/client/subscription-history-saved",
      "/v1/subscription-setting/cron",
      "/v1/client/regenerate-subscription-link-cron",
      "/v1/client/get-subscription-payment-link",
      "/v1/public-product/list",
      "/v1/client/buy-subscription",
      "/v1/country-list",
      "/v1/access-shared-file",
      "/v1/slack-notification-redirect",
      "/v1/google-calendar-redirect",
      "/v1/privacyPolicy",
      "/v1/term_condition",
      "/v1/outlook-calendar-redirect-auth",
      "/v1/outlook/add-event"
    ];
    const { method, headers, originalUrl } = req;

    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const logObj = {
      ip,
      headers: req.headers,
      method: req.method,
      url: req.originalUrl,
      timestamp: Date.now(),
    };

    if (
      (method === "POST" && originalUrl === "/user")
      || (method === "GET" && originalUrl.includes("/api-docs/"))
      || (method === "POST" && originalUrl.includes("/v1/client/set-password"))
      || (method === "GET" && originalUrl.includes("/v1/client/image"))
      || (method === "GET" && originalUrl.includes("/v1/docusign-completed"))
      || (method === "GET" && originalUrl.includes("/v1/agent-docusign-completed"))
      || (method === "GET" && originalUrl.includes("/v1/client/get-subscription-payment-link"))
      || (method === "POST" && originalUrl.includes("/v1/public-product/list"))
      || (method === "POST" && originalUrl.includes("/v1/client/buy-subscription"))
      || (method === "GET" && originalUrl.includes("/v1/country-list"))
      || (method === "GET" && originalUrl.includes("/v1/access-shared-file"))
      || (method === "GET" && originalUrl.includes("/v1/slack-notification-redirect"))
      || (method === "GET" && originalUrl.includes("/v1/google-calendar-redirect"))
      || (method === "GET" && originalUrl.includes("/v1/privacyPolicy"))
      || (method === "GET" && originalUrl.includes("/v1/term_condition"))
      || (method === "GET" && originalUrl.includes("/v1/outlook-calendar-redirect-auth"))
      || (method === "GET" && originalUrl.includes("/v1/outlook/add-event"))

    ) {
      logger.logInfo("Activity Log: ", logObj);
      // ignoring register URL
      return next();
    }

    const ignoreIndex = ignorePaths.findIndex((item) => item === originalUrl);
    if (ignoreIndex > -1) {
      logger.logInfo("Activity Log: ", logObj);
      return next();
    }

    if (!headers.authorization) {
      logger.logInfo("Activity Log: ", logObj);
      return res.json({
        status: 0,
        code: RESPONSE_CODES.UNAUTHORIZED,
        message: CommonMessages.UNAUTHORIZED_USER,
        data: null,
      });
    }
    return next();
  } catch (error) {
    return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
      status: 0,
      code: RESPONSE_CODES.UNAUTHORIZED,
      message: CommonMessages.UNAUTHORIZED_USER,
      data: null,
    });
  }
};

export default authMiddleWare;
