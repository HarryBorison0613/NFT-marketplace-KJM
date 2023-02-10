import React from 'react';
import {Link} from 'react-router-dom';

// Defines the dropdown menu items.

const LeftMenu = [

// Example on how to add a dropdown menu item:
// {
//    title: 'Submit Collection',
//    link: '/submit-collection',
// },

  {
    title: <b>Submit Collection</b>,
    link: '/submit-collection',
    target: '',
  },
  {
    title: <b>Audit Request</b>,
    link: '/audit',
    target: '',
  },
  {
    title: 'Sponsored',
    link: 'https://docs.operahouse.online/sponsored-content',
    target: '_blank',
  },
  {
    title: 'Documents',
    link: 'https://docs.operahouse.online/',
    target: '_blank',
  },
  {
    title: 'Token Swap',
    link: 'https://novaswap.me/swap',
    target: '_blank',
  },
  {
    title: 'Testnet Marketplace',
    link: 'https://testnet.operahouse.online/',
    target: '_blank',
  },
];

function MegaMenu() {
  return (
    <div>
      <div className="row">
        <div className="col-lg-6 space-y-10">
          {LeftMenu.map((val, i) => (
          <li key={i}>
          <a href={val.link} target={val.target}>
          <i className={`ri-${val.icon}-line`} />
          {val.title}
          </a>
          </li>
          ))}
        </div>

      </div>
    </div>
  );
}

export default MegaMenu;
