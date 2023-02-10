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
    title: 'Marketplace',
    link: '/marketplace',
  },
  {
    title: 'Browse Collections',
    link: '/collections',
  },
  // {
  //   title: 'Arts & Photography',
  //   link: '#',
  // },
  // {
  //   title: 'Collectibles',
  //   link: '#',
  // },
  // {
  //   title: 'Domain Names',
  //   link: '#',
  // },
  // {
  //   title: 'Music',
  //   link: '#',
  // },
  // {
  //   title: 'Sports',
  //   link: '#',
  // },
  // {
  //   title: 'Trading Cards',
  //   link: '#',
  // },
  // {
  //   title: 'Virtual Worlds',
  //   link: '#',
  // },

];

function MegaMenu() {
  const handleMenuItemClick = (e, link) => {
    e.preventDefault();
    window.location.href = link;
  }

  return (
    <div>
      <div className="row sub_menu_row">
        <div className="col-lg-6 space-y-10">
          {LeftMenu.map((val, i) => (
          <li key={i}>
          <Link to={val.link} onClick={(e) => handleMenuItemClick(e, val.link)}>
            <i className={`ri-${val.icon}-line`} />
          {val.title}
          </Link>
          </li>
          ))}
        </div>

      </div>
    </div>
  );
}

export default MegaMenu;