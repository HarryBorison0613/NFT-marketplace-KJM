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
    <div>
      <Header />
      <div className="contact">
        <div className="row">
          <div className="col-md-4 contact__img">
            <div className="img__wrap">
            <img src="img/logos/ohlarge.png" alt="Logo" style={{ width: "300px", height: "300px" }}/>
            </div>
          </div>
          <div className="col-md-8 contact__content">
            <div className="container">
              <div className="content__wrap space-y-20">
                <div className="space-y-20">
                  <h1 className="text-left">Hi, 🖐 we are OperaHouse.</h1>
                  <p className="contact__desc">
                    Welcome to our free auditing service.
                    <br /> We look forward to working with you!
                  </p>
                </div>
                <div className="box is__big">
                  <div className="space-y-10 mb-0">
                    <div className="row sm:space-y-20">
                      <div className="col-md-6 space-y-20">
                        <div className="space-y-10">
                          <span className="nameInput">Discord Name 
                          </span>
                          <input
                            type="email"
                            className="form-control"
                            placeholder="name#1234"
                          />
                        </div>
                        <div className="space-y-10">
                          <span className="nameInput">Select Audit Type</span>
                          <select
                            className="form-select
                                            custom-select"
                            aria-label="Default
                                            select example">
                            <option>Pre-Launch Audit</option>
                            <option>Post-Launch Audit</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6 space-y-20">
                        <div className="space-y-10">
                          <span className="nameInput">Collection Address</span>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="My Collection"
                          />
                        </div>
                        
                        <div className="space-y-10">
                          <span className="nameInput">Select Urgency</span>
                          <select
                            className="form-select
                                            custom-select"
                            aria-label="Default
                                            select example">
                            <option>5 Days</option>
                            <option>10 Days</option>
                            <option>15 Days</option>
                            <option>30 Days</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-12 mt-20">
                        <div className="space-y-10">
                          <span className="nameInput">Details</span>
                          <textarea 
                        style={{minHeight: 110}} 
                        className="mb-0" 
                        placeholder="Please give us any information that will help us with the audit."
                        />
                        </div>
                      </div>
                    </div>
                    <Link to="#" className="btn btn-primary" onClick={notify}>
                      Send your audit request
                    </Link>
                    <ToastContainer position="bottom-right" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
