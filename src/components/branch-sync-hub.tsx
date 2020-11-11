import React, { useEffect, useState } from 'react';
import copy from 'clipboard-copy';
import { makeStyles } from '@material-ui/core';

import get from 'lodash/get';
import forEach from 'lodash/forEach';
import findIndex from 'lodash/findIndex';
import map from 'lodash/map';
import sortBy from 'lodash/sortBy';
import isNil from 'lodash/isNil';
import every from 'lodash/every';
import template from 'lodash/template';
import kebabCase from 'lodash/kebabCase';

import { CustomHeader, Header, HeaderTitleArea } from "azure-devops-ui/Header";
import { Page } from "azure-devops-ui/Page";
import { Button } from "azure-devops-ui/Button";
import { Link } from "azure-devops-ui/Link";
import { Spinner, SpinnerSize } from "azure-devops-ui/Spinner";
import { CustomDialog, Dialog } from "azure-devops-ui/Dialog";
import { PanelContent, PanelFooter } from 'azure-devops-ui/Panel';
import { ConditionalChildren } from "azure-devops-ui/ConditionalChildren";
import { TextField, TextFieldStyle, TextFieldWidth } from 'azure-devops-ui/TextField';
import { IconSize } from 'azure-devops-ui/Icon';
import { ZeroData, ZeroDataActionType } from 'azure-devops-ui/ZeroData';
import { Dropdown } from 'azure-devops-ui/Dropdown';
import { Toggle } from 'azure-devops-ui/Toggle';
import { DropdownSelection } from 'azure-devops-ui/Utilities/DropdownSelection';

import { IterableElement } from 'type-fest';
import { GitBranchStats, GitRepository } from 'TFS/VersionControl/Contracts';
import {
  ReposGetResponseData,
  ReposListBranchesResponseData
} from '@octokit/types';

import { poll } from '../utils/token-poll';
import { AZURE_CONFIG, GITHUB_CONFIG } from '../config';
import {
  checkAuthorizationStatus,
  getOctokitInstance,
  IGithubAuthInitResponse,
  initializeOctokitInstance,
  initiateAuthorizationFlow,
  createOrUpdateRepoSecret,
  createOrUpdateGitHubFile,
  waitForWorkflow
} from '../services/github';
import {
  createBuildDefinition,
  createOrUpdateAzureFile,
  getAdoClients,
  triggerBuild,
  waitForBuild
} from '../services/azure';

const useStyles = makeStyles({
  root: {
    width: '100%',
    height: '100%'
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
  infoGrid: {
    display: 'grid',
    maxWidth: '800px',
    gridTemplateColumns: '200px auto',
    gridAutoRows: '30px',
    alignItems: 'center',
    rowGap: '8px',
    marginTop: 12,
    marginBottom: 12,
    fontSize: 14
  },
  branchSynchronizationStatus: {
    fontWeight: 'bold'
  },
  branchSynchronizationControlButtonContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    maxWidth: '800px',
    marginBottom: '32px'
  },
  branchSynchronizationControlButton: {
    marginTop: '16px',
    width: '100%',
    maxWidth: '300px'
  },
  patTokenFieldContainer: {
    display: 'flex'
  },
  patTokenField: {
    flex: '1',
    borderBottomRightRadius: 0,
    borderTopRightRadius: 0
  },
  patTokenHelpButton: {
    height: '29px',
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    paddingTop: 5,
    paddingBottom: 5
  },
  unauthorizeExtensionText: {
    fontSize: '14px',
    marginTop: '16px'
  }
});

const dialogStyles = makeStyles({
  title: {
    height: "500px",
    width: "500px",
    maxHeight: "32px"
  },
  panelContent: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: '14px'
  },
  panelContentWithMargin: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: '14px',
    marginTop: '16px',
    marginBottom: '16px'
  },
  branchSynchronizationPanelContent: {
    minHeight: '32px !important',
    justifyContent: 'center'
  },
  textParagraph: {
    marginTop: '4px',
    marginBottom: '4px'
  },
  deviceCodeContainer: {
    display: 'flex',
    flexDirection: 'row',
    marginTop: '4px',
  },
  deviceCodeTextFieldContainer: {
    flex: '1'
  },
  deviceCodeTextField: {
    padding: '4px 0'
  },
  label: {
    marginTop: '12px'
  },
  boldFont: {
    fontWeight: 'bold'
  },
  alertButton: {
    background: 'var(--palette-error, rgba(232, 17, 35, 1)) !important'
  }
});

const defaultState = {
  branchSynchronization: false,
  githubToken: '',
  githubRepository: null,
  githubBranch: null,
  azureRepository: null,
  azureBranch: null,
  azurePersonalAccessToken: '',
  twoWaySynchronization: false
};

// Dropdown Selection
const githubRepoSelection = new DropdownSelection();
const githubBranchSelection = new DropdownSelection();
const azureRepoSelection = new DropdownSelection();
const azureBranchSelection = new DropdownSelection();

export default function BranchSyncHub() {
  // Styles
  const classes = useStyles();
  const dialogClasses = dialogStyles();

  // Loading
  const [loading, setLoading] = useState(true);
  // Is branch synchronization enabled?
  const [branchSynchronization, _setBranchSynchronization] = useState(defaultState.branchSynchronization);
  // Is Github Auth Dialog visible?
  const [githubAuthDialogOpen, setGithubAuthDialogOpen] = useState(false);
  // Is Branch Synchronization setup in progress
  const [branchSynchronizationSetupInProgress, setBranchSynchronizationSetupInProgress] = useState(false);
  // Alert Dialog State - Tracks whether it is open, it's text and it's title.
  const [alertDialogState, setAlertDialogState] = useState({
    open: false,
    text: <></>,
    title: '',
    callback: (_affirmation: boolean) => {},
    confirmationDialog: false,
    primaryButtonText: '',
    secondaryButtonText: '',
    danger: false
  });
  // Stores the Github Auth Init Response.
  const [githubAuthInitResponse, setGithubAuthInitResponse] = useState<null | IGithubAuthInitResponse>(null);
  // Stores the Github OAuth token.
  const [githubToken, setGithubToken] = useState<string>(defaultState.githubToken);
  // Github Repositories
  const [githubRepositories, setGithubRepositories] = useState<ReposGetResponseData[]>([]);
  const [githubRepository, setGithubRepository] = useState<ReposGetResponseData | null>(null);
  // Github Repository Branches
  const [githubBranches, setGithubBranches] = useState<ReposListBranchesResponseData>([]);
  const [githubBranch, setGithubBranch] = useState<IterableElement<ReposListBranchesResponseData> | null>(null);
  // Azure Repositories
  const [azureRepositories, setAzureRepositories] = useState<GitRepository[]>([]);
  const [azureRepository, setAzureRepository] = useState<GitRepository | null>(null);
  // Azure Repository Branches
  const [azureBranches, setAzureBranches] = useState<GitBranchStats[] | null>([]);
  const [azureBranch, setAzureBranch] = useState<GitBranchStats | null>(null);
  // Azure Personal Access Token
  const [azurePersonalAccessToken, setAzurePersonalAccessToken] = useState('');
  // 2-way synchronization
  const [twoWaySynchronization, setTwoWaySynchronization] = useState(false);
  // Whether the "Enable Branch Synchronization" button is enabled
  const [allowBranchSynchronization, setAllowBranchSynchronization] = useState(false);

  // Tracks the document value
  interface BranchSyncHubDocument {
    branchSynchronization: typeof branchSynchronization;
    githubToken: typeof githubToken;
    githubRepository: typeof githubRepository,
    githubBranch: typeof githubBranch,
    azureRepository: typeof azureRepository,
    azureBranch: typeof azureBranch,
    azurePersonalAccessToken: typeof azurePersonalAccessToken,
    twoWaySynchronization: typeof twoWaySynchronization
  };
  const [document, setDocument] = useState<BranchSyncHubDocument | null>(null);

  /**
   * This effect retrieves the various state variables (githubToken, azureToken, etc.).
   */
  useEffect(() => {
    async function initFields() {
      // Get Extension Data service.
      const dataService = await VSS.getService<IExtensionDataService>(VSS.ServiceIds.ExtensionData);
      // Project ID is used as prefix in all field keys, store it as constant.
      const ctxProjectId = VSS.getWebContext().project.id;
      // Retrieve state variables.
      const docName = `${ctxProjectId}_BRANCH_SYNC_HUB_STATE`;
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
      // Project ID is used as prefix in all field keys, store it as constant.
      const ctxProjectId = VSS.getWebContext().project.id;
      // Retrieve doc info from current state.
      const docName = `${ctxProjectId}_BRANCH_SYNC_HUB_STATE`;
      const docValue: BranchSyncHubDocument = {
        branchSynchronization,
        githubToken,
        githubRepository,
        githubBranch,
        azureRepository,
        azureBranch,
        azurePersonalAccessToken,
        twoWaySynchronization
      };
      // Save the document
      const res = await dataService.setValue(docName, docValue, { scopeType: 'User' });
      setDocument(res);
    }
    if (loading) {
      return;
    }
    saveDocument();
  }, [
    branchSynchronization,
    githubToken,
    loading,
    githubRepository,
    githubBranch,
    azureRepository,
    azureBranch,
    azurePersonalAccessToken,
    twoWaySynchronization
  ]);

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
        branchSynchronization: _setBranchSynchronization,
        githubToken: setGithubToken,
        githubRepository: setGithubRepository,
        githubBranch: setGithubBranch,
        azureRepository: setAzureRepository,
        azureBranch: setAzureBranch,
        azurePersonalAccessToken: setAzurePersonalAccessToken,
        twoWaySynchronization: setTwoWaySynchronization
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
        let repos: any = await octokit.repos.listForAuthenticatedUser();
        repos = sortBy(repos.data, ['full_name']);
        repos = map(repos, o => ({ ...o, id: `${o.id}`, text: o.full_name }));
        console.log(repos);
        setGithubRepositories(repos);
      }
    }
    handleGithubTokenUpdate();
  }, [githubToken, githubRepository]);

  /**
   * The following effect will pre-select the Github Repository dropdown options once the page is loaded.
   */
  useEffect(() => {
    if (githubRepositories && githubRepositories.length > 0 && !isNil(githubRepository)) {
      githubRepoSelection.select(findIndex(githubRepositories, { id: githubRepository.id }));
    }
  }, [githubRepositories, githubRepository]);

  /**
   * The following effect will pre-select the Github Branch dropdown options once the page is loaded.
   */
  useEffect(() => {
    if (githubBranches && githubBranches.length > 0 && !isNil(githubBranch)) {
      githubBranchSelection.select(findIndex(githubBranches, { id: githubBranch.name } as any));
    }
  }, [githubBranches, githubBranch]);

  /**
   * The following effect will pre-select the Azure Repository dropdown options once the page is loaded.
   */
  useEffect(() => {
    if (azureRepositories && azureRepositories.length > 0 && !isNil(azureRepository)) {
      azureRepoSelection.select(findIndex(azureRepositories, { id: azureRepository.id }));
    }
  }, [azureRepositories, azureRepository]);

  /**
   * The following effect will pre-select the Azure Branch dropdown options once the page is loaded.
   */
  useEffect(() => {
    if (azureBranches && azureBranches.length > 0 && !isNil(azureBranch)) {
      azureBranchSelection.select(findIndex(azureBranches, { name: azureBranch.name }));
    }
  }, [azureBranches, azureBranch]);

  /**
   * This effect is run any time the user selects a Github Repository.
   * It populates the Github Branch selector.
   */
  useEffect(() => {
    async function getBranchesForGithubRepository() {
      // Get octokit instance
      const octokit = getOctokitInstance();
      // Fetch the repo's name and owner.
      const owner = get(githubRepository, 'owner.login');
      const repo = get(githubRepository, 'name');
      // Stop if either are not found.
      if (!owner || !repo) {
        return;
      }
      // Populate the Github Branch selector.
      const branchListRes = await octokit.repos.listBranches({ owner, repo });
      let branches = branchListRes.data;
      branches = sortBy(branches, ['name']);
      branches = map(branches, o => ({ ...o, id: o.name, text: o.name }));
      setGithubBranches(branches);
    }
    getBranchesForGithubRepository();
  }, [githubRepository]);

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
   * This effect is run any time the user selects an Azure Repository.
   * It populates the Azure Branch selector.
   */
  useEffect(() => {
    async function getBranchesForAzureRepository() {
      // Fetch the repo's ID, and stop if it isn't found.
      const repoId = get(azureRepository, 'id');
      // Stop if either are not found.
      if (!repoId) {
        return;
      }
      const { adoGitClient } = await getAdoClients();
      const branchListRes = await adoGitClient.getBranches(repoId);
      let branches = sortBy(branchListRes, ['name']);
      branches = map(branches, o => ({ ...o, id: o.name, text: o.name }));
      setAzureBranches(branches);
    }
    getBranchesForAzureRepository();
  }, [azureRepository]);

  /**
   * This effect runs when the user alters the Branch Validation Form.
   * It validates the various inputs and selectors and checks if the user can
   * be allowed to enable branch synchronization.
   */
  useEffect(() => {
    const validationParameters = [
      githubBranch,
      githubRepository,
      azureBranch,
      azureRepository,
      azurePersonalAccessToken
    ];
    const validated = every(map(validationParameters, (val) => !!(val)));
    setAllowBranchSynchronization(validated);
  }, [azureBranch, azureRepository, githubBranch, githubRepository, azurePersonalAccessToken]);

  /**
   * This is invoked when the user presses the "Connect With Github" button.
   * Starts and manages the process of connecting (authenticating) with Github.
   */
  async function connectWithGithub() {
    try {
      // Initialize vars and UI
      setGithubAuthInitResponse(null);
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
      setGithubAuthInitResponse(null);
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
      open: true,
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
      callback: (affirmation) => {
        if (affirmation) {
          setGithubToken('');
        }
      },
      confirmationDialog: true,
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
      open: true,
      text: (
        <p>You may now set up Branch Synchronization.</p>
      ),
      title: 'Successfully authorized with GitHub!',
      callback: () => {},
      confirmationDialog: false,
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
      open: true,
      text: (
        <p>Uh oh! Error occurred while trying to authorize. Please try again.</p>
      ),
      title: 'Github Authorization Error',
      callback: () => {},
      confirmationDialog: false,
      danger: true,
      primaryButtonText: 'OK',
      secondaryButtonText: '',
    });
  }

  function showPatTokenHelpAlert() {
    const patManagerLink = `${VSS.getWebContext().account.uri}_usersSettings/tokens`;
    setAlertDialogState({
      open: true,
      title: 'About the Azure Personal Access Token',
      text: (<>
        <div>
          The Personal Access Token is required to allow the GitHub commits to be pushed to your selected Azure DevOps repo.
        </div>
        <p>
            <span>You can generate a PAT </span>
            <a href={patManagerLink} target="_blank" rel="noopener noreferrer">here</a>.
        </p>
      </>),
      callback: () => {},
      confirmationDialog: false,
      danger: false,
      primaryButtonText: 'Ok',
      secondaryButtonText: ''
    });
  }

  /**
   * Deselect the selected Github branch
   */
  function deselectGithubBranch() {
    setGithubBranch(null);
    githubBranchSelection.value = [];
  }

  /**
   * Deselect the selected Azure branch
   */
  function deselectAzureBranch() {
    setAzureBranch(null);
    azureBranchSelection.value = [];
  }

  async function setBranchSynchronization(value: boolean) {
    // Do nothing if branch synchronization is being disabled
    if (!value) {
      _setBranchSynchronization(value);
      return;
    }
    try {
      setBranchSynchronizationSetupInProgress(true);
      await setupGithubWorkflow();
      if (twoWaySynchronization) {
        await setupAzureWorkflow();
      }
      // Update UI
      _setBranchSynchronization(true);
      setAlertDialogState({
        open: true,
        text: (
          <p>Branch Synchronization setup has completed successfully.</p>
        ),
        title: 'Success!',
        callback: () => {},
        confirmationDialog: false,
        danger: false,
        primaryButtonText: 'OK',
        secondaryButtonText: ''
      });
    } catch (error) {
      console.error(error);
      setAlertDialogState({
        open: true,
        text: (
          <p>Uh oh! Error occurred while trying to setup branch synchronization. Please try again.</p>
        ),
        title: 'Error!',
        callback: () => {},
        confirmationDialog: false,
        danger: true,
        primaryButtonText: 'OK',
        secondaryButtonText: '',
      });
    } finally {
      setBranchSynchronizationSetupInProgress(false);
    }
  }

  /**
   * Setup Azure Workflow which will push ADO commits to Github.
   */
  async function setupAzureWorkflow() {
    // Substitute values in templates to get manifest path and manifest contents
    const templateSettings = {
      interpolate: /<%=([\s\S]+?)%>/g
    };
    const manifestPath = template(AZURE_CONFIG.MANIFEST_PATH, templateSettings)({
      repoName: kebabCase(githubRepository!.name),
      repoBranch: kebabCase(githubBranch!.name)
    });
    const manifestContents = template(AZURE_CONFIG.MANIFEST_TEMPLATE, templateSettings)({
      secretName: AZURE_CONFIG.SECRET_NAME,
      repoUrl: get(githubRepository!, 'clone_url').replace('https://', ''),
      azureBranchName: azureBranch!.name,
      githubBranchName: githubBranch!.name
    });
    // Upload the pipeline definition
    await createOrUpdateAzureFile(
      manifestPath,
      manifestContents,
      azureRepository!,
      azureBranch!,
      AZURE_CONFIG.COMMIT_MESSAGE
    );
    // Create the build pipeline
    const pipeline = await createBuildDefinition(
      manifestPath,
      azureRepository!,
      azureBranch!,
      githubToken
    );
    // Trigger a build
    const build = await triggerBuild(
      pipeline.id,
      azureRepository!,
      azureBranch!
    );
    // Wait for the build to complete
    await waitForBuild(build, 3, 180);
  }

  /**
   * Setup Github Workflow which will push Github commits to ADO.
   */
  async function setupGithubWorkflow() {
    // Store the PAT as a secret
    await createOrUpdateRepoSecret(
      githubRepository!,
      GITHUB_CONFIG.SECRET_NAME,
      azurePersonalAccessToken
    );
    // Substitute values in templates to get manifest path and manifest contents
    const templateSettings = { interpolate: /<%=([\s\S]+?)%>/g };
    const manifestPath = template(GITHUB_CONFIG.MANIFEST_PATH, templateSettings)({
      repoName: kebabCase(azureRepository!.name),
      repoBranch: kebabCase(azureBranch!.name)
    });
    const manifestContentTemplate = template(GITHUB_CONFIG.MANIFEST_TEMPLATE, templateSettings);
    const manifestContent = manifestContentTemplate({
      secretName: GITHUB_CONFIG.SECRET_NAME,
      repoUrl: get(azureRepository, 'webUrl').replace('https://', ''),
      azureBranchName: azureBranch!.name,
      githubBranchName: githubBranch!.name
    });
    // Create or update the Workflow manifest
    await createOrUpdateGitHubFile(
      manifestPath,
      manifestContent,
      githubRepository!,
      githubBranch!,
      GITHUB_CONFIG.COMMIT_MESSAGE
    );
    // Wait for the Workflow to complete
    await waitForWorkflow(
      githubRepository!,
      manifestPath,
      3,
      180
    );
  }

  /**
   * Render UI
   */
  return (<>
    {/* Main Page */}
    <ConditionalChildren renderChildren={!loading}>
      <Page className={classes.root}>
        {/* Page Header */}
        <Header title={<h1>Branch Synchronization</h1>} />
        {/* Page Contents */}
        <div className={classes.pageContent}>
          {/* No Github authorization. Show ZeroData component. */}
          <ConditionalChildren renderChildren={!githubToken}>
            <ZeroData
              className={classes.zeroData + ' ' + classes.fullHeight}
              imagePath={require('../static/no_github_connection.png')}
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
            <h2>Github Synchronization</h2>
            <div className={classes.infoGrid}>
              {/* Branch Synchronization */}
              <div><label>Branch Synchronization</label></div>
              <div className={classes.branchSynchronizationStatus}>
                { branchSynchronization ? 'Enabled' : 'Disabled' }
              </div>
              {/* Github Repo */}
              <div><label>Github Repo</label></div>
              <Dropdown
                placeholder="Select Github Repo"
                items={githubRepositories as any}
                disabled={branchSynchronization}
                selection={githubRepoSelection}
                onSelect={(_, e) => {
                  setGithubRepository(e as any);
                  deselectGithubBranch();
                }}
              />
              {/* Github Branch */}
              <div><label>Github Branch</label></div>
              <Dropdown
                placeholder="Select Github Branch"
                items={githubBranches as any}
                disabled={!githubRepository || branchSynchronization}
                selection={githubBranchSelection}
                onSelect={(_, e) => setGithubBranch(e as any)}
              />
              {/* Azure Repo */}
              <div><label>Azure Repo</label></div>
              <Dropdown
                placeholder="Select Azure Repo"
                items={azureRepositories}
                disabled={branchSynchronization}
                selection={azureRepoSelection}
                onSelect={(_, e) => {
                  setAzureRepository(e as any);
                  deselectAzureBranch();
                }}
              />
              {/* Azure Branch */}
              <div><label>Azure Branch</label></div>
              <Dropdown
                placeholder="Select Azure Branch"
                items={azureBranches! as any}
                disabled={!azureRepository || branchSynchronization}
                selection={azureBranchSelection}
                onSelect={(_, e) => setAzureBranch(e as any)}
              />
              {/* Azure PAT Token */}
              <div><label>Azure PAT Token</label></div>
              <div className={classes.patTokenFieldContainer}>
                <TextField
                  containerClassName={classes.patTokenField}
                  className={classes.patTokenField}
                  placeholder="Enter PAT Token"
                  value={azurePersonalAccessToken}
                  onChange={event => setAzurePersonalAccessToken(event.target.value)}
                  disabled={branchSynchronization}
                  readOnly={branchSynchronization}
                />
                <Button
                  className={classes.patTokenHelpButton}
                  primary={true}
                  text="?"
                  onClick={() => showPatTokenHelpAlert()}
                />
              </div>
              {/* Two-Way Synchronization */}
              <div><label>Two-Way Synchronization</label></div>
              <Toggle
                offText={"Only push commits from Github to Azure DevOps."}
                onText={"Push commits from Github to Azure DevOps and vice versa."}
                checked={twoWaySynchronization}
                disabled={branchSynchronization}
                onChange={(_event, value) => setTwoWaySynchronization(value)}
              />
            </div>
            {/* Apply Button */}
            <div className={classes.branchSynchronizationControlButtonContainer}>
              <Button
                className={classes.branchSynchronizationControlButton}
                text={`${(branchSynchronization ? 'Disable' : 'Enable')} Branch Synchronization`}
                primary={!branchSynchronization}
                disabled={!branchSynchronization && !allowBranchSynchronization}
                onClick={() => setBranchSynchronization(!branchSynchronization)}
              />
            </div>
            {/* Unauthorize Section */}
            <div className="separator-line-top">
              <h2>Unauthorize Extension</h2>
              <p className={classes.unauthorizeExtensionText}>
                When you unauthorize the extension, it will no longer be able to access any part of your GitHub account.
              </p>
              <Button
                className={classes.branchSynchronizationControlButton}
                text='Unauthorize Extension'
                danger={true}
                onClick={() => disconnectGithub()}
              />
            </div>
          </ConditionalChildren>
        </div>
      </Page>
    </ConditionalChildren>

    {/* Simple Loading Dialog */}
    <ConditionalChildren renderChildren={loading}>
      <CustomDialog onDismiss={() => {}} modal={true}>
        <PanelFooter showSeparator className="body-m">
          <Spinner size={SpinnerSize.large} />
        </PanelFooter>
      </CustomDialog>
    </ConditionalChildren>

    {/* Github Auth Dialog */}
    <ConditionalChildren renderChildren={githubAuthDialogOpen}>
      <CustomDialog onDismiss={() => setGithubAuthDialogOpen(false)} modal={true}>
        <CustomHeader className="bolt-header-with-commandbar" separator>
          <HeaderTitleArea>
            <div className="flex-grow scroll-hidden" style={{ marginRight: "16px" }}>
              <div className={"title-m " + dialogClasses.title}>Github Authorization</div>
            </div>
          </HeaderTitleArea>
        </CustomHeader>
        <PanelContent className={dialogClasses.panelContentWithMargin}>
          {!githubAuthInitResponse && <>
            <div className={dialogClasses.textParagraph}>
              Contacting Github to initialize authorization procedure. Please wait.
            </div>
          </>}
          {githubAuthInitResponse && <>
            <div className={dialogClasses.textParagraph}>
              Please authorize the extension to access the Github repository.
            </div>
            <div className={dialogClasses.textParagraph}>
              To authorize, open the Verification link listed below and paste in the User Code to complete the authorization process.
            </div>
            <label className={dialogClasses.label}>Verification Link</label>
            <div className={dialogClasses.textParagraph}>
              <Link
                className={dialogClasses.boldFont}
                href={githubAuthInitResponse?.verification_uri}
                target="_blank" rel="noopener noreferrer"
                children={githubAuthInitResponse?.verification_uri}
              />
            </div>
            <label className={dialogClasses.label}>User Code</label>
            <div className={dialogClasses.deviceCodeContainer}>
              <TextField
                readOnly
                className={dialogClasses.deviceCodeTextField}
                containerClassName={dialogClasses.deviceCodeTextFieldContainer}
                value={githubAuthInitResponse?.user_code}
                style={TextFieldStyle.inline}
                width={TextFieldWidth.auto}
              />
              <Button
                primary
                onClick={() => githubAuthInitResponse?.user_code && copy(githubAuthInitResponse.user_code)}
                iconProps={{
                  iconName: 'Copy',
                  size: IconSize.medium
                }}
              />
            </div>
          </>}
        </PanelContent>
        <PanelFooter showSeparator className="body-m">
          <Spinner size={SpinnerSize.medium} />
        </PanelFooter>
      </CustomDialog>
    </ConditionalChildren>

    {/* Branch Synchronization Setup In Progress  Dialog */}
    <ConditionalChildren renderChildren={branchSynchronizationSetupInProgress}>
      <CustomDialog onDismiss={() => {}} modal={true}>
        <CustomHeader className="bolt-header-with-commandbar" separator>
          <HeaderTitleArea>
            <div className="flex-grow scroll-hidden" style={{ marginRight: "16px" }}>
              <div className={"title-m " + dialogClasses.title}>Working...</div>
            </div>
          </HeaderTitleArea>
        </CustomHeader>
        <PanelContent className={dialogClasses.panelContentWithMargin + ' ' + dialogClasses.branchSynchronizationPanelContent}>
          <div className={dialogClasses.textParagraph}>
            Setting up branch synchronization. Please wait.
          </div>
        </PanelContent>
        <PanelFooter showSeparator className="body-m">
          <Spinner size={SpinnerSize.medium} />
        </PanelFooter>
      </CustomDialog>
    </ConditionalChildren>

    {/* Alert Dialog */}
    <ConditionalChildren renderChildren={alertDialogState.open}>
      <Dialog
        titleProps={{ text: alertDialogState.title }}
        onDismiss={() => setAlertDialogState({ ...alertDialogState , open: false, })}
        children={
          <div className={dialogClasses.panelContent}>
            {alertDialogState.text}
          </div>
        }
        footerButtonProps={[
          ...(alertDialogState.confirmationDialog ? [{
            text: alertDialogState.secondaryButtonText,
            onClick: () => {
              alertDialogState.callback(false);
              setAlertDialogState({ ...alertDialogState , open: false });
            },
            primary: false
          }] : []),
          {
            text: alertDialogState.primaryButtonText,
            onClick: () => {
              alertDialogState.callback(true);
              setAlertDialogState({ ...alertDialogState , open: false });
            },
            primary: true,
            className: alertDialogState.danger ? dialogClasses.alertButton  : undefined
          }
        ]}
      />
    </ConditionalChildren>
  </>);
}
