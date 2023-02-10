import Connect from "./Connect"
import { styled } from '@mui/material'
const StyledHeader = styled('header')(() => ({
  display: 'flex',
  justifyContent: 'space-between',
  backgroundColor: '#282c34',
  fontSize: 'calc(10px + 2vmin)',
  color: 'white',
}))

const Header = () => {
  return (
    <StyledHeader>
      Browse Collections
      <Connect />
    </StyledHeader>
  )
}

export default Header
