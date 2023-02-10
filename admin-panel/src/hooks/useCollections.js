import { useEffect, useState } from "react"
import { useMoralis } from "react-moralis"

const useCollections = () => {
  const [collections, setCollections] = useState([])
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
              collectionOwner: item.owner,
              collectionBanner: item.localBanner ?? item.banner?._url,
              collectionDescription: item.description,
              image: item.localImage ?? item?.image?._url,
              audit: (item.audit && item.audit !== '') ? item.audit : 'Not Audited'
            }
          ))
          setCollections(collections)
        }
      })
    }
  }, [Moralis, isInitialized])

  return {
    collections
  }
}

export default useCollections
