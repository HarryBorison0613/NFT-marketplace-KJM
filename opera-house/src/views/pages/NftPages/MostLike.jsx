import React from 'react';
import { useParams } from 'react-router-dom';

import Footer from '../../../components/footer/Footer';
import Header from '../../../components/header/Header';
import HeroMarketplace from '../../../components/hero/HeroMarketplace';

import useDocumentTitle from '../../../components/useDocumentTitle';
import MenuMostLike from '../elements/MenuMostLike';

const Marketplace = () => {
  useDocumentTitle(' Marketplace');
  const { collectionAddress } = useParams();
  return (
    <>
    <div style={{flexGrow: 1}}>
      <Header />
      <HeroMarketplace />
      <div className="d-flex justify-content-center">
        <MenuMostLike collectionAddress={collectionAddress}/>
      </div>
    </div>
    <Footer />
    </>
  );
};

export default Marketplace;
