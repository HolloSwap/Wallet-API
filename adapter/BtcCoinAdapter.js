import AbstractCoinAdapter from './AbstractCoinAdapter'
import Coin, {TYPE_COIN_BTC} from '../object/Coin'
import Transaction from '../object/Transaction'
import TransactionResult from '../object/TransactionResult'
import TransactionDetails from '../object/TransactionDetails'
import BitcoinjsLibApi from '../api/BitcoinjsLibApi'
import BlockexplorerApi from '../api/BlockexplorerApi'
import ImportCoinsResult from '../object/ImportCoinsResult'
import Big from 'big.js'

const COIN_SYMBOL = 'BTC'
const COIN_NAME = 'Bitcoin'
const NETWORK_FEE = 20000

const ERROR_IMPORT_INVALID_PRIVATE_KEY = 'Please enter a valid private key'

class BtcCoinAdapter extends AbstractCoinAdapter {
  constructor (params) {
    super(params)

    this.coinType = TYPE_COIN_BTC
    this.bitcoinJsLibApi = new BitcoinjsLibApi()
    this.blockexplorerApi = new BlockexplorerApi()
  }

  /**
   * @returns {Promise<Coin[]>}
   */
  getCoins () {
    return new Promise((resolve) => {
      resolve([new Coin(this.coinType, COIN_SYMBOL, COIN_NAME, '', 0)])
    })
  }

  /**
   * @param {string} mnemonicString
   * @returns {string}
   */
  getAddressByMnemonic (mnemonicString) {
    return this.bitcoinJsLibApi.getAddressByMnemonic(mnemonicString)
  }

  /**
   * @param {string} mnemonicString
   * @returns {string}
   */
  getPrivateKeyByMnemonic (mnemonicString) {
    return this.bitcoinJsLibApi.getPrivateKeyByMnemonic(mnemonicString)
  }

  /**
   * @param {Coin[]} coins
   * @returns {Promise<Coin[]>}
   */
  getCoinsWithBalances (coins) {
    return new Promise((resolve, reject) => {
      const promises = []

      coins.forEach((coin) => {
        this.blockexplorerApi.getBalance(coin.address)
      })

      Promise.all(promises)
        .then((results) => {
          results.forEach((balance, i) => {
            coins[i].balance = this.toCurrency(balance)
          })

          resolve(coins)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  /**
   * @param {Coin} coin
   * @returns {Promise.<String>}
   */
  getSpendableBalance (coin) {
    return new Promise((resolve, reject) => {
      this.blockexplorerApi.getSpendableBalance(coin.address)
        .then((balance) => {
          resolve(this.toCurrency(balance))
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  /**
   * @param {Coin} coin
   * @param {string} privateKey
   * @param {string} address
   * @param {number} amount
   * @param {number} fee
   * @param {string} input
   * @returns {Promise.<TransactionResult>}
   */
  sendTransaction (coin, privateKey, address, amount, fee, input) {
    return new Promise((resolve, reject) => {
      this.blockexplorerApi.getUTXO(coin.address)
        .then((utxo) => {
          try {
            const rawTransaction = this.bitcoinJsLibApi.createTransactionHash(utxo, privateKey, address, coin.address, amount, NETWORK_FEE)

            this.blockexplorerApi.broadcastTransaction(rawTransaction)
              .then((hash) => {
                resolve(new TransactionResult(hash, this.blockexplorerApi.getTransactionUrl(hash)))
              })
              .catch((error) => {
                reject(error)
              })
          } catch (error) {
            reject(error.message)
          }
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  /**
   * Will build and send transaction and return result
   *
   * @param {Coin} coin
   * @param {string} privateKey
   * @returns {Promise.<ImportCoinsResult>}
   */
  importCoins (coin, privateKey) {
    return new Promise((resolve, reject) => {
      const account = this.bitcoinJsLibApi.createAccountForPrivateKey(privateKey)
      const address = account.getAddress()

      Promise.all([
        this.blockexplorerApi.getSpendableBalance(address),
        this.blockexplorerApi.getUTXO(address)
      ])
        .then(([balance, utxo]) => {
          const amount = balance - NETWORK_FEE

          try {
            const rawTransaction = this.bitcoinJsLibApi.createTransactionHash(utxo, privateKey, coin.address, address, amount, NETWORK_FEE)

            this.blockexplorerApi.broadcastTransaction(rawTransaction)
              .then((hash) => {
                const transaction = new TransactionResult(hash, this.blockexplorerApi.getTransactionUrl(hash))

                resolve(new ImportCoinsResult(transaction, this.toCurrency(amount), this.toCurrency(balance), this.toCurrency(NETWORK_FEE)))
              })
              .catch((error) => {
                reject(error)
              })
          } catch (error) {
            reject(error.message)
          }
        })
        .catch(() => {
          reject(ERROR_IMPORT_INVALID_PRIVATE_KEY)
        })
    })
  }

  /**
   * @param {Coins[]} coins
   * @returns {Promise.<Transaction[]>}
   */
  getTransactions (coins) {
    return new Promise((resolve, reject) => {
      const promises = []

      coins.forEach((coin) => {
        this.blockexplorerApi.getTransactions(coin.address)
      })

      Promise.all(promises)
        .then((results) => {
          const result = []

          results.forEach((transactions, i) => {
            transactions.forEach((transaction) => {
              result.push(new Transaction(
                coins[i],
                transaction.txid,
                transaction.blockhash,
                transaction.from,
                transaction.to,
                transaction.value,
                transaction.fees,
                transaction.time,
                transaction.confirmations,
                this.blockexplorerApi.getTransactionUrl(transaction.txid)))
            })
          })

          resolve(result)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  /**
   * @param {Transaction} transaction
   * @returns {Promise.<TransactionDetails>}
   */
  getTransactionDetails (transaction) {
    return new Promise((resolve, reject) => {
      Promise.all([
        this.getTransactions([transaction.coin]),
        this.blockexplorerApi.getBalance(transaction.coin.address)
      ])
        .then((result) => {
          const transactions = result[0]
          let balance = new Big(result[1])

          transactions.sort((tx1, tx2) => {
            return tx2.date.getTime() - tx1.date.getTime()
          })

          for (let t = 0, tl = transactions.length; t < tl; t++) {
            if (typeof (transactions[t].block) === 'undefined') {
              if (transactions[t].hash === transaction.hash) {
                return resolve(new TransactionDetails(transaction, 0, 0))
              }

              continue
            }

            const tx = transactions[t]
            const diff = (new Big(tx.value)).plus(tx.is_inbound ? 0 : tx.fee)
            const balanceBefore = balance.minus(diff.times(tx.is_inbound ? 1 : -1))

            if (tx.hash === transaction.hash) {
              return resolve(new TransactionDetails(transaction, balanceBefore, balance))
            }

            balance = balanceBefore
          }
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  /**
   * @param {string} address
   * @returns {boolean}
   */
  validateAddress (address) {
    return this.bitcoinJsLibApi.validateAddress(address)
  }

  /**
   * Converts value from Satoshis to BTC
   *
   * @param {number|string} value
   * @param {Coin} coin
   * @returns {string}
   */
  toCurrency (value, coin) {
    return '' + (new Big(value)).div(100000000)
  }

  /**
   * Converts value from BTC to Satoshi
   *
   * @param {number|string} value
   * @param {Coin} coin
   * @returns {string}
   */
  fromCurrency (value, coin) {
    return '' + (new Big(value)).times(100000000)
  }

  /**
   * @returns {number}
   */
  getFee () {
    return this.toCurrency(NETWORK_FEE)
  }

  /**
   * @returns {string}
   */
  getFeeCurrency () {
    return COIN_SYMBOL
  }
}

export default BtcCoinAdapter
