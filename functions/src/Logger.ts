import * as functions from "firebase-functions";

class Logger {
  public debug(...args) {
    functions.logger.debug(args);
  }
  public info(...args) {
    functions.logger.info(args);
  }
  public error(...args) {
    functions.logger.error(args);
  }
  public log(...args) {
    functions.logger.log(args);
  }
  public warn(...args) {
    functions.logger.warn(args);
  }
  public write(entry: functions.logger.LogEntry) {
    functions.logger.write(entry);
  }
}

export default new Logger();
