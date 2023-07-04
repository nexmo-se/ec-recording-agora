const axios = require('axios');
const jwt = require('jsonwebtoken');
const OpenTok = require("opentok");
const opentok = new OpenTok(process.env.VONAGE_API_KEY, process.env.VONAGE_API_SECRET);

const generateVonageAuth = () => {
    return new Promise((res, rej) => {
      jwt.sign(
        {
          iss: process.env.VONAGE_API_KEY,
          ist: 'project',
          exp: Date.now() + 200,
          jti: Math.random() * 132,
        },
        process.env.VONAGE_API_SECRET,
        { algorithm: 'HS256' },
        function (err, token) {
          if (token) {
            console.log('\n Received token\n', token);
            res(token);
          } else {
            console.log('\n Unable to fetch token, error:', err);
            rej(err.message);
          }
        }
      );
    });
};

class VonageAPI {
    static async createVonageSession() {
        return new Promise((res, rej) => {
            opentok.createSession({ mediaMode: "routed" }, function (err,session) {
            if (err) rej(err.message);
            res(session)
            });
        })
    }

    static async generateVonageJwt(sessionId) {
        return opentok.generateToken(sessionId);
     }

    static async startEcRender(sessionId, url) {
        const token = opentok.generateToken(sessionId);
        console.log("test123", `${url}&role=${process.env.EC_RENDER}`)
        const response = await axios.post(`https://api.opentok.com/v2/project/${process.env.VONAGE_API_KEY}/render`, {
          "sessionId": sessionId,
          "token": token,
          "url": `${url}&role=${process.env.EC_RENDER}`,
          "maxDuration": 1800,
          "resolution": "1280x720",
          "properties": {
            "name": "EC",
          },
        }, {
            headers: {
              'Content-Type': 'application/json',
              'X-OPENTOK-AUTH': await generateVonageAuth()
            }
        })
        return response.data.id
    }

    static async deleteEcRender(id) {
        const response = await axios.delete(`https://api.opentok.com/v2/project/${process.env.VONAGE_API_KEY}/render/${id}`, {
            headers: {
              'Content-Type': 'application/json',
              'X-OPENTOK-AUTH': await generateVonageAuth()
            }
          })
          return response.data
    }

    static async startArchive(sessionId) {
        return new Promise((res, rej) => {
            opentok.startArchive(sessionId, { name: "EC Recording", resolution: "1280x720" }, function (err, archive) {
              if (err) {
                rej(err.message);
              } else {
                res(archive.id);
              }
            });
        })
    }

    static async stopArchive(archiveId) {
        return new Promise((res, rej) => {
            opentok.stopArchive(archiveId, function (err, archive) {
              if (err) rej(err.message);
              res(archive.id);
            });
        })
    }

    static async getVonageRecord(archiveId) {
      return new Promise((res, rej) => {
        opentok.getArchive(archiveId, function (err, archive) {
        if (err) rej(err.message);
        res(archive.url)
      });
    })
  }
}

module.exports = VonageAPI