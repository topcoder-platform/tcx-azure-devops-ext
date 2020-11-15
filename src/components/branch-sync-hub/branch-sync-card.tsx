import React, { useEffect, useRef, useState } from 'react';
import { Dropdown } from 'azure-devops-ui/Dropdown';
import { Toggle } from 'azure-devops-ui/Toggle';
import { Card } from "azure-devops-ui/Card";
import { Button } from "azure-devops-ui/Button";
import { makeStyles } from '@material-ui/core';
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

import { ReposGetResponseData, ReposListBranchesResponseData } from '@octokit/types';
import { GitBranchStats, GitRepository } from 'TFS/VersionControl/Contracts';
import { IterableElement } from 'type-fest';

import { AlertDialog, getDefaultState } from './dialogs/alert-dialog';
import { AZURE_CONFIG, GITHUB_CONFIG } from '../../config';
import {
  createOrUpdateAzureFile,
  createBuildDefinition,
  triggerBuild,
  waitForBuild,
  getAdoClients
} from '../../services/azure';
import {
  createOrUpdateRepoSecret,
  createOrUpdateGitHubFile,
  waitForWorkflow,
  getOctokitInstance
} from '../../services/github';
import { SetupInProgress } from './dialogs/setup-in-progress';


export interface IBranchSyncConfig {
  state: 'ENABLED' | 'DISABLED' | 'DRAFT';
  cardTitle: string;
  cardExpanded: boolean;
  azureRepository?: GitRepository;
  azureBranch?: GitBranchStats;
  githubRepository?: ReposGetResponseData;
  githubBranch?: IterableElement<ReposListBranchesResponseData>;
  twoWaySynchronization?: boolean;
}

export function getDefaultBranchSyncConfig(): IBranchSyncConfig {
  return {
    state: 'DRAFT',
    twoWaySynchronization: false,
    cardTitle: 'New Branch Sync Config',
    cardExpanded: true
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
  setAzurePatToken: {
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

export interface IBranchSyncCardProps {
  githubRepositories: ReposGetResponseData[];
  azureRepositories: GitRepository[];
  githubToken: string;
  azurePersonalAccessToken: string | undefined;
  cardState: IBranchSyncConfig;
  setAzurePAT: (...args: any) => any;
  onSaveState: (config: IBranchSyncConfig) => any;
  onDelete: (...args: any) => any;
}

export default function BranchSyncCard(props: IBranchSyncCardProps) {
  const classes = useStyles();

  // Selection Refs
  const githubRepoSelection = useRef(new DropdownSelection());
  const githubBranchSelection = useRef(new DropdownSelection());
  const azureRepoSelection = useRef(new DropdownSelection());
  const azureBranchSelection = useRef(new DropdownSelection());

  // State Variable (Card State)
  const [cardExpanded, setCardExpanded] = useState(true);
  const [cardTitle, setCardTitle] = useState('New Branch Sync Config');
  const [cardState, setCardState] = useState<IBranchSyncConfig["state"]>();
  // const [cardState, setState] = useState<IBranchSyncConfig["state"]>();
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
      twoWaySynchronization: setTwoWaySynchronization
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
      githubBranch,
      githubRepository,
      azureBranch,
      azureRepository,
      props.azurePersonalAccessToken
    ];
    const validated = every(map(validationParameters, (val) => !!(val)));
    setAllowBranchSynchronization(validated);
  }, [azureBranch, azureRepository, githubBranch, githubRepository, props.azurePersonalAccessToken]);

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
   * Save the current state
   */
  async function saveState(state: Partial<IBranchSyncConfig> = {}) {
    props.onSaveState({
      cardTitle,
      cardExpanded,
      state: cardState!,
      azureBranch,
      azureRepository,
      githubBranch,
      githubRepository,
      twoWaySynchronization,
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
    const azureBranchName = get(azureBranch, 'name');
    const azureRepoName = get(azureRepository, 'name');
    const comparator = twoWaySynchronization ? '↔' : '→';
    const cardTitle = `${githubBranchName}@${githubRepoName} ${comparator} ${azureBranchName}@${azureRepoName} (${startCase(upcomingCardState)})`;
    // Save State
    props.onSaveState({
      cardTitle,
      cardExpanded,
      state: upcomingCardState,
      azureBranch,
      azureRepository,
      githubBranch,
      githubRepository,
      twoWaySynchronization
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
      await setupGithubWorkflow();
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
      props.githubToken
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
    await waitForWorkflow(
      githubRepository!,
      manifestPath,
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
          {/* Github Repo */}
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
            offText={"Only push commits from Github to Azure DevOps."}
            onText={"Push commits from Github to Azure DevOps and vice versa."}
            checked={twoWaySynchronization}
            disabled={branchSynchronization}
            onChange={(_event, value) => {
              setTwoWaySynchronization(value);
              saveState({ twoWaySynchronization: value });
            }}
          />
          <div></div>
          <div></div>
          {/* Azure PAT Token */}
          {!(props.azurePersonalAccessToken) && twoWaySynchronization && <div className={classes.controlButtonContainer}>
            <Button
              className={classes.setAzurePatToken}
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
