import React from 'react';
import { useParams } from 'react-router-dom';

import Footer from '../../../components/footer/Footer';
import Header from '../../../components/header/Header';
import HeroMarketplace from '../../../components/hero/HeroMarketplace';

import useDocumentTitle from '../../../components/useDocumentTitle';
import MenuLastSold from '../elements/MenuLastSold';

const LastSold = () => {
  useDocumentTitle('Last Sold');
  return (
    <>
    <div style={{flexGrow: 1}}>
      <Header />
      <HeroMarketplace />
      <div className="d-flex justify-content-center">
        <MenuLastSold />
      </div>
    </div>
    <Footer />
    </>
  );
};

export default LastSold;
