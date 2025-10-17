import { useState, useEffect } from 'react'
import './MenuManager.css'

function MenuManager({ isOpen, onClose, menuData, onSaveMenus }) {
  const [selectedCategory, setSelectedCategory] = useState('한식')
  const [editingMenus, setEditingMenus] = useState({})
  const [newMenuInput, setNewMenuInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // menuData가 변경될 때마다 editingMenus 업데이트
  useEffect(() => {
    if (menuData) {
      setEditingMenus(JSON.parse(JSON.stringify(menuData)))
    }
  }, [menuData])

  // 모달이 열릴 때 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  if (!isOpen) return null

  const categories = Object.keys(editingMenus)
  const currentMenus = editingMenus[selectedCategory] || []

  // 메뉴를 가나다순으로 정렬
  const sortedMenus = [...currentMenus].sort((a, b) => a.localeCompare(b, 'ko-KR'))

  // 검색 필터링
  const filteredMenus = searchTerm
    ? sortedMenus.filter(menu => menu.includes(searchTerm))
    : sortedMenus

  // 메뉴 추가
  const handleAddMenu = () => {
    const trimmedMenu = newMenuInput.trim()
    if (!trimmedMenu) {
      alert('메뉴 이름을 입력해주세요!')
      return
    }

    if (currentMenus.includes(trimmedMenu)) {
      alert('이미 존재하는 메뉴입니다!')
      return
    }

    setEditingMenus(prev => ({
      ...prev,
      [selectedCategory]: [...prev[selectedCategory], trimmedMenu]
    }))
    setNewMenuInput('')
  }

  // 메뉴 삭제
  const handleDeleteMenu = (menuToDelete) => {
    if (confirm(`'${menuToDelete}'를 삭제하시겠습니까?`)) {
      setEditingMenus(prev => ({
        ...prev,
        [selectedCategory]: prev[selectedCategory].filter(menu => menu !== menuToDelete)
      }))
    }
  }

  // 메뉴 수정 (인라인 편집)
  const handleEditMenu = (oldMenu, newMenu) => {
    const trimmedMenu = newMenu.trim()
    if (!trimmedMenu) {
      alert('메뉴 이름은 비어있을 수 없습니다!')
      return
    }

    if (trimmedMenu === oldMenu) return

    if (currentMenus.includes(trimmedMenu)) {
      alert('이미 존재하는 메뉴입니다!')
      return
    }

    setEditingMenus(prev => ({
      ...prev,
      [selectedCategory]: prev[selectedCategory].map(menu =>
        menu === oldMenu ? trimmedMenu : menu
      )
    }))
  }

  // 저장
  const handleSave = () => {
    // 빈 카테고리 확인
    const emptyCategories = categories.filter(cat => editingMenus[cat].length === 0)
    if (emptyCategories.length > 0) {
      if (!confirm(`${emptyCategories.join(', ')} 카테고리에 메뉴가 없습니다. 계속하시겠습니까?`)) {
        return
      }
    }

    onSaveMenus(editingMenus)
    onClose()
  }

  // 초기화
  const handleReset = () => {
    if (confirm('모든 변경사항을 취소하고 원래 메뉴로 되돌리시겠습니까?')) {
      setEditingMenus(JSON.parse(JSON.stringify(menuData)))
    }
  }

  // Enter 키로 메뉴 추가
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddMenu()
    }
  }

  return (
    <div className="menu-manager-overlay" onClick={onClose}>
      <div className="menu-manager-modal" onClick={e => e.stopPropagation()}>
        <div className="menu-manager-header">
          <h2>🔧 메뉴 관리</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="menu-manager-body">
          {/* 카테고리 탭 */}
          <div className="category-tabs">
            {categories.map(category => (
              <button
                key={category}
                className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCategory(category)
                  setSearchTerm('')
                }}
              >
                {category}
                <span className="menu-count">({editingMenus[category]?.length || 0})</span>
              </button>
            ))}
          </div>

          {/* 메뉴 추가 영역 */}
          <div className="add-menu-section">
            <input
              type="text"
              className="menu-input"
              placeholder={`${selectedCategory} 메뉴 추가...`}
              value={newMenuInput}
              onChange={e => setNewMenuInput(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button className="add-btn" onClick={handleAddMenu}>
              ➕ 추가
            </button>
          </div>

          {/* 검색 바 */}
          <div className="search-section">
            <input
              type="text"
              className="search-input"
              placeholder="메뉴 검색..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-search-btn" onClick={() => setSearchTerm('')}>
                ✕
              </button>
            )}
          </div>

          {/* 메뉴 리스트 */}
          <div className="menu-list">
            {filteredMenus.length > 0 ? (
              filteredMenus.map((menu, index) => (
                <MenuItem
                  key={`${menu}-${index}`}
                  menu={menu}
                  onDelete={handleDeleteMenu}
                  onEdit={handleEditMenu}
                />
              ))
            ) : (
              <div className="empty-message">
                {searchTerm ? '검색 결과가 없습니다.' : '메뉴가 없습니다. 추가해보세요!'}
              </div>
            )}
          </div>

          {/* 통계 정보 */}
          <div className="stats-section">
            <div className="stat-item">
              <span className="stat-label">현재 카테고리:</span>
              <span className="stat-value">{currentMenus.length}개</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">전체 메뉴:</span>
              <span className="stat-value">
                {Object.values(editingMenus).reduce((sum, menus) => sum + menus.length, 0)}개
              </span>
            </div>
          </div>
        </div>

        <div className="menu-manager-footer">
          <button className="reset-btn" onClick={handleReset}>
            🔄 초기화
          </button>
          <div className="action-buttons">
            <button className="cancel-btn" onClick={onClose}>
              취소
            </button>
            <button className="save-btn" onClick={handleSave}>
              💾 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 개별 메뉴 아이템 컴포넌트
function MenuItem({ menu, onDelete, onEdit }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(menu)

  const handleSaveEdit = () => {
    onEdit(menu, editValue)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditValue(menu)
    setIsEditing(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  return (
    <div className="menu-item">
      {isEditing ? (
        <>
          <input
            type="text"
            className="menu-edit-input"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onKeyDown={handleKeyPress}
            autoFocus
          />
          <div className="menu-item-actions">
            <button className="save-edit-btn" onClick={handleSaveEdit} title="저장">
              ✓
            </button>
            <button className="cancel-edit-btn" onClick={handleCancelEdit} title="취소">
              ✕
            </button>
          </div>
        </>
      ) : (
        <>
          <span className="menu-name">{menu}</span>
          <div className="menu-item-actions">
            <button className="edit-btn" onClick={() => setIsEditing(true)} title="수정">
              ✏️
            </button>
            <button className="delete-btn" onClick={() => onDelete(menu)} title="삭제">
              🗑️
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default MenuManager
