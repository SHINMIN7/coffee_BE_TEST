module.exports = function (app) {
  const conn = require('./db')();
  const bkfd2Password = require('pbkdf2-password');
  const passport = require('passport');
  const LocalStrategy = require('passport-local').Strategy;
  const hasher = bkfd2Password();

  app.use(passport.initialize()); // 요청 객체에 passport 설정을 심음
  app.use(passport.session()); // req.session 객체에 passport정보를 추가 저장

  // 사용자 정보를 세션에 저장
  passport.serializeUser(function (user, done) {
    // console.log('serializeUser', user);
    done(null, user.authId);
  });

  // 세션에서 사용자 정보 가져오기
  passport.deserializeUser(function (authId, done) {
    var sql = 'SELECT * FROM user WHERE authId=?';
    conn.query(sql, [authId], function (err, results) {
      if (err) {
        console.log(err);
        done('There is no user');
      } else {
        done(null, results[0]); //사용자 정보가 존재하므로 에러가 없고(null), 사용자 정보를 출력
      }
    });
  });

  passport.use(
    new LocalStrategy(function verify(username, password, cb) {
      var uname = username;
      var pwd = password;
      var sql = 'SELECT * FROM user WHERE authId=?';
      conn.query(sql, ['user' + uname], function (err, results) {
        console.log(results);
        if (err) {
          return cb('There is no user');
        }
        var user = results[0];
        console.log(user);
        return hasher(
          { password: pwd, salt: user.salt },
          function (err, pass, salt, hash) {
            if (hash === user.password) {
              return cb(null, user);
              //req.session.displayName = user.displayName;
              //req.session.save(function(){ res.redirect('/welcome')};)
            } else {
              return cb(null, false);
              //res.send('who are you?');
            }
          }
        );
      });
      // return cb(null, false); //res.send('who are you?');
    })
  );
  return passport;
};
