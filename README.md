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
import CloudWatchTransport from 'winston-cloudwatch-transport';

const cloudWatchTransport = new CloudWatchTransport({
  logGroupName: 'my-log-group',
  logStreamName: new Date().toISOString().replace(/[-:]/g, '/'),
  awsCredentials: {
    accessKeyId: 'aws-access-key',
    secretAccessKey: 'aws-secret-access-key',
    region: 'us-east-1',
  },
  formatLog: (item) => item,
});

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    combineMessageAndSplat(),
    winston.format.simple(),
  ),
});

logger.add(cloudWatchTransport);
```

## Options

```ts
{
  awsCredentials: { // required
    accessKeyId: '',
    secretAccessKey: '',
    region: '',
  },

  logGroupName: '', // required
  logStreamName: '', // required

  // Should send logs to CloudWatch
  enabled: boolean
  
  // Would like to set to true if we are using serverless function to avoid request being shutdown   
  async: boolean

  // Customize log message
  formatLog: function
}
```
