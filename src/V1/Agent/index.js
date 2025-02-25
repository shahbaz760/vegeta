
import multer from "multer";
import agentController from './agent.controller';
import schemaValidator from '../helpers/schemaValidator';
import { createAgent, listAllAgents, createAgentGroup, AgentGroupList, AddMemberInAgentGroup, editAgentGroup, DeleteAgentGroup, DeleteAgentAttachment, agentApproveRejectVaidator, DeleteAgentGroupMember, listAllAssignedClients, addNoteVaidator, listAllAgentNotes, editNoteVaidator } from './agent.validator';
import { getAccessRoles } from '../helpers/commonFunction';
import Authorization from '../helpers/authorization';

import { S3Client } from '@aws-sdk/client-s3';
const s3 = new S3Client({ region: process.env.AWS_REGION });

  const upload = multer({ 
    storage: multer.memoryStorage({
        limits: { fileSize: 50 * 1024 * 1024 },
    }),
    s3: s3,
 });

export default class Agent {
    constructor(router, db) {
        this.authorization = new Authorization();
        this.router = router;
        this.db = db;
        this.agentInstance = new agentController()
    }
    async routes() {
        await this.agentInstance.init(this.db)
        await this.authorization.init(this.db);

        let userAccess = await getAccessRoles(this.db);

        const uploadFields = upload.fields([
            { name: 'files', maxCount: 10 }, // Adjust the maxCount as needed
            { name: 'profile_picture', maxCount: 1 } // Typically only one profile picture
        ]);

        const uploadKycFile = upload.fields([
            { name: 'front_id', maxCount: 1 }, // Adjust the maxCount as needed
            { name: 'back_id', maxCount: 1 } // Typically only one profile picture
        ]);


        const updateKycFiles = upload.fields([
            { name: 'front_id', maxCount: 1 }, // Adjust the maxCount as needed
            { name: 'back_id', maxCount: 1 }, // Typically only one profile picture
            { name: 'captured_pic', maxCount: 1 } // Typically only one profile picture
        ]);

        /** add Agent */
        this.router.post('/agent/add', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]),  uploadFields, (req, res) => {
            this.agentInstance.addAgent(req, res)
        });
        
        /** get Agent detail by clientId*/
        this.router.post('/agent/detail/:agent_id', await this.authorization.authorize([userAccess.Admin,userAccess.Client, userAccess.AccountManager]), (req, res) => {
            this.agentInstance.getAgent(req, res)
        });

        /** list all agents */
        this.router.post('/agent/list', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.AccountManager]), schemaValidator(listAllAgents), (req, res) => {
            this.agentInstance.agentList(req, res)
        });


        /** add Agent Group */
        this.router.post('/agent-group/add', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(createAgentGroup), (req, res) => {
            this.agentInstance.addAgentGroup(req, res)
        });

        /** list all Agent Groups */
        this.router.post('/agent-group/list', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(AgentGroupList), (req, res) => {
            this.agentInstance.agentGroupList(req, res)
        });

        /** add Members in Agent Group */
        this.router.post('/agent-group/addMember', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(AddMemberInAgentGroup), (req, res) => {
            this.agentInstance.addMemberInAgentGroup(req, res)
        });

        /** edit Agent Group */
        this.router.put('/agent-group/edit', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(editAgentGroup), (req, res) => {
            this.agentInstance.editAgentGroup(req, res)
        });
        
        /** delete Agent Group */
        this.router.post('/agent-group/delete', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(DeleteAgentGroup), (req, res) => {
            this.agentInstance.deleteAgentGroup(req, res)
        });

        /** get Agent Group */
        this.router.get('/agent-group/:group_id', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), (req, res) => {
            this.agentInstance.agentGroupDetail(req, res)
        });


        /** upload attachments */
        this.router.post('/agent/upload-attachments', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]),  upload.array('files'), (req, res) => {
            this.agentInstance.uploadAttachments(req, res)
        });


        /** delete Agent attachment */
        this.router.post('/agent/delete-attachment', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(DeleteAgentAttachment), (req, res) => {
            this.agentInstance.deleteAgentAttachment(req, res)
        });


        /** edit Agent */
        this.router.put('/agent/edit', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), upload.array('profile_picture'), (req, res) => {
            this.agentInstance.editAgent(req, res)
        });

        /** delete Agent Group member */
        this.router.post('/agent-group-member/delete', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(DeleteAgentGroupMember), (req, res) => {
            this.agentInstance.deleteAgentGroupMember(req, res)
        });

         /** get Agent Group members listing */
         this.router.post('/agent-group-members', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), (req, res) => {
            this.agentInstance.agentGroupMemeberList(req, res)
        });



    /** Agent Client side Apis */

        /** upload KYC */
        this.router.post('/agent/upload-kyc', await this.authorization.authorize([userAccess.Agent]),  uploadKycFile, (req, res) => {
            this.agentInstance.uploadKyc(req, res)
        });

        /** upload KYC */
        this.router.post('/agent/capture-image', await this.authorization.authorize([userAccess.Agent]),  upload.array('files'), (req, res) => {
            this.agentInstance.uploadCaptureImage(req, res)
        });


        /** Docusign completed callback result */
        this.router.get('/agent-docusign-completed/:agent_id', (req, res) => {
            this.agentInstance.docusignCompleted(req, res)
        });

        /** get assigned user ids acc. to auth token  */
        this.router.get('/get-assigned-userIds', await this.authorization.authorize([userAccess.Agent, userAccess.Client, userAccess.AccountManager, userAccess.User]), (req, res) => {
            this.agentInstance.getAssignedUserIds(req, res)
        });


        /** complete profile  */
        this.router.get('/agent/complete-profile', await this.authorization.authorize([userAccess.Agent]), (req, res) => {
            this.agentInstance.completeProfile(req, res)
        });



        /** list all assigned clients */
        this.router.post('/agent/assigned-client-list', await this.authorization.authorize([userAccess.Admin, userAccess.Agent, userAccess.AccountManager]), schemaValidator(listAllAssignedClients), (req, res) => {
            this.agentInstance.assignedClientList(req, res)
        });


        /** recent Activity List */
        this.router.get('/agent/recent-activity', await this.authorization.authorize([userAccess.Agent]), (req, res) => {
        this.agentInstance.recentActivityListForAgent(req, res)
        });


        /** agent profile aprove reject */
        this.router.post('/agent/approve-reject', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(agentApproveRejectVaidator), (req, res) => {
            this.agentInstance.agentApproveReject(req, res)
        });


        /** update KYC detail*/
        this.router.post('/agent/update-kyc-detail', await this.authorization.authorize([userAccess.Agent]),  updateKycFiles, (req, res) => {
            this.agentInstance.updateKycDetail(req, res)
        });


        /** add Note For Agent */
        this.router.post('/agent/add-note', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(addNoteVaidator), (req, res) => {
            this.agentInstance.addNoteForAgent(req, res)
        });


        /** get Notes of Agent */
        this.router.post('/agent/get-notes', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(listAllAgentNotes), (req, res) => {
            this.agentInstance.getNotesOFAgent(req, res)
        });
        

        /** edit Note For Agent */
        this.router.put('/agent/edit-note/:note_id', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(editNoteVaidator), (req, res) => {
            this.agentInstance.editNoteForAgent(req, res)
        });

        /** delete Note For Agent */
        this.router.delete('/agent/delete-note/:note_id', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), (req, res) => {
            this.agentInstance.deleteNoteForAgent(req, res)
        });

    }
}


