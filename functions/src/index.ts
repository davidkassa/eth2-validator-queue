import * as functions from "firebase-functions";
import ValidatorQueueService from "./ValidatorQueueService";

const service = new ValidatorQueueService();

exports.validatorQueue = functions.https.onRequest(
  async (request, response) => {
    functions.logger.info("validatorQueue", { structuredData: true });
    const validatorQueue = await service.getValidatorQueue();
    response.send({ ...validatorQueue });
  }
);
