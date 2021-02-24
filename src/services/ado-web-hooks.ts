import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import get from 'lodash/get';
import { WebHookItem } from '../types/ado-web-hooks';

let _axiosClient: AxiosInstance;

export async function setAzurePatToken (azureToken: string) {
  const username = 'tcxAdoExtension';
  const password = azureToken;
  _axiosClient = axios.create({ auth: { username, password } });
}

export async function createWebHooks (endpoint: string) {
  const webCtx = VSS.getWebContext();
  const eventTypes = [
    'workitem.created',
    'workitem.updated',
    'workitem.deleted',
    'workitem.restored'
  ];
  const createWebHoonRequests = [];
  for (const eventType of eventTypes) {
    const url = `https://dev.azure.com/${webCtx.host.name}/_apis/hooks/subscriptions?api-version=6.0`;
    const data = {
      publisherId: 'tfs',
      eventType,
      resourceVersion: '1.0',
      consumerId: 'webHooks',
      consumerActionId: 'httpRequest',
      publisherInputs: {
          areaPath: '',
          projectId: webCtx.project.id,
          workItemType: ''
      },
      consumerInputs: {
          url: endpoint,
          acceptUntrustedCerts: 'true'
      }
    };
    createWebHoonRequests.push(_axiosClient.post<WebHookItem>(url, data));
  }
  const createWebHookResults = await Promise.all<AxiosResponse<WebHookItem> | AxiosError>(
    createWebHoonRequests.map(
      async (request) => {
        try {
          const result = await request;
          return result;
        } catch (err) {
          return err as AxiosError;
        }
      }
    )
  );

  let failedRequest: AxiosError | null = null;
  const toRevert = [];
  for (const result of createWebHookResults) {
    if (result instanceof Error) {
      failedRequest = result;
    } else {
      toRevert.push(get(result, 'data.id'));
    }
  }

  if (failedRequest) {
    deleteWebHooks(toRevert.filter(Boolean));
  }
  return createWebHookResults;
}

export async function deleteWebHooks (webHookIds: string[]) {
  const webCtx = VSS.getWebContext();
  return Promise.all(
    webHookIds.map(
      async webHookId => {
        try {
          const response = await _axiosClient({
            method: 'DELETE',
            url: `https://dev.azure.com/${webCtx.host.name}/_apis/hooks/subscriptions/${webHookId}?api-version=6.0`,
          });
          return response;
        } catch (err) {
          console.log(`Error occurred while trying to delete webhook with ID: ${webHookId}`);
        }
      }
    )
  );
}
