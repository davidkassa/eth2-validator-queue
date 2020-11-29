import * as functions from "firebase-functions";

class Config {
  public NETWORK;
  public INFURA_PROJECT_ID;
  constructor() {
    this.NETWORK = functions.config().eth2_validator_queue.network;
    this.INFURA_PROJECT_ID = functions.config().eth2_validator_queue.infura_project_id;
  }
}

export default new Config();
