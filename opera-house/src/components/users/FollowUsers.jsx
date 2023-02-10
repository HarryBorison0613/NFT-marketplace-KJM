import React, { useContext, useEffect, useState } from 'react'
import { useMoralis } from 'react-moralis'
import NFTContext from '../../context/NFTContext'
import { useAsync } from '../../hooks/utils'
import Image from '../custom/Image'

const FollowUsers = ({ address }) => {
  const {
    setData,
    setError,
    error,
    status,
    data,
    run,
  } = useAsync({
    data: [],
  })
  const { Moralis, isInitialized } = useMoralis()
  const { walletAddress } = useContext(NFTContext)

  useEffect(() => {
    if (isInitialized) {
      let userAddress = walletAddress
      if (address) userAddress = address
      if (!userAddress) return
      run(
        Moralis.Cloud.run('getFollowUsers', { walletAddress: userAddress })
        .then((response) => {
          if (response && response.result && response.data) {
            return response.data
          } else {
            return []
          }
        })
      )
    }
  }, [isInitialized, Moralis, run, walletAddress, address])

  if (status !== 'resolved') return null

  return (
    <div className="section__creators mt-100" style={{
      marginBottom: "-50px",
      marginTop: "50px"
    }}>
      <div className="container">
          <div className="section__body">
            <div className="row mb-20_reset justify-content-center" style={{
              marginTop: "-110px",
            }}>
              {data && data.map((item) => (
                <div className="col-xl-3 col-lg-4 col-md-4 col-sm-6 mb-20">
                  <div
                    className="creator_item creator_card space-x-10"
                    style={{padding:"20px", margin:"-5px", borderRadius: "10px", minWidth: "300px"}}
                   >
                    <div className="avatars space-x-10">

                    {item.avatar &&<img alt="Avatar"
                      className="avatar avatar-m border-0 mr-0" src={'https://operahouse.mypinata.cloud/ipfs/' + item.avatar}
                    />
                    }
                      <div>
                      { (item.displayName && item.displayName !== '') &&
                        <a href={"https://operahouse.online/profile/" + (item.paid ? item.displayName :item.address) } target="_blank" rel="noreferrer" className='d-flex'>
                          <b>{item.displayName}</b>
                        </a>
                      }
                          <p className="color_green" style={{
                            fontSize: "10pt"
                          }}>
                          <a href={"https://operahouse.online/profile/" + (item.paid ? item.displayName :item.address) } target="_blank" rel="noreferrer" className='d-flex'>
                          {item.address.substring(0, 14)}...
                          </a>
                          </p>
                          <a href={item.twitter} className="twitter-btn" target="_blank" style={{
                            margin: "0px 3px 0px 3px"
                          }}>
                        <i className="ri-twitter-fill" />
                      </a>
                      <a href={item.telegram} className="twitter-btn" target="_blank" style={{
                        margin: "0px 3px 0px 3px"
                      }}>
                        <i className="ri-telegram-fill" />
                      </a>
                      <a href={item.url} className="website-btn" target="_blank" style={{
                        margin: "0px 3px 0px 3px"
                      }}>
                        <i className="ri-earth-fill" />
                      </a>

                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
    </div>
  )
}

export default FollowUsers
