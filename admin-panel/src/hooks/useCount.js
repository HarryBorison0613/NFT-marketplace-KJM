import { useCallback, useEffect, useState } from "react"
import Web3 from 'web3'
import { collectionContractABI } from "../constant/abi"
import { getCollectionCount } from "../apis/nft"

const web3 = new Web3(new Web3.providers.HttpProvider('https://rpc.ftm.tools/'));


const useCount = (collectionAddress) => {
  const [count, setCount] = useState(0)
  const [totalSupply, setTotalSupply] = useState(0)

  const updateCount = useCallback(() => {
    if (collectionAddress) {
      getCollectionCount(collectionAddress)
        .then((result) => {
          if (result && result > 0) {
            setCount(result)
          }
        })
    }
  }, [collectionAddress])


  useEffect(() => {
    updateCount()
  }, [updateCount])

  useEffect(() => {
    const contract = new web3.eth.Contract(collectionContractABI, collectionAddress);
    contract.methods.totalSupply().call()
      .then((result) => setTotalSupply(result))
      .catch(() => {})
  }, [collectionAddress])


  return {
    count,
    totalSupply,
    updateCount
  }

}

export default useCount
