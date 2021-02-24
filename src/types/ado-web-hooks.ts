export interface WebHookItem {
  id: string;
  url: string;
  status: string;
  publisherId: string;
  eventType: string;
  subscriber?: any;
  resourceVersion: string;
  eventDescription: string;
  consumerId: string;
  consumerActionId: string;
  actionDescription: string;
  createdBy: {
    displayName: string;
    id: string;
    uniqueName: string;
    descriptor: string;
  };
  createdDate: string;
  modifiedBy: {
    displayName: string;
    id: string;
    uniqueName: string;
    descriptor: string;
  };
  modifiedDate: string;
  publisherInputs: {
    areaPath: string;
    tfsSubscriptionId: string;
    workItemType: string;
  };
  consumerInputs: {
    acceptUntrustedCerts: string;
    url: string;
  };
  _links: {
    self: {
      href: string;
    };
    consumer: {
      href: string;
    };
    actions: {
      href: string;
    };
    notifications: {
      href: string;
    };
    publisher: {
      href: string;
    };
  };
}
