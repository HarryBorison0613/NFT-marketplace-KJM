import React, { useEffect, useState } from 'react';
import { styled, Slider, FormControlLabel } from '@material-ui/core';
import DropDownSelect from './DropDownSelect';
import ResponsiveWrapper from './ResponsiveWrapper';

const FilterWrapper = styled('div')(() => ({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  border: 'auto',
  '& > *': {
    margin: 10,
    maxWidth: 230,
    minWidth: 150,
    width: 'auto',
    fontSize: '13px',
  }
}))

const FilerItem = styled('span')(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  minWidth: 180
}))

function valuetext(value) {
  return `${value}FTM`;
}

const RelativeDiv = styled('div')(() => ({
  position: 'relative'
}))

const DropDownItem = styled('div')(() => ({
  cursor: 'pointer',
  // background: 'var(--color-white)',
  padding: 3,
  paddingLeft: 10,
  display: 'flex',
  alignItems: 'center',
  userSelect: 'none',
  color: 'var(--color-text)',
  '&:hover': {
    backgroundColor: 'var(--color-brand-light)'
  }
}))

const DropDownWrap = styled('div')(() => ({
  position: 'relative',
  display: 'inline-flex',
  cursor: 'pointer',
  userSelect: 'none',
  minWidth: 180
}))

const DropDownItemContainer = styled('div')(() => ({
  position: 'absolute',
  top: 'calc(100% + 2px)',
  left: 0,
  background: 'var(--color-white)',
  // border: 'solid 1px black',
  borderRadius: 5,
  // padding: 5,
  zIndex: 1000,
  maxHeight: 400,
  overflowY: 'auto'
}))

const ToggleFilter = ({ title, options, selectedOptions, setSelectedOptions }) => {
  const [open, setOpen] = useState(false)

  const handleChange = (e) => {
    if (e.target.name) {
      const arr = e.target.name.split('-')
      if (arr && arr.length - 1) {
        const address = arr[arr.length - 1]
        if (e.target.checked) {
          if (address === 'all') {
            setSelectedOptions(null)
            return
          }
          if (!selectedOptions || selectedOptions === 'all') {
            setSelectedOptions([address.toLowerCase()])
          } else {
            setSelectedOptions([...selectedOptions, address.toLowerCase()])
          }
        } else {
          if (address === 'all') {
            setSelectedOptions('none')
            return
          }
          if (!selectedOptions) {
            const allOptions = options.map(({ address }) => address.toLowerCase())
            const newOptions = allOptions?.filter((option) => (option !== address.toLowerCase()))
            setSelectedOptions(newOptions)
          } else {
            const newOptions = selectedOptions?.filter((option) => (option !== address.toLowerCase()))
            setSelectedOptions(newOptions)
          }
        }
      }
    }
  }

  const selected = (address) => {
    if (!selectedOptions) return true
    else {
      if (selectedOptions === 'none') return false
      if (selectedOptions?.includes(address.toLowerCase())) return true
      else return false
    }
  }

  return (
    <DropDownWrap
      className="form-select custom-select"
      tabindex="0"
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span style={{ color: 'var(--color-text)'}}>{title}</span>
      {(open && options) ? (
        <DropDownItemContainer>
        <DropDownItem style={{display: 'flex', whiteSpace: 'nowrap'}}>
            <input
              type="checkbox"
              name={`collection-all`}
              id={`collection-all`}
              checked={selectedOptions === 'none'? false : !selectedOptions}
              onChange={handleChange}
            />
            <label htmlFor={`collection-all`}>Toggle</label>
            <span className="ml-10">All</span>
          </DropDownItem>
        { options?.map(({name, address}, i) => (
          <DropDownItem style={{display: 'flex', whiteSpace: 'nowrap'}} key={`option-${address}`}>
            <input
              type="checkbox"
              name={`collection-${address}`}
              id={`collection-${address}`}
              checked={selected(address)}
              onChange={handleChange}
            />
            <label htmlFor={`collection-${address}`}>Toggle</label>
            <span className="ml-10">{name}</span>
          </DropDownItem>
        ))
        }
        </DropDownItemContainer>) :
        null
      }
    </DropDownWrap>
  )
}

const sortOptions = [
  {
    label: 'Sort Order',
    value: null,
    disabled: true,
    hidden: true,
    selected: true
  },
  {
    label: 'Name (A-Z)',
    value: 'A-Z',
  },
  {
    label: 'Name (Z-A)',
    value: 'Z-A',
  },
  {
    label: 'Price (High to Low)',
    value: 'high_price'
  },
  {
    label: 'Price (Low to High)',
    value: 'low_price'
  },
  {
    label: 'Rarity (High to Low)',
    value: 'most_rare'
  },
  {
    label: 'Rarity (Low to High)',
    value: 'least_rare'
  },
  {
    label: 'Date (Ending Soon)',
    value: 'ending_soon'
  },
  {
    label: 'Date (Just Started)',
    value: 'ending_latest'
  },
]

const categories = [
  {
    label: 'Category',
    value: null
  }, {
    label: 'All',
    value: ''
  }, {
    label: 'Art & Photography',
    value: 'Art & Photography'
  }, {
    label: 'Collectibles',
    value: 'Collectibles'
  }, {
    label: 'FNS (Fantom Name Server)',
    value: 'FNS'
  }, {
    label: 'Games & Virtual Worlds',
    value: 'Games & Virtual Worlds'
  }, {
    label: 'Memes',
    value: 'Memes'
  }, {
    label: 'Music',
    value: 'Music'
  }, {
    label: 'Trading Cards',
    value: 'Trading Cards'
  }
]

const Filter = ({options, setOptions, isCollection, isMarketplace, showRarity, collections, isAuction }) => {
  const { name, sort, isOnSale, minPrice, maxPrice, rarity, collection } = options;
  const handleChange = (e) => {
    const fieldName = e.target.name
    const newOptions = {...options, [fieldName]: e.target.value }
    setOptions(newOptions)
  }

  const handleChangeSort = (value) => {
    const newOptions = {...options, sort: value }
    setOptions(newOptions)
  }

  const handleChangeCategory = (value) => {
    const newOptions = {...options, category: value }
    setOptions(newOptions)
  }

  const handleChangeSale = (e) => {
    const newOptions = {...options, isOnSale: e.target.checked }
    if (!e.target.checked) {
      newOptions.minPrice = null
      newOptions.maxPrice = null
    }
    setOptions(newOptions)
  }

  const setSelectedCollections = (collections) => {
    if (collections) setOptions({...options, collection: collections})
    else setOptions({ ...options, collection: null })
  }

  return (
    <ResponsiveWrapper>
    <FilterWrapper>
    {/* !START NFT Search bar. */}
      <FilerItem>
        <input
          type="text"
          name='name'
          value={name}
          className="form-control"
          placeholder="Search by NFT name..."
          onChange={handleChange}
        />
      </FilerItem>
      <FilerItem>
        <DropDownSelect onChange={handleChangeSort} options={isAuction ? sortOptions : sortOptions.slice(0, 7)} />
      </FilerItem>

      {/* !FINISH NFT Search */}
      {/* !START Toggle to display only items for sale.*/}
      { !isMarketplace &&
      <FilerItem>
        <input
          type="checkbox"
          id="sale-switch"
          name='isOnSale'
          checked={isOnSale}
          onChange={handleChangeSale}
        />
        <label htmlFor="sale-switch">Toggle</label>
        <span className="ml-10 text-center">For Sale</span>
      </FilerItem>

      }
      {/* !FINISH Toggle */}
      {/* !START Rarity Score dropdown menu. */}
      { (isCollection) ? (
        showRarity &&
          <FilerItem>
            <select
              className="form-select custom-select"
              aria-label="rarity score"
              name="rarity"
              onChange={handleChange}
            >
              <option disabled selected value={null} hidden>Rarity Score</option>
              <option value="">All</option>
              <option value={[0, 6]}>0%-5%</option>
              <option value={[6, 11]}>6%-10%</option>
              <option value={[11, 21]}>11%-20%</option>
              <option value={[21, 51]}>21%-50%</option>
              <option value={[51, 100]}>51%-100%</option>
            </select>
          </FilerItem>
          // {/* !FINISH Rarity Score */}
        ) :
        (
          <>
            <FilerItem>
              <DropDownSelect onChange={handleChangeCategory} options={categories} />
            </FilerItem>
            <FilerItem>
              <ToggleFilter
                title={'Collection'}
                aria-label="sort"
                name="sort"
                options={collections}
                selectedOptions={collection}
                setSelectedOptions={setSelectedCollections}
              >
              </ToggleFilter>
            </FilerItem>
            {/* <FilerItem>
              <select
                className="form-select custom-select"
                aria-label="collections"
                name="collection"
                onChange={handleChange}
              >
                <option disabled selected hidden>Collection</option>
                <option value="">All</option>
                { collections && collections.map(({ name, address }) => (
                  <option key={address} value={address}>{name}</option>
                ))}
              </select>
            </FilerItem> */}
          </>
      )}
      { (isOnSale || isMarketplace) && (
        <>
          <FilerItem>
            <input
              type="number"
              min={0}
              name='minPrice'
              value={minPrice}
              className="form-control mr-3"
              placeholder="Min. Price"
              onChange={handleChange}
            />
            <input
              type="number"
              min={0}
              name='maxPrice'
              value={maxPrice}
              className="form-control"
              placeholder="Max. Price"
              onChange={handleChange}
            />
          </FilerItem>
        </>
      )
      }
    </FilterWrapper>
    </ResponsiveWrapper>
  )
}

export default Filter
