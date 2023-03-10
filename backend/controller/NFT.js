const Web3 = require('web3')
const fetch = require('node-fetch')
const AbortController = require("abort-controller")



const { collectionABI, NFTContractABI, ERC1155ABI } = require('../constant/abi')
const NFT = require('../model/nft.model')
const {
  sleep,
  isBase64,
  isIpfs,
  isIdInURI,
  getIPFSSufix,
  getTokenURI,
  getAssetType,
  getImageURI,
  isBurned,
  countTraitValue
} = require('../utils/common')
const contractAddress = "0x86c4764a936b0277877cb83abf1ad79ce35c754c"

const web3 = new Web3(new Web3.providers.HttpProvider('https://rpc.ftm.tools/'));

const fetchNFTData = async (_collectionAddress, startId = 0, endId = 0, collectionName = '', ipfsUri = null, replacement = false, replacementPrefix = null, replacementSubfix = '') => {
  try {
    const contract = new web3.eth.Contract(collectionABI, _collectionAddress);
    // try {
    //   const isERC1155 = await contract.methods.supportsInterface('0x2a55205a').call().catch(() => false)
    //   if (isERC1155) {
    //     const result = await fetch1155NFTData(_collectionAddress, startId, endId)
    //     return result
    //   }
    // } catch (err) {
      
    // }
    const collectionAddress = _collectionAddress.toLowerCase()
    const promises = []
    const createArray = []
    const deleteArray = []
    const total = await contract.methods.totalSupply().call().catch(() => 0)
    const totalSupply = endId ? endId : (total ? total : 100)
    for (let id = startId; id <= totalSupply; id ++) {
      const promise = (async () => {
        try {
          
          let token_uri = ''
          const _tokenId = await contract.methods.tokenByIndex(id).call().catch(() => id)

          const burned = await contract.methods.ownerOf(_tokenId).call()
            .then((result) => {
              if (result) {
                if (isBurned(result)) return true
              }
              return false
            })
            .catch(async (err) => {
              return false
            })
          if (burned) {
            deleteArray.push({
              collectionAddress,
              tokenId: _tokenId
            })
            return
          }

          try {
            token_uri = await contract.methods.tokenURI(_tokenId).call()
          } catch (err) {
            if (err && err.message && err.message.includes('nonexistent token')) {
              console.log('not exist', collectionAddress, _tokenId)
              return
            }
            token_uri = await contract.methods.uri(_tokenId).call()
          }
          
          let uri = token_uri
          
          let tokenURI = ''
          let metadata = null
          let isImage = false
          const ipfsSufix = getIPFSSufix(uri);
          let p = uri.indexOf('?')
          if (p !== -1) {
            const subStr = uri.slice(p, uri.length)
            if (!subStr.includes('?index=') && !subStr.includes('?filename=') && !subStr.includes('?tokenId=')){
              uri = uri.slice(0, p)
            }
              
          }
          if (ipfsUri && ipfsSufix === 'json') {
            tokenURI = ipfsUri + '/' + id + '.json'
          } else if (!isIpfs(uri) || isBase64(uri)) {
            tokenURI = uri
          } else if (ipfsSufix === 'url') {
            
            const p = token_uri.indexOf('?')
            if (p !== -1) uri = token_uri.slice(0, p)
            if (uri.includes('Qm') ) {
              let p = uri.indexOf("Qm");
              let locationQm = ""
              if (p !== -1) locationQm = uri.substring(p)
              tokenURI = 'https://operahouse.mypinata.cloud/ipfs/' + locationQm
            } else if (isIpfs(uri)) {
              let p = token_uri.indexOf('?')
              if (p !== -1) uri = token_uri.slice(0, p)
              let involveId = isIdInURI(uri);
              let ipfsPos = uri.lastIndexOf('/ipfs/')
              let subUri = uri.substring(ipfsPos + 6)
              while (subUri && subUri.length > 0) {
                const firstCharacter = subUri[0]
                if (!firstCharacter.match(/[a-z]/i)) subUri = subUri.substring(1)
                else break
              }
              tokenURI = getTokenURI(id, '', ipfsSufix, involveId, subUri);
            } else {
              tokenURI = uri
            }
          } else {
            let p = token_uri.indexOf('?')
            if (p !== -1) uri = token_uri.slice(0, p)
            let involveId = isIdInURI(uri);
            let ipfsPos = uri.lastIndexOf('/ipfs/')
            let subUri = uri.substring(ipfsPos + 6)
            while (subUri && subUri.length > 0) {
              const firstCharacter = subUri[0]
              if (!firstCharacter.match(/[a-z]/i)) subUri = subUri.substring(1)
              else break
            }
            tokenURI = getTokenURI(id, '', ipfsSufix, involveId, subUri );
          }
          
          const tokenAssetType = await getAssetType(tokenURI)
          if (tokenAssetType === 'base64') {
            const base64Code = tokenURI.replace(/^data:\w+\/\w+;base64,/, '')
            let buff = new Buffer(base64Code, 'base64');
            let text = buff.toString('ascii');
            metadata = JSON.parse(text)
          } else if (tokenAssetType === 'other') {
            try {
              const controller = new AbortController();
              const timeout = setTimeout(
                () => { controller.abort(); },
                10000,
              );
              let response = await fetch(tokenURI)
              .catch(err => {
                console.log(err)
              })
              .finally(() => {
                clearTimeout(timeout);
              });
              const responseText = await response.text()
              const regex = /\,(?!\s*?[\{\[\"\'\w])/g;
              const correct = responseText.replace(regex, '').replace(',"frequency":100%', '');
              console.log(correct)
              if (correct) {
                metadata = JSON.parse(correct)
              } else {
              }
            } catch (err) {
              console.log(err)
              const controller = new AbortController();
              const timeout = setTimeout(
                () => { controller.abort(); },
                10000,
              );
              let response = await fetch(tokenURI, {
                signal: controller.signal
              })
              .finally(() => {
                clearTimeout(timeout);
              });
              const responseText = await response.text()
              const regex = /\,(?!\s*?[\{\[\"\'\w])/g;
              const correct = responseText.replace(regex, '');
              if (correct) {
                metadata = JSON.parse(correct)
              }
            }
          } else {
            isImage = true
          }
          let assetURI = ''
          let assetType = ''
          let title = null
          let description = null
          let jsonAttributes = null

          if (metadata) {
            title = metadata.name ? metadata.name : null
            let attributes = metadata.attributes ? metadata.attributes : null
      
            jsonAttributes = attributes && JSON.stringify(attributes)
            description = metadata.description ? metadata.description : null
          } else {
            console.log('no metadata', tokenURI)
          }

          if (title) title = title.replace(/\'/g, "\\'")
          else title = ''
          if (description) description = description.replace(/\'/g, "\\'")
          else description = ''
          if (jsonAttributes) jsonAttributes = jsonAttributes.replace(/\'/g, "\\'")
          
          if (replacement && replacementPrefix) {
            assetURI = '/img/replacements/' + replacementPrefix + id + replacementSubfix;
            assetType = await getAssetType(assetURI)
          } else {
            if (isImage) {
              assetURI = getImageURI(tokenURI)
              assetType = await getAssetType(assetURI)
              title = collectionName + ' ' ("00" + id).slice(-3);
            } else if (metadata) {
              if (metadata.image) {
                assetURI = getImageURI(metadata.image)
                assetType = await getAssetType(assetURI)
              } else if (metadata.animation_url){
                assetURI = getImageURI(metadata.animation_url)
                assetType = await getAssetType(assetURI)
              } else {
                assetURI = ''
                assetType = 'other'
              }
            }
          }
          createArray.push({collectionAddress,
            tokenId: _tokenId, 
            assetURI,
            assetType,
            title,
            description,
            attributes: jsonAttributes
          })
        // }
        } catch (err) {
          console.log('error1',err, id)
          return null
        }
      })
      promises.push(promise)
    }
    await Promise.all(promises.map((promise) => promise()))
    if (deleteArray.length) {
      await NFT.deleteMany(deleteArray)
    }
    if (createArray.length) {
      await NFT.createMany(createArray)
    }
    return deleteArray.length + createArray.length
    
  } catch (err) {
    console.log(err)
    return null
  }
}

const setRarity = async (req, res) => {
  try {
    const { collectionAddress: _collectionAddress, idOrderArr } = req.body
    const collectionAddress = _collectionAddress.toLowerCase()
    console.log(collectionAddress, idOrderArr)
    if (idOrderArr && Array.isArray(idOrderArr)) {
      const updateArray = idOrderArr.map((tokenId, index) => ({
        collectionAddress,
        tokenId,
        rarityRank: index + 1
      }))
      await NFT.updateRarityRank(updateArray)
      res.status(200)
        .json({})
    } else {
      res.status(400)
        .json({error: 'bad request'})
    }
  } catch (err) {
    console.log(err)
    res.status(500)
      .json({
        error: 'Server error'
      })
  }
}

const removeNFTData = async (req, res) => {
  try {
    const { collectionAddress: _collectionAddress, startId, endId } = req.body
    if (startId > endId) {
      return res.status(400).json({ error: 'bad input'})
    }
    const collectionAddress = _collectionAddress.toLowerCase()
    const deleteArray = []
    for (let id = startId; id <= endId; id ++) {
      deleteArray.push({
        collectionAddress,
        tokenId: id
      })
    }
    if (deleteArray.length) {
      await NFT.deleteMany(deleteArray)
    }
    res.status(200).json({ result: true })
  } catch (err) {
    return res.status(500).json({ error: err})
  }
}

const fetch1155NFTData = async (_collectionAddress, startId = 0, endId = 0) => {
  try {
    const collectionAddress = _collectionAddress.toLowerCase()
    
    const contract = new web3.eth.Contract(ERC1155ABI, collectionAddress);
    
    const promises = []
    const createArray = []
    const deleteArray = []
    const totalSupply = endId ? endId : 100
    for (let id = startId; id <= totalSupply; id ++) {
      const promise = (async () => {
        try {
          let token_uri = ''
          
          token_uri = await contract.methods.uri(id).call()
          let uri = token_uri
          
          let tokenURI = ''
          let metadata = null
          let isImage = false
          const ipfsSufix = getIPFSSufix(uri);
          let p = uri.indexOf('?')
          if (p !== -1) {
            const subStr = uri.slice(p, uri.length)
            if (!subStr.includes('?index='))
              uri = uri.slice(0, p)
          }
          
          if (ipfsUri && ipfsSufix === 'json') {
            tokenURI = ipfsUri + '/' + id + '.json'
          } else if (!isIpfs(uri) || isBase64(uri)) {
            console.log('base uri')
            tokenURI = uri
          } else if (ipfsSufix === 'url') {
            const p = token_uri.indexOf('?')
            if (p !== -1) uri = token_uri.slice(0, p)
            if (uri.includes('Qm') ) {
              let p = uri.indexOf("Qm");
              let locationQm = ""
              if (p !== -1) locationQm = uri.substring(p)
              tokenURI = 'https://operahouse.mypinata.cloud/ipfs/' + locationQm
            } else {
              tokenURI = uri
            }
          } else {
            let p = token_uri.indexOf('?')
            if (p !== -1) uri = token_uri.slice(0, p)
            let involveId = isIdInURI(uri);
            let ipfsPos = uri.lastIndexOf('/ipfs/')
            let subUri = uri.substring(ipfsPos + 6)
            while (subUri && subUri.length > 0) {
              const firstCharacter = subUri[0]
              if (!firstCharacter.match(/[a-z]/i)) subUri = subUri.substring(1)
              else break
            }
            tokenURI = getTokenURI(id, '', ipfsSufix, involveId, subUri);
          }
          const tokenAssetType = await getAssetType(tokenURI)

          if (tokenAssetType === 'base64') {
            const base64Code = tokenURI.replace(/^data:\w+\/\w+;base64,/, '')
            let buff = new Buffer(base64Code, 'base64');
            let text = buff.toString('ascii');
            metadata = JSON.parse(text)
          } else if (tokenAssetType === 'other') {
            try {
              let response = await fetch(tokenURI);
              const responseText = await response.text()
              const regex = /\,(?!\s*?[\{\[\"\'\w])/g;
              const correct = responseText.replace(regex, '');
              metadata = JSON.parse(correct)
            } catch (err) {
              await sleep(100)
              try {
                let response = await fetch(base64URL);
                const responseText = await response.text()
                const regex = /\,(?!\s*?[\{\[\"\'\w])/g;
                const correct = responseText.replace(regex, '');
                metadata = JSON.parse(correct)
              } catch (err) {
                console.log(err)
                return null
              }
            }
          } else {
            isImage = true
          }
          console.log(metadata)

          let {
            name: title,
            description,
            attributes
          } = metadata

          let assetURI = ''
          let assetType = ''

          let jsonAttributes = attributes ? JSON.stringify(attributes): null

          if (title) title = title.replace(/\'/g, "\\'")
          else title = ''
          if (description) description = description.replace(/\'/g, "\\'")
          else description = ''
          if (jsonAttributes) jsonAttributes = jsonAttributes.replace(/\'/g, "\\'")

          if (isImage) {
            assetURI = getImageURI(tokenURI)
            assetType = await getAssetType(assetURI)
            title = collectionInfo.name + ' ' + ("00" + id).slice(-3);
          } else if (metadata.image) {
            assetURI = getImageURI(metadata.image)
            assetType = await getAssetType(assetURI)
          } else if (metadata.animation_url){
            assetURI = getImageURI(metadata.animation_url)
            assetType = await getAssetType(assetURI)
          } else {
            assetURI = ''
            assetType = 'other'
          }
          createArray.push({collectionAddress,
            tokenId: id, 
            assetURI,
            assetType,
            title,
            description,
            attributes: jsonAttributes
          })
        // }
        } catch (err) {
          console.log('error1',err)
          return null
        }
      })
      promises.push(promise)
    }
    await Promise.all(promises.map((promise) => promise()))
    if (deleteArray.length) {
      await NFT.deleteMany(deleteArray)
    }
    if (createArray.length) {
      await NFT.createMany(createArray)
    }
    return deleteArray.length + createArray.length
    
  } catch (err) {
    return null
  }
}

const fetchDefaultNFTData = async () => {
  const contract = new web3.eth.Contract(NFTContractABI, contractAddress);

  const totalSupply = await contract.methods.totalTokenCount().call()
  const startId = 1
  let ids = []
  const createArray = []

  const promise = (id) => contract.methods.getMetadata(id).call()
    .then(async (result) => {
      let cardItem = {};
      cardItem.collectionAddress = contractAddress;
      cardItem.tokenId = id;
      cardItem.assetURI = getImageURI(result.assetURI);
      cardItem.title = result.title.replace(/\'/g, "\\'");
      cardItem.attributes = JSON.stringify([])
      cardItem.description = ''
      console.log(cardItem)

      if (result.assetType && result.assetType !== '') {
        cardItem.assetType = result.assetType
      } else {
        cardItem.assetType = await getAssetType(cardItem.assetURI)
      }
      createArray.push(cardItem)
    })
    .catch((err) => {
      console.log(err.message)
    })

  for(let id = startId; id <= totalSupply; id++) {
    ids.push(id)
  }
  await Promise.all(ids.map((id) => promise(id)))
  if (createArray.length) {
      await NFT.createMany(createArray)
      return createArray.length
  }
    
}

// rest api

const getNFT = async (req, res) => {
  const { collectionAddress: _collectionAddress } = req.params
  const collectionAddress = _collectionAddress.toLowerCase()
  const { index, limit } = req.query
  try {
    NFT.getCollectionNFT(collectionAddress, index, limit, (result, data) => {
      if (result) {
        res
        .status(200)
        .json({
          result: true,
          data
        })
      } else {
        res
        .status(500)
        .json({
          result: false,
          data
        })
      }
    })
    
  } catch (err) {
    console.log(err)
    res.status(400).json({ error: 'database error'})
  }
}

const getOneNFT = async (req, res) => {
  const { collectionAddress: _collectionAddress, tokenId } = req.params
  try {
    const collectionAddress = _collectionAddress.toLowerCase()
    NFT.getNFT(collectionAddress, tokenId, (result, data) => {
      if (result) {
        res
        .status(200)
        .json({
          result: true,
          data
        })
      } else {
        res
        .status(500)
        .json({
          result: false,
          data
        })
      }
    })
    
  } catch (err) {
    console.log(err)
    res.status(400).json({ error: 'database error'})
  }
}

const getMarketplaceNFTs = async (req, res) => {
  const { items } = req.body
  console.log(items)
  try {
    NFT.getMarketplaceNFTs(items, (result, data) => {
      if (result) {
        res
        .status(200)
        .json({
          result: true,
          data
        })
      } else {
        res
        .status(500)
        .json({
          result: false,
          data
        })
      }
    })
    
  } catch (err) {
    console.log(err)
    res.status(400).json({ error: 'database error'})
  }
}

const getNumOfNFTs = async (req, res) => {
  try {
    const { collectionAddress } = req.params
    const result = await NFT.countNFTs(collectionAddress)
    if (result && result['COUNT(*)']) {
      res.status(200).json({
        result: true,
        data: result['COUNT(*)']
      })
    } else {
      res.status(400).json({})
    }
  } catch (err) {
    console.log(err)
    res.status(500).json({})
  }
}

const calculateRarity = async (req, res) => {
  try {
    const { collectionAddress: _collectionAddress } = req.body
    
    const collectionAddress = _collectionAddress.toLowerCase()
    NFT.getCollectionNFT(collectionAddress, 0, 0, (result, data) => {
      if (result && data.length) {
        const traitTotalCounts = []
        const totalLength = data.length
        let dataToUpdate = data.map((nftItem) => {
          const { attributes, tokenId } = nftItem
          let score = 0
          if (attributes) {
            jsonAttributes = attributes
            if (typeof attributes !== 'object') {
              jsonAttributes = JSON.parse(attributes)
            }
            if (jsonAttributes) {
              jsonAttributes.forEach(attribute => {
                const { trait_type, value } = attribute
                let totalCount = 0
                const totalTraitItem = traitTotalCounts.find((item) => (item.trait_type === trait_type && item.value === value))
                if (!totalTraitItem) {
                  totalCount = countTraitValue(data, trait_type, value)
                  console.log(totalCount)
                  traitTotalCounts.push({
                    trait_type,
                    value,
                    count: totalCount
                  })
                } else {
                  totalCount = totalTraitItem.count
                }
                if (totalCount) score += totalLength / totalCount
              });
              return {
                collectionAddress,
                tokenId,
                rarityScore: score
              }
            }
          }
          return {
            collectionAddress,
            tokenId,
            rarityScore: 0
          }
        })
        if (dataToUpdate && dataToUpdate.length) {
          dataToUpdate.sort(function(a, b) {
            if (a.rarityScore && b.rarityScore) {
              if (a.rarityScore > b.rarityScore) return -1
              else if (a.rarityScore < b.rarityScore) return 1
              else return 0
            } else  if (a.rarityScore) {
              return -1
            } else if (b.rarityScore) {
              return 1
            } else {
              return 0
            }
          })
          dataToUpdate = dataToUpdate.map((item, index) => ({ ...item, rarityRank : item.rarityScore > 0 ? index + 1 : 0}))
          
          NFT.updateRarity(dataToUpdate)
        }

        res
        .status(200)
        .json({
          result: true,
          data: dataToUpdate
        })
      } else {
        res
        .status(500)
        .json({
          result: false,
          data
        })
      }
    })
  } catch (err) {
    console.log(err)
    res
      .status(400)
      .json({
        result: false,
      })
  }
}

const getCurrency = async (req, res) => {
  try {
    const { symbols } = req.body
    console.log(symbols)
    const response = await fetch('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=' + symbols, {
      headers: {
        'X-CMC_PRO_API_KEY': '215fd997-84ea-4206-8e4c-fdde73dc12c1'
      }
    })
    const responseText = await response.text()
    const regex = /\,(?!\s*?[\{\[\"\'\w])/g;
    const correct = responseText.replace(regex, '').replace(',"frequency":100%', '');
    const tokens = JSON.parse(correct)
    res.json(tokens)
  } catch (err) {
    console.log(err)
  }
}

module.exports = {
  fetchDefaultNFTData,
  fetchNFTData,
  fetch1155NFTData,
  getNFT,
  getOneNFT,
  getMarketplaceNFTs,
  getNumOfNFTs,
  calculateRarity,
  removeNFTData,
  setRarity,
  getCurrency
}
