import React from 'react';
import {Link} from 'react-router-dom';
import Footer from '../components/footer/Footer';
import Header from '../components/header/Header';
import useDocumentTitle from '../components/useDocumentTitle';

const NotFound = () => {
  useDocumentTitle(' Page Not Found ');
  return (
    <>
    <div style={{flexGrow: 1}}>
      <Header />
      <div className="not__found">
        <div className="container">
          <div className="row justify-content-center align-items-center pt-100">
            <div className="col-lg-6">
              <div className="space-y-30 content">
                <div
                  className="space-y-20 d-flex flex-column
                        justify-content-center align-items-center">
                  <img className="img" src={`img/bg/404.png`} alt="skull" />
                  <h2 className="text-center">Error 404! Page not found.</h2>
                  <p className="text-center">
                    We couldn't retrieve the content of the page you are trying
                    to access.
                  </p>
                  <div>
                    <Link to="/" className="btn btn-grad">
                      Go Back
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
    <Footer />
    </>
  );
};

export default NotFound;
