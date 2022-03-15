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

		// Listen for changes with localStorage on the same window
		// https://jsfiddle.net/cynx/q5skr0bo/
		var evt = document.createEvent('StorageEvent'); 

		evt.initStorageEvent('storage', false, false, STORAGE_KEY, 'oldValue', 'newValue', null, window.localStorage); 
		    
		window.dispatchEvent(evt);
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
	removeTransactionResponse(transactionResponse) {
		let transactionResponsesJSON = this.getTransactionResponsesJSON();

		delete transactionResponsesJSON[transactionResponse.nonce];

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

	async getConfirmations(transactionResponse) {
		let newTransactionResponse = await this.provider.getTransaction(transactionResponse.hash);

		if (!newTransactionResponse) {
			// I'm not sure what is this case, but it happened
			let nonce = await this.provider.getTransactionCount(await this.signer.getAddress());

			console.log(nonce, transactionResponse.nonce);

			if (transactionResponse.nonce <= (nonce -1)) {
				// transaction with the same nonce was probably already confirmed
				console.log("remove", transactionResponse);
				this.removeTransactionResponse(transactionResponse);
				return 100;
			}

			return 0;
		}

		return newTransactionResponse.confirmations;
	}	

	async isTransactionPending(transactionResponse) {
		let confirmations = await this.getConfirmations(transactionResponse);

		return !(confirmations > 0);
	}
	
	speedUpTransaction(nonce, speedUpPercentage) {
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
			
			// This shouldn't be necessary, but without this polygon fails way too many times with "replacement transaction underpriced"
			transactionParams.maxFeePerGas = this.getUpdatedGasPrice(transactionParams.maxFeePerGas, speedUpPercentage);
		}

		console.log("transactionParams", transactionParams);

		this.signer.sendTransaction(transactionParams)
			.then(newTransactionResponse => {
				console.log("newTransactionResponse", newTransactionResponse);
				this.storeTransactionResponse(newTransactionResponse);
			})
			.catch(error => {
				// probably transaction underpriced
				console.log("err", error)
			});
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




