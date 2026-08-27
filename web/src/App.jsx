import { useState, useEffect, createContext, useContext } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom'
import { useAuth, booksApi, purchasesApi, adminApi, recommendationsApi, notificationsApi } from './api'
import api from './api'
import { t } from './localization'
import './index.css'

// ─── Language Context ─────────────────────────────────────────────────────────
const LangCtx = createContext({ lang: 'en', toggleLang: () => {} })
const useLang = () => useContext(LangCtx)

// ─── Auth Context ────────────────────────────────────────────────────────────
const AuthCtx = createContext(null)
const useAuthCtx = () => useContext(AuthCtx)

// ─── Auth Guard ──────────────────────────────────────────────────────────────
function PrivateRoute({ children, allowedRoles }) {
  const { user, loading } = useAuthCtx()
  if (loading) return <div className="loading"><div className="spinner" /></div>
  if (!user) return <Navigate to="/login" />
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />
  return children
}

// ─── Navbar ──────────────────────────────────────────────────────────────────
function Navbar() {
  const { user, logout } = useAuthCtx()
  const { lang, toggleLang } = useLang()
  const navigate = useNavigate()
  const handleLogout = () => { logout(); navigate('/') }

  const [notifications, setNotifications] = useState([])
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)
  const unreadCount = notifications.filter(n => !n.is_read).length

  useEffect(() => {
    if (!user) return
    const fetchNotifs = async () => {
      try {
        const data = await notificationsApi.getAll()
        setNotifications(data)
      } catch {}
    }
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30000)
    return () => clearInterval(interval)
  }, [user])

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">
          <span>📚</span>
          <span>GETSE</span>
        </Link>
        <div className="nav-links">
          <Link to="/catalog">{t(lang, 'catalog')}</Link>
          {user?.role === 'AUTHOR' && <Link to="/publish">{t(lang, 'publish')}</Link>}
          {user?.role === 'AUTHOR' && <Link to="/revenue">{t(lang, 'revenue')}</Link>}
          {user?.role === 'AUTHOR' && <Link to="/ai-assistant">{t(lang, 'ai_writer')}</Link>}
          {user?.role === 'ADMIN' && <Link to="/admin">{t(lang, 'admin')}</Link>}
          {user ? (
            <>
              <Link to="/library">{t(lang, 'my_library')}</Link>

              {/* Notification Bell Dropdown */}
              <div className="notif-wrapper">
                <button
                  className="notif-bell"
                  onClick={() => setShowNotifDropdown(v => !v)}
                  title="Notifications"
                >
                  <span style={{fontSize:'1.3rem'}}>🔔</span>
                  {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                </button>

                {showNotifDropdown && (
                  <div className="notif-dropdown">
                    <div className="notif-dropdown-header">
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={async () => {
                          await notificationsApi.markAllRead()
                          setNotifications(ns => ns.map(n => ({ ...n, is_read: true })))
                        }}>Mark all read</button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="notif-empty">No notifications yet</div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={`notif-item ${n.is_read ? 'read' : 'unread'}`}
                          onClick={async () => {
                            if (!n.is_read) {
                              await notificationsApi.markRead(n.id)
                              setNotifications(ns => ns.map(x => x.id === n.id ? { ...x, is_read: true } : x))
                            }
                          }}
                        >
                          <div className="notif-title">{n.title}</div>
                          <div className="notif-message">{n.message}</div>
                          <div className="notif-time">{new Date(n.created_at).toLocaleDateString()}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <button onClick={handleLogout} className="btn btn-white btn-sm">{t(lang, 'logout')}</button>
            </>
          ) : (
            <Link to="/login"><button className="btn btn-white btn-sm">{t(lang, 'login_register')}</button></Link>
          )}
          <button
            onClick={toggleLang}
            className="btn btn-white btn-sm"
            title="Switch Language / ቋንቋ ቀይር"
            style={{minWidth:42, fontWeight:700, letterSpacing:0}}
          >
            {lang === 'en' ? '🇪🇹 አማ' : '🇬🇧 EN'}
          </button>
        </div>
      </div>
    </nav>
  )
}


// ─── Home Page ────────────────────────────────────────────────────────────────
function HomePage() {
  const { user } = useAuthCtx()
  const { lang } = useLang()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ books: '...', users: '...', purchases: '...' })

  useEffect(() => {
    adminApi.getStats().then(s => {
      setStats({ books: s.total_books || '1,000+', users: s.total_users || '500+', purchases: s.total_purchases || '10,000+' })
    }).catch(() => setStats({ books: '1,000+', users: '500+', purchases: '10,000+' }))
  }, [])

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>{t(lang, 'hero_title')}</h1>
          <p>{t(lang, 'hero_desc')}</p>
          <div className="hero-actions">
            <button className="btn btn-white" onClick={() => navigate('/catalog')}>{t(lang, 'browse_catalog')}</button>
            {!user && <button className="btn btn-outline" style={{color:'white',borderColor:'white'}} onClick={() => navigate('/login')}>{t(lang, 'get_started')}</button>}
          </div>
        </div>
      </section>
      <div className="page container">
        <div className="stats-grid" style={{marginBottom: 48}}>
          {[
            { value: stats.books, label: t(lang, 'books_available') },
            { value: stats.users, label: t(lang, 'authors_readers') },
            { value: stats.purchases, label: t(lang, 'purchases_made') },
            { value: '2', label: t(lang, 'languages_supported') },
          ].map(s => (
            <div key={s.label} className="card stat-card">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// ─── Login / Register Page ────────────────────────────────────────────────────
function LoginPage() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'READER' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuthCtx()
  const { lang } = useLang()
  const navigate = useNavigate()

  const change = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') await login(form.email, form.password)
      else await register(form.username, form.email, form.password, form.role)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    }
    setLoading(false)
  }

  return (
    <div className="page" style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div className="card" style={{width:'100%',maxWidth:440}}>
        <h2 style={{textAlign:'center',marginBottom:8,color:'var(--primary)'}}>
          {mode === 'login' ? t(lang, 'welcome_back') : t(lang, 'create_account')}
        </h2>
        <p style={{textAlign:'center',color:'var(--text-muted)',marginBottom:24,fontSize:'0.9rem'}}>
          {mode === 'login' ? t(lang, 'signin_prompt') : t(lang, 'join_prompt')}
        </p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          {mode === 'register' && (
            <>
              <div className="form-group">
                <label className="form-label">{t(lang, 'username')}</label>
                <input name="username" value={form.username} onChange={change} className="form-input" required />
              </div>
              <div className="form-group">
                <label className="form-label">{t(lang, 'role_prompt')}</label>
                <select name="role" value={form.role} onChange={change} className="form-input form-select">
                  <option value="READER">{t(lang, 'reader')}</option>
                  <option value="AUTHOR">{t(lang, 'author')}</option>
                </select>
              </div>
            </>
          )}
          <div className="form-group">
            <label className="form-label">{t(lang, 'email')}</label>
            <input type="email" name="email" value={form.email} onChange={change} className="form-input" required />
          </div>
          <div className="form-group">
            <label className="form-label">{t(lang, 'password')}</label>
            <input type="password" name="password" value={form.password} onChange={change} className="form-input" required minLength={6} />
          </div>
          <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:'14px'}} disabled={loading}>
            {loading ? t(lang, 'please_wait') : mode === 'login' ? t(lang, 'login') : t(lang, 'register')}
          </button>
        </form>
        <p style={{textAlign:'center',marginTop:16,fontSize:'0.9rem',color:'var(--text-muted)'}}>
          {mode === 'login' ? `${t(lang, 'no_account')} ` : `${t(lang, 'has_account')} `}
          <span style={{color:'var(--primary)',fontWeight:600,cursor:'pointer'}} onClick={() => setMode(m => m === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? t(lang, 'register') : t(lang, 'login')}
          </span>
        </p>
        {mode === 'login' && (
          <div style={{marginTop:16,padding:'12px',background:'rgba(0,100,0,0.08)',borderRadius:8,fontSize:'0.8rem',color:'var(--text-muted)'}}>
            <strong>{t(lang, 'demo_accounts')}:</strong><br/>
            📖 Reader: almaz@getse.com / password123<br/>
            ✍️ Author: kebede@getse.com / password123<br/>
            🛡️ Admin: admin@getse.com / password123
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({ book, onClose, onSuccess }) {
  const [provider, setProvider] = useState('telebirr')
  const [identifier, setIdentifier] = useState('')
  const [step, setStep] = useState('select') // select → processing → done
  const [error, setError] = useState('')
  const { lang } = useLang()

  const handlePay = async (e) => {
    e.preventDefault()
    setError('')
    setStep('processing')
    try {
      const initiated = await api.post('/payments/initiate', { book_id: book.id, provider, identifier })
      const txnRef = initiated.data.transaction.transaction_ref
      await new Promise(r => setTimeout(r, 1500))
      await api.post('/payments/confirm', { transaction_ref: txnRef })
      setStep('done')
      setTimeout(() => { onSuccess(); onClose() }, 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Please try again.')
      setStep('select')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t(lang, 'purchase_book')}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div style={{marginBottom:16}}>
          <strong style={{color:'var(--primary)'}}>{book.title}</strong>
          <div style={{fontSize:'1.4rem',fontWeight:700,color:'var(--accent)',marginTop:4}}>
            {book.price} {t(lang, 'birr')}
          </div>
        </div>

        {step === 'select' && (
          <form onSubmit={handlePay}>
            {error && <div className="alert alert-error" style={{marginBottom:12}}>{error}</div>}
            <div className="form-group">
              <label className="form-label">{t(lang, 'select_payment')}</label>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:4}}>
                <button type="button" onClick={() => setProvider('telebirr')} className={`payment-option ${provider === 'telebirr' ? 'selected' : ''}`}>
                  <span style={{fontSize:'1.5rem'}}>📱</span><span>Telebirr</span>
                </button>
                <button type="button" onClick={() => setProvider('cbe')} className={`payment-option ${provider === 'cbe' ? 'selected' : ''}`}>
                  <span style={{fontSize:'1.5rem'}}>🏦</span><span>CBE Birr</span>
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{t(lang, 'phone_number')}</label>
              <input className="form-input" value={identifier} onChange={e => setIdentifier(e.target.value)}
                placeholder={provider === 'telebirr' ? '09xxxxxxxx' : '1000xxxxxxxx'} required />
            </div>
            <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:'14px'}}>
              {t(lang, 'pay_now')} — {book.price} {t(lang, 'birr')} ({provider === 'telebirr' ? 'Telebirr' : 'CBE Birr'})
            </button>
          </form>
        )}

        {step === 'processing' && (
          <div style={{textAlign:'center',padding:'32px 0'}}>
            <div className="spinner" style={{margin:'0 auto 16px'}}/>
            <p style={{color:'var(--text-muted)'}}>{t(lang, 'processing')}</p>
          </div>
        )}

        {step === 'done' && (
          <div style={{textAlign:'center',padding:'32px 0'}}>
            <div style={{fontSize:'3rem',marginBottom:12}}>✅</div>
            <h4 style={{color:'var(--success)',marginBottom:8}}>{t(lang, 'payment_success')}</h4>
            <p style={{color:'var(--text-muted)',fontSize:'0.9rem'}}>“{book.title}” has been added to your library!</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Catalog Page ─────────────────────────────────────────────────────────────
function CatalogPage() {
  const { user } = useAuthCtx()
  const { lang } = useLang()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [language, setLanguage] = useState('')
  const [selectedBook, setSelectedBook] = useState(null)
  const [libraryIds, setLibraryIds] = useState(new Set())

  const loadBooks = async () => {
    setLoading(true)
    try {
      const data = await booksApi.getAll({ search: search || undefined, language: language || undefined })
      setBooks(data)
    } catch { setBooks([]) }
    setLoading(false)
  }

  const loadLibrary = async () => {
    if (!user) return
    try {
      const lib = await purchasesApi.getLibrary()
      setLibraryIds(new Set(lib.map(b => b.id)))
    } catch {}
  }

  useEffect(() => { loadBooks() }, [search, language])
  useEffect(() => { loadLibrary() }, [user])

  return (
    <div className="page container">
      {selectedBook && (
        <PaymentModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onSuccess={() => { loadLibrary(); setSelectedBook(null) }}
        />
      )}

      <div className="section-header">
        <div>
          <div className="section-title">{t(lang, 'catalog_title')}</div>
          <div className="section-subtitle">{t(lang, 'hero_desc')}</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div style={{display:'flex',gap:12,marginBottom:28,flexWrap:'wrap'}}>
        <input
          className="form-input"
          style={{flex:1,minWidth:200}}
          placeholder={`🔍 ${t(lang, 'search_books')}`}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="form-input form-select" style={{width:160}} value={language} onChange={e => setLanguage(e.target.value)}>
          <option value="">{t(lang, 'all_languages')}</option>
          <option value="Amharic">{t(lang, 'amharic')}</option>
          <option value="English">{t(lang, 'english')}</option>
          <option value="Oromia">{t(lang, 'oromia')}</option>
          <option value="Tigrinya">{t(lang, 'tigrinya')}</option>
        </select>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : books.length === 0 ? (
        <div className="alert alert-warning">{t(lang, 'no_books_found')}</div>
      ) : (
        <div className="books-grid">
          {books.map(book => {
            const owned = libraryIds.has(book.id)
            return (
              <div key={book.id} className="book-card">
                {book.cover_image_url ? (
                  <img src={book.cover_image_url} alt={book.title} className="book-cover-img" />
                ) : (
                  <div className="book-cover" style={{fontSize:'4rem'}}>📖</div>
                )}
                <div className="book-info">
                  <div className="book-title">{book.title}</div>
                  <div className="book-author">{t(lang, 'by')} {book.author_name}</div>
                  <div className="book-description">{book.description?.substring(0, 80)}...</div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:10}}>
                    <span className="book-price">{book.price} {t(lang, 'birr')}</span>
                    <span className="book-language">{book.language}</span>
                  </div>
                  {user ? (
                    owned ? (
                      <div className="btn btn-success btn-sm" style={{marginTop:10,width:'100%',justifyContent:'center',pointerEvents:'none'}}>
                        {t(lang, 'purchased')}
                      </div>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm"
                        style={{marginTop:10,width:'100%',justifyContent:'center'}}
                        onClick={() => setSelectedBook(book)}
                      >
                        {t(lang, 'purchase')}
                      </button>
                    )
                  ) : (
                    <Link to="/login">
                      <button className="btn btn-outline btn-sm" style={{marginTop:10,width:'100%',justifyContent:'center'}}>
                        {t(lang, 'login_register')}
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Publish Page (Authors) ───────────────────────────────────────────────────
function PublishPage() {
  const { lang } = useLang()
  const [form, setForm] = useState({ title: '', description: '', price: '', language: 'Amharic', file_url: '', cover_image_url: '', patent_url: '' })
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const change = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const book = await booksApi.create(form)
      setSuccess(`✅ "${book.title}" published successfully! It's now live in the catalog.`)
      setForm({ title: '', description: '', price: '', language: 'Amharic', file_url: '', cover_image_url: '', patent_url: '' })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish book. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="page container" style={{maxWidth: 700}}>
      <div className="section-title" style={{marginBottom:8}}>{t(lang, 'publish_book')}</div>
      <div className="section-subtitle" style={{marginBottom:24}}>{t(lang, 'publish_subtitle')}</div>
      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}
      <div className="card">
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">{t(lang, 'book_title')}</label>
            <input name="title" value={form.title} onChange={change} className="form-input" placeholder="Enter your book title" required />
          </div>
          <div className="form-group">
            <label className="form-label">{t(lang, 'description')}</label>
            <textarea name="description" value={form.description} onChange={change} className="form-input" rows={4} placeholder="Describe your book..." required style={{resize:'vertical'}} />
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div className="form-group">
              <label className="form-label">{t(lang, 'price_birr')}</label>
              <input type="number" name="price" value={form.price} onChange={change} className="form-input" placeholder="0.00" min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">{t(lang, 'language')}</label>
              <select name="language" value={form.language} onChange={change} className="form-input form-select">
                <option value="Amharic">{t(lang, 'amharic')}</option>
                <option value="English">{t(lang, 'english')}</option>
                <option value="Oromia">{t(lang, 'oromia')}</option>
                <option value="Tigrinya">{t(lang, 'tigrinya')}</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t(lang, 'pdf_url')}</label>
            <input name="file_url" value={form.file_url} onChange={change} className="form-input" placeholder="https://your-storage.com/book.pdf" required />
          </div>
          <div className="form-group">
            <label className="form-label">{t(lang, 'patent_url')}</label>
            <input name="patent_url" value={form.patent_url} onChange={change} className="form-input" placeholder="https://your-storage.com/patent.pdf" required />
          </div>
          <div className="form-group">
            <label className="form-label">{t(lang, 'cover_url')}</label>
            <input name="cover_image_url" value={form.cover_image_url} onChange={change} className="form-input" placeholder="https://your-storage.com/cover.jpg" />
          </div>
          <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:'14px'}} disabled={loading}>
            {loading ? t(lang, 'publishing') : `🚀 ${t(lang, 'publish_btn')}`}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Revenue Dashboard (Authors) ─────────────────────────────────────────────
function RevenuePage() {
  const { lang } = useLang()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [totals, setTotals] = useState({ sales: 0, revenue: 0 })

  useEffect(() => {
    purchasesApi.getRevenue().then(rows => {
      setData(rows)
      const totalSales = rows.reduce((a, r) => a + parseInt(r.total_sales || 0), 0)
      const totalRev = rows.reduce((a, r) => a + parseFloat(r.total_revenue || 0), 0)
      setTotals({ sales: totalSales, revenue: totalRev.toFixed(2) })
    }).catch(() => setData([])).finally(() => setLoading(false))
  }, [])

  return (
    <div className="page container">
      <div className="section-title" style={{marginBottom:8}}>{t(lang, 'revenue_title')}</div>
      <div className="section-subtitle" style={{marginBottom:28}}>{t(lang, 'revenue_subtitle')}</div>

      <div className="stats-grid" style={{marginBottom:32}}>
        {[
          { value: data.length, label: t(lang, 'total_books'), color: 'var(--primary)' },
          { value: totals.sales, label: t(lang, 'total_sales'), color: '#1a8a1a' },
          { value: `${totals.revenue} ETB`, label: t(lang, 'total_revenue'), color: 'var(--accent)' },
        ].map(s => (
          <div key={s.label} className="card stat-card">
            <div className="stat-value" style={{color: s.color}}>{loading ? '...' : s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : data.length === 0 ? (
        <div className="alert alert-warning">{t(lang, 'no_sales_yet')}</div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>{t(lang, 'book_title')}</th>
                <th>{t(lang, 'total_sales')}</th>
                <th>{t(lang, 'revenue_title')}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  <td><strong>{row.title}</strong></td>
                  <td><span className="badge badge-green">{row.total_sales} {t(lang, 'sold')}</span></td>
                  <td><strong style={{color:'var(--accent)'}}>{parseFloat(row.total_revenue || 0).toFixed(2)} ETB</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Admin Page ───────────────────────────────────────────────────────────────
function AdminPage() {
  const { lang } = useLang()
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [notifTitle, setNotifTitle] = useState('')
  const [notifMessage, setNotifMessage] = useState('')
  const [notifStatus, setNotifStatus] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const [s, u, b] = await Promise.all([adminApi.getStats(), adminApi.getUsers(), adminApi.getBooks()])
      setStats(s)
      setUsers(u)
      setBooks(b)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const deleteUser = async (id, username) => {
    if (!window.confirm(`Remove user "${username}"? This cannot be undone.`)) return
    try {
      await adminApi.deleteUser(id)
      setUsers(u => u.filter(u => u.id !== id))
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user')
    }
  }

  const deleteBook = async (id, title) => {
    if (!window.confirm(`Remove book "${title}"? This cannot be undone.`)) return
    try {
      await adminApi.deleteBook(id)
      setBooks(b => b.filter(bk => bk.id !== id))
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete book')
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminApi.updateUserRole(userId, newRole)
      setUsers(us => us.map(u => u.id === userId ? { ...u, role: newRole } : u))
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user role')
    }
  }

  const handleBroadcast = async (e) => {
    e.preventDefault()
    if (!notifTitle || !notifMessage) return
    try {
      await notificationsApi.broadcast(notifTitle, notifMessage, 'info')
      setNotifStatus('✅ Notification sent to all users!')
      setNotifTitle('')
      setNotifMessage('')
      setTimeout(() => setNotifStatus(''), 4000)
    } catch (err) {
      setNotifStatus('❌ Failed to send notification')
    }
  }

  return (
    <div className="page container">
      <div className="section-title" style={{marginBottom:24}}>{t(lang, 'admin_panel')}</div>

      <div className="stats-grid" style={{marginBottom:32}}>
        {[
          { value: stats?.totalUsers ?? stats?.total_users ?? '—', label: t(lang, 'total_users'), color: 'var(--primary)' },
          { value: stats?.totalBooks ?? stats?.total_books ?? '—', label: t(lang, 'total_books'), color: '#1a8a1a' },
          { value: stats?.totalPurchases ?? stats?.total_purchases ?? '—', label: t(lang, 'total_purchases'), color: '#FFD700' },
          { value: stats ? `${parseFloat(stats.totalRevenue || stats.total_revenue || 0).toFixed(0)} ETB` : '—', label: t(lang, 'total_revenue'), color: '#DC143C' },
        ].map(s => (
          <div key={s.label} className="card stat-card">
            <div className="stat-value" style={{color: s.color}}>{loading ? '...' : s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Broadcast Notification Panel */}
      <div className="card" style={{marginBottom:32}}>
        <div className="section-title" style={{fontSize:'1.1rem',marginBottom:12}}>📢 Broadcast Notification</div>
        {notifStatus && <div style={{marginBottom:12,fontWeight:600}}>{notifStatus}</div>}
        <form onSubmit={handleBroadcast} style={{display:'grid',gap:12}}>
          <input
            type="text"
            className="form-input"
            placeholder="Notification Title"
            value={notifTitle}
            onChange={e => setNotifTitle(e.target.value)}
            required
          />
          <textarea
            className="form-input"
            placeholder="Notification Message for all users..."
            value={notifMessage}
            onChange={e => setNotifMessage(e.target.value)}
            rows={2}
            required
          />
          <button type="submit" className="btn btn-primary" style={{justifySelf:'start'}}>
            Send Broadcast
          </button>
        </form>
      </div>

      {/* User Management Table */}
      <div className="card" style={{marginBottom:32}}>
        <div className="section-header" style={{marginBottom:16}}>
          <div className="section-title" style={{fontSize:'1.1rem'}}>{t(lang, 'user_management')}</div>
          <button className="btn btn-outline btn-sm" onClick={loadData}>{t(lang, 'refresh')}</button>
        </div>
        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : (
          <table className="table">
            <thead>
              <tr><th>#</th><th>{t(lang, 'username')}</th><th>{t(lang, 'email')}</th><th>Role</th><th>Joined</th><th>{t(lang, 'actions')}</th></tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={6} style={{textAlign:'center',color:'var(--text-muted)',padding:32}}>{t(lang, 'no_users_found')}</td></tr>
              ) : users.map(u => (
                <tr key={u.id}>
                  <td style={{color:'var(--text-muted)'}}>{u.id}</td>
                  <td><strong>{u.username}</strong></td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      style={{padding:'4px 8px',borderRadius:6,border:'1px solid var(--border)',fontWeight:600}}
                    >
                      <option value="READER">READER</option>
                      <option value="AUTHOR">AUTHOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    {u.role !== 'ADMIN' && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => deleteUser(u.id, u.username)}
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Books Management Table */}
      <div className="card">
        <div className="section-header" style={{marginBottom:16}}>
          <div className="section-title" style={{fontSize:'1.1rem'}}>📚 Catalog & Books Management ({books.length})</div>
        </div>
        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : (
          <table className="table">
            <thead>
              <tr><th>#</th><th>Title</th><th>Author</th><th>Language</th><th>Price</th><th>Published</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {books.length === 0 ? (
                <tr><td colSpan={7} style={{textAlign:'center',color:'var(--text-muted)',padding:32}}>No books published yet</td></tr>
              ) : books.map(b => (
                <tr key={b.id}>
                  <td style={{color:'var(--text-muted)'}}>{b.id}</td>
                  <td><strong>{b.title}</strong></td>
                  <td>{b.author_name}</td>
                  <td><span className="badge badge-green">{b.language}</span></td>
                  <td><strong>{b.price} ETB</strong></td>
                  <td style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>{new Date(b.published_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => deleteBook(b.id, b.title)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}


// ─── Library Page ─────────────────────────────────────────────────────────────
function LibraryPage() {
  const { lang } = useLang()
  const [books, setBooks] = useState([])
  const [recs, setRecs] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('library')

  useEffect(() => {
    Promise.all([purchasesApi.getLibrary(), recommendationsApi.get()])
      .then(([lib, rec]) => { setBooks(lib); setRecs(rec) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page container">
      <div className="section-header">
        <div>
          <div className="section-title">{t(lang, 'my_library_title')}</div>
          <div className="section-subtitle">{t(lang, 'library_subtitle')}</div>
        </div>
      </div>

      <div style={{display:'flex',gap:8,marginBottom:24}}>
        <button className={`btn ${tab === 'library' ? 'btn-primary' : 'btn-outline'} btn-sm`} onClick={() => setTab('library')}>
          📚 My Books ({books.length})
        </button>
        <button className={`btn ${tab === 'recs' ? 'btn-primary' : 'btn-outline'} btn-sm`} onClick={() => setTab('recs')}>
          🤖 Recommended ({recs.length})
        </button>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : tab === 'library' ? (
        books.length === 0 ? (
          <div className="alert alert-warning">
            {t(lang, 'no_books_yet')} <Link to="/catalog" style={{color:'var(--primary)',fontWeight:600}}>{t(lang, 'browse_catalog_cta')}</Link>
          </div>
        ) : (
          <div className="books-grid">
            {books.map(book => (
              <div key={book.id} className="book-card">
                {book.cover_image_url ? (
                  <img src={book.cover_image_url} alt={book.title} className="book-cover-img" />
                ) : (
                  <div className="book-cover" style={{fontSize:'4rem'}}>📖</div>
                )}
                <div className="book-info">
                  <div className="book-title">{book.title}</div>
                  <div className="book-author">{t(lang, 'by')} {book.author_name}</div>
                  <div style={{marginTop:8,fontSize:'0.8rem',color:'var(--text-muted)'}}>
                    {t(lang, 'purchased_on')} {new Date(book.purchase_date).toLocaleDateString()}
                  </div>
                  <div style={{display:'flex',gap:6,marginTop:10}}>
                    <a href={book.file_url} target="_blank" rel="noreferrer" style={{flex:1}}>
                      <button className="btn btn-primary btn-sm" style={{width:'100%',justifyContent:'center'}}>
                        📄 {t(lang, 'read_now')}
                      </button>
                    </a>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{justifyContent:'center'}}
                      title="Download PDF"
                      onClick={async () => {
                        try {
                          const blob = await booksApi.download(book.id)
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `${book.title}.pdf`
                          a.click()
                          URL.revokeObjectURL(url)
                        } catch {
                          alert('Download failed. Please try again.')
                        }
                      }}
                    >
                      📥
                    </button>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        recs.length === 0 ? (
          <div className="alert alert-warning">{t(lang, 'no_recommendations')} {t(lang, 'purchase_more')}</div>
        ) : (
          <div className="books-grid">
            {recs.map(book => (
              <div key={book.id} className="book-card">
                {book.cover_image_url ? (
                  <img src={book.cover_image_url} alt={book.title} className="book-cover-img" />
                ) : (
                  <div className="book-cover" style={{fontSize:'4rem'}}>⭐</div>
                )}
                <div className="book-info">
                  <div className="book-title">{book.title}</div>
                  <div className="book-author">by {book.author_name}</div>
                  <div className="book-price" style={{marginTop:8}}>{book.price} ETB</div>
                  <Link to="/catalog">
                    <button className="btn btn-outline btn-sm" style={{marginTop:10,width:'100%',justifyContent:'center'}}>
                      {t(lang, 'view_in_catalog')}
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

// ─── AI Writing Assistant Page (Authors) ──────────────────────────────────────
function AIAssistantPage() {
  const { lang } = useLang()
  const [text, setText] = useState('')
  const [action, setAction] = useState('style')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const analyze = async (e) => {
    e.preventDefault()
    setError('')
    setResult(null)
    setLoading(true)
    try {
      const res = await api.post('/ai/writing-assistant', { text, action })
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed. Please try again.')
    }
    setLoading(false)
  }

  const actions = [
    { value: 'style', label: '✍️ Style Check', desc: 'Analyze sentence rhythm & readability' },
    { value: 'vocabulary', label: '📖 Vocabulary', desc: 'Suggest richer, more expressive words' },
    { value: 'cover', label: '🎨 Cover Design', desc: 'Generate a cover concept from your text' },
    { value: 'general', label: '🔍 Full Review', desc: 'Comprehensive writing critique' },
  ]

  return (
    <div className="page container" style={{maxWidth:860}}>
      <div className="section-title" style={{marginBottom:8}}>{t(lang, 'ai_assistant')}</div>
      <div className="section-subtitle" style={{marginBottom:28}}>
        {t(lang, 'ai_subtitle')}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
        {/* Input Panel */}
        <div className="card">
          <form onSubmit={analyze}>
            <div className="form-group">
              <label className="form-label">{t(lang, 'analysis_type')}</label>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:4}}>
                {actions.map(a => (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => setAction(a.value)}
                    className={`ai-action-btn ${action === a.value ? 'selected' : ''}`}
                  >
                    <span style={{fontWeight:600}}>{a.label}</span>
                    <span style={{fontSize:'0.75rem',opacity:0.8}}>{a.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{t(lang, 'paste_text')}</label>
              <textarea
                className="form-input"
                rows={10}
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={action === 'cover'
                  ? "Describe your book's theme, characters, and setting to generate a cover concept..."
                  : "Paste your chapter excerpt or paragraph here for AI analysis..."
                }
                required
                style={{resize:'vertical'}}
              />
            </div>
            <button
              className="btn btn-primary"
              style={{width:'100%',justifyContent:'center',padding:'14px'}}
              disabled={loading}
            >
              {loading ? t(lang, 'analyzing') : t(lang, 'analyze')}
            </button>
          </form>
        </div>

        {/* Results Panel */}
        <div className="card" style={{minHeight:300}}>
          <div style={{fontWeight:600,marginBottom:16,color:'var(--primary)'}}>{t(lang, 'ai_feedback')}</div>
          {error && <div className="alert alert-error">{error}</div>}
          {loading && (
            <div style={{textAlign:'center',padding:'48px 0'}}>
              <div className="spinner" style={{margin:'0 auto 12px'}} />
              <p style={{color:'var(--text-muted)'}}>{t(lang, 'ai_analyzing')}</p>
            </div>
          )}
          {!loading && !result && !error && (
            <div style={{textAlign:'center',padding:'48px 0',color:'var(--text-muted)'}}>
              <div style={{fontSize:'3rem',marginBottom:12}}>🤖</div>
              <p>{t(lang, 'submit_for_feedback')}</p>
            </div>
          )}
          {result && (
            <div>
              <div
                style={{
                  background:'rgba(0,100,0,0.05)',
                  border:'1px solid rgba(0,100,0,0.15)',
                  borderRadius:8,
                  padding:16,
                  marginBottom:20,
                  lineHeight:1.6,
                  whiteSpace:'pre-wrap'
                }}
              >
                {result.feedback}
              </div>
              
              {result.images && result.images.length > 0 && (
                <div style={{marginBottom: 20}}>
                  <div className="section-title" style={{fontSize:16,marginBottom:12}}>AI Generated Concepts</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:16}}>
                    {result.images.map((imgUrl, idx) => (
                      <div key={idx} style={{borderRadius:8,overflow:'hidden',boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}}>
                        <img src={imgUrl} alt={`Cover Concept ${idx + 1}`} style={{width:'100%',height:'auto',display:'block',aspectRatio:'2/3',objectFit:'cover'}} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.suggestions?.length > 0 && (
                <div>
                  <div style={{fontWeight:600,marginBottom:8,fontSize:'0.9rem'}}>{t(lang, 'suggestions')}</div>
                  <ul style={{paddingLeft:18,fontSize:'0.88rem',lineHeight:1.8}}>
                    {result.suggestions.map((s, i) => (
                      <li key={i} style={{color:'var(--text-secondary)',marginBottom:4}}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────
function AppContent() {
  const auth = useAuth()
  return (
    <AuthCtx.Provider value={auth}>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/library" element={<PrivateRoute><LibraryPage /></PrivateRoute>} />
          <Route path="/publish" element={<PrivateRoute allowedRoles={['AUTHOR', 'ADMIN']}><PublishPage /></PrivateRoute>} />
          <Route path="/revenue" element={<PrivateRoute allowedRoles={['AUTHOR', 'ADMIN']}><RevenuePage /></PrivateRoute>} />
          <Route path="/ai-assistant" element={<PrivateRoute allowedRoles={['AUTHOR', 'ADMIN']}><AIAssistantPage /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute allowedRoles={['ADMIN']}><AdminPage /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthCtx.Provider>
  )
}

function App() {
  const [lang, setLang] = useState('en')
  const toggleLang = () => setLang(l => l === 'en' ? 'am' : 'en')
  
  return (
    <LangCtx.Provider value={{ lang, toggleLang }}>
      <AppContent />
    </LangCtx.Provider>
  )
}

export default App
