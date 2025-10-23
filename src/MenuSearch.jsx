import React, { useState, useEffect, useRef } from 'react'
import {
  searchMenus,
  getAutocompleteSuggestions,
  recordSearchHistory,
  getSearchHistory,
  clearSearchHistory,
  getAllAvailableTags,
  recordMenuView
} from './searchManager'
import { menuData } from './menuData'
import './MenuSearch.css'

/**
 * MenuSearch Component - 고급 메뉴 검색 및 자동완성
 */
function MenuSearch({ onSelectMenu, onShowDetail }) {
  // 검색 상태
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchHistory, setSearchHistory] = useState([])
  
  // 필터 상태
  const [filters, setFilters] = useState({
    category: '전체',
    tags: []
  })
  const [showFilters, setShowFilters] = useState(false)
  const [availableTags, setAvailableTags] = useState([])
  
  // 검색 결과
  const [searchResults, setSearchResults] = useState([])
  const [hasSearched, setHasSearched] = useState(false)
  
  // ref
  const searchInputRef = useRef(null)
  const suggestionsRef = useRef(null)
  
  // 드롭다운 위치
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  
  // 초기화
  useEffect(() => {
    setSearchHistory(getSearchHistory())
    setAvailableTags(getAllAvailableTags())
  }, [])
  
  // 드롭다운 위치 계산
  useEffect(() => {
    if (searchInputRef.current) {
      const rect = searchInputRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      })
    }
  }, [showSuggestions])
  
  // 검색어 변경 시 자동완성 업데이트
  useEffect(() => {
    if (searchQuery.trim()) {
      const suggestions = getAutocompleteSuggestions(searchQuery, 8)
      setSuggestions(suggestions)
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      // 빈 검색어면 최근 검색 표시
      if (searchHistory.length > 0) {
        setShowSuggestions(true)
      }
    }
  }, [searchQuery])
  
  // 외부 클릭 시 자동완성 닫기
  useEffect(() => {
    function handleClickOutside(e) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) &&
          searchInputRef.current && !searchInputRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  /**
   * 검색 수행
   */
  const handleSearch = (query = searchQuery) => {
    if (!query.trim()) {
      setSearchResults([])
      setHasSearched(false)
      return
    }
    
    recordSearchHistory(query)
    setSearchHistory(getSearchHistory())
    
    const results = searchMenus(query, {
      category: filters.category === '전체' ? undefined : filters.category,
      tags: filters.tags
    })
    
    setSearchResults(results)
    setHasSearched(true)
    setShowSuggestions(false)
  }
  
  /**
   * 검색어 입력 핸들러
   */
  const handleInputChange = (e) => {
    setSearchQuery(e.target.value)
  }
  
  /**
   * 검색 입력 포커스
   */
  const handleInputFocus = () => {
    if (searchQuery.trim() === '' && searchHistory.length > 0) {
      setShowSuggestions(true)
    }
  }
  
  /**
   * 제안 또는 최근 검색 클릭
   */
  const handleSuggestionClick = (item) => {
    let newQuery = searchQuery
    
    if (item.type === 'menu') {
      newQuery = item.menu
      setSearchQuery(item.menu)
    } else if (item.type === 'tag') {
      newQuery = item.text
      setSearchQuery(item.text)
    } else if (item.type === 'category') {
      setFilters(prev => ({ ...prev, category: item.category }))
      newQuery = ''
      setSearchQuery('')
    } else if (item.type === 'history') {
      newQuery = item
      setSearchQuery(item)
    }
    
    setShowSuggestions(false)
    handleSearch(newQuery)
  }
  
  /**
   * 필터 변경
   */
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
    
    // 필터 변경 시 자동으로 검색 다시 수행
    if (hasSearched) {
      setTimeout(() => {
        handleSearch(searchQuery)
      }, 0)
    }
  }
  
  /**
   * 태그 토글
   */
  const handleTagToggle = (tag) => {
    setFilters(prev => {
      const newTags = prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
      return { ...prev, tags: newTags }
    })
  }
  
  /**
   * 필터 초기화
   */
  const handleResetFilters = () => {
    setFilters({
      category: '전체',
      tags: []
    })
    
    if (hasSearched) {
      setTimeout(() => {
        handleSearch(searchQuery)
      }, 0)
    }
  }
  
  /**
   * 최근 검색 초기화
   */
  const handleClearHistory = () => {
    clearSearchHistory()
    setSearchHistory([])
  }
  
  /**
   * 메뉴 결과 클릭
   */
  const handleResultClick = (item) => {
    recordMenuView(item.category, item.menu)
    if (onSelectMenu) {
      onSelectMenu(item.category, item.menu)
    }
    if (onShowDetail) {
      onShowDetail(item.category, item.menu)
    }
  }
  
  /**
   * 엔터 키 처리
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }
  
  return (
    <div className="menu-search">
      {/* 검색 입력 영역 */}
      <div className="search-input-container">
        <input
          ref={searchInputRef}
          type="text"
          className="search-input"
          placeholder="메뉴명, 재료, 태그로 검색..."
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          aria-label="메뉴 검색"
        />
        <button
          className="search-button"
          onClick={() => handleSearch()}
          aria-label="검색 버튼"
          title="검색"
        >
          🔍
        </button>
        <button
          className="filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
          aria-label="필터 토글"
          title="필터 표시/숨기기"
        >
          {showFilters ? '✕' : '⚙️'}
        </button>
      </div>
      
      {/* 자동완성 드롭다운 */}
      {showSuggestions && (
        <div 
          className="suggestions-dropdown" 
          ref={suggestionsRef}
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`
          }}
        >
          {/* 제안된 항목 */}
          {suggestions.length > 0 && (
            <div className="suggestions-group">
              <div className="suggestions-header">추천</div>
              {suggestions.map((item, idx) => (
                <div
                  key={idx}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(item)}
                >
                  <span className="suggestion-icon">
                    {item.type === 'menu' ? '🍽️' : item.type === 'tag' ? '🏷️' : '📂'}
                  </span>
                  <div className="suggestion-content">
                    <div className="suggestion-text">{item.text}</div>
                    {item.category && item.type === 'menu' && (
                      <div className="suggestion-category">{item.category}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* 최근 검색 */}
          {searchQuery.trim() === '' && searchHistory.length > 0 && (
            <div className="suggestions-group">
              <div className="suggestions-header">
                최근 검색
                <button
                  className="clear-history-btn"
                  onClick={handleClearHistory}
                  title="최근 검색 초기화"
                >
                  ✕
                </button>
              </div>
              {searchHistory.slice(0, 5).map((query, idx) => (
                <div
                  key={idx}
                  className="suggestion-item history-item"
                  onClick={() => handleSuggestionClick({ type: 'history', text: query })}
                >
                  <span className="suggestion-icon">🕐</span>
                  <div className="suggestion-content">
                    <div className="suggestion-text">{query}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* 필터 패널 */}
      {showFilters && (
        <div className="filters-panel">
          {/* 카테고리 필터 */}
          <div className="filter-group">
            <label className="filter-label">카테고리</label>
            <div className="category-buttons">
              <button
                className={`category-btn ${filters.category === '전체' ? 'active' : ''}`}
                onClick={() => handleFilterChange('category', '전체')}
              >
                전체
              </button>
              {Object.keys(menuData).map(category => (
                <button
                  key={category}
                  className={`category-btn ${filters.category === category ? 'active' : ''}`}
                  onClick={() => handleFilterChange('category', category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          
          {/* 태그 필터 */}
          <div className="filter-group">
            <label className="filter-label">태그</label>
            <div className="tags-container">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  className={`tag-button ${filters.tags.includes(tag) ? 'active' : ''}`}
                  onClick={() => handleTagToggle(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          
          {/* 필터 버튼 */}
          <div className="filter-buttons">
            <button className="reset-btn" onClick={handleResetFilters}>
              필터 초기화
            </button>
          </div>
        </div>
      )}
      
      {/* 검색 결과 */}
      {hasSearched && (
        <div className="search-results">
          {searchResults.length > 0 ? (
            <>
              <div className="results-info">
                총 <strong>{searchResults.length}</strong>개의 결과
              </div>
              <div className="results-grid">
                {searchResults.map((item, idx) => (
                  <div
                    key={idx}
                    className="result-card"
                    onClick={() => handleResultClick(item)}
                  >
                    <div className="result-category-badge">{item.category}</div>
                    <div className="result-menu-name">{item.menu}</div>
                    <div className="result-info-row">
                      <span className="result-info-item">
                        💰 {item.detail.price.toLocaleString()}원
                      </span>
                      <span className="result-info-item">
                        🔥 {item.detail.calories}kcal
                      </span>
                    </div>
                    <div className="result-info-row">
                      <span className="result-info-item">
                        ⏱️ {item.detail.preparationTime}분
                      </span>
                    </div>
                    {item.detail.tags && item.detail.tags.length > 0 && (
                      <div className="result-tags">
                        {item.detail.tags.slice(0, 2).map((tag, i) => (
                          <span key={i} className="result-tag">
                            {tag}
                          </span>
                        ))}
                        {item.detail.tags.length > 2 && (
                          <span className="result-tag">
                            +{item.detail.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="no-results">
              <div className="no-results-icon">🔍</div>
              <div className="no-results-text">
                검색 결과가 없습니다.
                <br />
                다른 검색어나 필터를 시도해보세요.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MenuSearch
