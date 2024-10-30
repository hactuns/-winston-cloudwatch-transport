import TransportStream, { type TransportStreamOptions } from 'winston-transport';
import CloudwatchClient, { type CloudwatchClientOptions } from './cloudwatch-client.js';

interface CloudwatchTransportOptions extends CloudwatchClientOptions {
  enabled?: boolean;
  winston?: TransportStreamOptions;
  formatLog?: (info: Record<string, unknown>) => string;
}

class CloudwatchTransport extends TransportStream {
  private client: CloudwatchClient;
  private enabled?: boolean = false;
  private formatLog?: CloudwatchTransportOptions['formatLog'];

  constructor(opts: CloudwatchTransportOptions) {
    super(opts.winston);
    this.enabled = opts.enabled;
    this.formatLog = opts.formatLog;
    this.client = new CloudwatchClient(opts);
    this.client.initLogStream();
  }

  override log(info: { level: string; message: string }, callback: Function) {
    const { level, message, ...rest } = info;

    const meta = Object.assign({}, rest);

    const logMsg =
      typeof this.formatLog === 'function'
        ? this.formatLog(info)
        : `[${String(level).toUpperCase()}]: ${message} - ${JSON.stringify(meta)}`;

    this.client.submitLog(logMsg).finally(() => {
      if (this.enabled) {
        callback();
      }
    });

    if (!this.enabled) {
      // // Avoid serverless shutdown
      setTimeout(() => {
        callback();
      }, 2_500);
    }
  }
}

export default CloudwatchTransport;
