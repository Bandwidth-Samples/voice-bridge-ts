require('dotenv').config()
import { Client, ApiController, Response, SpeakSentence, Ring, Bridge } from '@bandwidth/voice'
import express from 'express'

const app = express()
app.use(express.json())

const accountId = process.env.BW_ACCOUNT_ID
const applicationId = process.env.BW_VOICE_APPLICATION_ID
const bwPhoneNumber = process.env.BW_NUMBER
const maskedPhoneNumber = process.env.USER_NUMBER
const port = process.env.LOCAL_PORT
const baseUrl = process.env.BASE_CALLBACK_URL
const username = process.env.BW_USERNAME
const password = process.env.BW_PASSWORD

if (!accountId || !applicationId || !bwPhoneNumber || !baseUrl || !maskedPhoneNumber) {
    throw new Error(`Enviroment variables not set up properly
    accountId: ${accountId}
    applicationId: ${applicationId}
    phone number: ${bwPhoneNumber}
    port: ${port}
    baseUrl: ${baseUrl}
    maskedPhoneNumber: ${maskedPhoneNumber}`)
}

if (!username){
    throw new Error(`Username: undefined`)
}

if (!password){
    throw new Error(`Password: undefined`)
}

console.log(`Enviroment variables set to:
accountId: ${accountId}
applicationId: ${applicationId}
phone number: ${bwPhoneNumber}
port: ${port}
baseUrl: ${baseUrl}
maskedPhoneNumber: ${maskedPhoneNumber}`)

// initialize the client 
const client = new Client({
    basicAuthPassword: password,
    basicAuthUserName: username
})

// The controller is the main API to the SDK
const controller = new ApiController(client)

app.post('/callbacks/outbound', async (req, res) => {
    const callback = req.body

    const response = new Response()

    switch (callback.eventType) {
        case 'answer':
            const tag = callback.tag

            const speakSentence = new SpeakSentence({
                sentence: 'Hold while we connect you.'
            })

            const speakSentence2 = new SpeakSentence({
                sentence: 'We will begin to bridge you now.'
            })
            const bridge = new Bridge({
                callId: tag
            })
            response.add(speakSentence, speakSentence2, bridge)
            
            break;
        default:
            break;
    }

    res.status(200).send(response.toBxml())
})

app.post('/callbacks/inbound', async (req, res) => {
    const callback = req.body

    const response = new Response()

    switch (callback.eventType) {
        case 'initiate':

            const speakSentence = new SpeakSentence({
                    sentence: 'Hold while we connect you.'
                })
            const ring = new Ring({
                duration: 30
            })
            response.add(speakSentence, ring)

            try {
                const response = await controller.createCall(accountId, {
                    applicationId,
                    from: bwPhoneNumber,
                    to: maskedPhoneNumber,
                    answerUrl: `${baseUrl}/callbacks/outbound`,
                    tag: `${callback.callId}`
                })
            } catch (e) {
               console.log(e.message)
            }

            break;
        default:
            break;
    }

    res.status(200).send(response.toBxml())
})

app.listen(port)