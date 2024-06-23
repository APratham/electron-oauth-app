const { ipcRenderer } = require('electron');

const __onload__ = () => {
    const logoutButton = document.querySelector('ion-button#logout');

    logoutButton.addEventListener('click', () => {
        ipcRenderer.send('logout');
    });

    ipcRenderer.on('logout-success', () => {
        window.location.href = 'login.html';
    });
};

window.onload = __onload__;
