export const TYPE_COIN_BTC = 'type_coin_btc'
export const TYPE_COIN_ETH = 'type_coin_eth'
export const TYPE_TOKEN_ETH = 'type_token_eth'

class Coin {
  /**
   * @param {string} type
   * @param {string} symbol
   * @param {string} name
   * @param {string|null} contractAddress
   * @param {number|null} decimal
   */
  constructor (type, symbol, name, contractAddress, decimal) {
    this.type = type
    this.code = symbol.toLowerCase()
    this.name = name
    this.currency = symbol.toUpperCase()
    this.address = ''
    this.contractAddress = contractAddress
    this.decimal = decimal
    this.balance = 0
    this.rates = {USD: 0, EUR: 0}
  }
}

export default Coin
