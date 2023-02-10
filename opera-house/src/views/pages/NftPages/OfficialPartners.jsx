import React from 'react';
import Footer from '../../../components/footer/Footer';
import Header from '../../../components/header/Header';
import HeroUpcoming from '../../../components/hero/HeroUpcoming';
import useDocumentTitle from '../../../components/useDocumentTitle';

const UpcomingItems1 = [
  {
    Project: 'Fantom Watch',
    Integrated: 'True',
    Features: 'Live Minting Page',
    Price: 'Free',
    Extras: '',


    Project_w: 'NFT Garage',
    Integrated_w: 'False',
    Features_w: 'NFT Launchpad',
    Price_w: 'See Partner Site',
    Extras_w: '',
  },
  {
    Project: 'Bobbleheads',
    Integrated: 'False',
    Features: 'Rarity Ranks',
    Price: 'Free',
    Extras: '',


    Project_w: 'Weaponized Countries',
    Integrated_w: 'True',
    Features_w: 'Discord Sales Bot',
    Price_w: 'Free',
    Extras_w: '',
  },
  {
    Project: 'Dark Matter Defi',
    Integrated: 'False',
    Features: 'NFT Staking',
    Price: 'Free',
    Extras: '',


    Project_w: 'Nova Network',
    Integrated_w: 'True',
    Features_w: 'Crypto Banking',
    Price_w: 'Free',
    Extras_w: '',
  },
];
const UpcomingProjects = () => {
  useDocumentTitle('Upcoming Projects');
  return (
    <div>
      <Header />
      <HeroUpcoming />
      <div>
        <section className="section upcoming_projects mt-100">
          <div className="container">
            <div className="space-x-10 d-flex align-items-center mb-20">
              <div>
                <i className="ri-world-event-line" />
              </div>
              <h3>Official Partners</h3>
            </div>
            <div className="box d-flex table-responsive">
              <table className="table upcoming_projects">
                <thead>
                  <tr>
                    <th scope="col">
                      <span>Partners Name</span>
                    </th>
                    <th className="space-x-5" scope="col">
                      <i className="ri-link" />
                      <span>Links</span>
                    </th>
                    <th className="space-x-5" scope="col">
                      <i className="ri-time-line" />
                      <span>Integrated</span>
                    </th>
                    <th className="space-x-5" scope="col">
                      <i className="ri-price-tag-3-line" />
                      <span>Feature</span>
                    </th>
                    <th className="space-x-5" scope="col">
                      <i className="ri-money-dollar-circle-line" />
                      <span>Price</span>
                    </th>
                  </tr>
                </thead>
                {UpcomingItems1.map((val, i) => (
                  <tbody key={i}>
                    <tr>
                      <td>
                        <span className="color_black">{val.Project}</span>
                      </td>
                      <td>
                        <img
                          src={`img/icons/browsers.png`}
                          className="img-fluid"
                          alt="browser1"
                        />
                      </td>
                      <td>
                        <span className="color_green">{val.Integrated}</span>
                      </td>
                      <td>
                        <span className="color_red">{val.Features}</span>
                      </td>
                      <td>
                        <span className="color_info">{val.Price}</span>
                      </td>
                      <td>
                        <span className="color_black">{val.Extras}</span>
                      </td>
                    </tr>
                    <tr className="white">
                      <td>
                        <span className="color_black">{val.Project_w}</span>
                      </td>
                      <td>
                        <img
                          src={`img/icons/browsers.png`}
                          className="img-fluid"
                          alt="browser2"
                        />
                      </td>
                      <td>
                        <span className="color_green">{val.Integrated_w}</span>
                      </td>
                      <td>
                        <span className="color_red">{val.Features_w}</span>
                      </td>
                      <td>
                        <span className="color_info">{val.Price_w}</span>
                      </td>
                      <td>
                        <span className="color_black">{val.Extras_w}</span>
                      </td>
                    </tr>
                  </tbody>
                ))}
              </table>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default UpcomingProjects;
