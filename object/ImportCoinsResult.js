class ImportCoinsResult {
  /**
   * @param {TransactionResult} transaction
   * @param {number} amount
   * @param {number} balance
   * @param {number} fee
   */
  constructor (transaction, amount, balance, fee) {
    this.transaction = transaction
    this.amount = amount
    this.balance = balance
    this.fee = fee
  }
}

export default ImportCoinsResult
