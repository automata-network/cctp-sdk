import React, { useCallback, useEffect, useState } from "react";
import "./App.css";
import {
  Button,
  Flex,
  Form,
  Input,
  Layout,
  Select,
  Typography,
  notification,
} from "antd";
import {
  CCTPDomain,
  CCTPSdk,
  TransferUSDCResult,
} from "@automata-network/cctp-sdk";
import { init, useConnectWallet, useSetChain } from "@web3-onboard/react";
import injectedModule from "@web3-onboard/injected-wallets";
import { Contract, ethers, providers } from "ethers";
import { LoadingOutlined, WalletOutlined } from "@ant-design/icons";
import ERC20Abi from "./ERC20.json";

const testnetSdk = CCTPSdk().testnet();

const injected = injectedModule();

const chains = [
  {
    id: 5,
    cctpDomain: CCTPDomain.Ethereum,
    token: "ETH",
    label: "Ethereum Goerli",
    rpcUrl: testnetSdk.configs.networks?.find(
      (item) => item.domain === CCTPDomain.Ethereum
    )?.rpc,
  },
  {
    id: 43113,
    cctpDomain: CCTPDomain.Avalanche,
    token: "AVAX",
    label: "Avalanche Fuji",
    rpcUrl: testnetSdk.configs.networks?.find(
      (item) => item.domain === CCTPDomain.Avalanche
    )?.rpc,
  },
  {
    id: 80001,
    cctpDomain: CCTPDomain.Mumbai,
    token: "MATIC",
    label: "Polygon Mumbai",
    rpcUrl: testnetSdk.configs.networks?.find(
      (item) => item.domain === CCTPDomain.Mumbai
    )?.rpc,
  },
  {
    id: 420,
    cctpDomain: CCTPDomain.Optimism,
    token: "OP",
    label: "Optimism Goerli",
    rpcUrl: testnetSdk.configs.networks?.find(
      (item) => item.domain === CCTPDomain.Optimism
    )?.rpc,
  },
  {
    id: 421613,
    cctpDomain: CCTPDomain.Arbitrum,
    token: "ETH",
    label: "Arbitrum Goerli",
    rpcUrl: testnetSdk.configs.networks?.find(
      (item) => item.domain === CCTPDomain.Arbitrum
    )?.rpc,
  },
  {
    id: 84531,
    cctpDomain: CCTPDomain.Base,
    token: "ETH",
    label: "Base",
    rpcUrl: testnetSdk.configs.networks?.find(
      (item) => item.domain === CCTPDomain.Base
    )?.rpc,
  },
];

init({
  connect: { autoConnectLastWallet: true },
  wallets: [injected],
  chains: chains.map((item) => {
    const { id, token, label, rpcUrl } = item;

    return { id, token, label, rpcUrl };
  }),
});

const usdcDecimals = 6;

function App() {
  const [form] = Form.useForm();
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
  const [{ connectedChain, settingChain }, setChain] = useSetChain();
  const setChainByCCTPDomain = useCallback(
    async (value: string) => {
      const chainConfigs = chains.find(
        (item) => item.cctpDomain === (CCTPDomain[value as any] as any)
      );

      if (chainConfigs) {
        await setChain({
          chainId: `0x${chainConfigs.id.toString(16)}`,
        });
      }
    },
    [setChain]
  );
  const [submitting, setSubmitting] = useState(false);
  const sourceChain = Form.useWatch("sourceChain", form);
  const [balance, setBalance] = useState<string>();
  const [result, setResult] = useState<{
    sourceDomain: CCTPDomain;
    transferResult: TransferUSDCResult;
  }>();
  const [checkingStatus, setCheckingStatus] = useState<boolean>();

  async function getUSDCBalance(chain: string, walletAddress?: string) {
    setBalance(undefined);

    const chainConfigs = chains.find(
      (item) => item.cctpDomain === (CCTPDomain[chain as any] as any)
    );
    const cctpConfigs = testnetSdk.configs.networks?.find(
      (item) => item.domain === (CCTPDomain[chain as any] as any)
    );

    if (!cctpConfigs || !chainConfigs || !walletAddress) {
      return;
    }

    const contract = new Contract(
      cctpConfigs?.usdcContractAddress,
      ERC20Abi,
      new providers.StaticJsonRpcProvider(chainConfigs?.rpcUrl)
    );

    const balance = await contract.balanceOf(walletAddress);

    setBalance(ethers.utils.formatUnits(balance, usdcDecimals));
  }

  useEffect(() => {
    getUSDCBalance(sourceChain, wallet?.accounts[0].address);
  }, [sourceChain, wallet]);

  return (
    <Layout>
      <Layout.Header>
        <Flex style={{ height: "100%" }} align="center" justify="space-between">
          <Typography.Text
            style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}
          >
            CCTP SDK Demo
          </Typography.Text>
          <Flex align="center" gap="middle">
            <Typography.Text style={{ color: "#fff", fontSize: 14 }}>
              {wallet && wallet.accounts.length ? (
                <Flex align="center" gap="small">
                  <WalletOutlined style={{ color: "#fff" }} />
                  {addressShortener(wallet.accounts[0].address)}
                </Flex>
              ) : null}
            </Typography.Text>

            <Button
              type="primary"
              loading={connecting}
              onClick={() => (wallet ? disconnect(wallet) : connect())}
            >
              {connecting ? "Connecting" : wallet ? "Disconnect" : "Connect"}
            </Button>
          </Flex>
        </Flex>
      </Layout.Header>
      <Layout.Content style={{ padding: 30 }}>
        <Form
          form={form}
          layout="vertical"
          size="large"
          onFinish={async (values) => {
            const provider = new ethers.providers.Web3Provider(
              // @ts-ignore
              wallet?.provider,
              "any"
            );

            const signer = provider.getSigner();

            try {
              setSubmitting(true);

              const result = await testnetSdk.transferUSDC({
                signer,
                sourceDomain: CCTPDomain[values.sourceChain as any] as any,
                destinationDomain: CCTPDomain[
                  values.destinationChain as any
                ] as any,
                destinationAddress: values.destinationAddress,
                amount: ethers.utils
                  .parseUnits(values.amount, usdcDecimals)
                  .toString(),
                onApprove: () => {
                  notification.destroy("processTips");
                  notification.info({
                    key: "processTips",
                    icon: <LoadingOutlined />,
                    message: "Approving USDC on source chain...",
                    duration: 0,
                  });
                },
                onBurnUSDC: () => {
                  notification.destroy("processTips");
                  notification.info({
                    key: "processTips",
                    icon: <LoadingOutlined />,
                    message: "Burning USDC on source chain...",
                    duration: 0,
                  });
                },
                onGetMessageBytes: () => {
                  notification.destroy("processTips");
                  notification.info({
                    key: "processTips",
                    icon: <LoadingOutlined />,
                    message: "Getting Message Bytes...",
                    duration: 0,
                  });
                },
                onFetchAttestation: () => {
                  notification.destroy("processTips");
                  notification.info({
                    key: "processTips",
                    icon: <LoadingOutlined />,
                    message: "Fetching Attestation...",
                    duration: 0,
                  });
                },
                onMintUSDC: () => {
                  notification.destroy("processTips");
                  notification.info({
                    key: "processTips",
                    icon: <LoadingOutlined />,
                    message: "Minting USDC on destination chain...",
                    duration: 0,
                  });
                },
                beforeMintUSDC: async () => {
                  await setChainByCCTPDomain(values.destinationChain);
                },
              });

              setResult({
                sourceDomain: CCTPDomain[values.sourceChain as any] as any,
                transferResult: result,
              });

              notification.destroy("processTips");
              notification.success({
                message: "Transfer USDC successfully",
              });
            } catch (e) {
              notification.destroy("processTips");
              notification.error({ message: "Transfer USDC failed" });
              console.error(e);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Form.Item shouldUpdate noStyle>
            {() => {
              return (
                <Form.Item label="Source Chain" name="sourceChain">
                  <Select
                    options={Object.keys(CCTPDomain)
                      .filter((item) => isNaN(parseInt(item)))
                      .filter((item) => {
                        const destinationChain =
                          form.getFieldValue("destinationChain");
                        return item !== destinationChain;
                      })
                      .map((key) => {
                        return {
                          key,
                          label: key,
                          value: key,
                        };
                      })}
                    onChange={(value) => {
                      setChainByCCTPDomain(value);
                    }}
                  />
                </Form.Item>
              );
            }}
          </Form.Item>
          <Form.Item shouldUpdate noStyle>
            {() => {
              return (
                <Form.Item label="Destination Chain" name="destinationChain">
                  <Select
                    options={Object.keys(CCTPDomain)
                      .filter((item) => isNaN(parseInt(item)))
                      .filter((item) => {
                        const sourceChain = form.getFieldValue("sourceChain");

                        return item !== sourceChain;
                      })
                      .map((key) => {
                        return {
                          key,
                          label: key,
                          value: key,
                        };
                      })}
                  />
                </Form.Item>
              );
            }}
          </Form.Item>
          <Form.Item label="Destination Address" name="destinationAddress">
            <Input />
          </Form.Item>
          <Form.Item
            label="Amount"
            name="amount"
            extra={balance ? `Balance: ${balance}` : undefined}
          >
            <Input type="number" addonAfter="USDC" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block>
              Transfer USDC
            </Button>
          </Form.Item>
          <Form.Item>
            <Button
              disabled={!result}
              loading={checkingStatus}
              block
              onClick={async () => {
                if (result) {
                  console.log("result", result);
                  setCheckingStatus(true);

                  try {
                    const isTransferCompleted =
                      await testnetSdk.isTransferCompleted({
                        sourceDomain: result.sourceDomain,
                        burnTxHash: result.transferResult.burnTxHash,
                      });

                    if (isTransferCompleted) {
                      notification.success({
                        message: "Your transaction is completed",
                      });
                    } else {
                      notification.error({
                        message: "Your transaction is not completed",
                      });
                    }
                  } finally {
                    setCheckingStatus(false);
                  }
                }
              }}
            >
              Check transfer status on chain
            </Button>
          </Form.Item>
        </Form>
      </Layout.Content>
    </Layout>
  );
}

export default App;

const addressShortener = (address: string, start = 5, end = 4) => {
  return address.length > start + end
    ? `${address.slice(0, start)}...${address.slice(address.length - end)}`
    : address;
};
