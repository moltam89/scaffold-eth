import { Button } from "antd";
import React, { useEffect, useState } from "react";

import { TransactionManager } from "../helpers/TransactionManager";

const { BigNumber, ethers } = require("ethers");

export default function TransactionResponseDisplay({transactionResponse, transactionManager}) {
  const [confirmations, setConfirmations] = useState();
  const [loading, setLoading] = useState(false);

  useEffect(async () => {
    setConfirmations(await transactionManager.getConfirmations(transactionResponse));
  }, []);

  console.log("loading", loading);

  return  (
    <div>  

      -nonce:{transactionResponse.nonce} 
      -hash:{transactionResponse.hash} 
      {(confirmations == 0) &&          
         <Button
            onClick={ () => {
              transactionManager.speedUpTransaction(transactionResponse.nonce, 50);
            }}
            size="large"
            shape="round"
            loading={loading}
          >
            SpeedUpTx
          </Button>
        }
       
       -maxPriorityFeePerGas: {ethers.utils.formatUnits(transactionResponse.maxPriorityFeePerGas, "gwei")}
       -maxFeePerGas: {ethers.utils.formatUnits(transactionResponse.maxFeePerGas, "gwei")}
    </div>
  );
}
