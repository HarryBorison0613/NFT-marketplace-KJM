import React, { useState } from 'react';
import { styled } from '@material-ui/core';
import {Tab, Tabs, TabList, TabPanel} from 'react-tabs';
import HeroAuctions from '../../../components/hero/HeroAuctions';
import Header from '../../../components/header/Header';
import Footer from '../../../components/footer/Footer';
import useDocumentTitle from '../../../components/useDocumentTitle';
import CardActiveAuctions from '../../../components/cards/auction/CardActiveAuctions';
import CardAuctions from '../../../components/cards/auction/CardAuctions';
import CardEndedAuctions from '../../../components/cards/auction/CardEndedAuctions';

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

const LiveAuctions = () => {
  useDocumentTitle(' Live Auctions ');
  const [tabIndex, setTabIndex] = useState(0)

  return (
    <>
      <div style={{flexGrow: 1}}>
      <Header />
        <Tabs selectedIndex={tabIndex} onSelect={index => setTabIndex(index)}>
          <CustomTabList className="d-flex container justify-content-center mt-5 space-x-10 mb-30 nav-tabs">
          <CustomTab active={tabIndex === 0}>
                All Auctions
            </CustomTab>
            <CustomTab active={tabIndex === 0}>
                Active Auctions
            </CustomTab>
            <CustomTab active={tabIndex === 0}>
                Expired Auctions
            </CustomTab>
          </CustomTabList>
          <TabPanel>
            <div className="container">
              <div className="section">
                  <div>
                    <div>
                      <div className="d-flex align-items-center justify-content-center">
                        <div className="row justify-content-between align-items-center section__head">
                          <CardAuctions />
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>
          <TabPanel>
            <div className="container">
              <div className="section">
                  <div>
                    <div>
                      <div className="d-flex align-items-center justify-content-center">
                        <div className="row justify-content-between align-items-center section__head">
                          <CardActiveAuctions />
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>
          <TabPanel>
            <div className="container">
              <div className="section">
                  <div>
                    <div>
                      <div className="d-flex align-items-center justify-content-center">
                        <div className="row justify-content-between align-items-center section__head">
                          <CardEndedAuctions />
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>
        </Tabs>
      </div>
      <Footer />
    </>
  );
};

export default LiveAuctions;
