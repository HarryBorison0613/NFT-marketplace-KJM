import React from 'react';
import Header from '../../../components/header/Header';
import Footer from '../../../components/footer/Footer';
import useDocumentTitle from '../../../components/useDocumentTitle';
import {HashLink} from 'react-router-hash-link';

import {
  Accordion,
  AccordionItem,
  AccordionItemHeading,
  AccordionItemButton,
  AccordionItemPanel,
} from 'react-accessible-accordion';
import HeroQuestions from '../../../components/hero/HeroQuestions';
import {Link} from 'react-router-dom';

const FaqContent = [
  {
    title: 'How does the audit work?',
    desc: `We manually check every aspect of the collection, contract, art, even the creators. We take all the variables and we will create a risk assessment, then we will place the project in one of three trust levels: High, Medium, Low.`,
    expand: 'a',
    link: 'General',
  },
  {
    title: 'How much does the audit cost?',
    desc: `We don't currently charge for auditing. This is a free service offered to creators that will help add trust to the project and empower the community.`,
    expand: 'b',
    link: 'Support',
  },
  {
    title: 'What if I do not like the outcome of the audit?',
    desc: `If your project is already live you can not re-apply. However, if you apply for audit before launching your project we will re-evaluate, so long as the minting process has not begun.`,
    expand: 'c',
    link: 'Transaction',
  },
  {
    title: 'Can I pay to change the audit outcome?',
    desc: 'Absolutely not, any attempt to bribe an Opera House auditor will result in a permanent low trust on the project.',
    expand: 'd',
    link: 'Fees',
  },
  {
    title: 'What is audited exactly?',
    desc: `We go through everything, contracts, links(metadata and assets), previous projects, and proof of creation.`,
  },
  {
    title: 'What if a collection passes?',
    desc: `Then the collection will recieve a trust badge that will be located on the collections display image.`,
  },
  {
    title: 'What if a collection fails?',
    desc: `In this case the collection will recieve a low trust icon on the collections display image.`,
  },
];

const Faq = () => {
  useDocumentTitle('Faq');
  return (
    <div>
      <Header />
      <HeroQuestions />
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
                      {FaqContent.map((item, i) => (
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

export default Faq;
