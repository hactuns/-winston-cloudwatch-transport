# `Winston Cloudwatch Transport`

Amazon Cloudwatch Transporter logs for [Winston](https://github.com/winstonjs/winston)

## Features

- Tries very hard to deliver messages, even in case of errors
- Does not fail or break when losing internet connection
- Follows [AWS strict logging rules](https://docs.aws.amazon.com/AmazonCloudWatchLogs/latest/APIReference/API_PutLogEvents.html)
- Truncates long messages (handling UTF-8 characters correctly)
- Passes actual log timestamps to CloudWatch
- Cleans up resources when Winston closes the Transport
- Auto-creates log group and stream
- Lightweight AWS requester

## Usage

```ts
import { createLogger } from 'winston';
import CloudWatchTransport from 'winston-cloudwatch-transport';

const Logger = createLogger({
  ...,
  transports: [
    new CloudwatchTransport({
      logGroupName: 'log-group-name',
      logStreamName: 'log-stream-name',
      awsCredentials: {
        accessKeyId: 'aws-access-key',
        secretAccessKey: 'aws-access-key',
        region: 'aws-region',
      },
      enabled: String(process.env.NODE_ENV) === 'dev', // example
    })
  ]
});
```

## Options

```json
{
  awsCredentials: { // required
    accessKeyId: '',
    secretAccessKey: '',
    region: '',
  },

  logGroupName: '', // required
  logStreamName: '', // required

  // Should send logs to CloudWatch. Default set to true
  enabled: boolean

  // Would like to set to true if we are using serverless function to avoid request being shutdown. Default set to false
  async: boolean

  // Customize log message
  formatLog: function
}
```
