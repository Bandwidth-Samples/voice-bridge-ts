import { CallsApi, Configuration, Bxml } from 'bandwidth-sdk';
import express from 'express';

const BW_ACCOUNT_ID = process.env.BW_ACCOUNT_ID;
const BW_VOICE_APPLICATION_ID = process.env.BW_VOICE_APPLICATION_ID;
const BW_NUMBER = process.env.BW_NUMBER;
const USER_NUMBER = process.env.USER_NUMBER;
const BW_USERNAME = process.env.BW_USERNAME;
const BW_PASSWORD = process.env.BW_PASSWORD;
const LOCAL_PORT = process.env.LOCAL_PORT;
const BASE_CALLBACK_URL = process.env.BASE_CALLBACK_URL;

if([
    BW_ACCOUNT_ID,
    BW_VOICE_APPLICATION_ID,
    BW_NUMBER,
    USER_NUMBER,
    BW_USERNAME,
    BW_PASSWORD,
    LOCAL_PORT,
    BASE_CALLBACK_URL
].some(item => item === undefined)) {
    throw new Error('Please set the environment variables defined in the README');
}

const config = new Configuration({
    username: BW_USERNAME,
    password: BW_PASSWORD
});

const app = express();
app.use(express.json());

app.post('/callbacks/inboundCall', async (req, res) => {
    const callback = req.body;

    const body = {
        applicationId: BW_VOICE_APPLICATION_ID,
        to: '+19196286059',
        from: BW_NUMBER,
        answerUrl: `${BASE_CALLBACK_URL}/callbacks/outboundCall`,
        tag: `${callback.callId}`
    }

    const callsApi = new CallsApi(config);
    await callsApi.createCall(BW_ACCOUNT_ID, body);

    const speakSentence = new Bxml.SpeakSentence('Hold while we connect you.');
    const ring = new Bxml.Ring({ duration: 30 });
    const response = new Bxml.Response([speakSentence, ring]);
            
    res.status(200).send(response.toBxml());
});

app.post('/callbacks/outboundCall', async (req, res) => {
    const callback = req.body;

    const speakSentence = new Bxml.SpeakSentence('Hold while we connect you. We will begin to bridge you now.');
    const bridge = new Bxml.Bridge(callback.tag);
    const response = new Bxml.Response([speakSentence, bridge]);

    res.status(200).send(response.toBxml());
});

app.listen(LOCAL_PORT);
