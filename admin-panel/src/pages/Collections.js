import * as React from 'react';
import { useMoralis } from "react-moralis"
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import useCollections from '../hooks/useCollections';
import CollectionRow from '../components/CollectionRow';

const tokens = [
  {
    address: "0x0000000000000000000000000000000000000000",
  }, 
  {
    address: "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83",
  },
  {
    address: "0x69D17C151EF62421ec338a0c92ca1c1202A427EC",
  }, 
  {
    address: "0x90E892FED501ae00596448aECF998C88816e5C0F",
  }, 
  {
    address: "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75",
  }, 
  {
    address: "0x049d68029688eabf473097a2fc38ef61633a3c7a",
  }, 
  {
    address: "0x321162Cd933E2Be498Cd2267a90534A804051b11",
  }, 
  {
    address: "0x74b23882a30290451A17c44f4F05243b6b58C76d",
  },
  {
    address: "0x5cc61a78f164885776aa610fb0fe1257df78e59b",
  }, 
  {
    address: "0x841fad6eae12c286d1fd18d1d525dffa75c7effe",
  },{
    address: '0x20AC818b34A60117E12ffF5bE6AbbEF68BF32F6d'
  }
]
export default function Collections() {
  const { collections } = useCollections()
  const { Moralis } = useMoralis()

  const handleUpdatePrices = () => {
    Moralis.Cloud.run("updateTokenPrice", {
      tokens
    })
    const options = {
      address: "0x20AC818b34A60117E12ffF5bE6AbbEF68BF32F6d",
      chain: "0xfa",
    };
    const price = Moralis.Web3API.token.getTokenPrice(options);
    console.log(price)
  }

  return (
    <>
    <Button onClick={() => handleUpdatePrices()} variant="contained" style={{ float: 'right'}}>
      Update Token Prices
    </Button>
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Address</TableCell>
            <TableCell align="left">name</TableCell>
            <TableCell align="right">count</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {collections.map((collection) => (
            <CollectionRow key={collection?.address} collection={collection} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
    </>
  );
}
