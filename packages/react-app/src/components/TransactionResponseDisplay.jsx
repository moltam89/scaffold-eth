import { Button } from "antd";
import React, { useEffect, useState } from "react";

import { TransactionManager } from "../helpers/TransactionManager";

const { BigNumber, ethers } = require("ethers");

export default function TransactionResponseDisplay({transactionResponse, transactionManager}) {
  const [confirmations, setConfirmations] = useState(transactionResponse.confirmations);
  const [loading, setLoading] = useState(false);

  const updateConfirmations = async () => {
    let confirmations = await transactionManager.getConfirmations(transactionResponse);

    if (confirmations >= 20) {
      transactionManager.removeTransactionResponse(transactionResponse);
    }

    setConfirmations(confirmations);
  }

  useEffect(() => {
    const interval = setInterval(() => {
      updateConfirmations()
    }, 1000);
    return () => clearInterval(interval);
  }, []);


  return  (
    <div>  

      <b> -nonce: </b>{transactionResponse.nonce}
      <b> -confirmations: </b>{confirmations} 
      <b> -hash: </b>{transactionResponse.hash} 
      {(confirmations == 0) &&          
         <Button
            onClick={ () => {
              transactionManager.speedUpTransaction(transactionResponse.nonce, 20);
            }}
            size="large"
            shape="round"
            loading={loading}
          >
            SpeedUpTx
          </Button>
        }
       
       <b> -maxPriorityFeePerGas: </b> {ethers.utils.formatUnits(transactionResponse.maxPriorityFeePerGas, "gwei")}
       <b> -maxFeePerGas: </b> {ethers.utils.formatUnits(transactionResponse.maxFeePerGas, "gwei")}
    </div>
  );
}
