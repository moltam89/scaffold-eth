const { BigNumber, ethers } = require("ethers");

const STORAGE_KEY = "transactionResponses";

export class TransactionManager {
	constructor(provider, signer) {
		this.provider = provider;
		this.signer = signer;
	}

	getStorageKey() {
		return STORAGE_KEY;
	}

	getTransactionResponsesJSON() {
		let transactionResponsesString = localStorage.getItem(STORAGE_KEY);

		if (transactionResponsesString === null) {
			return {};
		}

		return JSON.parse(transactionResponsesString);
	}
	setTransactionResponsesJSON(transactionResponsesJSON) {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(transactionResponsesJSON));
	}

	getTransactionResponse(nonce) {
		let transactionResponsesJSON = this.getTransactionResponsesJSON();

		return transactionResponsesJSON[nonce];
	}
	storeTransactionResponse(transactionResponse) {
		let transactionResponsesJSON = this.getTransactionResponsesJSON();

		let nonce = transactionResponse.nonce;
		transactionResponsesJSON[nonce] = transactionResponse;

		this.setTransactionResponsesJSON(transactionResponsesJSON);
	}
	removeTransactionResponse(nonce) {
		let transactionResponsesJSON = this.getTransactionResponsesJSON();

		delete transactionResponsesJSON[nonce];

		this.setTransactionResponsesJSON(transactionResponsesJSON);
	}


	getTransactionResponsesArray() {
		let transactionResponsesJSON = this.getTransactionResponsesJSON();

		if (!transactionResponsesJSON) {
			return [];
		}

		let transactionResponsesArray = [];

		let keysArray = Object.keys(transactionResponsesJSON);

		keysArray.forEach(key => {
			transactionResponsesArray.push(transactionResponsesJSON[key]);
		})

		return transactionResponsesArray;
	}

	async getConfirmations(hash) {
		let transactionResponse = await this.provider.getTransaction(hash);

		return transactionResponse.confirmations;
	}	
	
	async speedUpTransaction(nonce, speedUpPercentage) {
		if (!speedUpPercentage) {
			speedUpPercentage = 10;
		}

		let transactionResponse = this.getTransactionResponse(nonce);

		if (!transactionResponse) {
			return;
		}

		//let confirmations = await this.getConfirmations(transactionResponse.hash);
		//console.log("confirmationssss", confirmations);

		let transactionParams = this.getTransactionParams(transactionResponse);

		// Legacy txs
		if (transactionParams.gasPrice) {
			transactionParams.gasPrice = this.getUpdatedGasPrice(transactionParams.gasPrice, speedUpPercentage);
		}
		// EIP1559
		else {
			transactionParams.maxPriorityFeePerGas = this.getUpdatedGasPrice(transactionParams.maxPriorityFeePerGas, speedUpPercentage);
			transactionParams.maxFeePerGas = this.getUpdatedGasPrice(transactionParams.maxFeePerGas, speedUpPercentage);
		}

		console.log("new transactionParams", transactionParams);
	}

	getUpdatedGasPrice(gasPrice, speedUpPercentage) {
		let gasPriceBigNumber = BigNumber.from(gasPrice);

		gasPriceBigNumber = gasPriceBigNumber.mul(speedUpPercentage + 100).div(100);

		return gasPriceBigNumber.toHexString();
	}

	getTransactionParams(transactionResponse) {
		if (!transactionResponse) {
			return {};
		}

		let transactionParams = {};

		["type", "chainId", "nonce", "maxPriorityFeePerGas", "maxFeePerGas", "gasPrice", "gasLimit", "to", "value", "data"].forEach(param => {
			this.addTransactionParamIfExists(transactionParams, param, transactionResponse[param]);
		})
		
		return transactionParams;
	}

	addTransactionParamIfExists(transactionParams, name, param) {
		if (param && param != null) {
			transactionParams[name] = (param);
		}
	}
}




