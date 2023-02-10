import React from 'react';
import Footer from '../../../components/footer/Footer';
import Header from '../../../components/header/Header';
import useDocumentTitle from '../../../components/useDocumentTitle';
import {Link} from 'react-router-dom';
import {ToastContainer, toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Contact = () => {
  const notify = () => toast.success('We have recieved your audit request.');

  useDocumentTitle(' Contact');
  return (
    <>
    <div style={{flexGrow: 1}}>
      <Header />
      <div className="requests">
      <iframe src="https://novanetwork.io/external/audit-request/" title="Submit Collection" height="1250px" width="100%">
      </iframe>
      </div>
      <Footer />
    </div>
    </>
  );
};

export default Contact;
