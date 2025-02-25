require("dotenv").config();
import Services from "./support.services.js";
import { RESPONSE_CODES, ROLES, RECENT_ACTIVITY_TYPE, ASSIGNED_USERS } from "../../../config/constants.js";
import { successResponse, errorResponse } from "../../../config/responseHelper.js";
import { CommonMessages } from "../../../constants/message/common.js";
import { SupportMessages } from "../../../constants/message/supports.js";
import moment from "moment";
import { uploadFileForAll, s3RemoveMultipleFiles, s3RemoveSingleFile, createCometChatGroup, createCometChatGroupMembers, removeCometChatGroupMembers, updateCometChatGroup, deleteCometChatGroup, getCometChatGroupMembers, getCometChatGroupDetail } from "../helpers/commonFunction";
import { v4 as uuidv4 } from 'uuid';
import { Sequelize } from "sequelize";
const Op = Sequelize.Op;
import { keywordMail } from "../EmailTemplates/keyword_mail.js";
import {ticketCreate} from "../EmailTemplates/ticket_create.js";
import {ticketReply} from "../EmailTemplates/ticket_reply.js";
import {ticketStatus} from "../EmailTemplates/ticket_status.js";

import fs from "fs";
import nodemailer from "../helpers/mail.js";

export default class Product {
    async init(db) {
        this.services = new Services();
        this.Models = db.models;
        await this.services.init(db);
    }

    /** add support */
    async addSupport(req, res) {
        try {
            const { body, user, files } = req;
            body.user_id = user.id;
            if (!body.department_id) {
                let msg = "Department id is required";
                return this.services.errorFunction(req, res, msg);
            }

            if (!body.subject) {
                let msg = "Subject is required";
                return this.services.errorFunction(req, res, msg);
            }

            if (!body.message) {
                let msg = "Message is required";
                return this.services.errorFunction(req, res, msg);
            }

            body.status = (!body.status || (body.status && body.status == "")) ? "In Progress" : body.status;

            const getDepartment = await this.services.getDepartmentDetails(body.department_id);
            if (!getDepartment) {
                return res
                    .status(400)
                    .send(
                        errorResponse(
                            SupportMessages.DEPARTMENT_NOT_FOUND,
                            null,
                            RESPONSE_CODES.BAD_REQUEST
                        )
                    );
            }


            const createSupport = await this.services.createSupports(body)
            if (!createSupport) {
                return res
                    .status(404)
                    .send(
                        errorResponse(
                            SupportMessages.SUPPORT_NOT_CREATED,
                            null,
                            RESPONSE_CODES.NOT_FOUND
                        )
                    );
            }

            if (files && files.length > 0) {
                let sendData = {
                    files,
                    id: createSupport.id,
                    folder: 'Support'
                }
                const uploadedImage = await uploadFileForAll(sendData);

                let chatId = null;
                if (uploadedImage.length > 0) {
                    await this.services.uploadMultipleFiles(uploadedImage, createSupport.id, chatId)
                }
            }

            // let getAdmin = await this.Models.Users.findOne({
            //     where: {
            //         role_id: ROLES.ADMIN,
            //         deleted_at:null
            //     },
            //     raw: true
            // });

            let attachement = [];
            if (files && files.length > 0) {
                for(let i in files) {
                    attachement.push({
                    filename: files[i].originalname,
                    content: files[i].buffer
                    });
                }
            }
            let supportDetail = await this.services.getSupportInfoBySupportId(createSupport.id);
            supportDetail.created_at = supportDetail.created_at ? moment(new Date(supportDetail.created_at)).format('DD MMMM YYYY hh:mm A'): "";
            const emailTemplate = await ticketCreate(supportDetail);
            const subject = `Support Ticket Created: ${createSupport.id}`;
            let mailFunction = (process.env.PRODUCTION == true || process.env.PRODUCTION == "true") ? nodemailer.sendinBlueMail : nodemailer.sendMail;
            let to = "rcwdashboard@yopmail.com";
            await mailFunction(to, subject, emailTemplate, attachement);
            return res
                .status(200)
                .send(
                    successResponse(SupportMessages.SUPPORT_ADDED, createSupport, RESPONSE_CODES.POST)
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

    async getSupportList(req, res) {
        try {
            const { user, body } = req
            let client_ids = [user.id];
            let getClientids;
            let uniqueClientsArray;
            if (user.role_id == ROLES.ACCOUNTMANAGER) {
                let setAttributes = ["id", "support_access", "deleted_at"];
                let getPermission = await this.services.getAccountManagerRolePermissions(user.role_permission_id, setAttributes);
                if(getPermission && getPermission.support_access == 1) {
                    getClientids = await this.services.getAccountManagerClientIds(user.id);
                    client_ids = await getClientids.map(ids => ids.user_id);
                    let clientUsers = await this.Models.Users.findAll({
                        attributes: ["id", "added_by", "deleted_at"],
                        where: {
                            added_by: client_ids,
                            deleted_at: null
                        },
                        raw: true
                    });
                    for(let i in clientUsers) {
                        client_ids.push(clientUsers[i].id);
                    }
                    uniqueClientsArray = [...new Set(client_ids)]
                }else{
                    user.role_id = ROLES.ADMIN;
                }
            }else if(user.role_id = ROLES.CLIENT) {

                let getAllClientUsers = await this.Models.Users.findAll({
                    attributes: ["id", "added_by", "deleted_at"],
                    where: {
                        added_by: user.id,
                        deleted_at: null
                    },
                    raw: true
                });
                let getUserIds = getAllClientUsers.map(val=> val.id);
                let getAllUsersClientUser = await this.Models.Users.findAll({
                    attributes: ["id", "added_by", "deleted_at"],
                    where: {
                        added_by: getUserIds,
                        deleted_at: null
                    },
                    raw: true
                });
                let getAllUsersClientUserIds = getAllUsersClientUser.map(val=> val.id);
                uniqueClientsArray = getUserIds.concat(getAllUsersClientUserIds, user.id);
            }else {
                uniqueClientsArray = [...new Set(client_ids)];
            }
            const getSupportList = await this.services.getSupportList(body, uniqueClientsArray, user.role_id, user)
            return res
                .status(200)
                .send(
                    successResponse(SupportMessages.GET_LIST, getSupportList, RESPONSE_CODES.POST)
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
    }

    async getSupportDetail(req, res) {
        try {
            const { params, user } = req;

            const getSupport = await this.services.getSupportDetails(params.support_id)
            if (!getSupport) {
                return res
                    .status(404)
                    .send(
                        errorResponse(
                            SupportMessages.SUPPORT_NOT_FOUND,
                            null,
                            RESPONSE_CODES.NOT_FOUND
                        )
                    );
            }

            if (user.role_id == ROLES.ACCOUNTMANAGER) {
                let setAttributes = ["id", "support_access", "deleted_at"];
                let client_ids = [];
                let getPermission = await this.services.getAccountManagerRolePermissions(user.role_permission_id, setAttributes);
                if(getPermission && getPermission.support_access == 1) {
                    let getClientids = await this.services.getAccountManagerClientIds(user.id);
                    client_ids = await getClientids.map(ids => ids.user_id);
                    let clientUsers = await this.Models.Users.findAll({
                        attributes: ["id", "added_by", "deleted_at"],
                        where: {
                            added_by: client_ids,
                            deleted_at: null
                        },
                        raw: true
                    });
                    for(let i in clientUsers) {
                        client_ids.push(clientUsers[i].id);
                    }

                    let getSupportByClient = await this.services.getSupportByClientOrSupportId(params.support_id, client_ids) 
                    if(!getSupportByClient) {
                        return res
                        .status(400)
                        .send(
                          errorResponse(
                            SupportMessages.SUPPORT_NOT_ACCESS,
                            null,
                            RESPONSE_CODES.BAD_REQUEST
                          )
                        );
                    }

                }
            }


            let getAdmin = await this.Models.Users.findOne({
                where: {
                    role_id: ROLES.ADMIN,
                    deleted_at: null,
                },
                raw: true,
            });
            const getSupportDetail = await this.services.getSupportDetails(params.support_id);
            let receiver_id = (getAdmin && getAdmin.id) ? getAdmin.id : 0;
            if(user.role_id == ROLES.ADMIN) {
                receiver_id = getSupportDetail.dataValues.user_id;
            };
            getSupportDetail.dataValues.receiver_id = receiver_id;
            return res
                .status(200)
                .send(
                    successResponse(SupportMessages.GET_DATA, getSupportDetail, RESPONSE_CODES.POST)
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
    }

    async deleteSupportDetail(req, res) {
        try {
            const { params } = req
            const getSupport = await this.services.getSupportDetails(params.support_id)

            if (!getSupport) {
                return res
                    .status(404)
                    .send(
                        errorResponse(
                            SupportMessages.SUPPORT_NOT_FOUND,
                            null,
                            RESPONSE_CODES.NOT_FOUND
                        )
                    );
            }

            const updateData = {
                deleted_at: moment(new Date()).unix(),
            };

            await this.services.deleteSupport(updateData, params.support_id)

            const get_deleting_file_key = await this.services.getFileKeys(params.support_id)

            if (get_deleting_file_key && get_deleting_file_key.length > 0) {
                await s3RemoveMultipleFiles(get_deleting_file_key)
                await this.services.deleteSupportFiles(updateData, params.support_id)
            }

            return res
                .status(200)
                .send(
                    successResponse(SupportMessages.SUPPORT_DELETED, {}, RESPONSE_CODES.DELETE)
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


    async updateSupport(req, res) {
        try {
            const { body, user, files } = req;
            body.updated_by = user.id;
            if (!body.support_id) {
                let msg = "Support id is required";
                return this.services.errorFunction(req, res, msg);
            }

            if (!body.department_id) {
                let msg = "Department id is required";
                return this.services.errorFunction(req, res, msg);
            }

            if (!body.subject) {
                let msg = "Subject is required";
                return this.services.errorFunction(req, res, msg);
            }

            if (!body.message) {
                let msg = "Message is required";
                return this.services.errorFunction(req, res, msg);
            }

            if (!body.status) {
                let msg = "Status is required";
                return this.services.errorFunction(req, res, msg);
            }


            const getSupport = await this.services.getSupportDetails(body.support_id)
            if (!getSupport) {
                return res
                    .status(404)
                    .send(
                        errorResponse(
                            SupportMessages.SUPPORT_NOT_FOUND,
                            null,
                            RESPONSE_CODES.NOT_FOUND
                        )
                    );
            }

            const getDepartment = await this.services.getDepartmentDetails(body.department_id);
            if (!getDepartment) {
                return res
                    .status(400)
                    .send(
                        errorResponse(
                            SupportMessages.DEPARTMENT_NOT_FOUND,
                            null,
                            RESPONSE_CODES.BAD_REQUEST
                        )
                    );
            }


            if(body.status == "Closed") {
                body.is_close = 1;
            }else if(body.status == "Re Opened"){
                body.is_close = 0;
            }

            await this.services.updateSupport(body, body.support_id);

            if (files && files.length > 0) {
                let sendData = {
                    files,
                    id: body.support_id,
                    folder: 'Support'
                }
                const uploadedImage = await uploadFileForAll(sendData);
                let chatId = null;
                if (uploadedImage.length > 0) {
                    await this.services.uploadMultipleFiles(uploadedImage, body.support_id, chatId)
                }
            }

            if (body.delete_file_ids != "") {
                let deletedFileids = body.delete_file_ids.split(",");
                for (let i in deletedFileids) {
                    const getSupportAttachment = await this.services.getSupportAttachment(deletedFileids[i])
                    if (getSupportAttachment) {
                        const updateData = {
                            deleted_at: moment(new Date()).unix(),
                        };
                        await s3RemoveSingleFile(getSupportAttachment.file)
                        await this.services.deleteSupportAttachment(updateData, getSupportAttachment.id);
                    }
                }
            }

            return res
                .status(200)
                .send(
                    successResponse(SupportMessages.SUPPORT_UPDATED, {}, RESPONSE_CODES.POST)
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



    /** Delete support attachments */
    async deleteSupportAttachment(req, res) {
        try {
            const { params } = req
            const getSupportAttachment = await this.services.getSupportAttachment(params.attachment_id)
            if (!getSupportAttachment) {
                return res
                    .status(404)
                    .send(
                        errorResponse(
                            SupportMessages.SUPPORT_ATTACHMENT_NOT_FOUND,
                            null,
                            RESPONSE_CODES.NOT_FOUND
                        )
                    );
            }
            const updateData = {
                deleted_at: moment(new Date()).unix(),
            };
            await s3RemoveSingleFile(getSupportAttachment.file)
            await this.services.deleteSupportAttachment(updateData, params.attachment_id);
            return res
                .status(200)
                .send(
                    successResponse(SupportMessages.SUPPORT_ATTACHMENT_DELETED, {}, RESPONSE_CODES.DELETE)
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


    /** -------------------------------Department Section apis-------------------------------------- */


    /** Add department  */
    async addDepartment(req, res) {
        try {
            const { body, user } = req;
            body.added_by = user.id;

            const checkDepartmentName = await this.services.getDepartmentByName(body.name)
            if (checkDepartmentName) {
                return res
                    .status(400)
                    .send(
                        errorResponse(
                            SupportMessages.DEPARTMENT_ALREADY_ADDED,
                            null,
                            RESPONSE_CODES.BAD_REQUEST
                        )
                    );
            }
            await this.services.createDepartment(body);
            return res
                .status(200)
                .send(
                    successResponse(SupportMessages.DEPARTMENT_ADDED, {}, RESPONSE_CODES.POST)
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


    /** Department list */
    async getDepartmentList(req, res) {
        try {
            const { body } = req

            const getDepartmentList = await this.services.getDepartmentList(body)
            return res
                .status(200)
                .send(
                    successResponse(SupportMessages.GET_LIST, getDepartmentList, RESPONSE_CODES.POST)
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


    /** Get department detail */
    async getDepartmentDetail(req, res) {
        try {
            const { params } = req;
            const getDepartment = await this.services.getDepartmentDetails(params.department_id);
            if (!getDepartment) {
                return res
                    .status(400)
                    .send(
                        errorResponse(
                            SupportMessages.DEPARTMENT_NOT_FOUND,
                            null,
                            RESPONSE_CODES.BAD_REQUEST
                        )
                    );
            }

            return res
                .status(200)
                .send(
                    successResponse(SupportMessages.GET_LIST, getDepartment, RESPONSE_CODES.GET)
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
    }

    /** Delete department */
    async deleteDepartment(req, res) {
        try {
            const { params } = req
            const getDepartment = await this.services.getDepartmentDetails(params.department_id)
            if (!getDepartment) {
                return res
                    .status(404)
                    .send(
                        errorResponse(
                            SupportMessages.DEPARTMENT_NOT_FOUND,
                            null,
                            RESPONSE_CODES.NOT_FOUND
                        )
                    );
            }
            const updateData = {
                deleted_at: moment(new Date()).unix(),
            };
            await this.services.updateDepartment(updateData, params.department_id);
            await this.Models.Supports.update(updateData,{
                where: {
                    department_id: params.department_id
                }
            });
            return res
                .status(200)
                .send(
                    successResponse(SupportMessages.DEPARTMENT_DELETED, {}, RESPONSE_CODES.DELETE)
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




    /** update department  */
    async updateDepartment(req, res) {
        try {
            const { body } = req;

            const getDepartment = await this.services.getDepartmentDetails(body.department_id)
            if (!getDepartment) {
                return res
                    .status(404)
                    .send(
                        errorResponse(
                            SupportMessages.DEPARTMENT_NOT_FOUND,
                            null,
                            RESPONSE_CODES.NOT_FOUND
                        )
                    );
            }
            const checkDepartment = await this.services.getDepartmentByNameOrId(body.name, body.department_id)
            if (checkDepartment) {
                return res
                    .status(400)
                    .send(
                        errorResponse(
                            SupportMessages.DEPARTMENT_ALREADY_ADDED,
                            null,
                            RESPONSE_CODES.BAD_REQUEST
                        )
                    );
            }
            await this.services.updateDepartment(body, body.department_id);
            return res
                .status(200)
                .send(
                    successResponse(SupportMessages.DEPARTMENT_UPDATED, {}, RESPONSE_CODES.POST)
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



    /** user role list */
    async userRoleList(req, res) {
        try {
            const { body } = req
            const getUserRoleList = await this.services.getUserRoles(body)
            return res
                .status(200)
                .send(
                    successResponse(SupportMessages.GET_LIST, getUserRoleList, RESPONSE_CODES.POST)
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

    async addKeyword(req, res) {
        try {

            const { body } = req;
            const createKeyword = await this.services.createKeyword(body)

            return res
                .status(200)
                .send(
                    successResponse(SupportMessages.KEYWORD_CREATED, createKeyword, RESPONSE_CODES.POST)
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
    }

    async listKeyword(req, res) {
        try {
            const { body, user } = req
            const keywordsList = await this.services.keywordList(body);
            let getKeywordEmails = await this.services.getKeywordNotificationEmail(user.id);
            keywordsList.notification_emails = (getKeywordEmails && getKeywordEmails.email !="") ? getKeywordEmails.email: "";
            return res
                .status(200)
                .send(
                    successResponse(SupportMessages.KEYWORD_LIST, keywordsList, RESPONSE_CODES.GET)
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
    }


    async keywordUpdate(req, res) {
        try {
            const { body } = req

            const keywordsExist = await this.services.checkKeyword(body.keyword_id)
            if (!keywordsExist) {
                return res
                    .status(400)
                    .send(
                        errorResponse(
                            SupportMessages.KEYWORD_NOT_EXIST,
                            null,
                            RESPONSE_CODES.BAD_REQUEST
                        )
                    );
            }

            const updateData = {
                key_name: body.key_name,
            };


            const updateKeywords = await this.services.updateKeyword(updateData, body.keyword_id)

            return res
                .status(200)
                .send(
                    successResponse(SupportMessages.KEYWORD_UPDATED, updateKeywords, RESPONSE_CODES.POST)
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
    }

    async keywordDelete(req, res) {
        try {

            const { params } = req

            const keywordsExist = await this.services.checkKeyword(params.keyword_id)
            if (!keywordsExist) {
                return res
                    .status(400)
                    .send(
                        errorResponse(
                            SupportMessages.KEYWORD_NOT_EXIST,
                            null,
                            RESPONSE_CODES.BAD_REQUEST
                        )
                    );
            }

            const updateData = {
                deleted_at: moment(new Date()).unix(),
            };


            const deleteKeywords = await this.services.updateKeyword(updateData, params.keyword_id)
            return res
                .status(200)
                .send(
                    successResponse(SupportMessages.KEYWORD_DELETED, deleteKeywords, RESPONSE_CODES.POST)
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
    }

    // send email to registered notification emails
    async keywordMail(req, res) {
        try {
            const { body, user } = req

            const getAdmin = await this.Models.Users.findOne({
                where: {
                    role_id: ROLES.ADMIN,
                    deleted_at: null
                },
                raw: true
            });

            let getKeywordEmails = await this.services.getKeywordNotificationEmail(getAdmin.id);

            body.send_by = user.id
            await this.services.createKeywordMail(body);
            const mailData = {
                sender: user.first_name+' '+user.last_name,
                receiver: body.receiver_name,
                message : body.message,
                keywords : body.keywords.replace(/,/g, ', '),
                date_time : body.date_time
            }

            const to = (getKeywordEmails && getKeywordEmails.email !="") ? getKeywordEmails.email.split(", ") : ["rcwdashboard@yopmail.com"];
            // const to = getAdmin.email.toLowerCase();
            const emailTemplate = await keywordMail(mailData);
            const subject = "Prohibited keyword in a message.";
            let mailFunction = (process.env.PRODUCTION == true || process.env.PRODUCTION == "true") ? nodemailer.sendinBlueMail : nodemailer.sendMail;

            to.forEach(async element => {
                await mailFunction(element, subject, emailTemplate);
            });
            return res
                .status(201)
                .send(
                    successResponse(
                        SupportMessages.KEYWORD_MAIL_SENT,
                        {},
                        RESPONSE_CODES.POST
                    )
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


    // add notification keyword email
    async AddNotificationKeywordEmail(req, res) {
        try {
            const { body, user } = req
            body.added_by = user.id;

            let getKeywordEmails = await this.services.getKeywordNotificationEmail(user.id);
            if(!getKeywordEmails) {
                await this.services.createKeywordNotificationEmail(body);
            }else {
                await this.services.updateKeywordNotificationEmail(body)
            }
            return res
                .status(201)
                .send(
                    successResponse(
                        SupportMessages.KEYWORD_EMAIL_ADDED,
                        {},
                        RESPONSE_CODES.POST
                    )
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


    // mask As Close Support
    async maskAsClose(req, res) {
        try {
            const { body, user } = req;

            await this.Models.Supports.update({
                is_close: body.type,
                status: "Closed",
            },{
                where: {
                    id: body.support_ids
                }
            });

            let message = SupportMessages.SUPPORT_STATUS_CLOSE;
            if(body.type == 0) {
                message = SupportMessages.SUPPORT_STATUS_OPEN;
            }
            return res
                .status(201)
                .send(
                    successResponse(
                        message,
                        {},
                        RESPONSE_CODES.POST
                    )
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


    /** Add Support messages  */
    async addSupportMessage(req, res) {
        try {
            const { body, user, files } = req;
            body.sender_id = user.id;

            if (!body.support_id) {
                let msg = "Support id is required";
                return this.services.errorFunction(req, res, msg);
            }

            if (!body.receiver_id) {
                let msg = "Receiver id is required";
                return this.services.errorFunction(req, res, msg);
            }

            if (!body.message) {
                if(files.length == 0) {
                    let msg = "Please send at least one from message or files.";
                    return this.services.errorFunction(req, res, msg);
                }
                // let msg = "Message is required";
                // return this.services.errorFunction(req, res, msg);
            }
            const getUserDetail = await this.services.getUserDetail(body.receiver_id);
            if (!getUserDetail) {
                return res
                    .status(400)
                    .send(
                        errorResponse(
                            SupportMessages.RECEIVER_NOT_FOUND,
                            null,
                            RESPONSE_CODES.BAD_REQUEST
                        )
                    );
            }

            const createSupportMessage = await this.services.createSupportChatMessages(body);
            if (!createSupportMessage) {
                return res
                    .status(404)
                    .send(
                        errorResponse(
                            SupportMessages.SUPPORT_NOT_CREATED,
                            null,
                            RESPONSE_CODES.NOT_FOUND
                        )
                    );
            }

            if (files && files.length > 0) {
                let sendData = {
                    files,
                    id: createSupportMessage.id,
                    folder: 'Support'
                }
                const uploadedImage = await uploadFileForAll(sendData);

                if (uploadedImage.length > 0) {
                    await this.services.uploadMultipleFiles(uploadedImage, body.support_id, createSupportMessage.id)
                }
            }


            let attachement = [];
            if (files && files.length > 0) {
                for(let i in files) {
                    attachement.push({
                    filename: files[i].originalname,
                    content: files[i].buffer
                    });
                }
            }
   
            let supportDetail = await this.services.getSupportInfoBySupportId(body.support_id);
            supportDetail.created_at = supportDetail.created_at ? moment(new Date(supportDetail.created_at)).format('DD MMMM YYYY hh:mm A'): "";
            const emailTemplate = await ticketReply(supportDetail, body.message, user.role_id);
            const subject = `Support Ticket Reply: ${body.support_id}`;
            let mailFunction = (process.env.PRODUCTION == true || process.env.PRODUCTION == "true") ? nodemailer.sendinBlueMail : nodemailer.sendMail;
            let to = getUserDetail.email;
            await mailFunction(to, subject, emailTemplate, attachement);


            return res
                .status(200)
                .send(
                    successResponse(SupportMessages.SUPPORT_ADDED, createSupportMessage, RESPONSE_CODES.POST)
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


    /** Update Support Status */
    async updateSupportStatus(req, res) {
        try {
            const { body, user } = req;
            body.updated_by = user.id;
            const getSupport = await this.services.getSupportDetails(body.support_id);
            if (!getSupport) {
                return res
                    .status(404)
                    .send(
                        errorResponse(
                            SupportMessages.SUPPORT_NOT_FOUND,
                            null,
                            RESPONSE_CODES.NOT_FOUND
                        )
                    );
            }

            if(body.status == "Closed"){
                body.is_close = 1;
            }
            await this.services.updateSupport(body, body.support_id);

            body.receiver_id = user.id;
            if(user.role_id == ROLES.ADMIN) {
                body.receiver_id = getSupport.user_id;
            }
            const getUserDetail = await this.services.getUserDetail(body.receiver_id);
            if (getUserDetail) {
                let supportDetail = await this.services.getSupportInfoBySupportId(body.support_id);
                supportDetail.created_at = supportDetail.created_at ? moment(new Date(supportDetail.created_at)).format('DD MMMM YYYY hh:mm A'): "";
                supportDetail.priority = (supportDetail.priority) ? supportDetail.priority : "";
                const emailTemplate = await ticketStatus(supportDetail, body.message, user.role_id);
                const subject = `Ticket Status Update`;
                let mailFunction = (process.env.PRODUCTION == true || process.env.PRODUCTION == "true") ? nodemailer.sendinBlueMail : nodemailer.sendMail;
                let to = getUserDetail.email;
                await mailFunction(to, subject, emailTemplate);
            }


            return res.status(200).send(successResponse(SupportMessages.SUPPORT_STATUS_UPDATED, {}, RESPONSE_CODES.POST));

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
