import { Button } from "antd";
import React, { useEffect, useState } from "react";

const { BigNumber, ethers } = require("ethers");

let generalProvider = new ethers.providers.StaticJsonRpcProvider("https://polygon-rpc.com/");

export default function SpeedUpTx({signer}) {

  const [speedUpNeeded, setSpeedUpNeeded] = useState(false);

  const checkForPendingTx = async() => {
    const pendingTx = localStorage.getItem("pendingTxHash");

    if (pendingTx) {
      console.log("pendingTx", pendingTx);
      let transactionResponse = await generalProvider.getTransaction(pendingTx);
      console.log("transactionResponseConfirmations", transactionResponse?.confirmations);  

      if (transactionResponse?.confirmations == 0) {
        setSpeedUpNeeded(true)
      }
      else {
        localStorage.removeItem("pendingTxParams");
        localStorage.removeItem("pendingTxHash");
        if (speedUpNeeded)  {
          console.log("Tx was confirmed")
          setSpeedUpNeeded(false);
        }
      }
    }
  }

  const speedUpTx = async () => {
    let txParams = JSON.parse(localStorage.getItem("pendingTxParams"));
    console.log("txParams", txParams);
    let currentGasPrice = BigNumber.from(txParams.gasPrice);
    delete txParams.gasPrice;
    console.log("currentGasPrice", currentGasPrice);
    let gasPrice = currentGasPrice.mul(2);
    txParams.gasPrice = gasPrice.toHexString();
    console.log("updatedGasPrice", txParams.gasPrice);

    let value = BigNumber.from(txParams.value);
    txParams.value = value.toHexString();

    console.log("Speeding up tx", txParams);
    let result = await signer.sendTransaction(txParams);
    console.log("speedy tx", result);
  }

  checkForPendingTx();

  return  (
    <div>  
       { speedUpNeeded && 
          <Button
            onClick={() => {
              speedUpTx();
            }}
            size="large"
            shape="round"
          >
            SpeedUpTx
          </Button>   
       }

    </div>
  );
}
