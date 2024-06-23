const { ipcRenderer } = require('electron');

const __onload__ = () => {
    const googleLoginButton = document.querySelector('ion-button#google-login');
    const microsoftLoginButton = document.querySelector('ion-button#microsoft-login');

    googleLoginButton.addEventListener('click', () => {
        googleLoginButton.setAttribute('disabled', true);
        ipcRenderer.send('auth-start', 'google');
    });

    microsoftLoginButton.addEventListener('click', () => {
        microsoftLoginButton.setAttribute('disabled', true);
        ipcRenderer.send('auth-start', 'microsoft');
    });

    ipcRenderer.on('auth-success', (event, data) => {
        const { uniqueId } = data;
        window.location.href = `index.html?uniqueId=${uniqueId}`;
    });

    ipcRenderer.on('auth-window-closed', () => {
        googleLoginButton.removeAttribute('disabled');
        microsoftLoginButton.removeAttribute('disabled');
    });

    ipcRenderer.on('logout-success', () => {
        window.location.href = 'login.html';
    });
};

window.onload = __onload__;
