import Mnemonic from 'bitcore-mnemonic'
import BitcoinjsLib from 'bitcoinjs-lib'

const ERROR_INSUFFICIENT_FUNDS = 'Insufficient funds'

class BitcoinjsLibApi {
  constructor () {
    this.network = BitcoinjsLib.networks.main
    this.deriveath = "m/44'/0'/0'/0/0"
  }

  getKeyPairByMnemonic (mnemonicString) {
    const mnemonic = new Mnemonic(mnemonicString)
    const hdMaster = BitcoinjsLib.HDNode.fromSeedBuffer(mnemonic.toSeed(), this.network)
    const key = hdMaster.derivePath(this.deriveath)

    return key.keyPair
  }

  getPrivateKeyByMnemonic (mnemonicString) {
    return this.getKeyPairByMnemonic(mnemonicString).toWIF()
  }

  getAddressByMnemonic (mnemonicString) {
    return this.getKeyPairByMnemonic(mnemonicString).getAddress()
  }

  createAccountForPrivateKey (privateKey) {
    return BitcoinjsLib.ECPair.fromWIF(privateKey, this.network)
  }

  validateAddress (address) {
    try {
      BitcoinjsLib.address.toOutputScript(address, this.network)

      return true
    } catch (e) {
    }

    return false
  }

  createTransactionHash (utxo, privateKey, addressTo, addressFrom, amount, fee) {
    let totalAmount = 0
    const account = this.createAccountForPrivateKey(privateKey)
    const txb = new BitcoinjsLib.TransactionBuilder(this.network)

    utxo.forEach((item) => {
      totalAmount += item.satoshis
      txb.addInput(item.txid, item.vout)
    })

    const change = parseInt(totalAmount - amount - fee)

    if (change < 0) {
      throw ERROR_INSUFFICIENT_FUNDS
    }

    txb.addOutput(addressTo, parseInt(amount))

    if (change > 0) {
      txb.addOutput(addressFrom, change)
    }

    utxo.forEach((item, index) => {
      txb.sign(index, account)
    })

    return txb.build().toHex()
  }
}

export default BitcoinjsLibApi
