module.exports = function (passport) {
  const bkfd2Password = require('pbkdf2-password');
  const hasher = bkfd2Password();
  const route = require('express').Router();
  const conn = require('../mysql/db')();

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

  route.get('/login', function (req, res) {
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

  route.get('/logout', function (req, res) {
    req.logout(function (err) {
      if (err) {
        return next(err);
      }
      req.session.destroy(function (err) {
        if (err) {
          console.log(err);
          return next(err);
        }
        res.redirect('/welcome');
      });
    });
  });

  route.post('/register', function (req, res) {
    hasher({ password: req.body.password }, function (err, pass, salt, hash) {
      var user = {
        authId: 'user_' + req.body.username,
        username: req.body.username,
        password: hash,
        salt: salt,
        displayName: req.body.displayName,
      };
      var sql = 'INSERT INTO user SET ?';
      conn.query(sql, user, function (err, results) {
        if (err) {
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

  route.post(
    '/login',
    passport.authenticate('local', {
      successRedirect: '/welcome',
      failureRedirect: '/auth/login',
      failureFlash: false,
    })
  );
  return route;
};
