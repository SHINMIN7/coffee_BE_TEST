module.exports = function (passport) {
  const bkfd2Password = require('pbkdf2-password');
  const hasher = bkfd2Password();
  const { isLoggedIn, isNotLoggedIn } = require('./middlewares'); // 사용자 미들웨어
  const route = require('express').Router();
  const conn = require('../mysql/db')();

  // route.get('/test', function (req, res) {
  //   if (req.isAuthenticated()) {
  //     res.redirect('/welcome');
  //   } else {
  //     res.redirect('/login');
  //   }
  // });

  route.get('/register', function (req, res) {
    var output = `
  <h1>Register</h1>
  <form action="/auth/register" method="post">
    <p>
      <input id="username" name="username" type="text" placeholder="username" required autofocus>
    </p>
    <p>
      <input id="current-password" name="password" type="password" placeholder="password" required>
    </p>
    <p>
      <input id="displayName" name="displayName" type="text" placeholder="Display Name" required>
    </p>
    <p>
      <input type="submit">Sign in</input>
    </p>  
  </form>
  `;
    res.send(output);
  });

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
            req.session.save(function () {
              res.redirect('/welcome');
            });
          });
        }
      });
    });
  });

  //로그인하지 않은 사용자만 http:localhost:8000/auth/login에 접속 가능하다.
  route.get('/login', isNotLoggedIn, function (req, res) {
    var output = `
  <h1>Login</h1>
  <form action="/auth/login" method="post">
    <p>
      <input id="username" name="username" type="text" placeholder="username" required autofocus>
    </p>
    <p>
      <input id="current-password" name="password" type="password" placeholder="password" required>
    </p>
    <p>
      <input type="submit">Login</input>
    </p>  
  </form>
  `;
    res.send(output);
  });

  //로그인하지 않은 사용자만 http:localhost:8000/auth/login에 접속 가능하다.
  route.post(
    '/login',
    isNotLoggedIn,
    passport.authenticate('local', {
      successRedirect: '/welcome',
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
