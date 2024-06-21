const { app, BrowserWindow, ipcMain } = require('electron');
const { OAuth2Client } = require('google-auth-library');
const { OAUTH_CLIENT } = require('./secrets');
const crypto = require('crypto');
const keytar = require('keytar');

const SERVICE_NAME = 'ElectronOAuthExample';
const ACCOUNT_NAME = 'oauth-token';
const UNIQUE_ID_KEY = 'unique-id';

app.on('ready', async () => {
    const mainWindow = new BrowserWindow({
        title: 'Electron OAuth Example',
        webPreferences: { 
            nodeIntegration: true,
            contextIsolation: false  // Ensure this is set to false
        },
    });
    mainWindow.loadURL(`file://${__dirname}/index.html`);
    mainWindow.webContents.openDevTools();

    const storedTokens = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
    const uniqueId = await keytar.getPassword(SERVICE_NAME, UNIQUE_ID_KEY);
    if (storedTokens) {
        const tokens = JSON.parse(storedTokens);
        mainWindow.webContents.once('did-finish-load', () => {
            mainWindow.webContents.send('auth-success', { tokens, uniqueId });
            validateToken(tokens).then(isValid => {
                mainWindow.webContents.send('token-validity', isValid);
            });
        });
    }

    ipcMain.on('auth-start', async () => {
        const client = initOAuthClient();
        const url = client.generateAuthUrl({
            scope: ['https://www.googleapis.com/auth/userinfo.profile'],
        });
        const authWindow = new BrowserWindow({ x: 60, y: 60, useContentSize: true });
        authWindow.loadURL(url);

        authWindow.on('closed', () => {
            mainWindow.webContents.send('auth-window-closed');
        });

        const code = await getOAuthCodeByInteraction(authWindow, url);
        const response = await client.getToken(code);
        const uniqueId = crypto.randomUUID();
        await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, JSON.stringify(response.tokens));
        await keytar.setPassword(SERVICE_NAME, UNIQUE_ID_KEY, uniqueId);
        mainWindow.webContents.send('auth-success', { tokens: response.tokens, uniqueId });

        // Perform a simple API request to confirm token validity
        const isValid = await validateToken(response.tokens);
        mainWindow.webContents.send('token-validity', isValid);
    });

    ipcMain.on('logout', async () => {
        await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
        await keytar.deletePassword(SERVICE_NAME, UNIQUE_ID_KEY);
        mainWindow.webContents.send('logout-success');
    });
});

const initOAuthClient = () => {
    return new OAuth2Client({
        clientId: OAUTH_CLIENT.client_id,
        clientSecret: OAUTH_CLIENT.client_secret,
        redirectUri: 'urn:ietf:wg:oauth:2.0:oob',
    });
};

const getOAuthCodeByInteraction = (interactionWindow, authPageURL) => {
    return new Promise((resolve, reject) => {
        interactionWindow.loadURL(authPageURL);
        const onclosed = () => {
            reject('Interaction ended intentionally ;(');
        };
        interactionWindow.on('closed', onclosed);
        interactionWindow.webContents.on('did-navigate', (event, url) => {
            handleURLChange(url, interactionWindow, resolve, reject, onclosed);
        });
        interactionWindow.webContents.on('page-title-updated', (event) => {
            const url = interactionWindow.webContents.getURL();
            handleURLChange(url, interactionWindow, resolve, reject, onclosed);
        });
    });
};

const handleURLChange = (url, interactionWindow, resolve, reject, onclosed) => {
    const parsedURL = new URL(url);
    if (parsedURL.searchParams.get('approvalCode')) {
        interactionWindow.removeListener('closed', onclosed);
        interactionWindow.close();
        return resolve(parsedURL.searchParams.get('approvalCode'));
    }
    if ((parsedURL.searchParams.get('response') || '').startsWith('error=')) {
        interactionWindow.removeListener('closed', onclosed);
        interactionWindow.close();
        return reject(parsedURL.searchParams.get('response'));
    }
};

const validateToken = async (tokens) => {
    const client = new OAuth2Client();
    client.setCredentials(tokens);
    try {
        const res = await client.request({
            url: 'https://www.googleapis.com/oauth2/v3/userinfo',
        });
        console.log('User Info:', res.data); // Log the user info to verify
        return true;
    } catch (error) {
        console.error('Token validation failed:', error);
        return false;
    }
};

app.on('window-all-closed', () => {
    app.quit();
});
