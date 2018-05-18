class TransactionDetails {
  /**
   * @param {Transaction} transaction
   * @param {number} balanceBefore
   * @param {number} balanceAfter
   */
  constructor (transaction, balanceBefore, balanceAfter) {
    this.transaction = transaction
    this.balanceBefore = balanceBefore
    this.balanceAfter = balanceAfter
  }
}

export default TransactionDetails
