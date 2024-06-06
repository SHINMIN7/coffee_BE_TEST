module.exports = function (passport) {
  const route = require('express').Router();
  const { isLoggedIn } = require('./middlewares'); // 사용자 미들웨어
  const conn = require('../mysql/db')();

  route.get('/test', function (req, res) {
    const user_id = req.user.authId; // 세션에 저장된 authId 값
    console.log(user_id);
    console.log(req.body);
    res.send(`Hello, user with ID: ${req.user.authId}`);
  });

  route.get('/test/recipe', isLoggedIn, function (req, res) {
    var output = `
  <h1>recipe</h1>
  <form action="/recipe/save" method="post">
    <p>
      <input id="dose" name="dose" type="text" placeholder="dose" required autofocus>
    </p>
    <p>
      <input id="water_temperature" name="water_temperature" type="password" placeholder="water_temperature" required>
    </p>
    <p>
      <input type="submit">recipe</input>
    </p>  
  </form>
  `;
    res.send(output);
  });

  // route.post('/test/recipe', isLoggedIn, function (req, res) {
  //   // var user = {
  //   //   authId: req.user.authId,
  //   //   dose: req.body.dose,
  //   //   water_temperature: req.body.water_temperature,
  //   // };
  //   // console.log(user.authId, user.dose, user.water_temperature);
  //   const authId = req.user.authId;
  //   const { dose, water_temperature } = req.body;

  //   var sql = `INSERT INTO recipe (dose, water_temperature, user_id) VALUES (?, ?, ?)`;
  //   conn.query(
  //     sql,
  //     [dose, water_temperature, authId],
  //     function (err, rows, fields) {
  //       if (err) {
  //         console.log('에러발생');
  //       } else {
  //         res.send('recipe saved successfully');
  //       }
  //     }
  //   );
  // });

  //레시피 저장하기 버튼을 누르면 해당 라우트로 호출
  route.post('/recipe/save', isLoggedIn, async (req, res) => {
    try {
      const user_id = req.user.authId; // 세션에 저장된 authId 값
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
      } = req.body;
      var sql = `INSERT INTO recipe (dose, water_temperature, 
        bloom_pouring_time, bloom_water_quantity, bloom_extraction_time,
        first_pouring_time, first_water_quantity, first_extraction_time,
        second_pouring_time, second_water_quantity, second_extraction_time, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
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
          user_id,
        ],
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

  //레시피 목록을 출력할 라우터
  route.get('/mypage', isLoggedIn, async (req, res) => {
    const authId = req.user.authId; // 세션에 저장된 authId 값
    var sql = 'SELECT * FROM recipe WHERE user_id = ?';

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
  route.get('/mypage/:id', isLoggedIn, async (req, res) => {
    var recipe_id = req.params.id;
    var sql = 'SELECT * from recipe where recipe_id=?';
    conn.query(sql, [recipe_id], function (err, rows, fields) {
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
    var sql = 'DELETE from recipe where recipe_id=? AND user_id=?';
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
