class Transaction {
  constructor (coin, hash, block, from, to, value, fee, time, confirmations, url, data, hasErrors) {
    this.coin = coin
    this.hash = hash
    this.block = block
    this.from = from
    this.to = to
    this.value = value
    this.fee = fee
    this.time = time
    this.date = typeof (time) !== 'undefined' ? new Date(time * 1000) : new Date()
    this.confirmations = confirmations
    this.is_inbound = coin.address === to
    this.url = url
    this.payment_id = typeof (data) !== 'undefined' ? data : ''
    this.is_error = typeof (hasErrors) !== 'undefined' ? hasErrors : false
  }
}

export default Transaction
