import { SharedArray } from "k6/data";
import { scenario } from "k6/execution";
import { AWSConfig, SQSClient } from "https://jslib.k6.io/aws/0.11.0/sqs.js";
import { uuidv4 } from "https://jslib.k6.io/k6-utils/1.4.0/index.js";

const sqs = new SQSClient(buildAWSConfig());
const registrationQueue = `${__ENV.PROTOCOL}://sqs.${__ENV.AWS_REGION}.${__ENV.ENDPOINT}/${__ENV.AWS_ACCOUNT_ID}/${__ENV.REGISTRATION_QUEUE}`;
const infoQueue = `${__ENV.PROTOCOL}://sqs.${__ENV.AWS_REGION}.${__ENV.ENDPOINT}/${__ENV.AWS_ACCOUNT_ID}/${__ENV.INFO_QUEUE}`;

console.log("********")
console.log(registrationQueue);

console.log(__ENV)

const fakeDevices = new SharedArray("register-payload", function () {
  let devices = [];

  for (let i = 0; i < __ENV.DEVICES; i++) {
    devices.push({
      sams: [
        {
          serialNumber: uuidv4(),
          samtype: "mcos",
          version: "01.00",
          isActive: true,
        },
      ],
      hardwareSerial: uuidv4(),
      macAddress: uuidv4(),
      deviceType: "validator",
      hardwareType: "v3695",
      osVersion:
        "4.9.11-imx7-5.0-pmb-v3695-1.7-g402ea4ed-dirty #131 PREEMPT Tue Aug 2 17:34:30 -03 2022",
      isSlave: false,
    });
  }

  return devices;
});

export const options = {
  scenarios: {
    "validator-registration": {
      executor: "shared-iterations",
      vus: __ENV.DEVICES,
      iterations: fakeDevices.length,
      exec: "register",
      maxDuration: "10s",
      startTime: "0s",
    },
    "device-info": {
      executor: "constant-arrival-rate",
      preAllocatedVUs: 100,
      exec: "send_device_info",
      rate: __ENV.DEVICES,
      timeUnit: "10m",
      startTime: "10s",
      duration: "3m",
    },
  },
};

export function register() {
  const fakeDevice = fakeDevices[scenario.iterationInTest];

  sqs.sendMessage(registrationQueue, fakeDevice);
}

export function send_device_info() {
  let randomFakeDevice = fakeDevices[Math.floor(Math.random() * fakeDevices.length)];

  sqs.sendMessage(infoQueue, randomFakeDevice);
}

function buildAWSConfig() {
    // If running locally. These env vars are only required when requesting localstack
    if (__ENV.PROTOCOL && __ENV.ENDPOINT) {      
      return new AWSConfig({
        region: __ENV.AWS_REGION,
        accessKeyId: __ENV.AWS_ACCESS_KEY_ID,
        secretAccessKey: __ENV.AWS_SECRET_ACCESS_KEY,
        sessionToken: __ENV.AWS_SESSION_TOKEN,
        endpoint: `${__ENV.PROTOCOL}://${__ENV.ENDPOINT}`,
      });
    }
    else {
        return new AWSConfig({
            region: __ENV.AWS_REGION,
            accessKeyId: __ENV.AWS_ACCESS_KEY_ID,
            secretAccessKey: __ENV.AWS_SECRET_ACCESS_KEY,
            sessionToken: __ENV.AWS_SESSION_TOKEN        
          });
    
    }
}

