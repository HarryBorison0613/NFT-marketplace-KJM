import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import RemoveModal from './RemoveModal'

const CollectionRow = ({ nft }) => {
  const { nftContract, tokenId, price, seller } = nft
  return (
    <TableRow
      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
    >
      <TableCell component="th" scope="row">
        {nftContract}
      </TableCell>
      <TableCell component="th" scope="row">
        {tokenId}
      </TableCell>
      <TableCell component="th" scope="row">
        {price}
      </TableCell>
      <TableCell component="th" scope="row">
        {seller}
      </TableCell>
      <TableCell align="right">
        <RemoveModal nft={nft} />
      </TableCell>
    </TableRow>
  )
}

export default CollectionRow
