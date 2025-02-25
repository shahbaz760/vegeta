require("dotenv").config();
import Services from "./task.services.js";
import ProjectServices from "../Project/project.services.js";
import { RESPONSE_CODES, ROLES, RECENT_ACTIVITY_TYPE, ASSIGNED_USERS, SLACK_NOTIFICATION_TYPE } from "../../../config/constants.js";
import { successResponse, errorResponse } from "../../../config/responseHelper.js";
import { CommonMessages } from "../../../constants/message/common.js";
import { TaskMessages } from "../../../constants/message/task.js";
import moment from "moment";
import { uploadFileForAll, s3RemoveSingleFile, getCometChatGroupDetail, addGoogleCalenderEvent, addOutLookCalenderEvent, updateOutLookCalenderEvent, deleteOutLookCalenderEvent, updateGoogleCalenderEvent, deleteGoogleCalenderEvent } from "../helpers/commonFunction";
import { v4 as uuidv4 } from 'uuid';
import { Sequelize } from "sequelize";
const Op = Sequelize.Op;
import { taskReminder } from "../EmailTemplates/task_reminder.js"
import nodemailer from "../helpers/mail";
const momentTz = require("moment-timezone");
const Bull = require('bull');
// Create a new Bull queue for reminders
const reminderTaskQueue = new Bull('reminderTaskQueue', {
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD
    }
});

reminderTaskQueue.process(async (job) => {
    const { taskId, emails, task_detail } = job.data;
    console.log(`Reminder for task ${taskId} is triggered at ${new Date()}`);
    // Perform the reminder action here, e.g., send a notification, email, etc.
    task_detail.due_date_time = task_detail.due_date_time ? moment(new Date(task_detail.due_date_time)).format('DD MMMM YYYY hh:mm A') : "";

    task_detail.description = (task_detail.description) ? task_detail.description : "";

    const emailTemplate = await taskReminder(task_detail);
    const subject = "Task Reminder";
    let mailFunction = (process.env.PRODUCTION == true || process.env.PRODUCTION == "true") ? nodemailer.sendinBlueMail : nodemailer.sendMail;
    emails.forEach(async element => {
        await mailFunction(element, subject, emailTemplate);
    });
});

reminderTaskQueue.on('completed', (job) => {
    console.log(`Job completed with result: ${job}`);
});

reminderTaskQueue.on('failed', (job) => {
    console.log(`Job failed with result: ${job}`);
});



export default class Product {
    async init(db) {
        this.services = new Services();
        this.ProjectServices = new ProjectServices();
        this.Models = db.models;
        await this.services.init(db);
        await this.ProjectServices.init(db);
    }

    /** Schedule reminder with bull to send users */
    scheduleReminder = async (clientId, taskId, reminderTime, delay) => {
        console.log(`Scheduling reminder for task ${taskId} at ${moment.unix(reminderTime).format("YYYY-MM-DD hh:mm:ss A")}`);
        // Add a job to the queue with delay until the reminder time
        let getEmails = await this.services.getReminderEmails(clientId, taskId);
        let getTaskDetail = await this.services.getTaskDetailForQueue(taskId);
        let jobId = 1000 + taskId;
        if (getTaskDetail) {
            if (getEmails.length > 0) {
                // Add job to queue with delay
                let addInqueue = await reminderTaskQueue.add({ taskId: jobId, emails: getEmails, task_detail: getTaskDetail }, { delay, jobId: jobId, attempts: 3 });
                console.log(`Reminder for task ${jobId} scheduled with ${delay} ms delay.`);
            }
        }

    }

    /** Add task  */
    async addTask(req, res) {
        try {
            const { body, files, user } = req;
            body.added_by = user.id;
            body.type = 0;
            if (typeof body.status === 'string' && body.status === '0') {
                body.status = parseInt(body.status);
            }

            if (!body.project_id) {
                let msg = "Project id is required";
                return this.services.errorFunction(req, res, msg);
            }

            if (!body.project_column_id) {
                let msg = "Project column id is required";
                return this.services.errorFunction(req, res, msg);
            }

            if (!body.title) {
                let msg = "Title is required";
                return this.services.errorFunction(req, res, msg);
            }

            if (!body.status) {
                body.status = body.project_column_id;
            }


            if (body.priority && body.priority != "") {
                body.priority = body.priority;
            } else {
                body.priority = null;
            }

            let getLastTaskSortOrder = await this.services.getTaskLastOrderByProjectId(body.project_id);
            body.sort_order = getLastTaskSortOrder ? getLastTaskSortOrder.sort_order + 1 : 0;

            let createGroupId;
            if (body.parent_task_id && body.parent_task_id != null) {
                const getTaskDetails = await this.services.getSubTaskDetailById(body.parent_task_id);
                if (!getTaskDetails) {
                    return res
                        .status(400)
                        .send(
                            errorResponse(
                                TaskMessages.TASK_NOT_FOUND,
                                null,
                                RESPONSE_CODES.BAD_REQUEST
                            )
                        );
                }
                body.project_column_id = getTaskDetails.project_column_id;
                createGroupId = getTaskDetails.guid;
            }

            body.project_column_id = body.status ? body.status : body.project_column_id;
            //check project exist or not
            const projectExist = await this.services.findProjectById(body.project_id, user.id);
            if (!projectExist) {
                return res.status(400)
                    .send(
                        errorResponse(
                            TaskMessages.PROJECT_NOT_EXIST,
                            null,
                            RESPONSE_CODES.BAD_REQUEST
                        )
                    )
            }

            //check project Column exist or not
            const projectColumnExist = await this.services.findProjectColumnById(body.project_id, body.project_column_id)

            if (!projectColumnExist) {
                return res.status(400)
                    .send(
                        errorResponse(
                            TaskMessages.PROJECT_COLUMN_NOT_EXIST,
                            null,
                            RESPONSE_CODES.BAD_REQUEST
                        )
                    )
            }


            if (body.due_date_time && body.due_date_time != "" && body.due_date_time != "null") {
                body.due_date_time = body.due_date_time ? moment(body.due_date_time, "DD/MM/YYYY hh:mm A").format("YYYY-MM-DD HH:mm:ss") : null;
            } else {
                body.due_date_time = null;
            }

            if (body.reminders && body.reminders != "" && body.reminders != "null") {
                body.reminders = body.reminders ? moment(body.reminders, "DD/MM/YYYY hh:mm A").format("YYYY-MM-DD HH:mm:ss") : null;
            } else {
                body.reminders = null;
            }

            // in user_id always client id are belongs to project.
            body.user_id = user.id;
            switch (user.role_id) {
                case ROLES.USER:
                    body.user_id = user.added_by;
                    body.type = 1;
                    break;

                case ROLES.AGENT:
                    body.user_id = projectExist.user_id;
                    body.type = 2;
                    break;

                default:
                    body.user_id = user.id;
                    body.type = 0;
                    break;
            }
            let groupMembers = [];
            //Task is created
            const taskCreated = await this.Models.Tasks.create(body);

            if (
                (files && (
                    (files.voice_record_file && files.voice_record_file.length > 0) ||
                    (files.screen_record_file && files.screen_record_file.length > 0) ||
                    (files.files && files.files.length > 0)
                )) ||
                (body.labels && body.labels !== "") ||
                (body.agent_ids && body.agent_ids !== "") ||
                (body.reminders && body.reminders !== "") ||
                (body.time_zone && body.time_zone !== "")
            ) {

                if (taskCreated) {
                    if (files && files.voice_record_file && files.voice_record_file.length > 0) {

                        let sendData = {
                            files: files.voice_record_file,
                            id: taskCreated.id,
                            folder: 'Tasks'
                        }
                        let uploadedVoiceRecording = await uploadFileForAll(sendData);

                        if (uploadedVoiceRecording.length > 0) {
                            let VoiceRecording = {
                                voice_record_file: uploadedVoiceRecording[0].file_key
                            };
                            await this.services.updateTaskDetails(VoiceRecording, taskCreated.id)
                        }
                    }

                    if (files && files.screen_record_file && files.screen_record_file.length > 0) {
                        let sendData = {
                            files: files.screen_record_file,
                            id: taskCreated.id,
                            folder: 'Tasks'
                        }
                        const uploadedScreenRecording = await uploadFileForAll(sendData);
                        if (uploadedScreenRecording.length > 0) {
                            let ScreenRecording = {
                                screen_record_file: uploadedScreenRecording[0].file_key
                            };
                            await this.services.updateTaskDetails(ScreenRecording, taskCreated.id)
                        }
                    }

                    if (files && files.files && files.files.length > 0) {
                        let sendData = {
                            files: files.files,
                            id: taskCreated.id,
                            folder: 'Tasks'
                        }
                        const uploadedFiles = await uploadFileForAll(sendData);
                        if (uploadedFiles.length > 0) {
                            let whereData = {
                                added_by: body.user_id,
                                task_id: taskCreated.id,
                                project_id: body.project_id
                            }
                            await this.services.taskFiles(uploadedFiles, whereData)
                        }
                    }


                    /** create labels in task Selected Label table */
                    if (body.labels && body.labels != "") {
                        let labels = [];
                        let getLableIdArray = body.labels.split(',');
                        let getLableIds = [...new Set(getLableIdArray)];

                        for (let i in getLableIds) {
                            let checkLabel = await this.Models.TaskLabels.findOne({
                                attributes: ["id", "deleted_at"],
                                where: {
                                    id: getLableIds[i],
                                    deleted_at: null
                                },
                                raw: true,
                            });
                            if (checkLabel) {
                                labels.push({
                                    project_id: body.project_id,
                                    task_id: taskCreated.id,
                                    label_id: checkLabel.id
                                })
                            }
                        }
                        await this.Models.TaskSelectedLabels.bulkCreate(labels);
                    }

                    if (body.agent_ids && body.agent_ids != "") {
                        let agentIds = [];
                        let agentIdsArray = body.agent_ids.split(',');

                        let assignAgents = [...new Set(agentIdsArray)];
                        for (const i in assignAgents) {
                            const agentExist = await this.services.findAgentsById(assignAgents[i]);
                            if (agentExist) {
                                agentIds.push({
                                    task_id: taskCreated.id,
                                    project_id: body.project_id,
                                    user_id: assignAgents[i]
                                });

                                groupMembers.push(assignAgents[i]);
                            }
                        }
                        await this.Models.AssignedTaskUsers.bulkCreate(agentIds);
                    }

                    if (body.reminders) {
                        let timeZone = (body.time_zone != "") ? body.time_zone : "Asia/Calcutta";
                        let reminderTime = moment.tz(new Date(body.reminders), timeZone).toDate().getTime();
                        reminderTime = reminderTime / 1000;
                        let now = moment.tz(new Date(), timeZone).toDate().getTime();
                        now = now / 1000;
                        let delay = (parseInt(reminderTime) - parseInt(now));// Calculate delay in milliseconds
                        // delay = delay * 1000;
                        await this.scheduleReminder(body.user_id, taskCreated.id, reminderTime, parseInt(delay));

                        let googleAuthToken = await this.services.getGoogleAuthTokenOfUser(user.id);
                        if (googleAuthToken) {
                            let reminderData = {
                                tokens: googleAuthToken,
                                event: {
                                    title: body.title,
                                    description: body.description,
                                    reminder_date: body.reminders ? momentTz.tz(body.reminders, "YYYY-MM-DD HH:mm:ss", body.time_zone ?? "Asia/Calcutta").format("YYYY-MM-DDTHH:mm:ss[Z]") : null,
                                    time_zone: (body.time_zone) ? body.time_zone : "Asia/Calcutta",
                                    email: user.email
                                }
                            }
                            const eventStatus = await addGoogleCalenderEvent(reminderData);
                            if (eventStatus.status) {
                                await this.services.updateTaskDetails({
                                    googleCalenderEventId: eventStatus.eventId
                                }, taskCreated.id)
                            }
                        }
                        let outlookAuthToken = await this.services.getOutlookAuthTokenOfUser(user.id)
                        if (outlookAuthToken) {
                            const formattedTime = momentTz.tz(body.time_zone).format("YYYY-MM-DD HH:mm:ss z");
                            let reminderData = {
                                token: outlookAuthToken,
                                event: {
                                    title: body.title,
                                    description: body.description,
                                    reminder_date: body.reminders ? moment(body.reminders).format("YYYY-MM-DDTHH:mm:ssZ") : null,
                                    time_zone: formattedTime ? formattedTime : "India Standard Time",
                                    email: user.email
                                }
                            }
                            const eventStatus = await addOutLookCalenderEvent(reminderData);
                            if (eventStatus.status) {
                                await this.services.updateTaskDetails({ outlookEventId: eventStatus.eventId }, taskCreated.id)
                            }
                        }
                    }
                }

            }

            const getTaskDetails = await this.services.getTaskDetailById(taskCreated.id);
            getTaskDetails.dataValues.group_id = +body.group_id;

            let recentActivity = {
                client_id: getTaskDetails.user_id,
                user_id: user.id,
                type: RECENT_ACTIVITY_TYPE.TASK_CREATED,
                project_column_id: body.project_column_id,
                project_id: getTaskDetails.project_id,
                task_id: taskCreated.id,
                parent_task_id: (body.parent_task_id && body.parent_task_id != null) ? body.parent_task_id : null,
                message: `${user.first_name} ${user.last_name} created ${body.title} task successfully.`,
                is_notifictaion: 1,
            }
            let createActivity = await this.services.createRecentActivities(recentActivity);
            groupMembers.push(getTaskDetails.added_by);

            if (body.parent_task_id && (body.parent_task_id != "0" || body.parent_task_id != "")) {
                let getAssinedTaskUsers = await this.services.getTaskAssignedUsersByTaskId(body.parent_task_id);
                groupMembers.push(getAssinedTaskUsers);
                groupMembers = groupMembers.flat();
            }
            if (projectExist.slack_notification_url) {
               /** slack notification integration  */ 
               let slackNotificationData = {
                    userName:`${user.first_name} ${user.last_name}`,
                    project_name: getTaskDetails.dataValues.project_name,
                    task_name: getTaskDetails.title,
                    project_column_name: getTaskDetails.dataValues.column_name,
                    slack_notification_url:projectExist.slack_notification_url,
                    types_of_slack_notification:projectExist.types_of_slack_notification
                }
                await this.services.slackNotificationProject(SLACK_NOTIFICATION_TYPE.TASK_CREATED,slackNotificationData)

            }
            if (groupMembers.length > 0) {

                groupMembers = groupMembers.filter(item => item !== user.id);
                let createReadNotification = [];
                for (let i in groupMembers) {
                    let getUserPermissionId = await this.services.getUserPermissionId(groupMembers[i]);
                    let getPermission = await this.services.getUserRolePermissions(getUserPermissionId);

                    if (getPermission && (getPermission.is_project_access == 1 && projectExist.is_private == 0) || (projectExist.is_private == 1 && await this.services.getProjectAssignedUser(projectExist.id, groupMembers[i]) == 0)) {
                        // No need to perform any action
                    } else {

                        createReadNotification.push({
                            notification_id: createActivity.id,
                            user_id: groupMembers[i],
                            is_read: 0,
                            notification_type: createActivity.type
                        });
                    }
                }
                await this.Models.ReadNotifications.bulkCreate(createReadNotification);
            }

            return res
                .status(200)
                .send(
                    successResponse(TaskMessages.TASK_ADDED, getTaskDetails, RESPONSE_CODES.POST)
                );

        } catch (error) {
            console.log(error, "====error====");
            return res
                .status(500)
                .send(
                    errorResponse(
                        CommonMessages.ERROR,
                        null,
                        RESPONSE_CODES.SERVER_ERROR
                    )
                );
        }
    };


    /* Task list */
    async taskList(req, res) {
        try {
            const { body, user } = req;
            //check project Column exist or not
            const projectExist = await this.services.getProjectByProjectId(body.project_id)
            if (!projectExist) {
                return res.status(400)
                    .send(
                        errorResponse(
                            TaskMessages.PROJECT_NOT_EXIST,
                            null,
                            RESPONSE_CODES.BAD_REQUEST
                        )
                    )
            };

            body.user_id = user.id;
            body.projectCreator = projectExist.user_id;
            body.role_id = user.role_id;
            let getTasklist;
            if (body.group && body.group.key != null) {
                body.project_column_id = 0;
                getTasklist = await this.ProjectServices.getColumnListForFilter(body, user, projectExist.user_id);
            } else {
                getTasklist = await this.services.getTaskList(body);
            }
            return res
                .status(200)
                .send(
                    successResponse(TaskMessages.GET_LIST, getTasklist, RESPONSE_CODES.GET)
                );
        } catch (error) {
            console.log(error, "====error===");
            return res
                .status(500)
                .send(
                    errorResponse(
                        CommonMessages.ERROR,
                        null,
                        RESPONSE_CODES.SERVER_ERROR
                    )
                );
        }
    };


    /* Task Details */
    async taskDetail(req, res) {
        try {
            const { params } = req;
            const getTaskDetails = await this.services.getTaskDetailByIdWithSubTask(params.task_id);
            if (!getTaskDetails) {
                return res
                    .status(400)
                    .send(
                        errorResponse(
                            TaskMessages.TASK_NOT_FOUND,
                            null,
                            RESPONSE_CODES.BAD_REQUEST
                        )
                    );
            }
            return res.status(200)
                .send(
                    successResponse(TaskMessages.GET_DATA, getTaskDetails, RESPONSE_CODES.GET)
                );
        } catch (error) {
            console.log(error, "====error====");
            return res
                .status(500)
                .send(
                    errorResponse(
                        CommonMessages.ERROR,
                        null,
                        RESPONSE_CODES.SERVER_ERROR
                    )
                );
        }
    };



    /* delete project task */
    async taskDelete(req, res) {
        try {
            const { params, user } = req;

            /** check task exist or not */
            const getTaskDetail = await this.services.getTaskDetailById(params.task_id);
            if (!getTaskDetail) {
                return res
                    .status(400)
                    .send(
                        errorResponse(
                            TaskMessages.TASK_NOT_FOUND,
                            null,
                            RESPONSE_CODES.BAD_REQUEST
                        )
                    );
            }

            let recentActivity = {
                client_id: user.id,
                user_id: user.id,
                type: RECENT_ACTIVITY_TYPE.TASK_DELETE,
                project_column_id: getTaskDetail.project_column_id,
                project_id: getTaskDetail.project_id,
                task_id: params.task_id,
                is_notifictaion: 1,
            }
            let createActivity = await this.services.createRecentActivities(recentActivity);
            let getAssinedTaskUsers = await this.services.getTaskAssignedUsersByTaskId(params.task_id);
            getAssinedTaskUsers.push(getTaskDetail.added_by)
            const projectDetails = await this.services.findProjectById(getTaskDetail.project_id)
            if (projectDetails.slack_notification_url) {
                  let slackNotificationData = {
                    userName:`${user.first_name} ${user.last_name}`,
                    project_name: getTaskDetail.dataValues.project_name,
                    task_name: getTaskDetail.title,
                    project_column_name: getTaskDetail.dataValues.column_name,
                    slack_notification_url:projectDetails.slack_notification_url,
                    types_of_slack_notification:projectDetails.types_of_slack_notification
                }
                await this.services.slackNotificationProject(SLACK_NOTIFICATION_TYPE.TASK_DELETE,slackNotificationData)
            }
            if (getAssinedTaskUsers.length > 0) {

                getAssinedTaskUsers = getAssinedTaskUsers.filter(item => item !== user.id);
                let createReadNotification = [];
                for (let i in getAssinedTaskUsers) {
                    let getUserPermissionId = await this.services.getUserPermissionId(getAssinedTaskUsers[i]);
                    let getPermission = await this.services.getUserRolePermissions(getUserPermissionId);
                    const projectExist = await this.services.findProjectById(getTaskDetail.project_id, user.id);
                    if (getPermission && (getPermission.is_project_access == 1 && projectExist.is_private == 0) || (projectExist.is_private == 1 && await this.services.getProjectAssignedUser(projectExist.id, groupMembers[i]) == 0)) {
                        // No need to perform any action
                    } else {
                        createReadNotification.push({
                            notification_id: createActivity.id,
                            user_id: getAssinedTaskUsers[i],
                            is_read: 0,
                            notification_type: createActivity.type
                        });
                    }
                }
                await this.Models.ReadNotifications.bulkCreate(createReadNotification);
            }

            const updateData = {
                deleted_at: moment(new Date()).unix(),
            };
            await this.services.updateTaskDetails(updateData, params.task_id);
            await this.services.updateTaskFiles(updateData, params.task_id);
            await this.services.updateTaskAssignedUsers(updateData, params.task_id);
            await this.services.deleteSelectedTaskLabelsByTaskId(updateData, params.task_id);



            let jobId = 1000 + Number(params.task_id);
            const job = await reminderTaskQueue.getJob(jobId); // Fetch the job by ID
            if (job) {
                await job.remove();
            }
            if (getTaskDetail.outlookEventId) {
                let outlookAuthToken = await this.services.getOutlookAuthTokenOfUser(user.id)
                if (outlookAuthToken) {
                    const eventStatus = await deleteOutLookCalenderEvent({
                        token: outlookAuthToken,
                        eventId: getTaskDetail.outlookEventId
                    })
                    if (eventStatus) {
                        await this.services.updateTaskDetails({
                            outlookEventId: null
                        }, params.task_id)
                    }
                }
            }
            if (getTaskDetail.googleCalenderEventId) {
                let googleAuthToken = await this.services.getGoogleAuthTokenOfUser(user.id)
                if (googleAuthToken) {
                    const eventStatus = await deleteGoogleCalenderEvent({
                        token: googleAuthToken,
                        eventId: getTaskDetail.googleCalenderEventId
                    })
                    if (eventStatus.status) {
                        await this.services.updateTaskDetails({
                            googleCalenderEventId: null
                        }, params.task_id)
                    }
                }

            }


            return res
                .status(200)
                .send(
                    successResponse(TaskMessages.TASK_DELETE, getTaskDetail, RESPONSE_CODES.POST)
                );
        } catch (error) {
            console.log(error, "==error===")
            return res
                .status(500)
                .send(
                    errorResponse(
                        CommonMessages.ERROR,
                        null,
                        RESPONSE_CODES.SERVER_ERROR
                    )
                );
        }
    };



    async editTask(req, res) {
        try {
            const { body, files, user } = req;

            if (!body.task_id) {
                let msg = "Task id is required";
                return this.services.errorFunction(req, res, msg);
            }

            if (!body.title) {
                let msg = "Title is required";
                return this.services.errorFunction(req, res, msg);
            }

            //check task exist or not
            const getTaskExist = await this.services.getTaskDetailById(body.task_id);
            if (!getTaskExist) {
                return res.status(400)
                    .send(
                        errorResponse(
                            TaskMessages.TASK_NOT_FOUND,
                            null,
                            RESPONSE_CODES.BAD_REQUEST
                        )
                    )
            }

            // if in request param value 0-> Not update key, if paran not sent or sent empty means set null, if any value sent then update it.

            if (body.due_date_time && body.due_date_time == '0') {
                body.due_date_time = getTaskExist.due_date_time;
            } else if (body.due_date_time && (body.due_date_time != '' || body.due_date_time != "0" || body.due_date_time != "null" || body.due_date_time != null)) {
                body.due_date_time = body.due_date_time ? moment(body.due_date_time, "DD/MM/YYYY hh:mm A").format("YYYY-MM-DD HH:mm:ss") : null;
            } else {
                body.due_date_time = null;
            }


            if (body.reminders && body.reminders == '0') {
                body.reminders = getTaskExist.reminders;
            } else if (body.reminders && (body.reminders != '' || body.reminders != "0" || body.reminders != "null" || body.reminders != null)) {
                body.reminders = body.reminders ? moment(body.reminders, "DD/MM/YYYY hh:mm A").format("YYYY-MM-DD HH:mm:ss") : null;
            } else {
                body.reminders = null;
            }

            if (body.status && body.status == '0') {
                body.status = getTaskExist.status;
            } else if (body.status && (body.status != '' || body.status != "0" || body.status != "null" || body.status != null)) {
                body.status = body.status;
            } else {
                body.status = null
            }

            if (body.priority && body.priority == '0') {
                body.priority = getTaskExist.priority;
            } else if (body.priority && (body.priority != '' || body.priority != "0" || body.priority != "null" || body.priority != null)) {
                body.priority = body.priority;
            } else {
                body.priority = null
            }

            body.project_column_id = body.status ? body.status : getTaskExist.project_column_id;
            body.voice_record_file = (body.voice_record_file == "") ? "" : getTaskExist.voice_record_file;
            body.screen_record_file = (body.screen_record_file == "") ? "" : getTaskExist.screen_record_file;
            if (files && files.voice_record_file && files.voice_record_file.length > 0) {

                if (getTaskExist.voice_record_file) {
                    s3RemoveSingleFile(getTaskExist.voice_record_file);
                }

                let sendData = {
                    files: files.voice_record_file,
                    id: body.task_id,
                    folder: 'Tasks'
                }
                let uploadedVoiceRecording = await uploadFileForAll(sendData);

                if (uploadedVoiceRecording.length > 0) {
                    body.voice_record_file = uploadedVoiceRecording[0].file_key;
                }
            }

            if (files && files.screen_record_file && files.screen_record_file.length > 0) {

                if (getTaskExist.screen_record_file) {
                    s3RemoveSingleFile(getTaskExist.screen_record_file);
                }

                let sendData = {
                    files: files.screen_record_file,
                    id: body.task_id,
                    folder: 'Tasks'
                }
                const uploadedScreenRecording = await uploadFileForAll(sendData);
                if (uploadedScreenRecording.length > 0) {
                    body.screen_record_file = uploadedScreenRecording[0].file_key;
                }
            }

            await this.services.updateTaskDetails(body, body.task_id);

            if (files && files.files && files.files.length > 0) {
                let sendData = {
                    files: files.files,
                    id: body.task_id,
                    folder: 'Tasks'
                }
                const uploadedFiles = await uploadFileForAll(sendData);
                if (uploadedFiles.length > 0) {
                    let whereData = {
                        added_by: user.id,
                        task_id: body.task_id,
                        project_id: getTaskExist.project_id
                    }
                    await this.services.taskFiles(uploadedFiles, whereData)
                }
            }

            /** create labels in task Selected Label table */
            if (body.labels && body.labels == "0") {
            } else if (body.labels && body.labels != "") {
                let labels = [];
                let getLableIdArray = body.labels.split(',');
                let getLableIdsInt = [...new Set(getLableIdArray)];
                let getLableIds = getLableIdsInt.map(Number); // Converts all values to integers

                let getAllSelectedLabel = await this.Models.TaskSelectedLabels.findAll({
                    attributes: ["id", "task_id", "project_id", "label_id", "deleted_at"],
                    where: {
                        task_id: body.task_id,
                        project_id: getTaskExist.project_id,
                        deleted_at: null,
                    },
                    raw: true,
                });

                if (getAllSelectedLabel.length > 0) {
                    let alreadySelectedLabel = getAllSelectedLabel.map(val => val.label_id);
                    let deleteSelectedLabels = await this.services.getDeletedAssignedUserIds(getLableIds, alreadySelectedLabel);

                    if (deleteSelectedLabels.length > 0) {
                        let deletedData = {
                            deleted_at: moment(new Date()).unix(),
                        }
                        await this.services.deleteSelectedTaskLabels(deletedData, body.task_id, deleteSelectedLabels);
                    }
                }

                for (let i in getLableIds) {
                    let checkLabel = await this.Models.TaskLabels.findOne({
                        attributes: ["id", "deleted_at"],
                        where: {
                            id: getLableIds[i],
                            deleted_at: null
                        },
                        raw: true,
                    });

                    if (checkLabel) {
                        let checkAlreadyExist = await this.Models.TaskSelectedLabels.findOne({
                            where: {
                                task_id: body.task_id,
                                project_id: getTaskExist.project_id,
                                label_id: checkLabel.id,
                                deleted_at: null,
                            },
                            raw: true,
                        });
                        if (!checkAlreadyExist) {
                            labels.push({
                                project_id: getTaskExist.project_id,
                                task_id: body.task_id,
                                label_id: checkLabel.id
                            })
                        }
                    }
                }
                await this.Models.TaskSelectedLabels.bulkCreate(labels);
            } else {

                let getAllSelectedLabel = await this.Models.TaskSelectedLabels.findAll({
                    attributes: ["id", "task_id", "project_id", "label_id", "deleted_at"],
                    where: {
                        task_id: body.task_id,
                        project_id: getTaskExist.project_id,
                        deleted_at: null,
                    },
                    raw: true,
                });
                if (getAllSelectedLabel.length > 0) {
                    let alreadySelectedLabel = getAllSelectedLabel.map(val => val.label_id);
                    let deletedData = {
                        deleted_at: moment(new Date()).unix(),
                    }
                    await this.services.deleteSelectedTaskLabels(deletedData, body.task_id, alreadySelectedLabel);
                }
            }

            if (body.agent_ids && body.agent_ids == "0") {

            } else if (body.agent_ids && body.agent_ids != "") {
                const agentIds = []
                let agentIdsArray = body.agent_ids.split(',');

                let assignAgentsInt = [...new Set(agentIdsArray)];
                let assignAgents = assignAgentsInt.map(Number);

                let getAllAssignedUserIds = await this.Models.AssignedTaskUsers.findAll({
                    attributes: ["id", "user_id"],
                    where: {
                        task_id: body.task_id,
                        project_id: getTaskExist.project_id,
                        deleted_at: null,
                    },
                    raw: true,
                });

                if (getAllAssignedUserIds.length > 0) {
                    let alreadyAssigner = getAllAssignedUserIds.map(val => val.user_id);
                    let deleteAssignerIds = await this.services.getDeletedAssignedUserIds(assignAgents, alreadyAssigner);
                    if (deleteAssignerIds.length > 0) {
                        let deletedData = {
                            deleted_at: moment(new Date()).unix(),
                        }
                        await this.services.deleteTaskAssignedUsers(deletedData, deleteAssignerIds, body.task_id);
                    }
                }
                for (const i in assignAgents) {
                    const agentExist = this.services.findAgentsById(assignAgents[i]);
                    if (agentExist) {

                        let checkAlreadyExist = await this.Models.AssignedTaskUsers.findOne({
                            where: {
                                task_id: body.task_id,
                                project_id: getTaskExist.project_id,
                                user_id: assignAgents[i],
                                deleted_at: null,
                            },
                            raw: true,
                        });
                        if (!checkAlreadyExist) {
                            const agentExist = await this.services.findAgentsById(assignAgents[i]);
                            if (agentExist) {
                                agentIds.push({
                                    task_id: body.task_id,
                                    project_id: getTaskExist.project_id,
                                    user_id: assignAgents[i]
                                });
                            }
                        }
                    }
                }
                await this.Models.AssignedTaskUsers.bulkCreate(agentIds);
            } else {

                let getAllAssignedUserIds = await this.Models.AssignedTaskUsers.findAll({
                    attributes: ["id", "user_id"],
                    where: {
                        task_id: body.task_id,
                        project_id: getTaskExist.project_id,
                        deleted_at: null,
                    },
                    raw: true,
                });
                if (getAllAssignedUserIds.length > 0) {
                    let alreadyAssigner = getAllAssignedUserIds.map(val => val.user_id);
                    let deletedData = {
                        deleted_at: moment(new Date()).unix(),
                    }
                    await this.services.deleteTaskAssignedUsers(deletedData, alreadyAssigner, body.task_id);
                }
            }

            let deletedParam = {
                deleted_at: moment(new Date()).unix(),
            }

            if (body.delete_agent_ids && body.delete_agent_ids != "") {
                let deleteAgentIdArray = body.delete_agent_ids.split(',');
                let deleteAgentIds = [...new Set(deleteAgentIdArray)];
                await this.services.deleteTaskAssignedUsers(deletedParam, deleteAgentIds)
            }

            if (body.delete_file_ids && body.delete_file_ids != "") {

                let deleteFileIdArray = body.delete_file_ids.split(',');
                let deleteFileIds = [...new Set(deleteFileIdArray)];
                await this.services.deleteTaskFiles(deletedParam, deleteFileIds);
                for (let i in deleteFileIds) {
                    let getTaskFile = await this.services.getFileById(deleteFileIds[i]);
                    if (getTaskFile && getTaskFile.file) {
                        s3RemoveSingleFile(getTaskFile.file);
                    }
                }
            }


            if (body.reminders && body.reminders != "") {

                let jobId = 1000 + Number(body.task_id);
                const job = await reminderTaskQueue.getJob(jobId); // Fetch the job by ID
                if (job) {
                    await job.remove();
                }

                let timeZone = (body.time_zone != "") ? body.time_zone : "Asia/Calcutta";
                let reminderTime = moment.tz(new Date(body.reminders), timeZone).toDate().getTime();
                // let reminderTime = moment(body.reminders).toDate().getTime();
                reminderTime = reminderTime / 1000;
                let now = moment.tz(new Date(), timeZone).toDate().getTime();
                now = now / 1000;
                let delay = (reminderTime - now) // Calculate delay in milliseconds
                // delay = delay * 1000;
                await this.scheduleReminder(getTaskExist.user_id, +body.task_id, reminderTime, parseInt(delay))
                if (getTaskExist.googleCalenderEventId) {

                    let googleAuthToken = await this.services.getGoogleAuthTokenOfUser(user.id);
                    if (googleAuthToken) {
                        let reminderData = {
                            tokens: googleAuthToken,
                            eventId: getTaskExist.googleCalenderEventId,
                            event: {
                                title: body.title,
                                description: body.description,
                                reminder_date: body.reminders ? momentTz.tz(body.reminders, "YYYY-MM-DD HH:mm:ss", body.time_zone ?? "Asia/Calcutta").format("YYYY-MM-DDTHH:mm:ss[Z]") : null,
                                time_zone: (body.time_zone) ? body.time_zone : "Asia/Calcutta",
                                email: user.email
                            }
                        }
                        await updateGoogleCalenderEvent(reminderData)
                    }
                } else {
                    let googleAuthToken = await this.services.getGoogleAuthTokenOfUser(user.id);
                    if (googleAuthToken) {
                        let reminderData = {
                            tokens: googleAuthToken,
                            event: {
                                title: body.title,
                                description: body.description,
                                reminder_date: body.reminders ? momentTz.tz(body.reminders, "YYYY-MM-DD HH:mm:ss", body.time_zone ?? "Asia/Calcutta").format("YYYY-MM-DDTHH:mm:ss[Z]") : null,
                                time_zone: (body.time_zone) ? body.time_zone : "Asia/Calcutta",
                                email: user.email
                            }
                        }
                        const eventStatus = await addGoogleCalenderEvent(reminderData)
                        if (eventStatus.status) {
                            await this.services.updateTaskDetails({
                                googleCalenderEventId: eventStatus.eventId
                            }, getTaskExist.id)
                        }

                    }

                }

                if (getTaskExist.outlookEventId) {
                    let outlookAuthToken = await this.services.getOutlookAuthTokenOfUser(user.id)
                    if (outlookAuthToken) {
                        const formattedTime = momentTz.tz(body.time_zone).format("YYYY-MM-DD HH:mm:ss z");
                        let reminderData = {
                            token: outlookAuthToken,
                            eventId: getTaskExist.outlookEventId,
                            event: {
                                title: body.title,
                                description: body.description,
                                reminder_date: body.reminders ? moment(body.reminders).format("YYYY-MM-DDTHH:mm:ssZ") : null,
                                time_zone: formattedTime ? formattedTime : "India Standard Time",
                                email: user.email
                            }
                        }
                        await updateOutLookCalenderEvent(reminderData)
                    }
                } else {
                    let outlookAuthToken = await this.services.getOutlookAuthTokenOfUser(user.id)
                    if (outlookAuthToken) {
                        const formattedTime = momentTz.tz(body.time_zone).format("YYYY-MM-DD HH:mm:ss z");
                        let reminderData = {
                            token: outlookAuthToken,
                            event: {
                                title: body.title,
                                description: body.description,
                                reminder_date: body.reminders ? moment(body.reminders).format("YYYY-MM-DDTHH:mm:ssZ") : null,
                                time_zone: formattedTime ? formattedTime : "India Standard Time",
                                email: user.email
                            }
                        }
                        const eventStatus = await addOutLookCalenderEvent(reminderData)
                        if (eventStatus.status) {
                            await this.services.updateTaskDetails({ outlookEventId: eventStatus.eventId }, getTaskExist.id)
                        }
                    }

                }


            } else if ((!body.reminders || body.reminders == "") && (getTaskExist.outlookEventId || getTaskExist.googleCalenderEventId)) {
                if (getTaskExist.outlookEventId) {
                    let outlookAuthToken = await this.services.getOutlookAuthTokenOfUser(user.id)
                    if (outlookAuthToken) {
                        const eventStatus = await deleteOutLookCalenderEvent({
                            token: outlookAuthToken,
                            eventId: getTaskExist.outlookEventId
                        })
                        if (eventStatus) {
                            await this.services.updateTaskDetails({
                                outlookEventId: null
                            }, getTaskExist.id)
                        }
                    }

                }
                if (getTaskExist.googleCalenderEventId) {
                    let googleAuthToken = await this.services.getGoogleAuthTokenOfUser(user.id);
                    if (googleAuthToken) {
                        const eventStatus = await deleteGoogleCalenderEvent({
                            token: googleAuthToken,
                            eventId: getTaskExist.googleCalenderEventId
                        })
                        if (eventStatus.status) {
                            await this.services.updateTaskDetails({
                                googleCalenderEventId: null
                            }, getTaskExist.id)
                        }
                    }


                }
            }
            const getTaskDetails = await this.services.getTaskDetailByIdWithSubTask(body.task_id);

            let recentActivity = {
                client_id: getTaskDetails.user_id,
                user_id: user.id,
                type: RECENT_ACTIVITY_TYPE.TASK_UPDATED,
                project_column_id: getTaskDetails.project_column_id,
                project_id: getTaskDetails.project_id,
                task_id: body.task_id,
                parent_task_id: getTaskDetails.parent_task_id,
                message: `${user.first_name} ${user.last_name} updated ${getTaskDetails.title} task successfully.`,
                is_notifictaion: 1,
            }

            let createActivity = await this.services.createRecentActivities(recentActivity);
            let getAssinedTaskUsers = await this.services.getTaskAssignedUsersByTaskId(body.task_id);
            getAssinedTaskUsers.push(getTaskDetails.user_id);
            const projectDetails = await this.services.findProjectById(getTaskDetails.project_id)
            if (projectDetails.slack_notification_url) {
                let slackNotificationData = {
                    userName: `${user.first_name} ${user.last_name}`,
                    project_name: getTaskDetails.dataValues.project_name,
                    task_name: getTaskDetails.title,
                    project_column_name: getTaskDetails.dataValues.column_name,
                    slack_notification_url:projectDetails.slack_notification_url,
                    types_of_slack_notification:projectDetails.types_of_slack_notification
                }
                await this.services.slackNotificationProject(SLACK_NOTIFICATION_TYPE.TASK_UPDATED,slackNotificationData)
            }

            if (getAssinedTaskUsers.length > 0) {

       


                getAssinedTaskUsers = getAssinedTaskUsers.filter(item => item !== user.id);
                let createReadNotification = [];
                for (let i in getAssinedTaskUsers) {
                    let getUserPermissionId = await this.services.getUserPermissionId(getAssinedTaskUsers[i]);
                    let getPermission = await this.services.getUserRolePermissions(getUserPermissionId);
                    const projectExist = await this.services.findProjectById(getTaskDetails.project_id, user.id);
                    if (getPermission && (getPermission.is_project_access == 1 && projectExist.is_private == 0) || (projectExist.is_private == 1 && await this.services.getProjectAssignedUser(projectExist.id, groupMembers[i]) == 0)) {
                        // No need to perform any action
                    } else {
                        createReadNotification.push({
                            notification_id: createActivity.id,
                            user_id: getAssinedTaskUsers[i],
                            is_read: 0,
                            notification_type: createActivity.type
                        });
                    }
                }
                await this.Models.ReadNotifications.bulkCreate(createReadNotification);
            }

            return res
                .status(200)
                .send(
                    successResponse(TaskMessages.TASK_UPDATE, getTaskDetails, RESPONSE_CODES.POST)
                );

        } catch (error) {
            console.log(error, "====error====");
            return res
                .status(500)
                .send(
                    errorResponse(
                        CommonMessages.ERROR,
                        null,
                        RESPONSE_CODES.SERVER_ERROR
                    )
                );
        }
    };

    /* delete task  Files, Voice Recording And Screen Recording*/
    async deleteFiles(req, res) {
        try {
            const { body } = req;
            /** check task exist or not */
            if (body.type == 1 || body.type == 2) {
                const getTaskDetail = await this.services.getTaskDetailById(body.file_id);
                if (!getTaskDetail) {
                    return res
                        .status(400)
                        .send(
                            errorResponse(
                                TaskMessages.FILE_NOT_FOUND,
                                null,
                                RESPONSE_CODES.BAD_REQUEST
                            )
                        );
                }
                let updateData = {};
                let fileName = "";
                if (body.type == 1) {
                    if (getTaskDetail && getTaskDetail.voice_record_file) {
                        fileName = getTaskDetail.voice_record_file;
                    }
                    updateData.voice_record_file = "";
                } else {
                    if (getTaskDetail && getTaskDetail.screen_record_file) {
                        fileName = getTaskDetail.screen_record_file;
                    }
                    updateData.screen_record_file = "";
                }
                s3RemoveSingleFile(fileName);
                await this.services.updateTaskDetails(updateData, body.file_id);
            }

            if (body.type == 3) {
                let getTaskFile = await this.services.getFileById(body.file_id);
                if (!getTaskFile) {
                    return res
                        .status(400)
                        .send(
                            errorResponse(
                                TaskMessages.FILE_NOT_FOUND,
                                null,
                                RESPONSE_CODES.BAD_REQUEST
                            )
                        );
                }
                s3RemoveSingleFile(getTaskFile.file);
                let deleteFileData = {
                    deleted_at: moment(new Date()).unix(),
                };
                await this.services.deleteTaskFiles(deleteFileData, body.file_id);
            }

            return res
                .status(200)
                .send(
                    successResponse(TaskMessages.FILE_DELETED, {}, RESPONSE_CODES.POST)
                );
        } catch (error) {
            console.log(error, "==error===")
            return res
                .status(500)
                .send(
                    errorResponse(
                        CommonMessages.ERROR,
                        null,
                        RESPONSE_CODES.SERVER_ERROR
                    )
                );
        }
    };

    /* sort tasks within the column up-down*/
    async sortColumnTask(req, res) {
        try {
            const { body } = req;
            const getProjectColumn = await this.services.findColumnById(body.project_column_id);
            if (!getProjectColumn) {
                return res
                    .status(400)
                    .send(
                        errorResponse(
                            TaskMessages.PROJECT_COLUMN_NOT_EXIST,
                            null,
                            RESPONSE_CODES.BAD_REQUEST
                        ));
            }

            if (body.parent_task_id) {
                await this.services.subTaskMovement(body.project_column_id, body.task_ids, body.parent_task_id);
            } else {
                await this.services.taskMovement(body.project_column_id, body.task_ids);
            }
            return res.status(200).send(successResponse(TaskMessages.TASK_MOVE, {}, RESPONSE_CODES.POST));
        } catch (error) {
            console.log(error, "=====error=====")
            return res.status(500).send(errorResponse(CommonMessages.ERROR, null, RESPONSE_CODES.SERVER_ERROR));
        }
    }

    /* move tasks from one column to another column left right*/
    async moveTaskInColumns(req, res) {
        try {
            const { body, user } = req;

            console.log(body, "====body======body========");
            const getTaskDetail = await this.services.getTaskDetailById(body.task_id);
            if (!getTaskDetail) {
                return res
                    .status(400)
                    .send(
                        errorResponse(
                            TaskMessages.TASK_NOT_FOUND,
                            null,
                            RESPONSE_CODES.BAD_REQUEST
                        )
                    );
            }

            let ProjectExist = await this.services.findProjectByIds(getTaskDetail.project_id);
            if (ProjectExist) {
                let projectCreatorId = ProjectExist.user_id;
                if (user.role_id == ROLES.AGENT || user.role_id == ROLES.USER) {
                    let getUserDetail = await this.services.getUserDetailById(projectCreatorId);
                    if (getUserDetail.role_id == ROLES.USER) {
                        projectCreatorId = getUserDetail.added_by;
                    }

                    let checkIsToggle = await this.services.getUserTaskPermission(projectCreatorId, user.id);

                    if (checkIsToggle == 1) {

                        let checkIsAssignedTask = await this.services.getTaskAssignedToUser(body.task_id, user.id)
                        if (!checkIsAssignedTask && getTaskDetail.added_by != user.id) {
                            return res
                                .status(400)
                                .send(
                                    errorResponse(
                                        TaskMessages.CANNOT_MOVE_TASK,
                                        null,
                                        RESPONSE_CODES.BAD_REQUEST
                                    )
                                );
                        }

                        let checkIsItSubTask = await this.Models.Tasks.findOne({
                            attributes: ["id", "parent_task_id", "deleted_at"],
                            where: {
                                parent_task_id: body.task_id,
                                deleted_at: null,
                            },
                            raw: true
                        });


                        if (checkIsItSubTask) {
                            let checkIsAssigned = await this.Models.AssignedTaskUsers.findOne({
                                where: {
                                    task_id: checkIsItSubTask.parent_task_id,
                                    user_id: user.id,
                                    deleted_at: null
                                },
                                raw: true
                            });
                            if (!checkIsAssigned) {
                                return res
                                    .status(400)
                                    .send(
                                        errorResponse(
                                            TaskMessages.CANNOT_MOVE_TASK,
                                            null,
                                            RESPONSE_CODES.BAD_REQUEST
                                        )
                                    );
                            }
                        }
                    }
                }

            }

            /* Task move in columns when filter is not used */
            if (!body.column || (body.column && body.column == "")) {

                let getProjectColumn = await this.services.findColumnById(body.project_column_id);
                if (!getProjectColumn) {
                    return res
                        .status(400)
                        .send(
                            errorResponse(
                                TaskMessages.PROJECT_COLUMN_NOT_EXIST,
                                null,
                                RESPONSE_CODES.BAD_REQUEST
                            ));
                }


                const getProjectColumnTask = await this.services.getTaskInColumn(body.project_column_id, body.task_id);
                if (getProjectColumnTask) {
                    return res
                        .status(400)
                        .send(
                            errorResponse(
                                TaskMessages.TASK_ALREADY_EXIST_COLUMN,
                                null,
                                RESPONSE_CODES.BAD_REQUEST
                            ));
                }

                await this.services.taskMoveInColumns(body.project_column_id, body.task_id, user.id);

                let getAllSubtask = await this.Models.Tasks.findAll({
                    attributes: ["id", "parent_task_id", "deleted_at"],
                    where: {
                        parent_task_id: body.task_id,
                        deleted_at: null,
                    },
                    raw: true
                });

                if (getAllSubtask.length > 0) {
                    for (let i in getAllSubtask) {
                        await this.services.taskMoveInColumns(body.project_column_id, getAllSubtask[i].id, user.id);
                    }
                }


                let recentActivity = {
                    client_id: getTaskDetail.user_id,
                    user_id: user.id,
                    type: RECENT_ACTIVITY_TYPE.TASK_MOVE,
                    project_column_id: body.project_column_id,
                    project_id: getProjectColumn.project_id,
                    task_id: body.task_id,
                    parent_task_id: getTaskDetail.parent_task_id,
                    message: `${user.first_name} ${user.last_name} moved ${getTaskDetail.title} task to list ${getProjectColumn.name}.`,
                }
                let createActivity = await this.services.createRecentActivities(recentActivity);
                let getAssinedTaskUsers = await this.services.getTaskAssignedUsersByTaskId(body.task_id);
                if (ProjectExist.slack_notification_url) {
                         /** Slack notification messages */
                         let slackNotificationData = {
                            userName: `${user.first_name} ${user.last_name}`,
                            project_name: getTaskDetail.dataValues.project_name,
                            task_name: getTaskDetail.title,
                            project_column_name: getTaskDetail.dataValues.column_name,
                            project_moved_column_name: getProjectColumn.name,
                            slack_notification_url:ProjectExist.slack_notification_url,
                            types_of_slack_notification:ProjectExist.types_of_slack_notification
                        }
                        await this.services.slackNotificationProject(SLACK_NOTIFICATION_TYPE.TASK_MOVE,slackNotificationData)
                }
                if (getAssinedTaskUsers.length > 0) {
                    getAssinedTaskUsers.push(getTaskDetail.added_by);
                    console.log("====enter in first case=====1========");

               
                    console.log("====enter in first case=====2========");

                    getAssinedTaskUsers = getAssinedTaskUsers.filter(item => item !== user.id);
                    let createReadNotification = [];
                    for (let i in getAssinedTaskUsers) {

                        let getUserPermissionId = await this.services.getUserPermissionId(getAssinedTaskUsers[i]);
                        let getPermission = await this.services.getUserRolePermissions(getUserPermissionId);
                        const projectExist = await this.services.findProjectById(getTaskDetail.project_id, user.id);
                        if (getPermission && (getPermission.is_project_access == 1 && projectExist.is_private == 0) || (projectExist.is_private == 1 && await this.services.getProjectAssignedUser(projectExist.id, groupMembers[i]) == 0)) {
                            // No need to perform any action
                        } else {
                            createReadNotification.push({
                                notification_id: createActivity.id,
                                user_id: getAssinedTaskUsers[i],
                                is_read: 0,
                                notification_type: createActivity.type
                            });
                        }
                    }
                    await this.Models.ReadNotifications.bulkCreate(createReadNotification);
                }

            } else {

                if (body.project_column_id == 0) {
                    await this.services.taskMoveInColumns(body.column, body.task_id, user.id);

                    let getAllSubtask = await this.Models.Tasks.findAll({
                        attributes: ["id", "parent_task_id", "deleted_at"],
                        where: {
                            parent_task_id: body.task_id,
                            deleted_at: null,
                        },
                        raw: true
                    });

                    if (getAllSubtask.length > 0) {
                        for (let i in getAllSubtask) {
                            await this.services.taskMoveInColumns(body.column, getAllSubtask[i].id, user.id);
                        }
                    }

                    // if(user.role_id == ROLES.AGENT || user.role_id == ROLES.USER) {

                    let getProjectColumn = await this.services.findColumnById(getTaskDetail.project_id);
                    // let getRecentActivity = await this.services.getRecentActivities(getTaskDetail.user_id);

                    // let sortOrder = 1;
                    // if(getRecentActivity){
                    //     sortOrder = getRecentActivity.sort_order+1;
                    // }
                    let recentActivity = {
                        client_id: getTaskDetail.user_id,
                        user_id: user.id,
                        type: RECENT_ACTIVITY_TYPE.TASK_MOVE,
                        project_column_id: body.column,
                        project_id: getProjectColumn.project_id,
                        task_id: body.task_id,
                        message: `${user.first_name} ${user.last_name} moved ${getTaskDetail.title} task to list ${getProjectColumn.name}.`,
                    }

                    let createActivity = await this.services.createRecentActivities(recentActivity);
                    let getAssinedTaskUsers = await this.services.getTaskAssignedUsersByTaskId(body.task_id);
                    if (ProjectExist.slack_notification_url) {
                             /** Slack notification messages */
                             let slackNotificationData = {
                                userName: `${user.first_name} ${user.last_name}`,
                                project_name: getTaskDetail.dataValues.project_name,
                                task_name: getTaskDetail.title,
                                project_column_name: getTaskDetail.dataValues.column_name,
                                project_moved_column_name: getProjectColumn.name,
                                slack_notification_url:ProjectExist.slack_notification_url,
                                types_of_slack_notification:ProjectExist.types_of_slack_notification
                            }
                            await this.services.slackNotificationProject(SLACK_NOTIFICATION_TYPE.TASK_MOVE,slackNotificationData)
                    }

                    if (getAssinedTaskUsers.length > 0) {
                        getAssinedTaskUsers.push(getTaskDetail.added_by);

                        console.log("====enter in second case=====1========");

                   

                        console.log("====enter in second case=====2========");


                        getAssinedTaskUsers = getAssinedTaskUsers.filter(item => item !== user.id);
                        let createReadNotification = [];
                        for (let i in getAssinedTaskUsers) {
                            let getUserPermissionId = await this.services.getUserPermissionId(getAssinedTaskUsers[i]);
                            let getPermission = await this.services.getUserRolePermissions(getUserPermissionId);
                            const projectExist = await this.services.findProjectById(getTaskDetail.project_id, user.id);
                            if (getPermission && (getPermission.is_project_access == 1 && projectExist.is_private == 0) || (projectExist.is_private == 1 && await this.services.getProjectAssignedUser(projectExist.id, groupMembers[i]) == 0)) {
                                // No need to perform any action
                            } else {
                                createReadNotification.push({
                                    notification_id: createActivity.id,
                                    user_id: getAssinedTaskUsers[i],
                                    is_read: 0,
                                    notification_type: createActivity.type
                                });
                            }
                        }
                        await this.Models.ReadNotifications.bulkCreate(createReadNotification);
                    }
                    // }

                } else if (body.project_column_id == 1) {
                    let getAssignee = (body.column == "No Assignee") ? [] : body.column.split(",");

                    await this.Models.AssignedTaskUsers.update({
                        deleted_at: moment(new Date()).unix(),
                    }, {
                        where: {
                            task_id: body.task_id,
                        }
                    });

                    let createAssignee = [];
                    if (getAssignee.length > 0) {

                        let columnIds = body.column.split(",");

                        if (columnIds.length > 0) {
                            for (let i in columnIds) {
                                let getUser = await this.Models.Users.findOne({
                                    attributes: ["id", "deleted_at"],
                                    where: {
                                        id: columnIds[i],
                                        deleted_at: null
                                    },
                                    raw: true
                                });

                                if (getUser) {
                                    let assignedTaskUser = await this.Models.AssignedTaskUsers.findOne({
                                        where: {
                                            task_id: body.task_id,
                                            user_id: getUser.id,
                                            project_id: getTaskDetail.project_id,
                                        },
                                        raw: true
                                    });

                                    if (!assignedTaskUser) {
                                        createAssignee.push({
                                            task_id: body.task_id,
                                            user_id: getUser.id,
                                            project_id: getTaskDetail.project_id,
                                        });
                                    }
                                }
                            }
                        }

                    }
                    await this.Models.AssignedTaskUsers.bulkCreate(createAssignee);

                    let updateLabels = {
                        label: body.column,
                        updated_by: user.id
                    }
                    await this.services.taskUpdate(updateLabels, body.task_id);


                } else if (body.project_column_id == 2) {

                    let updatePriority = {
                        priority: body.column,
                        updated_by: user.id
                    }
                    await this.services.taskUpdate(updatePriority, body.task_id);

                } else if (body.project_column_id == 3) {

                    let getLabels = (body.column == "No Labels") ? [] : body.column.split(",");

                    await this.Models.TaskSelectedLabels.update({
                        deleted_at: moment(new Date()).unix(),
                    }, {
                        where: {
                            task_id: body.task_id,
                        }
                    });

                    if (getLabels.length > 0) {
                        let createLabels = [];
                        for (let i in getLabels) {
                            let getLabel = await this.Models.TaskLabels.findOne({
                                where: {
                                    id: getLabels[i],
                                    deleted_at: null
                                },
                                raw: true
                            });
                            if (getLabel) {

                                let getSeletedLabel = await this.Models.TaskSelectedLabels.findOne({
                                    where: {
                                        task_id: body.task_id,
                                        label_id: getLabels[i]
                                    },
                                    raw: true
                                });
                                if (!getSeletedLabel) {
                                    createLabels.push({
                                        task_id: body.task_id,
                                        label_id: getLabels[i]
                                    });
                                }
                            }
                        }
                        await this.Models.TaskSelectedLabels.bulkCreate(createLabels);
                    }

                    let updateLabels = {
                        label: body.column,
                        updated_by: user.id
                    }
                    await this.services.taskUpdate(updateLabels, body.task_id);


                } else if (body.project_column_id == 4) {

                    let updateDueDate = {
                        due_date_time: body.column,
                        updated_by: user.id
                    }
                    await this.services.taskUpdate(updateDueDate, body.task_id);

                }
            };

            return res.status(200).send(successResponse(TaskMessages.TASK_MOVE, getTaskDetail, RESPONSE_CODES.POST));
        } catch (error) {
            console.log(error, "=====error=====")
            return res.status(500).send(errorResponse(CommonMessages.ERROR, null, RESPONSE_CODES.SERVER_ERROR));
        }
    }

    // change task status
    async taskStatusUpdate(req, res) {
        try {
            const { body, user } = req;

            const findTaskExist = await this.services.findTaskById(body.task_id)
            if (!findTaskExist) {
                return res
                    .status(400)
                    .send(
                        errorResponse(
                            TaskMessages,
                            null,
                            RESPONSE_CODES.BAD_REQUEST
                        ));
            }

            const findcolumnExist = await this.services.findProjectColumnByIdForStatus(findTaskExist.project_id, body.status)
            if (!findcolumnExist) {
                return res
                    .status(400)
                    .send(
                        errorResponse(
                            TaskMessages.PROJECT_COLUMN_NOT_EXIST,
                            null,
                            RESPONSE_CODES.BAD_REQUEST
                        ));
            }

            if (user.role_id != ROLES.CLIENT) {

                let checkIsAssignedTask = await this.services.getTaskAssignedToUser(body.task_id, user.id)
                if (!checkIsAssignedTask) {
                    return res
                        .status(400)
                        .send(
                            errorResponse(
                                TaskMessages.CANNOT_UPDATE_STATUS,
                                null,
                                RESPONSE_CODES.BAD_REQUEST
                            )
                        );
                }
            }

            const data = {
                id: body.task_id,
                project_column_id: body.status,
                status: body.status
            }

            const updateTaskStatus = await this.services.updateStatus(data, body.task_id)
            return res.status(200).send(successResponse(TaskMessages.TASK_STATUS, {}, RESPONSE_CODES.POST));

        } catch (error) {
            console.log(error, "=====error=====")
            return res.status(500).send(errorResponse(CommonMessages.ERROR, null, RESPONSE_CODES.SERVER_ERROR));
        }
    }

    /* api for task completed */
    async taskComplete(req, res) {
        try {
            const { params, user } = req;
            const getTaskDetail = await this.services.getTaskDetailById(params.task_id);
            if (!getTaskDetail) {
                return res
                    .status(400)
                    .send(
                        errorResponse(
                            TaskMessages.TASK_NOT_FOUND,
                            null,
                            RESPONSE_CODES.BAD_REQUEST
                        )
                    );
            }

            const getCompletedColumn = await this.services.getCompletedColumnOfProject(getTaskDetail.project_id);
            if (!getCompletedColumn) {
                return res
                    .status(400)
                    .send(
                        errorResponse(
                            TaskMessages.COMPLETED_COLUMN_NOT_FOUND,
                            null,
                            RESPONSE_CODES.BAD_REQUEST
                        )
                    );
            }

            let ProjectExist = await this.services.findProjectByIds(getTaskDetail.project_id);
            if (ProjectExist) {
                let projectCreatorId = ProjectExist.user_id;
                if (user.role_id == ROLES.AGENT || user.role_id == ROLES.USER) {
                    let getUserDetail = await this.services.getUserDetailById(projectCreatorId);
                    if (getUserDetail.role_id == ROLES.USER) {
                        projectCreatorId = getUserDetail.added_by;
                    }

                    let checkIsToggle = await this.services.getUserTaskPermission(projectCreatorId, user.id);

                    if (checkIsToggle == 1) {

                        let checkIsAssignedTask = await this.services.getTaskAssignedToUser(params.task_id, user.id)
                        if (!checkIsAssignedTask && getTaskDetail.added_by != user.id) {
                            return res
                                .status(400)
                                .send(
                                    errorResponse(
                                        TaskMessages.CANNOT_UPDATE_STATUS,
                                        null,
                                        RESPONSE_CODES.BAD_REQUEST
                                    )
                                );
                        }


                        let checkIsItSubTask = await this.Models.Tasks.findOne({
                            attributes: ["id", "parent_task_id", "deleted_at"],
                            where: {
                                parent_task_id: params.task_id,
                                deleted_at: null,
                            },
                            raw: true
                        });


                        if (checkIsItSubTask) {
                            let checkIsAssigned = await this.Models.AssignedTaskUsers.findOne({
                                where: {
                                    task_id: checkIsItSubTask.parent_task_id,
                                    user_id: user.id,
                                    deleted_at: null
                                },
                                raw: true
                            });
                            if (!checkIsAssigned) {
                                return res
                                    .status(400)
                                    .send(
                                        errorResponse(
                                            TaskMessages.CANNOT_COMPLETE_TASK,
                                            null,
                                            RESPONSE_CODES.BAD_REQUEST
                                        )
                                    );
                            }
                        }
                    }
                }
            }

            await this.services.taskMoveInColumns(getCompletedColumn.id, params.task_id, user.id);

            let getAllSubtask = await this.Models.Tasks.findAll({
                attributes: ["id", "parent_task_id", "deleted_at"],
                where: {
                    parent_task_id: params.task_id,
                    deleted_at: null,
                },
                raw: true
            });

            if (getAllSubtask.length > 0) {
                for (let i in getAllSubtask) {
                    await this.services.taskMoveInColumns(getCompletedColumn.id, getAllSubtask[i].id, user.id);
                }
            }

            let recentActivity = {
                client_id: getTaskDetail.user_id,
                user_id: user.id,
                type: RECENT_ACTIVITY_TYPE.TASK_COMPLETE,
                project_column_id: getCompletedColumn.id,
                project_id: getTaskDetail.project_id,
                task_id: params.task_id,
                parent_task_id: getTaskDetail.parent_task_id,
                message: `${user.first_name} ${user.last_name} has successfully ${getCompletedColumn.name} the ${getTaskDetail.title} task.`,
                is_notifictaion: 1,
            }
            let createActivity = await this.services.createRecentActivities(recentActivity);
            let getAssinedTaskUsers = await this.services.getTaskAssignedUsersByTaskId(params.task_id);
            if (ProjectExist.slack_notification_url) {
                     /** Slack notification messages */
                     let slackNotificationData = {
                        userName: `${user.first_name} ${user.last_name}`,
                        project_name: getTaskDetail.dataValues.project_name,
                        task_name: getTaskDetail.title,
                        project_column_name: getTaskDetail.dataValues.column_name,
                        slack_notification_url:ProjectExist.slack_notification_url,
                        types_of_slack_notification:ProjectExist.types_of_slack_notification
                    }
                    await this.services.slackNotificationProject(SLACK_NOTIFICATION_TYPE.TASK_COMPLETE,slackNotificationData)
            }
            if (getAssinedTaskUsers.length > 0) {
                getAssinedTaskUsers.push(getTaskDetail.added_by);     

                getAssinedTaskUsers = getAssinedTaskUsers.filter(item => item !== user.id);
                let createReadNotification = [];
                for (let i in getAssinedTaskUsers) {

                    let getUserPermissionId = await this.services.getUserPermissionId(getAssinedTaskUsers[i]);
                    let getPermission = await this.services.getUserRolePermissions(getUserPermissionId);
                    const projectExist = await this.services.findProjectById(getTaskDetail.project_id, user.id);
                    if (getPermission && (getPermission.is_project_access == 1 && projectExist.is_private == 0) || (projectExist.is_private == 1 && await this.services.getProjectAssignedUser(projectExist.id, groupMembers[i]) == 0)) {
                        // No need to perform any action
                    } else {
                        createReadNotification.push({
                            notification_id: createActivity.id,
                            user_id: getAssinedTaskUsers[i],
                            is_read: 0,
                            notification_type: createActivity.type
                        });
                    }
                }
                await this.Models.ReadNotifications.bulkCreate(createReadNotification);
            }

            const getCompletedTaskDetail = await this.services.getTaskDetailById(params.task_id);
            return res.status(200).send({
                status: 1,
                message: TaskMessages.TASK_COMPLETED,
                complete_column_id: getCompletedColumn.id,
                code: RESPONSE_CODES.POST,
                data: getCompletedTaskDetail,
            })
            // return res.status(200).send(successResponse(TaskMessages.TASK_COMPLETED, getTaskDetail, RESPONSE_CODES.POST));
        } catch (error) {
            console.log(error, "=====error=====")
            return res.status(500).send(errorResponse(CommonMessages.ERROR, null, RESPONSE_CODES.SERVER_ERROR));
        }
    }


    /* add task labels for project */
    async addTaskLabel(req, res) {
        try {
            const { body, user } = req;
            //check project exist or not
            const projectExist = await this.services.findProjectById(body.project_id, user.id);
            if (!projectExist) {
                return res.status(400)
                    .send(
                        errorResponse(
                            TaskMessages.PROJECT_NOT_EXIST,
                            null,
                            RESPONSE_CODES.BAD_REQUEST
                        )
                    )
            }

            const checkLabelExist = await this.services.getTaskLabel(body);
            if (checkLabelExist) {
                return res
                    .status(400)
                    .send(
                        errorResponse(
                            TaskMessages.LABEL_ALREADY_ADDED,
                            null,
                            RESPONSE_CODES.BAD_REQUEST
                        )
                    );
            }

            body.user_id = user.id;
            let createLabel = await this.services.createLabel(body);
            return res.status(200).send(successResponse(TaskMessages.LABEL_ADDED, createLabel, RESPONSE_CODES.POST));
        } catch (error) {
            console.log(error, "=====error=====")
            return res.status(500).send(errorResponse(CommonMessages.ERROR, null, RESPONSE_CODES.SERVER_ERROR));
        }
    }



    /* task labels list for project */
    async taskLabelList(req, res) {
        try {
            const { body, user } = req;
            //check project exist or not
            const projectExist = await this.services.findProjectById(body.project_id, user.id);
            if (!projectExist) {
                return res.status(400)
                    .send(
                        errorResponse(
                            TaskMessages.PROJECT_NOT_EXIST,
                            null,
                            RESPONSE_CODES.BAD_REQUEST
                        )
                    )
            }
            const getTaskLabels = await this.services.getTaskLabelList(body);
            return res.status(200).send(successResponse(TaskMessages.LABEL_ADDED, getTaskLabels, RESPONSE_CODES.POST));
        } catch (error) {
            console.log(error, "=====error=====")
            return res.status(500).send(errorResponse(CommonMessages.ERROR, null, RESPONSE_CODES.SERVER_ERROR));
        }
    }



    /* Sub Task list */
    async subTaskList(req, res) {
        try {
            const { body, user } = req;
            //check task exist or not
            const getTaskDetail = await this.services.getTaskDetailById(body.task_id);
            if (!getTaskDetail) {
                return res
                    .status(400)
                    .send(
                        errorResponse(
                            TaskMessages.TASK_NOT_FOUND,
                            null,
                            RESPONSE_CODES.BAD_REQUEST
                        )
                    );
            }
            body.user_id = user.id;
            body.role_id = user.role_id;
            body.projectCreator = user.id;
            if (user.role_id == ROLES.AGENT) {
                let getProjectDetail = await this.services.getProjectByProjectId(getTaskDetail.project_id);
                if (getProjectDetail) {
                    let getUserDetail = await this.services.getUserDetailById(getProjectDetail.user_id);
                    if (getUserDetail.role_id == ROLES.USER) {
                        body.projectCreator = getUserDetail.added_by;
                    } else {
                        body.projectCreator = getUserDetail.id;
                    }
                }
            }

            const getSubTasklist = await this.services.getSubTaskList(body);
            return res
                .status(200)
                .send(
                    successResponse(TaskMessages.GET_LIST, getSubTasklist, RESPONSE_CODES.GET)
                );
        } catch (error) {
            console.log(error, "====error===");
            return res
                .status(500)
                .send(
                    errorResponse(
                        CommonMessages.ERROR,
                        null,
                        RESPONSE_CODES.SERVER_ERROR
                    )
                );
        }
    };



    /* Sub Task Details */
    async subTaskDetail(req, res) {
        try {
            const { params } = req;
            const getTaskDetails = await this.services.getSubTaskDetailById(params.task_id);
            if (!getTaskDetails) {
                return res
                    .status(400)
                    .send(
                        errorResponse(
                            TaskMessages.TASK_NOT_FOUND,
                            null,
                            RESPONSE_CODES.BAD_REQUEST
                        )
                    );
            }
            return res.status(200)
                .send(
                    successResponse(TaskMessages.GET_DATA, getTaskDetails, RESPONSE_CODES.GET)
                );
        } catch (error) {
            console.log(error, "====error====");
            return res
                .status(500)
                .send(
                    errorResponse(
                        CommonMessages.ERROR,
                        null,
                        RESPONSE_CODES.SERVER_ERROR
                    )
                );
        }
    };

    /* Task Group Details */
    async getTaskGroupDetail(req, res) {
        try {
            const { params } = req;

            let getGroupDetail = await getCometChatGroupDetail(
                params.task_id,
            ).then((res) => res.json())
                .then(async (json) => {
                    return json.data
                });

            return res.status(200)
                .send(
                    successResponse(TaskMessages.GET_DATA, getGroupDetail, RESPONSE_CODES.GET)
                );
        } catch (error) {
            console.log(error, "====error====");
            return res
                .status(500)
                .send(
                    errorResponse(
                        CommonMessages.ERROR,
                        null,
                        RESPONSE_CODES.SERVER_ERROR
                    )
                );
        }
    };



    /* delete task  labels */
    async deleteTaskLabel(req, res) {
        try {
            const { params, user } = req;
            /** check task label exist or not  */
            let getTaskLabel = await this.services.getTaskLabelById(params.label_id);
            if (!getTaskLabel) {
                return res
                    .status(400)
                    .send(
                        errorResponse(
                            TaskMessages.LABEL_NOT_FOUND,
                            null,
                            RESPONSE_CODES.BAD_REQUEST
                        )
                    );
            }
            let deleteData = {
                deleted_at: moment(new Date()).unix(),
            };
            await this.services.updateTaskLabel(deleteData, params.label_id);
            await this.services.updateSelectedTaskLabel(deleteData, params.label_id);
            return res.status(200).send(successResponse(TaskMessages.LABEL_DELETED, {}, RESPONSE_CODES.DELETE));
        } catch (error) {
            console.log(error, "==error===")
            return res
                .status(500)
                .send(
                    errorResponse(
                        CommonMessages.ERROR,
                        null,
                        RESPONSE_CODES.SERVER_ERROR
                    )
                );
        }
    };


    /** Add task messages  */
    async addTaskMessage(req, res) {
        try {
            const { body, user, files } = req;
            body.user_id = user.id;

            if (!body.task_id) {
                let msg = "Task id is required";
                return this.services.errorFunction(req, res, msg);
            }

            const getTaskDetails = await this.services.getSubTaskDetailById(body.task_id);
            if (!getTaskDetails) {
                return res
                    .status(400)
                    .send(
                        errorResponse(
                            TaskMessages.TASK_NOT_FOUND,
                            null,
                            RESPONSE_CODES.BAD_REQUEST
                        )
                    );
            }

            if (!body.message) {
                if (files.length == 0) {
                    let msg = "Please send at least one from message or files.";
                    return this.services.errorFunction(req, res, msg);
                }
            }

            body.project_id = getTaskDetails.project_id;
            const createTaskMessage = await this.services.createTaskChatMessages(body);
            if (!createTaskMessage) {
                return res
                    .status(404)
                    .send(
                        errorResponse(
                            TaskMessages.TASK_MESSAGE_NOT_SEND,
                            null,
                            RESPONSE_CODES.NOT_FOUND
                        )
                    );
            }

            if (files && files.length > 0) {
                let sendData = {
                    files,
                    id: getTaskDetails.id,
                    folder: 'Tasks'
                }
                const uploadedImage = await uploadFileForAll(sendData);

                if (uploadedImage.length > 0) {
                    await this.services.uploadTaskMultipleFiles(uploadedImage, body, createTaskMessage.id)
                }
            }

            let recentActivity = {
                client_id: getTaskDetails.user_id,
                user_id: user.id,
                type: RECENT_ACTIVITY_TYPE.TASK_COMMENT_ADD,
                project_column_id: getTaskDetails.project_column_id,
                project_id: getTaskDetails.project_id,
                task_id: getTaskDetails.id,
                parent_task_id: getTaskDetails.parent_task_id,
                comment_id: createTaskMessage.id,
                is_notification: 1
            }
            let createActivity = await this.services.createRecentActivities(recentActivity);
            let getAssinedTaskUsers = await this.services.getTaskAssignedUsersByTaskId(getTaskDetails.id);
            if (getAssinedTaskUsers.length > 0) {
                getAssinedTaskUsers.push(getTaskDetails.added_by);
                getAssinedTaskUsers = getAssinedTaskUsers.filter(item => item !== user.id);
                let createReadNotification = [];
                for (let i in getAssinedTaskUsers) {
                    let getUserPermissionId = await this.services.getUserPermissionId(getAssinedTaskUsers[i]);
                    let getPermission = await this.services.getUserRolePermissions(getUserPermissionId);
                    const projectExist = await this.services.findProjectById(getTaskDetails.project_id, user.id);
                    if (getPermission && (getPermission.is_project_access == 1 && projectExist.is_private == 0) || (projectExist.is_private == 1 && await this.services.getProjectAssignedUser(projectExist.id, groupMembers[i]) == 0)) {
                        // No need to perform any action
                    } else {
                        createReadNotification.push({
                            notification_id: createActivity.id,
                            user_id: getAssinedTaskUsers[i],
                            is_read: 0,
                            notification_type: createActivity.type
                        });
                    }
                }
                await this.Models.ReadNotifications.bulkCreate(createReadNotification);
            }

            let getMessage = await this.services.getTaskChatMessageById(createTaskMessage.id);
            return res
                .status(200)
                .send(
                    successResponse(TaskMessages.TASK_MESSAGE_SEND, getMessage, RESPONSE_CODES.POST)
                );

        } catch (error) {
            console.log(error, "====error====");
            return res
                .status(500)
                .send(
                    errorResponse(
                        CommonMessages.ERROR,
                        null,
                        RESPONSE_CODES.SERVER_ERROR
                    )
                );
        }
    };


    /* Task  chat */
    async getTaskChat(req, res) {
        try {
            const { params, query } = req;
            const getTaskDetails = await this.services.getSubTaskDetailById(params.task_id);
            if (!getTaskDetails) {
                return res
                    .status(400)
                    .send(
                        errorResponse(
                            TaskMessages.TASK_NOT_FOUND,
                            null,
                            RESPONSE_CODES.BAD_REQUEST
                        )
                    );
            }
            let chatMessages = await this.services.getTaskChatMessages(params.task_id, query);
            return res.status(200)
                .send(
                    successResponse(TaskMessages.GET_DATA, chatMessages, RESPONSE_CODES.GET)
                );
        } catch (error) {
            console.log(error, "====error====");
            return res
                .status(500)
                .send(
                    errorResponse(
                        CommonMessages.ERROR,
                        null,
                        RESPONSE_CODES.SERVER_ERROR
                    )
                );
        }
    };


}
