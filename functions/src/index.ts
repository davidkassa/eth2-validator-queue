import * as functions from "firebase-functions";
import ValidatorQueueService from "./ValidatorQueueService";


exports.validatorQueue = functions.https.onRequest(
  async (request, response) => {
    functions.logger.info("validatorQueue", { structuredData: true });
    const service = new ValidatorQueueService();
    const validatorQueue = await service.getValidatorQueue();
    response.set('Cache-Control', 'public, max-age=120, s-maxage=120');
    response.set("Access-Control-Allow-Origin", "*");
    response.send({ ...validatorQueue });
  }
);
