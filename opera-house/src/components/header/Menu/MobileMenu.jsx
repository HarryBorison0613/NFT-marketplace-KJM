import React from 'react';
import {Link} from 'react-router-dom';
import MegaMenu from './MegaMenu';
import ResourcesSM from './ResourcesSM';
import ProfileSM from './ProfileSM';
import Connect from './Connect';

const Menu = [
  // {
  //   title: <b>My NFTs</b>,
  //   link: '/profile',
  // },
  {
    title: <b>Create</b>,
    link: '/mint',
  },

];
function MobileMenu() {
  return (
    <div>
      <div className="header__mobile__menu space-y-20">
        <ul className="d-flex space-y-20">
          <li className="has_popup">
            <div className="color_black hovered">
            Explore
            </div>
            <ul className="menu__popup space-y-15">
            <MegaMenu />
            </ul>
          </li>
          {Menu.map((val, i) => (
            <li key={i}>
            <Link to={val.link} className="color_black">
              {val.title}
            </Link>
          </li>
          ))}
          <li className="has_popup">
            <div className="color_black hovered">
            Profile
            </div>
            <ul className="menu__popup space-y-15">
            <ProfileSM />
            </ul>
          </li>
          <li className="has_popup">
            <div className="color_black hovered">
            Resources
            </div>
            <ul className="menu__popup space-y-15">
            <ResourcesSM />
            </ul>
          </li>
          <li>
            <Connect />
          </li>
        </ul>
      </div>
    </div>
  );
}

export default MobileMenu;