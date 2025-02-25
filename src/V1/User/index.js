import multer from "multer";
import userController from './user.controller';
import schemaValidator from '../helpers/schemaValidator';
import { createUser, serProfileValidator, listAllUser, resendInvite, userTaskListValidator } from './user.validator';
import { getAccessRoles } from '../helpers/commonFunction';
import Authorization from '../helpers/authorization';

import { S3Client } from '@aws-sdk/client-s3';
const s3 = new S3Client({ region: process.env.AWS_REGION });

const upload = multer({
    storage: multer.memoryStorage(),
    s3: s3,
});

export default class User {
    constructor(router, db) {
        this.authorization = new Authorization();
        this.router = router;
        this.db = db;
        this.userInstance = new userController()
    }
    async routes() {
        await this.userInstance.init(this.db)
        await this.authorization.init(this.db);

        let userAccess = await getAccessRoles(this.db);

        // const uploadFields = upload.fields([
        //     { name: 'files', maxCount: 1 }, // Typically only one profile picture
        // ])

        /** add users */
        this.router.post('/user/add', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.User]), upload.array('files'), (req, res) => {
            this.userInstance.addUser(req, res)
        });


        /** users detail */
        this.router.get('/users/detail/:user_id', await this.authorization.authorize([userAccess.Client, userAccess.User]), (req, res) => {
            this.userInstance.getUserDetail(req, res)
        });

        /** delete user */
        this.router.delete('/users/delete/:user_id', await this.authorization.authorize([userAccess.Client, userAccess.Admin, userAccess.AccountManager, userAccess.User]), (req, res) => {
            this.userInstance.deleteUserDetail(req, res)
        });

        /** list all users */
        this.router.post('/users/list', await this.authorization.authorize([userAccess.Client, userAccess.Agent, userAccess.User]), schemaValidator(listAllUser), (req, res) => {
            this.userInstance.listUser(req, res)
        });

         /** users edit*/
         this.router.put('/users/edit', await this.authorization.authorize([userAccess.Client, userAccess.User]),upload.array('files'), (req, res) => {
            this.userInstance.editUser(req, res)
        });


        this.router.get('/subscription-setting/cron', (req, res) => {
            this.userInstance.subscriptionSettingCron(req, res)
        });

        /** user assigned  task List */
        this.router.post('/users/task-list', await this.authorization.authorize([userAccess.User]), schemaValidator(userTaskListValidator), (req, res) => {
            this.userInstance.userTaskList(req, res)
        });

    }
}


