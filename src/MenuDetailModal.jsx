import { useEffect, useState } from 'react'
import { getMenuDetail, calculateNutritionScore } from './menuDetailManager'
import './MenuDetailModal.css'

/**
 * 메뉴 상세정보 모달 컴포넌트
 * 선택된 메뉴의 상세 정보를 표시
 */
function MenuDetailModal({ category, menu, onClose, onShare }) {
  const [detail, setDetail] = useState(null)
  const [nutritionScore, setNutritionScore] = useState(0)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const menuDetail = getMenuDetail(category, menu)
    setDetail(menuDetail)
    if (menuDetail) {
      const score = calculateNutritionScore(category, menu)
      setNutritionScore(score)
    }
  }, [category, menu])

  if (!detail) {
    return null
  }

  const getSpiceLevelDisplay = () => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <span
          key={i}
          style={{
            color: i < detail.spiceLevel ? '#ff6b6b' : '#e0e0e0',
            fontSize: '16px'
          }}
        >
          🌶️
        </span>
      ))
  }

  const getScoreColor = () => {
    if (nutritionScore >= 80) return '#51cf66'
    if (nutritionScore >= 60) return '#ffd43b'
    if (nutritionScore >= 40) return '#ff922b'
    return '#ff6b6b'
  }

  const handleShare = () => {
    if (onShare) {
      onShare(category, menu, detail)
    }
  }

  return (
    <div className="menu-detail-modal-overlay" onClick={onClose}>
      <div className="menu-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          ✕
        </button>

        <div className="modal-header">
          <div className="modal-title-section">
            <h2 className="modal-title">{menu}</h2>
            <span className="modal-category">{category}</span>
          </div>
          <div className="modal-score-badge" style={{ backgroundColor: getScoreColor() }}>
            <span className="score-number">{nutritionScore}</span>
            <span className="score-label">영양점수</span>
          </div>
        </div>

        {detail.description && (
          <p className="modal-description">{detail.description}</p>
        )}

        <div className="modal-tabs">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            개요
          </button>
          <button
            className={`tab-btn ${activeTab === 'nutrition' ? 'active' : ''}`}
            onClick={() => setActiveTab('nutrition')}
          >
            영양정보
          </button>
          <button
            className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            상세정보
          </button>
        </div>

        <div className="modal-content">
          {activeTab === 'overview' && (
            <div className="tab-content">
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">칼로리</div>
                  <div className="info-value">{detail.calories} kcal</div>
                </div>
                <div className="info-item">
                  <div className="info-label">가격</div>
                  <div className="info-value">
                    {detail.price ? `${detail.price.toLocaleString()}원` : '정보 없음'}
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-label">준비시간</div>
                  <div className="info-value">
                    {detail.preparationTime ? `약 ${detail.preparationTime}분` : '정보 없음'}
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-label">맵기</div>
                  <div className="info-value spice-level">
                    {getSpiceLevelDisplay()}
                  </div>
                </div>
              </div>

              {detail.servingSize && (
                <div className="info-block">
                  <div className="info-label-bold">제공량</div>
                  <div className="info-text">{detail.servingSize}</div>
                </div>
              )}

              {detail.tags && detail.tags.length > 0 && (
                <div className="info-block">
                  <div className="info-label-bold">특징</div>
                  <div className="tags-container">
                    {detail.tags.map((tag, idx) => (
                      <span key={idx} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'nutrition' && (
            <div className="tab-content">
              <div className="nutrition-chart">
                <div className="nutrition-item">
                  <div className="nutrition-label">단백질</div>
                  <div className="nutrition-bar">
                    <div
                      className="nutrition-fill protein-fill"
                      style={{ width: `${Math.min((detail.protein / 50) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="nutrition-value">{detail.protein}g</div>
                </div>

                <div className="nutrition-item">
                  <div className="nutrition-label">탄수화물</div>
                  <div className="nutrition-bar">
                    <div
                      className="nutrition-fill carbs-fill"
                      style={{ width: `${Math.min((detail.carbs / 100) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="nutrition-value">{detail.carbs}g</div>
                </div>

                <div className="nutrition-item">
                  <div className="nutrition-label">지방</div>
                  <div className="nutrition-bar">
                    <div
                      className="nutrition-fill fat-fill"
                      style={{ width: `${Math.min((detail.fat / 50) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="nutrition-value">{detail.fat}g</div>
                </div>

                <div className="nutrition-item">
                  <div className="nutrition-label">칼로리</div>
                  <div className="nutrition-bar">
                    <div
                      className="nutrition-fill calorie-fill"
                      style={{ width: `${Math.min((detail.calories / 800) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="nutrition-value">{detail.calories} kcal</div>
                </div>
              </div>

              <div className="nutrition-summary">
                <h4>영양 요약</h4>
                <p>칼로리 · {detail.protein}g 단백질 · {detail.carbs}g 탄수화물 · {detail.fat}g 지방</p>
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="tab-content">
              {detail.nutrition && (
                <div className="info-block">
                  <div className="info-label-bold">주요 성분</div>
                  <div className="info-text">{detail.nutrition}</div>
                </div>
              )}

              {detail.servingSize && (
                <div className="info-block">
                  <div className="info-label-bold">제공량</div>
                  <div className="info-text">{detail.servingSize}</div>
                </div>
              )}

              <div className="info-block">
                <div className="info-label-bold">맵기 수준</div>
                <div className="info-text">{detail.spiceLevel} / 5</div>
              </div>

              {detail.price > 0 && (
                <div className="info-block">
                  <div className="info-label-bold">예상 가격</div>
                  <div className="info-text">{detail.price.toLocaleString()}원</div>
                </div>
              )}

              {detail.preparationTime > 0 && (
                <div className="info-block">
                  <div className="info-label-bold">준비 시간</div>
                  <div className="info-text">약 {detail.preparationTime}분</div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="action-btn secondary" onClick={onClose}>
            닫기
          </button>
          <button className="action-btn primary" onClick={handleShare}>
            공유하기
          </button>
        </div>
      </div>
    </div>
  )
}

export default MenuDetailModal
