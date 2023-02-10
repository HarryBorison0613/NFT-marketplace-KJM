import React, { useRef, useState } from 'react'
import { styled } from '@material-ui/core';

const VideoWrapper = styled('div')(() => ({
  width: '100%',
  height: '100%',
  position: 'relative'
}))

const StyledIcon = styled('div')(() => ({
  position: 'absolute',
  borderRadius: '50%',
  background: 'var(--color-info)',
  color: 'var(--color-white)',
  right: 10,
  bottom: 10,
  fontSize: 20,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: 30,
  width: 30
}))

function Video({ src }) {
  const vidRef = useRef();
  const [isPlaying, setIsPlaying] = useState(false)
  const handlePlay = (bVal) => {
    if (bVal) {
      vidRef.current.play();
      setIsPlaying(true)
    } else {
      vidRef.current.pause();
      setIsPlaying(false)
    }
  }

  return (
    <VideoWrapper>
      <video style={{width: "100%", height: "100%", minHeight: "100%", maxWidth: "550px", position: "center", objectFit: "cover"}}
        loop muted playsInline ref={vidRef}>
        <source src={src} type="video/mp4" />
      </video>
      { isPlaying ? (
        <StyledIcon onClick={(e) => { e.preventDefault(); handlePlay(false) }} ><i className="ri-stop-fill"></i></StyledIcon>
      ) : (
        <StyledIcon onClick={(e) => { e.preventDefault(); handlePlay(true) }} ><i className="ri-play-fill"></i></StyledIcon>
      )}
    </VideoWrapper>
  )
}

export default Video
