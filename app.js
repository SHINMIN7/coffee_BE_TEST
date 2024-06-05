const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const cors = require('cors');
const port = 8000;

const awsIoT = require('aws-iot-device-sdk');
const AWS_IOT_HOST = process.env.AWS_IOT_HOST;
const AWS_CLIENT_ID = process.env.AWS_CLIENT_ID;

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//passport 설정

const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const MYSQL_HOST = process.env.MYSQL_HOST;
const MYSQL_USER = process.env.MYSQL_USER;
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD;
const MYSQL_DB = process.env.MYSQL_DB;

const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
};
//passport 세션 설정
app.use(
  session({
    secret: 'qenjwnefwefbwefjewjfw@!3f2r#R@$#$',
    resave: false,
    saveUninitialized: true,
    store: new MySQLStore({
      host: MYSQL_HOST,
      port: 3306,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DB,
    }),
    // cookie: {
    //   httpOnly: true,
    //   sameSite: 'none', //클라이언트와 서버의 도메인이 다를 때 사용
    //   // maxAge: 1000000, //클라이언트 쿠키 유지 시간
    //   secure: true,
    // },
  })
);

const passport = require('./mysql/passport')(app);
const auth = require('./routes/auth')(passport);
const recipe = require('./routes/recipe')(passport);

// CORS 미들웨어 추가
app.use(cors(corsOptions));
app.use('/auth/', auth);
app.use(recipe);

const device = awsIoT.device({
  keyPath: 'resources/private.pem.key',
  certPath: 'resources/certificate.pem.crt',
  caPath: 'resources/AmazonRootCA1.pem',
  clientId: AWS_CLIENT_ID,
  host: AWS_IOT_HOST,
  keepalive: 10,
});

device.on('connect', (connect) => {
  console.log('Connected to AWS IoT');
});

device.on('message', (topic, payload) => {
  console.log('Message received', topic, payload.toString());
});

app.get('/welcome', function (req, res) {
  if (req.user && req.user.displayName) {
    //userName?
    res.send(`
    <h1>Hello, ${req.user.displayName}</h1>
    <a href="/auth/logout">logout</a>
    `);
  } else {
    res.send(`
    <h1>Welcome</h1>
    <ul>
      <li><a href="/auth/login">Login</a><li>
      <li><a href="/auth/register">Register</a><li>
    </ul>
    `);
  }
});

app.listen(port, function () {
  console.log(`Server running at http://localhost:${port}`);
});
