import merge from "lodash/merge";

export enum CCTPDomain {
  Ethereum = 0,
  Avalanche = 1,
  Optimism = 2,
  Arbitrum = 3,
  Base = 6,
  Mumbai = 7,
}
interface CCTPSdkConfigsSet {
  irisApi?: string;
  networks?: {
    rpc: string;
    domain: number;
    usdcContractAddress: string;
    cctpMessengerContractAddress: string;
    cctpMessageTransmitterContractAddress: string;
  }[];
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

      return {};
    },
    mainnet: () => {
      const mainnetConfigs = mergedConfigs.mainnet;
    },
  };
}

function generateActions(configsSet: CCTPSdkConfigsSet) {
  return {
    configs: configsSet,
    transferUSDC: () => {},
    approveUSDC: () => {},
    burnUSDC: () => {},
    getMessageBytes: () => {},
    fetchAttestation: () => {},
    receiveMessage: () => {},
  };
}

function transferUSDC(options: {
  fromDomain: number;
  toDomain: number;
  configsSet: CCTPSdkConfigsSet;
}) {}

function approveUSDC() {}

function burnUSDC() {}

function getMessageBytes() {}

function fetchAttestation() {}

function receiveMessage() {}

// // initialize contracts using address and ABI
// const ethTokenMessengerContract = new web3.eth.Contract(
//   tokenMessengerAbi,
//   ETH_TOKEN_MESSENGER_CONTRACT_ADDRESS,
//   { from: ethSigner.address }
// );
// const usdcEthContract = new web3.eth.Contract(
//   usdcAbi,
//   USDC_ETH_CONTRACT_ADDRESS,
//   { from: ethSigner.address }
// );
// const ethMessageContract = new web3.eth.Contract(
//   messageAbi,
//   ETH_MESSAGE_CONTRACT_ADDRESS,
//   { from: ethSigner.address }
// );
// const avaxMessageTransmitterContract = new web3.eth.Contract(
//   messageTransmitterAbi,
//   AVAX_MESSAGE_TRANSMITTER_CONTRACT_ADDRESS,
//   { from: avaxSigner.address }
// );

// // AVAX destination address
// const mintRecipient = process.env.RECIPIENT_ADDRESS;
// const destinationAddressInBytes32 = await ethMessageContract.methods
//   .addressToBytes32(mintRecipient)
//   .call();
// const AVAX_DESTINATION_DOMAIN = 1;

// // Amount that will be transferred
// const amount = process.env.AMOUNT;

// // STEP 1: Approve messenger contract to withdraw from our active eth address
// const approveTxGas = await usdcEthContract.methods
//   .approve(ETH_TOKEN_MESSENGER_CONTRACT_ADDRESS, amount)
//   .estimateGas();
// const approveTx = await usdcEthContract.methods
//   .approve(ETH_TOKEN_MESSENGER_CONTRACT_ADDRESS, amount)
//   .send({ gas: approveTxGas });
// const approveTxReceipt = await waitForTransaction(
//   web3,
//   approveTx.transactionHash
// );
// console.log("ApproveTxReceipt: ", approveTxReceipt);

// // STEP 2: Burn USDC
// const burnTxGas = await ethTokenMessengerContract.methods
//   .depositForBurn(
//     amount,
//     AVAX_DESTINATION_DOMAIN,
//     destinationAddressInBytes32,
//     USDC_ETH_CONTRACT_ADDRESS
//   )
//   .estimateGas();
// const burnTx = await ethTokenMessengerContract.methods
//   .depositForBurn(
//     amount,
//     AVAX_DESTINATION_DOMAIN,
//     destinationAddressInBytes32,
//     USDC_ETH_CONTRACT_ADDRESS
//   )
//   .send({ gas: burnTxGas });
// const burnTxReceipt = await waitForTransaction(web3, burnTx.transactionHash);
// console.log("BurnTxReceipt: ", burnTxReceipt);

// // STEP 3: Retrieve message bytes from logs
// const transactionReceipt = await web3.eth.getTransactionReceipt(
//   burnTx.transactionHash
// );
// const eventTopic = web3.utils.keccak256("MessageSent(bytes)");
// const log = transactionReceipt.logs.find((l) => l.topics[0] === eventTopic);
// const messageBytes = web3.eth.abi.decodeParameters(["bytes"], log.data)[0];
// const messageHash = web3.utils.keccak256(messageBytes);

// console.log(`MessageBytes: ${messageBytes}`);
// console.log(`MessageHash: ${messageHash}`);

// // STEP 4: Fetch attestation signature
// let attestationResponse = { status: "pending" };
// while (attestationResponse.status != "complete") {
//   const response = await fetch(
//     `https://iris-api-sandbox.circle.com/attestations/${messageHash}`
//   );
//   attestationResponse = await response.json();
//   await new Promise((r) => setTimeout(r, 2000));
// }

// const attestationSignature = attestationResponse.attestation;
// console.log(`Signature: ${attestationSignature}`);

// // STEP 5: Using the message bytes and signature recieve the funds on destination chain and address
// web3.setProvider(process.env.AVAX_TESTNET_RPC); // Connect web3 to AVAX testnet
// const receiveTxGas = await avaxMessageTransmitterContract.methods
//   .receiveMessage(messageBytes, attestationSignature)
//   .estimateGas();
// const receiveTx = await avaxMessageTransmitterContract.methods
//   .receiveMessage(messageBytes, attestationSignature)
//   .send({ gas: receiveTxGas });
// const receiveTxReceipt = await waitForTransaction(
//   web3,
//   receiveTx.transactionHash
// );
