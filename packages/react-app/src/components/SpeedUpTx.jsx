import { Button } from "antd";
import React, { useEffect, useState } from "react";
//import { getStorageKey, getTransactionResponsesArray, storeTransactionResponse } from "../helpers/TransactionManager";
import { TransactionManager } from "../helpers/TransactionManager";
import { TransactionResponseDisplay } from "./";

const { BigNumber, ethers } = require("ethers");


export default function SpeedUpTx({provider, signer}) {
  const transactionManager = new TransactionManager(provider, signer);

  const [transactionResponsesArray, setTransactionResponsesArray] = useState();

  const initTransactionResponsesArray = async () => {
    setTransactionResponsesArray(await transactionManager.getTransactionResponsesArray());
  }

  useEffect(async () => {
    initTransactionResponsesArray();
  }, []);

  useEffect(async () => {
    window.addEventListener('storage', async () => {
      initTransactionResponsesArray();
    });   
  }, []);


  if (!transactionResponsesArray) {
    return  (
      <div>  
          loading
      </div>
    );
  }

  return  (
    <div>  
       {transactionResponsesArray.map(
        transactionResponse => {
          return (
            <TransactionResponseDisplay transactionResponse={transactionResponse} transactionManager={transactionManager}/>
          )
        })
       }
    </div>
  );
}
