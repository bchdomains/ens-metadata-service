import { ethers } from 'ethers';
import { BaseError } from './base';
import { INFURA_API_KEY } from './config';

export interface UnsupportedNetwork {}
export class UnsupportedNetwork extends BaseError {}

const NETWORK = {
  LOCAL: 'local',
  RINKEBY: 'rinkeby',
  ROPSTEN: 'ropsten',
  GOERLI: 'goerli',
  MAINNET: 'mainnet',
  SMARTBCH: 'smartbch',
  "SMARTBCH-AMBER": 'smartbch-amber',
};

export default function getNetwork(network: string): any {
  // currently subgraphs used under this function are outdated,
  // we will have namewrapper support and more attributes when latest subgraph goes to production
  let SUBGRAPH_URL: string;
  let INFURA_URL: string;
  let NETWORKISH: any = undefined;
  switch (network) {
    case NETWORK.LOCAL:
      SUBGRAPH_URL = 'http://127.0.0.1:8000/subgraphs/name/graphprotocol/ens';
      INFURA_URL = `https://rinkeby.infura.io/v3/${INFURA_API_KEY}`;
      break;
    case NETWORK.RINKEBY:
      SUBGRAPH_URL =
        'https://api.thegraph.com/subgraphs/name/makoto/ensrinkeby';
      INFURA_URL = `https://rinkeby.infura.io/v3/${INFURA_API_KEY}`;
      break;
    case NETWORK.ROPSTEN:
      SUBGRAPH_URL =
        'https://api.thegraph.com/subgraphs/name/ensdomains/ensropsten';
      INFURA_URL = `https://ropsten.infura.io/v3/${INFURA_API_KEY}`;
      break;
    case NETWORK.GOERLI:
      SUBGRAPH_URL =
        'https://api.thegraph.com/subgraphs/name/ensdomains/ensgoerli';
      INFURA_URL = `https://goerli.infura.io/v3/${INFURA_API_KEY}`;
      break;
    case NETWORK.MAINNET:
      SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/ensdomains/ens';
      INFURA_URL = `https://mainnet.infura.io/v3/${INFURA_API_KEY}`;
      break;
    case NETWORK.SMARTBCH:
      SUBGRAPH_URL = 'https://graph.bch.domains/subgraphs/name/graphprotocol/ens';
      INFURA_URL = `https://smartbch.fountainhead.cash/mainnet`;
      NETWORKISH = {
        name: "smartbch",
        chainId: 10000,
        ensAddress: "0x3596f09d70B454049Ce11390A3eeBfBf6a9e3945"
      }
      break;
    case NETWORK["SMARTBCH-AMBER"]:
      SUBGRAPH_URL = 'https://graph.bch.domains/subgraphs/name/graphprotocol/ens-amber';
      INFURA_URL = `http://moeing.tech:8545`;
      NETWORKISH = {
        name: "smartbch-amber",
        chainId: 10001,
        ensAddress: "0x32f1FBE59D771bdB7FB247FE97A635f50659202b"
      }
      break;
    default:
      throw new UnsupportedNetwork(`Unknown network '${network}'`);
  }


  const provider = new ethers.providers.StaticJsonRpcProvider(INFURA_URL, NETWORKISH);
  return { INFURA_URL, SUBGRAPH_URL, provider };
}
