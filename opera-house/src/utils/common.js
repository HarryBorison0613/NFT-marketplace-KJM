const getAbbrWalletAddress = (walletAddress) => {
  if (walletAddress) {
    let abbrWalletAddress = walletAddress.substring(0, 4) + "..." + walletAddress.substring(38, 42);
    return abbrWalletAddress.toLowerCase();
  }
}

const getSecondTime = (time) => {
  const seconds = time % 60
  const minutes = Math.floor(time / 60)
  return `${minutes}:${("00" + seconds).slice(-2)} Minutes`
}

const getMinuteTime = (time) => {
  const minutes = time % 60
  const hours = Math.floor(time / 60)
  return `${("00" + hours).slice(-2)}:${("00" + minutes).slice(-2)} Hours`
}

const getDateTime = (time) => {
  const dates = Math.floor(time / 1440)
  return `${dates} Days`
}

const getDateOrTime = (timestamp) => {
  const now = Math.floor(Date.now() / 1000)
  if (timestamp < now) return {
    type: 'end'
  }
  const seconds = timestamp - now
  const minutes = Math.floor(seconds / 60)
  if (minutes < 6) {
    return {
      type: 'second',
      data: getSecondTime(seconds)
    }
  } else if (minutes < 1440) {
    return {
      type: 'min',
      data: getMinuteTime(minutes)
    }
  } else {
    return {
      type: 'day',
      data: getDateTime(minutes)
    }
  }
}

const sleep = (timeToSleep) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, timeToSleep)
  })
}

export {
  getAbbrWalletAddress,
  getDateOrTime,
  sleep
}

