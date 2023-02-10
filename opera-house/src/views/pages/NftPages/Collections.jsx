import React from 'react';
import Collection2 from '../../../components/collection/Collection2';
import Footer from '../../../components/footer/Footer';
import Header from '../../../components/header/Header';
import HeroCollections from '../../../components/hero/HeroCollections';
import useDocumentTitle from '../../../components/useDocumentTitle';

const Collections = () => {
  useDocumentTitle(' Collections');
  return (
    <>
    <div style={{flexGrow: 1}}>
      <Header />
      <HeroCollections />
      <div className="section mt-100">
        <div className="container">
          <Collection2 />
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
};

export default Collections;
