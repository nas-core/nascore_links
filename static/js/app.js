// 主应用程序逻辑
class App {
  constructor() {
    this.categories = []
    this.links = []
    this.currentCategory = 'all'
    this.searchMode = false
    this.filteredLinks = []
    this.init()
  }

  async init() {
    try {
      utils.showLoading()

      // 加载数据
      await this.loadCategories()
      await this.loadLinks()

      // 绑定事件
      this.bindEvents()
    } catch (error) {
      utils.showMessage('初始化失败: ' + error.message, 'error')
    } finally {
      utils.hideLoading()
    }
  }

  // 绑定事件
  bindEvents() {
    // 搜索输入
    const searchInput = document.getElementById('searchInput')
    searchInput.addEventListener(
      'input',
      utils.debounce((e) => {
        this.handleSearch(e.target.value)
      }, 300)
    )

    // 清除搜索
    document.getElementById('clearSearchBtn').addEventListener('click', () => {
      this.clearSearch()
    })

    // 快速检索按钮
    document.getElementById('quickSearchBtn').addEventListener('click', () => {
      const query = searchInput.value.trim()
      if (query) {
        this.performQuickSearch(query)
      } else {
        utils.showMessage('请输入搜索关键词', 'warning')
      }
    })

    // Bing搜索按钮
    document.getElementById('bingSearchBtn').addEventListener('click', () => {
      const query = searchInput.value.trim()
      if (query) {
        window.open(`https://www.bing.com/search?q=${encodeURIComponent(query)}`, '_blank')
      } else {
        utils.showMessage('请输入搜索关键词', 'warning')
      }
    })

    // Google搜索按钮
    document.getElementById('googleSearchBtn').addEventListener('click', () => {
      const query = searchInput.value.trim()
      if (query) {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank')
      } else {
        utils.showMessage('请输入搜索关键词', 'warning')
      }
    })

    // 分类切换
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('tab') && !e.target.classList.contains('tab-action')) {
        const categoryId = e.target.dataset.category
        this.switchCategory(categoryId)
      }
    })

    // 链接卡片点击
    document.addEventListener('click', (e) => {
      const linkCard = e.target.closest('.link-card, .public-link-card')
      if (linkCard && !e.target.closest('.link-actions') && !e.target.classList.contains('info-btn')) {
        const url = linkCard.dataset.url
        if (url) {
          window.open(url, '_blank')
        }
      }
    })

    // 信息按钮点击
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('info-btn')) {
        e.stopPropagation()
        const linkCard = e.target.closest('.link-card')
        if (linkCard) {
          this.toggleLinkDetails(linkCard)
        }
      }
    })

    // 分类操作按钮
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('edit-category')) {
        e.stopPropagation()
        const categoryId = parseInt(e.target.dataset.categoryId)
        const category = this.categories.find((c) => c.id === categoryId)
        if (category) {
          window.categoryModal.openEditModal(category)
        }
      }
    })

    // 链接操作按钮
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('edit-link')) {
        e.stopPropagation()
        const linkId = parseInt(e.target.dataset.linkId)
        const link = this.links.find((l) => l.id === linkId)
        if (link) {
          window.linkModal.openEditModal(link)
        }
      }
    })

    // 鼠标悬停显示工具提示
    document.addEventListener(
      'mouseenter',
      (e) => {
        if (e.target.classList.contains('link-card') || e.target.classList.contains('public-link-card')) {
          this.showTooltip(e.target, e)
        }
      },
      true
    )

    document.addEventListener(
      'mouseleave',
      (e) => {
        if (e.target.classList.contains('link-card') || e.target.classList.contains('public-link-card')) {
          this.hideTooltip()
        }
      },
      true
    )
  }

  // 处理搜索
  handleSearch(query) {
    const clearBtn = document.getElementById('clearSearchBtn')

    if (query.trim()) {
      clearBtn.style.display = 'block'
      this.searchMode = true
      this.performQuickSearch(query)
    } else {
      clearBtn.style.display = 'none'
      this.clearSearch()
    }
  }

  // 执行快速搜索
  performQuickSearch(query) {
    const lowerQuery = query.toLowerCase()

    this.filteredLinks = this.links.filter((link) => {
      return (
        link.title.toLowerCase().includes(lowerQuery) ||
        link.description.toLowerCase().includes(lowerQuery) ||
        link.url.toLowerCase().includes(lowerQuery)
      )
    })

    this.searchMode = true
    this.renderSearchResults()

    if (this.filteredLinks.length === 0) {
      utils.showMessage('未找到匹配的链接', 'info')
    }
  }

  // 清除搜索
  clearSearch() {
    document.getElementById('searchInput').value = ''
    document.getElementById('clearSearchBtn').style.display = 'none'
    this.searchMode = false
    this.filteredLinks = []
    this.renderLinks()
  }

  // 显示工具提示
  showTooltip(element, event) {
    const url = element.dataset.url
    const description = element.dataset.description

    if (!url && !description) return

    // 移除现有工具提示
    this.hideTooltip()

    const tooltip = document.createElement('div')
    tooltip.className = 'tooltip'
    tooltip.innerHTML = `
      ${url ? `<div><strong>网址:</strong> ${url}</div>` : ''}
      ${description ? `<div><strong>描述:</strong> ${description}</div>` : ''}
    `

    document.body.appendChild(tooltip)

    // 定位工具提示
    const rect = element.getBoundingClientRect()
    tooltip.style.left = rect.left + 'px'
    tooltip.style.top = rect.bottom + 10 + 'px'

    // 确保工具提示在视窗内
    const tooltipRect = tooltip.getBoundingClientRect()
    if (tooltipRect.right > window.innerWidth) {
      tooltip.style.left = window.innerWidth - tooltipRect.width - 10 + 'px'
    }
    if (tooltipRect.bottom > window.innerHeight) {
      tooltip.style.top = rect.top - tooltipRect.height - 10 + 'px'
    }

    this.currentTooltip = tooltip
  }

  // 隐藏工具提示
  hideTooltip() {
    if (this.currentTooltip) {
      this.currentTooltip.remove()
      this.currentTooltip = null
    }
  }

  // 切换链接详情显示
  toggleLinkDetails(linkCard) {
    const details = linkCard.querySelector('.link-details')
    if (details) {
      details.classList.toggle('show')
    }
  }

  // 加载分类
  async loadCategories() {
    try {
      this.categories = await api.getCategories()
      this.renderCategories()

      // 更新链接模态框的分类选项
      window.linkModal.updateCategoryOptions(this.categories)
    } catch (error) {
      utils.showMessage('加载分类失败: ' + error.message, 'error')
    }
  }

  // 加载链接
  async loadLinks() {
    try {
      this.links = await api.getLinks()
      this.renderLinks()
    } catch (error) {
      utils.showMessage('加载链接失败: ' + error.message, 'error')
    }
  }

  // 渲染分类标签
  renderCategories() {
    const tabsContainer = document.getElementById('categoryTabs')

    // 清空现有标签（保留"全部"标签）
    tabsContainer.innerHTML = '<div class="tab active" data-category="all">全部</div>'

    // 添加分类标签
    this.categories.forEach((category) => {
      const tab = this.createCategoryTab(category)
      tabsContainer.appendChild(tab)
    })

    // 更新当前选中状态
    this.updateTabSelection()
  }

  // 创建分类标签
  createCategoryTab(category) {
    const tab = document.createElement('div')
    tab.className = 'tab'
    tab.dataset.category = category.id

    // 标签内容
    const tabContent = document.createElement('span')
    tabContent.textContent = category.name
    tab.appendChild(tabContent)

    // 如果是当前用户创建的分类或者是管理员，显示编辑按钮
    if (category.user_id === window.appData.user || window.appData.isAdmin) {
      const actions = document.createElement('div')
      actions.className = 'tab-actions'

      const editBtn = document.createElement('button')
      editBtn.className = 'tab-action edit-category'
      editBtn.innerHTML = '✎'
      editBtn.title = '编辑分类'
      editBtn.dataset.categoryId = category.id

      actions.appendChild(editBtn)
      tab.appendChild(actions)
    }

    return tab
  }

  // 切换分类
  async switchCategory(categoryId) {
    this.currentCategory = categoryId
    window.appData.currentCategory = categoryId

    this.updateTabSelection()
    this.renderLinks()
  }

  // 更新标签选中状态
  updateTabSelection() {
    const tabs = document.querySelectorAll('.tab')
    tabs.forEach((tab) => {
      tab.classList.remove('active')
      if (tab.dataset.category === this.currentCategory) {
        tab.classList.add('active')
      }
    })
  }

  // 渲染链接
  renderLinks() {
    if (this.searchMode) {
      this.renderSearchResults()
      return
    }

    // 分离公共链接和分类链接
    const publicLinks = this.links.filter((link) => link.is_public)
    const categoryLinks = this.getCategoryLinks()

    this.renderPublicLinks(publicLinks)
    this.renderCategoryLinks(categoryLinks)
  }

  // 获取当前分类的链接
  getCategoryLinks() {
    return this.links.filter((link) => {
      if (this.currentCategory === 'all') {
        return true
      }
      return link.category_id === parseInt(this.currentCategory)
    })
  }

  // 渲染公共链接
  renderPublicLinks(links) {
    const publicLinksContainer = document.getElementById('publicLinks')

    if (links.length === 0) {
      publicLinksContainer.innerHTML = `
        <div class="empty-state">
          <p>暂无公共链接</p>
        </div>
      `
      return
    }

    publicLinksContainer.innerHTML = ''

    links.forEach((link) => {
      const linkCard = this.createPublicLinkCard(link)
      publicLinksContainer.appendChild(linkCard)
    })
  }

  // 渲染分类链接
  renderCategoryLinks(links) {
    const linksGrid = document.getElementById('linksGrid')

    if (links.length === 0) {
      linksGrid.innerHTML = `
        <div class="empty-state">
          <h3>暂无链接</h3>
          <p>点击"+ 添加链接"按钮添加你的第一个链接</p>
        </div>
      `
      return
    }

    linksGrid.innerHTML = ''

    links.forEach((link) => {
      const linkCard = this.createLinkCard(link)
      linksGrid.appendChild(linkCard)
    })
  }

  // 渲染搜索结果
  renderSearchResults() {
    const publicLinksContainer = document.getElementById('publicLinks')
    const linksGrid = document.getElementById('linksGrid')

    if (this.filteredLinks.length === 0) {
      publicLinksContainer.innerHTML = ''
      linksGrid.innerHTML = `
        <div class="empty-state">
          <h3>未找到匹配的链接</h3>
          <p>尝试其他关键词搜索</p>
        </div>
      `
      return
    }

    // 分离搜索结果中的公共链接和其他链接
    const publicLinks = this.filteredLinks.filter((link) => link.is_public)
    const otherLinks = this.filteredLinks.filter((link) => !link.is_public)

    this.renderPublicLinks(publicLinks)

    // 渲染其他搜索结果
    linksGrid.innerHTML = ''
    otherLinks.forEach((link) => {
      const linkCard = this.createLinkCard(link)
      linksGrid.appendChild(linkCard)
    })
  }

  // 创建公共链接卡片
  createPublicLinkCard(link) {
    const card = document.createElement('div')
    card.className = 'public-link-card'
    card.dataset.url = link.url
    card.dataset.description = link.description

    card.innerHTML = `
      <div class="link-title">${this.escapeHtml(link.title)}</div>
      <div class="link-domain">${utils.extractDomain(link.url)}</div>
    `

    // 如果是当前用户创建的链接或者是管理员，显示操作按钮
    if (link.user_id === window.appData.user || window.appData.isAdmin) {
      const actions = document.createElement('div')
      actions.className = 'link-actions'

      const editBtn = document.createElement('button')
      editBtn.className = 'link-action edit-link'
      editBtn.innerHTML = '✎'
      editBtn.title = '编辑链接'
      editBtn.dataset.linkId = link.id

      actions.appendChild(editBtn)
      card.appendChild(actions)
    }

    return card
  }

  // 创建链接卡片
  createLinkCard(link) {
    const card = document.createElement('div')
    card.className = 'link-card'
    card.dataset.url = link.url
    card.dataset.description = link.description

    // 获取分类名称
    const category = this.categories.find((c) => c.id === link.category_id)
    const categoryName = category ? category.name : '未分类'

    // 卡片内容
    card.innerHTML = `
      <div class="link-header">
        <div class="link-title">${this.escapeHtml(link.title)}</div>
        <button class="info-btn" title="显示详情">ℹ</button>
      </div>
      <div class="link-details">
        <div class="link-url">${link.url}</div>
        ${link.description ? `<div class="link-description">${this.escapeHtml(link.description)}</div>` : ''}
      </div>
      <div class="link-meta">
        <span>分类: ${this.escapeHtml(categoryName)}</span>
        <span>${utils.formatDate(link.created_at)}</span>
      </div>
    `

    // 如果是当前用户创建的链接或者是管理员，显示操作按钮
    if (link.user_id === window.appData.user || window.appData.isAdmin) {
      const actions = document.createElement('div')
      actions.className = 'link-actions'

      const editBtn = document.createElement('button')
      editBtn.className = 'link-action edit-link'
      editBtn.innerHTML = '✎'
      editBtn.title = '编辑链接'
      editBtn.dataset.linkId = link.id

      actions.appendChild(editBtn)
      card.appendChild(actions)
    }

    // 添加公开标识
    if (link.is_public) {
      const badge = document.createElement('div')
      badge.className = 'public-badge'
      badge.textContent = '公开'
      badge.style.cssText = `
        position: absolute;
        top: 8px;
        left: 8px;
        background: #4caf50;
        color: white;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 0.7em;
        font-weight: bold;
      `
      card.style.position = 'relative'
      card.appendChild(badge)
    }

    return card
  }

  // HTML转义
  escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  // 刷新数据
  async refresh() {
    try {
      utils.showLoading()
      await this.loadCategories()
      await this.loadLinks()
      utils.showMessage('数据已刷新', 'success')
    } catch (error) {
      utils.showMessage('刷新失败: ' + error.message, 'error')
    } finally {
      utils.hideLoading()
    }
  }

  // 导出数据
  exportData() {
    const data = {
      categories: this.categories,
      links: this.links,
      exportTime: new Date().toISOString(),
      user: window.appData.user,
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nascore-links-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    utils.showMessage('数据导出成功', 'success')
  }
}

// 键盘快捷键
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + K: 快速搜索
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    document.getElementById('searchInput').focus()
  }

  // Ctrl/Cmd + N: 添加新链接
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault()
    window.linkModal.openAddModal()
  }

  // Ctrl/Cmd + Shift + N: 添加新分类
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
    e.preventDefault()
    window.categoryModal.openAddModal()
  }

  // F5: 刷新
  if (e.key === 'F5') {
    e.preventDefault()
    window.app.refresh()
  }

  // ESC: 清除搜索
  if (e.key === 'Escape') {
    if (window.app.searchMode) {
      window.app.clearSearch()
    }
  }
})

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App()
})

// 页面可见性变化时刷新数据
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && window.app) {
    // 页面重新可见时，延迟刷新数据
    setTimeout(() => {
      window.app.loadLinks()
    }, 1000)
  }
})

// 在线状态检测
window.addEventListener('online', () => {
  utils.showMessage('网络连接已恢复', 'success')
  if (window.app) {
    window.app.refresh()
  }
})

window.addEventListener('offline', () => {
  utils.showMessage('网络连接已断开', 'warning')
})
