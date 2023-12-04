import { Signer } from "ethers";
import merge from "lodash/merge";
import {
  getTokenMessengerContract,
  getUSDCContract,
  parseLog,
  waitForAttestation,
  waitForTransaction,
} from "./utils";
import { Interface, defaultAbiCoder, keccak256 } from "ethers/lib/utils";
import messageTransmitterAbi from "./abis/MessageTransmitter.json";

export enum CCTPDomain {
  Ethereum = 0,
  Avalanche = 1,
  Optimism = 2,
  Arbitrum = 3,
  Base = 6,
  Mumbai = 7,
}

interface CCTPSdkNetworkConfigs {
  rpc: string;
  domain: number;
  usdcContractAddress: string;
  cctpMessengerContractAddress: string;
  cctpMessageTransmitterContractAddress: string;
}

interface CCTPSdkConfigsSet {
  irisApiHost?: string;
  networks?: CCTPSdkNetworkConfigs[];
}

interface CCTPSdkConfigs {
  mainnet?: CCTPSdkConfigsSet;
  testnet?: CCTPSdkConfigsSet;
}

const defaultConfigs: CCTPSdkConfigs = {
  testnet: {},
  mainnet: {},
};

export function CCTPSdk(configs?: CCTPSdkConfigs) {
  const mergedConfigs = merge({}, defaultConfigs, configs);

  return {
    testnet: () => {
      const testnetConfigs = mergedConfigs.testnet;

      if (!testnetConfigs) {
        throw new Error(`can't find testnet configs.`);
      }

      return generateActions(testnetConfigs);
    },
    mainnet: () => {
      const mainnetConfigs = mergedConfigs.mainnet;

      if (!mainnetConfigs) {
        throw new Error(`can't find mainnet configs.`);
      }

      return generateActions(mainnetConfigs);
    },
  };
}

function generateActions(configsSet: CCTPSdkConfigsSet) {
  return {
    configs: configsSet,
    transferUSDC: (options: Omit<TransferUSDCOptions, "configsSet">) => {
      return transferUSDC({ configsSet, ...options });
    },
    approveUSDC: (options: Omit<ApproveUSDCOptions, "configsSet">) => {
      return approveUSDC({ configsSet, ...options });
    },
    burnUSDC: (options: Omit<BurnUSDCOptions, "configsSet">) => {
      return burnUSDC({ configsSet, ...options });
    },
    getMessageBytes: (options: GetMessageBytesOptions) => {
      return getMessageBytes(options);
    },
    fetchAttestation: (options: Omit<FetchSignatureOptions, "configsSet">) => {
      return fetchSignature({ configsSet, ...options });
    },
    mintUSDC: (options: Omit<MintUSDCOptions, "configsSet">) => {
      return mintUSDC({ configsSet, ...options });
    },
  };
}

export interface TransferUSDCOptions {
  signer: Signer;
  sourceDomain: number;
  destinationDomain: number;
  destinationAddress: string;
  amount: number;
  configsSet: CCTPSdkConfigsSet;
  destinationSigner?: Signer;
  beforeMintUSDC?: () => Promise<void>;
}

async function transferUSDC(options: TransferUSDCOptions) {
  const {
    signer,
    sourceDomain,
    destinationDomain,
    destinationAddress,
    amount,
    configsSet,
    destinationSigner,
    beforeMintUSDC,
  } = options;

  const sourceNetworkConfigs = getNetworkConfigs(configsSet, sourceDomain);
  const destinationNetworkConfigs = getNetworkConfigs(
    configsSet,
    destinationDomain
  );

  const approveTx = await approveUSDC({
    signer,
    amount,
    sourceDomain,
    configsSet,
  });

  await waitForTransaction({
    rpc: sourceNetworkConfigs.rpc,
    txHash: approveTx.hash,
  });

  const burnTx = await burnUSDC({
    signer,
    sourceDomain,
    destinationDomain,
    destinationAddress,
    amount,
    configsSet,
  });

  await waitForTransaction({
    rpc: sourceNetworkConfigs.rpc,
    txHash: burnTx.hash,
  });

  const { messageBytes, messageHash } = getMessageBytes({ approveTx });

  const attestationSignature = await fetchSignature({
    configsSet,
    messageHash,
  });

  if (beforeMintUSDC != null) {
    await beforeMintUSDC();
  }

  const mintTx = await mintUSDC({
    signer: destinationSigner || signer,
    messageBytes,
    attestationSignature,
    destinationDomain,
    configsSet,
  });

  await waitForTransaction({
    rpc: destinationNetworkConfigs.rpc,
    txHash: mintTx.hash,
  });
}

interface ApproveUSDCOptions {
  signer: Signer;
  amount: number;
  sourceDomain: number;
  configsSet: CCTPSdkConfigsSet;
}

async function approveUSDC(options: ApproveUSDCOptions) {
  const { signer, amount, sourceDomain, configsSet } = options;
  const networkConfigs = getNetworkConfigs(configsSet, sourceDomain);
  const contract = getUSDCContract(networkConfigs.usdcContractAddress, signer);

  return contract.approve(networkConfigs.cctpMessengerContractAddress, amount);
}

export interface BurnUSDCOptions {
  signer: Signer;
  sourceDomain: number;
  destinationDomain: number;
  destinationAddress: string;
  amount: number;
  configsSet: CCTPSdkConfigsSet;
}

function burnUSDC(options: BurnUSDCOptions) {
  const {
    signer,
    sourceDomain,
    destinationDomain,
    destinationAddress,
    amount,
    configsSet,
  } = options;
  const networkConfigs = getNetworkConfigs(configsSet, sourceDomain);

  const contract = getTokenMessengerContract(
    networkConfigs.cctpMessengerContractAddress,
    signer
  );
  const destinationAddressBytes = defaultAbiCoder.encode(
    ["address"],
    [destinationAddress]
  );

  return contract.depositForBurn(
    amount,
    destinationDomain,
    destinationAddressBytes,
    networkConfigs.usdcContractAddress
  );
}

export interface GetMessageBytesOptions {
  approveTx: any;
}

function getMessageBytes(options: GetMessageBytesOptions) {
  const { approveTx } = options;
  const iface = new Interface(messageTransmitterAbi);
  const messageSentLogs = parseLog(iface, approveTx.logs, "MessageSent");
  const messageBytes = messageSentLogs?.parsedLog.args.message;
  const messageHash = keccak256(messageBytes);

  return { messageBytes, messageHash };
}

export interface FetchSignatureOptions {
  configsSet: CCTPSdkConfigsSet;
  messageHash: string;
}

async function fetchSignature(options: FetchSignatureOptions) {
  const { configsSet, messageHash } = options;

  if (!configsSet.irisApiHost) {
    throw new Error(`can't find irisApiHost`);
  }

  return waitForAttestation({
    apiHost: configsSet.irisApiHost,
    messageHash,
  });
}

export interface MintUSDCOptions {
  signer: Signer;
  messageBytes: string;
  attestationSignature: string;
  destinationDomain: number;
  configsSet: CCTPSdkConfigsSet;
}

function mintUSDC(options: MintUSDCOptions) {
  const {
    signer,
    messageBytes,
    attestationSignature,
    destinationDomain,
    configsSet,
  } = options;
  const networkConfigs = getNetworkConfigs(configsSet, destinationDomain);
  const contract = getTokenMessengerContract(
    networkConfigs.cctpMessageTransmitterContractAddress,
    signer
  );

  return contract.mintUSDC(messageBytes, attestationSignature);
}

function getNetworkConfigs(configsSet: CCTPSdkConfigsSet, domain: number) {
  const networkConfig = configsSet.networks?.find(
    (item) => item.domain === domain
  );

  if (!networkConfig) {
    throw new Error(`can't find source network configs. domain: ${domain}`);
  }

  return networkConfig;
}
