# cctp-sdk

An SDK to integrate with Circle CCTP

## Install

```
npm i @automata-network/cctp-sdk -S
```

## Usage

```typescript
import { CCTPDomain, CCTPSdk } from "@automata-network/cctp-sdk";

const testnetSdk = CCTPSdk().testnet();

await testnetSdk.transferUSDC({
  signer, // your signer
  sourceDomain: CCTPDomain.Ethereum
  destinationDomain: CCTPDomain.Avalanche,
  destinationAddress: "0xAbD1626FCc4b288aF31695b007Ca1268D7E9Fe19",
  amount: ethers.utils
    .parseUnits("0.0001", 6)
    .toString(),
  onApprove: () => {
    // show your loading toast
  },
  onBurnUSDC: () => {
    // show your loading toast
  },
  onGetMessageBytes: () => {
    // show your loading toast
  },
  onFetchAttestation: () => {
    // show your loading toast
  },
  onMintUSDC: () => {
    // show your loading toast
  },
  beforeMintUSDC: async () => {
    // switch chain here before sending redemption
  },
  destinationSigner, // another signer for sending redemption, if you use same signer as the source chain, can skip this settings
});
```

or you can do it step by step:

```typescript
// step1: approve
await testnetSdk.approveUSDC();

// step2: burnUSDC
await testnetSdk.burnUSDC();

// step3: getMessageBytes
await testnetSdk.getMessageBytes();

// step4: fetchAttestation
await testnetSdk.fetchAttestation();

// step5: mintUSDC
await testnetSdk.mintUSDC();
```

see [here](./packages/sdk/src/sdk.ts#219) for more details

---

if you need to add your configs:

```typescript
import {
  CCTPDomain,
  CCTPSdk,
  defaultConfigs,
} from "@automata-network/cctp-sdk";

const testnetSdk = CCTPSdk({
  mainnet: {
    irisApiHost: defaultConfigs.mainnet.irisApiHost,
    networks: [
      {
        domain: CCTPDomain.Avalanche,
        usdcContractAddress: "0x5425890298aed601595a70ab815c96711a31bc65",
        cctpMessageTransmitterContractAddress:
          "0xa9fb1b3009dcb79e2fe346c16a604b8fa8ae0a79",
        cctpMessengerContractAddress:
          "0xeb08f243e5d3fcff26a9e38ae5520a669f4019d0",
        rpc: "https://rpc.ankr.com/avalanche_fuji",
      },
    ],
  },
  testnet: {
    irisApiHost: defaultConfigs.testnet.irisApiHost,
    networks: [
      {
        domain: CCTPDomain.Avalanche,
        usdcContractAddress: "0x5425890298aed601595a70ab815c96711a31bc65",
        cctpMessageTransmitterContractAddress:
          "0xa9fb1b3009dcb79e2fe346c16a604b8fa8ae0a79",
        cctpMessengerContractAddress:
          "0xeb08f243e5d3fcff26a9e38ae5520a669f4019d0",
        rpc: "https://rpc.ankr.com/avalanche_fuji",
      },
    ],
  },
}).testnet();
```

# LICENSE

MIT
