import React, {useCallback, useContext, useEffect, useRef, useState} from 'react';
import { create } from 'ipfs-http-client';
import Footer from '../../../components/footer/Footer';
import Header from '../../../components/header/Header';
import HeroEditProfile from '../../../components/hero/HeroEditProfile';
import useDocumentTitle from '../../../components/useDocumentTitle';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import {ToastContainer, toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {Link} from 'react-router-dom';
import { useMoralis } from 'react-moralis';
import NFTContext from '../../../context/NFTContext';
import { config } from '../../../constant/config';

const client = create('https://ipfs.infura.io:5001/api/v0');

const validateEmail = (email) => {
  return email.match(
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );
};

function isValidHttpUrl(string) {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
}

const adminAddress = config.adminAddress

const EditProfile = () => {
  const {Moralis, isInitialized, isAuthenticated, user} = useMoralis()
  const { walletAddress } = useContext(NFTContext)
  const [file, setFile] = useState()
  const [profile, setProfile] = useState()
  const [avatar, setAvatar] = useState('')
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [twitter, setTwitter] = useState('')
  const [discord, setDiscord] = useState('')
  const [telegram, setTelegram] = useState('')
  const [updating, setUpdating] = useState(false)
  const [paid, setPaid] = useState(null)
  const [urlCopying, setUrlCopying] = useState(false)
  const loadOrder = useRef(0)

  const deleting = () => {
    setFile(null)
    if (avatar) {
      Moralis.Cloud.run('deleteAvatar', { address: walletAddress})
      .then(() => {
        setAvatar(null)
        toast.success('Your profile has been updated!');
      })
    }
  }
  const confirm = () => toast.success('Your email has been updated!');
  const update = () => toast.success('Your profile has been updated!');

  const ref = useRef();
  const closeTooltip = () => ref.current.close();
  useDocumentTitle(' Edit Profile');

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if(file.type.match('image.*')) {
      setFile(event.target.files[0])
    } else {
      toast.error('Please select image');
    }
  }

  const handleUpdate = async () => {
    try {
      setUpdating(true)
      const data = {
        address: walletAddress,
        displayName,
        email,
        url,
        description,
        twitter,
        discord,
        telegram
      }
      if (email && email !== '' && !validateEmail(email)) {
        return toast.error('Please use a valid email address.')
      }
      if (url && url !== '' && !isValidHttpUrl(url)) {
        return toast.error('Please use a valid url.')
      }
      if (file) {
        const ipfsUrl = await client.add(file).catch((err) => null)
        if (ipfsUrl && ipfsUrl.path) data.avatar = ipfsUrl.path
      }
      Moralis.Cloud.run('updateProfile', data)
      .then((response) => {
        const { result, data, error } = response
        if (result) {
          const { avatar, displayName, description, email, url, twitter, discord, telegram, paid } = data
          setAvatar(avatar ? avatar : '')
          setDisplayName(displayName ? displayName : '')
          setDescription(description ? description : '')
          setUrl(url ? url : '')
          setEmail(email ? email : '')
          setTwitter(twitter ? twitter : '')
          setDiscord(discord ? discord : '')
          setTelegram(telegram ? telegram : '')
          if (paid) setPaid('paid')
          else setPaid(false)
          update()
          setUpdating(false)
        } else {
          if (error) {
            toast.error(error);
          } else {
            toast.error('Updating Failed');
          }
          setUpdating(false)
        }
      })
      .catch(() => {
        setUpdating(false)
        toast.error('Updating Failed');
      })
    } catch (err) {
      setUpdating(false)
      toast.error('Updating Failed');
    }
  }

  const handlePay = useCallback(() => {
    setPaid('pending')
    const options = { type: 'native', amount: Moralis.Units.ETH(3), receiver: adminAddress }
    Moralis.transfer(options)
    .then((res) => {
      Moralis.Cloud.run('profilePay', { address: walletAddress })
      .then((response) => {
        if (response) {
          const { result } = response
          if (result) {
            setPaid('paid')
          }
        }
      })
    })
  }, [Moralis, walletAddress])

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url)
    setUrlCopying(true)
    setTimeout(() => {
      setUrlCopying(false)
    }, 2000)
  }

  useEffect(() => {
    (async () => {
      if (isInitialized && isAuthenticated && walletAddress) {
        try {
          loadOrder.current ++;
          const order = loadOrder.current
          const Profile = Moralis.Object.extend('Profile')
          const query = new Moralis.Query(Profile)
          query.equalTo('address', walletAddress.toLowerCase())
          const profile = await query.first()
          if (order === loadOrder.current) {
            if (profile) {
              const { attributes } = profile
              const { avatar, displayName, description, email, url, twitter, discord, telegram, paid } = attributes
              setAvatar(avatar ? avatar : '')
              setDisplayName(displayName ? displayName : '')
              setDescription(description ? description : '')
              setUrl(url ? url : '')
              setEmail(email ? email : '')
              setTwitter(twitter ? twitter : '')
              setDiscord(discord ? discord : '')
              setTelegram(telegram ? telegram : '')
              if (paid) setPaid('paid')
              else setPaid(false)
            } else {
              setAvatar('')
              setDisplayName('')
              setDescription('')
              setUrl('')
              setEmail('')
              setTwitter('')
              setDiscord('')
              setTelegram('')
            }
          }
        } catch (err) {
        }
      }
    }) ()

  }, [isInitialized, isAuthenticated, walletAddress, Moralis.Object, Moralis.Query])

  const fileToPreview = file? URL.createObjectURL(file): (avatar? `https://operahouse.mypinata.cloud/ipfs/${avatar}`: null)

  return (
    <>
      <div style={{flexGrow: 1}} className="edit_profile">
      <Header />
      { isAuthenticated &&
        <>
        {/* <HeroEditProfile /> */}
        <br />
        <div className="container">
          <div>
            <div className="avatars space-x-20 mb-30">
              <div id="profile-container">
                <img
                  id="profileImage"
                  src={fileToPreview ? fileToPreview: "img/avatars/avatar_3.png"}
                  alt="Avatar"
                  className="avatar avatar-lg border-0"
                />
              </div>
              <div className="space-x-10 d-flex">
                <div id="boxUpload">
                  <Link to="#" className="btn btn-dark">
                    Upload  Photo
                  </Link>
                  <input
                    id="imageUpload"
                    type="file"
                    onChange={handleFileChange}
                    name="profile_photo"
                    placeholder="Photo"
                    accept="image/*"
                    required
                    capture
                  />
                </div>
                <Link to="#" className="btn btn-white" onClick={deleting}>
                  Delete
                </Link>
                <ToastContainer position="bottom-right" />
              </div>
            </div>

            <div className="box edit_box col-lg-12 space-y-30">
              <div className="row sm:space-y-20">
                <div className="col-lg-6 account-info" style={{padding: "30px"}}>
                  <h3 className="mb-20">Account Info </h3>
                  <div className="form-group space-y-10 mb-0">
                    <div className="space-y-20">
                      <div className="space-y-10">
                        <span className="nameInput" style={{fontSize: "10pt"}}><b>Display Name</b></span>
                        <input
                          id="txtUsername"
                          type="text"
                          className="form-control"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Eg. John Doe"
                          style={{borderRadius: "30px", fontSize: "10pt" }}
                        />
                      </div>
                      <div className="space-y-10">
                        <span className="nameInput d-flex justify-content-between" style={{fontSize: "10pt"}}>
                          <b>Email</b>
                          <span className="txt_xs" style={{marginRight: "20px", fontSize: "8pt"}}>
                            * You might receive occasional emails from us.
                          </span>
                        </span>
                        <div className="confirm">
                          <input
                            id="txtEmail"
                            type="text"
                            className="form-control"
                            placeholder="Eg. your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{borderRadius: "30px", fontSize: "10pt" }}
                          />
                          {/* <Link
                            to="#"
                            className="confirm-btn btn btn-dark btn-sm"
                            onClick={confirm}>
                            Confirm
                          </Link> */}
                        </div>
                      </div>
                      <div className="space-y-10">
                        <span className="nameInput" style={{fontSize: "10pt"}}><b>Website</b></span>
                        <input
                          type="text"
                          className="form-control"
                          // defaultValue="https://operahouse.online/"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          style={{borderRadius: "30px", fontSize: "10pt" }}
                          placeholder="Eg. https://operahouse.online/"
                        />
                      </div>
                      <div className="space-y-10">
                        <span className="nameInput" style={{fontSize: "10pt"}}><b>About You</b></span>
                        <textarea
                          style={{minHeight: 110, borderRadius: "30px", fontSize: "10pt"}}
                          placeholder="Tell a little bit about yourself..."
                          // defaultValue={'\t\t\t\t\t\t\t\t\t'}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>
                      { paid !== null &&
                        <div className="space-y-10">
                          <div className="nameInput" style={{fontSize: "10pt"}}><b>Premium Profile Url</b></div>
                          { paid === 'paid' ? (
                            <div className='d-flex' style={{userSelect: 'none'}}>
                              <span>{`https://operahouse.online/profile/${displayName ? displayName.replaceAll(' ', '_') : ''}`}</span>
                              { urlCopying ? (
                                <div className="d-flex icon ml-2 mb-0">
                                  <i className="ri-check-line"></i>
                                </div>
                              ) : (
                                <div className="d-flex icon ml-2 mb-0" role="button" onClick={() => {handleCopyUrl(`https://operahouse.online/profile/${displayName ? displayName.replaceAll(' ', '_') : ''}`)}}>
                                <i className="ri-clipboard-line"></i>
                              </div>
                              )}
                            </div>
                          ) : (
                            <>
                              <button
                                className='btn btn-primary'
                                onClick={handlePay}
                                disabled={paid === 'pending'}
                              >
                                {paid === 'pending' ? 'Pending' : 'Pay for Premium'}
                              </button>
                              <p><i>Custom URL to share your profile, </i>e.g. <b>https://operahouse.online/profile/username</b></p>
                            </>
                          )}
                        </div>
                      }
                    </div>
                  </div>
                </div>
                <div className="col-lg-6 social-media" style={{padding: "30px"}}>
                  <h3 className="mb-20">Social media</h3>
                  <div className="form-group space-y-10">
                    <div className="space-y-20">
                      <div className="d-flex flex-column">
                        <span className="nameInput mb-10" style={{fontSize: "10pt"}}><b>Twitter</b></span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Eg. https://twitter.com/FTMOperaHouse"
                          value={twitter}
                          onChange={(e) => setTwitter(e.target.value)}
                          style={{borderRadius: "30px", fontSize: "10pt" }}
                        />

                        {/* <Link
                          className="twitter-btn btn btn-primary mt-20 btn-sm"
                          to="#">
                          <i className="ri-twitter-fill" />
                          Connect to Twitter
                        </Link> */}
                      </div>
                      <div className="d-flex flex-column">
                        <span className="nameInput mb-10" style={{fontSize: "10pt"}}><b>Discord</b></span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Eg. Name#1234"
                          style={{borderRadius: "30px", fontSize: "10pt", }}
                          value={discord}
                          onChange={(e) => setDiscord(e.target.value)}
                        />
                        {/* <Link
                          className="discord-btn btn btn-primary mt-20 btn-sm"
                          to="#">
                          <i className="ri-discord-fill" />
                          Connect to Discord
                        </Link> */}
                      </div>
                      <div className="d-flex flex-column">
                        <span className="nameInput mb-10" style={{fontSize: "10pt"}}><b>Telegram</b></span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Eg. https://t.me/Username"
                          style={{borderRadius: "30px", fontSize: "10pt", }}
                          value={telegram}
                          onChange={(e) => setTelegram(e.target.value)}
                        />
                      </div>

                    </div>
                  </div>

                  {/* <Popup
                    className="custom"
                    ref={ref}
                    trigger={
                      <button className="btn btn-white mt-20 btn-sm">
                        <i className="ri-add-circle-line color_brand mt-5px" />
                        Add more Social media
                      </button>
                    }
                    position="bottom center">
                    <div>
                      <div
                        className="popup"
                        id="popup_bid"
                        tabIndex={-1}
                        role="dialog"
                        aria-hidden="true">
                        <div>
                          <button
                            type="button"
                            className="button close"
                            data-dismiss="modal"
                            aria-label="Close"
                            onClick={closeTooltip}>
                            <span aria-hidden="true">×</span>
                          </button>
                          <div className="space-y-20">
                            <h3 className="text-center">Add more Social media</h3>
                            <div className="d-flex flex-column">
                              <span className="nameInput mb-10">Telegram</span>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="telegram username"
                              />
                              <Link
                                className="telegram-btn btn btn-primary mt-20 btn-sm"
                                to="#">
                                <i className="ri-telegram-fill mr-5px" />
                                Connect to Telegram
                              </Link>
                            </div>

                            <div className="d-flex flex-column">
                              <span className="nameInput mb-10">TikTok</span>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="tiktok username"
                              />
                              <Link
                                className="tiktok-btn btn btn-primary mt-20 btn-sm"
                                to="#">
                                <img
                                  className="mr-5px"
                                  src={`img/icons/tiktok.svg`}
                                  alt="tiktok"
                                  style={{height: 20}}
                                />
                                Connect to TikTok
                              </Link>
                            </div>
                            <div className="d-flex flex-column">
                              <span className="nameInput mb-10">Youtube</span>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="youtube username"
                              />
                              <Link
                                className="youtube-btn btn btn-primary mt-20 btn-sm"
                                to="#">
                                <i className="ri-youtube-fill mr-5px" />
                                Connect to Youtube
                              </Link>
                            </div>
                            <div className="d-flex flex-column">
                              <span className="nameInput mb-10">Medium</span>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="medium username"
                              />
                              <Link
                                className="medium-btn btn btn-primary mt-20 btn-sm"
                                to="#">
                                <img
                                  className="mr-5px"
                                  src={`img/icons/medium.svg`}
                                  alt="tiktok"
                                  style={{height: 21}}
                                />
                                Connect to Medium
                              </Link>
                            </div>
                            <Link
                              className="discord-btn btn btn-primary w-100"
                              to="#">
                              Save
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Popup> */}
                </div>
              </div>
              <div className="hr" />
              <p className="color_black text-center mx-auto" style={{fontSize: "10pt", width: "90%"}}>
                To update your profile, please update your info and click on "Update Profile" once you are done. Wait for the confirmation before you leave the page.
                We recommend you update all the fields so your public profile displays correctly.
              </p>
              <div className="color_black text-center mx-auto">
                <button to="#" className="btn btn-primary" onClick={handleUpdate} disabled={updating}>
                  Update Profile
                </button>
              </div>
            </div>
          </div>
        </div>
        </>
      }
      
    </div>
    <Footer />
    </>
  );
};

export default EditProfile;
