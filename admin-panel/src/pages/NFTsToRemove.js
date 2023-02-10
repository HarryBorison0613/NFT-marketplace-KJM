import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import useList from '../hooks/useList'
import NFTRow from '../components/NFTRow';

export default function Collections() {
  const { nftsToRemove } = useList()

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Address</TableCell>
            <TableCell align="left">tokenId</TableCell>
            <TableCell align="left">price</TableCell>
            <TableCell align="left">seller</TableCell>
            <TableCell align="right">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {nftsToRemove?.map((nft) => (
            <NFTRow key={nft?.nftContract + '-' + nft?.tokenId} nft={nft} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
