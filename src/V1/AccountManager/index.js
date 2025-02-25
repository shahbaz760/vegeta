
import multer from "multer";
import accountManagerController from './accountManager.controller';
import schemaValidator from '../helpers/schemaValidator';
import { deleteAccountManagerValidator, listAllAccountManager, AssignClientToAccountManager, assignClientsValidator, assignAgentsValidator} from './accountManager.validator';
import { getAccessRoles } from '../helpers/commonFunction';
import Authorization from '../helpers/authorization';

import { S3Client } from '@aws-sdk/client-s3';
const s3 = new S3Client({ region: process.env.AWS_REGION });

  const upload = multer({ 
    storage: multer.memoryStorage(),
    s3: s3,
 });

export default class AccountManager {
    constructor(router, db) {
        this.authorization = new Authorization();
        this.router = router;
        this.db = db;
        this.accountManagerInstance = new accountManagerController()
    }
    async routes() {
        await this.accountManagerInstance.init(this.db)
        await this.authorization.init(this.db);

        let userAccess = await getAccessRoles(this.db);

        /** list all Account Manager */
        this.router.post('/accountManager/list', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(listAllAccountManager), (req, res) => {
            this.accountManagerInstance.accountManagerList(req, res)
        });

        /** delete users */
        this.router.post('/accountManager/delete', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(deleteAccountManagerValidator), (req, res) => {
            this.accountManagerInstance.accountManagerDelete(req, res)
        });

        /**Detail of Account Manager */
        this.router.get('/accountManager/detail/:accountManager_Id', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), (req, res) => {
        this.accountManagerInstance.accountManagerDetailPage(req, res)
        });


        /**assign Clients to Account Manager */
        this.router.post('/accountManager/AssignClients', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(AssignClientToAccountManager), (req, res) => {
            this.accountManagerInstance.updateAccountManager(req, res)
        });

        /**client list for Account Manager  */
        this.router.get('/accountManager/client-list', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), (req, res) => {
            this.accountManagerInstance.accountManagerClientList(req, res)
        });

        
        /**update Account Manager detail */
        this.router.put('/accountManager/update', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), upload.array('files'), (req, res) => {
            this.accountManagerInstance.updateAccountManagerInfo(req, res)
        });


        /**add Account Manager detail */
        this.router.post('/accountManager/add', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), upload.array('files'), (req, res) => {
            this.accountManagerInstance.addAccountManagerInfo(req, res)
        });


        /** Assign clients to account manager  */
        this.router.post('/accountManager/assign-clients', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(assignClientsValidator), (req, res) => {
            this.accountManagerInstance.assignClientsToAccountManagers(req, res)
        });

        /** Assign agents to account manager  */
        this.router.post('/accountManager/assign-agents', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(assignAgentsValidator), (req, res) => {
            this.accountManagerInstance.assignAgentsToAccountManagers(req, res)
        });

        /**Assigned agent list for Account Manager  */
        this.router.get('/accountManager/agent-list', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), (req, res) => {
            this.accountManagerInstance.accountManagerAgentList(req, res)
        });
        
        
    }
}

