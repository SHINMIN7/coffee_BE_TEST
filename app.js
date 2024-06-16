const app = require('./mysql/express')();
const port = 8000;

// const awsIoT = require('aws-iot-device-sdk');
// const AWS_IOT_HOST = process.env.AWS_IOT_HOST;
// const AWS_CLIENT_ID = process.env.AWS_CLIENT_ID;

// const device = awsIoT.device({
//   keyPath: 'resources/private.pem.key',
//   certPath: 'resources/certificate.pem.crt',
//   caPath: 'resources/AmazonRootCA1.pem',
//   clientId: AWS_CLIENT_ID,
//   host: AWS_IOT_HOST,
//   keepalive: 10,
// });

// device.on('connect', (connect) => {
//   console.log('Connected to AWS IoT');
// });

// device.on('message', (topic, payload) => {
//   console.log('Message received', topic, payload.toString());
// });

const passport = require('./mysql/passport')(app);
const auth = require('./routes/auth')(passport);
const recipe = require('./routes/recipe')(passport);
const mypage = require('./routes/mypage')(passport);

app.use('/auth/', auth);
app.use(recipe);
app.use(mypage);

app.listen(port, function () {
  console.log(`Server running at http://localhost:${port}`);
});
