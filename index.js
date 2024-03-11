const {
  restoreWallet,
  getSigningCosmWasmClient,
  getQueryClient,
} = require("@sei-js/core");
const { SigningStargateClient } = require("@cosmjs/stargate");
const { calculateFee } = require("@cosmjs/stargate");
const {readFileSync} = require("fs");

require('dotenv').config();
const mnemonic = process.env.MNEMONIC;

const REST_URL = "https://sei-api.polkachu.com/";
const RPC_URL_2 = "https://sei-rpc.brocha.in/";

const generateWalletFromMnemonic = async (mnemonic) => {
  const wallet = await restoreWallet(mnemonic, 0);
  return wallet;
};

const querySeiBalance = async (address) => {
  const queryClient = await getQueryClient(REST_URL);
  const result = await queryClient.cosmos.bank.v1beta1.balance({
    address: address,
    denom: "usei",
  });
  return result.balance;
};

const mintFn = async (client, address) => {
  try {
    /*
    const msg = {
      p: "sei-20",
      op: "mint",
      tick: "seis",
      amt: "1000",
    };
    const msg_base64 = Buffer.from(JSON.stringify(msg)).toString("base64");
    */
    const msg = 'data:,{"p":"Seiscriptions","op":"mint","tick":"Sein","amt":"2"}'
    // 将字符串转换为 Buffer 对象
    const buffer = Buffer.from(msg, 'utf-8');

    // 使用 Buffer 对象的 toString 方法将其转换为 Base64
    const msg_base64 = buffer.toString('base64');
    console.log(msg_base64);
    const fee = calculateFee(100000, "0.13usei");
    const response = await client.sendTokens(
      address,
      address,
      [{ amount: "1", denom: "usei" }],
      fee,
      msg_base64
    );
    console.log(`铸造完成, txhash: ${response.transactionHash}`);
  } catch (e) {
    // sleep 1s
    console.log(`exception: ${e.message}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
};

const walletMint = async (m) => {
  const wallet = await generateWalletFromMnemonic(m);

  const accounts = await wallet.getAccounts();
  console.log(`成功导入钱包: ${accounts[0].address}`);

  const balance = await querySeiBalance(accounts[0].address);
  console.log(balance);
  if (Number(balance.amount) === 0) {
    console.log(`账户余额不足`);
    return;
  }

  const signingCosmWasmClient = await getSigningCosmWasmClient(
    RPC_URL_2,
    wallet
  );

  for (let i = 1; i <= 15; i++) {
    await mintFn(signingCosmWasmClient, accounts[0].address);
  }
};

const main = async () => {
    await walletMint(process.env.MNEMONIC);
};

main();

