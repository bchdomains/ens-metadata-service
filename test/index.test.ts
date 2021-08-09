import avaTest, { ExecutionContext, TestInterface } from 'ava';
import * as http from 'http';
import got, {
  HTTPError,
  OptionsOfJSONResponseBody,
  OptionsOfTextResponseBody,
} from 'got';
import nock from 'nock';
import listen from 'test-listen';

import * as app from '../src/index';
import { GET_DOMAINS } from '../src/subgraph';
import {
  INFURA_URL as infura_url,
  SERVER_URL as server_url,
  SUBGRAPH_URL as subgraph_url,
} from '../src/config';
import * as NAME_WRAPPER_BYTECODE from '../src/assets/NameWrapper_bc.json';
import { MockEntry } from './entry.mock';
import {
  EthCallResponse,
  EthChainIdResponse,
  NetVersionResponse,
  TestContext,
} from './interface';

const INFURA_URL = new URL(infura_url);
const SERVER_URL = new URL(server_url);
const SUBGRAPH_URL = new URL(subgraph_url);
const NAME_WRAPPER_ADDRESS = '0x2B74429F8e238693e5909ae6eD4A030DaE262ACa'

/* Mocks */

const wrappertest3 = new MockEntry({
  name: 'wrappertest3.eth',
  registration: true,
  resolver: { texts: null },
});
const sub1Wrappertest = new MockEntry({
  name: 'sub1.wrappertest.eth',
  parent: '0x2517c0dfe3a4eebac3456a409c53f824f86070c73d48794d8268ec5c007ee683',
});
const sub2Wrappertest9 = new MockEntry({
  name: 'sub2.wrappertest9.eth',
  image: 'https://i.imgur.com/JcZESMp.png',
  parent: '0x0b00a980e17bfb715fca7267b401b08daa6e750f1bdac52b273e11c46c3e2b9f',
  resolver: { texts: ['domains.ens.nft.image'] },
  hasImageKey: true,
});
const unknown = new MockEntry({ name: 'unknown.eth', unknown: true });
const handle21character = new MockEntry({
  name: 'handle21character.eth',
  registration: true,
  resolver: { texts: null },
});
const supercalifragilisticexpialidocious = new MockEntry({
  name: 'supercalifragilisticexpialidocious.eth',
  registration: true,
  resolver: { texts: null },
});
const longsubdomainconsistof34charactersMdt = new MockEntry({
  name: 'longsubdomainconsistof34characters.mdt.eth',
  registration: true,
  resolver: { texts: null },
});

/* Helper functions */
function nockInfura(
  method: string,
  params: any[],
  response: EthCallResponse | EthChainIdResponse | NetVersionResponse
) {
  nock(INFURA_URL.origin)
    .persist()
    .post(INFURA_URL.pathname, {
      method,
      params,
      id: /[0-9]/,
      jsonrpc: '2.0',
    })
    .reply(200, response);
}

function requireUncached(module: string) {
  delete require.cache[require.resolve(module)];
  return require(module);
}

/* Test Setup */
const test = avaTest as TestInterface<TestContext>;
const options: OptionsOfJSONResponseBody | OptionsOfTextResponseBody = {
  prefixUrl: SERVER_URL.toString(),
};

test.before(async (t: ExecutionContext<TestContext>) => {
  nock.disableNetConnect();
  nock.enableNetConnect(SERVER_URL.host);

  nockInfura('eth_chainId', [], {
    id: 1,
    jsonrpc: '2.0',
    result: '0x04', // rinkeby
  });
  nockInfura('net_version', [], {
    jsonrpc: '2.0',
    id: 1,
    result: '4',
  });
  nockInfura(
    'eth_getCode',
    ['0x2b74429f8e238693e5909ae6ed4a030dae262aca', 'latest'], //lowercase
    {
      jsonrpc: '2.0',
      id: 1,
      result: NAME_WRAPPER_BYTECODE.bytecode,
    }
  );
  nockInfura(
    'eth_call',
    [
      {
        to: '0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e',
        data: '0x0178b8bfb9fab6dd33ccdfd1f65ea203855508034652c2e01f585a7b742c3698c0c8d6b1',
      },
      'latest',
    ],
    {
      result:
        '0x0000000000000000000000004d9487c0fa713630a8f3cd8067564a604f0d2989',
    }
  );
  nockInfura(
    'eth_call',
    [
      {
        to: '0x4d9487c0fa713630a8f3cd8067564a604f0d2989',
        data: '0x59d1d43cb9fab6dd33ccdfd1f65ea203855508034652c2e01f585a7b742c3698c0c8d6b100000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000015646f6d61696e732e656e732e6e66742e696d6167650000000000000000000000',
      },
      'latest',
    ],
    {
      result:
        '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001f68747470733a2f2f692e696d6775722e636f6d2f4a635a45534d702e706e6700',
    }
  );

  t.context.server = http.createServer(app);
  t.context.prefixUrl = await listen(t.context.server);
});

test.after.always((t: ExecutionContext<TestContext>) => {
  t.context.server.close();
  nock.enableNetConnect();
});

/* Tests */

test('get welcome message', async (t: ExecutionContext<TestContext>) => {
  const result = await got('', options).text();
  t.deepEqual(result, 'Well done mate!');
});

test('get /:contractAddress/:tokenId for domain (wrappertest3.eth)', async (t: ExecutionContext<TestContext>) => {
  const result = await got(
    `${NAME_WRAPPER_ADDRESS}/${wrappertest3.namehash}`,
    options
  ).json();
  t.deepEqual(result, wrappertest3.expect);
});

test('get /:contractAddress/:tokenId for subdomain returns auto generated image', async (t: ExecutionContext<TestContext>) => {
  const result = await got(`${NAME_WRAPPER_ADDRESS}/${sub1Wrappertest.namehash}`, options).json();
  t.deepEqual(result, sub1Wrappertest.expect);
});

test('get /:contractAddress/:tokenId for subdomain returns image from text record', async (t: ExecutionContext<TestContext>) => {
  const result = await got(`${NAME_WRAPPER_ADDRESS}/${sub2Wrappertest9.namehash}`, options).json();
  t.deepEqual(result, sub2Wrappertest9.expect);
});

test('get /:contractAddress/:tokenId for a 21 char long domain', async (t: ExecutionContext<TestContext>) => {
  const result = await got(
    `${NAME_WRAPPER_ADDRESS}/${handle21character.namehash}`,
    options
  ).json();
  t.deepEqual(result, handle21character.expect);
});

test('get /:contractAddress/:tokenId for a greater than MAX_CHAR long domain', async (t: ExecutionContext<TestContext>) => {
  const result = await got(
    `${NAME_WRAPPER_ADDRESS}/${supercalifragilisticexpialidocious.namehash}`,
    options
  ).json();
  t.deepEqual(result, supercalifragilisticexpialidocious.expect);
});

test('get /:contractAddress/:tokenId for a greater than MAX_CHAR long subdomain', async (t: ExecutionContext<TestContext>) => {
  const result = await got(
    `${NAME_WRAPPER_ADDRESS}/${longsubdomainconsistof34charactersMdt.namehash}`,
    options
  ).json();
  t.deepEqual(result, longsubdomainconsistof34charactersMdt.expect);
});

test('get /:contractAddress/:tokenId for unknown namehash', async (t: ExecutionContext<TestContext>) => {
  const {
    response: { statusCode, body },
  }: HTTPError = await t.throwsAsync(
    () => got(`${NAME_WRAPPER_ADDRESS}/${unknown.namehash}`, options),
    { instanceOf: HTTPError }
  );
  const message = JSON.parse(body as string)?.message;
  t.is(message, unknown.expect);
  t.is(statusCode, 404);
});

test('get /:contractAddress/:tokenId for empty tokenId', async (t: ExecutionContext<TestContext>) => {
  const {
    response: { statusCode, body },
  }: HTTPError = await t.throwsAsync(() => got(`${NAME_WRAPPER_ADDRESS}/`, options), {
    instanceOf: HTTPError,
  });
  t.assert((body as string).includes(`Cannot GET /${NAME_WRAPPER_ADDRESS}/`));
  t.is(statusCode, 404);
});

test('raise 404 status from subgraph connection', async (t: ExecutionContext<TestContext>) => {
  const fetchError = {
    message: 'nothing here',
    code: '404',
    statusCode: 404,
  };
  nock(SUBGRAPH_URL.origin)
    .post(SUBGRAPH_URL.pathname, {
      query: GET_DOMAINS,
      variables: {
        tokenId: sub1Wrappertest.namehash,
      },
    })
    .replyWithError(fetchError);
  const {
    response: { body, statusCode },
  }: HTTPError = await t.throwsAsync(
    () => got(`${NAME_WRAPPER_ADDRESS}/${sub1Wrappertest.namehash}`, { ...options, retry: 0 }),
    {
      instanceOf: HTTPError,
    }
  );
  const { message } = JSON.parse(body as string);
  // Regardless of what is the message in subgraph with status 404 code
  // user will always see "No results found."" instead
  t.assert(message.includes('No results found.'));
  t.is(statusCode, fetchError.statusCode);
});

test('raise ECONNREFUSED from subgraph connection', async (t: ExecutionContext<TestContext>) => {
  const fetchError = {
    message: 'connect ECONNREFUSED 127.0.0.1:8000',
    code: 'ECONNREFUSED',
    statusCode: 500,
  };
  nock(SUBGRAPH_URL.origin)
    .post(SUBGRAPH_URL.pathname, {
      query: GET_DOMAINS,
      variables: {
        tokenId: sub1Wrappertest.namehash,
      },
    })
    .replyWithError(fetchError);
  const {
    response: { body, statusCode },
  }: HTTPError = await t.throwsAsync(
    () => got(`${NAME_WRAPPER_ADDRESS}/${sub1Wrappertest.namehash}`, { ...options, retry: 0 }),
    {
      instanceOf: HTTPError,
    }
  );
  const { message } = JSON.parse(body as string);
  t.assert(message.includes(fetchError.message));
  t.is(statusCode, fetchError.statusCode);
});

test('raise Internal Server Error from subgraph', async (t: ExecutionContext<TestContext>) => {
  const fetchError = {
    message: 'Internal Server Error',
    code: '500',
    statusCode: 500,
  };
  nock(SUBGRAPH_URL.origin)
    .post(SUBGRAPH_URL.pathname, {
      query: GET_DOMAINS,
      variables: {
        tokenId: sub1Wrappertest.namehash,
      },
    })
    .replyWithError(fetchError);
  const {
    response: { body, statusCode },
  }: HTTPError = await t.throwsAsync(
    () => got(`${NAME_WRAPPER_ADDRESS}/${sub1Wrappertest.namehash}`, { ...options, retry: 0 }),
    {
      instanceOf: HTTPError,
    }
  );
  const { message } = JSON.parse(body as string);
  t.assert(message.includes(fetchError.message));
  t.is(statusCode, fetchError.statusCode);
});

test('should get assets when ENV set for local', async (t: ExecutionContext<TestContext>) => {
  process.env.ENV = 'local';
  process.env.PORT = '8081';
  const _app = requireUncached('../src/index');
  t.context.server = http.createServer(_app);
  t.context.prefixUrl = await listen(t.context.server);
  nock.enableNetConnect('localhost:8081');
  const result = await got(`assets/font.css`, {
    prefixUrl: 'http://localhost:8081',
  }).text();
  t.assert(result.includes('@font-face'));
});