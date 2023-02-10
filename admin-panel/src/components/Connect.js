import { useContext, useEffect, useState } from "react";
import { useMoralis } from "react-moralis"
import 'reactjs-popup/dist/index.css';
import WalletContext from "../context/WalletContext";
import { styled } from '@mui/material';
import Button from '@mui/material/Button';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';

const StyledDiv = styled('div')(() => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'column'
}))

const getAbbrWalletAddress = (walletAddress) => {
  let abbrWalletAddress = walletAddress.substring(0, 4) + "..." + walletAddress.substring(38, 42);
  return abbrWalletAddress.toUpperCase();
}

function ConnectDialog(props) {
  const { onClose, selectedValue, open } = props;

  const handleClose = () => {
    onClose(selectedValue);
  };

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle>Connect wallet</DialogTitle>
      {props.children}
    </Dialog>
  );
}

const Connect = () => {
  const { walletAddress, setWalletAddress } = useContext(WalletContext)
  const { isInitialized, isAuthenticated, auth, account, authenticate, logout } = useMoralis()
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const connectMetamask = async () => {
    if (!isAuthenticated) {
      await authenticate({ signingMessage: "Welcome to Opera House!" })
    }
  }

  useEffect(() => {
    if (account && isInitialized) {
      setWalletAddress(account)
    }
  }, [account, setWalletAddress, isInitialized])


  return (
    <>
      <Button variant="outlined" onClick={handleClickOpen}
      >{(isAuthenticated) ? (
        <>
          <i className="btn-connect" />
          { walletAddress ? getAbbrWalletAddress(walletAddress) :'Authenticating...' }
        </>
        ) : (
          <>
            <i className="btn-connect" />
            Connect Wallet
          </>
        )
      }
      </Button>
      <ConnectDialog
        open={open}
        onClose={handleClose}
      >
        <StyledDiv>
          <div>
          { (auth.state === 'authenticating') ? (
            <div>Authenticating...</div>
          ) : (
            <div className="space-y-20">
            { isAuthenticated ? (
              <>
                <div className="text-center"><b>Wallet Address</b></div>
                <div className="text-center" style={{fontSize:"9pt"}}>{walletAddress}</div>
                <Button onClick={() => logout()}>
                  Logout
                </Button>
              </>
            ) : (
              <Button onClick={() => connectMetamask()}>
                <StyledDiv>
                  <img
                    src="/img/logos/mm.png"
                    width={40}
                    alt="logo_community"
                  />
                  <h5 className="text-center">&nbsp;MetaMask</h5>
                  <p className="text-center">Web3 browser extension.</p>
                </StyledDiv>
              </Button>
              )}
            </div>
          )
          }
          </div>
        </StyledDiv>
      </ConnectDialog>
    </>
  )
}

export default Connect
