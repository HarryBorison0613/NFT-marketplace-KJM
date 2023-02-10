import { useCallback, useEffect, useState } from "react"
import { useMoralis } from "react-moralis"
import { useQuery } from 'react-query'
import { getAllListItems } from "../apis/marketplace"
import { collectionContractABI } from '../constant/abi'

const useCollections = () => {
  const { data: listItems } = useQuery('marketplaceListItems', getAllListItems)
  const { isInitialized, web3, isWeb3Enabled } = useMoralis()
  const [nftsToRemove, setNftsToRemove] = useState([])

  const getContractInstance = useCallback((contractABI, contractAddress) => {
    if (isWeb3Enabled && web3) {
        let contract = new web3.eth.Contract(contractABI, contractAddress);
        return contract;
    } else {
      return null
    }
  }, [isWeb3Enabled, web3])

  useEffect(() => {
    if (isInitialized && isWeb3Enabled && web3 && listItems?.length) {
      const checkValid = async (nftContract, tokenId, seller) => {
        try {
          const instance = getContractInstance(collectionContractABI, nftContract)
          const owner = await instance.methods.ownerOf(tokenId).call()
          if (owner?.toLowerCase() === seller?.toLowerCase()) {
            return true
          } else {
            return false
          }
        } catch (err) {
          return null
        }
      }
      const nfts = []
      Promise.all(listItems.map(async (nft) => {
        const { nftContract, tokenId, seller } = nft
        const isValid = await checkValid(nftContract, tokenId, seller)
        if (isValid === false) nfts.push(nft)
      }))
      .then(() => {
        setNftsToRemove(nfts)
      })
    }
  }, [isInitialized, listItems, isWeb3Enabled, web3, getContractInstance])

  return {
    nftsToRemove
  }
}

export default useCollections
