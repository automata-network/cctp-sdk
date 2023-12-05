import { Signer, ethers } from "ethers";
import merge from "lodash/merge";
import {
  getEthTransactionReceipt,
  getMessageTransmitterContract,
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
  irisApiHost: string;
  networks: CCTPSdkNetworkConfigs[];
}

interface CCTPSdkConfigs {
  mainnet: CCTPSdkConfigsSet;
  testnet: CCTPSdkConfigsSet;
}

export const defaultConfigs: CCTPSdkConfigs = {
  testnet: {
    irisApiHost: "https://iris-api-sandbox.circle.com",
    networks: [
      {
        domain: CCTPDomain.Ethereum,
        usdcContractAddress: "0x07865c6e87b9f70255377e024ace6630c1eaa37f",
        cctpMessageTransmitterContractAddress:
          "0x26413e8157cd32011e726065a5462e97dd4d03d9",
        cctpMessengerContractAddress:
          "0xd0c3da58f55358142b8d3e06c1c30c5c6114efe8",
        rpc: "https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
      },
      {
        domain: CCTPDomain.Avalanche,
        usdcContractAddress: "0x5425890298aed601595a70ab815c96711a31bc65",
        cctpMessageTransmitterContractAddress:
          "0xa9fb1b3009dcb79e2fe346c16a604b8fa8ae0a79",
        cctpMessengerContractAddress:
          "0xeb08f243e5d3fcff26a9e38ae5520a669f4019d0",
        rpc: "https://rpc.ankr.com/avalanche_fuji",
      },
      {
        domain: CCTPDomain.Mumbai,
        usdcContractAddress: "0x9999f7fea5938fd3b1e26a12c3f2fb024e194f97",
        cctpMessageTransmitterContractAddress:
          "0xe09A679F56207EF33F5b9d8fb4499Ec00792eA73",
        cctpMessengerContractAddress:
          "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
        rpc: "https://rpc.ankr.com/polygon_mumbai",
      },
      {
        domain: CCTPDomain.Optimism,
        usdcContractAddress: "0xe05606174bac4A6364B31bd0eCA4bf4dD368f8C6",
        cctpMessageTransmitterContractAddress:
          "0x9ff9a4da6f2157a9c82ce756f8fd7e0d75be8895",
        cctpMessengerContractAddress:
          "0x23a04d5935ed8bc8e3eb78db3541f0abfb001c6e",
        rpc: "https://goerli.optimism.io",
      },
      {
        domain: CCTPDomain.Arbitrum,
        usdcContractAddress: "0xfd064A18f3BF249cf1f87FC203E90D8f650f2d63",
        cctpMessageTransmitterContractAddress:
          "0x109bc137cb64eab7c0b1dddd1edf341467dc2d35",
        cctpMessengerContractAddress:
          "0x12dcfd3fe2e9eac2859fd1ed86d2ab8c5a2f9352",
        rpc: "https://goerli-rollup.arbitrum.io/rpc",
      },
      {
        domain: CCTPDomain.Base,
        usdcContractAddress: "0xf175520c52418dfe19c8098071a252da48cd1c19",
        cctpMessageTransmitterContractAddress:
          "0x9ff9a4da6f2157A9c82CE756f8fD7E0d75be8895",
        cctpMessengerContractAddress:
          "0x877b8e8c9e2383077809787ED6F279ce01CB4cc8",
        rpc: "https://goerli.base.org",
      },
    ],
  },
  mainnet: {
    irisApiHost: "https://iris-api.circle.com",
    networks: [
      {
        domain: CCTPDomain.Ethereum,
        usdcContractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        cctpMessageTransmitterContractAddress:
          "0x0a992d191deec32afe36203ad87d7d289a738f81",
        cctpMessengerContractAddress:
          "0xbd3fa81b58ba92a82136038b25adec7066af3155",
        rpc: "https://rpc.ankr.com/eth",
      },
      {
        domain: CCTPDomain.Avalanche,
        usdcContractAddress: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
        cctpMessageTransmitterContractAddress:
          "0x8186359af5f57fbb40c6b14a588d2a59c0c29880",
        cctpMessengerContractAddress:
          "0x6b25532e1060ce10cc3b0a99e5683b91bfde6982",
        rpc: "https://rpc.ankr.com/avalanche",
      },
      {
        domain: CCTPDomain.Optimism,
        usdcContractAddress: "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
        cctpMessageTransmitterContractAddress:
          "0x4d41f22c5a0e5c74090899e5a8fb597a8842b3e8",
        cctpMessengerContractAddress:
          "0x2B4069517957735bE00ceE0fadAE88a26365528f",
        rpc: "https://rpc.ankr.com/optimism",
      },
      {
        domain: CCTPDomain.Arbitrum,
        usdcContractAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        cctpMessageTransmitterContractAddress:
          "0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca",
        cctpMessengerContractAddress:
          "0x19330d10D9Cc8751218eaf51E8885D058642E08A",
        rpc: "https://rpc.ankr.com/arbitrum",
      },
      {
        domain: CCTPDomain.Base,
        usdcContractAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        cctpMessageTransmitterContractAddress:
          "0xAD09780d193884d503182aD4588450C416D6F9D4",
        cctpMessengerContractAddress:
          "0x1682Ae6375C4E4A97e4B583BC394c861A46D8962",
        rpc: "https://mainnet.base.org",
      },
    ],
  },
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
  amount: number | string | ethers.BigNumber;
  configsSet: CCTPSdkConfigsSet;
  destinationSigner?: Signer;
  onApprove?: () => void;
  onBurnUSDC?: () => void;
  onGetMessageBytes?: () => void;
  onFetchAttestation?: () => void;
  onMintUSDC?: () => void;
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
    onApprove,
    onBurnUSDC,
    onGetMessageBytes,
    onFetchAttestation,
    onMintUSDC,
    beforeMintUSDC,
  } = options;

  const sourceNetworkConfigs = getNetworkConfigs(configsSet, sourceDomain);
  const destinationNetworkConfigs = getNetworkConfigs(
    configsSet,
    destinationDomain
  );

  if (onApprove) {
    onApprove();
  }

  const approveTx = await approveUSDC({
    signer,
    amount,
    sourceDomain,
    configsSet,
  });

  if (approveTx) {
    await waitForTransaction({
      rpc: sourceNetworkConfigs.rpc,
      txHash: approveTx.hash,
    });
  }

  if (onBurnUSDC) {
    onBurnUSDC();
  }

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

  if (onGetMessageBytes) {
    onGetMessageBytes();
  }

  const { messageBytes, messageHash } = await getMessageBytes({
    rpc: sourceNetworkConfigs.rpc,
    burnTxHash: burnTx.hash,
  });

  if (onFetchAttestation) {
    onFetchAttestation();
  }

  const attestationSignature = await fetchSignature({
    configsSet,
    messageHash,
  });

  if (beforeMintUSDC != null) {
    await beforeMintUSDC();
  }

  if (onMintUSDC) {
    onMintUSDC();
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

export interface ApproveUSDCOptions {
  signer: Signer;
  amount: number | string | ethers.BigNumber;
  sourceDomain: number;
  configsSet: CCTPSdkConfigsSet;
}

async function approveUSDC(options: ApproveUSDCOptions) {
  const { signer, amount, sourceDomain, configsSet } = options;
  const networkConfigs = getNetworkConfigs(configsSet, sourceDomain);
  const contract = getUSDCContract(networkConfigs.usdcContractAddress, signer);
  const signerAddress = await signer.getAddress();
  const allowance = await contract.allowance(
    signerAddress,
    networkConfigs.cctpMessengerContractAddress
  );

  if (allowance.lt(amount)) {
    return contract.approve(
      networkConfigs.cctpMessengerContractAddress,
      amount
    );
  }
}

export interface BurnUSDCOptions {
  signer: Signer;
  sourceDomain: number;
  destinationDomain: number;
  destinationAddress: string;
  amount: number | string | ethers.BigNumber;
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
  rpc: string;
  burnTxHash: string;
}

async function getMessageBytes(options: GetMessageBytesOptions) {
  const { rpc, burnTxHash } = options;
  const burnTx = await getEthTransactionReceipt({ rpc, txHash: burnTxHash });
  const iface = new Interface(messageTransmitterAbi);
  const messageSentLogs = parseLog(iface, burnTx.logs, "MessageSent");
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
  const contract = getMessageTransmitterContract(
    networkConfigs.cctpMessageTransmitterContractAddress,
    signer
  );

  return contract.receiveMessage(messageBytes, attestationSignature);
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
