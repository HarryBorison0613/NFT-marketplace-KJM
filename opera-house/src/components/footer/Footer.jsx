import React from 'react';
import {Link} from 'react-router-dom';

function Footer() {
  return (
    <div>
      <footer className="footer__1">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 space-y-20">
            <div className="headerLogo">
             <span><Link to="/home">
             <img
             className="headerLogo"
             id="logo_js"
             src="/img/logos/oh.png"
             alt="logo"
             style={{marginTop: "-10px"}}
             />
            </Link>
            <span style={{fontSize: "20px", fontWeight: "600"}}> Opera House<span style={{fontSize: "10pt"}}>™</span></span></span>

            </div>
              <p className="footer__text">
              <b>Opera House™</b> by Nova Network Inc.
              </p>
              <div>
              <ul className="footer__social space-x-10 mb-40">
              </ul>
              </div>
            </div>

            <div className="col-lg-2 col-6">
              <h6 className="footer__title">Social Media</h6>
              <ul className="footer__list">
              <li><p>
              <a href="https://twitter.com/FTMOperaHouse" target="_blank">Twitter</a>
              </p><p>
              <a href="https://discord.gg/novanetwork" target="_blank">Discord Server</a>
              </p><p>
              <a href="https://t.me/NovaChannelOfficial" target="_blank">Telegram Channel</a>
              </p></li>
              </ul>
            </div>

            <div className="col-lg-2 col-6">
              <h6 className="footer__title">For Users</h6>
              <ul className="footer__list">
              <li><p>
              <a href="/marketplace">Marketplace</a>
              </p><p>
              <a href="/auctions">Auctions</a>
              </p><p>
              <Link to="/collections">Collections</Link>
              </p><p>
              <Link to="/profile">My Profile</Link>
              </p><p>
              <Link to="/edit-profile">Edit Profile</Link>
              </p><p>
              </p></li>
              </ul>
            </div>

            <div className="col-lg-2 col-6">
              <h6 className="footer__title">For Creators</h6>
              <ul className="footer__list">
              <li><p>
              <a href="/mint">Create</a>
              </p><p>
              <a href="/submit-collection">Submit Collection</a>
              </p><p>
              <a href="/audit">Audit Request</a>
              </p><p>
              <a href="https://testnet.operahouse.online/" target="_blank">Testnet Marketplace</a>
              </p><p>
              <a href="https://docs.novafinance.me/corporate-solutions/marketing-packages#opera-house-tm-sponsored-collections" target="_blank">Sponsored</a>
              </p></li>
              </ul>
            </div>
          </div>
          <p className="copyright text-center">
            Opera House™ by <b><a href="https://novafinance.me" target="_blank">Nova Network Inc.</a></b> © 2022. All rights reserved.
          </p>
              <p className="disclaimer text-center">
              This platform is in Beta, and might present bugs and errors. Use it at your own risk.
              </p>
        </div>
      </footer>
    </div>
  );
}

export default Footer;
