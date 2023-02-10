import React from 'react';
import {Link} from 'react-router-dom';
import Footer from '../../../components/footer/Footer';
import Header from '../../../components/header/Header';
import SidebarBlog from '../../../components/sidebars/SidebarBlog';
import useDocumentTitle from '../../../components/useDocumentTitle';

const Article = () => {
  useDocumentTitle('Article');
  return (
    <div>
      <Header />
      <div className="container article_page pt-100 ">
        <div className="main row" id="main-content">
          <div className="col-lg-8">
            <div id="content">
              <div className="article_wrap mt-0">
                <div className="content">
                  <img
                    className="mb-30 img-fluid w-full img_article"
                    alt="ImgPreview"
                    src="img/bg/article.jpg"
                  />
                  <h1 className="mb-40">
                    Opera House Encore COMING SOON
                  </h1>
                 
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-4">
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Article;
