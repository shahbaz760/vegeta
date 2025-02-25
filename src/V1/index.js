import Auth from "./Auth/index";
import Client from "./Client/index";
import User from "./User/index";
import Agent from "./Agent/index";
import AccountManager from "./AccountManager/index";
import Product from "./Product/index";
import Project from "./Project/index";
import Task from "./task/index";
import Support from "./Support/index";
import Crons from "./Crons";



export default class Routes {
  constructor(router, db) {
    this.router = router;
    this.DatabaseConnect = db;
  }

  async routesRegistration() {
    this.db = await this.DatabaseConnect.getDB();

    this.auth = new Auth(this.router, this.db);
    await this.auth.routes();

    this.client = new Client(this.router, this.db);
    await this.client.routes();

    this.user = new User(this.router, this.db);
    await this.user.routes();

    this.agent = new Agent(this.router, this.db);
    await this.agent.routes();

    this.accountManager = new AccountManager(this.router, this.db);
    await this.accountManager.routes();

    this.product = new Product(this.router, this.db);
    await this.product.routes();

    this.project = new Project(this.router, this.db);
    await this.project.routes();

    this.task = new Task(this.router, this.db);
    await this.task.routes();

    this.support = new Support(this.router, this.db);
    await this.support.routes();

    
  }
}
