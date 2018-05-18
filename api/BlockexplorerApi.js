import axios from 'axios'
import Big from 'big.js'

const API_DOMAIN = 'https://blockexplorer.com'
const API_URL_BALANCE = API_DOMAIN + '/api/addr/{address}/balance'
const API_URL_TRANSACTIONS = API_DOMAIN + '/api/txs/?address={address}'
const API_URL_UTXO = API_DOMAIN + '/api/addr/{address}/utxo?noCache=1'
const API_URL_BROADCAST = API_DOMAIN + '/api/tx/send'
const URL_TRANSACTION = API_DOMAIN + '/tx/'

const ERROR_SERVICE_UNAVAILABLE = 'Can\'t connect to blockexplorer'
const ERROR_INVALID_DATA = 'Invalid data from blockexplorer'

class BlockexplorerApi {
  /**
   * @param {string} address
   * @returns {Promise<number>}
   */
  getBalance (address) {
    return new Promise((resolve, reject) => {
      axios.get(API_URL_BALANCE.replace('{address}', address))
        .then((response) => {
          resolve(response.data)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  /**
   * @param {string} address
   * @returns {Promise<number>}
   */
  getSpendableBalance (address) {
    return new Promise((resolve, reject) => {
      this.getUTXO(address)
        .then((result) => {
          let balance = 0

          result.forEach((item) => {
            balance += item.satoshis
          })

          resolve(balance)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  /**
   * @param {string} rawTransaction
   * @returns {Promise<string>}
   */
  broadcastTransaction (rawTransaction) {
    return new Promise((resolve, reject) => {
      axios.post(API_URL_BROADCAST, {rawtx: rawTransaction})
        .then((response) => {
          if (typeof (response.data.txid) === 'undefined') {
            return reject(ERROR_INVALID_DATA)
          }

          resolve(response.data.txid)
        })
        .catch(() => {
          reject(ERROR_SERVICE_UNAVAILABLE)
        })
    })
  }

  /**
   * @param {string} address
   * @returns {Promise<Object[]>}
   */
  getUTXO (address) {
    return new Promise((resolve, reject) => {
      axios.get(API_URL_UTXO.replace('{address}', address))
        .then((response) => {
          resolve(response.data)
        })
        .catch(() => {
          reject(ERROR_SERVICE_UNAVAILABLE)
        })
    })
  }

  /**
   * @param {string} address
   * @returns {Promise<Object[]>}
   */
  getTransactions (address) {
    return new Promise((resolve, reject) => {
      axios.get(API_URL_TRANSACTIONS.replace('{address}', address))
        .then((response) => {
          if (typeof response.data.txs === 'undefined') {
            return reject(ERROR_INVALID_DATA)
          }

          const result = []

          response.data.txs.forEach((tx) => {
            result.push(this.parseTransaction(tx, address))
          })

          resolve(result)
        })
        .catch(() => {
          reject(ERROR_SERVICE_UNAVAILABLE)
        })
    })
  }

  parseTransaction (data, address) {
    let valueIn = new Big(0)
    let valueOut = new Big(0)
    let addressFrom = ''
    let addressTo = ''

    data.vin.forEach((vin) => {
      if (vin.addr === address) {
        valueIn = valueIn.plus(vin.value)
      } else if (addressFrom === '') {
        addressFrom = vin.addr
      }
    })

    data.vout.forEach((vout) => {
      if (vout.scriptPubKey.addresses) {
        if (vout.scriptPubKey.addresses.indexOf(address) !== -1) {
          valueOut = valueOut.plus(vout.value)
        } else if (addressTo === '') {
          addressTo = vout.scriptPubKey.addresses[0]
        }
      }
    })

    const valueDiff = valueIn.minus(valueOut)
    const isInbound = valueDiff.lt(0)
    let value = valueDiff.abs()

    data.from = isInbound ? addressFrom : address
    data.to = isInbound ? address : addressTo
    data.value = isInbound ? value : value.minus(data.fees)

    return data
  }

  /**
   * @param {string} transactionHash
   * @returns {string}
   */
  getTransactionUrl (transactionHash) {
    return URL_TRANSACTION + transactionHash
  }
}

export default BlockexplorerApi
