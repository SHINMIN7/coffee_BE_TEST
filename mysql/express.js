module.exports = function () {
  const express = require('express');
  const bodyParser = require('body-parser');
  require('dotenv').config();

  const cors = require('cors');

  const app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

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

  // CORS 미들웨어 추가
  app.use(cors(corsOptions));

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
      cookie: {
        httpOnly: true,
        sameSite: 'none', //클라이언트와 서버의 도메인이 다를 때 사용
        // maxAge: 1000000, //클라이언트 쿠키 유지 시간
        secure: false,
      },
    })
  );

  return app;
};
