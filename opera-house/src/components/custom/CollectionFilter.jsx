import React from 'react';
import { styled } from '@material-ui/core';

const FilterWrapper = styled('div')(() => ({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'left',
  border: 'auto',
  '& > *': {
    margin: 10,
    width: 'auto',
    fontSize: '13px',
  }
}))

const FilerItem = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center'
}))

const Filter = ({options, setOptions}) => {
  const handleChange = (e) => {
    const fieldName = e.target.name
    const newOptions = {...options, [fieldName]: e.target.value }
    setOptions(newOptions)
    console.log(newOptions)
  }

  return (
    <FilterWrapper>
      <FilerItem>
        <select
          className="form-select custom-select"
          aria-label="collection category"
          name="category"
          onChange={handleChange}
        >
          <option disabled selected hidden>Select Category</option>
          <option value="">All</option>
          <option value="Art & Photography">Art & Photography</option>
          <option value="Collectibles">Collectibles</option>
          <option value="FNS">FNS (Fantom Name Server)</option>
          <option value="Games & Virtual Worlds">Games & Virtual Worlds</option>
          <option value="Memes">Memes</option>
          <option value="Music">Music</option>
          <option value="Trading Cards">Trading Cards</option>
        </select>
      </FilerItem>
    </FilterWrapper>
  )
}

export default Filter
