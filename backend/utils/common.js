var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

const sleep = (timeToSleep) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, timeToSleep)
  })
}

const isIpfs = (uri) => {
  if (uri && (uri.includes('/ipfs/') || uri.includes('ipfs://'))) {
    return true
  } else {
    return false
  }
}

const isBurned = (address) => {
  if (address && (address.toLowerCase() === '0x0000000000000000000000000000000000000001' || address.toLowerCase() === '0x000000000000000000000000000000000000dead')) return true
  else return false
}

function isBase64(str) {
  if (str ==='' || str.trim() ===''){ return false; }
  try {
    let buff = new Buffer(data);
      return btoa(atob(str)) === str;
  } catch (err) {
      return false;
  }
}

const base64Re = new RegExp(/^data:\w+\/\w+;base64,/);

function isBase64URI(uri) {
  return base64Re.test(uri)
}

const getImageURI = (uri) => {
  if (isBase64(uri)) return uri
  if (isIpfs(uri)) {
    let ipfsPos = uri.lastIndexOf('ipfs')
    let subUri = uri.substring(ipfsPos + 4)
    while (subUri && subUri.length > 0) {
      const firstCharacter = subUri[0]
      if (!firstCharacter.match(/[a-z]/i)) subUri = subUri.substring(1)
      else break
    }
    return "https://operahouse.mypinata.cloud/ipfs/" + subUri.replace(/#/g, '%23')
  } else {
    return uri
  }
}

const isIdInURI = (uri) => {
  let slashCount = 0;
  for(let i = 0; i < uri.length; i++) {
    if(uri[i] === "/") slashCount++;
  }
  if(slashCount <= 2) return false;
  return true;
}

const getIPFSSufix = (uri) => {
  const substr = uri.substring(uri.length - 4)
  if(substr === "json") return "json";
  if (uri.includes('http')) return 'url'
  return "";
}

const getTokenURI = (id, ipfsPrefix, ipfsSufix, involveId, locationQm) => {
  if(involveId) {
    if (ipfsPrefix && ipfsPrefix.includes('Qm')) {
      let arr = locationQm.split('/')
      if (arr && arr.length > 1) {
        let name = arr[1]
        if (ipfsPrefix[ipfsPrefix.length - 1] === '/') {
          return ipfsPrefix + name;
        } else {
          return ipfsPrefix + '/' + name;
        }
      } else {
        return "https://operahouse.mypinata.cloud/ipfs/" + locationQm;
      }
    } else if (!ipfsPrefix || ipfsPrefix === '') {
      if (locationQm && locationQm.length > 0 && locationQm[0] === '/') {
        return "https://operahouse.mypinata.cloud/ipfs" + locationQm;
      } else {
        return "https://operahouse.mypinata.cloud/ipfs/" + locationQm;
      }
    } else {
      if ((locationQm && locationQm.length > 0 && locationQm[0] === '/') || (ipfsPrefix && ipfsPrefix.length > 0 && ipfsPrefix[ipfsPrefix.length - 1] === '/')) {
        return ipfsPrefix + locationQm;
      } else {
        return ipfsPrefix + '/' + locationQm;
      }
    }
  } else{
    if (locationQm && locationQm.length > 0 && locationQm[0] === '/') {
      return "https://operahouse.mypinata.cloud/ipfs" + locationQm;
    } else {
      return "https://operahouse.mypinata.cloud/ipfs/" + locationQm;
    }
  }
}

const getAssetType = (url) => {
  if (url) {
    if (isBase64URI(url)) return 'base64'
    let uri = url
    const p = uri.indexOf('?')
    if (p !== -1) {
      const subStr = uri.slice(p, uri.length)
      if (!subStr.includes('?index='))
        uri = uri.slice(0, p)
    }
    if(uri.indexOf(".mp4") !== -1) return "video";
    if(uri.indexOf(".m4v") !== -1) return "video";
    if(uri.indexOf(".avi") !== -1) return "video";
    if(uri.indexOf(".mp3") !== -1) return "video";
    if(uri.indexOf(".png") !== -1) return "image";
    if(uri.indexOf(".jpeg") !== -1) return "image";
    if(uri.indexOf(".jpg") !== -1) return "image";
    if(uri.indexOf("image") !== -1) return "image";
    if(uri.indexOf(".gif") !== -1) return "image";
    if(uri.indexOf(".glb") !== -1) return "glb";
    return new Promise((resolve, reject) => {
      var xhr = new XMLHttpRequest();
      xhr.open('HEAD', url, true);
      const timeout = setTimeout(() => {
        clearTimeout(timeout)
        console.log('abort')
        xhr.abort()
        resolve('other')
      }, 2000)
      xhr.onload = function() {
        clearTimeout(timeout)
        var contentType = xhr.getResponseHeader('Content-Type');
        if (contentType.match('video.*')) resolve('video')
        else if (contentType.match('image.*')) resolve('image')
        else resolve('other')
      };
      xhr.onerror = function(err) {
        clearTimeout(timeout)
        resolve('other')
      }
      xhr.ontimeout = function(err) {
        clearTimeout(timeout)
        resolve('other')
      }
      xhr.send();
    })
  } else {
    return 'other'
  }
}

const countTraitValue = (nfts, traitType, traitValue) => {
  try {
    const traitCount = nfts.filter((nft) => {
      const attributes = nft.attributes
      if (!attributes) return false
      let jsonAttributes = attributes
      if (typeof attributes !== 'object') jsonAttributes = JSON.parse(attributes)
      if (jsonAttributes)
        return jsonAttributes.find(({ trait_type, value }) => (value === traitValue && trait_type === traitType))
      return false
    }).length
    return traitCount
  } catch (err) {
    return 0
  }
}

module.exports = {
  isBase64,
  isIpfs,
  getAssetType,
  getImageURI,
  getTokenURI,
  isBurned,
  isIdInURI,
  getIPFSSufix,
  sleep,
  countTraitValue
}
