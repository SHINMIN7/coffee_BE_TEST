module.exports = function (passport) {
  const route = require('express').Router();
  const { isLoggedIn } = require('./middlewares'); // 사용자 미들웨어
  const conn = require('../mysql/db')();

  //coffeeinfo 테이블에 저장
  route.post('/coffeeinfo/save', isLoggedIn, async (req, res) => {
    try {
      const user_id = req.user.authId; // 세션에 저장된 authId 값
      const {
        title,
        origin,
        roasting,
        process,
        cupNote,
        coffeeType,
        coffeeFlavor,
        flavorIntensity,
        userPreferences,
      } = req.body;

      var sql = `INSERT INTO coffeeinfo (
          title,
          origin,
          roasting,
          process,
          cupNote,
          coffeeType,
          coffeeFlavor,
          flavorIntensity,
          userPreferences,
          user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      conn.query(
        sql,
        [
          title,
          origin,
          roasting,
          process,
          cupNote,
          coffeeType,
          coffeeFlavor,
          flavorIntensity,
          userPreferences,
          user_id,
        ],
        function (err, rows, fields) {
          if (err) {
            console.log(err);
            res.status(500).send('SQL Query Failed to save recipe information');
          } else {
            res.send('recipe information saved successfully');
          }
        }
      );
    } catch (error) {
      console.log(error);
      res.status(500).send('Failed to save recipe information ');
    }
  });

  //레시피 저장하기 버튼을 누르면 해당 라우트로 호출
  route.post('/recipe/save', isLoggedIn, async (req, res) => {
    try {
      const user_id = req.user.authId; // 세션에 저장된 authId 값

      // 가장 최근에 저장했던 커피 id값을 가져오는 쿼리
      //'SELECT id FROM coffeeinfo ORDER BY id DESC LIMIT 1';
      const sql_coffeeinfo =
        'SELECT * FROM coffeeinfo ORDER BY id DESC LIMIT 1';

      // 비동기 쿼리 호출을 위한 Promise
      const getLastCoffeeInfo = () => {
        return new Promise((resolve, reject) => {
          conn.query(sql_coffeeinfo, (err, results) => {
            if (err) {
              reject(err);
            } else if (results.length > 0) {
              resolve(results[0].id);
            } else {
              reject('No coffee info found');
            }
          });
        });
      };

      const coffeeinfo_id = await getLastCoffeeInfo();

      const {
        dose,
        water_temperature,
        bloom_pouring_time,
        bloom_water_quantity,
        bloom_extraction_time,
        first_pouring_time,
        first_water_quantity,
        first_extraction_time,
        second_pouring_time,
        second_water_quantity,
        second_extraction_time,
        third_pouring_time,
        third_water_quantity,
        third_extraction_time,
      } = req.body;
      var sql = `INSERT INTO recipe (dose, water_temperature, 
        bloom_pouring_time, bloom_water_quantity, bloom_extraction_time,
        first_pouring_time, first_water_quantity, first_extraction_time,
        second_pouring_time, second_water_quantity, second_extraction_time,
        third_pouring_time, third_water_quantity, third_extraction_time, user_id, coffeeinfo_id, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
      conn.query(
        sql,
        [
          dose,
          water_temperature,
          bloom_pouring_time,
          bloom_water_quantity,
          bloom_extraction_time,
          first_pouring_time,
          first_water_quantity,
          first_extraction_time,
          second_pouring_time,
          second_water_quantity,
          second_extraction_time,
          third_pouring_time,
          third_water_quantity,
          third_extraction_time,
          user_id,
          coffeeinfo_id,
        ], //third_pouring_time
        function (err, rows, fields) {
          if (err) {
            console.log(err);
            res.status(500).send('SQL Query Failed to save recipe');
          } else {
            res.send('recipe saved successfully');
          }
        }
      );
    } catch (error) {
      res.status(500).send('Failed to save user recipe');
    }
  });

  // 사용자 정보를 반환하는 엔드포인트 추가
  route.get('/user/info', isLoggedIn, (req, res) => {
    res.json({
      displayName: req.user.displayName,
      authId: req.user.authId,
    });
  });

  //레시피 목록을 출력할 라우터
  route.get('/user/recipes', isLoggedIn, async (req, res) => {
    const authId = req.user.authId; // 세션에 저장된 authId 값

    //var sql = 'SELECT * FROM recipe WHERE user_id = ?';
    //테이블 조인을 통해 해당 행 전체 데이터 가져오기
    var sql = `SELECT * FROM recipe
      INNER JOIN coffeeinfo ON recipe.coffeeinfo_id = coffeeinfo.id
      WHERE recipe.user_id = ? AND recipe.user_id = coffeeinfo.user_id;`;

    //쿼리 실행
    conn.query(sql, [authId], function (err, rows, fields) {
      if (err) {
        console.log(err);
      } else {
        //페이지 렌더링
        res.json(rows);
      }
    });
  });

  //해당 레시피 목록에서 해당 레시피 내용을 확인
  route.get('/user/recipes/:id', isLoggedIn, async (req, res) => {
    var recipe_id = req.params.id;
    const authId = req.user.authId; // 세션에 저장된 authId 값
    const sql = `SELECT * FROM recipe
      INNER JOIN coffeeinfo ON recipe.coffeeinfo_id = coffeeinfo.id
      WHERE recipe.user_id = coffeeinfo.user_id
      AND recipe.id = ?
      AND recipe.user_id = ?;`;
    conn.query(sql, [recipe_id, authId], function (err, rows, fields) {
      if (err) console.log(err);
      else {
        //페이지 렌더링
        res.json(rows);
      }
    });
  });

  // 레시피 삭제
  route.delete('/recipe/:id', isLoggedIn, async (req, res) => {
    var recipe_id = req.params.id;
    var sql = 'DELETE from recipe where coffeeinfo_id=? AND user_id=?';
    conn.query(sql, [recipe_id, req.user.authId], function (err, result) {
      if (err) {
        console.log(err);
        res.status(500).send('Failed to delete recipe');
      } else if (result.affectedRows === 0) {
        res
          .status(404)
          .send(
            'Recipe not found or you do not have permission to delete this recipe'
          );
      } else {
        res.send('Recipe deleted successfully');
      }
    });
  });

  return route;
};
