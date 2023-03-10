const express = require('express');
const { getCurrency, fetchNFTData, getNFT, getMarketplaceNFTs, fetchDefaultNFTData, getOneNFT, getNumOfNFTs, calculateRarity, removeNFTData, setRarity } = require('./controller/NFT');
const router = express.Router();

router.post('/fetchFromBC', async function (req, res) {
  try {
    const { collectionAddress, startId, endId, replacement, replacementPrefix, replacementSubfix, collectionName, ipfsUri } = req.body
    let result = null
    if (collectionAddress == 'default') {
      result = await fetchDefaultNFTData()
    } else {
      result = await fetchNFTData(collectionAddress, startId, endId, collectionName, ipfsUri, replacement, replacementPrefix, replacementSubfix)
    }
    console.log(result)
    return res.status(200).json({ result: true, data: result });
  } catch (err) {
    res.status(500).json({ error: 'unknown_error' });
  }
});

router.get('/:collectionAddress', getNFT);

router.get('/:collectionAddress/count', getNumOfNFTs);

router.get('/:collectionAddress/:tokenId', getOneNFT);

router.post('/set/rarity', setRarity);

router.post('/getItems', getMarketplaceNFTs);

router.post('/calculateRarity', calculateRarity);

router.post('/remove', removeNFTData);

router.post('/currency', getCurrency);


//export this router to use in our index.js
module.exports = router;
