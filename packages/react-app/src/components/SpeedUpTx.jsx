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
      console.log("transactionResponse", transactionResponse);  
      
      let confirmations = transactionResponse?.confirmations;
      console.log("confirmations", confirmations);

      if (confirmations == undefined) {
        console.log("confirmations is undefined");
        return;
      }

      if (confirmations == 0) {
        setSpeedUpNeeded(true)
      }
      else {
        console.log("Tx was confirmed, clearing localStorage")

        localStorage.removeItem("pendingTxParams");
        localStorage.removeItem("pendingTxHash");
        if (speedUpNeeded)  {
          setSpeedUpNeeded(false);
        }
      }
    }
  }

  const speedUpTx = async () => {
    let txParams = JSON.parse(localStorage.getItem("pendingTxParams"));
    console.log("txParams", txParams);

    let currentMaxPriorityFeePerGas = BigNumber.from(txParams.maxPriorityFeePerGas);
    console.log("currentMaxPriorityFeePerGas", currentMaxPriorityFeePerGas);

    let maxPriorityFeePerGas = currentMaxPriorityFeePerGas.mul(40);
    txParams.maxPriorityFeePerGas = maxPriorityFeePerGas.toHexString();
    console.log("updatedmaxFeePerGas", txParams.maxPriorityFeePerGas);

    //let value = BigNumber.from(txParams.value);
    //txParams.value = value.toHexString();

    console.log("Speeding up txParams", txParams);

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
