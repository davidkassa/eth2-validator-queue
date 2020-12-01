import * as functions from "firebase-functions";

class Config {
  public INFURA_ETH2_ENDPOINT;
  public INFURA_PROJECT_ID;
  public INFURA_PROJECT_SECRET;
  public NETWORK;
  constructor() {
    this.INFURA_ETH2_ENDPOINT = functions.config().eth2_validator_queue.infura_eth2_endpoint;
    this.INFURA_PROJECT_ID = functions.config().eth2_validator_queue.infura_project_id;
    this.INFURA_PROJECT_SECRET = functions.config().eth2_validator_queue.infura_project_secret;
    this.NETWORK = functions.config().eth2_validator_queue.network;
  }
}

export default new Config();
