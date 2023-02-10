import * as React from 'react';
import Web3 from 'web3';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { useMoralis } from 'react-moralis';
import { marketplaceABI } from '../constant/abi';
import config from '../config'
import WalletContext from '../context/WalletContext';

const marketplaceAddress = config.marketplaceAddress

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 500,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

export default function RemoveModal({ nft, updateCount }) {
  const { nftContract, tokenId, amount } = nft
  const { walletAddress } = React.useContext(WalletContext)
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const { web3, isWeb3Enabled, isInitialized } = useMoralis()

  const getContractInstance = React.useCallback(async (contractABI, contractAddress) => {
    if (isWeb3Enabled && isInitialized && web3) {
        let contract = new web3.eth.Contract(contractABI, contractAddress);
        return contract;
    }
    else {
      const web3 = new Web3(new Web3.providers.HttpProvider('https://rpc.ftm.tools/'));
      const contract = new web3.eth.Contract(contractABI, contractAddress);
      return contract;
    }
  }, [isInitialized, isWeb3Enabled, web3])

  const handleRemove = async () => {
    try {
      const instance = await getContractInstance(marketplaceABI, marketplaceAddress)
      const removeFunc = instance.methods.delistToken(nftContract, tokenId, amount)
      const estimateResult = await removeFunc.estimateGas(
        {
            from: walletAddress,
        }
      )
      .then(() => true)
      .catch((err) => {
        console.log(err)
        return false
      })
      if (estimateResult)
        removeFunc.send({ from: walletAddress })
        .then(() => {
          console.log('success')
        })
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <div>
      <Button onClick={handleOpen}>Open modal</Button>
      <Modal
        open={open}
        onClose={handleClose}
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Remove from list
          </Typography>
          <div>
            {nftContract}&nbsp;&nbsp;&nbsp;{tokenId}
          </div>
          <div style={{display: 'flex', justifyContent: 'flex-end', margin: 10}}>
            <Button
              variant="contained"
              onClick={handleRemove}
            >Remove</Button>
          </div>
        </Box>
      </Modal>
    </div>
  );
}
