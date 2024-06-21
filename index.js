const { ipcRenderer } = require('electron');

const __onload__ = () => {
  const loginButton = document.querySelector('ion-button#login');
  const logoutButton = document.querySelector('ion-button#logout');

  const updateUI = (isLoggedIn) => {
    if (isLoggedIn) {
      loginButton.style.display = 'none';
      logoutButton.style.display = 'inline-block';
    } else {
      loginButton.style.display = 'inline-block';
      loginButton.removeAttribute('disabled');
      logoutButton.style.display = 'none';
    }
  };

  loginButton.addEventListener('click', () => {
    loginButton.setAttribute('disabled', true);
    ipcRenderer.send('auth-start');
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
    loginButton.removeAttribute('disabled');
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
