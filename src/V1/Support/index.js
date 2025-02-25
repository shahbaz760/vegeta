import multer from "multer";
import supportController from './support.controller';
import schemaValidator from '../helpers/schemaValidator';
import {supportListValidator, addDepartmentValidator, departmentListValidator, keywordListValidator,updateKeywordValidator, updateDepartmentValidator, addKeywordValidator, addKeywordMailValidator, addKeywordNotificationEmailValidator, markAsCloseValidator, updateSupportStatusValidator } from './support.validator';
import { getAccessRoles } from '../helpers/commonFunction';
import Authorization from '../helpers/authorization';

import { S3Client } from '@aws-sdk/client-s3';
const s3 = new S3Client({ region: process.env.AWS_REGION });

const upload = multer({
    storage: multer.memoryStorage(),
    s3: s3,
});

export default class Project {
    constructor(router, db) {
        this.authorization = new Authorization();
        this.router = router;
        this.db = db;
        this.supportInstance = new supportController()
    }
    async routes() {
        await this.supportInstance.init(this.db)
        await this.authorization.init(this.db);

        let userAccess = await getAccessRoles(this.db);

        /** add support */
        this.router.post('/support/add', await this.authorization.authorizeForDocusign([userAccess.Client, userAccess.User]), upload.array('files'), (req, res) => {
            this.supportInstance.addSupport(req, res)
        });

        /** support list */
        this.router.post('/support/list', await this.authorization.authorizeForDocusign([userAccess.Admin, userAccess.Client, userAccess.AccountManager, userAccess.User]), schemaValidator(supportListValidator), (req, res) => {
            this.supportInstance.getSupportList(req, res)
        });

        /** get support details */
        this.router.get('/support/details/:support_id', await this.authorization.authorizeForDocusign([userAccess.Admin, userAccess.Client, userAccess.AccountManager, userAccess.User]), (req, res) => {
            this.supportInstance.getSupportDetail(req, res)
        });

         /** delete support details */
         this.router.delete('/support/delete/:support_id', await this.authorization.authorizeForDocusign([userAccess.Admin, userAccess.Client, userAccess.User]), (req, res) => {
            this.supportInstance.deleteSupportDetail(req, res)
        });


        /** update support */
        this.router.put('/support/update', await this.authorization.authorizeForDocusign([userAccess.Admin, userAccess.Client, userAccess.User, userAccess.AccountManager]), upload.array('files'), (req, res) => {
            this.supportInstance.updateSupport(req, res)
        });


        /** delete support details */
        this.router.delete('/support/delete-attachment/:attachment_id', await this.authorization.authorizeForDocusign([userAccess.Admin, userAccess.Client, userAccess.User]), (req, res) => {
            this.supportInstance.deleteSupportAttachment(req, res)
        });

    /** -------------------------------Department Section apis-------------------------------------- */

        /** add department */
        this.router.post('/department/add', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(addDepartmentValidator), (req, res) => {
            this.supportInstance.addDepartment(req, res)
        });
      
        /** department list */
        this.router.post('/department/list', await this.authorization.authorizeForDocusign([userAccess.Admin, userAccess.Client, userAccess.AccountManager, userAccess.User]), schemaValidator(departmentListValidator), (req, res) => {
            this.supportInstance.getDepartmentList(req, res)
        });

        /** get department details */
        this.router.get('/department/details/:department_id', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), (req, res) => {
            this.supportInstance.getDepartmentDetail(req, res)
        });


        /** delete department details */
        this.router.delete('/department/delete/:department_id', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), (req, res) => {
            this.supportInstance.deleteDepartment(req, res)
        });


        /** update department */
        this.router.put('/department/update', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(updateDepartmentValidator), (req, res) => {
            this.supportInstance.updateDepartment(req, res)
        });


        /** get user role list */
        this.router.get('/user-role/list', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.AccountManager]), (req, res) => {
            this.supportInstance.userRoleList(req, res)
        });

        /** add keyword */
        this.router.post('/add/keyword', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(addKeywordValidator), (req, res) => {
            this.supportInstance.addKeyword(req, res)
        });

        /** list keyword */
        this.router.post('/keyword/list', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.Agent, userAccess.User, userAccess.AccountManager]),schemaValidator(keywordListValidator), (req, res) => {
            this.supportInstance.listKeyword(req, res)
        });

        /** update keyword */
        this.router.put('/keyword/update', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]),schemaValidator(updateKeywordValidator), (req, res) => {
            this.supportInstance.keywordUpdate(req, res)
        });

        /** delete keyword */
        this.router.delete('/keyword/delete/:keyword_id', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), (req, res) => {
            this.supportInstance.keywordDelete(req, res)
        });

        /** send mail to admin keyword */
        this.router.post('/keyword/mail', await this.authorization.authorize([ userAccess.Admin, userAccess.Client, userAccess.Agent, userAccess.User, userAccess.AccountManager]), schemaValidator(addKeywordMailValidator), (req, res) => {
            this.supportInstance.keywordMail(req, res)
        });


        /** Add emails for admin keyword */
        this.router.post('/keyword-notification-email/add', await this.authorization.authorize([ userAccess.Admin, userAccess.Client, userAccess.Agent, userAccess.User, userAccess.AccountManager]), schemaValidator(addKeywordNotificationEmailValidator), (req, res) => {
            this.supportInstance.AddNotificationKeywordEmail(req, res)
        });

        /** support mark as close*/
        this.router.post('/support/mark-as-close', await this.authorization.authorizeForDocusign([userAccess.Client, userAccess.User]), schemaValidator(markAsCloseValidator), (req, res) => {
            this.supportInstance.maskAsClose(req, res)
        });


        /** add support */
        this.router.post('/support/add-message', await this.authorization.authorizeForDocusign([userAccess.Admin, userAccess.Client, userAccess.AccountManager, userAccess.User]), upload.array('files'), (req, res) => {
            this.supportInstance.addSupportMessage(req, res)
        });


        /** update support status*/
        this.router.put('/support/update-status', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.User, userAccess.AccountManager]), schemaValidator(updateSupportStatusValidator),(req, res) => {
            this.supportInstance.updateSupportStatus(req, res)
        });

    
    }
}


