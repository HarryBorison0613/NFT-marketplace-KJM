
import {
  ALL_LISTITEMS,
  OWNED_LISTITEMS,
  getQuery,
  COLLECTION_LISTITEMS,
  MARKETPLACE_LISTITEMS,
  ITEM_QUERY,
  AUCTION_LISTITEMS,
  ACTIVE_AUCTION_LISTITEMS,
  ENDED_AUCTION_LISTITEMS,
  COLLECTIONS_QUERY,
  COLLECTION_QUERY,
  COLLECTION_FLOOR,
  VOLUMES_QUERY,
  LAST_SOLD
} from './queries'
import { config } from '../constant/config';

const getAllListItems = () => {
  return fetch(config.graph_url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: ALL_LISTITEMS })
  })
    .then((response) => {
      if (response.status >= 400) {
        throw new Error("Error fetching data");
      } else {
        return response.json();
      }
    })
    .then((data) => data.data?.listItems);
}

const getMarketplaceListItems = () => {
  return fetch(config.graph_url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: MARKETPLACE_LISTITEMS })
  })
    .then((response) => {
      if (response.status >= 400) {
        throw new Error("Error fetching data");
      } else {
        return response.json();
      }
    })
    .then((data) => data.data);
}

const getAuctionListItems = () => {
  return fetch(config.graph_url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: AUCTION_LISTITEMS })
  })
    .then((response) => {
      if (response.status >= 400) {
        throw new Error("Error fetching data");
      } else {
        return response.json();
      }
    })
    .then((data) => data.data);
}

const getActiveAuctionListItems = () => {
  const time = Math.round(Date.now()/1000)
  const query = getQuery(ACTIVE_AUCTION_LISTITEMS, {
    time
  })
  return fetch(config.graph_url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  })
    .then((response) => {
      if (response.status >= 400) {
        throw new Error("Error fetching data");
      } else {
        return response.json();
      }
    })
    .then((data) => data.data);
}

const getEndedAuctionListItems = () => {
  const time = Math.round(Date.now()/1000)
  const query = getQuery(ENDED_AUCTION_LISTITEMS, {
    time
  })
  return fetch(config.graph_url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  })
    .then((response) => {
      if (response.status >= 400) {
        throw new Error("Error fetching data");
      } else {
        return response.json();
      }
    })
    .then((data) => data.data);
}


const getOwnedListItems = ({ queryKey }) => {
  const [_, walletAddress] = queryKey
  console.log(walletAddress)
  return new Promise((resolve, reject) => {
    if (walletAddress) {
      const query = getQuery(OWNED_LISTITEMS, {
        address: walletAddress
      })
      return fetch(config.graph_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      })
        .then((response) => {
          if (response.status >= 400) {
            throw new Error("Error fetching data");
          } else {
            return response.json();
          }
        })
        .then((data) => resolve(data.data?.listItems))
        .catch(() => reject())
    } else {
      resolve(null)
    }
  })
}

const getCollectionListItems = ({ queryKey }) => {
  const [_, collectionAddress] = queryKey
  return new Promise((resolve, reject) => {
    if (collectionAddress) {
      const query = getQuery(COLLECTION_LISTITEMS, {
        address: collectionAddress
      })
      fetch(config.graph_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      })
        .then((response) => {
          if (response.status >= 400) {
            reject("Error fetching data");
          } else {
            return response.json();
          }
        })
        .then((data) => resolve(data.data))
        .catch((err) => reject(err))
    } else {
      resolve(null)
    }
  })
}

const getListItemDetail= (collectionAddress, id) => {
  return new Promise((resolve, reject) => {
    if (collectionAddress) {
      const query = getQuery(ITEM_QUERY, {
        address: collectionAddress,
        id
      })
      fetch(config.graph_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      })
        .then((response) => {
          if (response.status >= 400) {
            reject("Error fetching data");
          } else {
            return response.json();
          }
        })
        .then((data) => resolve(data.data))
        .catch((err) => reject(err))
    } else {
      reject('No collection')
    }
  })
}

const getCollectionsInfo = () => {
  return fetch(config.graph_url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: COLLECTIONS_QUERY })
  })
    .then((response) => {
      if (response.status >= 400) {
        throw new Error("Error fetching data");
      } else {
        return response.json();
      }
    })
    .then((data) => data.data);
}

const getVolumes = () => {
  return fetch(config.graph_url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: VOLUMES_QUERY })
  })
    .then((response) => {
      if (response.status >= 400) {
        throw new Error("Error fetching data");
      } else {
        return response.json();
      }
    })
    .then((data) => data.data.volumes);
}

const getLastSold = () => {
  return fetch(config.graph_url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: LAST_SOLD })
  })
    .then((response) => {
      if (response.status >= 400) {
        throw new Error("Error fetching data");
      } else {
        return response.json();
      }
    })
    .then((data) => data.data.histories)
    .catch(() => null)
}

const getCollectionInfoFromBC = (collectionAddress) => {
  return new Promise((resolve, reject) => {
    if (collectionAddress) {
      const query = getQuery(COLLECTION_QUERY, { address: collectionAddress })
      return fetch(config.graph_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      })
        .then((response) => {
          if (response.status >= 400) {
            throw new Error("Error fetching data");
          } else {
            return response.json();
          }
        })
        .then((data) => resolve({ ...data.data.collections[0], volumes: data.data.volumes }))
        .catch((err) => reject(err))
    } else {
      reject('No collection')
    }
  })
}

const getCollectionFloorFromBC = (collectionAddress) => {
  return new Promise((resolve, reject) => {
    if (collectionAddress) {
      const query = getQuery(COLLECTION_FLOOR, { address: collectionAddress })
      return fetch(config.graph_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      })
        .then((response) => {
          if (response.status >= 400) {
            throw new Error("Error fetching data");
          } else {
            return response.json();
          }
        })
        .then((data) => resolve(data.data?.listItems[0]?.price?? 0))
        .catch((err) => reject(err))
    } else {
      reject('No collection')
    }
  })
}



export {
  getAllListItems,
  getMarketplaceListItems,
  getOwnedListItems,
  getCollectionListItems,
  getListItemDetail,
  getAuctionListItems,
  getActiveAuctionListItems,
  getEndedAuctionListItems,
  getCollectionsInfo,
  getVolumes,
  getCollectionInfoFromBC,
  getCollectionFloorFromBC,
  getLastSold
}
