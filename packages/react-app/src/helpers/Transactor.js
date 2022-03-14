import { hexlify } from "@ethersproject/bytes";
import { parseUnits } from "@ethersproject/units";
import { notification } from "antd";
import Notify from "bnc-notify";
import { BLOCKNATIVE_DAPPID } from "../constants";

const { BigNumber, ethers } = require("ethers");
const generalProvider = new ethers.providers.StaticJsonRpcProvider("https://polygon-rpc.com/");


// this should probably just be renamed to "notifier"
// it is basically just a wrapper around BlockNative's wonderful Notify.js
// https://docs.blocknative.com/notify

export default function Transactor(provider, gasPrice, etherscan, userSigner) {
  const getNonce = async () => {
    let address = await userSigner.getAddress();
    return await generalProvider.getTransactionCount(address);
  }

  if (typeof provider !== "undefined") {
    // eslint-disable-next-line consistent-return
    return async tx => {
      const signer = userSigner ? userSigner : provider.getSigner();
      console.log("signer", signer);
      const network = await provider.getNetwork();
      console.log("network", network);
      const options = {
        dappId: BLOCKNATIVE_DAPPID, // GET YOUR OWN KEY AT https://account.blocknative.com
        system: "ethereum",
        networkId: network.chainId,
        // darkMode: Boolean, // (default: false)
        transactionHandler: txInformation => {
          console.log("HANDLE TX", txInformation);
        },
      };
      const notify = Notify(options);

      let etherscanNetwork = "";
      if (network.name && network.chainId > 1) {
        etherscanNetwork = network.name + ".";
      }

      let etherscanTxUrl = "https://" + etherscanNetwork + "etherscan.io/tx/";
      if (network.chainId === 100) {
        etherscanTxUrl = "https://blockscout.com/poa/xdai/tx/";
      }

      try {
        let result;
        if (tx instanceof Promise) {
          console.log("AWAITING TX", tx);
          result = await tx;
        } else {
          //if (!tx.gasPrice) {
          //  tx.gasPrice = gasPrice || parseUnits("4.1", "gwei");
          //}
          //if (!tx.gasLimit) {
          //  tx.gasLimit = hexlify(120000);
          //}

          if (userSigner) {
            tx.nonce = await getNonce();
            tx.maxPriorityFeePerGas = ethers.utils.parseUnits("40", "gwei");
            tx.maxFeePerGas = ethers.utils.parseUnits("200", "gwei");
            tx.gasLimit = 21000;
            tx.type = 2;
          }

          let populatedTx = await userSigner.populateTransaction(tx);
          console.log("populatedTx", populatedTx);

          let signedTx = await userSigner.signTransaction(populatedTx);
          console.log("signedTx", signedTx);

          let signedTx2 = await userSigner.signTransaction(tx);
          console.log("signedTx2", signedTx2);

          let hash = ethers.utils.keccak256(signedTx);
          console.log("hash", hash);

          let hash2 = ethers.utils.keccak256(signedTx2);
          console.log("hash2", hash2);

          console.log("RUNNING TX", tx);
          result = await signer.sendTransaction(tx);
          if (userSigner) {
            localStorage.setItem("pendingTxParams", JSON.stringify(tx));
            localStorage.setItem("pendingTxHash", result.hash);
          }
        }
        console.log("RESULT:", result);
        // console.log("Notify", notify);

        // if it is a valid Notify.js network, use that, if not, just send a default notification
        if ([1, 3, 4, 5, 42, 100].indexOf(network.chainId) >= 0) {
          const { emitter } = notify.hash(result.hash);
          emitter.on("all", transaction => {
            return {
              onclick: () => window.open((etherscan || etherscanTxUrl) + transaction.hash),
            };
          });
        } else {
          notification.info({
            message: "Local Transaction Sent",
            description: result.hash,
            placement: "bottomRight",
          });
        }

        return result;
      } catch (e) {
        console.log(e);
        console.log("Transaction Error:", e.message);
        notification.error({
          message: "Transaction Error",
          description: e.message,
        });
      }
    };
  }
}
