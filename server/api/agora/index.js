const {RtcTokenBuilder, RtcRole} = require('agora-access-token')

const APP_ID = process.env.AGORA_APP_ID
const APP_CERT = process.env.AGORA_APP_CERT

class AgoraAPI {
    static generateAccessToken = async (channelName, isEcRender) => {
        let role = RtcRole.PUBLISHER
        if (isEcRender) {
            role = RtcRole.SUBSCRIBER
        }
        const expireTime = 86400 // 1 day
        const currentTime = Math.floor(Date.now() / 1000)
        const privilegeExpireTime = currentTime + expireTime
        // build token
        const token = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERT,channelName,0, role, privilegeExpireTime)
        return token
    }
}
module.exports = AgoraAPI