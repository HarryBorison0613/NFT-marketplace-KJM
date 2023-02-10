import { useEffect, useState } from "react"
import { useMoralis } from "react-moralis"

const useCollections = () => {
  const [collections, setCollections] = useState([])
  const [tokenPrices, setTokenPrices] = useState()
  const { isInitialized, Moralis } = useMoralis()

  useEffect(() => {
    if (isInitialized) {
      Moralis.Cloud.run('getAcceptedCollections')
      .then((response) => {
        if (response && response.data) {
          const collections = response.data.map((item) => (
            {
              ...item,
              collectionAddress: item.address.toLowerCase(),
              collecionOwner: item.owner,
              collectionBanner: item.localBanner ?? item.banner?._url,
              collectionDescription: item.description,
              image: item.localImage ?? item?.image?._url,
              audit: (item.audit && item.audit !== '') ? item.audit : 'Not Audited'
            }
          ))
          setCollections(collections)
        }
      }).catch(() => {})

      Moralis.Cloud.run('getTokenPrices')
      .then((response) => {
        if (response && response.data) {
          setTokenPrices(response.data)
        }
      })
      .catch(() => {})

    }
  }, [Moralis, isInitialized])

  return {
    collections,
    tokenPrices
  }
}

export default useCollections
