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
    title: 'Create',
    link: '/mint',
    target: '',
  },
  // {
  //   title: 'Encore',
  //   link: '/encore',
  //   target: '',
  // },
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
