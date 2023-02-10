import { useCallback, useEffect, useState } from "react"
import Web3 from "web3";


const getContractInstance = (contractABI, contractAddress) => {
  const web3 = new Web3(new Web3.providers.HttpProvider('https://rpc.ftm.tools/'));
  const contract = new web3.eth.Contract(contractABI, contractAddress);
  return contract;
}

const useMetadata = (collectionAddress, id) => {
  const [metadata, setMetadata] = useState()
  const fetchData = useCallback(async () => {
    let result = null
    const options = { address: collectionAddress, token_id: id, chain: '0xfa' }
    const data = await Web3Api.token.getTokenIdMetadata(options)
    .catch(async () => {
      return null
    })

    if (data) {
      const { token_uri, owner_of } = data
      if (!owner) owner = owner_of
      result = token_uri
    }

    let collectionContractInstance = getContractInstance(collectionContractABI, collectionAddress);

    await collectionContractInstance.methods.tokenURI(id).call()
      .then((res) => {
        result = res
      })
      .catch((err) => {
        return ''
      });

    if (isBurned(owner)) {
      setBurnedNFT(true)
      return
    } else setTokenOwnerAddress(owner.toLowerCase());

    let ipfsPrefix = getIPFSPrefix(collectionAddress);
    let ipfsSufix = "";
    var tokenURI = "";

    let uri = result
    ipfsSufix = getIPFSSufix(uri);
    if (!isIpfs(uri) || isBase64(uri)) {
      tokenURI = uri
    }
    else if (ipfsSufix === 'url') {
      if (uri.includes('ipfs') && uri.includes('Qm') ) {
        let p = result.indexOf('?')
        if (p !== -1) uri = result.slice(0, p)
        p = uri.indexOf("Qm");
        let locationQm = ""
        if (p !== -1) locationQm = uri.substring(p)
        tokenURI = 'https://operahouse.mypinata.cloud/ipfs/' + locationQm
      } else {
        tokenURI = uri
      }
    } else {
      let p = result.indexOf('?')
      if (p !== -1) uri = result.slice(0, p)
      let involveId = isIdInURI(uri);
      let ipfsPos = uri.lastIndexOf('ipfs')
      let subUri = uri.substring(ipfsPos + 4)
      while (subUri && subUri.length > 0) {
        const firstCharacter = subUri[0]
        if (!firstCharacter.match(/[a-z]/i)) subUri = subUri.substring(1)
        else break
      }
      tokenURI = getTokenURI(id, ipfsPrefix, ipfsSufix, involveId, subUri);
    }

    let response = null;
    let metadata = {};

    const assetType = await getAssetType(tokenURI)

    
    try {
      if (assetType === 'other') {
        response = await fetch(tokenURI)
        const responseText = await response.text()
        const regex = /\,(?!\s*?[\{\[\"\'\w])/g;
        const correct = responseText.replace(regex, '');
        metadata = JSON.parse(correct)
      }
      let metadataCopy = metadata;
      try {
        metadataCopy.attributes = metadata.attributes;
      } catch {
        metadataCopy.attributes = null;
      }
      metadataCopy.title = metadata?.name;
      if (assetType !== 'other') {
        metadataCopy.assetURI = getImageURI(tokenURI)
        metadataCopy.assetType = await getAssetType(metadataCopy.assetURI)
        metadataCopy.title = collectionInfo.name + ' ' + ("00" + id).slice(-3);
      } else if (metadata.animation_url){
        const url = getImageURI(metadata.animation_url);
        const url_type = await getAssetType(url)
        if (url_type == 'audio') {
          metadataCopy.assetURI = getImageURI(metadata.animation_image);
          metadataCopy.assetType = await getAssetType(metadataCopy.assetURI)
          metadataCopy.audioURI = url
        } else {
          metadataCopy.assetURI = url
          metadataCopy.assetType = url_type
        }
      } else if (metadata.image) {
        metadataCopy.assetURI = getImageURI(metadata.image);
        metadataCopy.assetType = await getAssetType(metadataCopy.assetURI)
      } else {
        metadataCopy.assetURI = ''
        metadataCopy.assetType = 'other'
      }
      
      metadataCopy.royalty = getRoyalty(collectionAddress) * 1000;
      metadataCopy.name = getName(collectionAddress);
      if (metadata) {
        const { attributes } = metadata
        if (attributes) {
          const arr = attributes.filter((item) => item.frequency)
          if (arr && arr.length) {
            let rarityAttrs = arr.map(({frequency}) => {
              let value = 0
              if (frequency.includes('%')) {
                value = frequency.replace('%', '')
              }
              return Number(value)
            })
            let sum = 0
            rarityAttrs.forEach(element => {
              sum += 1/element
            })
            metadataCopy.rarityScore = Number((rarityAttrs.length / sum).toFixed(2))
          }
        }
      }
    } catch (err) {

    }
  }, [collectionAddress, id])


  
}
