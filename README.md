# Electron OAuth App


## Overview

Electron OAuth App is a cross-platform desktop application that demonstrates how to implement OAuth authentication using Google Sign-In. The app is built with Electron, Ionic, and Angular, providing a seamless login/logout flow with OAuth 2.0. This is built as part of the project "AIOps and Predictive Analytics for Container Logs Monitoring". Project files can be found [here](https://github.com/APratham/AIOps-containers) once they're made open source. Check the [project website](https://apratham.github.io/AIOps-containers) for more information.

## Status
This application and the project it's a part of are currently in active development stage. Basic OAuth login and logout functionalities are implemented in the application, and more improvements and additional features are planned.

## Purpose
The primary purpose of this application is to serve as a reference implementation for developers looking to integrate OAuth authentication into their Electron applications. It showcases the use of Ionic components for a consistent UI and provides a clear example of handling OAuth flows in a desktop environment.

## Usage
### Prerequisites
- Node.js (v12 or higher)
- npm (v6 or higher)
- Google OAuth credentials

### Installation
1. Clone the repository:
    ```bash
    git clone https://github.com/your-username/electron-oauth-app.git
    cd electron-oauth-app
    ```
2. Install dependencies:
    ```bash
    npm install
    ```
3. Run the application:
    ```bash
    npm run start
    ```

### Google OAuth Setup
1. Create a new project on the [Google Cloud Console](https://console.cloud.google.com/).
2. Set up OAuth 2.0 credentials and obtain the client ID.
3. Add the client ID and client secret to `secrets.example.js` file and then rename it to `secrets.js`


## Contributions
Contributions to this repository are not allowed as it is part of a project that is in active development.

## Contact
For questions or issues related to this branch, please contact the [Project Team](https://github.com/APratham/AIOps-containers/tree/main?tab=readme-ov-file#project-team).

## License
This application and the project are licensed under the [GNU Affero General Public License v3](https://opensource.org/license/agpl-v3). See the [LICENSE](LICENSE) file for more details.