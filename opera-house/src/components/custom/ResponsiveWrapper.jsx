import React, { useState } from 'react';
import { styled } from '@material-ui/core';
import useMediaQuery from '@material-ui/core/useMediaQuery';

const MobileWrapper = styled('div')(() => ({
  position: 'sticky',
  top: 0,
  width: '100%',
  zIndex: 100,
  background: 'var(--background-color)',
  padding: 0
}))

const MobileToggler = styled('div')(() => ({
  fontSize: 30,
  position: 'absolute',
  right: 0,
  width: 40,
  height: 40,
  background: 'var(--background-color)',
  borderRadius: '50%',
  border: '1px solid var(--color-stroke) !important',
}))

const MobileCloser = styled('div')(() => ({
  fontSize: 30,
  position: 'absolute',
  right: 0,
  top: 0
}))

const MobileContainer = styled('div')(() => ({
  top: 78,
  bottom: 0,
  background: 'var(--background-color)',
  right: 0,
  zIndex: 10000,
  position: 'fixed',
  height: 'calc(100% - 78px)',
  overflowY: 'auto',
  overflowX: 'hidden',
  paddingTop: 30
}))

const ResponsiveWrapper = ({ children }) => {
  const [open, setOpen] = useState(false)
  const matches = useMediaQuery('(min-width:700px)');

  return (
    <>{
      matches ? (
        <>{children}</>
      ) : (
        <MobileWrapper>
          <MobileToggler onClick={() => setOpen(true)}>
            <i className="ri-filter-3-line"></i>
          </MobileToggler>
          { open && 
            <MobileContainer>
              <MobileCloser onClick={() => setOpen(false)}>
                <i className="ri-close-line"></i>
              </MobileCloser>
              {children}
            </MobileContainer>
          }
        </MobileWrapper>
      )
    }
    </>
  )
}

export default ResponsiveWrapper
