import aws4, { type Request } from 'aws4';
import type { KyInstance } from 'ky';
import ky from 'ky';

export interface CloudwatchClientOptions {
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

  private initialize = true;

  constructor(opt: CloudwatchClientOptions) {
    this.logGroupName = opt.logGroupName;
    this.logStreamName = opt.logStreamName;
    this.awsCredentials = opt.awsCredentials;

    this.initialize = true;

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

  async initLogStream() {
    if (!this.initialize) {
      return;
    }

    return this.createLogGroup()
      .catch(() => undefined)
      .finally(() =>
        this.createLogStream()
          .catch(() => undefined)
          .finally(() => {
            this.initialize = true;
          })
      );
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

  async submitLog(info: unknown) {
    await this.initLogStream();

    const payload = {
      logGroupName: this.logGroupName,
      logStreamName: this.logStreamName,
      logEvents: [
        {
          timestamp: Date.now(),
          message: info,
        },
      ],
    };

    return this.getAWSRequester(CloudwatchAction.PutLogEvents, payload).catch(() => undefined);
  }
}

export default CloudwatchClient;
