import * as http from 'http';

export interface DomainResponse {
  domain: {
    name: string;
    id?: string;
    labelName: string;
    labelhash: string;
    createdAt: string;
    owner: {
      id: string;
    };
    parent: {
      id: string;
    };
    resolver: {
      texts: string[] | null;
    } | null;
    hasImageKey?: boolean | null;
  };
}

export interface RegistrationResponse {
  registrations: {
    expiryDate: string;
    labelName: string;
    registrationDate: string;
  }[];
}

export interface EthChainIdResponse {
  id: number;
  jsonrpc: string;
  result: string;
}

export interface EthCallResponse {
  result: string;
}

export interface NetVersionResponse {
  id: number;
  jsonrpc: string;
  result: string;
}

export interface TestContext {
  server: http.Server;
  prefixUrl: string;
}
