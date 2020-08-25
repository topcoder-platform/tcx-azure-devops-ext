# Topcoder X - Azure Devops

## Prerequisites
- NodeJs and npm
- Extension packaging tool (TFX)
    
    We can install it by executing
    ```
    npm install -g tfx-cli
    ```

## Publish the extension

### Create a publisher

- Sign in to the Visual Studio Marketplace https://aka.ms/vsmarketplace-manage management portal

- If you don't already have a publisher, you'll be prompted to create one.

- In the Create Publisher form, enter your name in the publisher name field. The ID field should get set automatically based on your name.

### Configuring the extension

The following config parameters are supported, they are defined in `src/config.js` :

| Name | Description | Default |
| :------------------------------------- | :---------------------------------------- | :------------------------------ |
| DOMAIN                                   | We can switch it with the topcoder environtment | `topcoder-dev.com`                              |
| HOST_URL | The extension url. The address of the extension iframe. Change the publisher with your own | `https://{publisher}.gallerycdn.vsassets.io` |
| AUTH0_URL | The Auth0 URL | `https://topcoder-dev.auth0.com/oauth` |
| AUTH0_CLIENT_ID | The Auth0 client id |  |
| AUTH0_SCOPE | The Auth0 scope | `openid profile offline_access` |
| AUTH0_AUDIENCE | The Auth0 URL | `https://api.topcoder.com/` |
| POLL_TIMEOUT | How long we'll wait user to complete the login | `5 * 60 * 1000 // 5 mins` |
| POLL_INTERVAL | The poll interval | `10 * 1000 // 10 seconds` |

### Building extension package

- Open the extension manifest file (vss-extension/vss-extension.json) and set the value of the publisher field to the ID of your publisher. Also, set the HOST_URL in `src/config.js` with your publisher.

- Install node modules:
    ```
    cd vss-extension
    npm install
    cd ..
    npm install
    ```

- If we need to check the lint. Executing with the command:
    ```
    npm run lint
    ```

- Build the package:
    ```
    npm run build
    ```

The process will generate an `*.vsix` file in the `vss-extension` directory.

### Upload extension package

- From the management portal, select your publisher from the drop-down at the top of the page.

- Select New extension, and then select Azure DevOps.

- Drag and drop your file or select click to find your VSIX file, which you created in the previous packaging step, and then choose Upload.


### Install extension package

- Select your extension from the list, right-click, and choose Share/Unshare.

- Select Organization, and then enter the name of your organization. Select Enter.

- Close the panel.

- Your extension can now be installed into this organization.

- In the Marketplace, select your extension to open its overview page.

- Select Get it free to start the installation process. Select the organization you shared the extension with from the dropdown menu.

- Select Install.

### Updating the extension

If we need to update the extension. We can follow these steps:

- From the management portal, select your extension from the list, right-click, and choose Update.
- Drag and drop your file or select click to find your VSIX file, then click Upload.


## Verification

- Open dev.azure.com and login into your account where the extension is installed.
- Open a project. 
- Open board menu. We'll se `Topcoder X` menu.
- Click the `Topcoder X` menu to see the hub content.
- In order to make the hub able to fetch data from topcoder, we need to set the token. We can get it from challenges.topcoder-dev.com. Login to the website with account tonyj/appirio123. Open the browser development tool, open network tab. Click one of project to make the website load a challenge. Find the token from the development tool window, and copy the token. You can refer to the video demo for this step.
- Paste the token into the `Topcoder X` hub.
- Open Projects tab to see list of projects.
- Open Challenges tab to see list of challenges.
- Open Overview -> Dashboard.
- Add widget, find Topcoder X then add the widget.
- Topcoder Challenges will show on the widget.
- Open Board -> Work items.
- Open or create a work item.
- Click the actions menu on right of the work item page. We'll se `Send work item to topcoder`.

### Video demo

https://drive.google.com/file/d/1JXYA8O-HpYiVelRCXA-IwVGwAVdsE3eO/view?usp=sharing