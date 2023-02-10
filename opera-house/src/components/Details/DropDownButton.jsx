import React, { useEffect, useRef, useState, useCallback } from 'react'
import { styled } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { Link } from 'react-router-dom';

const StyledMenu = styled(Menu)(() => ({
  '& .MuiList-root': {
    display: 'flex',
    flexDirection: 'column',
    padding: '0px 15px',
    background: 'var(--color-white)',
    boxShadow: '0px 17px 13px 0px #192c4b05',
    border: 'solid 1px var(--color-stroke)'
  }
}))

const StyledDiv = styled('div')(() => ({
  background: 'transparent !important',
  cursor: 'pointer',
  border: '1px solid transparent',
  '&:hover': {
    backgroundColor: 'var(--color-stroke)'
  }
}))

const DropdownButton = ({ title, children, anchorEl, setAnchorEl }) => {
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <StyledDiv
        aria-controls="customized-menu"
        aria-haspopup="true"
        variant="contained"
        color="primary"
        onClick={handleClick}
      >
        {title}
      </StyledDiv>
      <StyledMenu
        id="customized-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        { children }
      </StyledMenu>
    </>
  )
}

export default DropdownButton

