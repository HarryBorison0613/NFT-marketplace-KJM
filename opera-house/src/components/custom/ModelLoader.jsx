import React from 'react'
import VisibilitySensor from 'react-visibility-sensor'
import '@google/model-viewer'

const ModelLoader = ({ src }) => {
  return (
    <>
    <VisibilitySensor>
      {({isVisible}) =>
        <>{
          isVisible ? (
            <model-viewer src={src} autoplay
             style={{width: '100%', height: 300}}
            />
          ) : (
            <img src="/img/logos/loading.gif" alt="preload" />
          )
        }
        </>
      }
    </VisibilitySensor>
    </>
  )
}

export default ModelLoader
