import React, { useContext } from 'react';
import {Link} from 'react-router-dom';
import { useMoralis } from 'react-moralis';
import { useQuery } from 'react-query'
import Web3 from 'web3'
import {
  networkCollections
} from '../../constant/collections';
import { getCollectionsInfo, getVolumes } from '../../apis/marketplace';
import {
  NFTContractABI
} from '../../constant/contractABI';
import { config } from "../../constant/config"
import NFTContext from '../../context/NFTContext';
const defaultCollectionAddress = config.contractAddress;
const address0 = "0x0000000000000000000000000000000000000000";

function PopularCreators() {
  const [CreatorsItems, setCreatorsItems] = React.useState([]);
  const { collections, tokenPrices } = useContext(NFTContext)

  const { data, isLoading, error } = useQuery('collectionsInfo', getCollectionsInfo, {
    retry: true,
    retryDelay: 1000,
  })

  const { data: volumes } = useQuery('volumesInfo', getVolumes, {
    retry: true,
    retryDelay: 1000,
  })

  const getContractInstance = React.useCallback(async (contractABI, contractAddress) => {
      const web3 = new Web3(new Web3.providers.HttpProvider('https://rpc.ftm.tools/'));
      const contract = new web3.eth.Contract(contractABI, contractAddress);
      return contract;
  }, [])

  const getCollectionInfo = React.useCallback(async (id) => {
    try {
      const collection = collections[id]
      if (!collection) return null
      const collectionAddress = collection.address
      let NFTContractInstance = await getContractInstance(NFTContractABI, defaultCollectionAddress);
      let info = {};
      info.img = collection.image;
      info.name = collection.name;
      info.addressShort = collection.addressShort;
      info.address = collection.address;

      let address = collectionAddress === defaultCollectionAddress ? address0 : collectionAddress;
      while (true) {
        let result = await NFTContractInstance.methods.collectionInfo(address).call()
          // eslint-disable-next-line no-loop-func
          .then((result) => {
            return Number(result.totalVolume)/ 1000000000000000000;
          })
          .catch((err) => {
            return null
          });
        if (result !== null) {
          info.totalVolume = result
          break
        }
      }
      return info
    } catch (err) {
      return null
    }
  }, [getContractInstance, collections])

  React.useEffect(() => {
    (async () => {
      if (collections?.length && data && volumes && tokenPrices) {
        let CreatorsItemsCopy;
        const promises = []
        for(let i = 0; i < collections.length; i++) {
          promises.push(getCollectionInfo(i))
        }
        CreatorsItemsCopy = await Promise.all(promises)
        CreatorsItemsCopy = CreatorsItemsCopy.filter((item) => item)
        const newCollections = data.collections
        CreatorsItemsCopy = CreatorsItemsCopy.map((item) => {
          const { address } = item
          const newCollectionInfo = newCollections.find(({ id }) => id?.toLowerCase() === address)
          const collectionVolumes = volumes.filter(({ nftContract }) => (nftContract === address))
          let totalVolume = 0
          collectionVolumes.forEach(element => {
            const tokenPriceItem = tokenPrices.find((item) => item.address?.toLowerCase() === element.paymentToken)
            const tokenPrice = tokenPriceItem?.price ?? 1
            totalVolume += tokenPrice * Number(element.volume)
          })
          if (newCollectionInfo) {
            return {
              ...item,
              totalVolume: item.totalVolume + totalVolume / 1000000000000000000
            }
          } else {
            return item
          }
        })
        
        CreatorsItemsCopy.sort(function(a, b) {
          if (a.totalVolume < b.totalVolume) return 1
          else if (a.totalVolume > b.totalVolume) return -1
          else return 0
        })
        const CreatorsItems = CreatorsItemsCopy.slice(0, 12)
        setCreatorsItems(CreatorsItems);
      }
    }) ()
  }, [getCollectionInfo, collections, data, volumes, tokenPrices]);

  return (
      <div className="section__creators mt-100">
        <div className="container">
          <div className="">
            <div className="section_head mb-30">
              <h3 className="text-center">Our Top 12 Collections</h3>
            </div>
            <div className="section__body">
              <div className="row mb-20_reset justify-content-center">
                {CreatorsItems.map((val, i) => (
                  <div className="col-xl-3 col-lg-4 col-md-4 col-sm-6 mb-20"  key={i}>
                    <div
                      className="creator_item creator_card space-x-10"
                      style={{padding:"20px", margin:"-5px", borderRadius: "10px"}}
                     >
                      <div className="avatars space-x-10">
                      <Link to={"collection/" + val.address}>
                          <img
                            src={`${val.img}`}
                            alt="Avatar"
                            className="avatar avatar-md"
                          />
                        </Link>
                        <div>
                        <Link to={"collection/" + val.address}>
                            <p className="avatars_name color_black" style={{lineHeight: "1.2"}}>
                              {val.name}
                            </p>
                          </Link>
                            <a href={"https://ftmscan.com/address/" + val.address } target="_blank">
                            <p className="address color_green">
                              {val.addressShort}
                            </p>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

  );
}

export default PopularCreators;
