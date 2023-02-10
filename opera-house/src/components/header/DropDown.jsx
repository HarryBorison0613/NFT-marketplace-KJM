import React, { useEffect, useRef, useState } from 'react'
import { styled } from '@material-ui/core';
import { Input } from 'semantic-ui-react';

const DropdownWrap = styled('div')(() => ({
  display: 'flex',
  position: 'relative',
  userSelect: 'none'
}))

const DropdownItems = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  position: 'absolute',
  top: '100%',
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
  userSelect: 'none',
  '&:hover': {
    backgroundColor: 'var(--color-brand-light)',
  }
}))

const StyledInput = styled('input')(() => ({
  padding: 10,
  width: '100%',
  height: '100%',
  background: 'transparent !important',
  border: 'none !important',
  color: 'var(--color-black)',
}))

const Dropdown = ({ placeholder, value, setValue, options, onEnter }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef()
  const handleClickItem = (option) => {
    onEnter(option.value, option.type)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onEnter(value)
    }
  }

  useEffect(() => {
    let _defined = false

    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false)
      }
    }
    // Bind the event listener
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      _defined = true
    }
    return () => {
        // Unbind the event listener on clean up
        if (_defined) document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, open])

  return (
    <DropdownWrap
      ref={ref}
      onFocus={()=> setOpen(true)}
    >
      <StyledInput
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
      ></StyledInput>
      {(open && options) && 
        <DropdownItems onBlur={()=> {console.log('blur'); setOpen(false)}}>
        { options.map((option) => (
          <DropDownItem onClick={() => handleClickItem(option)}>{option.label}</DropDownItem>
        ))
        }
        </DropdownItems>
      }
    </DropdownWrap>
  )
}

export default Dropdown

