import sequelize from 'sequelize';
const Op = sequelize.Op;
import { PAGINATION, RESPONSE_CODES, ROLES } from '../../../config/constants';
import path from "path";
import moment from "moment";
import { successResponse, errorResponse } from "../../../config/responseHelper";

export default class Support {
    async init(db) {
        this.Models = db.models;
    }


    /** error Function */
    errorFunction = async (req, res, msg) => {
        return res
            .status(400)
            .send(
                errorResponse(
                    msg,
                    null,
                    RESPONSE_CODES.BAD_REQUEST
                )
            );
    };

    /** create Supports */
    createSupports = async (data) => {
        return await this.Models.Supports.create(data)
    };

    /** upload Multiple Files */
    uploadMultipleFiles = async (files, supportID, chatId) => {
        let supportAttachment = [];
        if (files.length > 0) {
            for (const i in files) {
                supportAttachment.push({
                    support_id: supportID,
                    file: files[i].file_key,
                    chat_id: chatId,
                    file_type: files[i].type,
                });
            }
            return await this.Models.SupportAttachments.bulkCreate(supportAttachment);
        }
    };

    /** get support list */
    getSupportList = async (body, user, role, userDetail) => {
        let whereCondition = {
            user_id: user,
            deleted_at: null
        }
        let totalCountWhereCondition = {
            deleted_at: null,
            user_id: user,
            deleted_at: null
        };

        if (role == ROLES.ADMIN) {
            whereCondition = {
                deleted_at: null
            };
            totalCountWhereCondition = {
                deleted_at: null
            };
        }

        if (body.search && body.search != "") {
            whereCondition.subject = { [Op.like]: `%${body.search}%` };
        }

        const SupportListCount = await this.Models.Supports.count({
            where: whereCondition
        });

        const getSupportListCount = await this.Models.Supports.count({
            where: totalCountWhereCondition
        });

        const getSupportList = await this.Models.Supports.findAll({
            attributes: ["id", "user_id", "subject", "message", "status", "department_id", "priority", "is_close", "created_at", [sequelize.literal("(SELECT name FROM departments WHERE departments.id = supports.department_id limit 1)"), "Department"], 
            [sequelize.literal(
                "(SELECT created_at FROM support_chat_messages WHERE support_chat_messages.support_id = supports.id ORDER BY support_chat_messages.id DESC LIMIT 1)"
              ),"last_reply"
            ]],
            where: whereCondition,
            offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
            limit: (body.limit == -1) ? SupportListCount : parseInt(body.limit) || PAGINATION.LIMIT,
            order: [
                ['id', 'DESC'],
            ],
            raw: true
        })

        return { list: getSupportList, total_records: SupportListCount, filtered_records: getSupportList.length, total_count: getSupportListCount }
    }

    /** get support detail */
    getSupportDetails = async (supportID) => {
        return await this.Models.Supports.findOne({
            attributes: ["id", "user_id", "subject", "message", "department_id", "priority", "status", "is_close", "created_at", [sequelize.literal("(SELECT name FROM departments WHERE departments.id = supports.department_id limit 1)"), "Department"],[sequelize.literal("(SELECT concat(first_name, ' ', last_name) FROM users WHERE users.id = supports.user_id limit 1)"), "user_name"],[sequelize.literal("(SELECT user_image FROM users WHERE users.id = supports.user_id limit 1)"), "user_image"]],
            include: [
                {
                    attributes: ["id", "file", "file_type", "deleted_at"],
                    model: this.Models.SupportAttachments,
                    as: "Support_Attachments_details",
                    where: { 
                        deleted_at: null,
                        chat_id: null
                    },
                    required: false,
                },
                {
                    model: this.Models.SupportChatMessages,
                    attributes: { include:[[sequelize.literal("(SELECT concat(first_name, ' ', last_name) FROM users WHERE users.id = sender_id limit 1)"), "sender_name"],[sequelize.literal("(SELECT user_image FROM users WHERE users.id = sender_id limit 1)"), "sender_image"],[sequelize.literal("(SELECT concat(first_name, ' ', last_name) FROM users WHERE users.id = receiver_id limit 1)"), "receiver_name"],[sequelize.literal("(SELECT user_image FROM users WHERE users.id = receiver_id limit 1)"), "receiver_image"]]},
                    as: "support_chat",
                    required: false,
                    where: { 
                        deleted_at: null,
                    },
                    separate: true,
                    order: [["id", "ASC"]],
                    include: [
                        {
                            model: this.Models.SupportAttachments,
                            as: "support_chat_attachments",
                            where: { 
                                deleted_at: null,
                                chat_id: {
                                    [Op.ne]: null
                                },
                            },
                            required: false,
                        }
                    ]
                }
            ],
            where: {
                id: supportID,
                deleted_at: null
            },
        });
    };

    /** delete Support*/
    deleteSupport = async (data, supportID) => {
        return await this.Models.Supports.update(data, {
            where: {
                id: supportID,
                deleted_at: null
            }
        })
    };

    /** delete Support Files*/
    deleteSupportFiles = async (data, supportID) => {
        return await this.Models.SupportAttachments.update(data, {
            where: {
                support_id: supportID,
            }
        })
    };


    /** delete Support attachment*/
    deleteSupportAttachment = async (data, attachmentId) => {
        return await this.Models.SupportAttachments.update(data, {
            where: {
                id: attachmentId,
            }
        })
    };

    /** update Support detail*/
    updateSupport = async (data, supportId) => {
        return await this.Models.Supports.update(data, {
            where: {
                id: supportId,
            }
        })
    };

    /** get Support Files*/
    getFileKeys = async (supportID) => {
        return await this.Models.SupportAttachments.findAll({
            attributes: ["file", "deleted_at"],
            where: {
                support_id: supportID,
                deleted_at: null
            },
            raw: true
        })
    };

    /** Get support attachment */
    getSupportAttachment = async (attachmentId) => {
        return await this.Models.SupportAttachments.findOne({
            attributes: ["id", "file", "deleted_at"],
            where: {
                id: attachmentId,
                deleted_at: null
            },
            raw: true
        });
    };


    /** create department*/
    createDepartment = async (data) => {
        return await this.Models.Departments.create(data)
    };

    /** get department name*/
    getDepartmentByName = async (departmentName) => {
        return await this.Models.Departments.findOne({
            where: {
                name: departmentName,
                deleted_at: null
            },
            raw: true
        });
    };


    /** get department list*/
    getDepartmentList = async (body) => {
        let whereCondition = {
            deleted_at: null
        }

        if (body.search) {
            whereCondition = {
                name: { [Op.like]: `%${body.search}%` },
                deleted_at: null
            }
        }

        const getDepartmentCount = await this.Models.Departments.count({
            where: whereCondition
        });

        const DepartmentCount = await this.Models.Departments.count({
            where: {
                deleted_at: null

            }
        });

        const getDepartmentList = await this.Models.Departments.findAll({
            where: whereCondition,
            offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
            limit: (body.limit == -1) ? getDepartmentCount : parseInt(body.limit) || PAGINATION.LIMIT,
            order: [
                ['id', 'DESC'],
            ],
            raw: true
        })

        return { list: getDepartmentList, total_records: getDepartmentCount, filtered_records: getDepartmentList.length, total_count: DepartmentCount }
    };

    /** get department detail*/
    getDepartmentDetails = async (departmentId) => {
        return await this.Models.Departments.findOne({
            where: {
                id: departmentId,
                deleted_at: null
            },
            raw: true
        })
    };

    /** update department detail*/
    updateDepartment = async (data, departmentId) => {
        return await this.Models.Departments.update(data, {
            where: {
                id: departmentId,
            }
        })
    };


    /** get department name or ID*/
    getDepartmentByNameOrId = async (departmentName, departmentId) => {
        return await this.Models.Departments.findOne({
            where: {
                id: {
                    [Op.ne]: departmentId
                },
                name: departmentName,
                deleted_at: null
            },
            raw: true
        });
    };


    /** Get User role list */
    getUserRoles = async (body) => {
        let whereCondition = {
            parent_role_id: ROLES.USER
        }
        const getRoles = await this.Models.Roles.findAll({
            where: whereCondition,
            order: [
                ['id', 'ASC'],
            ],
            raw: true
        })

        return { list: getRoles, total_records: getRoles.length, filtered_records: getRoles.length }
    };

    // get AccountManager ClientIds function
    getAccountManagerClientIds = async (account_manager_id) => {
        return await this.Models.AssignedUsers.findAll({
            attributes: ["id", "account_manager_id", "user_id", "deleted_at"],
            where: {
                account_manager_id: account_manager_id,
                deleted_at: null
            },
            raw: true
        })
    };

    // get User ClientIds function
    getUserClientIds = async (user) => {
        return await this.Models.Users.findAll({
            attributes: ["added_by"],
            where: {
                id: user,
                deleted_at: null
            },
            raw: true
        })
    };

    // create Keyword function
    createKeyword = async (data) => {
        return await this.Models.Keywords.create(data)
    };

    // keyword List function
    keywordList = async (body) => {

        const getKeywordsCount = await this.Models.Keywords.count({
            where: {
                deleted_at: null
            }
        })

        const getKeywords = await this.Models.Keywords.findAll({
            where: {
                deleted_at: null
            },
            offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
            limit: (body.limit == -1) ? getKeywordsCount : parseInt(body.limit) || PAGINATION.LIMIT,
            order: [
                ['id', 'DESC'],
            ],
            raw: true

        })

        return { list: getKeywords, total_records: getKeywordsCount, filtered_records: getKeywords.length, total_count: getKeywordsCount }

    };

    // update Keyword function
    updateKeyword = async (body, keyword_id) => {
        return await this.Models.Keywords.update(body, {
            where: {
                id: keyword_id,
                deleted_at: null
            }
        })
    };

    // check Keyword function
    checkKeyword = async (keyword_id) => {
        return await this.Models.Keywords.findOne({
            where: {
                id: keyword_id,
                deleted_at: null
            }
        })
    };

    // create Keyword Mail function
    createKeywordMail = async (body) =>{
       return await this.Models.KeywordMails.create(body)
    };

    // create Keyword Notification Email function
    createKeywordNotificationEmail = async (body) =>{
        return await this.Models.KeywordNotificationEmails.create(body);
    };

    // Get Keyword Notification Email function
    getKeywordNotificationEmail = async (userId) =>{
        return await this.Models.KeywordNotificationEmails.findOne({
            where: {
                // added_by: userId,
                deleted_at: null
            },
            raw: true
        });
    };


    // update Keyword Notification Email function
    updateKeywordNotificationEmail = async (body) =>{
        return await this.Models.KeywordNotificationEmails.update({
            email: body.email,
        },{
            where: {
                // added_by: body.added_by
                deleted_at: null
            }
        });
    };


    // get User Detail
    getUserDetail = async (userId) => {
        return await this.Models.Users.findOne({
            attributes: ["id", "email", "deleted_at"],
            where: {
                id: userId,
                deleted_at: null
            },
            raw: true,
        });
    };


    /** Create support messages  */
    createSupportChatMessages = async (data) => {
        return await this.Models.SupportChatMessages.create(data);
    };


    /** get Support Info By Support Id */
    getSupportInfoBySupportId = async (supportId) => {
        return await this.Models.Supports.findOne({
            attributes: ["id", "user_id", "subject", "message", "department_id", "priority", "status", "is_close", "created_at", [sequelize.literal("(SELECT name FROM departments WHERE departments.id = supports.department_id limit 1)"), "Department"],[sequelize.literal("(SELECT concat(first_name, ' ', last_name) FROM users WHERE users.id = supports.user_id limit 1)"), "user_name"]],
            where: {
                id: supportId,
                deleted_at: null
            },
            raw: true
        });
    };

    /**Get Roles And Permissions by Id*/
    getAccountManagerRolePermissions = async (permissionId, Attributes) => {
        return this.Models.RolesAndPermissions.findOne({
        attributes: Attributes,
        where: {
            id: permissionId,
            deleted_at: null
        },
        raw: true
        });
    };

    getSupportByClientOrSupportId = async (supportId, clientId) => {
        return await this.Models.Supports.findOne({
            attributes: ["id", "user_id", "deleted_at"],
            where: {
                id: supportId,
                user_id: clientId,
                deleted_at: null
            },
            raw: true
        });
    };

}

