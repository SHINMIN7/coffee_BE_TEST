// 설정
module.exports = function (passport) {
  require('dotenv').config();
  const OpenAI = require('openai');
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });
  const { isLoggedIn } = require('./middlewares'); // 사용자 미들웨어
  const route = require('express').Router();
  const awsIoT = require('aws-iot-device-sdk');
  const AWS_IOT_HOST = process.env.AWS_IOT_HOST;
  const AWS_CLIENT_ID = process.env.AWS_CLIENT_ID;

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

  route.post('/cup-note', isLoggedIn, async (req, res) => {
    try {
      const { title, origin, roastLevel, process } = req.body;
      const prompt = `Title: ${title}\nCoffee Origin: ${origin}\nRoast Level: ${roastLevel}\nProcess: ${process}\nWhat are the cup notes in English?`;
      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content:
              'You are an expert in predicting cup notes from the information of the beans.',
          },
          { role: 'user', content: prompt },
        ],
        model: 'ft:gpt-3.5-turbo-1106:kyu::9MFupRLS',
      });
      res.json(completion.choices[0].message.content);
      console.log('ddd', completion.choices[0].message.content);
    } catch (error) {
      res.status(500).send('Failed to get response from OpenAI');
    }
  });

  route.post('/publish', isLoggedIn, (req, res) => {
    const data = req.body;
    console.log('data', data);
    device.publish('topic/last/a', JSON.stringify(data), { qos: 1 }, (err) => {
      if (err) {
        res.status(500).send('Failed to publish message');
      } else {
        res.send('Message published successfully');
      }
    });
  });

  route.post('/chatgpt', isLoggedIn, async (req, res) => {
    try {
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
      const prompt = `You are the world's best drip coffee expert. Your mission is to create a drip coffee recipe in json format by modifying the standard recipe reflecting the user's personal preference. Only print out the modified recipe in json format. Do not add additional informations in the json.
        <please remove all the units whe you print it out>
        <user's personal preference>
        1. ${coffeeType} coffee
        2. ${flavorIntensity} flavor of ${coffeeFlavor} 
        3. ${userPreferences}
        
        <coffee information>
        - Title: ${title},
        - Coffee origin: ${origin},
        - Roasting point: ${roasting},
        - Processing method: ${process},
        -Cup notes: ${cupNote}
        
        <standard recipe>
        {
            "Dose": 20,
            "Water_temperature": 92,
            "Water_quantity": "40, 60, 60, 60",
            "Pouring_time": "0, 10, 10, 5",
            "Extraction_time": "30, 30, 30, 50"
        }
        
        Iced Recipe
        {
            "Dose": 19,
            "Water_temperature": 90,
            "Water_quantity": "30, 90, 70",
            "Pouring_time": "0, 10, 10",
            "Extraction_time": "50, 30, 55"
        }
        
        <only print out the Modified recipe that matches the same json format of the standard recipe>
        <please remove all the units whe you print it out>`;
      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'gpt-4',
        // prompt: prompt,
      });
      res.json(completion.choices[0].message.content);
    } catch (error) {
      res.status(500).send('Failed to get response from OpenAI');
    }
  });

  return route;
};
