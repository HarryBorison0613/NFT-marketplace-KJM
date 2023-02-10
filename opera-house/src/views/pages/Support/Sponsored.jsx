import React from 'react';
import Header from '../../../components/header/Header';
import Footer from '../../../components/footer/Footer';
import useDocumentTitle from '../../../components/useDocumentTitle';

import {
  Accordion,
  AccordionItem,
  AccordionItemHeading,
  AccordionItemButton,
  AccordionItemPanel,
} from 'react-accessible-accordion';
import HeroSponsor from '../../../components/hero/HeroSponsor';
import {Link} from 'react-router-dom';

const SponsoredContent = [
  {
    title: 'Who do I contact to get buy sponsorship?',
    desc: `Contact one of the OperaHouse Devs on discord. Erebus#3222 or Drenton#0098.`,
    expand: 'a',
    link: 'General',
  },
  {
    title: 'How much does it cost to get a collection sponsored?',
    desc: `Sponsorship slots are currently 25 FTM per week during beta. (subject to change)`,
    expand: 'b',
    link: 'Support',
  },
];

const Sponsored = () => {
  useDocumentTitle('Sponsored');
  return (
    <div>
      <Header />
      <HeroSponsor />
      <div>
        <div className="questions__page mt-100">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="row">
                <div className="col-lg-9 col-md-9 col-sm-8">
                  <div className="questions__box space-y-30">
                    <Accordion
                      className="ff"
                      preExpanded={['b']}
                      allowZeroExpanded>
                      {SponsoredContent.map((item, i) => (
                        <AccordionItem
                          id={item.link}
                          className="accordion p-30 mb-20"
                          key={i}
                          uuid={item.expand}>
                          <AccordionItemHeading className="accordion-header p-0">
                            <AccordionItemButton>
                              <button className="accordion-button">
                                {item.title}
                              </button>
                            </AccordionItemButton>
                          </AccordionItemHeading>
                          {/* Accordion Heading */}
                          <AccordionItemPanel>
                            <p className="accordion-desc">{item.desc}</p>
                          </AccordionItemPanel>
                          {/* Accordion Body Content */}
                        </AccordionItem>
                      ))}
                    </Accordion>
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

export default Sponsored;
