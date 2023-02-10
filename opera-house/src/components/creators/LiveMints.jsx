import React from 'react';
import {Link} from 'react-router-dom';
import {
  mintingNow
} from '../../constant/mintingNow';

function LiveMints() {
  const [CreatorsItems, setCreatorsItems] = React.useState([]);
  React.useEffect(() => {
    var CreatorsItemsCopy = [];
    for(let i = 0; i < mintingNow["0xfa"].length; i++) {
      if(mintingNow["0xfa"][i].minting) {
        let CreatorItem = {};
        CreatorItem.name = mintingNow["0xfa"][i].name;
        CreatorItem.address = mintingNow["0xfa"][i].address;
        CreatorItem.website = mintingNow["0xfa"][i].website;
        CreatorItem.price = mintingNow["0xfa"][i].price;
        CreatorItem.totalSupply = mintingNow["0xfa"][i].totalSupply;
        CreatorItem.currentSupply = mintingNow["0xfa"][i].currentSupply;
        CreatorsItemsCopy.push(CreatorItem);
      }
    }
    setCreatorsItems(CreatorsItemsCopy);
    console.log(CreatorsItemsCopy);
  }, []);
  return (
    <div>
      <div className="section__creators mt-100">
        <div className="container">
          <div className="">
            <div className="section_head mb-30" style={{marginBottom: "20px"}}>
              <h3 className="text-center">Currently Minting</h3>
            </div>
            <div className="text-center"><p>The information in this section is updated as frequently as possible, some information maybe slightly outdated.</p>
            </div>
            <div><div className='mx-auto text-center' style={{margin: "10px"}}>
            </div></div>
              <div className="row mb-20_reset justify-content-center">
                {CreatorsItems.map((val, i) => (
                  <div className="col-lg-3" key={i} >
                    <div className="card__item" style={{marginTop: "-10px", padding:"20px", margin:"5px"}}>
                      <div className="card_body">
                        <a href={ val.website } target="_blank" center>
                        <p className="avatars_name color_black text-center" style={{lineHeight: "1.2", fontWeight: "600"}}>
                        {val.name}
                        </p></a>
                        <a href={ val.website } target="_blank" center>
                        <p className="address color_green text-center" style={{fontSize: "10pt", fontWeight: "500"}}>
                        Visit Website
                        </p></a>
                        <div>
                        <p className="text-center" style={{fontSize: "10pt", fontWeight: "500"}}>
                        Price: {val.price} FTM
                        </p>
                        <p className="text-center" style={{fontSize: "10pt", fontWeight: "500"}}>
                        NFTs Minted: {val.currentSupply} 
                        </p>
                        <p className="text-center" style={{fontSize: "10pt", fontWeight: "500"}}>
                        Total Supply: {val.totalSupply} 
                        
                        </p>
                       </div>
                      
                      </div>
                    </div>
                  </div>
                  ))}
                   <div className='mx-auto text-center' style={{marginTop: "30px"}}>
                <b>Powered by Fantom Watch</b>
            </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  );
}

export default LiveMints;
