import React from 'react';
import {Tab, Tabs, TabList, TabPanel} from 'react-tabs';
import CardCollection from '../../../components/cards/CardCollection';

function MenuCollection(props) {

return (
    <div className="w-100">
      <div className="container">
        <div className="section mt-100">
            <div>
              <div>
                <div className="d-flex align-items-center">
                  <CardCollection {...props} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default MenuCollection;
