import ValidatorQueue from "./ValidatorQueue";
import EthereumService from "./EthereumService";

export default class ValidatorQueueService {
  private validatorQueue;
  private ethereumService;

  constructor(ethereumService = new EthereumService(), validatorQueue = null) {
    this.ethereumService = ethereumService;
    this.validatorQueue = validatorQueue;
  }

  public async getValidatorQueue() {
    if (this.validatorQueue === null) {
      const length = await this.ethereumService.calculateValidatorQueueLength();
      const duration = await this.ethereumService.calculateValidatorQueueDuration();
      this.validatorQueue = new ValidatorQueue(length, duration);
    }

    return this.validatorQueue;
  }
}
