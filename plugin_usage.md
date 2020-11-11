# Plugin usage

The Topcoder-X Azure Devops plugin has a number of features for syncing items from Azure to Topcoder's platform, as well as code to and from Github

## Installation

You can build your own version of the plugin using the steps here:  https://github.com/topcoder-platform/tcx-azure-devops-ext

Alternatively, you *should* be able to install this plugin into your Azure Devops organization.  This built extension on the marketplace is always built from the latest code in the `develop` branch:

https://marketplace.visualstudio.com/items?itemName=JustinGasperTopcodertest.topcoder-x&targetId=55d0f0a3-e477-4c05-b81f-bc7280871224&utm_source=vstsproduct&utm_medium=ExtHubManageList

# Features

Once you have installed the plugin in your organization, you'll see:

* New Dashboard widgets (`Topcoder X` and `Topcoder X Report`)
* New Topcoder-X menu options on work items
* New Topcoder-X tab on work items
* New Topcoder-X section on work items
* New Topcoder-X section under `Boards`
* New Branch Synchronization section under `Boards`

## Walkthrough videos

Here are a couple quick and dirty walkthrough videos that show the various functionalities:

- [Walkthrough 1](https://www.dropbox.com/s/k063g2bn8sm9ekj/Screen%20Recording%202020-11-11%20at%2016.28.39.mov?dl=1)
- [Walkthrough 2](https://www.dropbox.com/s/3a9lxfjakat8hhf/Screen%20Recording%202020-11-11%20at%2016.32.39.mov?dl=1)

## Setup

Initial setup is done under `Boards`, in the `Topcoder X` option.  You'll need to login with your Topcoder account.  Note that in dev you can use `TonyJ` / `appirio123`

Under `Topcoder X` under `Boards`, you can see projects, challenges, and settings

## Widgets

There are two Dashboard widgets:

* `Topcoder X`, which shows the challenges for a project
* `Topcoder X Report`, which shows reports from Topcoder Direct for a project, and likely doesn't work real well.

## Work item section

On the work items is a new section next to description called `Topcoder-X`, which is filled in with information after the `Topcoder-X` tab on the work item is used to send a work item to Topcoder as a challenge.

The documentation for that can be found here:

* https://github.com/topcoder-platform/tcx-azure-devops-ext/issues/16
* https://github.com/topcoder-platform/tcx-azure-devops-ext/issues/17
* https://github.com/topcoder-platform/tcx-azure-devops-ext/issues/26

#### Screenshots

* [Screenshot 1](https://www.dropbox.com/s/0zmpzj7ldyocyjh/Screen_Shot_2020-11-11_at_16_50_53.png?dl=1)
* [Screenshot 2](https://www.dropbox.com/s/m9um9co1k5c0xvf/Screen_Shot_2020-11-11_at_16_50_25.png?dl=1)

## Branch Synchronization

The `Branch Synchronization` option is used to sync a repo from Azure to Github and vice versa.  Once it's set up, any commits made to the Azure branch should be automatically pushed, via an Azure pipeline, to Github.  Any commits made to the Github branch should be automatically pushed to Azure, via a Github action.
