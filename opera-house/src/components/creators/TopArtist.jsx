import React, {useState, useEffect} from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import {Link} from 'react-router-dom';

const MiniFeature = [
  {
    img: 'https://operahouse.mypinata.cloud/ipfs/QmaoQgxh296fK8aUrHxyApQbuovBC7QXd1ojV1brvdubvA',
    name: 'Baby Chimp Gang',
    discord: 'https://discord.com/invite/x7EKQdkfDm',
    twitter: 'https://twitter.com/BabyChimpGang',
    link: 'https://babychimpgang.com/',
    link2:'https://babychimpgang.com/',
    link3:'https://operahouse.online/collection/BabyChimpGang',
  },
  {
    img: 'https://operahouse.mypinata.cloud/ipfs/QmQDGbDgQqPXreVk2ZgnHqzpCHuHez1A8HoajST8vPemb6',
    name: 'FHFC',
    discord: 'https://discord.gg/zFR6T9Fjxy',
    twitter: 'https://twitter.com/fhfcnft',
    link: 'https://operahouse.online/collection/FHFC%7CLTDEDITIONMINTPASS',
    link2:'https://operahouse.online/collection/FHFC%7CLTDEDITIONMINTPASS',
    link3:'https://operahouse.online/collection/FHFC%7CLTDEDITIONMINTPASS',
  },
  {
    img: 'https://operahouse.mypinata.cloud/ipfs/QmYcsDzXC3V9aUgVDZQ6nvHJ8nZvjbFDMwJTukbefGeq9f',
    name: 'Raccoon Platoon',
    discord: 'https://discord.gg/novanetwork',
    twitter: 'https://twitter.com/RaccoonPlatoons',
    link: 'https://operahouse.online/collection/RaccoonPlatoon',
    link2:'https://operahouse.online/collection/RaccoonPlatoon',
    link3:'https://operahouse.online/collection/RaccoonPlatoon',
  },
  {
    img: 'https://operahouse.mypinata.cloud/ipfs/QmYgyEYuQzG36JHF7w5GKzvioESJn9B7cPjPF3B7TUoXJW',
    name: 'Gnarwhals',
    discord: 'https://discord.gg/jn6tvQjmtS',
    twitter: 'https://twitter.com/ftmgnarwhals',
    link: 'https://operahouse.online/collection/FTMGnarwhals',
    link2:'https://operahouse.online/collection/FTMGnarwhals',
    link3:'https://www.ftmgnarwhals.com/',
  },
  {
    img: 'https://operahouse.mypinata.cloud/ipfs/Qmdto9je4Txz4V7xtkotgyRKXz2YqcrXCCeQ41WeXtM4zU',
    name: 'FantoPops',
    discord: 'https://discord.gg/q28xYD5t2R',
    twitter: 'https://twitter.com/FantoPops',
    link: 'https://operahouse.online/collection/FantoPops',
    link2:'https://operahouse.online/collection/FantoPops',
    link3:'https://fantopops.club/minter.html',
  },
  {
    img: '/img/logos/oh2.png',
    name: 'Community',
    discord: 'https://discord.gg/novanetwork',
    twitter: 'https://twitter.com/FTMOperaHouse',
    link: '/collection/0x86c4764a936b0277877cb83abf1ad79ce35c754c',
    link2:'/collection/0x86c4764a936b0277877cb83abf1ad79ce35c754c',
    link3:'/collection/0x86c4764a936b0277877cb83abf1ad79ce35c754c',
  },
  {
    img: 'https://operahouse.mypinata.cloud/ipfs/QmSmognPpZQ827L2PWLUxq8gaoP7gBgcThSoEwdcz4hupF',
    name: 'FAM Apprentice',
    discord: 'https://discord.gg/AGKJVJQpe8',
    twitter: 'https://twitter.com/ftmmagicacademy',
    link: '/collection/FAMApprentice',
    link2:'/collection/FAMApprentice',
    link3:'https://fantommagic.academy/',
  },
  {
    img: '/img/collectionmain/hamsteropera.png',
    name: 'Hamsters Of Opera',
    discord: 'https://discord.gg/mDK45fPjVP',
    twitter: 'https://twitter.com/HamstersOfFTM',
    link: '/collection/HamstersandOwls',
    link2:'/collection/HamstersandOwls',
    link3:'https://hno.hamster.money/',
  },


];

const settings = {
  dots: false,
  arrow: false,
  infinite: true,
  speed: 1000,
  slidesToShow: 5,
  // slidesToScroll: 1,
  autoplay: true,
  margin: 10,
  pauseOnHover: true,
  responsive: [
    {
      breakpoint: 4000,
      settings: {
        slidesToShow: 5,
        slidesToScroll: 2,
      },
    },
    {
      breakpoint: 1100,
      settings: {
        slidesToShow: 3,
        slidesToScroll: 1,
      },
    },
    {
      breakpoint: 768,
      settings: {
        slidesToShow: 2,
        slidesToScroll: 1,
      },
    },
    {
      breakpoint: 480,
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1,
      },
    },
  ],
};


function shuffle(array) {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

export default function TopArtist() {
  const [features, setFeatures] = useState([MiniFeature])

  useEffect(() => {
    const newFeatures = [...MiniFeature]
    shuffle(newFeatures)
    setFeatures(newFeatures)
  }, [])
  return (
    <div className="section__artists mt-100">
      <div className="container">
        <div className="space-y-30">
          <div className="section_body swiper_artists">
            <Slider {...settings}>
              {features.map((val, i) => (
                <div className="item" key={i}>
                <div className="creator_item creator_card space-x-10" style={{
                  margin: "0px 5px 0px 5px",
                  borderRadius: "10px",
                }}>
                    <div className="avatars space-x-10">
                      <div className="media">
                        <div className="badge">
                          <img src={`img/icons/check.svg`} alt="icons" />
                        </div>
                        <a href={val.link}>
                          <img
                            src={val.img}
                            alt="Avatar"
                            className="avatar avatar-md"
                          />
                        </a>
                      </div>
                      <div>
                        <a href={val.link2}>
                          <p className="avatars_name color_black">
                            {val.name}
                          </p>
                        </a>
                        <div>
                    <a href={val.discord} className="discord-btn" target="_blank" style={{marginLeft: "5px", marginRight: "5px"}}><i className="ri-discord-fill" /></a>
                    <a href={val.twitter} className="twitter-btn" target="_blank" style={{marginLeft: "5px", marginRight: "5px"}}><i className="ri-twitter-fill" /></a>
                    <a href={val.link3} className="website-btn" target="_blank" style={{marginLeft: "5px", marginRight: "5px"}}><i className="ri-earth-fill" /></a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        </div>
      </div>
    </div>
  );
}
