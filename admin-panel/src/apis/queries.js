const ALL_LISTITEMS = `
{
  listItems {
    id
    nftContract
    contractType
    seller
    tokenId
    amount
    price
    paymentToken
    listType
  }
}
`;

const MARKETPLACE_LISTITEMS = `
{
  listItems (where: { listType: true }){
    id
    nftContract
    contractType
    seller
    tokenId
    amount
    price
    paymentToken
    listType
    expireTimestamp
  }
}
`;

const AUCTION_LISTITEMS = `
{
  listItems (where: { listType: false }, orderBy: expireTimestamp, orderDirection: asc){
    id
    nftContract
    contractType
    seller
    tokenId
    amount
    price
    paymentToken
    listType
    expireTimestamp
  }
}
`;

const ACTIVE_AUCTION_LISTITEMS = `
{
  listItems (where: { listType: false, expireTimestamp_gt: $time }, orderBy: expireTimestamp, orderDirection: asc){
    id
    nftContract
    contractType
    seller
    tokenId
    amount
    price
    paymentToken
    listType
    expireTimestamp
  }
}
`;

const ENDED_AUCTION_LISTITEMS = `
{
  listItems (where: { listType: false, expireTimestamp_lte: $time }, orderBy: expireTimestamp, orderDirection: asc){
    id
    nftContract
    contractType
    seller
    tokenId
    amount
    price
    paymentToken
    listType
    expireTimestamp
  }
}
`;

const OWNED_LISTITEMS = `
{
  listItems (where: { seller: $address }){
    id
    nftContract
    contractType
    tokenId
    seller
    amount
    price
    paymentToken
    listType
  }
}
`;

const COLLECTION_LISTITEMS = `
{
  listItems (where: { nftContract: $address }) {
    id
    nftContract
    contractType
    tokenId
    seller
    amount
    price
    paymentToken
    listType
  }
}
`;

const ITEM_QUERY = `
{
  listItems (where: { nftContract: $address, tokenId: $id }, first: 1) {
    id
    nftContract
    contractType
    tokenId
    seller
    amount
    price
    paymentToken
    listType
    expireTimestamp
  }
}
`;

const COLLECTIONS_QUERY = `
{
  collections (where: { totalVolume_gt: 0 }){
    id
    totalVolume
  }
}
`;

const COLLECTION_QUERY = `
{
  collections (where: { id: $address }) {
    id
    totalVolume
    lastSold
    lastSoldTime
    totalSale
  }
}
`;

const COLLECTION_FLOOR = `
{
  listItems(where: { nftContract: $address }, orderBy: price, orderDirection: asc, first: 1) {
    id
		price    
  }
}
`

const getQuery = (query, variables = null) => {
  if (variables) {
    let replacedQuery = query
    Object.keys(variables).forEach(key => {
      replacedQuery = replacedQuery.replaceAll(`$${key}`, `"${variables[key]}"`)
    });
    return replacedQuery
  } else {
    return query
  }
}

export {
  ALL_LISTITEMS,
  MARKETPLACE_LISTITEMS,
  OWNED_LISTITEMS,
  COLLECTION_LISTITEMS,
  ITEM_QUERY,
  AUCTION_LISTITEMS,
  ACTIVE_AUCTION_LISTITEMS,
  ENDED_AUCTION_LISTITEMS,
  COLLECTIONS_QUERY,
  COLLECTION_QUERY,
  COLLECTION_FLOOR,
  getQuery
}
