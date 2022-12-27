import * as functions from "firebase-functions";
import ValidatorQueueService from "./ValidatorQueueService";

exports.validatorQueue = functions
  .runWith({ memory: "1GB", timeoutSeconds: 60 })
  .https.onRequest(async (request, response) => {
    functions.logger.info("validatorQueue", { structuredData: true });
    response.set("Cache-Control", "public");
    response.set("Access-Control-Allow-Origin", "*");
    const service = new ValidatorQueueService();
    const validatorQueue = await service.getValidatorQueue();
    response.send({ ...validatorQueue });
  });
