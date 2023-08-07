require('dotenv').config()
const express = require('express')
const path = require('path');
const cors = require('cors')
const RoomListener = require("./listeners/room");
var qs = require('querystring');
var _ = require('lodash');

const app = express()
app.use(express.json());
app.use(cors())

const PORT = process.env.NERU_APP_PORT || process.env.PORT || 3002;

const nocache = (req, res, next) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    res.header('Expires', '-1')
    res.header('Pragma', 'no-cache')
    next()
}

const auth = (req, res, next) => {
  const {pin, role, roomName, vonageToken} = req.body
    if (vonageToken && role !== process.env.EC_RENDER) {      
      try {
        let decoded = decodeVonageToken(vonageToken)
        if (decoded.partner_id !== process.env.VONAGE_API_KEY) {
          return res.status(501).end()
        }
        else {
          next()
        }
      }
      catch(err) {
        console.log("decode error: ", err)
        return res.status(501).end()
      }
    }
    else if (!roomName) {
      return res.status(501).send(); 
    }
    else if (role == process.env.EC_RENDER) {
      next()
    }
    else if (pin !== process.env.AUTH_PIN) {
      return res.status(501).send();
    }
    else {
      next()
    }
}

const decodeVonageToken = function (token) {
  var parsed = {};
  var encoded = token.substring(4); // remove 'T1=='
  var decoded = Buffer.from(encoded, 'base64').toString('ascii');
  var tokenParts = decoded.split(':');
  tokenParts.forEach(function (part) {
    _.merge(parsed, qs.parse(part));
  });
  return parsed;
};


app.get('/_/health', async (req, res) => {
  res.sendStatus(200);
});

app.post('/initialize', auth, nocache, RoomListener.initialize)

// Vonage
app.post('/ecStartRecording', auth, RoomListener.startEcRecording)

app.post('/ecStopRecording', auth, RoomListener.stopEcRecording) 

app.post('/getVonageRecord', auth, RoomListener.getVonageRecord)

app.use((req, res, next) => {
    // Here we add Cache-Control headers in accordance with the create-react-app best practices.
    // See: https://create-react-app.dev/docs/production-build/#static-file-caching
    if (req.path === '/' || req.path === 'index.html') {
      res.set('Cache-Control', 'no-cache');
      res.sendFile(path.join(__dirname, '../dist/index.html'), { etag: false, lastModified: false });
    } else {
      res.set('Cache-Control', 'max-age=31536000');
      next();
    }
  });
  
app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (_, res) => {
    // Don't cache index.html
    res.set('Cache-Control', 'no-cache');
    res.sendFile(path.join(__dirname, '../dist/index.html'), { etag: false, lastModified: false });
  });
  
app.listen(PORT, () => {
    console.log('server started on port', PORT);
});