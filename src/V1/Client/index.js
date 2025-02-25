
import multer from "multer";
import clientController from './client.controller';
import schemaValidator from '../helpers/schemaValidator';
import { createClient, setClientPasswordValidator, deleteClientValidator, listAllClients,AgentRecentActivityList, updateClientValidator, assignAgentValidator, listAllAgentsAssignToClient, unassignAgentValidator, addSubscription, assignAccountManagerValidator, unassignAccountManagerValidator, setDefaultAccountManagerValidator, addPassManagers, billingListValidator, addCardValidator, updateCardValidator, billingHistoryValidator, cancelSubscriptionValidator, subscriptionLogValidator, editSubscription, updateReminderSettingValidator, listAllClientsForAssign, subscriptionHistorySaved, clickDocusignLinkValidator, addRolesPermissionValidator, addBankValidator, updateBankValidator, buySubscription } from './client.validator';
import { getAccessRoles } from '../helpers/commonFunction';
import Authorization from '../helpers/authorization';

import { S3Client } from '@aws-sdk/client-s3';
const s3 = new S3Client({ region: process.env.AWS_REGION });

const upload = multer({
    storage: multer.memoryStorage(),
    s3: s3,
});

export default class Client {
    constructor(router, db) {
        this.authorization = new Authorization();
        this.router = router;
        this.db = db;
        this.clientInstance = new clientController()
    }
    async routes() {
        await this.clientInstance.init(this.db)
        await this.authorization.init(this.db);

        let userAccess = await getAccessRoles(this.db);

        const uploadFields = upload.fields([
            { name: 'file', maxCount: 1 }, // Typically only one profile picture
        ])
        /** add Client */
        this.router.post('/client/add', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(createClient), (req, res) => {
            this.clientInstance.addClient(req, res)
        });

        /** verified Client token*/
        this.router.post('/client/set-password', schemaValidator(setClientPasswordValidator), (req, res) => {
            this.clientInstance.setClientPassword(req, res)
        });

        /** get Client  detail by clientId*/
        this.router.get('/client/detail/:client_id', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), (req, res) => {
            this.clientInstance.getClient(req, res)
        });

        /** list all clients */
        this.router.post('/client/list', await this.authorization.authorize([userAccess.Admin, userAccess.Agent ,userAccess.AccountManager]), schemaValidator(listAllClients), (req, res) => {
            this.clientInstance.clientList(req, res)
        });

        /** update client information */
        this.router.put('/client/update-profile', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]),
            upload.array('files'),
            (req, res) => {
                this.clientInstance.updateClientInfo(req, res)
            });

        /** delete users */
        this.router.post('/client/delete', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(deleteClientValidator), (req, res) => {
            this.clientInstance.deleteClient(req, res)
        });

        /* get client image */
        this.router.route("/client/image/:user_image")
            .get((req, res) => this.clientInstance.getClientImage(req, res));


        /* set password link */
        this.router.route("/client/set-password-link")
            .post((req, res) => this.clientInstance.set_password_link(req, res));


        /** search agents for assign to client */
        this.router.get('/client/search-agent/:search', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), (req, res) => {
            this.clientInstance.searchAgent(req, res)
        });


        /** Assign agents to client */
        this.router.post('/client/assign-agents', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(assignAgentValidator), (req, res) => {
            this.clientInstance.assignAgents(req, res)
        });


        /** list all agents assigned to client */
        this.router.post('/client/assign-agents-list', await this.authorization.authorize([userAccess.Admin, userAccess.Agent, userAccess.Client, userAccess.User, userAccess.AccountManager]), schemaValidator(listAllAgentsAssignToClient), (req, res) => {
            this.clientInstance.assignedAgentList(req, res)
        });


        /** Unassign agent from client */
        this.router.post('/client/unassign-agent', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(unassignAgentValidator), (req, res) => {
            this.clientInstance.unassignAgents(req, res)
        });


        /** Give subscription to client */
        this.router.post('/client/add-subscription', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager, userAccess.Client]), schemaValidator(addSubscription), (req, res) => {
            this.clientInstance.addSubscription(req, res)
        });

        /** get client subscriptions */
        this.router.post('/client/subscription-list', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(listAllAgentsAssignToClient), (req, res) => {
            this.clientInstance.getClientSubscriptions(req, res)
        });

        /** get client subscription detail */
        this.router.get('/client/subscription-detail/:subscription_id', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), (req, res) => {
            this.clientInstance.getClientSubscriptionDetail(req, res)
        });


        /** get client subscriptions */
        this.router.post('/subscription-webhook', (req, res) => {
            this.clientInstance.subscriptionWebhook(req, res)
        });


        /** Assign account manager to client */
        this.router.post('/client/assign-account-manager', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(assignAccountManagerValidator), (req, res) => {
            this.clientInstance.assignAccountManagers(req, res)
        });


        /** list all account manager assigned to client */
        this.router.post('/client/assign-account-manager-list', await this.authorization.authorize([userAccess.Admin, userAccess.Client ,userAccess.AccountManager, userAccess.User]), schemaValidator(listAllAgentsAssignToClient), (req, res) => {
            this.clientInstance.assignedAccountmanagerList(req, res)
        });


        /** Unassign account manager from client */
        this.router.post('/client/unassign-account-manager', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(unassignAccountManagerValidator), (req, res) => {
            this.clientInstance.unssignAccountManager(req, res)
        });


        /** search account manager for assign to client */
        this.router.get('/client/search-account-manager/:search', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), (req, res) => {
            this.clientInstance.searchAccountManager(req, res)
        });


        /** Docusign completed callback result */

        this.router.get('/docusign-completed/:subscription_id', (req, res) => {
            this.clientInstance.docusignCompleted(req, res)

        });

        /** Unassign account manager from client */
        this.router.post('/client/set-default-account-manager', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(setDefaultAccountManagerValidator), (req, res) => {
            this.clientInstance.setDefaultAccountManager(req, res)
        });


        /** get card  detail of subscription */
        this.router.get('/client/get-card-detail', (req, res) => {
            this.clientInstance.getCardDetail(req, res)

        });


        /** recent Activity List */
        this.router.get('/client/recent-activity', await this.authorization.authorize([userAccess.Client]), (req, res) => {
            this.clientInstance.recentActityList(req, res)
        });

        /** due date task List */
        this.router.get('/client/task-list', await this.authorization.authorize([userAccess.Client, userAccess.Agent]), (req, res) => {
            this.clientInstance.dueTaskList(req, res)
        });

        /**add password manager */
        this.router.post('/client/add-password-manager', await this.authorization.authorize([userAccess.Client, userAccess.User]), schemaValidator(addPassManagers), (req, res) => {
            this.clientInstance.addPasswordManager(req, res)
        });

        /**listing password managers */
        this.router.post('/client/list-password-manager', await this.authorization.authorize([userAccess.Client, userAccess.Agent, userAccess.User]), (req, res) => {
            this.clientInstance.listPasswordManager(req, res)
        });

        /**update password manager */
        this.router.put('/client/update-password-manager', await this.authorization.authorize([userAccess.Client, userAccess.User]), (req, res) => {
            this.clientInstance.updatePasswordManager(req, res)
        });

        /**delete password manager and its assigned agents*/
        this.router.delete('/client/delete-password-manager/:password_manager_id', await this.authorization.authorize([userAccess.Client, userAccess.User]), (req, res) => {
            this.clientInstance.delete_password_manager(req, res)
        });

        /**details of password manager and its assigned agents*/
        this.router.get('/client/details-password-manager/:password_manager_id', await this.authorization.authorize([userAccess.Client, userAccess.User]), (req, res) => {
            this.clientInstance.detail_password_manager(req, res)
        });

        /**add shared_file*/
        this.router.post('/client/shared-file-upload', await this.authorization.authorize([userAccess.Client, userAccess.User]), uploadFields, (req, res) => {
            this.clientInstance.create_shared_files(req, res)
        });


        /**deletion of shared_file*/
        this.router.delete('/client/shared-file-delete/:file_id', await this.authorization.authorize([userAccess.Client, userAccess.User]), (req, res) => {
            this.clientInstance.delete_file(req, res)
        });

        /**list of shared_file*/
        this.router.post('/client/shared-files-list', await this.authorization.authorize([userAccess.Client, userAccess.Agent, userAccess.User]), (req, res) => {
            this.clientInstance.listFile(req, res)
        });

        /** get default account manager details*/
        this.router.get('/client/default-Account-Manager/:client_id', await this.authorization.authorizeForDocusign([ userAccess.Client, userAccess.User]), (req, res) => {
            this.clientInstance.getDefaultAccountManager(req, res)
        });


        /** add card  for client */
        this.router.post('/client/add-card', await this.authorization.authorizeForDocusign([userAccess.Client, userAccess.User]), schemaValidator(addCardValidator), (req, res) => {
            this.clientInstance.addCard(req, res)
        });


        /** get client billing list */
        this.router.post('/client/billing-list', await this.authorization.authorizeForDocusign([userAccess.Client, userAccess.User]), schemaValidator(billingListValidator), (req, res) => {
            this.clientInstance.getClientBillings(req, res)
        });

        /** get client billing detail */
        this.router.get('/client/billing-detail/:subscription_id', await this.authorization.authorizeForDocusign([userAccess.Client, userAccess.User]), (req, res) => {
            this.clientInstance.getClientBillingDetail(req, res)
        });


        /** get card list */
        this.router.get('/client/card-list/:subscription_id', await this.authorization.authorizeForDocusign([userAccess.Client, userAccess.User]),(req, res) => {
            this.clientInstance.getCardList(req, res)
        });

        /** get card detail */
        this.router.get('/client/card-detail/:card_id', await this.authorization.authorizeForDocusign([userAccess.Client, userAccess.User]),(req, res) => {
            this.clientInstance.getCard(req, res)
        });

        /** delete card */
        this.router.delete('/client/card-delete/:card_id/:subscription_id', await this.authorization.authorizeForDocusign([userAccess.Client, userAccess.User]),(req, res) => {
            this.clientInstance.deleteCard(req, res)
        });

        /** update card */
        this.router.put('/client/update-card', await this.authorization.authorizeForDocusign([ userAccess.Client, userAccess.User]), schemaValidator(updateCardValidator), (req, res) => {
            this.clientInstance.updateCard(req, res)
        });


        /** get client billing history */
        this.router.post('/client/billing-history', await this.authorization.authorizeForDocusign([userAccess.Client, userAccess.User]), schemaValidator(billingHistoryValidator), (req, res) => {
            this.clientInstance.getClientBillingHistory(req, res)
        });


        /** cancel subscription to client */
        this.router.post('/client/cancel-subscription', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.AccountManager, userAccess.User]), schemaValidator(cancelSubscriptionValidator), (req, res) => {
            this.clientInstance.cancelSubscription(req, res)
        });

         /** recent Activity List */
         this.router.post('/client/agent-recent-activity', await this.authorization.authorize([userAccess.Client, userAccess.Agent, userAccess.User]), schemaValidator(AgentRecentActivityList), (req, res) => {
            this.clientInstance.agentRecentActivityList(req, res)
        });

        /** get client subscription logs */
        this.router.post('/client/subscription-logs', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(subscriptionLogValidator), (req, res) => {
            this.clientInstance.getClientSubscriptionLogs(req, res)
        });


        /** Edit client subscription */
        this.router.post('/client/edit-subscription', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(editSubscription), (req, res) => {
            this.clientInstance.editSubscription(req, res)
        });


        /** resend client subscription link*/
        this.router.get('/client/resend-subscription-link/:subscription_id', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), (req, res) => {
            this.clientInstance.resendSubscriptionLink(req, res)
        });


        /** delete subscription history */
        this.router.delete('/client/delete-billing-history/:id', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), (req, res) => {
            this.clientInstance.deleteBillingHistory(req, res)
        });

        /** update client reminder setting */
        this.router.post('/client/update-reminder-setting', await this.authorization.authorize([userAccess.Client, userAccess.User]), schemaValidator(updateReminderSettingValidator), (req, res) => {
            this.clientInstance.updateReminderSetting(req, res)
        });

        /** get client reminder setting */
        this.router.get('/client/get-reminder-setting', await this.authorization.authorize([userAccess.Client, userAccess.User]), (req, res) => {
            this.clientInstance.getReminderSetting(req, res)
        });

        /** client assigned task olny api */
        this.router.get('/client/assigned-task-olny/:user_id', await this.authorization.authorize([userAccess.Client, userAccess.User]), (req, res) => {
            this.clientInstance.assignedTaskOnly(req, res)
        });


        /** pause subscription*/
        this.router.get('/client/subscription-pause/:subscription_id', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), (req, res) => {
            this.clientInstance.pauseSubscription(req, res)
        });

        /** resume subscription*/
        this.router.get('/client/subscription-resume/:subscription_id', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), (req, res) => {
            this.clientInstance.resumeSubscription(req, res)
        });


        /** get Client  image */
        this.router.get('/client/get-shared-file/:file_name', await this.authorization.authorize([userAccess.Client, userAccess.Agent, userAccess.AccountManager, userAccess.User]), (req, res) => {
            this.clientInstance.getClientSharedFile(req, res)
        });

        /** list all clients for assign */
        this.router.post('/client/list-for-assign', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(listAllClientsForAssign), (req, res) => {
            this.clientInstance.clientListForAssign(req, res)
        });


        this.router.post('/client/subscription-history-saved', schemaValidator(subscriptionHistorySaved), (req, res) => {
            this.clientInstance.subscriptionHistorySaved(req, res)
        });


        this.router.post('/client/click-docusign-link', await this.authorization.authorizeForDocusign([userAccess.Admin, userAccess.Client, userAccess.AccountManager]), schemaValidator(clickDocusignLinkValidator), (req, res) => {
            this.clientInstance.clickDocusignLinkSave(req, res)
        });


        /** add role-and-permission for users added by client */
        this.router.post('/client/setting/role-and-permission/add', await this.authorization.authorize([userAccess.Client, userAccess.User]), schemaValidator(addRolesPermissionValidator), (req, res) => {
            this.clientInstance.addRolesAndPermissionForUser(req, res)
        });


        /** update role-and-permission */
        this.router.put('/client/setting/update-role-and-permission/:role_permission_id', await this.authorization.authorize([userAccess.Client, userAccess.User]), schemaValidator(addRolesPermissionValidator), (req, res) => {
            this.clientInstance.updateRolesAndPermissionForUser(req, res)
        });


        /** resend client subscription link*/
        this.router.get('/client/regenerate-subscription-link-cron', (req, res) => {
            this.clientInstance.expireSubscriptionLinkCronFunction(req, res)
        });


        /** get subscription payment link*/
        this.router.get('/client/get-subscription-payment-link/:subscription_id', (req, res) => {
            this.clientInstance.getSubscriptionPaymentLink(req, res)
        });


        /** add bank  for client */
        this.router.post('/client/add-bank', await this.authorization.authorizeForDocusign([userAccess.Client, userAccess.User]), schemaValidator(addBankValidator), (req, res) => {
            this.clientInstance.addBank(req, res)
        });


        /** update bank */
        this.router.post('/client/update-bank', await this.authorization.authorizeForDocusign([ userAccess.Client, userAccess.User]), schemaValidator(updateBankValidator), (req, res) => {
            this.clientInstance.updateBank(req, res)
        });
        

        /** purchase subscription for client */
        this.router.post('/client/buy-subscription', schemaValidator(buySubscription), (req, res) => {
            this.clientInstance.buySubscription(req, res)
        });


        /** get access shared file */
        this.router.get('/access-shared-file/:token', (req, res) => {
            this.clientInstance.accessSharedFileUrl(req, res)
        });
        
    }
}


