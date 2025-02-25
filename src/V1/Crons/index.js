/* eslint-disable import/named */
import CronsController from "./crons.controller";
import Authorization from "../helpers/authorization";

export default class Locations {
  constructor(router, db) {
    this.authorization = new Authorization();
    this.router = router;
    this.db = db;
    this.cronsInstance = new CronsController();
  }

  async routes() {
    await this.cronsInstance.init(this.db);
    await this.authorization.init(this.db);
  }
}
