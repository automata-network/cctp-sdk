import { Contract, Signer, providers } from "ethers";
import ERC20Abi from "./abis/ERC20.json";
import tokenMessengerAbi from "./abis/TokenMessenger.json";
import messageTransmitterAbi from "./abis/MessageTransmitter.json";
import { Interface } from "ethers/lib/utils";

export function getUSDCContract(
  usdcContractAddress: string,
  signer: Signer | providers.Provider
) {
  return new Contract(usdcContractAddress, ERC20Abi, signer);
}

export function getTokenMessengerContract(
  messengerContractAddress: string,
  signer: Signer | providers.Provider
) {
  return new Contract(messengerContractAddress, tokenMessengerAbi, signer);
}

export function getMessageTransmitterContract(
  messageTransmitterContractAddress: string,
  signer: Signer | providers.Provider
) {
  return new Contract(
    messageTransmitterContractAddress,
    messageTransmitterAbi,
    signer
  );
}

export async function waitFor<T = void>(options: {
  callback: (
    next: () => void,
    resolve: (data: T) => void,
    reject: (e: unknown) => void
  ) => Promise<void>;
}) {
  const { callback } = options;
  let errorRetryCount = 0;
  let getStatusCount = 0;
  const backoffStrategyFactor = 1.5;
  const throttleInterval = 3 * 1000;

  function setTimer(
    resolve: (data: T) => void,
    reject: (err: unknown) => void
  ) {
    setTimeout(async () => {
      try {
        await callback(
          () => {
            errorRetryCount = 0;
            getStatusCount += 1;
            setTimer(resolve, reject);
          },
          resolve,
          reject
        );
      } catch (e) {
        if (errorRetryCount >= 3) {
          reject(e);
        } else {
          getStatusCount += 1;
          errorRetryCount += 1;
          setTimer(resolve, reject);
        }
      }
    }, throttleInterval * getStatusCount * backoffStrategyFactor);
  }

  return new Promise<T>((resolve, reject) => {
    setTimer(resolve, reject);
  });
}

export async function waitForTransaction(options: {
  rpc: string;
  txHash: string;
}) {
  await waitFor({
    callback: async (next, resolve, reject) => {
      const result = await getEthTransactionStatus(options);

      if (result === TransactionStatus.Pending) {
        next();
      } else if (result === TransactionStatus.Failed) {
        reject(new Error("transaction failed"));
      } else {
        resolve();
      }
    },
  });
}

export async function waitForAttestation(options: {
  apiHost: string;
  messageHash: string;
}) {
  return waitFor<string>({
    callback: async (next, resolve, reject) => {
      const attestation = await fetchAttestation(options);

      if (attestation) {
        resolve(attestation);
      } else {
        next();
      }
    },
  });
}

export async function fetchAttestation(options: {
  apiHost: string;
  messageHash: string;
}) {
  const { apiHost, messageHash } = options;

  const response = await fetch(`${apiHost}/attestations/${messageHash}`);

  const responseError = new Error(
    `get circle iris api failed. status: ${response.status}`
  );

  if (response.status === 200) {
    const attestationResponse = await response.json();

    if (
      attestationResponse &&
      attestationResponse.status === "complete" &&
      attestationResponse.attestation
    ) {
      return attestationResponse.attestation;
    }
  } else if (response.status === 404) {
    try {
      const attestationResponse = await response.json();

      // if response status is 404, and the error is message hash not found
      // we don't see it as an error, return empty attestation
      if (attestationResponse.error === "Message hash not found") {
        return;
      }
    } catch (e) {
      console.error(e);
    }
  }

  throw responseError;
}

enum TransactionStatus {
  Pending,
  Failed,
  Successful,
}

async function getEthTransactionStatus(options: {
  rpc: string;
  txHash: string;
}) {
  const receipt = await getEthTransactionReceipt(options);

  return receipt && receipt.status != null
    ? receipt.status === 0
      ? TransactionStatus.Failed
      : TransactionStatus.Successful
    : TransactionStatus.Pending;
}

export async function getEthTransactionReceipt(options: {
  rpc: string;
  txHash: string;
}) {
  const { rpc, txHash } = options;

  const provider = new providers.StaticJsonRpcProvider(rpc);

  const receipt = await provider.getTransactionReceipt(txHash);

  return receipt;
}
export function parseLog(
  iface: Interface,
  logs: Array<any>,
  methodName: string
) {
  for (const receiptLog of logs) {
    try {
      let parsedLog = iface.parseLog(receiptLog);

      if (parsedLog.name === methodName) {
        return { log: receiptLog, parsedLog };
      }
    } catch (e) {
      // the correct log might be the other logs in the list
      continue;
    }
  }
}
