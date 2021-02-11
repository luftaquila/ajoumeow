import winston from 'winston'
import winstonDaily from "winston-daily-rotate-file"

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
  transports: [
    new winstonDaily({
      level: 'info',
      filename: 'logs/%DATE%.info.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: 90
    }),
    new winstonDaily({
      level: 'error',
      filename: 'logs/error/%DATE%.error.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: 90
    })
  ],
  exitOnError: false,
});

export default logger;