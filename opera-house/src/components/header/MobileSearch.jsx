import React, { useEffect, useRef, useState } from 'react'
import { styled } from '@material-ui/core';
import { Input } from 'semantic-ui-react';

const DropdownWrap = styled('div')(() => ({
  position: 'fixed',
  background: 'var(--color-white)',
  top: '0px !important',
  left: 0,
  right: 0,
  bottom: 0,
  height: '100vh',
  zIndex: 1000000
}))

const StyledIcon = styled('div')(() => ({
  display: 'flex',
  cursor: 'pointer',
  margin: '0 10px'
}))

const SearchHeader = styled('div')(() => ({
  display: 'flex',
  justifyContent: 'space-between',
  borderBottom: '0.5px solid var(--color-stroke)',
}))


const DropdownItems = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  maxHeight: 200,
  overflowY: 'auto',
  overflowX: 'hidden',
  borderRadius: 10,
  background: 'white',
  width: '100%',
  border: '1px solid var(--color-stroke)',
  backgroundColor: 'var(--background-color)',
  '&:hover': {
    color: 'var(--text-color)'
  }
}))

const DropDownItem = styled('div')(() => ({
  cursor: 'pointer',
  color: 'var(--text-color)',
  background: 'var(--color-white)',
  padding: 3,
  paddingLeft: 10,
  borderBottom: '0.5px solid var(--color-stroke)',
  userSelect: 'none',
  '&:hover': {
    backgroundColor: 'var(--color-brand-light)',
  }
}))

const StyledInput = styled('input')(() => ({
  padding: 20,
  width: '100%',
  background: 'transparent !important',
  border: 'none !important',
  color: 'var(--color-black)',
}))

const MobileSearch = ({ placeholder, value, setValue, options, onEnter }) => {
  const [open, setOpen] = useState(false)
  const handleClickItem = (option) => {
    onEnter(option.value, option.type)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onEnter(value)
    }
  }

  return (
    <>
      <StyledIcon onClick={() => setOpen(true)}><i class="ri-search-line txt_lg"></i></StyledIcon>
      {open && <DropdownWrap>
        <SearchHeader>
          <StyledInput
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
          ></StyledInput>
          <i class="ri-close-line txt_lg p-2" onClick={() => setOpen(false)}></i>
        </SearchHeader>
        {(options) && 
          <DropdownItems>
          { options.map((option) => (
            <DropDownItem onClick={() => handleClickItem(option)}>{option.label}</DropDownItem>
          ))
          }
          </DropdownItems>
        }
      </DropdownWrap>
      }
    </>
  )
}

export default MobileSearch

