import multer from "multer";
import authController from "./auth.controller"
import schemaValidator from "../helpers/schemaValidator"
import { loginValidator, forgotPasswordValidator, otpVerifyValidator, resetPasswordValidator, changePasswordValidator, updateUserStatus, socialLoginValidator, updateAuthenticationStatus, getDashboardCount, resendOtpValidator, getFinanceReportValidator, financialReportValidator, updateTwoFactorSettingValidator, addRolesPermissionValidator, listAllRoles, subscriptionSettingValidator, notificationListValidator, slackNotificationTypeValidator, enablecalendarValidator,removeCalendarValidator } from "./auth.validator"
import Authorization from "../helpers/authorization";
import { getAccessRoles,addOutLookCalenderEvent } from '../helpers/commonFunction';

import { S3Client } from '@aws-sdk/client-s3';
const s3 = new S3Client({ region: process.env.AWS_REGION });

const upload = multer({
    storage: multer.memoryStorage(),
    s3: s3,
});

export default class auth {
    constructor(router, db) {
        this.authorization = new Authorization();
        this.router = router;
        this.db = db;
        this.authInstance = new authController();
    }
    async routes() {
        await this.authInstance.init(this.db);
        await this.authorization.init(this.db);
        let userAccess = await getAccessRoles(this.db);

        // const uploadFields = upload.fields([
        //     { name: 'profile_image', maxCount: 1 }, // Typically only one profile picture
        // ])

        /** user login */
        this.router.post('/auth/login', schemaValidator(loginValidator), (req, res) => {
            this.authInstance.userLogin(req, res)
        })

        this.router.get('/auth/refresh-token', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.Agent, userAccess.AccountManager, userAccess.User]), (req, res) => {
            this.authInstance.refreshToken(req, res)
        })

        /** user logout */
        this.router.post('/auth/logout', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.Agent, userAccess.AccountManager, userAccess.User]),
            (req, res) => {
                this.authInstance.logout(req, res)
            })

        /** forgot password */
        this.router.post('/auth/forgot-password', schemaValidator(forgotPasswordValidator), (req, res) => {
            this.authInstance.forgotPassword(req, res)
        });

        /* verify otp */
        this.router.post('/otp-verify', schemaValidator(otpVerifyValidator), (req, res) => {
            this.authInstance.verifyOtp(req, res)
        });

        /** reset password */
        this.router.post('/auth/reset-password', schemaValidator(resetPasswordValidator), (req, res) => {
            this.authInstance.resetPassword(req, res)
        })

        /** change password */
        this.router.post('/auth/change-password', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.Agent, userAccess.AccountManager, userAccess.User]),
            schemaValidator(changePasswordValidator),
            (req, res) => {
                this.authInstance.changePassword(req, res)
            })

        /*** register client with google or facebook ***/
        this.router
            .route('/auth/social-login')
            .post(schemaValidator(socialLoginValidator), (req, res) => this.authInstance.socialLogin(req, res));


        /*** admin updated the user status  ***/
        this.router.post('/user/status-update', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.AccountManager]),
            schemaValidator(updateUserStatus),
            (req, res) => {
                this.authInstance.userStatusUpdate(req, res)
            })


        /*** admin updated the user status  ***/
        this.router.post('/user/two-factor-authentication', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager, userAccess.Agent, userAccess.Client, userAccess.User]),
            schemaValidator(updateAuthenticationStatus),
            (req, res) => {
                this.authInstance.userTwoFactorAuthentication(req, res)
            })

        /*** get country LIST  ***/
        // this.router.get('/country-list', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.Agent, userAccess.AccountManager,userAccess.User]),
        // (req, res) => {
        //     this.authInstance.getCountryList(req, res)
        // })

        this.router.get('/country-list', (req, res) => {
            this.authInstance.getCountryList(req, res)
        })

        /*** get state list  ***/
        this.router.get('/state-list/:country_name', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.Agent, userAccess.AccountManager, userAccess.User]),
            (req, res) => {
                this.authInstance.getStateList(req, res)
            })


        /*** get counts for dashboard graph ***/
        this.router.post('/get-dashboard-count', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(getDashboardCount),
            (req, res) => {
                this.authInstance.getDashboardCount(req, res)
            });

        /* resend otp */
        this.router.post('/resend-otp', schemaValidator(resendOtpValidator), (req, res) => {
            this.authInstance.resendOtp(req, res)
        });

        /* get Profile details*/
        this.router.get('/user-profile/details', await this.authorization.authorizeForDocusign([userAccess.Admin, userAccess.AccountManager, userAccess.Agent, userAccess.Client, userAccess.User]), (req, res) => {
            this.authInstance.userProfileDetails(req, res)
        });

        /* update Profile */
        this.router.put('/user-profile/update', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager, userAccess.Agent, userAccess.Client, userAccess.User]), upload.array('files'), (req, res) => {
            this.authInstance.userProfileUpdate(req, res)
        });


        /* Login Admin as a client profile */
        this.router.get('/auth/admin-login-as-client/:user_id', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager, userAccess.Client]), (req, res) => {
            this.authInstance.adminLoginAsClient(req, res)
        });


        /*** get churn report ***/
        this.router.post('/get-churn-report', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(getFinanceReportValidator),
            (req, res) => {
                this.authInstance.getChurnReport(req, res)
            });


        /*** get Retention report ***/
        this.router.post('/get-retention-report', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(getFinanceReportValidator),
            (req, res) => {
                this.authInstance.getRetentionReport(req, res)
            });


        /*** get customer overview report ***/
        this.router.post('/get-customer-overview-report', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(getFinanceReportValidator),
            (req, res) => {
                this.authInstance.getCustomerOverviewReport(req, res)
            });


        /*** get growth rate report ***/
        this.router.post('/get-growth-rate-report', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(getFinanceReportValidator),
            (req, res) => {
                this.authInstance.getGrowthRateReport(req, res)
            });


        /*** get mmr overview report ***/
        this.router.post('/get-mmr-overview-report', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(getFinanceReportValidator),
            (req, res) => {
                this.authInstance.getMmrOverviewReport(req, res)
            });


        /*** get financial report ***/
        this.router.post('/get-financial-report', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(financialReportValidator),
            (req, res) => {
                this.authInstance.getFinancialReport(req, res)
            });



        /*** get customer activity ***/
        this.router.get('/get-customer-activity', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]),
            (req, res) => {
                this.authInstance.getCustomerActivity(req, res)
            });



        /** get client reminder setting */
        this.router.get('/global/two-factor-authentication/get', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), (req, res) => {
            this.authInstance.getTwoFactorSetting(req, res)
        });


        /** update client reminder setting */
        this.router.post('/global/two-factor-authentication/update', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(updateTwoFactorSettingValidator), (req, res) => {
            this.authInstance.updateTwoFactorSetting(req, res)
        });


        /** add role-and-permission */
        this.router.post('/setting/role-and-permission/add', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(addRolesPermissionValidator), (req, res) => {
            this.authInstance.addRolesAndPermission(req, res)
        });

        /** get role-and-permission */
        this.router.get('/setting/get-role-and-permission/:role_permission_id', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager, userAccess.Client, userAccess.User]), (req, res) => {
            this.authInstance.getRolesAndPermission(req, res)
        });


        /** get role-and-permission list*/
        this.router.post('/setting/role-and-permission/list', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager, userAccess.Client, userAccess.User]), schemaValidator(listAllRoles), (req, res) => {
            this.authInstance.getRolesAndPermissionList(req, res)
        });


        /** delete role-and-permission */
        this.router.delete('/setting/delete-role-and-permission/:role_permission_id', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager, userAccess.Client, userAccess.User]), (req, res) => {
            this.authInstance.deleteRolesAndPermission(req, res)
        });


        /** update role-and-permission */
        this.router.put('/setting/update-role-and-permission/:role_permission_id', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(addRolesPermissionValidator), (req, res) => {
            this.authInstance.updateRolesAndPermission(req, res)
        });


        /** get user role-and-permission */
        this.router.get('/auth/get-user-permission', await this.authorization.authorizeForDocusign([userAccess.Admin, userAccess.AccountManager, userAccess.Client, userAccess.User]), (req, res) => {
            this.authInstance.getUserRolesAndPermission(req, res)
        });

        /** subscription setting */
        this.router.post('/global/subscription-setting', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(subscriptionSettingValidator), (req, res) => {
            this.authInstance.subscriptionSettingUpdate(req, res)
        });


        /** get subscription setting */
        this.router.get('/global/get-subscription-setting', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), (req, res) => {
            this.authInstance.getSubscriptionSetting(req, res)
        });


        // /** Notification list */
        this.router.post('/notification-list', await this.authorization.authorize([userAccess.Client, userAccess.Agent, userAccess.User]), schemaValidator(notificationListValidator), (req, res) => {
            this.authInstance.getNotificationList(req, res)
        });

        /** Notification read */
        this.router.get('/notification-read/:notification_id', await this.authorization.authorize([userAccess.Client, userAccess.Agent, userAccess.User]), (req, res) => {
            this.authInstance.readNotification(req, res)
        });


        /** Notification count */
        this.router.get('/notification-count', await this.authorization.authorize([userAccess.Client, userAccess.Agent, userAccess.User]), (req, res) => {
            this.authInstance.notificationCount(req, res)
        });


        /** get password setting */
        this.router.get('/global/get-password-setting', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager, userAccess.Client, userAccess.Agent, userAccess.User]), (req, res) => {
            this.authInstance.getPasswordSetting(req, res)
        });


        /** slack integration link*/
        this.router.get('/auth/slack-integration-link', await this.authorization.authorize([userAccess.Client, userAccess.Agent, userAccess.User]), (req, res) => {
            this.authInstance.slackIntegrationLink(req, res)
        });

        /** slack notification redirect*/
        this.router.get('/slack-notification-redirect', (req, res) => {
            this.authInstance.SlackRedirect(req, res)
        });


        /** slack integration link*/
        this.router.put('/auth/types-of-slack-notification/update', await this.authorization.authorize([userAccess.Client, userAccess.Agent, userAccess.User]), schemaValidator(slackNotificationTypeValidator), (req, res) => {
            this.authInstance.updateTypesOfSlackNotification(req, res)
        });


        /** add google event */
        this.router.get('/auth/add-google-event', await this.authorization.authorize([userAccess.Client, userAccess.Agent, userAccess.User]), (req, res) => {
            this.authInstance.addGoogleEvent(req, res)
        });


        /** Google calendar integration link*/
        this.router.get('/auth/google-integration-link', await this.authorization.authorize([userAccess.Client, userAccess.Agent, userAccess.User]), (req, res) => {
            this.authInstance.googleIntegrationLink(req, res)
        });


        /** Google calendar redirect*/
        this.router.get('/google-calendar-redirect', (req, res) => {
            this.authInstance.googleCalendarRedirect(req, res)
        });


        /** Google calendar redirect*/
        this.router.post('/auth/enable-calendar-sync', await this.authorization.authorize([userAccess.Client, userAccess.Agent, userAccess.User]), schemaValidator(enablecalendarValidator), (req, res) => {
            this.authInstance.enableCalendarSync(req, res)
        });


        this.router.get('/privacyPolicy', (req, res) => {
            this.authInstance.privacyPolicy(req, res)
        });

        this.router.get('/term_condition', (req, res) => {
            this.authInstance.termCondition(req, res)
        });
        /** outlook calendar redirect*/
        this.router.get('/outlook-calendar-redirect-auth', (req, res) => {
            this.authInstance.outlookCalendarRedirect(req, res)
        });
        /** outlook calendar auth*/
        this.router.get('/outlook/auth', await this.authorization.authorize([userAccess.Client, userAccess.Agent, userAccess.User, userAccess.Admin, userAccess.AccountManager]), (req, res) => {
            this.authInstance.authOutlook(req, res)
        });
        this.router.get('/outlook/add-event',/*  await this.authorization.authorize([userAccess.Client, userAccess.Agent, userAccess.User, userAccess.Admin, userAccess.AccountManager]), */ (req, res) => {
            addOutLookCalenderEvent(req, res)
        });
        
        /** Google calendar redirect*/
        this.router.get('/auth/get-slack-calendar-sync', await this.authorization.authorize([userAccess.Client, userAccess.Agent, userAccess.User]), (req, res) => {
            this.authInstance.getslackCalendarSync(req, res)
        });

        this.router.get('/auth/validate-jwt',await this.authorization.authorizeWithSecretKey(), await this.authorization.authorize([userAccess.Client, userAccess.Admin]), (req, res) => {
            this.authInstance.validateJwtToken(req, res)
        });
        this.router.post('/auth/remove-calender-sync', await this.authorization.authorize([userAccess.Client, userAccess.Agent, userAccess.User]), schemaValidator(removeCalendarValidator), (req, res) => {
            this.authInstance.removeCalendarSync(req, res)
        });
    }
}

