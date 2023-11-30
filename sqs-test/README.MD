# K6 SQS Load testing

This implementation contains an approach to send messages to an SQS queue and load test processes listen to them.
The test implementation contains two scenarios that send messages to different queues. Data sent to both queues are shared between the two scenarios in order reproduce more real uses cases (i.e: register and send the same information for the next queue about the same devices).


## Running the tests
Running these tests requires some orchestration of the components involved, that is why a simple `docker-compose up -d` isn't sufficient. We are using [https://www.localstack.cloud/](localstack) in order to emulate AWS SQS locally, so the queues tests will send requests against need to be create beforehand.

1. Startup localstack server
<pre>docker-compose up -d localstack</pre>


2. Check if both queues we are gonna to load test were properly created by running:
<pre>docker exec -ti localstack  /bin/bash</pre>

<pre>awslocal sqs get-queue-attributes --queue-url http://sqs.us-east-1.localstack:4566/000000000000/device_registration --attribute-names</pre>

<pre>awslocal sqs get-queue-attributes --queue-url http://sqs.us-east-1.localstack:4566/000000000000/device_info --attribute-names</pre>


3. Run test tests and watch the results
<pre>docker-compose up k6</pre>

## Parameterize the tests

These tests implemented using the K6 framework could be used to load test real AWS queues in any given environment. In order to do so, some environment variables for the K6 container needs be set:

1. ENDPOINT: The AWS endpoint that script is gonna hit
2. DEVICES: the number of the device to emulate during tests
3. AWS_ACCOUNT_ID: The account id where the test is gonna run
4. AWS_ACCESS_KEY_ID: key id to authenticate the workload
5. AWS_SECRET_ACCESS_KEY: api secret key id to authenticate the workload
6. AWS_REGION: region where the workload is gonna run
