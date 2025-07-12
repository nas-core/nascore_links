package main

import (
	"database/sql"
	"embed"
	"encoding/json"
	"html/template"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"go.uber.org/zap"
	_ "modernc.org/sqlite"
)

//go:embed static/* templates/*
var embedFS embed.FS

type App struct {
	db     *sql.DB
	logger *zap.SugaredLogger
	tmpl   *template.Template
}

type Category struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	UserID   string `json:"user_id"`
	IsPublic bool   `json:"is_public"`
	SortNum  int    `json:"sort_num"`
}

type Link struct {
	ID          int    `json:"id"`
	Title       string `json:"title"`
	URL         string `json:"url"`
	Description string `json:"description"`
	CategoryID  int    `json:"category_id"`
	UserID      string `json:"user_id"`
	IsPublic    bool   `json:"is_public"`
	SortNum     int    `json:"sort_num"`
	CreatedAt   string `json:"created_at"`
}

type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
}

func main() {
	logger := zap.NewExample().Sugar()
	defer logger.Sync()

	// 初始化数据库
	db, err := initDB()
	if err != nil {
		logger.Fatalf("[main] Failed to init database: %v", err)
	}
	defer db.Close()

	// 解析模板
	tmpl, err := template.ParseFS(embedFS, "templates/*.html")
	if err != nil {
		logger.Fatalf("[main] Failed to parse templates: %v", err)
	}

	app := &App{
		db:     db,
		logger: logger,
		tmpl:   tmpl,
	}

	// 设置路由
	mux := http.NewServeMux()

	// 静态文件服务
	mux.Handle("/static/", http.FileServer(http.FS(embedFS)))

	// 页面路由
	mux.HandleFunc("/", app.indexHandler)

	// API路由
	mux.HandleFunc("/api/categories", app.categoriesHandler)
	mux.HandleFunc("/api/category", app.categoryHandler)
	mux.HandleFunc("/api/links", app.linksHandler)
	mux.HandleFunc("/api/link", app.linkHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	logger.Infof("[main] Server starting on port %s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		logger.Fatalf("[main] Server failed to start: %v", err)
	}
}

// 初始化数据库
func initDB() (*sql.DB, error) {
	db, err := sql.Open("sqlite", "links.db")
	if err != nil {
		return nil, err
	}

	// 创建表
	queries := []string{
		`CREATE TABLE IF NOT EXISTS categories (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			user_id TEXT NOT NULL,
			is_public BOOLEAN DEFAULT FALSE,
			sort_num INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS links (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL,
			url TEXT NOT NULL,
			description TEXT,
			category_id INTEGER,
			user_id TEXT NOT NULL,
			is_public BOOLEAN DEFAULT FALSE,
			sort_num INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY(category_id) REFERENCES categories(id)
		)`,
	}

	for _, query := range queries {
		if _, err := db.Exec(query); err != nil {
			return nil, err
		}
	}

	return db, nil
}

// 获取当前用户
func (app *App) getCurrentUser(r *http.Request) string {
	user := os.Getenv("USER")
	if user == "" {
		user = "guest"
	}
	return user
}

// 首页处理器
func (app *App) indexHandler(w http.ResponseWriter, r *http.Request) {
	user := app.getCurrentUser(r)
	app.logger.Infof("[handler] User %s accessing index", user)

	data := map[string]interface{}{
		"User":    user,
		"IsAdmin": user == "admin",
	}

	if err := app.tmpl.ExecuteTemplate(w, "index.html", data); err != nil {
		app.logger.Errorf("[handler] Failed to execute template: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

// 分类处理器
func (app *App) categoriesHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method == "GET" {
		app.getCategoriesHandler(w, r)
	} else {
		app.sendResponse(w, 1, "Method not allowed", nil)
	}
}

func (app *App) categoryHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	switch r.Method {
	case "POST":
		app.createCategoryHandler(w, r)
	case "PUT":
		app.updateCategoryHandler(w, r)
	case "DELETE":
		app.deleteCategoryHandler(w, r)
	default:
		app.sendResponse(w, 1, "Method not allowed", nil)
	}
}

// 获取分类
func (app *App) getCategoriesHandler(w http.ResponseWriter, r *http.Request) {
	user := app.getCurrentUser(r)

	query := `SELECT id, name, user_id, is_public, sort_num FROM categories
			  WHERE user_id = ? OR is_public = 1
			  ORDER BY sort_num ASC, name ASC`

	rows, err := app.db.Query(query, user)
	if err != nil {
		app.logger.Errorf("[categories] Query failed: %v", err)
		app.sendResponse(w, 1, "Database error", nil)
		return
	}
	defer rows.Close()

	var categories []Category
	for rows.Next() {
		var cat Category
		if err := rows.Scan(&cat.ID, &cat.Name, &cat.UserID, &cat.IsPublic, &cat.SortNum); err != nil {
			app.logger.Errorf("[categories] Scan failed: %v", err)
			continue
		}
		categories = append(categories, cat)
	}

	app.sendResponse(w, 0, "success", categories)
}

// 创建分类
func (app *App) createCategoryHandler(w http.ResponseWriter, r *http.Request) {
	user := app.getCurrentUser(r)

	var cat Category
	if err := json.NewDecoder(r.Body).Decode(&cat); err != nil {
		app.sendResponse(w, 1, "Invalid JSON", nil)
		return
	}

	cat.UserID = user
	// 管理员可以选择公开或私有，普通用户只能创建私有
	if user != "admin" {
		cat.IsPublic = false
	}

	query := `INSERT INTO categories (name, user_id, is_public, sort_num) VALUES (?, ?, ?, ?)`
	result, err := app.db.Exec(query, cat.Name, cat.UserID, cat.IsPublic, cat.SortNum)
	if err != nil {
		app.logger.Errorf("[category] Insert failed: %v", err)
		app.sendResponse(w, 1, "Database error", nil)
		return
	}

	id, _ := result.LastInsertId()
	cat.ID = int(id)

	app.sendResponse(w, 0, "success", cat)
}

// 更新分类
func (app *App) updateCategoryHandler(w http.ResponseWriter, r *http.Request) {
	user := app.getCurrentUser(r)

	var cat Category
	if err := json.NewDecoder(r.Body).Decode(&cat); err != nil {
		app.sendResponse(w, 1, "Invalid JSON", nil)
		return
	}

	// 检查权限
	if !app.canModifyCategory(cat.ID, user) {
		app.sendResponse(w, 1, "Permission denied", nil)
		return
	}

	query := `UPDATE categories SET name = ?, sort_num = ? WHERE id = ?`
	_, err := app.db.Exec(query, cat.Name, cat.SortNum, cat.ID)
	if err != nil {
		app.logger.Errorf("[category] Update failed: %v", err)
		app.sendResponse(w, 1, "Database error", nil)
		return
	}

	app.sendResponse(w, 0, "success", nil)
}

// 删除分类
func (app *App) deleteCategoryHandler(w http.ResponseWriter, r *http.Request) {
	user := app.getCurrentUser(r)
	idStr := r.URL.Query().Get("id")

	id, err := strconv.Atoi(idStr)
	if err != nil {
		app.sendResponse(w, 1, "Invalid ID", nil)
		return
	}

	// 检查权限
	if !app.canModifyCategory(id, user) {
		app.sendResponse(w, 1, "Permission denied", nil)
		return
	}

	// 删除分类下的链接
	_, err = app.db.Exec("DELETE FROM links WHERE category_id = ?", id)
	if err != nil {
		app.logger.Errorf("[category] Delete links failed: %v", err)
	}

	// 删除分类
	_, err = app.db.Exec("DELETE FROM categories WHERE id = ?", id)
	if err != nil {
		app.logger.Errorf("[category] Delete failed: %v", err)
		app.sendResponse(w, 1, "Database error", nil)
		return
	}

	app.sendResponse(w, 0, "success", nil)
}

// 链接处理器
func (app *App) linksHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method == "GET" {
		app.getLinksHandler(w, r)
	} else {
		app.sendResponse(w, 1, "Method not allowed", nil)
	}
}

func (app *App) linkHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	switch r.Method {
	case "POST":
		app.createLinkHandler(w, r)
	case "PUT":
		app.updateLinkHandler(w, r)
	case "DELETE":
		app.deleteLinkHandler(w, r)
	default:
		app.sendResponse(w, 1, "Method not allowed", nil)
	}
}

// 获取链接
func (app *App) getLinksHandler(w http.ResponseWriter, r *http.Request) {
	user := app.getCurrentUser(r)
	categoryID := r.URL.Query().Get("category_id")

	query := `SELECT id, title, url, description, category_id, user_id, is_public, sort_num, created_at
			  FROM links WHERE (user_id = ? OR is_public = 1)`
	args := []interface{}{user}

	if categoryID != "" {
		query += " AND category_id = ?"
		args = append(args, categoryID)
	}

	query += " ORDER BY sort_num ASC, created_at DESC"

	rows, err := app.db.Query(query, args...)
	if err != nil {
		app.logger.Errorf("[links] Query failed: %v", err)
		app.sendResponse(w, 1, "Database error", nil)
		return
	}
	defer rows.Close()

	var links []Link
	for rows.Next() {
		var link Link
		if err := rows.Scan(&link.ID, &link.Title, &link.URL, &link.Description,
			&link.CategoryID, &link.UserID, &link.IsPublic, &link.SortNum, &link.CreatedAt); err != nil {
			app.logger.Errorf("[links] Scan failed: %v", err)
			continue
		}
		links = append(links, link)
	}

	app.sendResponse(w, 0, "success", links)
}

// 创建链接
func (app *App) createLinkHandler(w http.ResponseWriter, r *http.Request) {
	user := app.getCurrentUser(r)

	var link Link
	if err := json.NewDecoder(r.Body).Decode(&link); err != nil {
		app.sendResponse(w, 1, "Invalid JSON", nil)
		return
	}

	link.UserID = user
	// 管理员可以选择公开或私有，普通用户只能创建私有
	if user != "admin" {
		link.IsPublic = false
	}

	// 确保URL有协议前缀
	if !strings.HasPrefix(link.URL, "http://") && !strings.HasPrefix(link.URL, "https://") {
		link.URL = "http://" + link.URL
	}

	query := `INSERT INTO links (title, url, description, category_id, user_id, is_public, sort_num)
			  VALUES (?, ?, ?, ?, ?, ?, ?)`
	result, err := app.db.Exec(query, link.Title, link.URL, link.Description,
		link.CategoryID, link.UserID, link.IsPublic, link.SortNum)
	if err != nil {
		app.logger.Errorf("[link] Insert failed: %v", err)
		app.sendResponse(w, 1, "Database error", nil)
		return
	}

	id, _ := result.LastInsertId()
	link.ID = int(id)
	link.CreatedAt = time.Now().Format("2006-01-02 15:04:05")

	app.sendResponse(w, 0, "success", link)
}

// 更新链接
func (app *App) updateLinkHandler(w http.ResponseWriter, r *http.Request) {
	user := app.getCurrentUser(r)

	var link Link
	if err := json.NewDecoder(r.Body).Decode(&link); err != nil {
		app.sendResponse(w, 1, "Invalid JSON", nil)
		return
	}

	// 检查权限
	if !app.canModifyLink(link.ID, user) {
		app.sendResponse(w, 1, "Permission denied", nil)
		return
	}

	// 确保URL有协议前缀
	if !strings.HasPrefix(link.URL, "http://") && !strings.HasPrefix(link.URL, "https://") {
		link.URL = "http://" + link.URL
	}

	query := `UPDATE links SET title = ?, url = ?, description = ?, category_id = ?, sort_num = ? WHERE id = ?`
	_, err := app.db.Exec(query, link.Title, link.URL, link.Description, link.CategoryID, link.SortNum, link.ID)
	if err != nil {
		app.logger.Errorf("[link] Update failed: %v", err)
		app.sendResponse(w, 1, "Database error", nil)
		return
	}

	app.sendResponse(w, 0, "success", nil)
}

// 删除链接
func (app *App) deleteLinkHandler(w http.ResponseWriter, r *http.Request) {
	user := app.getCurrentUser(r)
	idStr := r.URL.Query().Get("id")

	id, err := strconv.Atoi(idStr)
	if err != nil {
		app.sendResponse(w, 1, "Invalid ID", nil)
		return
	}

	// 检查权限
	if !app.canModifyLink(id, user) {
		app.sendResponse(w, 1, "Permission denied", nil)
		return
	}

	_, err = app.db.Exec("DELETE FROM links WHERE id = ?", id)
	if err != nil {
		app.logger.Errorf("[link] Delete failed: %v", err)
		app.sendResponse(w, 1, "Database error", nil)
		return
	}

	app.sendResponse(w, 0, "success", nil)
}

// 检查是否可以修改分类
func (app *App) canModifyCategory(categoryID int, user string) bool {
	if user == "admin" {
		return true
	}

	var userID string
	err := app.db.QueryRow("SELECT user_id FROM categories WHERE id = ?", categoryID).Scan(&userID)
	if err != nil {
		return false
	}

	return userID == user
}

// 检查是否可以修改链接
func (app *App) canModifyLink(linkID int, user string) bool {
	if user == "admin" {
		return true
	}

	var userID string
	err := app.db.QueryRow("SELECT user_id FROM links WHERE id = ?", linkID).Scan(&userID)
	if err != nil {
		return false
	}

	return userID == user
}

// 发送响应
func (app *App) sendResponse(w http.ResponseWriter, code int, message string, data interface{}) {
	response := Response{
		Code:    code,
		Message: message,
		Data:    data,
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		app.logger.Errorf("[response] Encode failed: %v", err)
	}
}
