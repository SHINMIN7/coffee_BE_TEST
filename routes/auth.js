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
  route.post('/login', isNotLoggedIn, (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: 'An error occurred', error: err });
      }
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: 'Login failed' });
      }
      req.logIn(user, (err) => {
        if (err) {
          return res
            .status(500)
            .json({ success: false, message: 'Login failed', error: err });
        }
        return res
          .status(200)
          .json({ success: true, message: 'Login successful', user });
      });
    })(req, res, next);
  });

  //로그인한 사용자만 http:localhost:8000/auth/logout에 접속 가능하다.
  // 로그아웃 라우트
  route.get('/logout', isLoggedIn, function (req, res, next) {
    req.logout(function (err) {
      if (err) {
        return next(err); // 에러 발생 시 다음 미들웨어로 에러 전달
      }
      req.session.destroy(function (err) {
        if (err) {
          console.log(err);
          return next(err); // 에러 발생 시 다음 미들웨어로 에러 전달
        }
        // 세션이 성공적으로 파괴되면 클라이언트에 응답 반환
        res
          .status(200)
          .json({ success: true, message: 'Logged out successfully' });
      });
    });
  });

  // 회원 탈퇴 라우트
  route.delete('/user/delete', isLoggedIn, (req, res) => {
    const authId = req.user.authId; // 세션에 저장된 authId 값

    // 사용자 정보 삭제 쿼리
    const deleteUserSql = 'DELETE FROM user WHERE authId = ?';
    conn.query(deleteUserSql, [authId], (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).send('Failed to delete user');
      }

      if (result.affectedRows === 0) {
        return res.status(404).send('User not found');
      }

      // 모든 세션 정보 삭제
      req.logout(function (err) {
        if (err) {
          return res.status(500).send('Failed to log out');
        }

        // 세션 스토어의 모든 세션을 삭제
        req.session.destroy((err) => {
          if (err) {
            console.log(err);
            return res.status(500).send('Failed to destroy session');
          }
          res.send('User deleted and logged out successfully');
        });
      });
    });
  });

  return route;
};
