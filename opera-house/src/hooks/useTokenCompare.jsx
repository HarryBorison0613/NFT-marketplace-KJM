import { useState, useEffect } from 'react'
import Web3 from 'web3'
import { novaSwapABI } from '../constant/contractABI';
import { config } from '../constant/config'

const novaSwapContractAddress = config.novaSwapContractAddress
const wFTMAddress = '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83'
const address0 = "0x0000000000000000000000000000000000000000"
const getContractInstance = (contractABI, contractAddress) => {
    const web3 = new Web3(new Web3.providers.HttpProvider('https://rpc.ftm.tools/'));
    const contract = new web3.eth.Contract(contractABI, contractAddress);
    return contract;
}

const useTokenCompare = (fromTokenAddress, toTokenAddress, fromAmount) => {
  const [toAmount, setToAmount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (fromTokenAddress && toTokenAddress && fromAmount) {
      const fromAddress = fromTokenAddress === address0 ? wFTMAddress : fromTokenAddress
      const toAddress = toTokenAddress === address0 ? wFTMAddress : toTokenAddress
      if (fromAddress?.toLowerCase() === toAddress?.toLowerCase()) {
        setLoading(false)
        setToAmount(fromAmount)
      } else {
        setLoading(true)
        const novaSwapInstance = getContractInstance(novaSwapABI, novaSwapContractAddress)
        novaSwapInstance.methods.getAmountOutMin(
          fromAddress,
          toAddress,
          fromAmount
        ).call()
        .then((amount) => {
          const amountWithFee = Math.round(Number(amount) * 1.05)
          // eslint-disable-next-line no-undef
          setToAmount(BigInt(amountWithFee).toString())
          setLoading(false)
        })
      }
    } else {
      setLoading(true)
    }
  }, [fromTokenAddress, toTokenAddress, fromAmount])


  return loading? 0 : toAmount
}

export default useTokenCompare
