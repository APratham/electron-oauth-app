//FIXME: Add your secrets to this file and then rename this file to secrets.js
module.exports = {
    GOOGLE_OAUTH_CLIENT: {
      clientId: 'What you can get on https://console.cloud.google.com/apis/credentials/oauthclient/',
      clientSecret: 'What you can get on https://console.cloud.google.com/apis/credentials/oauthclient/'
    },
    MICROSOFT_OAUTH_CLIENT: {
      clientId: 'What you can get on https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade',
      clientSecret: 'What you can get on https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade',
      tenantId: 'What you can get on https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/Overview',
      redirectUri: 'http://localhost' // This is the default redirect URI for Electron apps, please change it if you have a different one
    }
  }