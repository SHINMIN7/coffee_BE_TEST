module.exports = function () {
  const mysql = require('mysql');
  require('dotenv').config();
  const MYSQL_HOST = process.env.MYSQL_HOST;
  const MYSQL_USER = process.env.MYSQL_USER;
  const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD;
  const MYSQL_DB = process.env.MYSQL_DB;

  const conn = mysql.createConnection({
    host: MYSQL_HOST,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DB,
    timezone: 'Asia/Seoul', // 타임존 설정
    port: 3306,
  });

  conn.connect();
  return conn;
};
