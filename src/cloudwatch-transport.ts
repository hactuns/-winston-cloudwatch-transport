import TransportStream, { type TransportStreamOptions } from 'winston-transport';
import CloudwatchClient, { type CloudwatchClientOptions } from './cloudwatch-client.js';

interface CloudwatchTransportOptions extends CloudwatchClientOptions {
  enabled?: boolean;
  winston?: TransportStreamOptions;
  async?: boolean;
  formatLog?: (info: Record<string, unknown>) => string;
}

class CloudwatchTransport extends TransportStream {
  private client: CloudwatchClient;
  private enabled?: boolean = false;
  private async?: boolean = false;
  private formatLog?: CloudwatchTransportOptions['formatLog'];

  constructor(opts: CloudwatchTransportOptions) {
    super(opts.winston);
    this.enabled = opts.enabled;
    this.async = opts.async;
    this.formatLog = opts.formatLog;
    this.client = new CloudwatchClient(opts);
    this.client.initLogStream();
  }

  override log(info: { level: string; message: string }, callback: Function) {
    if (!this.enabled) {
      return;
    }

    const { level, message, ...rest } = info;

    const meta = Object.assign({}, rest);

    const logMsg =
      typeof this.formatLog === 'function'
        ? this.formatLog(info)
        : `[${String(level).toUpperCase()}]: ${message} - ${JSON.stringify(meta)}`;

    this.client.submitLog(logMsg).finally(() => {
      if (this.async) {
        callback();
      }
    });

    if (!this.async) {
      // // Avoid serverless shutdown
      setTimeout(() => {
        callback();
      }, 2_500);
    }
  }
}

export default CloudwatchTransport;
