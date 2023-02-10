const ALL_LISTITEMS = `
{
  listItems (first: 500) {
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
  listItems (first: 500, where: { listType: true }){
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
  listItems (first: 500, where: { listType: false }, orderBy: expireTimestamp, orderDirection: asc){
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

const LAST_SOLD = `
{
  histories(first: 56, orderBy: time, orderDirection: desc) {
    id
    nftContract
    contractType
    tokenId
    price
    paymentToken
  }
}
`;


const ACTIVE_AUCTION_LISTITEMS = `
{
  listItems (first: 500, where: { listType: false, expireTimestamp_gt: $time }, orderBy: expireTimestamp, orderDirection: asc){
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
  listItems (first: 500, where: { listType: false, expireTimestamp_lte: $time }, orderBy: expireTimestamp, orderDirection: asc){
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
  listItems (first: 500, where: { seller: $address }){
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
  listItems (first: 500, where: { nftContract: $address }) {
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
  collections (first: 500, where: { totalSale_gt: 0 }){
    id
    totalSale
  }
}
`;

const VOLUMES_QUERY = `
{
  volumes (first: 500, where: { volume_gt: 0 }){
    id
    volume
    nftContract
    paymentToken
  }
}
`;

const COLLECTION_QUERY = `
{
  collections (where: { id: $address }) {
    id
    lastSold
    lastSoldPaymentToken
    lastSoldTime
    totalSale
  }
  volumes (where: { volume_gt: 0, nftContract: $address }){
    id
    volume
    nftContract
    paymentToken
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
  VOLUMES_QUERY,
  LAST_SOLD,
  getQuery
}
