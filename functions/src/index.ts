import * as functions from "firebase-functions";
import ValidatorQueueService from "./ValidatorQueueService";

exports.validatorQueue = functions.runWith({timeoutSeconds: 60}).https.onRequest(
  async (request, response) => {
    functions.logger.info("validatorQueue", { structuredData: true });
    const service = new ValidatorQueueService();
    const validatorQueue = await service.getValidatorQueue();
    response.set("Cache-Control", "public");
    response.set("Access-Control-Allow-Origin", "*");
    response.send({ ...validatorQueue });
  }
);
