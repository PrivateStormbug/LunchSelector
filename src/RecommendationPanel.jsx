import React, { useState, useEffect } from 'react'
import {
  generateAIRecommendations,
  buildUserProfile,
  recordRecommendations,
  recordRecommendationFeedback,
  getRecommendationStats
} from './recommendationManager'
import './RecommendationPanel.css'

/**
 * RecommendationPanel Component - AI 기반 메뉴 추천 패널
 */
function RecommendationPanel({ onSelectMenu, onShowDetail, isVisible, onClose }) {
  const [recommendations, setRecommendations] = useState([])
  const [stats, setStats] = useState(null)
  const [activeTab, setActiveTab] = useState('recommendations')
  const [feedbackRatings, setFeedbackRatings] = useState({})
  const [showFeedback, setShowFeedback] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  // 추천 생성
  useEffect(() => {
    if (isVisible) {
      generateRecommendations()
      loadStats()
    }
  }, [isVisible])

  /**
   * AI 추천 생성
   */
  const generateRecommendations = () => {
    setIsLoading(true)
    
    // 사용자 프로필 구성
    const profile = buildUserProfile()

    // AI 추천 생성
    const aiRecommendations = generateAIRecommendations(profile, 5)

    // 추천 이력 저장
    recordRecommendations(aiRecommendations)

    setRecommendations(aiRecommendations)
    setIsLoading(false)
  }

  /**
   * 통계 로드
   */
  const loadStats = () => {
    const stats = getRecommendationStats()
    setStats(stats)
  }

  /**
   * 추천 메뉴 클릭
   */
  const handleRecommendationClick = (recommendation) => {
    if (onSelectMenu) {
      onSelectMenu(recommendation.category, recommendation.menu)
    }
    if (onShowDetail) {
      onShowDetail(recommendation.category, recommendation.menu)
    }
  }

  /**
   * 피드백 제출
   */
  const handleSubmitFeedback = (category, menu, rating) => {
    recordRecommendationFeedback(category, menu, rating)
    setFeedbackRatings(prev => ({
      ...prev,
      [`${category}_${menu}`]: rating
    }))
    setShowFeedback(prev => ({
      ...prev,
      [`${category}_${menu}`]: false
    }))
    
    // 통계 업데이트
    loadStats()
  }

  /**
   * 새로운 추천 생성
   */
  const handleRefresh = () => {
    generateRecommendations()
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="recommendation-panel">
      <div className="panel-header">
        <h2 className="panel-title">🤖 AI 메뉴 추천</h2>
        <button
          className="panel-close-btn"
          onClick={onClose}
          aria-label="패널 닫기"
          title="닫기"
        >
          ✕
        </button>
      </div>

      <div className="panel-tabs">
        <button
          className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          💡 추천
        </button>
        <button
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 통계
        </button>
      </div>

      <div className="panel-content">
        {activeTab === 'recommendations' && (
          <div className="recommendations-tab">
            {isLoading ? (
              <div className="loading">
                <div className="spinner"></div>
                <p>추천을 생성하는 중입니다...</p>
              </div>
            ) : (
              <>
                {recommendations.length > 0 ? (
                  <>
                    <div className="recommendations-list">
                      {recommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          className="recommendation-card"
                        >
                          <div className="card-ranking">
                            {idx === 0 && '🥇'}
                            {idx === 1 && '🥈'}
                            {idx === 2 && '🥉'}
                            {idx > 2 && `${idx + 1}`}
                          </div>

                          <div className="card-content">
                            <div className="card-header">
                              <h3 className="card-menu-name">{rec.menu}</h3>
                              <span className="card-category">{rec.category}</span>
                            </div>

                            <p className="card-reason">
                              <span className="reason-icon">✨</span>
                              {rec.reason}
                            </p>

                            <div className="card-details">
                              <span className="detail-item">
                                🔥 {rec.detail.calories}kcal
                              </span>
                              <span className="detail-item">
                                💰 {rec.detail.price?.toLocaleString()}원
                              </span>
                              <span className="detail-item">
                                ⏱️ {rec.detail.preparationTime}분
                              </span>
                            </div>

                            {rec.detail.tags && rec.detail.tags.length > 0 && (
                              <div className="card-tags">
                                {rec.detail.tags.slice(0, 2).map((tag, i) => (
                                  <span key={i} className="tag">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="card-actions">
                            <button
                              className="action-btn select-btn"
                              onClick={() => handleRecommendationClick(rec)}
                              title="이 메뉴 선택"
                            >
                              선택
                            </button>
                            <button
                              className="action-btn feedback-btn"
                              onClick={() =>
                                setShowFeedback(prev => ({
                                  ...prev,
                                  [`${rec.category}_${rec.menu}`]:
                                    !prev[`${rec.category}_${rec.menu}`]
                                }))
                              }
                              title="피드백 제공"
                            >
                              💬
                            </button>
                          </div>

                          {showFeedback[`${rec.category}_${rec.menu}`] && (
                            <div className="feedback-section">
                              <p className="feedback-question">
                                이 추천이 만족스러웠나요?
                              </p>
                              <div className="rating-buttons">
                                {[1, 2, 3, 4, 5].map(rating => (
                                  <button
                                    key={rating}
                                    className={`rating-btn ${
                                      feedbackRatings[`${rec.category}_${rec.menu}`] === rating
                                        ? 'selected'
                                        : ''
                                    }`}
                                    onClick={() =>
                                      handleSubmitFeedback(
                                        rec.category,
                                        rec.menu,
                                        rating
                                      )
                                    }
                                    title={`${rating}점 평가`}
                                  >
                                    {rating}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      className="refresh-btn"
                      onClick={handleRefresh}
                      title="새로운 추천 생성"
                    >
                      🔄 새로운 추천 받기
                    </button>
                  </>
                ) : (
                  <div className="no-data">
                    <div className="no-data-icon">🤔</div>
                    <p>아직 추천할 데이터가 없습니다.</p>
                    <p className="no-data-hint">
                      메뉴를 더 많이 선택하면 더 나은 추천을 받을 수 있습니다!
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="stats-tab">
            {stats && stats.totalFeedback > 0 ? (
              <>
                <div className="stat-card">
                  <div className="stat-label">평균 만족도</div>
                  <div className="stat-value">{stats.avgRating} / 5.0</div>
                  <div className="stat-bar">
                    <div
                      className="stat-fill"
                      style={{
                        width: `${(stats.avgRating / 5) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>

                <div className="rating-distribution">
                  <h4 className="rating-title">평점 분포</h4>
                  {[5, 4, 3, 2, 1].map(rating => (
                    <div key={rating} className="rating-row">
                      <span className="rating-label">{rating}⭐</span>
                      <div className="rating-bar-container">
                        <div
                          className="rating-bar"
                          style={{
                            width: `${
                              stats.totalFeedback > 0
                                ? (stats.byRating[rating] / stats.totalFeedback) * 100
                                : 0
                            }%`
                          }}
                        ></div>
                      </div>
                      <span className="rating-count">
                        {stats.byRating[rating]}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="stat-card total">
                  <span className="stat-label">총 피드백</span>
                  <span className="stat-value">{stats.totalFeedback}개</span>
                </div>
              </>
            ) : (
              <div className="no-data">
                <div className="no-data-icon">📊</div>
                <p>아직 피드백이 없습니다.</p>
                <p className="no-data-hint">
                  추천받은 메뉴에 대해 평가하면 추천이 더 정확해집니다!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default RecommendationPanel
