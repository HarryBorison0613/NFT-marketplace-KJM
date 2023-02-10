import React from 'react';
import { useParams } from 'react-router-dom';
import LiveMints from '../../../components/creators/LiveMints';

import Footer from '../../../components/footer/Footer';
import Header from '../../../components/header/Header';

import useDocumentTitle from '../../../components/useDocumentTitle';


const Marketplace = () => {
  useDocumentTitle(' Marketplace');
  const { collectionAddress } = useParams();
  return (
    <>
    <div style={{flexGrow: 1}}>
      <Header />
      <div className="row mb-50_reset mx-auto text-center" style={{
        width: "90%",
        minWidth: "365px",
        marginTop: "30px",
        marginBottom: "-50px",
        borderRadius: "30px"
      }}>
        <a href="https://ftmwatch.com" target="_blank">
                <img
                src="https://operahouse.mypinata.cloud/ipfs/QmbKH2zAEsi5A6fkd7sQZ66ekngwgKQZBkZxv5HzYqBZp6"
                style={{
                  borderRadius: "30px",
                  maxWidth: "90%"
                }}
                />
                </a>
            </div>
      <LiveMints/>
    </div>
    <Footer />
    </>
  );
};

export default Marketplace;
