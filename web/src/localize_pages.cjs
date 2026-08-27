const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'App.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// PublishPage
content = content.replace('function PublishPage() {\n  const [form, setForm]', 'function PublishPage() {\n  const { lang } = useLang()\n  const [form, setForm]');
content = content.replace('Publish a Book</div>', '{t(lang, \'publish_book\')}</div>');
content = content.replace('Share your work with Ethiopian readers worldwide</div>', '{t(lang, \'publish_subtitle\')}</div>');
content = content.replace('Book Title</label>', '{t(lang, \'book_title\')}</label>');
content = content.replace('Description</label>', '{t(lang, \'description\')}</label>');
content = content.replace('Price (ETB)</label>', '{t(lang, \'price_birr\')}</label>');
content = content.replace('Language</label>', '{t(lang, \'language\')}</label>');
content = content.replace('Book File URL (PDF link)</label>', '{t(lang, \'pdf_url\')}</label>');
content = content.replace('Cover Image URL</label>', '{t(lang, \'cover_url\')}</label>');
content = content.replace("{loading ? 'Publishing...' : '🚀 Publish Book'}", "{loading ? t(lang, 'publishing') : `🚀 ${t(lang, 'publish_btn')}`}");
content = content.replace('>Amharic<', '>{t(lang, \'amharic\')}<').replace('>Amharic<', '>{t(lang, \'amharic\')}<');
content = content.replace('>English<', '>{t(lang, \'english\')}<').replace('>English<', '>{t(lang, \'english\')}<');
content = content.replace('>Oromia<', '>{t(lang, \'oromia\')}<').replace('>Oromia<', '>{t(lang, \'oromia\')}<');
content = content.replace('>Tigrinya<', '>{t(lang, \'tigrinya\')}<').replace('>Tigrinya<', '>{t(lang, \'tigrinya\')}<');

// RevenuePage
content = content.replace('function RevenuePage() {\n  const [data', 'function RevenuePage() {\n  const { lang } = useLang()\n  const [data');
content = content.replace('Revenue Dashboard</div>', '{t(lang, \'revenue_title\')}</div>');
content = content.replace('Track your book sales and income</div>', '{t(lang, \'revenue_subtitle\')}</div>');
content = content.replace("label: 'Books Published'", "label: t(lang, 'total_books')");
content = content.replace("label: 'Total Sales'", "label: t(lang, 'total_sales')");
content = content.replace("label: 'Total Revenue'", "label: t(lang, 'total_revenue')");
content = content.replace("No sales yet. Publish books and start earning!</div>", "{t(lang, 'no_sales_yet')}</div>");
content = content.replace("<th>Book Title</th>", "<th>{t(lang, 'book_title')}</th>");
content = content.replace("<th>Total Sales</th>", "<th>{t(lang, 'total_sales')}</th>");
content = content.replace("<th>Revenue (ETB)</th>", "<th>{t(lang, 'revenue_title')}</th>");
content = content.replace(" sold</span>", " {t(lang, 'sold')}</span>");

// AdminPage
content = content.replace('function AdminPage() {\n  const [stats', 'function AdminPage() {\n  const { lang } = useLang()\n  const [stats');
content = content.replace('Admin Dashboard</div>', '{t(lang, \'admin_panel\')}</div>');
content = content.replace("label: 'Total Users'", "label: t(lang, 'total_users')");
content = content.replace("label: 'Total Books'", "label: t(lang, 'total_books')");
content = content.replace("label: 'Total Purchases'", "label: t(lang, 'total_purchases')");
content = content.replace("label: 'Total Revenue'", "label: t(lang, 'total_revenue')");
content = content.replace('User Management</div>', '{t(lang, \'user_management\')}</div>');
content = content.replace('>↻ Refresh<', '>{t(lang, \'refresh\')}<');
content = content.replace('>Username<', '>{t(lang, \'username\')}<');
content = content.replace('>Email<', '>{t(lang, \'email\')}<');
content = content.replace('>Role<', '>{t(lang, \'role_prompt\')}<');
content = content.replace('>Actions<', '>{t(lang, \'actions\')}<');
content = content.replace('No users found</td>', '{t(lang, \'no_users_found\')}</td>');
content = content.replace('>Remove<', '>{t(lang, \'remove\')}<');

// LibraryPage
content = content.replace('function LibraryPage() {\n  const [books', 'function LibraryPage() {\n  const { lang } = useLang()\n  const [books');
content = content.replace('>My Library</div>', '>{t(lang, \'my_library_title\')}</div>');
content = content.replace('>Your purchased books — read online or on the GETSE mobile app</div>', '>{t(lang, \'library_subtitle\')}</div>');
content = content.replace('>📚 My Books ({books.length})', '>📚 {t(lang, \'my_books\')} ({books.length})');
content = content.replace('>🤖 Recommended ({recs.length})', '>🤖 {t(lang, \'recommendations\')} ({recs.length})');
content = content.replace('Your library is empty. <Link to="/catalog" style={{color:\'var(--primary)\',fontWeight:600}}>Browse the catalog</Link> to purchase books!', '{t(lang, \'no_books_yet\')} <Link to="/catalog" style={{color:\'var(--primary)\',fontWeight:600}}>{t(lang, \'browse_catalog_cta\')}</Link>');
content = content.replace('No recommendations yet. Purchase more books to get personalized suggestions!</div>', '{t(lang, \'no_recommendations\')} {t(lang, \'purchase_more\')}</div>');
content = content.replace('Purchased: ', '{t(lang, \'purchased_on\')} ');
content = content.replace('📄 Read Online', '📄 {t(lang, \'read_now\')}');
content = content.replace('View in Catalog', '{t(lang, \'view_in_catalog\')}');

// AIAssistantPage
content = content.replace('function AIAssistantPage() {\n  const [text', 'function AIAssistantPage() {\n  const { lang } = useLang()\n  const [text');
content = content.replace('>AI Writing Assistant</div>', '>{t(lang, \'ai_assistant\')}</div>');
content = content.replace('Powered by intelligent NLP — get instant feedback, vocabulary suggestions, and cover design concepts for your book\n      </div>', '{t(lang, \'ai_subtitle\')}\n      </div>');
content = content.replace('>Analysis Type</label>', '>{t(lang, \'analysis_type\')}</label>');
content = content.replace('>Your Text or Book Description</label>', '>{t(lang, \'paste_text\')}</label>');
content = content.replace("{loading ? 'Analyzing...' : `Analyze with AI →`}", "{loading ? t(lang, 'analyzing') : t(lang, 'analyze')}");
content = content.replace('>AI Feedback</div>', '>{t(lang, \'ai_feedback\')}</div>');
content = content.replace('AI is analyzing your text...</p>', '{t(lang, \'ai_analyzing\')}</p>');
content = content.replace('Submit your text to get AI-powered writing feedback</p>', '{t(lang, \'submit_for_feedback\')}</p>');
content = content.replace('>💡 Suggestions</div>', '>{t(lang, \'suggestions\')}</div>');
content = content.replace('by {book.author_name}', '{t(lang, \'by\')} {book.author_name}').replace('by {book.author_name}', '{t(lang, \'by\')} {book.author_name}');


fs.writeFileSync(filePath, content, 'utf8');
console.log('App.jsx localized');
