import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import useCount from '../hooks/useCount';
import ImportModal from './ImportModal';

const CollectionRow = ({ collection }) => {
  const { address, name } = collection
  const { count, totalSupply, updateCount } = useCount(address)
  return (
    <TableRow
      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
    >
      <TableCell component="th" scope="row">
        {address}
      </TableCell>
      <TableCell component="th" scope="row">
        {name}
      </TableCell>
      <TableCell component="th" scope="row">
        {totalSupply}
      </TableCell>
      <TableCell align="right">{count}</TableCell>
      <TableCell align="right">
        <ImportModal collection={collection} updateCount={updateCount} />
      </TableCell>
    </TableRow>
  )
}

export default CollectionRow
