import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import TextField from '@mui/material/TextField';
import { calculateRarity, deleteNFTData, saveCollectionData } from '../apis/nft';
import { Slider } from '@mui/material';
import config from '../config'

const defaultCollectionAddress = config.defaultCollectionAddress

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

export default function ImportModal({ collection, updateCount }) {
  const { address: collectionAddress, name, replacement, replacementPrefix, replacementSubfix, ipfsUri } = collection
  const [open, setOpen] = React.useState(false);
  const [status, setStatus] = React.useState()
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [startId, setStartId] = React.useState(0)
  const [endId, setEndId] = React.useState(0)
  const [intervalNum, setIntervalNum] = React.useState(100)
  const [percent, setPercent] = React.useState(0)

  const handleSave = async () => {
    if (status === 'pending') {
      return
    }
    setStatus('pending')
    if (Number(endId) >= Number(startId)) {
      let index = Number(startId)
      let to = index + Number(intervalNum) - 1
      if (to > Number(endId)) to = Number(endId)
      setPercent(0)

      while (to <= endId) {
        const address = collectionAddress?.toLowerCase() === defaultCollectionAddress ? 'default' : collectionAddress
        const result = await saveCollectionData(address, index, to, name, ipfsUri, replacement, replacementPrefix, replacementSubfix)
        updateCount()
        if (result === null) break
        index += Number(intervalNum)
        to += Number(intervalNum)
        if (to > Number(endId)) to = Number(endId)
        if (index > to) break
        setPercent(((Number(index) - Number(startId)) * 100) / (Number(endId) - Number(startId)))
      }
    }
    setStatus(null)
  }

  const handleRarity = async () => {
    if (status === 'pending') {
      return
    }
    setStatus('pending')
    await calculateRarity(collectionAddress)
    setStatus(null)
  }

  const handleDelete = async () => {
    setStatus('pending')
    await deleteNFTData(collectionAddress, startId, endId)
    updateCount()
    setStatus(null)
  }

  return (
    <div>
      <Button onClick={handleOpen}>Open modal</Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Import data to backend: {name}
          </Typography>
          { status === 'pending' &&
            <Slider
              aria-label="Percentage"
              defaultValue={0}
              valueLabelDisplay="auto"
              step={10}
              value={percent}
              marks
              min={0}
              max={100}
            />
          }
          <div>
            <TextField id="start-id" label="Start ID" variant="standard"
              type="number"
              value={startId}
              onChange={(e) => setStartId(e.target.value)}
            />
            <TextField id="end-id" label="End ID" variant="standard"
              type="number"
              value={endId}
              onChange={(e) => setEndId(e.target.value)}
            />
            <TextField id="interval" label="Interval" variant="standard"
              type="number"
              value={intervalNum}
              onChange={(e) => setIntervalNum(e.target.value)}
            />
          </div>
          <div style={{display: 'flex', justifyContent: 'flex-end', margin: 10}}>
            <Button
              variant="contained"
              onClick={handleSave}
            >Import</Button>
            <Button
              variant="contained"
              onClick={handleRarity}
            >Calculate Rarity</Button>
            <Button
              variant="contained"
              onClick={handleDelete}
            >Delete</Button>
          </div>
        </Box>
      </Modal>
    </div>
  );
}
