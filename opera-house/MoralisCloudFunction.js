Moralis.Cloud.define("setting", async () => {
  try {
    await Moralis.settings.setAPIRateLimit({
      anonymous:5, authenticated:2, windowMs:6000
    })
    return true
  } catch (err) {
    return err
  }
}

Moralis.Cloud.define("updateProfile", async (request) => {
  const { user, params } = request;
  if (user) {
    const { address } = params;
    
    const Profile = Moralis.Object.extend("Profile");
    const query = await new Moralis.Query(Profile);
    
    query.equalTo('address', address);
    const profile = await query.first({useMasterKey: true});
    if (profile) {
      const { avatar, email, displayName, url, description, twitter, discord, telegram } = params
      if (displayName && displayName !== '') {
        const query = await new Moralis.Query(Profile);
        query.matches('displayName', displayName.trim(), 'i');
        const oldProfile = await query.first({useMasterKey: true});
        if (oldProfile && oldProfile.get('address') !== address) {
          return { result: false, error: 'Username already exists' }
        }
        profile.set('displayName', displayName.trim())
      } else {
      	profile.set('displayName', '')
      }
      profile.set('avatar', avatar)
      profile.set('email', email)
      profile.set('url', url)
      profile.set('description', description)
      profile.set('twitter', twitter)
      profile.set('discord', discord)
      profile.set('telegram', telegram)
      await profile.save(null, {useMasterKey: true})
      return {result: true, data: profile.attributes }
    } else {
      const { address, avatar, email, displayName, url, description, twitter, discord, telegram } = params
      const profile = new Profile({useMasterKey:true});
      profile.set('address', address)
      if (displayName && displayName !== '') {
        const query = await new Moralis.Query(Profile);
        query.matches('displayName', displayName.trim(), 'i');
        const oldProfile = await query.first({useMasterKey: true});
        if (oldProfile && oldProfile.get('address') !== address) {
          return { result: false, error: 'Username already exists' }
        }
        profile.set('displayName', displayName.trim())
      }
      if (avatar) profile.set('avatar', avatar)
      if (email) profile.set('email', email)
      if (url) profile.set('url', url)
      if (description) profile.set('description', description)
      if (twitter) profile.set('twitter', twitter)
      if (discord) profile.set('discord', discord)
      if (telegram) profile.set('telegram', telegram)
      await profile.save(null, {useMasterKey: true});
      return {result: true, data: profile.attributes }
    }
  } else {
    return { result: false, error: 'Authentication Error' }
  }
});

Moralis.Cloud.define("deleteAvatar", async (request) => {
  const { user, params } = request;
  if (user && params) {
    const { address } = params;
    
    const Profile = Moralis.Object.extend("Profile");
    const query = await new Moralis.Query(Profile);
    query.equalTo('address', address);
    const profile = await query.first({useMasterKey: true});
    if (profile) {
      profile.set('avatar', null)
      await profile.save(null, {useMasterKey: true});
    }
    return true
  } else {
    return 'Authentication Error'
  }
});

Moralis.Cloud.define("userDataByAddress", async (request) => {

    const { params } = request;
    if (params) {
      const { address } = params;
      const User = Moralis.Object.extend("User");
      const userQuery = await new Moralis.Query(User);
      userQuery.equalTo('ethAddress', address);
      const user = await userQuery.first({useMasterKey: true});
      if (user) {
        const data = { id: user.id, ethAddress: user.get('ethAddress') }
        const Profile = Moralis.Object.extend("Profile");
        const query = await new Moralis.Query(Profile);
        query.equalTo('address', address);
        const profile = await query.first({useMasterKey: true}).catch(() => null);
        if (profile) {
          data.avatar = profile.get('avatar')
          data.email = profile.get('email')
          data.url = profile.get('url')
          data.displayName = profile.get('displayName')
          data.twitter = profile.get('twitter')
          data.discord = profile.get('discord')
          data.telegram = profile.get('telegram')
        }
        return data
      } else {
      	return 'Unknown_user'
      }
    } else {
      return 'Authentication Error'
    }
});

Moralis.Cloud.define("profilePay", async (request) => {
  const { user, params } = request;
  if (user && params) {
    const { address } = params;
    
    const Profile = Moralis.Object.extend("Profile");
    const query = await new Moralis.Query(Profile);
    query.equalTo('address', address);
    const profile = await query.first({useMasterKey: true});
    if (profile) {
      profile.set('paid', true)
      await profile.save(null, {useMasterKey: true});
    }
    return { result: true }
  } else {
    return { result: false, error: 'Authentication Error' }
  }
});


Moralis.Cloud.define("submitCollection", async (request) => {
  try {
    const { user, params } = request;
    if (user && params) {
      const { name,
        address,
        owner,
        addressShort,
        description,
        royalty,
        website,
        discord,
        twitter,
        category,
        minting,
        maxSupply,
        price,
        image,
        banner } = params;

      const Collection = Moralis.Object.extend("Collection");
      const query = await new Moralis.Query(Collection);
      query.equalTo('address', address.toLowerCase());
      query.fullText('name', name);
      const oldCollections = await query.find({useMasterKey: true});
      if (oldCollections) {
        for (let i = 0; i < oldCollections.length; i ++) {
          const collection = oldCollections[i]
          if (collection.get('name').toLowerCase() === name || collection.get('address').toLowerCase() === address.toLowerCase()) {
            return { result: false, error: 'Name or Address Already exits' }
          }
        }
      }
      const collection = new Collection({ useMasterKey: true })
      collection.set('name', name)
      collection.set('address', address.toLowerCase())
      collection.set('owner', owner.toLowerCase())
      collection.set('addressShort', addressShort)
      collection.set('description', description)
      collection.set('royalty', royalty)
      collection.set('website', website)
      collection.set('discord', discord)
      collection.set('twitter', twitter)
      collection.set('category', category)
      collection.set('minting',minting)
      if (minting) {
        collection.set('maxSupply', maxSupply ? Number(maxSupply) : 0)
        collection.set('price', price ? Number(price) : 0)
      }
      collection.set('image', image)
      collection.set('banner', banner)
      await collection.save(null, {useMasterKey: true})
      return { result: true }
    } else {
      return { result: false, error: 'Authentication Error' }
    }
  } catch (err) {
    return { result: false, error: err }
  }
});

Moralis.Cloud.define("updateCollection", async (request) => {
  try {
    const { user, params } = request;
    if (user && params) {
      const {
        account,
        name,
        address,
        owner,
        addressShort,
        description,
        prefix,
        ipfsUri,
        royalty,
        website,
        discord,
        twitter,
        category,
        minting,
        maxSupply,
        price,
        image,
        banner } = params;

      const Collection = Moralis.Object.extend("Collection");
      const query = new Moralis.Query(Collection);
      
      query.fullText('name', name);
      const oldCollections = await query.find({useMasterKey: true});
      if (oldCollections) {
        for (let i = 0; i < oldCollections.length; i ++) {
          const collection = oldCollections[i]
          if (collection.get('name').toLowerCase() === name && !collection.get('address').toLowerCase() === address.toLowerCase()) {
            return { result: false, error: 'Name or Address Already exits' }
          }
        }
      }
      const updateQuery = new Moralis.Query(Collection);
      updateQuery.equalTo('address', address.toLowerCase())
      updateQuery.equalTo('owner', account.toLowerCase())
      const collection = await updateQuery.first({useMasterKey: true})
      if (!collection) return { result: false, error: 'Permission denied' }
      collection.set('name', name)
      collection.set('addressShort', addressShort)
      collection.set('description', description)
      collection.set('ipfsUri', ipfsUri)
      collection.set('prefix', prefix)
      collection.set('royalty', royalty)
      collection.set('website', website)
      collection.set('discord', discord)
      collection.set('twitter', twitter)
      collection.set('category', category)
      collection.set('minting', minting)
      if (minting) {
        collection.set('maxSupply', maxSupply ? Number(maxSupply) : 0)
        collection.set('price', price ? Number(price) : 0)
      }
      if (image) collection.set('image', image)
      if (banner) collection.set('banner', banner)
      await collection.save(null, {useMasterKey: true})
      return { result: true }
    } else {
      return { result: false, error: 'Authentication Error' }
    }
  } catch (err) {
    return { result: false, error: err.message }
  }
});

Moralis.Cloud.define("getAcceptedCollections", async (request) => {
  try {
    const Collection = Moralis.Object.extend("Collection");
    const query = new Moralis.Query(Collection);
    query.equalTo('accepted', true);
    const count = await query.count();
    query.limit(count);
    const collections = await query.find({ useMasterKey: true });
    const data = collections.map(({ attributes }) => attributes)
    if (collections) {
      return { result: true, data, count: collections.length }
    } else {
      return { result: false, error: 'no collection' }
    }
  } catch (err) {
    return { result: false, error: err }
  }
});

Moralis.Cloud.define("submitCollectionByAdmin", async (request) => {
  try {
    const { user, params } = request;
    if (user && params) {
      const { name,
        address,
        owner,
        addressShort,
        description,
        prefix,
        ipfsUri,
        royalty,
        website,
        discord,
        twitter,
        category,
        audit,
        minting,
        price,
        maxSupply,
        localImage,
        localBanner,
        replacement,
        replacementPrefix,
        replacementSubfix } = params;

      const Collection = Moralis.Object.extend("Collection");
      const query = await new Moralis.Query(Collection);
      query.equalTo('address', address.toLowerCase());
      query.fullText('name', name);
      const oldCollections = await query.find({useMasterKey: true});
      if (oldCollections) {
        for (let i = 0; i < oldCollections.length; i ++) {
          const collection = oldCollections[i]
          if (collection.get('name').toLowerCase() === name || collection.get('address').toLowerCase() === address.toLowerCase()) {
            return { result: false, error: 'Name or Address Already exits' }
          }
        }
      }
      const collection = new Collection({ useMasterKey: true })
      collection.set('name', name)
      collection.set('address', address.toLowerCase())
      collection.set('owner', owner.toLowerCase())
      collection.set('addressShort', addressShort)
      collection.set('description', description)
      collection.set('prefix', prefix)
      collection.set('ipfsUri', ipfsUri)
      collection.set('royalty', royalty)
      collection.set('website', website)
      collection.set('discord', discord)
      collection.set('twitter', twitter)
      collection.set('category', category)
      collection.set('audit', audit)
      collection.set('minting',minting)
      collection.set('maxSupply',maxSupply)
      collection.set('price',price)
      collection.set('localImage', localImage)
      collection.set('localBanner', localBanner)
      collection.set('replacement', replacement)
      collection.set('replacementPrefix', replacementPrefix)
      collection.set('replacementSubfix', replacementSubfix)
      collection.set('accepted', true)
      collection.set('sellable', true)
      await collection.save(null, {useMasterKey: true})
      return { result: true }
    } else {
      return { result: false, error: 'Authentication Error' }
    }
  } catch (err) {
    return { result: false, error: err }
  }
});


Moralis.Cloud.define("getProfileLikeNFTs", async (request) => {
  try {
    const { user, params } = request;
    const { walletAddress } = params
    const Like = Moralis.Object.extend('LikeNFT')
    const query = new Moralis.Query(Like)
    query.equalTo('address', walletAddress.toLowerCase())
    const count = await query.count()
    query.limit(count)
    const likes = await query.find();
    if (likes) {
      const web3 = Moralis.web3ByChain("0xfa")
      const abi = Moralis.Web3.abis.erc721
      const nfts = await Promise.all(likes.map(async (like) => {
        const token_id = like.get('token_id')
        const token_address = like.get('token_address')
        const contract = new web3.eth.Contract(abi, token_address)
        const result = await contract.methods.tokenURI(token_id).call()
          .catch((err) => null)

        return {
          token_id,
          token_address,
          token_uri: result
        }
      }))
      return { result: true, data: nfts }
    }
  } catch (err) {
  	return { result: false }
  }
})

Moralis.Cloud.define("getFollowUsers", async (request) => {
  try {
    const { user, params } = request;
    const { walletAddress } = params
    const Follow = Moralis.Object.extend('Follow')
    const query = new Moralis.Query(Follow)
    query.equalTo('following_address', walletAddress.toLowerCase())
    const count = await query.count()
    query.limit(count)
    const follows = await query.find();
    if (follows) {
      const Profile = Moralis.Object.extend("Profile")
      
      let followUsers = await Promise.all(follows.map(async (follow) => {
        const query = await new Moralis.Query(Profile)
        const address = follow.get('follower_address')
        query.equalTo('address', address)
        const profile = await query.first({useMasterKey: true}).catch(() => null)
        if (profile) {
          const data = {}
          data.avatar = profile.get('avatar')
          data.address = profile.get('address')
          data.url = profile.get('url')
          data.displayName = profile.get('displayName')
          data.twitter = profile.get('twitter')
          data.discord = profile.get('discord')
          data.telegram = profile.get('telegram')
          return data
        } else {
          return null
        }
      }))
      followUsers = followUsers.filter((item) => item)
      return { result: true, data: followUsers }
    } else {
      return { result: false, error: 'no_data' }
    }
  } catch (err) {
  	return { result: false }
  }
})

Moralis.Cloud.define("getFollowerUsers", async (request) => {
  try {
    const { user, params } = request;
    const { walletAddress } = params
    const Follow = Moralis.Object.extend('Follow')
    const query = new Moralis.Query(Follow)
    query.equalTo('follower_address', walletAddress.toLowerCase())
    const count = await query.count()
    query.limit(count)
    const followers = await query.find();
    if (followers) {
      const Profile = Moralis.Object.extend("Profile")
      
      let followerUsers = await Promise.all(followers.map(async (follow) => {
        const query = await new Moralis.Query(Profile)
        const address = follow.get('following_address')
        query.equalTo('address', address)
        const profile = await query.first({useMasterKey: true}).catch(() => null)
        if (profile) {
          const data = {}
          data.avatar = profile.get('avatar')
          data.address = profile.get('address')
          data.url = profile.get('url')
          data.displayName = profile.get('displayName')
          data.twitter = profile.get('twitter')
          data.discord = profile.get('discord')
          data.telegram = profile.get('telegram')
          return data
        } else {
          return null
        }
      }))
      followerUsers = followerUsers.filter((item) => item)
      return { result: true, data: followerUsers }
    } else {
      return { result: false, error: 'no_data' }
    }
  } catch (err) {
  	return { result: false, error: err.message }
  }
})


const defaultABI = [{"inputs":[{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"symbol","type":"string"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"collectionAddress","type":"address"}],"name":"approveCollection","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"auctionEnd","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"auctionEndTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"auctionStatus","outputs":[{"internalType":"uint256","name":"startPrice","type":"uint256"},{"internalType":"uint256","name":"endTime","type":"uint256"},{"components":[{"internalType":"uint256","name":"price","type":"uint256"},{"internalType":"address","name":"bidder","type":"address"}],"internalType":"struct ERC721Enumerable.Bid","name":"winner","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"uint256","name":"price","type":"uint256"}],"name":"bid","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"bidStatus","outputs":[{"internalType":"uint256","name":"price","type":"uint256"},{"internalType":"address","name":"bidder","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"collectionInfo","outputs":[{"internalType":"uint256","name":"totalVolume","type":"uint256"},{"internalType":"uint256","name":"totalSales","type":"uint256"},{"internalType":"uint256","name":"lastSale","type":"uint256"},{"internalType":"uint256","name":"lastSold","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"components":[{"internalType":"string","name":"assetURI","type":"string"},{"internalType":"string","name":"email","type":"string"},{"internalType":"address","name":"contractAddress","type":"address"},{"internalType":"string","name":"link","type":"string"},{"internalType":"string","name":"collectionType","type":"string"}],"internalType":"struct ERC721Enumerable.Collection","name":"collection","type":"tuple"}],"name":"createCollection","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"feePercentage","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getApprovedCollections","outputs":[{"components":[{"internalType":"string","name":"assetURI","type":"string"},{"internalType":"string","name":"email","type":"string"},{"internalType":"address","name":"contractAddress","type":"address"},{"internalType":"string","name":"link","type":"string"},{"internalType":"string","name":"collectionType","type":"string"}],"internalType":"struct ERC721Enumerable.Collection[]","name":"","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getCollectionArray","outputs":[{"components":[{"internalType":"string","name":"assetURI","type":"string"},{"internalType":"string","name":"email","type":"string"},{"internalType":"address","name":"contractAddress","type":"address"},{"internalType":"string","name":"link","type":"string"},{"internalType":"string","name":"collectionType","type":"string"}],"internalType":"struct ERC721Enumerable.Collection[]","name":"","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"collectionAddress","type":"address"}],"name":"getFloor","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"collectionAddress","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getHistory","outputs":[{"components":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"price","type":"uint256"}],"internalType":"struct ERC721Enumerable.History[]","name":"","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getMetadata","outputs":[{"components":[{"internalType":"string","name":"assetURI","type":"string"},{"internalType":"string","name":"assetType","type":"string"},{"internalType":"string","name":"title","type":"string"},{"internalType":"string","name":"description","type":"string"},{"internalType":"uint256","name":"price","type":"uint256"},{"internalType":"bool","name":"sellPending","type":"bool"},{"internalType":"uint256","name":"royalty","type":"uint256"},{"internalType":"address","name":"creater","type":"address"},{"internalType":"address","name":"collectionAddress","type":"address"}],"internalType":"struct ERC721Enumerable.Metadata","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getOnSaleArrayLength","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"history","outputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"price","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"isOwner","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"},{"components":[{"internalType":"string","name":"assetURI","type":"string"},{"internalType":"string","name":"assetType","type":"string"},{"internalType":"string","name":"title","type":"string"},{"internalType":"string","name":"description","type":"string"},{"internalType":"uint256","name":"price","type":"uint256"},{"internalType":"bool","name":"sellPending","type":"bool"},{"internalType":"uint256","name":"royalty","type":"uint256"},{"internalType":"address","name":"creater","type":"address"},{"internalType":"address","name":"collectionAddress","type":"address"}],"internalType":"struct ERC721Enumerable.Metadata","name":"token_metadata","type":"tuple"}],"name":"mint","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"onSaleArray","outputs":[{"internalType":"address","name":"collectionAddress","type":"address"},{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"bool","name":"sellPending","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"otherTokenStatus","outputs":[{"internalType":"address","name":"tokenOwner","type":"address"},{"internalType":"uint256","name":"price","type":"uint256"},{"internalType":"bool","name":"sellPending","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"collectionAddress","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"address","name":"tokenOwner","type":"address"}],"name":"removeSellPendingOther","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes","name":"_data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"feePercentageNew","type":"uint256"}],"name":"setFeePercentage","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bool","name":"sellPending","type":"bool"},{"internalType":"uint256","name":"price","type":"uint256"}],"name":"setSellPending","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"collectionAddress","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"address","name":"tokenOwner","type":"address"},{"internalType":"uint256","name":"price","type":"uint256"}],"name":"setSellPendingOther","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"uint256","name":"price","type":"uint256"}],"name":"setSellPrice","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"uint256","name":"startPrice","type":"uint256"},{"internalType":"uint256","name":"period","type":"uint256"}],"name":"startAuction","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"index","type":"uint256"}],"name":"tokenByIndex","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"tokenMetadata","outputs":[{"internalType":"string","name":"assetURI","type":"string"},{"internalType":"string","name":"assetType","type":"string"},{"internalType":"string","name":"title","type":"string"},{"internalType":"string","name":"description","type":"string"},{"internalType":"uint256","name":"price","type":"uint256"},{"internalType":"bool","name":"sellPending","type":"bool"},{"internalType":"uint256","name":"royalty","type":"uint256"},{"internalType":"address","name":"creater","type":"address"},{"internalType":"address","name":"collectionAddress","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"index","type":"uint256"}],"name":"tokenOfOwnerByIndex","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalTokenCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transfer","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"collectionAddress","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"address","name":"collectionOwner","type":"address"},{"internalType":"uint256","name":"royalty","type":"uint256"}],"name":"transferOther","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"}]
const defaultContractAddress = '0x86c4764a936b0277877cb83abf1ad79ce35c754c'

Moralis.Cloud.define('getCollectionNFTs', async (request) => {
  try {
  	const { params } = request
    const { collectionAddress, walletAddress, index, limit, ipfsUri, replacement, replacementPrefix, replacementSubfix, sellable } = params
    if (collectionAddress) {
      const web3 = Moralis.web3ByChain("0xfa")
      const abi = Moralis.Web3.abis.erc721
      const options = { chain: "0xfa", address: collectionAddress, offset: index, limit: limit }
      const result = await Moralis.Web3API.token.getAllTokenIds(options)
      const contract = new web3.eth.Contract(abi, collectionAddress)
      const defaultContract = new web3.eth.Contract(defaultABI, defaultContractAddress)
       const fetchItemData = async (data) => {
         try {
           if (data) {
             let { token_uri, token_id: id, metadata: _metadata } = data

             let cardItem = {};
             let isBurnedNFT = false
             cardItem.isOwner = false;

             await contract.methods.ownerOf(id).call()
               .then((result) => {
                 if (result) {
                   cardItem.tokenOwnerAddress = result.toLowerCase()
                   if(walletAddress && walletAddress.toLowerCase() === result.toLowerCase()) cardItem.isOwner = true;
                   if (result && (result.toLowerCase() === '0x0000000000000000000000000000000000000001' || result.toLowerCase() === '0x000000000000000000000000000000000000dead')) isBurnedNFT = true
                 }
                 return true
               })
               .catch(async (err) => {
               return false
             })
             if (isBurnedNFT) return { result: true, data: null }

             cardItem.token_uri = token_uri
             cardItem.collectionAddress = collectionAddress;
             cardItem.id = id;
             cardItem.likes = 0;
             cardItem.avatarImg = '1';
             cardItem.title = '';
             cardItem.price = 0;
             cardItem.stock = 6;
             cardItem.isOnSale = false
          //  let { id, token_uri, metadata: _metadata } = item
           // if (!isIpfs(token_uri)) {
           await contract.methods.tokenURI(id).call()
             .then((result) => {
             if (result && result !== '') {
               token_uri = result
             }
           })
             .catch(() => {})
           // }

           let uri = token_uri

           let tokenURI = '';
           let metadata = null
           const substr = uri.substring(uri.length - 4)
           let ipfsSufix = ''
            if(substr === "json") ipfsSufix = "json";
            if (uri.includes('http')) ipfsSufix = 'url'
             if (ipfsUri && ipfsSufix === 'json') {
               tokenURI = ipfsUri + '/' + id + '.json'
             } else if (!isIpfs(uri) || (!(uri ==='' || uri.trim() ==='') && Buffer.from(uri, 'binary').toString('base64') === uri)) {
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
               tokenURI = getTokenURI(id, ipfsPrefix, ipfsSufix, involveId, subUri);
             }
              await Moralis.Cloud.httpRequest({
                url: tokenURI
              }).then(function(httpResponse) {
                const responseText = httpResponse.text
                const regex = /\,(?!\s*?[\{\[\"\'\w])/g;
                const correct = responseText.replace(regex, '');
                metadata = JSON.parse(correct)
                cardItem.metadata = metadata
              }, function(httpResponse) {
                cardItem.error = httpResponse.status
            });
           cardItem.title = metadata.name
           if (replacement && replacementPrefix) {
             cardItem.assetURI = '/img/replacements/' + replacementPrefix + id + replacementSubfix;
           } else {
             if (metadata.image) {
               cardItem.assetURI = metadata.image;
             } else if (metadata.animation_url){
               cardItem.assetURI = metadata.animation_url;
             } else {
               cardItem.assetURI = ''
             }
           }

           const { attributes } = metadata
           if (attributes && Array.isArray(attributes)) {
             cardItem.attributes = attributes
           }
             
          if (sellable) {
               await defaultContract.methods.otherTokenStatus(collectionAddress, id).call()
                 .then(async (info) => {
                 if (info?.tokenOwner?.toLowerCase() !== cardItem?.tokenOwnerAddress?.toLowerCase() || !info?.sellPending || Number(info.price) === 0) {
                   cardItem.isOnSale = false
                 } else {
                   cardItem.price = Number(info.price);
                   cardItem.isOnSale = true;
                   cardItem.sellable = sellable
                 }

               })
          }
            
           return { result: true, data: cardItem }
          } else {
            return { result: false }
          }
         } catch (err) {
           return { result: false }
         }
       }
      const fetchedItems = await Promise.all(result.result.map((data) => fetchItemData(data)))
      let newNfts = fetchedItems.filter((item) => item && item.result && item.data)
      newNfts = newNfts.map((item) => item.data)
      newNfts.sort(function(a,b){return a.id-b.id});
      return { result: true, data: newNfts }
    }
  } catch (err) {
    return { result: false, error: err.message }
  }
})


Moralis.Cloud.define("updateTokenPrice", async (request) => {
  try {
    const { params } = request
    const { tokens } = params
    const Token = Moralis.Object.extend("TokenPrice");

    tokens.forEach(({ address }) => {
      const options = {
        address,
        chain: "0xfa"
      };
      const price = await Moralis.Web3API.token.getTokenPrice(options);
      const FTMPrice = Number(price.nativePrice.value)
      const query = await new Moralis.Query(Token);
      query.equalTo('address', address);
      let token = await query.first({useMasterKey: true}).catch(() => null);
      if (!token) {
        token = new Token({ useMasterKey: true })
        token.set('address', address)
      }
      token.set('price', FTMPrice)
      await token.save(null, {useMasterKey: true});
    })
    return true
  } catch (err) {
    return false
  }
})

Moralis.Cloud.define("updateTokenPrice", async (request) => {
  try {
    const { params } = request
    const { tokens } = params
    const Token = Moralis.Object.extend("TokenPrice");

    tokens.forEach(async ({ address }) => {
      const options = {
        address,
        chain: "0xfa"
      };
      const price = await Moralis.Web3API.token.getTokenPrice(options);
      const FTMPrice = Number(price.nativePrice.value)
      const query = await new Moralis.Query(Token);
      query.equalTo('address', address);
      let token = await query.first({useMasterKey: true}).catch(() => null);
      if (!token) {
        token = new Token({ useMasterKey: true })
        token.set('address', address)
      }
      token.set('price', FTMPrice)
      await token.save(null, {useMasterKey: true});
    })
    return true
  } catch (err) {
    return false
  }
})
Moralis.Cloud.define("getTokenPrices", async (request) => {
  try {
    const TokenPrice = Moralis.Object.extend("TokenPrice");
    const query = new Moralis.Query(TokenPrice);
    const prices = await query.find({ useMasterKey: true });
    const data = prices.map((item) => {
      return {
        address: item.get('address'),
        price: item.get('price')
      }
    })
    return { result: true, data }
  } catch (err) {
    return { result: false, error: err }
  }
});
