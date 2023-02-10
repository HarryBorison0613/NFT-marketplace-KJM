const TextRender = ({ url }) => {

  return (
    <>{
      url ? (
        <iframe
          src={url}
          frameborder="0"
          marginHeight="1"
          marginWidth="1"
          seamless="seamless"
          scrolling="no"
          title='detail-frame'
          allowTransparency="true"
          style={{width: '100%', height: '100%' }}
        >
        </iframe>
      ) : null
    }
    </>
  )
}

export default TextRender
