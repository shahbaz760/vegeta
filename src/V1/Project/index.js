
import projectController from './project.controller';
import schemaValidator from '../helpers/schemaValidator';
import { createProject, listAllProjects, deleteProject, updateProject, createProjectColumns, listProjectsColumns, deleteColumn, updateColumn, moveColumn, createProjectDoc, createProjectWhiteBoard, addMenu, updateProjectMenu, editProjectWhiteBoard, editProjectDocument, sortDocOrBoard, sortProjects, sortProjectMenus, updateFiltervalidator } from './project.validator';
import { getAccessRoles } from '../helpers/commonFunction';
import Authorization from '../helpers/authorization';

export default class Project {
    constructor(router, db) {
        this.authorization = new Authorization();
        this.router = router;
        this.db = db;
        this.projectInstance = new projectController()
    }
    async routes() {
        await this.projectInstance.init(this.db)
        await this.authorization.init(this.db);

        let userAccess = await getAccessRoles(this.db);

        /** add Project */
        this.router.post('/project/add', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.User]), schemaValidator(createProject), (req, res) => {
            this.projectInstance.addProject(req, res)
        });

        /** list all projects */
        this.router.post('/project/list', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.User, userAccess.Agent]), schemaValidator(listAllProjects), (req, res) => {
            this.projectInstance.projectList(req, res)
        });

        /** project delete */
        this.router.delete('/project/delete', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.User]), schemaValidator(deleteProject), (req, res) => {
            this.projectInstance.projectDelete(req, res)
        });

        /** project update  */
        this.router.put('/project/update/:project_id', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.User]), schemaValidator(updateProject), (req, res) => {
            this.projectInstance.projectUpdate(req, res)
        });

        /** details of projects */
        this.router.get('/project/detail/:project_id', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.User]), (req, res) => {
            this.projectInstance.projectDetail(req, res)
        });

         /** add Project Column */
         this.router.post('/project/column/add', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.User, userAccess.Agent]), schemaValidator(createProjectColumns), (req, res) => {
            this.projectInstance.addColumns(req, res)
        });

       
        /** list all projects Columns */
        this.router.post('/project/columns/list', await this.authorization.authorize([userAccess.Client, userAccess.Agent, userAccess.User]), schemaValidator(listProjectsColumns), (req, res) => {
            this.projectInstance.projectColumnsList(req, res)
        });


        /** project column delete */
        this.router.delete('/column/delete/:column_id', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.User, userAccess.Agent]), schemaValidator(deleteColumn), (req, res) => {
            this.projectInstance.projectColumnDelete(req, res)
        });

        /** column update  */
        this.router.put('/column/update/:column_id', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.User, userAccess.Agent]), schemaValidator(updateColumn), (req, res) => {
            this.projectInstance.columnUpdate(req, res)
        });

        /** details of column */
        this.router.get('/project/column/detail/:column_id', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.User, userAccess.Agent]), (req, res) => {
            this.projectInstance.ColumnDetail(req, res)
        });

        /** column move left-right */
        this.router.post('/project/column-move', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.Agent, userAccess.User]), schemaValidator(moveColumn), (req, res) => {
            this.projectInstance.columnMove(req, res)
        });

        /** list all projects Columns */
        this.router.get('/project/columns/task-status/:project_id', await this.authorization.authorize([userAccess.Client, userAccess.Agent, userAccess.User]), (req, res) => {
            this.projectInstance.ColumnTaskStatus(req, res)
        });

          /** add Project Whiteboard */
          this.router.post('/project/WhiteBoard/add', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.User, userAccess.Agent]), schemaValidator(createProjectWhiteBoard), (req, res) => {
            this.projectInstance.addWhiteBoard(req, res)
        })

           /** add Project Document */
        this.router.post('/project/document/add', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.User, userAccess.Agent]), schemaValidator(createProjectDoc), (req, res) => {
            this.projectInstance.addProjectDoc(req, res)
        })

           /** get Project Document */
           this.router.get('/project/document/get/:project_menu_id', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.Agent, userAccess.User]), (req, res) => {
            this.projectInstance.getDocument(req, res)
        })

        /** get Project Document */
        this.router.get('/project/whiteboard/get/:project_menu_id', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.Agent, userAccess.User]), (req, res) => {
            this.projectInstance.getWhiteboard(req, res)
        })


        /** get assigned user ids acc. to auth token  */
        this.router.get('/project/assigned-userIds/:project_id', await this.authorization.authorize([userAccess.Admin, userAccess.Agent, userAccess.Client,userAccess.AccountManager,userAccess.User]), (req, res) => {
            this.projectInstance.getAssignedUserIds(req, res)
        });

        /** get assigned user ids acc. to auth token  */
        this.router.post('/project/enable-menu', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.User, userAccess.Agent]), schemaValidator(addMenu), (req, res) => {
            this.projectInstance.enable_menu(req, res)
        });

        /** get project menu list  */
        this.router.get('/project/menu-list/:project_id', await this.authorization.authorize([userAccess.Agent, userAccess.Client, userAccess.User]), (req, res) => {
            this.projectInstance.projectMenuList(req, res)
        });


        /** get project menu detail by uuid  */
        this.router.get('/project-menu/detail/:uuid', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.User, userAccess.Agent]), (req, res) => {
            this.projectInstance.projectMenuDetail(req, res)
        });

        /** update project menu name  */
        this.router.put('/project-menu/update', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.User, userAccess.Agent]), schemaValidator(updateProjectMenu), (req, res) => {
            this.projectInstance.projectMenuUpdate(req, res)
        });


        this.router.get('/project/filter-drop-down/:project_id/:key', await this.authorization.authorize([userAccess.Agent, userAccess.Client, userAccess.User]), (req, res) => {
            this.projectInstance.projectFilterDropDown(req, res)
        });


        /** Project Whiteboard list*/
        this.router.get('/project/WhiteBoard/list/:project_id', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.Agent, userAccess.User]), (req, res) => {
            this.projectInstance.getProjectWhiteBoardList(req, res)
        });

        /** edit Project Whiteboard */
        this.router.put('/project/WhiteBoard/edit', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.User, userAccess.Agent]), schemaValidator(editProjectWhiteBoard), (req, res) => {
            this.projectInstance.editProjectWhiteBoard(req, res)
        });

        /** delete Project Whiteboard */
        this.router.delete('/project/WhiteBoard/delete/:white_board_id', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.User, userAccess.Agent]), (req, res) => {
            this.projectInstance.deleteProjectWhiteBoard(req, res)
        });


        /** edit Project document */
        this.router.put('/project/document/edit', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.User, userAccess.Agent]), schemaValidator(editProjectDocument), (req, res) => {
            this.projectInstance.editProjectDocument(req, res)
        });


        /** Project document list*/
        this.router.get('/project/document/list/:project_id', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.Agent, userAccess.User]), (req, res) => {
            this.projectInstance.getProjectDocumentList(req, res)
        });

        /** delete Project document */
        this.router.delete('/project/document/delete/:document_id', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.User, userAccess.Agent]), (req, res) => {
            this.projectInstance.deleteProjectDocument(req, res)
        });


        /** sort project document or whiteboard */
        this.router.post('/project/sort-document-whiteboard', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.Agent, userAccess.User]), schemaValidator(sortDocOrBoard), (req, res) => {
            this.projectInstance.sortProjectDocWhiteBoard(req, res)
        });


        /** sort projects */
        this.router.post('/project/sorting', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.Agent, userAccess.User]), schemaValidator(sortProjects), (req, res) => {
            this.projectInstance.dragDropProjects(req, res)
        });


        /** sort projects */
        this.router.post('/project/menu-sorting', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.Agent, userAccess.User]), schemaValidator(sortProjectMenus), (req, res) => {
            this.projectInstance.dragDropProjectMenus(req, res)
        });


        /** project menu delete by menu id  */
        this.router.delete('/project-menu/delete/:uuid', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.User, userAccess.Agent]), (req, res) => {
            this.projectInstance.deleteProjectMenu(req, res)
        });


        /** pin project menu  */
        this.router.get('/project-menu/pin/:uuid', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.User, userAccess.Agent]), (req, res) => {
            this.projectInstance.pinProjectMenu(req, res)
        });


        this.router.get('/project/get-saved-filters/:project_id/:is_view', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.User, userAccess.Agent]), (req, res) => {
            this.projectInstance.getSavedFilters(req, res)
        });


        this.router.delete('/project/delete-filters/:filter_id', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.User, userAccess.Agent]), (req, res) => {
            this.projectInstance.deleteFilter(req, res)
        });

        this.router.put('/project/update-filters', await this.authorization.authorize([userAccess.Admin, userAccess.Client, userAccess.User, userAccess.Agent]), schemaValidator(updateFiltervalidator), (req, res) => {
            this.projectInstance.updateFilter(req, res)
        });
        
    }
}


