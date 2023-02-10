import React, { useEffect, useState } from 'react';
import { styled } from '@material-ui/core';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles'
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';
import Button from '@material-ui/core/Button';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';

const FilterWrapper = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: 'auto',
  width: 'auto',
  '& > *': {
    minWidth: 150
  }
}))

const FilerItem = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center'
}))

const useStyles = makeStyles({
  list: {
    width: 300,
    padding: 20,
    // paddingTop: 90,
    textTransform: 'capitalize',
    fontSize: '10pt',
    lineHeight: '2',
    zIndex: 800
  },
  fullList: {
    width: 'auto',
    lineHeight: '1.5',
  },
});

const Filter = ({ traits, filterOptions, setFilterOptions }) => {
  const [open, setOpen] = React.useState(false)
  const [_filterOptions, _setFilterOptions] = React.useState()
  const [closedTypes, setClosedTypes] = useState([])
  const classes = useStyles()
  const toggleDrawer = (open) => (event) => {
    if (event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setOpen(open)
  };
  const handleClose = (type) => {
    if (closedTypes.includes(type)) {
      const newTypes = closedTypes.filter((item) => item !== type)
      setClosedTypes(newTypes)
    } else {
      setClosedTypes([...closedTypes, type])
    }
  }
  const handleChangeTrait = (type, value, checked) => {
    const options = []
    const filterOptions = _filterOptions.map((item) => {
      if (item.type !== type) return item
      const newItem = { ...item }
      const vItem = newItem.values.find((valueItem) => (valueItem.value === value));
      if (vItem) {
        vItem.isChecked = checked
      }
      return newItem
    })
    filterOptions.forEach(({ type, values }) => {
      values.forEach(({ value, isChecked }) => {
        if (isChecked) {
          options.push({
            type,
            value
          })
        }
      })
    })
    // _setFilterOptions([...filterOptions])
    if (options.length)
      setFilterOptions(options)
    else setFilterOptions(null)
  }

  useEffect(() => {
    if (traits) {
      const newFilterOptions = traits.map(({ type, values }) => {
        const filterValues = values.map((value) => {
          if (filterOptions && filterOptions.find((item) => (item.value === value && item.type === type))) {
            return { value, isChecked: true}
          } else {
            return { value, isChecked: false}
          }
        });
        return { type, values: filterValues }
      })
      _setFilterOptions(newFilterOptions)
    }
  }, [traits, filterOptions])

  const list = (anchor) => (
    <div
      role="presentation"
      className={clsx(classes.list, {
        [classes.fullList]: anchor === 'top' || anchor === 'bottom',
      })}
    >{ _filterOptions && _filterOptions.map(({ type, values }) => (
        <div key={type}>
          <div role='button' onClick={() => handleClose(type)}>
            <b>{type}</b>
            {(!closedTypes.includes(type)) ? <ExpandLess /> : <ExpandMore />}
          </div>
          {(!closedTypes.includes(type)) &&
          <div>{ values && values.map(({ value, isChecked }) => (
            <div style={{display: 'flex'}} key={`trait-${type}-${value}`}>
            <input
              type="checkbox"
              name={`trait-${type}-${value}`}
              id={`trait-${type}-${value}`}
              checked={isChecked}
              onChange={(e) => handleChangeTrait(type, value, e.target.checked)}
            />
            <label htmlFor={`trait-${type}-${value}`}>Toggle</label>
            <span className="ml-10">{value}</span>
            </div>
          ))
          }
          </div>
          }
        </div>
      ))}
    </div>
  );

  return (
    <FilterWrapper>
      <div
      className='btn btn-white'
      onClick={toggleDrawer(true)}
      style={{fontSize:"12pt", fontWeight: "600", fontSize: '12pt'}}
      >Trait Filter</div>
      <SwipeableDrawer
        anchor='right'
        open={open}
        onClose={toggleDrawer(false)}
        onOpen={toggleDrawer(true)}
      >
        {list('right')}
      </SwipeableDrawer>
    </FilterWrapper>
  )
}

export default Filter