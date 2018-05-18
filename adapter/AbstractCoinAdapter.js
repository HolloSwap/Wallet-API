import Transaction from '../object/Transaction'
import TransactionResult from '../object/TransactionResult'
import TransactionDetails from '../object/TransactionDetails'
import ImportCoinsResult from '../object/ImportCoinsResult'

const NETWORK_FEE = 0
const COIN_SYMBOL = ''

class AbstractCoinAdapter {
  /**
   * @param {Object} params
   */
  constructor (params) {
    this.params = params
    this.coinType = ''
  }

  /**
   * @returns {Promise<Coin[]>}
   */
  getCoins () {
    return new Promise((resolve) => {
      resolve([])
    })
  }

  /**
   * @param {string} mnemonicString
   * @returns {string}
   */
  getAddressByMnemonic (mnemonicString) {
    return ''
  }

  /**
   * @param {string} mnemonicString
   * @returns {string}
   */
  getPrivateKeyByMnemonic (mnemonicString) {
    return ''
  }

  /**
   * @param {Coin[]} coins
   * @returns {Promise.<Coin[]>}
   */
  getCoinsWithBalances (coins) {
    return new Promise((resolve) => {
      resolve(coins)
    })
  }

  /**
   * @param {Coin} coin
   * @returns {Promise.<string>}
   */
  getSpendableBalance (coin) {
    return new Promise((resolve) => {
      resolve('')
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
    return new Promise((resolve) => {
      resolve(new TransactionResult('', ''))
    })
  }

  /**
   * @param {Coin} coin
   * @param {string} privateKey
   * @returns {Promise.<ImportCoinsResult>}
   */
  importCoins (coin, privateKey) {
    return new Promise((resolve) => {
      resolve(new ImportCoinsResult(new TransactionResult('', ''), 0, 0, 0))
    })
  }

  /**
   * @param {Coins[]} coins
   * @returns {Promise.<Transaction[]>}
   */
  getTransactions (coins) {
    return new Promise((resolve) => {
      resolve([new Transaction()])
    })
  }

  /**
   * @param {Transaction} transaction
   * @returns {Promise.<TransactionDetails>}
   */
  getTransactionDetails (transaction) {
    return new Promise((resolve) => {
      resolve(new TransactionDetails(transaction, 0, 0))
    })
  }

  /**
   * @param {string} address
   * @returns {boolean}
   */
  validateAddress (address) {
    return true
  }

  /**
   * @param {number|string} value
   * @param {Coin} coin
   * @returns {string}
   */
  toCurrency (value, coin) {
    return value
  }

  /**
   * @param {number|string} value
   * @param {Coin} coin
   * @returns {string}
   */
  fromCurrency (value, coin) {
    return value
  }

  /**
   * @returns {number}
   */
  getFee () {
    return NETWORK_FEE
  }

  /**
   * @returns {string}
   */
  getFeeCurrency () {
    return COIN_SYMBOL
  }
}

export default AbstractCoinAdapter
