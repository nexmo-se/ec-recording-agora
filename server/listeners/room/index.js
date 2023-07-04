const VonageAPI = require("../../api/vonage")
const AgoraAPI = require("../../api/agora")

let vonageSessions = {}

class RoomListener{
    static async initialize(req, res) {
        const roomName = req.body.roomName
        const role = req.body.role
        try {
            const agoraToken = await AgoraAPI.generateAccessToken(roomName, role == process.env.EC_RENDER ? true : false)
    
            if (!vonageSessions[roomName]) {
                const session =  await VonageAPI.createVonageSession()
                vonageSessions[roomName] = session
            }
            const vonageToken = await VonageAPI.generateVonageJwt(vonageSessions[roomName].sessionId)

            res.json({
                name: roomName, 
                agoraToken, 
                agoraAppId: process.env.AGORA_APP_ID,
                vonageApikey: process.env.VONAGE_API_KEY,
                vonageSessionId: vonageSessions[roomName].sessionId,
                vonageToken
            })
        }
        catch(e) {
            console.log("initialize error", e)
            res.status(501).end()
        }
    }

    static async startEcRecording(req, res) {
        try {
            const { sessionId, url } = req.body
            console.log("sessionId: ",sessionId, "url:", url)

            if (sessionId && url) {
                // Did not use automatic archive here, to control when the stop archive, 
                // automatic archive will only stop 60s after the last clients disconnect
                const ecId = await VonageAPI.startEcRender(sessionId, url)
                const archiveId = await VonageAPI.startArchive(sessionId) 
            
                res.json({ecId, archiveId})
            }else {
                res.status(500);
            }
          }catch(e) {
            console.log("startEcRecording error: ", e)
            res.status(500).send({ message: e });
          }
    }

    static async stopEcRecording(req, res) {
        try {
            const { ecId, archiveId } = req.body;
            console.log("ecId: ",ecId, "archiveId:", archiveId)
            if (ecId && archiveId) {
                //stop archive
                const archiveData = await VonageAPI.stopArchive(archiveId)
                //stop ec
                const ecData = await VonageAPI.deleteEcRender(ecId)
                res.status(200).json({archiveData, ecData});
            } else {
                res.status(500);
            }
            } catch (e) {
                console.log('stopEcRecording error: ', e)
                res.status(500).send({ message: e });
            }
    }

    static async getVonageRecord(req, res) {
        const archiveId = req.body.archiveId
        try {
            if (!archiveId) {
            res.status(501);
            }
            const url = await VonageAPI.getVonageRecord(archiveId)
            res.json({url})
        }
        catch (e) {
            console.log('getVonageRecord error: ', e)
            res.status(500).send({ message: e });
        }
    }

}

module.exports = RoomListener;