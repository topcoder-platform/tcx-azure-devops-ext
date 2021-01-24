export interface ITopcoderProjectType {
  key: string;
  displayName: string;
  icon: string;
  question: string;
  info: string;
  aliases: string[];
  disabled: boolean;
  hidden: boolean;
  metadata:  {
    a?: number;
    info: {
      c: number;
      age: number;
    };
    job: {
      title: string;
    };
    id?: number;
    name: string;
    cardButtonText: string;
    pageInfo: string;
    pageHeader: string;
    key?: number;
    isInternal?: boolean;
    filterable?: boolean;
    autoProceedToSingleProjectTemplate?: boolean;
  };
  deletedAt?: any;
  createdAt: Date;
  updatedAt: Date;
  deletedBy?: any;
  createdBy: number;
  updatedBy: number;
}

export interface ICreateProjectPayload {
  name: string;
  description: string;
  type: string;
  version: string;
}
