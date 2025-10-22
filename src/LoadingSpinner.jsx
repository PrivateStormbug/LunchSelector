import './LoadingSpinner.css'

function LoadingSpinner({ message = '로딩 중...' }) {
  return (
    <div className="loading-overlay">
      <div className="loading-container">
        <div className="spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <p className="loading-message">{message}</p>
      </div>
    </div>
  )
}

export default LoadingSpinner
