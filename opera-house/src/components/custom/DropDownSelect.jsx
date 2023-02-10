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
  border: '1px solid var(--color-stroke)',
  background: 'var(--color-white) !important',
  minWidth: '100%',
  transition: 'all cubic-bezier(0.4, 0, 0.2, 1) 0.4s'
}))

const DropDownItem = styled('div')(() => ({
  cursor: 'pointer',
  background: 'var(--color-white)',
  padding: 10,
  display: 'flex',
  alignItems: 'center',
  userSelect: 'none',
  whiteSpace: 'nowrap',
  '&:hover': {
    backgroundColor: 'var(--color-brand-light)'
  }
}))

const StyledDiv = styled('div')(() => ({
  width: '100%',
  height: '100%',
  background: 'var(--color-white) !important',
  border: '1px solid transparent',
  '&:focus': {
    border: '1px solid var(--color-stroke) !important',
  },
  borderRadius: 10,
  padding: 15,
  minWidth: 180,
  lineHeight: 1.5,
  color: 'var(--color-text)',
  cursor: 'pointer',
  transition: 'all cubic-bezier(0.4, 0, 0.2, 1) 0.4s',
  display: 'flex',
  alignItems: 'center',
  
}))

const DropDownSelect = ({ value, onChange, options }) => {
  const [item, setItem] = useState(options[0])
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

  useEffect(() => {
    if (item) {
      onChange(item.value)
    }
  }, [item])

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
            <span>{item.label}</span>
          </>
        }
      </StyledDiv>
      {(open && options) && 
        <DropdownItems onBlur={()=> {setOpen(false)}}>
        { options.slice(1).map((option) => (
          <DropDownItem onClick={() => handleClickItem(option)}>
            {option.label}
          </DropDownItem>
        ))
        }
        </DropdownItems>
      }
    </DropdownWrap>
  )

}

export default DropDownSelect
