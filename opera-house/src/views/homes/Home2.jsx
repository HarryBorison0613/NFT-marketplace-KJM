import React from 'react';
import PopularCreators from '../../components/creators/PopularCreators';
import useDocumentTitle from '../../components/useDocumentTitle';
import Footer from '../../components/footer/Footer';
import Header from '../../components/header/Header';
import Hero2 from '../../components/hero/Hero2';

const Home2 = () => {
  useDocumentTitle('Opera House™ | The Fantom Opera NFT Marketplace');
  return (
    <div>
      <Header />
      <Hero2 />
      <PopularCreators />
      <Footer />
    </div>
  );
};

export default Home2;
