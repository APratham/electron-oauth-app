const { ipcRenderer } = require('electron');

const __onload__ = () => {
    const googleLoginButton = document.querySelector('ion-button.google-button');
    const microsoftLoginButton = document.querySelector('ion-button.microsoft-button');
    const logoutButton = document.querySelector('ion-button#logout');

    const updateUI = (isLoggedIn) => {
        if (isLoggedIn) {
            googleLoginButton.style.display = 'none';
            microsoftLoginButton.style.display = 'none';
            logoutButton.style.display = 'inline-block';
        } else {
            googleLoginButton.style.display = 'inline-block';
            googleLoginButton.removeAttribute('disabled');
            microsoftLoginButton.style.display = 'inline-block';
            microsoftLoginButton.removeAttribute('disabled');
            logoutButton.style.display = 'none';
        }
    };

    googleLoginButton.addEventListener('click', () => {
        googleLoginButton.setAttribute('disabled', true);
        ipcRenderer.send('auth-start', 'google');
    });

    microsoftLoginButton.addEventListener('click', () => {
        microsoftLoginButton.setAttribute('disabled', true);
        ipcRenderer.send('auth-start', 'microsoft');
    });

    logoutButton.addEventListener('click', () => {
        ipcRenderer.send('logout');
    });

    ipcRenderer.on('auth-success', (event, data) => {
        const { uniqueId } = data;
        document.getElementById('status').innerText = `Login successful! Your unique ID: ${uniqueId}`;
        ipcRenderer.send('validate-token', data.tokens);
        updateUI(true);
    });

    ipcRenderer.on('token-validity', (event, isValid) => {
        const statusText = isValid ? 'Token is valid and verified!' : 'Token validation failed.';
        document.getElementById('token-status').innerText = statusText;
    });

    ipcRenderer.on('auth-window-closed', () => {
        googleLoginButton.removeAttribute('disabled');
        microsoftLoginButton.removeAttribute('disabled');
    });

    ipcRenderer.on('logout-success', () => {
        document.getElementById('status').innerText = 'Logged out successfully!';
        document.getElementById('token-status').innerText = '';
        updateUI(false);
    });

    // Check if already logged in
    ipcRenderer.send('check-login');
};

window.onload = __onload__;
