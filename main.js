const { app, BrowserWindow, ipcMain, protocol } = require('electron');
const { OAuth2Client } = require('google-auth-library');
const { GOOGLE_OAUTH_CLIENT, MICROSOFT_OAUTH_CLIENT } = require('./secrets');
const msal = require('@azure/msal-node');
const crypto = require('crypto');
const keytar = require('keytar');
const fetch = require('node-fetch'); // Ensure node-fetch is installed
const URL = require('url').URL;
const path = require('path');

const SERVICE_NAME = 'ElectronOAuthExample';
const GOOGLE_ACCOUNT_NAME = 'google-oauth-token';
const GOOGLE_UNIQUE_ID_KEY = 'google-unique-id';
const MS_ACCOUNT_NAME = 'ms-oauth-token';
const MS_UNIQUE_ID_KEY = 'ms-unique-id';

let mainWindow;
let authWindow;

require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit',
    watchRenderer: true,
    ignored: /node_modules|[/\\]\./
  });

app.on('ready', async () => {
    protocol.registerHttpProtocol('msal', (request, callback) => {
        const requestUrl = new URL(request.url);
        console.log('Protocol Request URL:', requestUrl.toString());
        if (requestUrl.searchParams.has('code')) {
            handleMicrosoftAuthCode(requestUrl.searchParams.get('code'));
        }
        callback({ cancel: true });
    }, (error) => {
        if (error) {
            console.error('Failed to register protocol', error);
        }
    });

    mainWindow = new BrowserWindow({
        title: 'Electron OAuth Example',
        webPreferences: { 
            nodeIntegration: true,
            contextIsolation: false  // Ensure this is set to false
        },
    });
    mainWindow.loadURL(`file://${__dirname}/index.html`);
    mainWindow.webContents.openDevTools();

    try {
        const googleTokens = await keytar.getPassword(SERVICE_NAME, GOOGLE_ACCOUNT_NAME);
        const googleUniqueId = await keytar.getPassword(SERVICE_NAME, GOOGLE_UNIQUE_ID_KEY);
        const msTokens = await keytar.getPassword(SERVICE_NAME, MS_ACCOUNT_NAME);
        const msUniqueId = await keytar.getPassword(SERVICE_NAME, MS_UNIQUE_ID_KEY);

        if (googleTokens) {
            const tokens = JSON.parse(googleTokens);
            mainWindow.webContents.once('did-finish-load', () => {
                mainWindow.webContents.send('auth-success', { tokens, uniqueId: googleUniqueId });
                validateGoogleToken(tokens).then(isValid => {
                    mainWindow.webContents.send('token-validity', isValid);
                });
            });
        } else if (msTokens) {
            const { tokens, account } = JSON.parse(msTokens);
            mainWindow.webContents.once('did-finish-load', () => {
                mainWindow.webContents.send('auth-success', { tokens, uniqueId: msUniqueId });
                validateMsToken(tokens.accessToken).then(isValid => {
                    mainWindow.webContents.send('token-validity', isValid);
                }).catch(error => {
                    console.error('Token validation error:', error);
                });
            });
        }
    } catch (error) {
        console.error('Error retrieving tokens:', error);
    }

    ipcMain.on('auth-start', async (event, provider) => {
        if (provider === 'google') {
            startGoogleAuth(mainWindow);
        } else if (provider === 'microsoft') {
            startMicrosoftAuth(mainWindow);
        }
    });

    ipcMain.on('logout', async () => {
        await keytar.deletePassword(SERVICE_NAME, GOOGLE_ACCOUNT_NAME);
        await keytar.deletePassword(SERVICE_NAME, GOOGLE_UNIQUE_ID_KEY);
        await keytar.deletePassword(SERVICE_NAME, MS_ACCOUNT_NAME);
        await keytar.deletePassword(SERVICE_NAME, MS_UNIQUE_ID_KEY);
        mainWindow.webContents.send('logout-success');
        console.log('Stored tokens cleared');
    });
});

const startGoogleAuth = async (mainWindow) => {
    const client = initGoogleOAuthClient();
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
    await keytar.setPassword(SERVICE_NAME, GOOGLE_ACCOUNT_NAME, JSON.stringify(response.tokens));
    await keytar.setPassword(SERVICE_NAME, GOOGLE_UNIQUE_ID_KEY, uniqueId);
    mainWindow.webContents.send('auth-success', { tokens: response.tokens, uniqueId });

    const isValid = await validateGoogleToken(response.tokens);
    mainWindow.webContents.send('token-validity', isValid);
};

const startMicrosoftAuth = async (mainWindow) => {
    const msalConfig = {
        auth: {
            clientId: MICROSOFT_OAUTH_CLIENT.clientId,
            authority: `https://login.microsoftonline.com/${MICROSOFT_OAUTH_CLIENT.tenantId}`,
            redirectUri: 'msal://auth',
        },
    };

    const pca = new msal.PublicClientApplication(msalConfig);

    const authCodeUrlParameters = {
        scopes: ["user.read", "offline_access"],
        redirectUri: 'msal://auth',
        prompt: "select_account"
    };

    try {
        const authUrl = await pca.getAuthCodeUrl(authCodeUrlParameters);
        authWindow = new BrowserWindow({ x: 60, y: 60, useContentSize: true });
        authWindow.loadURL(authUrl);

        authWindow.on('closed', () => {
            mainWindow.webContents.send('auth-window-closed');
        });
    } catch (error) {
        console.error('Error getting auth URL:', error);
    }
};

const handleMicrosoftAuthCode = async (code) => {
    const msalConfig = {
        auth: {
            clientId: MICROSOFT_OAUTH_CLIENT.clientId,
            authority: `https://login.microsoftonline.com/${MICROSOFT_OAUTH_CLIENT.tenantId}`,
            redirectUri: 'msal://auth',
        },
    };

    const pca = new msal.PublicClientApplication(msalConfig);
    const tokenRequest = {
        code: code,
        scopes: ["user.read", "offline_access"],
        redirectUri: 'msal://auth',
    };

    try {
        const response = await pca.acquireTokenByCode(tokenRequest);
        const uniqueId = crypto.randomUUID();
        const account = response.account;

        await keytar.setPassword(SERVICE_NAME, MS_ACCOUNT_NAME, JSON.stringify({ tokens: response, account: account }));
        await keytar.setPassword(SERVICE_NAME, MS_UNIQUE_ID_KEY, uniqueId);
        mainWindow.webContents.send('auth-success', { tokens: response, uniqueId });

        if (authWindow) {
            authWindow.close();
            authWindow = null;
        }

        const isValid = await validateMsToken(response.accessToken);
        mainWindow.webContents.send('token-validity', isValid);
    } catch (error) {
        console.error('Error during token acquisition:', error);
        mainWindow.webContents.send('token-validity', false);
    }
};

const initGoogleOAuthClient = () => {
    return new OAuth2Client({
        clientId: GOOGLE_OAUTH_CLIENT.clientId,
        clientSecret: GOOGLE_OAUTH_CLIENT.clientSecret,
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
    if (parsedURL.searchParams.get('code')) {
        interactionWindow.removeListener('closed', onclosed);
        interactionWindow.close();
        return resolve(parsedURL.searchParams.get('code'));
    }
    if ((parsedURL.searchParams.get('response') || '').startsWith('error=')) {
        interactionWindow.removeListener('closed', onclosed);
        interactionWindow.close();
        return reject(parsedURL.searchParams.get('response'));
    }
};

const validateGoogleToken = async (tokens) => {
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

const validateMsToken = async (accessToken) => {
    const url = "https://graph.microsoft.com/v1.0/me";
    
    try {   
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Token validation failed: ${errorText}`);
            throw new Error('Token validation failed');
        }

        const userInfo = await response.json();
        console.log('User Info:', userInfo); // Log the user info to verify
        return true;
    } catch (error) {
        console.error('Token validation error:', error);
        return false;
    }
};

app.on('window-all-closed', () => {
    app.quit();
});
