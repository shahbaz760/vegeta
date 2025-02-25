import multer from "multer";
import taskController from './task.controller';
import schemaValidator from '../helpers/schemaValidator';
import { taskListValidator, deleteFilesValidator, sortTasks, moveTasksInColumns, changetaskStatus, taskLabelValidator, taskLabelListValidator, subTaskListValidator } from './task.validator';
import { getAccessRoles } from '../helpers/commonFunction';
import Authorization from '../helpers/authorization';

import { S3Client } from '@aws-sdk/client-s3';
const s3 = new S3Client({ region: process.env.AWS_REGION });

const upload = multer({
    storage: multer.memoryStorage(),
    s3: s3,
});

export default class Product {
    constructor(router, db) {
        this.authorization = new Authorization();
        this.router = router;
        this.db = db;
        this.taskInstance = new taskController()
    }
    async routes() {
        await this.taskInstance.init(this.db)
        await this.authorization.init(this.db);

        let userAccess = await getAccessRoles(this.db);

        const uploadFields = upload.fields([
            { name: 'files' },
            { name: 'voice_record_file', maxCount: 1 }, // Typically only one profile picture
            { name: "screen_record_file", maxCount: 1 }
        ]);

        /** add Task */
        this.router.post('/project/task/add', await this.authorization.authorize([userAccess.Client, userAccess.User, userAccess.Agent]), uploadFields, (req, res) => {
            this.taskInstance.addTask(req, res)
        });


        /** list all tasks */
        this.router.post('/project/task/list', await this.authorization.authorize([userAccess.Client,userAccess.Agent, userAccess.User, userAccess.Agent]), schemaValidator(taskListValidator), (req, res) => {
            this.taskInstance.taskList(req, res)
        });

        /** Tasks details */
        this.router.get('/project/task-detail/:task_id', await this.authorization.authorize([userAccess.Client, userAccess.Agent, userAccess.User]), (req, res) => {
            this.taskInstance.taskDetail(req, res)
        });

        /** Tasks delete */
        this.router.delete('/project/task-delete/:task_id', await this.authorization.authorize([userAccess.Client, userAccess.User, userAccess.Agent]), (req, res) => {
            this.taskInstance.taskDelete(req, res)
        });

        /** edit Task */
        this.router.post('/project/task/edit', await this.authorization.authorize([userAccess.Client, userAccess.User, userAccess.Agent]), uploadFields, (req, res) => {
            this.taskInstance.editTask(req, res)
        });


        /** delete files and voice or screen recording */
        this.router.post('/project/task/delete-files', await this.authorization.authorize([userAccess.Client, userAccess.User, userAccess.Agent]), schemaValidator(deleteFilesValidator), (req, res) => {
            this.taskInstance.deleteFiles(req, res)
        });


        /** column task up-down */
        this.router.post('/project/task/sort', await this.authorization.authorize([userAccess.Client, userAccess.Agent, userAccess.User]), schemaValidator(sortTasks), (req, res) => {
            this.taskInstance.sortColumnTask(req, res)
        });


        /** task move on left right one column to another */
        this.router.post('/project/task/move-in-column', await this.authorization.authorize([userAccess.Client, userAccess.Agent, userAccess.User]), schemaValidator(moveTasksInColumns), (req, res) => {
            this.taskInstance.moveTaskInColumns(req, res)
        });

        /** Change task status */
        this.router.post('/project/task/status-update', await this.authorization.authorize([userAccess.Agent, userAccess.User]), schemaValidator(changetaskStatus), (req, res) => {
            this.taskInstance.taskStatusUpdate(req, res)
        });


        /** task move on left right one column to another */
        this.router.get('/project/complete-task/:task_id', await this.authorization.authorize([userAccess.Client, userAccess.Agent, userAccess.User]), (req, res) => {
            this.taskInstance.taskComplete(req, res)
        });


        /** add labels in project */
        this.router.post('/project/task-label/add', await this.authorization.authorize([userAccess.Client, userAccess.User, userAccess.Agent]), schemaValidator(taskLabelValidator), (req, res) => {
            this.taskInstance.addTaskLabel(req, res)
        });

        /** labels list */
        this.router.post('/project/task-label/list', await this.authorization.authorize([userAccess.Client, userAccess.User, userAccess.Agent]), schemaValidator(taskLabelListValidator), (req, res) => {
            this.taskInstance.taskLabelList(req, res)
        });


        /** list all sub task tasks */
        this.router.post('/project/sub-task/list', await this.authorization.authorize([userAccess.Client,userAccess.Agent, userAccess.User]), schemaValidator(subTaskListValidator), (req, res) => {
            this.taskInstance.subTaskList(req, res)
        });

        /** sub Tasks details */
        this.router.get('/project/sub-task-detail/:task_id', await this.authorization.authorize([userAccess.Client, userAccess.Agent, userAccess.User]), (req, res) => {
            this.taskInstance.subTaskDetail(req, res)
        });

        /** get Tasks group details */
        this.router.get('/project/task-group-detail/:task_id', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.Agent, userAccess.AccountManager, userAccess.User]), (req, res) => {
            this.taskInstance.getTaskGroupDetail(req, res)
        });

        /** delete task labels */
        this.router.delete('/project/task-label/delete/:label_id', await this.authorization.authorize([userAccess.Client, userAccess.User, userAccess.Agent]), (req, res) => {
            this.taskInstance.deleteTaskLabel(req, res)
        });

        /** add task chat messages */
        this.router.post('/project/task/add-message', await this.authorization.authorize([userAccess.Client, userAccess.AccountManager, userAccess.Agent, userAccess.User]), upload.array('files'), (req, res) => {
            this.taskInstance.addTaskMessage(req, res)
        });

        /** get Tasks chat */
        this.router.get('/project/task-chat/:task_id', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.Agent, userAccess.AccountManager, userAccess.User]), (req, res) => {
            this.taskInstance.getTaskChat(req, res)
        });
        

    }
}