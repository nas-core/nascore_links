// 模态框管理模块
class ModalManager {
  constructor() {
    this.modals = new Map()
    this.init()
  }

  init() {
    // 绑定关闭事件
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.closeModal(e.target.id)
      }
    })

    // ESC键关闭模态框
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals()
      }
    })
  }

  // 打开模态框
  openModal(modalId) {
    const modal = document.getElementById(modalId)
    if (modal) {
      modal.style.display = 'block'
      document.body.style.overflow = 'hidden'

      // 聚焦到第一个输入框
      const firstInput = modal.querySelector('input, textarea, select')
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100)
      }
    }
  }

  // 关闭模态框
  closeModal(modalId) {
    const modal = document.getElementById(modalId)
    if (modal) {
      modal.style.display = 'none'
      document.body.style.overflow = ''

      // 清空表单
      const form = modal.querySelector('form')
      if (form) {
        form.reset()
        // 清空隐藏字段
        const hiddenInputs = form.querySelectorAll('input[type="hidden"]')
        hiddenInputs.forEach((input) => (input.value = ''))
      }
    }
  }

  // 关闭所有模态框
  closeAllModals() {
    const modals = document.querySelectorAll('.modal')
    modals.forEach((modal) => {
      if (modal.style.display === 'block') {
        this.closeModal(modal.id)
      }
    })
  }

  // 设置模态框标题
  setModalTitle(modalId, title) {
    const modal = document.getElementById(modalId)
    if (modal) {
      const titleEl = modal.querySelector('.modal-header h3')
      if (titleEl) {
        titleEl.textContent = title
      }
    }
  }

  // 填充表单数据
  fillForm(modalId, data) {
    const modal = document.getElementById(modalId)
    if (!modal) return

    const form = modal.querySelector('form')
    if (!form) return

    Object.keys(data).forEach((key) => {
      const input = form.querySelector(`[name="${key}"]`)
      if (input) {
        if (input.type === 'checkbox') {
          input.checked = Boolean(data[key])
        } else {
          input.value = data[key] || ''
        }
      }
    })
  }

  // 获取表单数据
  getFormData(modalId) {
    const modal = document.getElementById(modalId)
    if (!modal) return {}

    const form = modal.querySelector('form')
    if (!form) return {}

    const formData = new FormData(form)
    const data = {}

    for (let [key, value] of formData.entries()) {
      // 处理数字类型
      if (key.includes('_num') || key === 'id' || key === 'category_id') {
        data[key] = value ? parseInt(value) : 0
      } else {
        data[key] = value
      }
    }

    // 处理复选框
    const checkboxes = form.querySelectorAll('input[type="checkbox"]')
    checkboxes.forEach((checkbox) => {
      data[checkbox.name] = checkbox.checked
    })

    return data
  }

  // 验证表单
  validateForm(modalId) {
    const modal = document.getElementById(modalId)
    if (!modal) return false

    const form = modal.querySelector('form')
    if (!form) return false

    const requiredInputs = form.querySelectorAll('[required]')
    let isValid = true

    requiredInputs.forEach((input) => {
      if (!input.value.trim()) {
        input.style.borderColor = '#f44336'
        isValid = false
      } else {
        input.style.borderColor = '#555'
      }
    })

    // URL 验证
    const urlInput = form.querySelector('input[type="url"]')
    if (urlInput && urlInput.value) {
      if (!utils.isValidUrl(urlInput.value)) {
        urlInput.style.borderColor = '#f44336'
        utils.showMessage('请输入有效的网址', 'error')
        isValid = false
      } else {
        urlInput.style.borderColor = '#555'
      }
    }

    return isValid
  }
}

// 分类模态框管理
class CategoryModal {
  constructor(modalManager) {
    this.modalManager = modalManager
    this.currentCategory = null
    this.init()
  }

  init() {
    // 添加分类按钮
    document.getElementById('addCategoryBtn').addEventListener('click', () => {
      this.openAddModal()
    })

    // 关闭按钮
    document.getElementById('closeCategoryModal').addEventListener('click', () => {
      this.modalManager.closeModal('categoryModal')
    })

    // 取消按钮
    document.getElementById('cancelCategoryEdit').addEventListener('click', () => {
      this.modalManager.closeModal('categoryModal')
    })

    // 删除按钮
    document.getElementById('deleteCategoryBtn').addEventListener('click', async () => {
      await this.deleteCategory()
    })

    // 表单提交
    document.getElementById('categoryForm').addEventListener('submit', async (e) => {
      e.preventDefault()
      await this.saveCategory()
    })
  }

  // 打开添加模态框
  openAddModal() {
    this.currentCategory = null
    this.modalManager.setModalTitle('categoryModal', '添加分类')
    document.getElementById('deleteCategoryBtn').style.display = 'none'

    // 管理员默认选中公开
    const isPublicCheckbox = document.getElementById('categoryIsPublic')
    if (isPublicCheckbox && window.appData.isAdmin) {
      isPublicCheckbox.checked = true
    }

    this.modalManager.openModal('categoryModal')
  }

  // 打开编辑模态框
  openEditModal(category) {
    this.currentCategory = category
    this.modalManager.setModalTitle('categoryModal', '编辑分类')
    document.getElementById('deleteCategoryBtn').style.display = 'inline-block'
    this.modalManager.fillForm('categoryModal', category)
    this.modalManager.openModal('categoryModal')
  }

  // 保存分类
  async saveCategory() {
    if (!this.modalManager.validateForm('categoryModal')) {
      return
    }

    const data = this.modalManager.getFormData('categoryModal')

    try {
      utils.showLoading()

      if (this.currentCategory) {
        await api.updateCategory(data)
        utils.showMessage('分类更新成功', 'success')
      } else {
        await api.createCategory(data)
        utils.showMessage('分类创建成功', 'success')
      }

      this.modalManager.closeModal('categoryModal')
      await window.app.loadCategories()
    } catch (error) {
      utils.showMessage(error.message, 'error')
    } finally {
      utils.hideLoading()
    }
  }

  // 删除分类
  async deleteCategory() {
    if (!this.currentCategory) return

    const confirmed = await utils.confirm('确定要删除这个分类吗？删除后分类下的所有链接也会被删除！')
    if (!confirmed) return

    try {
      utils.showLoading()

      await api.deleteCategory(this.currentCategory.id)
      utils.showMessage('分类删除成功', 'success')

      this.modalManager.closeModal('categoryModal')
      await window.app.loadCategories()
    } catch (error) {
      utils.showMessage(error.message, 'error')
    } finally {
      utils.hideLoading()
    }
  }
}

// 链接模态框管理
class LinkModal {
  constructor(modalManager) {
    this.modalManager = modalManager
    this.currentLink = null
    this.init()
  }

  init() {
    // 添加链接按钮
    document.getElementById('addLinkBtn').addEventListener('click', () => {
      this.openAddModal()
    })

    // 关闭按钮
    document.getElementById('closeLinkModal').addEventListener('click', () => {
      this.modalManager.closeModal('linkModal')
    })

    // 取消按钮
    document.getElementById('cancelLinkEdit').addEventListener('click', () => {
      this.modalManager.closeModal('linkModal')
    })

    // 删除按钮
    document.getElementById('deleteLinkBtn').addEventListener('click', async () => {
      await this.deleteLink()
    })

    // 表单提交
    document.getElementById('linkForm').addEventListener('submit', async (e) => {
      e.preventDefault()
      await this.saveLink()
    })
  }

  // 打开添加模态框
  openAddModal() {
    this.currentLink = null
    this.modalManager.setModalTitle('linkModal', '添加链接')
    document.getElementById('deleteLinkBtn').style.display = 'none'

    // 设置默认分类
    const categorySelect = document.getElementById('linkCategory')
    if (window.appData.currentCategory !== 'all') {
      categorySelect.value = window.appData.currentCategory
    }

    // 管理员默认选中公开
    const isPublicCheckbox = document.getElementById('linkIsPublic')
    if (isPublicCheckbox && window.appData.isAdmin) {
      isPublicCheckbox.checked = true
    }

    this.modalManager.openModal('linkModal')
  }

  // 打开编辑模态框
  openEditModal(link) {
    this.currentLink = link
    this.modalManager.setModalTitle('linkModal', '编辑链接')
    document.getElementById('deleteLinkBtn').style.display = 'inline-block'
    this.modalManager.fillForm('linkModal', link)
    this.modalManager.openModal('linkModal')
  }

  // 更新分类选项
  updateCategoryOptions(categories) {
    const select = document.getElementById('linkCategory')
    select.innerHTML = '<option value="">选择分类</option>'

    categories.forEach((category) => {
      const option = document.createElement('option')
      option.value = category.id
      option.textContent = category.name
      select.appendChild(option)
    })
  }

  // 保存链接
  async saveLink() {
    if (!this.modalManager.validateForm('linkModal')) {
      return
    }

    const data = this.modalManager.getFormData('linkModal')

    try {
      utils.showLoading()

      if (this.currentLink) {
        await api.updateLink(data)
        utils.showMessage('链接更新成功', 'success')
      } else {
        await api.createLink(data)
        utils.showMessage('链接创建成功', 'success')
      }

      this.modalManager.closeModal('linkModal')
      await window.app.loadLinks()
    } catch (error) {
      utils.showMessage(error.message, 'error')
    } finally {
      utils.hideLoading()
    }
  }

  // 删除链接
  async deleteLink() {
    if (!this.currentLink) return

    const confirmed = await utils.confirm('确定要删除这个链接吗？')
    if (!confirmed) return

    try {
      utils.showLoading()

      await api.deleteLink(this.currentLink.id)
      utils.showMessage('链接删除成功', 'success')

      this.modalManager.closeModal('linkModal')
      await window.app.loadLinks()
    } catch (error) {
      utils.showMessage(error.message, 'error')
    } finally {
      utils.hideLoading()
    }
  }
}

// 创建全局实例
window.modalManager = new ModalManager()
window.categoryModal = new CategoryModal(window.modalManager)
window.linkModal = new LinkModal(window.modalManager)
