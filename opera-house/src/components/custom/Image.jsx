import React, { useState, useCallback, useEffect } from 'react'

const CustomImage = ({ src, placeholderImg, ...props }) => {
  const [imgSrc, setSrc] = useState(placeholderImg || src);
  const [loadFailed, setLoadFailed] = useState('idle')
  const failedNum = React.useRef(0)

  const onLoad = useCallback(() => {
    setSrc(src);
  }, [src]);

  const onError = useCallback(() => {
    setLoadFailed('failed')
    failedNum.current ++
  }, [])

  useEffect(() => {
    let img = null
    if (failedNum.current < 2) {
      img = new Image();
      img.src = src;
      img.addEventListener("load", onLoad);
      img.addEventListener("error", onError);
    }
    return () => {
      if (img) {
        img.removeEventListener("load", onLoad);
        img.removeEventListener("error", onError);
      }
    };
  }, [src, onLoad, onError, loadFailed]);

  return <img {...props} alt={imgSrc} src={imgSrc} />;
};

export default React.memo(CustomImage)