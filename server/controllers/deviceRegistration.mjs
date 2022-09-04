import * as Kakao from 'node-kakao';
import * as Readline from 'readline';
import dotenv from 'dotenv'
dotenv.config();


(async function login() {
    const form = {
        email: process.env.TalkClientLoginID,
        password: process.env.TalkClientLoginPW,
    };


    const api = await Kakao.AuthApiClient.create(process.env.TalkClientName, process.env.TalkClientUUID);
    const apiLoginRes =  await api.login(form);

    if (apiLoginRes.success) {
        console.log(`Received access token: ${apiLoginRes.result.accessToken}`);

        const clientLoginRes = await CLIENT.login(apiLoginRes.result);

        if (!clientLoginRes.success)
            throw new Error(`Login failed with status: ${clientLoginRes.status}`);

        console.log('Login success');

    } else if (apiLoginRes.status !== Kakao.KnownAuthStatusCode.DEVICE_NOT_REGISTERED) {
        throw new Error(`Web login failed with status: ${apiLoginRes.status}`);
    
    } else {
        const passcodeRes = await api.requestPasscode(form);

        if (!passcodeRes.success)
            throw new Error(`Passcode request failed with status: ${passcodeRes.status}`);

        const inputInterface = Readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const passcode = await new Promise((resolve) => inputInterface.question('Enter passcode: ', resolve));
    
        inputInterface.close();

        const registerRes = await api.registerDevice(form, passcode, true);

        if (!registerRes.success)
            throw new Error(`Device registration failed with status: ${registerRes.status}`);

        console.log(`Device ${process.env.TalkClientUUID} has been registered`);
        console.log('Attempting to login...');
        login();
    }
})();
