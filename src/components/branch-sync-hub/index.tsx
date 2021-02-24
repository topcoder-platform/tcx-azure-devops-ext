import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core';

import get from 'lodash/get';
import forEach from 'lodash/forEach';
import map from 'lodash/map';
import sortBy from 'lodash/sortBy';

import { Header } from "azure-devops-ui/Header";
import { Page } from "azure-devops-ui/Page";
import { ConditionalChildren } from "azure-devops-ui/ConditionalChildren";
import { ZeroData, ZeroDataActionType } from 'azure-devops-ui/ZeroData';

import { GitRepository } from 'TFS/VersionControl/Contracts';
import { ReposGetResponseData } from '@octokit/types';

import { poll } from '../../utils/token-poll';
import { GITHUB_CONFIG, GITLAB_CONFIG } from '../../config';
import { getAdoClients } from '../../services/azure';
import { GithubSyncDialog } from './dialogs/github-sync-dialog';
import { LoadingDialog } from './dialogs/loading-dialog';
import { AlertDialog, getDefaultState as getAlertDialogDefaultState } from './dialogs/alert-dialog';
import { TokenDialog, getDefaultState as getTokenDialogDefaultState } from './dialogs/token-dialog';
import BranchSyncCard, { getDefaultBranchSyncConfig, IBranchSyncConfig } from './branch-sync-card';
import { IGitlabRepo, initializeGitlabInstance } from '../../services/gitlab';
import {
  checkAuthorizationStatus,
  IGithubAuthInitResponse,
  initializeOctokitInstance,
  initiateAuthorizationFlow,
} from '../../services/github';

const useStyles = makeStyles({
  root: {
    width: '100%',
    height: '100%'
  },
  pageHeader: {
    '& .bolt-header-commandbar': {
      alignSelf: 'center'
    }
  },
  connectWithGithubButton: {
    marginTop: '16px',
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  zeroData: {
    alignItems: 'center',
    marginTop: -100
  },
  fullHeight: {
    height: '100%'
  },
  pageContent: {
    height: '100%',
    padding: '16px 32px'
  },
  unauthorizeExtensionText: {
    fontSize: '14px',
    marginTop: '16px'
  }
});

export interface BranchSyncHubDocument {
  githubToken: string
  gitlabToken: string
  azurePersonalAccessToken: string
  branchSyncConfigs: IBranchSyncConfig[]
};

const defaultState: BranchSyncHubDocument = {
  githubToken: '',
  gitlabToken: '',
  azurePersonalAccessToken: '',
  branchSyncConfigs: []
};


export const getBranchSyncHubConfigKey = () => `${VSS.getWebContext().project.id}_BRANCH_SYNC_HUB_STATE`;

export default function BranchSyncHub() {
  // Styles
  const classes = useStyles();

  // Loading
  const [loading, setLoading] = useState(true);
  // Is branch synchronization enabled?
  // Is Github Auth Dialog visible?
  const [githubAuthDialogOpen, setGithubAuthDialogOpen] = useState(false);
  // Alert Dialog State - Tracks whether it is open, it's text and it's title.
  const [alertDialogState, setAlertDialogState] = useState(getAlertDialogDefaultState());
  // Token Dialog State - Tracks whether it is open, it's text and it's title.
  const [tokenDialogState, setTokenDialogState] = useState(getTokenDialogDefaultState());
  // Stores the Github Auth Init Response.
  const [githubAuthInitResponse, setGithubAuthInitResponse] = useState<IGithubAuthInitResponse | undefined>();
  // Stores the Github OAuth token.
  const [githubToken, setGithubToken] = useState<string>(defaultState.githubToken);
  // Stores the Gitlab OAuth token.
  const [gitlabToken, setGitlabToken] = useState<string>(defaultState.gitlabToken);
  // Github Repositories
  const [githubRepositories, setGithubRepositories] = useState<ReposGetResponseData[]>([]);
  // Gitlab Repositories
  const [gitlabRepositories, setGitlabRepositories] = useState<IGitlabRepo[]>([]);
  // Azure Repositories
  const [azureRepositories, setAzureRepositories] = useState<GitRepository[]>([]);
  // Azure PAT Token
  const [azurePersonalAccessToken, setAzurePersonalAccessToken] = useState(defaultState.azurePersonalAccessToken);
  // Branch Sync Configs
  const [branchSyncConfigs, setBranchSyncConfigs] = useState<IBranchSyncConfig[]>(defaultState.branchSyncConfigs);

  // Tracks the document value
  const [document, setDocument] = useState<BranchSyncHubDocument | null>(null);

  /**
   * This effect retrieves the various state variables (githubToken, azureToken, etc.).
   */
  useEffect(() => {
    async function initFields() {
      // Get Extension Data service.
      const dataService = await VSS.getService<IExtensionDataService>(VSS.ServiceIds.ExtensionData);
      // Retrieve Doc Name
      const docName = getBranchSyncHubConfigKey();
      // Set up document tracking variable.
      try {
        const doc = await dataService.getValue<BranchSyncHubDocument>(docName, { scopeType: 'User' });
        setDocument(doc);
        setLoading(false);
      } catch (err) {
        setDocument(defaultState);
      }
    }
    initFields();
  }, []);

  /**
   * This effect is run when one of the state variable changes.
   * It saves the state in a VSS Document (hosted on Azure).
   */
  useEffect(() => {
    async function saveDocument() {
      // Get Extension Data service.
      const dataService = await VSS.getService<IExtensionDataService>(VSS.ServiceIds.ExtensionData);
      // Retrieve doc info from current state.
      const docName = getBranchSyncHubConfigKey();
      const docValue: BranchSyncHubDocument = {
        githubToken,
        gitlabToken,
        azurePersonalAccessToken,
        branchSyncConfigs
      };
      // Save the document
      const res = await dataService.setValue(docName, docValue, { scopeType: 'User' });
      setDocument(res);
    }
    if (loading) {
      return;
    }
    saveDocument();
  }, [githubToken, gitlabToken, azurePersonalAccessToken, branchSyncConfigs, loading]);

  /**
   * This effect runs whenever the document is updated/changed.
   * It updates the state from document.
   */
  useEffect(() => {
    async function updateStateFromDocument() {
      if (!document || !loading) {
        return;
      }
      const propertySetterMapping = {
        githubToken: setGithubToken,
        gitlabToken: setGitlabToken,
        azurePersonalAccessToken: setAzurePersonalAccessToken,
        branchSyncConfigs: setBranchSyncConfigs
      };
      forEach(propertySetterMapping, (setterFn, key) => {
        const valueFromDoc = get(document, key);
        if (valueFromDoc) {
          setterFn(valueFromDoc);
        }
      });
    }
    updateStateFromDocument();
  }, [document, loading]);

  /**
   * This effect is run anytime the github token changes.
   * It replaces the Octokit instance with a new one which would have the updated token.
   * It populates the Github Projects field once the token is available.
   */
  useEffect(() => {
    async function handleGithubTokenUpdate() {
      // Re-initialize Octokit
      const octokit = initializeOctokitInstance(githubToken);
      if (githubToken) {
        // Populate the Github Repositories Field
        let repos: any = await octokit.paginate(
          octokit.repos.listForAuthenticatedUser
        );
        repos = sortBy(repos, ['full_name']);
        repos = map(repos, o => ({ ...o, id: `${o.id}`, text: o.full_name }));
        setGithubRepositories(repos);
      }
    }
    handleGithubTokenUpdate();
  }, [githubToken]);

  /**
   * This effect is run anytime the gitlab token changes.
   * It replaces the Gitlab client with a new one which would have the updated token.
   * It populates the Gitlab Projects field once the token is available.
   */
  useEffect(() => {
    async function handleGitlabTokenUpdate() {
      // Re-initialize Octokit
      const client = initializeGitlabInstance(gitlabToken);
      if (gitlabToken) {
        // Populate the Gitlab Repositories Field
        let repos: any = await client.Projects.all({ membership: true, perPage: 300 });
        repos = sortBy(repos, ['path_with_namespace']);
        repos = map(repos, o => ({ ...o, id: `${o.id}`, text: o.path_with_namespace }));
        setGitlabRepositories(repos);
      }
    }
    handleGitlabTokenUpdate();
  }, [gitlabToken]);

  /**
   * This effect runs on page load.
   * It initialize the ADO Git Client and populates the Azure Repo selector.
   */
  useEffect(() => {
    async function getTokens() {
      const { adoGitClient } = await getAdoClients();
      const repositories = await adoGitClient.getRepositories();
      setAzureRepositories(map(repositories, o => ({ ...o, text: o.name })));
    }
    getTokens();
  }, []);

  /**
   * This is invoked when the user presses the "Connect With Github" button.
   * Starts and manages the process of connecting (authenticating) with Github.
   */
  async function connectWithGithub() {
    try {
      // Initialize vars and UI
      setGithubAuthInitResponse(undefined);
      setGithubAuthDialogOpen(true);
      // Send the Auth Initialization request and store the response
      const authRes = await initiateAuthorizationFlow();
      setGithubAuthInitResponse(authRes);
      // Poll for the access token
      const res = await poll<ReturnType<typeof checkAuthorizationStatus>>(
        checkAuthorizationStatus.bind(null, authRes),
        authRes.interval,
        authRes.expires_in
      );
      // Check for existence of access token
      const accessToken = get(res, 'data.access_token');
      if (!accessToken) {
        throw new Error(`Didn't find access token in response: ${JSON.stringify(res)}`);
      }
      // Store token and update UI
      setGithubToken(accessToken);
      setGithubAuthDialogOpen(false);
      showGithubAuthSuccessDialog();
    } catch (error) {
      // Authorization failed somewhere along the way. Handle error.
      console.error(error);
      setGithubAuthInitResponse(undefined);
      setGithubAuthDialogOpen(false);
      showGithubAuthFailureDialog();
    }
  }

  /**
   * Helps the user disconnect Github from the extension.
   */
  async function disconnectGithub() {
    const unauthorizeLink = `https://github.com/settings/connections/applications/${GITHUB_CONFIG.CLIENT_ID}`;
    setAlertDialogState({
      isOpen: true,
      title: 'Unauthorize Extension?',
      text: (
        <div>
          <p>If you proceed, the extension will remove the GitHub's credentials from it's storage.</p>
          <p><strong>
            <span>You can disassociate the credentials from your account </span>
            <a href={unauthorizeLink} target="_blank" rel="noopener noreferrer">here</a>.
            </strong></p>
        </div>
      ),
      onClose: (affirmation?: boolean) => {
        if (affirmation) {
          setGithubToken('');
        }
        setAlertDialogState((val) => ({ ...val, isOpen: false }));
      },
      danger: true,
      primaryButtonText: 'Proceed',
      secondaryButtonText: 'Abort'
    });
  }

  /**
   * Show the success dialog (once Github authorization succeeds)
   */
  function showGithubAuthSuccessDialog() {
    setAlertDialogState({
      isOpen: true,
      text: (
        <p>You may now set up Branch Synchronization.</p>
      ),
      title: 'Successfully authorized with GitHub!',
      onClose: () => {
        setAlertDialogState((val) => ({ ...val, isOpen: false }));
      },
      danger: false,
      primaryButtonText: 'OK',
      secondaryButtonText: ''
    });
  }

  /**
   * Show the failure dialog (if the Github authorization process fails)
   */
  function showGithubAuthFailureDialog() {
    setAlertDialogState({
      isOpen: true,
      text: (
        <p>Uh oh! Error occurred while trying to authorize. Please try again.</p>
      ),
      title: 'Github Authorization Error',
      onClose: () => {
        setAlertDialogState((val) => ({ ...val, isOpen: false }));
      },
      danger: true,
      primaryButtonText: 'OK',
      secondaryButtonText: '',
    });
  }

  /**
   * Shows a dialog that accepts an Azure PAT token
   */
  function showAzurePatDialog() {
    setTokenDialogState({
      isOpen: true,
      mode: 'ADO-Pipeline',
      externalLink: `${VSS.getWebContext().account.uri}_usersSettings/tokens`,
      onClose: (val) => {
        if (val) {
          setAzurePersonalAccessToken(val);
        }
        setTokenDialogState(val => ({
          ...val,
          isOpen: false
        }));
      }
    });
  }

  /**
   * Shows a dialog that accepts a Gitlab PAT token
   */
  function showGitlabPatDialog() {
    setTokenDialogState({
      isOpen: true,
      mode: 'GitLab',
      externalLink: GITLAB_CONFIG.PAT_DASHBOARD_LINK,
      onClose: (val) => {
        if (val) {
          setGitlabToken(val);
        }
        setTokenDialogState(val => ({
          ...val,
          isOpen: false
        }));
      }
    });
  }


  /**
   * Allows adding an additional Branch Sync Config
   */
  function addBranchSyncConfig() {
    setBranchSyncConfigs((val) => [...val, getDefaultBranchSyncConfig()]);
  }

  /**
   * Saves the state for a particular branch sync config.
   * @param config Branch Sync Config
   * @param idx Index of Branch Sync Config
   */
  function saveBranchSyncConfig(config: IBranchSyncConfig, idx: number) {
    setBranchSyncConfigs([
      ...branchSyncConfigs.slice(0, idx),
      config,
      ...branchSyncConfigs.slice(idx + 1),
    ]);
  }

  /**
   * Deletes a particular branch sync config.
   * @param idx Index of Branch Sync Config
   */
  function deleteSyncConfig(idx: number) {
    setBranchSyncConfigs([
      ...branchSyncConfigs.slice(0, idx),
      ...branchSyncConfigs.slice(idx + 1),
    ]);
  }

  /**
   * Render UI
   */
  return (<>
    {/* Main Page */}
    <ConditionalChildren renderChildren={!loading}>
      <Page className={classes.root}>
        {/* Page Header */}
        <Header
          className={classes.pageHeader}
          title={<h1>Branch Synchronization</h1>}
          commandBarItems={[
            {
              id: 'add-button',
              text: 'Add Configuration',
              iconProps: {
                iconName: 'Add',
              },
              isPrimary: true,
              important: true,
              onActivate: () => { addBranchSyncConfig(); }
            },
            {
              iconProps: {
                iconName: 'Lock'
              },
              text: 'Reset Azure PAT Token',
              id: 'reset-azure-pat-token',
              important: false,
              onActivate: () => setAzurePersonalAccessToken('')
            },
            {
              iconProps: {
                iconName: 'Lock'
              },
              text: 'Reset GitLab PAT Token',
              id: 'reset-gitlab-pat-token',
              important: false,
              onActivate: () => setGitlabToken('')
            },
            {
              iconProps: {
                iconName: 'Delete'
              },
              text: 'Unauthorize Extension',
              id: 'unauthorize-extension',
              important: false,
              onActivate: () => { disconnectGithub(); }
            }
          ]}
        />
        {/* Page Contents */}
        <div className={classes.pageContent}>
          {/* No Github authorization. Show ZeroData component. */}
          <ConditionalChildren renderChildren={!githubToken}>
            <ZeroData
              className={classes.zeroData + ' ' + classes.fullHeight}
              imagePath={require('../../static/no_github_connection.png')}
              imageAltText="Not connected to Github"
              secondaryText="Synchronize branches and commits between your Github and Azure DevOps repositories."
              primaryText="Connect Github to Topcoder X"
              actionText="Connect Github to TCX"
              actionType={ZeroDataActionType.ctaButton}
              onActionClick={() => connectWithGithub()}
            />
          </ConditionalChildren>

          {/* Extension is authorized with Github. Show Branch Synchronization data. */}
          <ConditionalChildren renderChildren={!!(githubToken)}>
            {/* Branch Synchronization Cards */}
            {branchSyncConfigs.map((branchSyncConfig, idx) => (
              <BranchSyncCard
                azureRepositories={azureRepositories}
                githubRepositories={githubRepositories}
                gitlabRepositories={gitlabRepositories}
                githubToken={githubToken}
                azurePersonalAccessToken={azurePersonalAccessToken}
                gitlabToken={gitlabToken}
                setAzurePAT={() => showAzurePatDialog()}
                requestGitlabToken={() => showGitlabPatDialog()}
                cardState={branchSyncConfig}
                onSaveState={(config: IBranchSyncConfig) => saveBranchSyncConfig(config, idx)}
                onDelete={() => deleteSyncConfig(idx)}
                key={idx}
              />
            ))}
          </ConditionalChildren>
        </div>
      </Page>
    </ConditionalChildren>

    {/* Simple Loading Dialog */}
    <LoadingDialog open={loading} />

    {/* Github Auth Dialog */}
    <GithubSyncDialog
      isOpen={githubAuthDialogOpen}
      onClose={() => setGithubAuthDialogOpen(false)}
      initResponse={githubAuthInitResponse}
    />

    {/* Alert Dialog */}
    <AlertDialog {...alertDialogState} />

    {/* Azure PAT Token */}
    <TokenDialog {...tokenDialogState} />
  </>);
}
