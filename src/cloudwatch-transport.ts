import TransportStream, { type TransportStreamOptions } from 'winston-transport';

interface CloudwatchTransportOptions extends TransportStreamOptions {
  enabled?: boolean;
}

class CloudwatchTransport extends TransportStream {
  constructor(opts: CloudwatchTransportOptions) {
    super(opts);
  }

  override log(info: unknown, callback: Function) {
    callback();
    // Avoid serverless shutdown
    // setTimeout(() => {
    //   callback();
    // }, 2_500);
  }
}

export default CloudwatchTransport;
