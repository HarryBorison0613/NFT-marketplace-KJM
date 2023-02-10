import { styled } from '@material-ui/core';
import React, { useState } from 'react';

const WrapperDiv = styled(`div`)(() => ({
  border: 'black solid 1px'
}))


const Selectable = ({ editable, children }) => {
  const [selected, setSelected] = useState(false)
  return (
    <React.Fragment>
    { editable ? (
      <WrapperDiv onClick={() => setSelected(!selected)}>
        {children}
      </WrapperDiv>) : (
        <>{children}</>
    )}
    </React.Fragment>
  )
}

export default Selectable
