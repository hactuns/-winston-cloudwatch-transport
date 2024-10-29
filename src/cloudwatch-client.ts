import type { HTTPError, KyInstance } from 'ky';
import aws4, { type Request } from 'aws4';
import ky from 'ky';

interface CloudwatchClientOptions {
  readonly logGroupName: string;
  readonly logStreamName: string;
  readonly awsCredentials: {
    readonly accessKeyId: string;
    readonly secretAccessKey: string;
    readonly region: string;
  };
}

export enum CloudwatchAction {
  CreateLogStream = 'CreateLogStream',
  PutLogEvents = 'PutLogEvents',
  CreateLogGroup = 'CreateLogGroup',
}

export class CloudwatchClient implements CloudwatchClientOptions {
  private client: KyInstance;

  public readonly logGroupName: string;
  public readonly logStreamName: string;
  public readonly awsCredentials: CloudwatchClientOptions['awsCredentials'];

  private initialize = false;

  constructor(opt: CloudwatchClientOptions) {
    this.logGroupName = opt.logGroupName;
    this.logStreamName = opt.logStreamName;
    this.awsCredentials = opt.awsCredentials;

    this.initialize = false;

    this.client = ky.create({
      method: 'post',
      prefixUrl: `https://logs.${opt.awsCredentials.region}.amazonaws.com`,
      hooks: {
        beforeError: [
          async (error) => {
            error.cause = await error.response.json();

            return error;
          },
        ],
      },
    });
  }

  private getAWSRequester<T extends object | unknown = unknown>(
    action: CloudwatchAction,
    payload?: object
  ) {
    const request: Request = {
      service: 'logs',
      region: this.awsCredentials.region,
      path: `/?Action=${action}`,
      headers: {
        'X-Amz-Target': `Logs_20140328.${action}`,
        Accept: 'application/json',
        'Content-Type': 'application/x-amz-json-1.1',
      },
    };

    if (payload) {
      request.body = JSON.stringify(payload);
    }

    const signedRequest = aws4.sign(request, {
      accessKeyId: this.awsCredentials.accessKeyId,
      secretAccessKey: this.awsCredentials.secretAccessKey,
    });

    return this.client(`https://${signedRequest.hostname}${signedRequest.path}`, {
      prefixUrl: '',
      headers: signedRequest.headers as Record<string, string>,
      body: payload ? JSON.stringify(payload) : undefined,
    })
      .json<T>()
      .catch((err) => {
        throw new Error(err?.cause?.message);
      });
  }

  private async initLogStream() {
    if (this.initialize) {
      return;
    }

    return this.createLogGroup()
      .catch(() => undefined)
      .finally(() => this.createLogStream().catch(() => undefined));
  }

  createLogStream() {
    const payload = {
      logGroupName: this.logGroupName,
      logStreamName: this.logStreamName,
    };

    return this.getAWSRequester(CloudwatchAction.CreateLogStream, payload);
  }

  createLogGroup() {
    const payload = {
      logGroupName: this.logGroupName,
    };

    return this.getAWSRequester(CloudwatchAction.CreateLogGroup, payload);
  }

  async sendLog() {
    await this.initLogStream();
  }
}

export default CloudwatchClient;
