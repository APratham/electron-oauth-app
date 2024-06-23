const { ipcRenderer } = require('electron');

const __onload__ = () => {
    const logoutButton = document.querySelector('ion-button#logout');

    logoutButton.addEventListener('click', () => {
        ipcRenderer.send('logout');
    });

    ipcRenderer.on('auth-success', (event, data) => {
        const { uniqueId } = data;
        document.getElementById('status').innerText = `Login successful! Your unique ID: ${uniqueId}`;
        ipcRenderer.send('validate-token', data.tokens);
    });

    ipcRenderer.on('token-validity', (event, isValid) => {
        const statusText = isValid ? 'Token is valid and verified!' : 'Token validation failed.';
        document.getElementById('token-status').innerText = statusText;
    });

    ipcRenderer.on('logout-success', () => {
        window.location.href = 'login.html';
    });

    // Check if already logged in
    ipcRenderer.send('check-login');
};

window.onload = __onload__;

// Check if the URL contains query parameters with login data
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('uniqueId')) {
    const uniqueId = urlParams.get('uniqueId');
    document.getElementById('status').innerText = `Login successful! Your unique ID: ${uniqueId}`;
}