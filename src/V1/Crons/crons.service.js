export default class Crons {
  async init(db) {
    this.Models = db.models;
  }

  /** update subscription status */
  updateSubscription = async (data, subscriptionId) => {
    return await this.Models.ClientSubscriptions.update(data, {
      where: {
        id: subscriptionId
      }
    });
  };
  
}
