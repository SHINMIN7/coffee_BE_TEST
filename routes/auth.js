module.exports = function (passport) {
  const bkfd2Password = require('pbkdf2-password');
  const hasher = bkfd2Password();
  const { isLoggedIn, isNotLoggedIn } = require('./middlewares'); // 사용자 미들웨어
  const route = require('express').Router();
  const conn = require('../mysql/db')();

  route.post('/register', function (req, res) {
    hasher({ password: req.body.password }, function (err, pass, salt, hash) {
      var user = {
        authId: 'user' + req.body.username,
        username: req.body.username,
        password: hash,
        salt: salt,
        displayName: req.body.displayName,
      };
      var sql = 'INSERT INTO user SET ?';
      conn.query(sql, user, function (err, results) {
        if (err) {
          //username이 같아 authId값이 같은 사용자가 존재
          console.log(err);
          res.status(500);
        } else {
          //회원가입하고 바로 사용자를 로그인 처리
          req.login(user, function (err) {
            //라우트를 거치지 않고 passport 모듈의 login 메소드를 호출
            req.session.save(function () {
              res.redirect('/welcome');
            });
          });
        }
      });
    });
  });

  //로그인하지 않은 사용자만 http:localhost:8000/auth/login에 접속 가능하다.
  // route.post('/login', function (req, res) {
  //   var uname = req.body.username;
  //   var pwd = req.body.password;
  // })
  //와 같이 각각 req.body.username및 req.body.password을 받는다.
  route.post(
    '/login',
    isNotLoggedIn,
    passport.authenticate('local', {
      successRedirect: '/welcome', // 이 부분 맞는 라우팅으로 수정해줄 것
      failureRedirect: '/auth/login',
      failureFlash: false,
    })
  );

  //로그인한 사용자만 http:localhost:8000/auth/logout에 접속 가능하다.
  route.get('/logout', isLoggedIn, function (req, res) {
    req.logout(function (err) {
      if (err) {
        return next(err);
      }
      req.session.save(function (err) {
        if (err) {
          console.log(err);
          return next(err);
        }

        res.redirect('/welcome');
      });
    });
  });

  return route;
};
