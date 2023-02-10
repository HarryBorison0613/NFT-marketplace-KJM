import React, { useEffect, useRef, useState, useCallback } from 'react'
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
  zIndex: 100,
  top: '100%',
  maxHeight: 200,
  overflowY: 'auto',
  overflowX: 'hidden',
  borderRadius: 10,
  background: 'var(--color-white) !important',
  width: '100%',
  transition: 'all cubic-bezier(0.4, 0, 0.2, 1) 0.4s'
}))

const DropDownItem = styled('div')(() => ({
  cursor: 'pointer',
  background: 'var(--color-white)',
  padding: 3,
  paddingLeft: 10,
  display: 'flex',
  alignItems: 'center',
  userSelect: 'none',
  '&:hover': {
    backgroundColor: 'var(--color-brand-light)'
  }
}))

const StyledDiv = styled('div')(() => ({
  width: '100%',
  height: '100%',
  background: 'transparent !important',
  border: '1px solid transparent',
  '&:focus': {
    border: '1px solid var(--color-stroke) !important',
  },
  borderRadius: 10,
  padding: 15,
  lineHeight: 1.5,
  color: 'var(--color-black)',
  cursor: 'pointer',
  transition: 'all cubic-bezier(0.4, 0, 0.2, 1) 0.4s',
  paddingRight: 5,
  display: 'flex',
  alignItems: 'center'
}))

const DropdownSelect = ({ item, setItem, options }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef()
  const handleClickItem = useCallback((option) => {
    setItem(option)
    setOpen(false)
    ref.current.blur()
  }, [setItem])

  const handleClickOutside = (event) => {
    if (ref.current && !ref.current.contains(event.target)) {
      alert("You clicked outside of me!");
    }
  }

  useEffect(() => {
    let _defined = false
    // Bind the event listener
    if (open) {
      function handleClickOutside(event) {
        if (ref.current && !ref.current.contains(event.target)) {
          setOpen(false)
        }
      }
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
      tabIndex="-1"
      onClick={()=> {
        setOpen(!open)
      }}
    >
      <StyledDiv tabIndex="-1">
        { item &&
          <>
            <img src={item.logoURI} alt="payment logo" width='20' height='20' className='mr-2 ml-2' />
            <span>{item.symbol}</span>
          </>
        }
      </StyledDiv>
      {(open && options) && 
        <DropdownItems onBlur={()=> {console.log('blur'); setOpen(false)}}>
        { options.map((option) => (
          <DropDownItem onClick={() => handleClickItem(option)}>
            <img src={option.logoURI} alt="payment logo" width='20' height='20' className='mr-2 ml-2'  />
            {option.symbol}
          </DropDownItem>
        ))
        }
        </DropdownItems>
      }
    </DropdownWrap>
  )
}

export default DropdownSelect

