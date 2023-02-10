import React from 'react';
import PopularCreators from '../../components/creators/PopularCreators';
import useDocumentTitle from '../../components/useDocumentTitle';
import Footer from '../../components/footer/Footer';
import Header from '../../components/header/Header';
import Hero2 from '../../components/hero/Hero2';
import CardMarketplace from '../../components/cards/CardMarketplace'
import EditorsPick from '../../components/creators/EditorsPick';
import LiveMints from '../../components/creators/LiveMints';

const Home2 = () => {
  useDocumentTitle('Opera House™ | The Fantom Opera NFT Marketplace');
  return (
    <>
    <div style={{flexGrow: 1}}>
      <Header />
      <Hero2 />
      <PopularCreators />
      <EditorsPick />
    </div>
    <Footer />
    </>
  );
};

export default Home2;
