import React from 'react'
import './ErrorBoundary.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
    // 페이지 새로고침
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <h1 className="error-title">문제가 발생했습니다</h1>
            <p className="error-message">
              앱에서 예상치 못한 오류가 발생했습니다.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>상세 정보 보기</summary>
                <pre className="error-stack">
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="error-actions">
              <button 
                className="error-button reset"
                onClick={this.handleReset}
              >
                🔄 다시 시작
              </button>
              <button 
                className="error-button report"
                onClick={() => {
                  const errorText = encodeURIComponent(
                    `${this.state.error?.toString()}\n\n${this.state.errorInfo?.componentStack}`
                  )
                  window.location.href = `mailto:support@example.com?subject=앱 오류 보고&body=${errorText}`
                }}
              >
                📧 오류 보고
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
