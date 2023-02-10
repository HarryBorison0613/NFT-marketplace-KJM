import React, { useState } from 'react';
import {Link} from 'react-router-dom';
import {Tab, Tabs, TabList, TabPanel} from 'react-tabs';
import CardProfileOwned from '../../../components/cards/CardProfileOwned';
import CardProfileLike from '../../../components/cards/CardProfileLike';
import FollowUsers from '../../../components/users/FollowUsers';
import FollowerUsers from '../../../components/users/FollowerUsers';
import { styled } from '@material-ui/core';

const CustomTab = styled(Tab)(() => ({
  padding: '5px 20px',
  cursor: 'pointer',
  position: 'relative',
  '&.react-tabs__tab--selected': {
    '&::after' : {
      transition: 'background-color .4s ease 0s',
      backgroundColor: 'var(--color-info)',
      bottom: 0,
      content: '""',
      display: 'block',
      height: 1,
      left: 0,
      position: 'absolute',
      width: '100%',
    }
  }
}))

const CustomTabList = styled(TabList)(() => ({
  width: 'fit-content',
  // borderBottom: '1px solid var(--color-light) !important',
}))

function MenuProfile(props) {
  const [tabIndex, setTabIndex] = useState(0)
  return (
    <div className="w-100">
      <Tabs selectedIndex={tabIndex} onSelect={index => setTabIndex(index)}>
        <CustomTabList className="d-flex container justify-content-center mt-5 space-x-0 mb-30 nav-tabs" style={{
          fontSize: "10pt"
        }}>
          <CustomTab active={tabIndex === 0}>
              Owned
          </CustomTab>
          <CustomTab active={tabIndex === 1}>
              Liked
          </CustomTab>
          <CustomTab active={tabIndex === 2}>
              Following
          </CustomTab>
          <CustomTab active={tabIndex === 3}>
              Followers
          </CustomTab>
        </CustomTabList>
        <TabPanel>
        <div className="container">
          <div className="w-100 section">
              <div className='w-100'>
                <div className='w-100'>
                  <div className="w-100 d-flex align-items-center justify-content-center">
                    <div className="w-100 row justify-content-between align-items-center section__head">
                      <CardProfileOwned {...props} />
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </TabPanel>
        <TabPanel>
        <div className="container">
          <div className="w-100 section">
              <div className='w-100'>
                <div className='w-100'>
                  <div className="w-100 d-flex align-items-center justify-content-center">
                    <div className="w-100 row justify-content-between align-items-center section__head">
                      <CardProfileLike {...props} />
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </TabPanel>
        <TabPanel>
        <div className="container">
          <div className="section mt-100">
              <div>
                <div>
                  <div className="d-flex align-items-center justify-content-center">
                    <div className="row justify-content-between align-items-center section__head">
                      <FollowUsers {...props} />
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </TabPanel>
        <TabPanel>
        <div className="container">
          <div className="section mt-100">
              <div>
                <div>
                  <div className="d-flex align-items-center justify-content-center">
                    <div className="row justify-content-between align-items-center section__head">
                      <FollowerUsers {...props} />
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </TabPanel>
      </Tabs>
    </div>
  );
}
export default MenuProfile;
