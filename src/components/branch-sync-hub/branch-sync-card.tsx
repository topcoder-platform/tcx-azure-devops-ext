import React, { useEffect, useRef, useState } from 'react';
import { Dropdown } from 'azure-devops-ui/Dropdown';
import { Toggle } from 'azure-devops-ui/Toggle';
import { Card } from "azure-devops-ui/Card";
import { Button } from "azure-devops-ui/Button";
import { DropdownSelection } from 'azure-devops-ui/Utilities/DropdownSelection';
import isNil from 'lodash/isNil';
import findIndex from 'lodash/findIndex';
import every from 'lodash/every';
import map from 'lodash/map';
import get from 'lodash/get';
import kebabCase from 'lodash/kebabCase';
import startCase from 'lodash/startCase';
import template from 'lodash/template';
import sortBy from 'lodash/sortBy';
import forEach from 'lodash/forEach';
import { makeStyles } from '@material-ui/core';

import { ReposGetResponseData, ReposListBranchesResponseData } from '@octokit/types';
import { GitBranchStats, GitRepository } from 'TFS/VersionControl/Contracts';
import { IterableElement } from 'type-fest';

import { AlertDialog, getDefaultState } from './dialogs/alert-dialog';
import { AZURE_CONFIG, GITHUB_CONFIG, GITLAB_CONFIG } from '../../config';
import {
  createOrUpdateAzureFile,
  createBuildDefinition,
  triggerBuild,
  waitForBuild,
  getAdoClients
} from '../../services/azure';
import {
  createOrUpdateGithubRepoSecret,
  createOrUpdateGitHubFile,
  waitForGithubWorkflow,
  getOctokitInstance
} from '../../services/github';
import { SetupInProgress } from './dialogs/setup-in-progress';
import { ConditionalChildren } from 'azure-devops-ui/ConditionalChildren';
import { IGitlabRepo, getGitlabInstance, createOrUpdateGitlabRepoSecret, IGitlabBranch, createOrUpdateGitlabFile, waitForGitlabPipeline } from '../../services/gitlab';


export interface IBranchSyncConfig {
  state: 'ENABLED' | 'DISABLED' | 'DRAFT';
  cardTitle: string;
  cardExpanded: boolean;
  azureRepository?: GitRepository;
  azureBranch?: GitBranchStats;
  githubRepository?: ReposGetResponseData;
  githubBranch?: IterableElement<ReposListBranchesResponseData>;
  gitlabRepository?: IGitlabRepo;
  gitlabBranch?: IGitlabBranch;
  twoWaySynchronization?: boolean;
  repoHost: IterableElement<typeof repoHosts>;
}

export function getDefaultBranchSyncConfig(): IBranchSyncConfig {
  return {
    state: 'DRAFT',
    twoWaySynchronization: false,
    cardTitle: 'New Branch Sync Config',
    cardExpanded: true,
    repoHost: 'GitHub'
  };
}

const useStyles = makeStyles({
  card: {
    paddingBottom: '12px',
    marginBottom: '16px'
  },
  cardContent: {
    overflow: 'scroll'
  },
  cardHeader: {
    flex: 1
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '200px auto',
    gridAutoRows: '30px',
    alignItems: 'center',
    rowGap: '8px',
    marginTop: 12,
    marginBottom: 12,
    fontSize: 14,
    paddingRight: '20px'
  },
  fontBold: {
    fontWeight: 'bold'
  },
  tokenButton: {
    flex: '1',
    marginTop: 0,
    marginRight: '2px',
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  patTokenHelpButton: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  controlButtonContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '800px',
    minWidth: '650px',
    marginBottom: '32px',
    gridColumnStart: 1,
    gridColumnEnd: 3
  },
  controlButton: {
    marginTop: '16px',
    width: '100%'
  }
});

const repoHosts = [
  'GitHub',
  'GitLab'
] as const;

export interface IBranchSyncCardProps {
  gitlabRepositories: IGitlabRepo[];
  githubRepositories: ReposGetResponseData[];
  azureRepositories: GitRepository[];
  gitlabToken: string;
  githubToken: string;
  azurePersonalAccessToken: string | undefined;
  cardState: IBranchSyncConfig;
  setAzurePAT: (...args: any) => any;
  requestGitlabToken: (...args: any) => any;
  onSaveState: (config: IBranchSyncConfig) => any;
  onDelete: (...args: any) => any;
}

export default function BranchSyncCard(props: IBranchSyncCardProps) {
  const classes = useStyles();

  // Selection Refs
  const repoHostSelection = useRef(new DropdownSelection());
  const gitlabRepoSelection = useRef(new DropdownSelection());
  const gitlabBranchSelection = useRef(new DropdownSelection());
  const githubRepoSelection = useRef(new DropdownSelection());
  const githubBranchSelection = useRef(new DropdownSelection());
  const azureRepoSelection = useRef(new DropdownSelection());
  const azureBranchSelection = useRef(new DropdownSelection());

  // State Variable (Card UI State)
  const [cardExpanded, setCardExpanded] = useState(true);
  const [cardTitle, setCardTitle] = useState('New Branch Sync Config');
  const [cardState, setCardState] = useState<IBranchSyncConfig["state"]>();
  // State Variable (Remote Repo)
  const [repoHost, setRepoHost] = useState<IterableElement<typeof repoHosts>>('GitHub');
  // State Variables (Gitlab)
  const [gitlabRepository, setGitlabRepository] = useState<IGitlabRepo | undefined>(undefined);
  const [gitlabBranches, setGitlabBranches] = useState<IGitlabBranch[]>([]);
  const [gitlabBranch, setGitlabBranch] = useState<IGitlabBranch>();
  // State Variables (Github)
  const [githubRepository, setGithubRepository] = useState<ReposGetResponseData | undefined>(undefined);
  const [githubBranches, setGithubBranches] = useState<ReposListBranchesResponseData>([]);
  const [githubBranch, setGithubBranch] = useState<IterableElement<ReposListBranchesResponseData> | undefined>();
  // State Variables (Azure)
  const [azureRepository, setAzureRepository] = useState<GitRepository | undefined>();
  const [azureBranches, setAzureBranches] = useState<GitBranchStats[] | undefined>([]);
  const [azureBranch, setAzureBranch] = useState<GitBranchStats | undefined>();
  // State Variable (2-way synchronization)
  const [twoWaySynchronization, setTwoWaySynchronization] = useState(false);
  // State Variable (Alert Dialog State)
  const [alertDialogState, setAlertDialogState] = useState(getDefaultState());
  // State Variable (Branch Synchronization)
  const [branchSynchronization, _setBranchSynchronization] = useState(false);
  // State Variable (Whether the "Enable Branch Synchronization" button is enabled)
  const [allowBranchSynchronization, setAllowBranchSynchronization] = useState(false);
  // State Variable (Is Branch Synchronization setup in progress)
  const [branchSynchronizationSetupInProgress, setBranchSynchronizationSetupInProgress] = useState(false);

  /**
   * The following effect will pre-select the Repo Host dropdown options once the page is loaded.
   */
  useEffect(() => {
    if (repoHost) {
      repoHostSelection.current.select(findIndex(repoHosts, i => i === repoHost));
    }
  }, [repoHost]);

  /**
   * The following effect will pre-select the Github Repository dropdown options once the page is loaded.
   */
  useEffect(() => {
    if (props.githubRepositories && props.githubRepositories.length > 0 && !isNil(githubRepository)) {
      githubRepoSelection.current.select(findIndex(props.githubRepositories, { id: githubRepository.id }));
    }
  }, [props.githubRepositories, githubRepository]);

  /**
   * The following effect will pre-select the Github Branch dropdown options once the page is loaded.
   */
  useEffect(() => {
    if (githubBranches && githubBranches.length > 0 && !isNil(githubBranch)) {
      githubBranchSelection.current.select(findIndex(githubBranches, { id: githubBranch.name } as any));
    }
  }, [githubBranches, githubBranch]);

  /**
   * The following effect will pre-select the Azure Repository dropdown options once the page is loaded.
   */
  useEffect(() => {
    if (props.azureRepositories && props.azureRepositories.length > 0 && !isNil(azureRepository)) {
      azureRepoSelection.current.select(findIndex(props.azureRepositories, { id: azureRepository.id }));
    }
  }, [props.azureRepositories, azureRepository]);

  /**
   * The following effect will pre-select the Azure Branch dropdown options once the page is loaded.
   */
  useEffect(() => {
    if (azureBranches && azureBranches.length > 0 && !isNil(azureBranch)) {
      azureBranchSelection.current.select(findIndex(azureBranches, { name: azureBranch.name }));
    }
  }, [azureBranches, azureBranch]);

  /**
   * The following effect will pre-select the Gitlab Repository dropdown options once the page is loaded.
   */
  useEffect(() => {
    if (props.gitlabRepositories && props.gitlabRepositories.length > 0 && !isNil(gitlabRepository)) {
      gitlabRepoSelection.current.select(findIndex(props.gitlabRepositories, { id: gitlabRepository.id }));
    }
  }, [props.gitlabRepositories, gitlabRepository]);

  /**
   * The following effect will pre-select the Gitlab Branch dropdown options once the page is loaded.
   */
  useEffect(() => {
    if (gitlabBranches && gitlabBranches.length > 0 && !isNil(gitlabBranch)) {
      gitlabBranchSelection.current.select(findIndex(gitlabBranches, { id: gitlabBranch.name } as any));
    }
  }, [gitlabBranches, gitlabBranch]);

  useEffect(() => {
    const propertySetterMap: Partial<{ [key in keyof IBranchSyncConfig]: any}> = {
      state: ((val) => {
        setCardState(val);
        if (val === 'ENABLED') {
          _setBranchSynchronization(true);
        }
      }) as typeof setCardState,
      cardTitle: setCardTitle,
      cardExpanded: setCardExpanded,
      azureRepository: setAzureRepository,
      azureBranch: setAzureBranch,
      githubRepository: setGithubRepository,
      githubBranch: setGithubBranch,
      gitlabRepository: setGitlabRepository,
      gitlabBranch: setGitlabBranch,
      twoWaySynchronization: setTwoWaySynchronization,
      repoHost: setRepoHost,
    };
    forEach(propertySetterMap, (setterFn, propertyName) => {
      const stateValue = get(props.cardState, propertyName);
      if (!isNil(stateValue)) {
        setterFn(stateValue);
      }
    });
  }, [props.cardState]);

  /**
   * This effect runs when the user alters the Branch Validation Form.
   * It validates the various inputs and selectors and checks if the user can
   * be allowed to enable branch synchronization.
   */
  useEffect(() => {
    const validationParameters = [
      azureBranch,
      azureRepository,
      props.azurePersonalAccessToken,
      ...( repoHost === 'GitHub' ? [githubBranch, githubRepository] : [gitlabBranch, gitlabRepository] )
    ];
    const validated = every(map(validationParameters, (val) => !!(val)));
    setAllowBranchSynchronization(validated);
  }, [
    azureBranch,
    azureRepository,
    githubBranch,
    githubRepository,
    gitlabBranch,
    gitlabRepository,
    props.azurePersonalAccessToken,
    repoHost,
    twoWaySynchronization
  ]);

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
   * This effect is run any time the user selects a Gitlab Repository.
   * It populates the Gitlab Branch selector.
   */
  useEffect(() => {
    async function getBranchesForGitlabRepository() {
      // Get REST client
      const client = getGitlabInstance();
      // Fetch the project ID
      const projectId = get(gitlabRepository, 'id');
      // Stop if either are not found.
      if (!projectId) {
        return;
      }
      // Populate the Gitlab Branch selector.
      let branchList: any = await client.Branches.all(projectId, { perPage: 300 });
      branchList = sortBy(branchList, ['name']);
      branchList = map(branchList, o => ({ ...o, id: o.name, text: o.name }));
      setGitlabBranches(branchList);
    }
    getBranchesForGitlabRepository();
  }, [gitlabRepository]);

  /**
   * Save the current state
   */
  async function saveState(state: Partial<IBranchSyncConfig> = {}) {
    props.onSaveState({
      cardTitle,
      cardExpanded,
      state: cardState!,
      azureBranch,
      azureRepository,
      gitlabBranch,
      gitlabRepository,
      githubBranch,
      githubRepository,
      twoWaySynchronization,
      repoHost,
      ...state
    });
  }

  /**
   * Deselect the selected Github branch
   */
  function deselectGithubBranch() {
    setGithubBranch(undefined);
    githubBranchSelection.current.value = [];
  }

  /**
   * Deselect the selected Azure branch
   */
  function deselectAzureBranch() {
    setAzureBranch(undefined);
    azureBranchSelection.current.value = [];
  }

  async function deselectGithubAndGitlab(repoHost: IterableElement<typeof repoHosts>) {
    setGithubRepository(undefined);
    githubRepoSelection.current.value = [];
    setGithubBranch(undefined);
    githubBranchSelection.current.value = [];
    setGitlabRepository(undefined);
    gitlabRepoSelection.current.value = [];
    setGitlabBranch(undefined);
    gitlabBranchSelection.current.value = [];
    saveState({
      repoHost,
      githubRepository: undefined,
      githubBranch: undefined,
      gitlabRepository: undefined,
      gitlabBranch: undefined
    });
  }

  /**
   * Shows a Dialog that shows informs the user about the PAT token.
   */
  function showPatTokenHelpAlert() {
    setAlertDialogState({
      isOpen: true,
      title: 'About the Azure Personal Access Token',
      text: (<>
        <div>
        </div>
      </>),
      onClose: () => {
        setAlertDialogState((val) => ({ ...val, isOpen: false }));
      },
      danger: false,
      primaryButtonText: 'Ok',
      secondaryButtonText: ''
    });
  }

  /**
   * Saves the branch synchronization config
   * @param branchSynchronizationValue Whether Branch Synchronization is being enabled or disabled
   */
  function saveBranchSynchronizationConfig(branchSynchronizationValue: boolean) {
    const upcomingCardState: typeof cardState = branchSynchronizationValue ? 'ENABLED' : 'DISABLED';
    const githubBranchName = get(githubBranch, 'name');
    const githubRepoName = get(githubRepository, 'name');
    const gitlabBranchName = get(gitlabBranch, 'name');
    const gitlabRepoName = get(gitlabRepository, 'name');
    const azureBranchName = get(azureBranch, 'name');
    const azureRepoName = get(azureRepository, 'name');
    const comparator = twoWaySynchronization ? '↔' : '→';
    const srcName = repoHost === 'GitLab' ? `${gitlabBranchName}@${gitlabRepoName}` : `${githubBranchName}@${githubRepoName}`;
    const targetName = `${azureBranchName}@${azureRepoName}`;
    const cardTitle = `${srcName} ${comparator} ${targetName} (${startCase(upcomingCardState)})`;
    // Save State
    props.onSaveState({
      cardTitle,
      cardExpanded,
      state: upcomingCardState,
      azureBranch,
      azureRepository,
      githubBranch,
      githubRepository,
      gitlabBranch,
      gitlabRepository,
      twoWaySynchronization,
      repoHost
    });
  }

  /**
   * Toggles the branch synchronization
   * @param value True if branch synchronization is being enabled, false if it is being disabled
   */
  async function setBranchSynchronization(value: boolean) {
    // Do nothing if branch synchronization is being disabled
    if (!value) {
      _setBranchSynchronization(value);
      saveBranchSynchronizationConfig(value);
      return;
    }
    try {
      setBranchSynchronizationSetupInProgress(true);
      if (repoHost === 'GitHub') {
        await setupGithubWorkflow();
      } else {
        await setupGitlabWorkflow();
      }
      if (twoWaySynchronization) {
        await setupAzureWorkflow();
      }
      saveBranchSynchronizationConfig(value);
      // Update UI
      _setBranchSynchronization(true);
      setAlertDialogState({
        isOpen: true,
        text: (
          <p>Branch Synchronization setup has completed successfully.</p>
        ),
        title: 'Success!',
        onClose: () => {
          setAlertDialogState((val) => ({ ...val, isOpen: false }));
        },
        danger: false,
        primaryButtonText: 'OK',
        secondaryButtonText: false
      });
    } catch (error) {
      console.error(error);
      setAlertDialogState({
        isOpen: true,
        text: (
          <p>Uh oh! Error occurred while trying to setup branch synchronization. Please try again.</p>
        ),
        title: 'Error!',
        onClose: () => {
          setAlertDialogState((val) => ({ ...val, isOpen: false }));
        },
        danger: true,
        primaryButtonText: 'OK',
        secondaryButtonText: false,
      });
    } finally {
      setBranchSynchronizationSetupInProgress(false);
    }
  }

  /**
   * Setup Azure Workflow which will push ADO commits to Github/Gitlab.
   */
  async function setupAzureWorkflow() {
    const isGithub = repoHost === 'GitHub';
    const remoteRepo = isGithub ? githubRepository : gitlabRepository;
    const remoteBranch = isGithub ? githubBranch : gitlabBranch;
    // Substitute values in templates to get manifest path and manifest contents
    const templateSettings = {
      interpolate: /<%=([\s\S]+?)%>/g
    };
    const manifestPath = template(AZURE_CONFIG.MANIFEST_PATH, templateSettings)({
      repoName: kebabCase(remoteRepo!.name),
      repoBranch: kebabCase(remoteBranch!.name)
    });
    const manifestContents = template(AZURE_CONFIG.MANIFEST_TEMPLATE, templateSettings)({
      secretName: AZURE_CONFIG.SECRET_NAME,
      repoUrl: get(remoteRepo!, isGithub ? 'clone_url' : 'http_url_to_repo').replace('https://', ''),
      azureBranchName: azureBranch!.name,
      remoteRepoBranchName: isGithub ? githubBranch!.name : gitlabBranch!.name,
      remoteRepoName: repoHost
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
      isGithub ? props.githubToken : `gitlab-ci-token:${props.gitlabToken}`
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
    await createOrUpdateGithubRepoSecret(
      githubRepository!,
      GITHUB_CONFIG.SECRET_NAME,
      props.azurePersonalAccessToken!
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
      repoUrl: get(azureRepository!, 'webUrl').replace('https://', ''),
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
    await waitForGithubWorkflow(
      githubRepository!,
      manifestPath,
      3,
      180
    );
  }

  /**
   * Setup Gitlab Workflow which will push Gitlab commits to ADO.
   */
  async function setupGitlabWorkflow() {
    // Store the PAT as a variable
    await createOrUpdateGitlabRepoSecret(
      gitlabRepository!,
      GITLAB_CONFIG.SECRET_NAME,
      props.azurePersonalAccessToken!
    );
    // Substitute values in templates to generate manifest contents
    const templateSettings = { interpolate: /<%=([\s\S]+?)%>/g };
    const manifestContentTemplate = template(GITLAB_CONFIG.MANIFEST_TEMPLATE, templateSettings);
    const manifestContent = manifestContentTemplate({
      secretName: GITLAB_CONFIG.SECRET_NAME,
      repoUrl: get(azureRepository!, 'webUrl').replace('https://', ''),
      azureBranchName: azureBranch!.name,
      gitlabBranchName: gitlabBranch!.name
    });
    // Create or update the Workflow manifest
    await createOrUpdateGitlabFile(
      gitlabRepository!,
      gitlabBranch!,
      GITLAB_CONFIG.MANIFEST_PATH,
      manifestContent,
      GITLAB_CONFIG.COMMIT_MESSAGE
    );
    // Wait for the Workflow to complete
    await waitForGitlabPipeline(
      gitlabRepository!,
      3,
      180
    );
  }

  return (<>
    {/* Main Card */}
    <Card
      collapsible={true}
      collapsed={!cardExpanded}
      onCollapseClick={() => {
        setCardExpanded(!cardExpanded);
        saveState({cardExpanded: !cardExpanded });
      }}
      titleProps={{ text: cardTitle, className: classes.fontBold }}
      contentProps={{ className: classes.cardContent }}
      className={classes.card}
      headerClassName={classes.cardHeader}
      headerCommandBarItems={[
        {
          id: 'delete-branch-sync-config',
          onActivate: () => props.onDelete(),
          iconProps: {
            iconName: 'Delete'
          }
        }
      ]}
      children={<>
        <div className={classes.infoGrid}>
          {/* Branch Synchronization */}
          <div><label>Branch Synchronization</label></div>
          <div className={classes.fontBold}>
            { branchSynchronization ? 'Enabled' : 'Disabled' }
          </div>
          {/* Repo Host */}
          <div><label>Repo Host</label></div>
          <Dropdown
            placeholder="Select Repo Host"
            items={repoHosts as any}
            disabled={branchSynchronization}
            selection={repoHostSelection.current}
            onSelect={(_, e) => {
              setRepoHost(e.text as any);
              deselectGithubAndGitlab(e.text as any);
            }}
          />
          {/* Github Repo */}
          <ConditionalChildren renderChildren={repoHost === 'GitHub'}>
            <div><label>Github Repo</label></div>
            <Dropdown
              placeholder="Select Github Repo"
              items={props.githubRepositories as any}
              disabled={branchSynchronization}
              selection={githubRepoSelection.current}
              onSelect={(_, e) => {
                setGithubRepository(e as any);
                deselectGithubBranch();
                saveState({ githubRepository: e as any });
              }}
            />
            {/* Github Branch */}
            <div><label>Github Branch</label></div>
            <Dropdown
              placeholder="Select Github Branch"
              items={githubBranches as any}
              disabled={!githubRepository || branchSynchronization}
              selection={githubBranchSelection.current}
              onSelect={(_, e) => {
                setGithubBranch(e as any);
                saveState({ githubBranch: e as any });
              }}
            />
          </ConditionalChildren>
          <ConditionalChildren renderChildren={repoHost === 'GitLab'}>
            <div><label>GitLab Repo</label></div>
            <Dropdown
              placeholder="Select GitLab Repo"
              items={props.gitlabRepositories as any}
              disabled={branchSynchronization}
              selection={gitlabRepoSelection.current}
              onSelect={(_, e) => {
                setGitlabRepository(e as any);
                saveState({ gitlabRepository: e as any });
              }}
            />
            {/* Gitlab Branch */}
            <div><label>Gitlab Branch</label></div>
            <Dropdown
              placeholder="Select Gitlab Branch"
              items={gitlabBranches as any}
              disabled={!gitlabRepository || branchSynchronization}
              selection={gitlabBranchSelection.current}
              onSelect={(_, e) => {
                setGitlabBranch(e as any);
                saveState({ gitlabBranch: e as any });
              }}
            />
          </ConditionalChildren>
          {/* Azure Repo */}
          <div><label>Azure Repo</label></div>
          <Dropdown
            placeholder="Select Azure Repo"
            items={props.azureRepositories}
            disabled={branchSynchronization}
            selection={azureRepoSelection.current}
            onSelect={(_, e) => {
              setAzureRepository(e as any);
              deselectAzureBranch();
              saveState({ azureRepository: e as any });
            }}
          />
          {/* Azure Branch */}
          <div><label>Azure Branch</label></div>
          <Dropdown
            placeholder="Select Azure Branch"
            items={azureBranches! as any}
            disabled={!azureRepository || branchSynchronization}
            selection={azureBranchSelection.current}
            onSelect={(_, e) => {
              setAzureBranch(e as any);
              saveState({ azureBranch: e as any });
            }}
          />
          {/* Two-Way Synchronization */}
          <div><label>Two-Way Synchronization</label></div>
          <Toggle
            offText={`Only push commits from ${repoHost} to Azure DevOps.`}
            onText={`Push commits from ${repoHost} to Azure DevOps and vice versa.`}
            checked={twoWaySynchronization}
            disabled={branchSynchronization}
            onChange={(_event, value) => {
              setTwoWaySynchronization(value);
              saveState({ twoWaySynchronization: value });
            }}
          />
          <div></div>
          <div></div>
          {/* GitLab Token */}
          {!(props.gitlabToken) && (repoHost === 'GitLab') && <div className={classes.controlButtonContainer}>
            <Button
              className={classes.tokenButton}
              text={'Set GitLab PAT Token'}
              primary={true}
              onClick={() => props.requestGitlabToken()}
            />
          </div>}
          {/* Azure PAT Token */}
          {!(props.azurePersonalAccessToken) && twoWaySynchronization && <div className={classes.controlButtonContainer}>
            <Button
              className={classes.tokenButton}
              text={'Set Azure PAT Token'}
              primary={true}
              onClick={() => props.setAzurePAT()}
            />
            <Button
              className={classes.patTokenHelpButton}
              text="?"
              primary={true}
              onClick={() => showPatTokenHelpAlert()}
            />
          </div>}
          {/* Control Button */}
          <div className={classes.controlButtonContainer}>
            <Button
              className={classes.controlButton}
              text={`${(branchSynchronization ? 'Disable' : 'Enable')} Branch Synchronization`}
              primary={!branchSynchronization}
              disabled={!branchSynchronization && !allowBranchSynchronization}
              onClick={() => setBranchSynchronization(!branchSynchronization)}
            />
          </div>
        </div>
      </>}
    />

    {/* Dialogs */}
    <AlertDialog {...alertDialogState}/>
    <SetupInProgress open={branchSynchronizationSetupInProgress} />
  </>);
}
