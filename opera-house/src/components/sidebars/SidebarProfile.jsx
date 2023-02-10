import React from 'react';
const SidebarProfile = ({ profile, follow, handleFollow }) => {
  const noSical = !profile || !profile.discord || !profile.twitter || !profile.telegram;
  return (
    <div className="profile__sidebar text-center mx-auto box" style={{width: "90%", maxWidth: "1320px", marginTop: "20px", padding: "20px"}}>
      <div className="space-y-40 row sm:space-y-20">
        <div className="space-y-10 col-lg-6">
        { profile &&
          <div className='avatars'>

            <a href={"https://operahouse.online/profile/" + profile.address } target="_blank" rel="noreferrer" className='d-flex'>
              {profile.avatar &&
                <img alt="Avatar"
                  className="avatar avatar-md border-0 mr-2" src={'https://operahouse.mypinata.cloud/ipfs/' + profile.avatar}
                />
              }
              {profile.displayName &&
                <p className="avatars_name color_black text-left" style={{marginLeft: "10px", fontSize: "16pt", marginTop: "0px"}}>
                  {profile.displayName}
                  { (profile && profile.url) &&
                    <div className="avatars_name color_black text-left" style={{marginLeft: "0px", fontWeight: "300", fontSize: "10pt"}}>
                      <a href={profile.url} target="_blank" rel="noreferrer" className='d-flex'>
                      {profile.url}</a>
                    </div>
                  }
              </p>
              }
            </a>
          </div>
        }
            <div style={{marginTop: "25px", marginLeft: "0px", textAlign: "left"}}>

            { profile && profile.description &&
              <p className="color_black" style={{fontSize: "12pt", fontWeigh: "300", marginBottom: "10px"}}>
              <h6>About Me</h6>
                {profile.description}
              </p>
            }
            </div>


        </div>
        { !noSical && <div className="space-y-10 col-lg-6" style={{marginTop: "0px"}}>
          <div>
            <ul className="social_profile space-y-10 overflow-hidden text-right mx-auto" style={{fontSize: "10pt", fontWeight: "400"}}>
              { profile?.twitter && <li>
              <a href={profile.twitter} rel="noreferrer"  target="_blank">
                  <i className="ri-twitter-line" />
                  {profile.twitter}
                </a>
              </li>
              }
              { profile?.discord && <li>
                <a href="#" onClick={(e)=> e.preventDefault()}>
                  <i className="ri-discord-line" />

                  {profile.discord}
                </a>
              </li>
              }
              { profile?.telegram && <li>
              <a href={profile.telegram} rel="noreferrer"  target="_blank">
                  <i className="ri-telegram-line" />

                  {profile.telegram}
                </a>
              </li>
              }
              <a href={"https://operahouse.online/profile/" + profile.address } rel="noreferrer"  target="_blank">
                  <i className="ri-user-line" />
                  {"https://operahouse.online/profile/" + profile.address }
                </a>
                <div style={{marginBottom: "50px"}} />
              {/* <li>
              <a href="https://www.facebook.com/" rel="noreferrer"  target="_blank">
                  <i className="ri-facebook-line" />
                  <span className="color_text">facebook/</span>
                  @creabik
                </a>
              </li>
              <li>
              <a href="https://www.messenger.com/" rel="noreferrer"  target="_blank">
                  <i className="ri-messenger-line" />
                  <span className="color_text"> messenger/</span>
                  @creabik
                </a>
              </li>
              <li>
              <a href="https://whatsapp.com" target="_blank" rel="noreferrer" >
                  <i className="ri-whatsapp-line" />
                  <span className="color_text"> whatsapp/</span>
                  @creabik
                </a>
              </li>
              <li>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" >
                  <i className="ri-youtube-line" />
                  <span className="color_text">youtube/</span>
                  @creabik
                </a>
              </li> */}
            </ul>
          </div>

        </div>
        }
      </div>
      <div className="mx-auto text-center card__item" style={{marginTop: "-20px", marginBottom: "10px", maxWidth: "400px"}}>
      { (profile && (profile.collections !== undefined || profile.ownedNfts !== undefined) )&&
      <div className="row">
        <div className="col-6">
          <span className="txt_sm color_black">Collections</span>
          <h4>{profile.collections ? profile.collections : 0}</h4>
        </div>
        <div className="col-6">
          <span className="txt_sm color_black">NFTs</span>
          <h4>{profile.ownedNfts ? profile.ownedNfts : 0}</h4>
        </div>
      </div>
      }
      </div>
      { follow !== null && (
        follow === true ? (
          <button className='btn btn-sm btn-primary' onClick={() => handleFollow(false)}>Unfollow</button>
        ) : (
          <button className='btn btn-sm btn-primary' onClick={() => handleFollow(true)}>Follow</button>
        )
      )}
    </div>
  );
};

export default SidebarProfile;
