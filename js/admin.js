/**
 * Canadian Association of Family Health Support (CAFHS)
 * Full Admin Management Portal
 * Allows dynamic management of Articles, Programs, Events, Intakes, Emails, and ChatGPT API Configuration
 */

class AdminPortal {
  constructor() {
    this.activeTab = 'overview';
    this.editingArticleId = null;
    this.editingProgramId = null;
    this.editingEventId = null;

    // Listen to updates from other modules
    window.addEventListener('cafhs:content-updated', () => {
      if (this.isOpen()) {
        this.renderActiveTab();
      }
    });

    window.addEventListener('cafhs:email-sent', () => {
      if (this.isOpen() && this.activeTab === 'emails') {
        this.renderEmailsTab();
      }
    });
  }

  isOpen() {
    const modal = document.getElementById('admin-portal-modal');
    return modal && modal.classList.contains('active');
  }

  open() {
    if (!window.authService.isAdmin()) {
      alert('Access Restricted: Please log in with an Administrator account (e.g. admin@cafhs.ca).');
      window.authService.openAuthModal();
      return;
    }

    const modal = document.getElementById('admin-portal-modal');
    if (modal) {
      modal.classList.add('active');
      
      // Update Administrator Identity in Header
      const user = window.authService.currentUser;
      if (user) {
        const nameEl = document.getElementById('admin-user-name');
        const emailEl = document.getElementById('admin-user-email');
        if (nameEl) nameEl.textContent = user.name || 'Executive Administrator';
        if (emailEl) emailEl.textContent = `${user.title || 'Administrator'} • ${user.email}`;
      }

      this.updateSidebarBadges();
      this.switchTab('overview');
    }
  }

  close() {
    const modal = document.getElementById('admin-portal-modal');
    if (modal) modal.classList.remove('active');
  }

  updateSidebarBadges() {
    try {
      // 1. Client Intakes Badge (pending / new)
      const intakes = window.contentStore ? window.contentStore.getIntakes() : [];
      const pendingIntakes = intakes.filter(i => i.status === 'New' || i.status === 'In Progress').length;
      const intakeBadge = document.getElementById('badge-nav-intakes');
      if (intakeBadge) {
        if (pendingIntakes > 0) {
          intakeBadge.textContent = pendingIntakes;
          intakeBadge.style.display = 'inline-block';
        } else {
          intakeBadge.style.display = 'none';
        }
      }

      // 2. Email Notifications / Alerts Badge
      const emails = window.emailService ? window.emailService.getEmails() : [];
      const emailBadge = document.getElementById('badge-nav-emails');
      if (emailBadge) {
        if (emails.length > 0) {
          emailBadge.textContent = emails.length;
          emailBadge.style.display = 'inline-block';
        } else {
          emailBadge.style.display = 'none';
        }
      }
    } catch {
      // Non-critical badge update
    }
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    document.querySelectorAll('.admin-nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });
    this.updateSidebarBadges();
    this.renderActiveTab();
  }

  renderActiveTab() {
    const contentArea = document.getElementById('admin-tab-content');
    if (!contentArea) return;

    switch (this.activeTab) {
      case 'overview':
        this.renderOverviewTab(contentArea);
        break;
      case 'users':
        this.renderUsersTab(contentArea);
        break;
      case 'chatlogs':
        this.renderChatLogsTab(contentArea);
        break;
      case 'articles':
        this.renderArticlesTab(contentArea);
        break;
      case 'programs':
        this.renderProgramsTab(contentArea);
        break;
      case 'events':
        this.renderEventsTab(contentArea);
        break;
      case 'intakes':
        this.renderIntakesTab(contentArea);
        break;
      case 'contributions':
        this.renderContributionsTab(contentArea);
        break;
      case 'partners':
        this.renderPartnersTab(contentArea);
        break;
      case 'emails':
        this.renderEmailsTab(contentArea);
        break;
      case 'emailconfig':
        this.renderEmailConfigTab(contentArea);
        break;
      case 'chatgpt':
        this.renderChatGPTTab(contentArea);
        break;
      default:
        this.renderOverviewTab(contentArea);
    }
  }

  // --- 1. OVERVIEW & METRICS ---
  renderOverviewTab(container) {
    const users = window.authService.getUsers();
    const articles = window.contentStore.getArticles();
    const programs = window.contentStore.getPrograms();
    const events = window.contentStore.getEvents();
    const intakes = window.contentStore.getIntakes();
    const emails = window.emailService.getEmails();
    const pendingIntakes = intakes.filter(i => i.status === 'New' || i.status === 'In Progress').length;

    container.innerHTML = `
      <div class="admin-overview-grid">
        <div class="stat-box">
          <div class="stat-icon">👥</div>
          <div class="stat-data">
            <span class="stat-num">${users.length}</span>
            <span class="stat-title">Registered Members</span>
          </div>
        </div>
        <div class="stat-box highlight">
          <div class="stat-icon">📋</div>
          <div class="stat-data">
            <span class="stat-num">${intakes.length}</span>
            <span class="stat-title">Client Intakes (${pendingIntakes} active)</span>
          </div>
        </div>
        <div class="stat-box">
          <div class="stat-icon">🌿</div>
          <div class="stat-data">
            <span class="stat-num">${programs.length}</span>
            <span class="stat-title">Dynamic Programs</span>
          </div>
        </div>
        <div class="stat-box">
          <div class="stat-icon">🗓️</div>
          <div class="stat-data">
            <span class="stat-num">${events.length}</span>
            <span class="stat-title">Upcoming Workshops</span>
          </div>
        </div>
        <div class="stat-box">
          <div class="stat-icon">📰</div>
          <div class="stat-data">
            <span class="stat-num">${articles.length}</span>
            <span class="stat-title">Health Bulletins</span>
          </div>
        </div>
        <div class="stat-box">
          <div class="stat-icon">📧</div>
          <div class="stat-data">
            <span class="stat-num">${emails.length}</span>
            <span class="stat-title">Dispatched Emails</span>
          </div>
        </div>
        <div class="stat-box" style="border-top: 3px solid #008080;">
          <div class="stat-icon">💰</div>
          <div class="stat-data">
            <span class="stat-num" id="overview-contrib-total">...</span>
            <span class="stat-title">Community Funds</span>
          </div>
        </div>
      </div>

      <div class="admin-quick-actions-card">
        <h4>⚡ Quick Administrator Actions</h4>
        <div class="quick-btn-group">
          <button class="btn btn-primary" onclick="window.adminPortal.switchTab('users')">👥 User Management (${users.length})</button>
          <button class="btn btn-outline" style="border-color:#008080; color:#008080; font-weight:700;" onclick="window.adminPortal.switchTab('contributions')">💰 Donations & Receipts</button>
          <button class="btn btn-outline" style="border-color:#15803D; color:#15803D; font-weight:700;" onclick="window.adminPortal.switchTab('partners')">🎓 Training Partners Network</button>
          <button class="btn btn-outline" onclick="window.adminPortal.switchTab('chatlogs')">💬 Chat Transcripts & Alerts</button>
          <button class="btn btn-outline" onclick="window.adminPortal.showNewArticleForm()">+ Add Health Bulletin</button>
          <button class="btn btn-outline" onclick="window.adminPortal.showNewProgramForm()">+ Add Program</button>
          <button class="btn btn-outline" onclick="window.adminPortal.showNewEventForm()">+ Schedule Workshop</button>
          <button class="btn btn-secondary" onclick="window.adminPortal.switchTab('chatgpt')">🤖 Configure ChatGPT API</button>
        </div>
      </div>

      <div class="admin-recent-split">
        <div class="recent-box">
          <div class="box-header">
            <h5>Recent Inquiries & Intake Submissions</h5>
            <button class="btn-link" onclick="window.adminPortal.switchTab('intakes')">View all →</button>
          </div>
          <div class="recent-list">
            ${intakes.slice(0, 3).map(i => `
              <div class="recent-item">
                <div>
                  <strong>${i.name}</strong> (${i.province}) • <span class="badge-status status-${i.status.toLowerCase().replace(' ', '-')}">${i.status}</span>
                  <div class="recent-sub">${i.program} • ${new Date(i.submittedAt).toLocaleDateString()}</div>
                </div>
                <button class="btn-action-sm" onclick="window.adminPortal.openIntakeDetail('${i.id}')">Review</button>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="recent-box">
          <div class="box-header">
            <h5>Recent Email Notification Dispatches</h5>
            <button class="btn-link" onclick="window.adminPortal.switchTab('emails')">View all →</button>
          </div>
          <div class="recent-list">
            ${emails.slice(0, 3).map(e => `
              <div class="recent-item">
                <div>
                  <strong>To: ${e.toName}</strong> (${e.to})
                  <div class="recent-sub">${e.subject}</div>
                </div>
                <span class="time-sub">${new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            `).join('')}
          </div>
        </div>
    `;

    // Asynchronously update community funds stat from database
    fetch('/api/stats')
      .then(res => res.json())
      .then(stats => {
        const el = document.getElementById('overview-contrib-total');
        if (el) el.innerText = `$${(stats.total_contributed_cad || 0).toFixed(0)} CAD`;
      })
      .catch(() => {});
  }

  // --- 2. ARTICLES & BULLETINS ---
  renderArticlesTab(container) {
    const articles = window.contentStore.getArticles();

    container.innerHTML = `
      <div class="admin-tab-header">
        <div>
          <h4>Dynamic Health Bulletins & Articles</h4>
          <p class="section-desc">Create and edit articles that display dynamically on the main website.</p>
        </div>
        <button class="btn btn-primary" onclick="window.adminPortal.showNewArticleForm()">+ Create New Article</button>
      </div>

      <div id="article-form-zone" style="display:none;" class="admin-editor-card"></div>

      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Author</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${articles.map(art => `
              <tr>
                <td><strong>${art.title}</strong></td>
                <td><span class="table-badge">${art.category}</span></td>
                <td>${art.author}</td>
                <td>${art.date}</td>
                <td><span class="badge-status ${art.published ? 'status-active' : 'status-draft'}">${art.published ? 'Published' : 'Draft'}</span></td>
                <td>
                  <button class="btn-table-action" onclick="window.adminPortal.editArticle('${art.id}')">✏️ Edit</button>
                  <button class="btn-table-action btn-delete" onclick="window.adminPortal.deleteArticle('${art.id}')">🗑️ Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  showNewArticleForm(articleToEdit = null) {
    const formZone = document.getElementById('article-form-zone');
    if (!formZone) return;

    this.editingArticleId = articleToEdit ? articleToEdit.id : null;
    const isEdit = Boolean(articleToEdit);

    formZone.style.display = 'block';
    formZone.innerHTML = `
      <div class="form-header">
        <h5>${isEdit ? '✏️ Edit Health Bulletin' : '➕ Create New Dynamic Health Bulletin'}</h5>
        <button class="btn-close-sm" onclick="document.getElementById('article-form-zone').style.display='none'">✕</button>
      </div>
      <form onsubmit="window.adminPortal.submitArticleForm(event)">
        <div class="form-row-2">
          <div class="form-group">
            <label>Article Title (English) *</label>
            <input type="text" id="art-title" class="form-control" value="${articleToEdit?.title || ''}" required>
          </div>
          <div class="form-group">
            <label>Category *</label>
            <select id="art-category" class="form-control">
              <option value="Crisis & Mental Health" ${articleToEdit?.category === 'Crisis & Mental Health' ? 'selected' : ''}>Crisis & Mental Health</option>
              <option value="Caregiver Support" ${articleToEdit?.category === 'Caregiver Support' ? 'selected' : ''}>Caregiver Support</option>
              <option value="Maternal & Newborn" ${articleToEdit?.category === 'Maternal & Newborn' ? 'selected' : ''}>Maternal & Newborn</option>
              <option value="Youth Wellness" ${articleToEdit?.category === 'Youth Wellness' ? 'selected' : ''}>Youth Wellness</option>
              <option value="Senior Living" ${articleToEdit?.category === 'Senior Living' ? 'selected' : ''}>Senior Living</option>
            </select>
          </div>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label>Author *</label>
            <input type="text" id="art-author" class="form-control" value="${articleToEdit?.author || 'Dr. Marc Tremblay, MSW'}" required>
          </div>
          <div class="form-group">
            <label>Estimated Read Time</label>
            <input type="text" id="art-readtime" class="form-control" value="${articleToEdit?.readTime || '4 min read'}">
          </div>
        </div>
        <div class="form-group">
          <label>Brief Excerpt / Summary *</label>
          <textarea id="art-excerpt" class="form-control" rows="2" required>${articleToEdit?.excerpt || ''}</textarea>
        </div>
        <div class="form-group">
          <label>Full Content Body *</label>
          <textarea id="art-content" class="form-control" rows="5" required>${articleToEdit?.content || ''}</textarea>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Publish Article'}</button>
          <button type="button" class="btn btn-outline" onclick="document.getElementById('article-form-zone').style.display='none'">Cancel</button>
        </div>
      </form>
    `;
    formZone.scrollIntoView({ behavior: 'smooth' });
  }

  submitArticleForm(e) {
    e.preventDefault();
    const title = document.getElementById('art-title')?.value;
    const category = document.getElementById('art-category')?.value;
    const author = document.getElementById('art-author')?.value;
    const readTime = document.getElementById('art-readtime')?.value;
    const excerpt = document.getElementById('art-excerpt')?.value;
    const content = document.getElementById('art-content')?.value;

    window.contentStore.saveArticle({
      id: this.editingArticleId,
      title,
      category,
      author,
      readTime,
      excerpt,
      content,
      published: true,
      image: 'assets/images/community-wellness.jpg'
    });

    window.emailService.showToast({
      title: 'Article Saved',
      message: `"${title}" has been saved and is now live!`,
      type: 'success'
    });

    this.renderArticlesTab(document.getElementById('admin-tab-content'));
  }

  editArticle(id) {
    const article = window.contentStore.getArticles().find(a => a.id === id);
    if (article) this.showNewArticleForm(article);
  }

  deleteArticle(id) {
    if (confirm('Are you sure you want to delete this article?')) {
      window.contentStore.deleteArticle(id);
      this.renderArticlesTab(document.getElementById('admin-tab-content'));
    }
  }

  // --- 3. PROGRAMS MANAGEMENT ---
  renderProgramsTab(container) {
    const programs = window.contentStore.getPrograms();

    container.innerHTML = `
      <div class="admin-tab-header">
        <div>
          <h4>Dynamic Community Health Programs</h4>
          <p class="section-desc">Manage family care pathways and community support services visible on the public portal.</p>
        </div>
        <button class="btn btn-primary" onclick="window.adminPortal.showNewProgramForm()">+ Add New Program</button>
      </div>

      <div id="program-form-zone" style="display:none;" class="admin-editor-card"></div>

      <div class="admin-programs-grid">
        ${programs.map(prog => `
          <div class="admin-program-card">
            <div class="prog-top">
              <span class="prog-icon">${prog.icon || '🍁'}</span>
              <span class="badge-status status-active">${prog.isAccepting ? 'Accepting Applicants' : 'Waitlist Only'}</span>
            </div>
            <h4>${prog.title}</h4>
            <p class="prog-cat">Category: <strong>${prog.category}</strong> • Target: ${prog.audience}</p>
            <p class="prog-desc">${prog.description}</p>
            <div class="prog-meta">Active Enrollees: <strong>${prog.activeEnrollees || 0} families</strong></div>
            <div class="prog-footer">
              <button class="btn-action-sm" onclick="window.adminPortal.editProgram('${prog.id}')">✏️ Edit</button>
              <button class="btn-action-sm btn-delete" onclick="window.adminPortal.deleteProgram('${prog.id}')">🗑️ Delete</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  showNewProgramForm(progToEdit = null) {
    const formZone = document.getElementById('program-form-zone');
    if (!formZone) return;

    this.editingProgramId = progToEdit ? progToEdit.id : null;
    const isEdit = Boolean(progToEdit);

    formZone.style.display = 'block';
    formZone.innerHTML = `
      <div class="form-header">
        <h5>${isEdit ? '✏️ Edit Program' : '➕ Add New Community Health Program'}</h5>
        <button class="btn-close-sm" onclick="document.getElementById('program-form-zone').style.display='none'">✕</button>
      </div>
      <form onsubmit="window.adminPortal.submitProgramForm(event)">
        <div class="form-row-2">
          <div class="form-group">
            <label>Program Name *</label>
            <input type="text" id="prog-title" class="form-control" value="${progToEdit?.title || ''}" required>
          </div>
          <div class="form-group">
            <label>Category *</label>
            <input type="text" id="prog-category" class="form-control" value="${progToEdit?.category || 'Caregiver Respite'}" required>
          </div>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label>Target Audience *</label>
            <input type="text" id="prog-audience" class="form-control" value="${progToEdit?.audience || 'Canadian Families & Caregivers'}" required>
          </div>
          <div class="form-group">
            <label>Program Icon (Emoji)</label>
            <input type="text" id="prog-icon" class="form-control" value="${progToEdit?.icon || '🌿'}" required>
          </div>
        </div>
        <div class="form-group">
          <label>Program Description *</label>
          <textarea id="prog-description" class="form-control" rows="3" required>${progToEdit?.description || ''}</textarea>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Create Program'}</button>
          <button type="button" class="btn btn-outline" onclick="document.getElementById('program-form-zone').style.display='none'">Cancel</button>
        </div>
      </form>
    `;
    formZone.scrollIntoView({ behavior: 'smooth' });
  }

  submitProgramForm(e) {
    e.preventDefault();
    const title = document.getElementById('prog-title')?.value;
    const category = document.getElementById('prog-category')?.value;
    const audience = document.getElementById('prog-audience')?.value;
    const icon = document.getElementById('prog-icon')?.value;
    const description = document.getElementById('prog-description')?.value;

    window.contentStore.saveProgram({
      id: this.editingProgramId,
      title,
      category,
      audience,
      icon,
      description,
      isAccepting: true,
      province: 'National'
    });

    window.emailService.showToast({
      title: 'Program Updated',
      message: `"${title}" has been saved.`,
      type: 'success'
    });

    this.renderProgramsTab(document.getElementById('admin-tab-content'));
  }

  editProgram(id) {
    const prog = window.contentStore.getPrograms().find(p => p.id === id);
    if (prog) this.showNewProgramForm(prog);
  }

  deleteProgram(id) {
    if (confirm('Delete this program?')) {
      window.contentStore.deleteProgram(id);
      this.renderProgramsTab(document.getElementById('admin-tab-content'));
    }
  }

  // --- 4. EVENTS & WORKSHOPS ---
  renderEventsTab(container) {
    const events = window.contentStore.getEvents();

    container.innerHTML = `
      <div class="admin-tab-header">
        <div>
          <h4>Workshops, Webinars & Community Circles</h4>
          <p class="section-desc">Schedule and manage interactive caregiver and family health sessions.</p>
        </div>
        <button class="btn btn-primary" onclick="window.adminPortal.showNewEventForm()">+ Schedule Workshop</button>
      </div>

      <div id="event-form-zone" style="display:none;" class="admin-editor-card"></div>

      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Workshop Title</th>
              <th>Date & Time</th>
              <th>Format</th>
              <th>Facilitator</th>
              <th>RSVPs</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${events.map(evt => `
              <tr>
                <td><strong>${evt.title}</strong></td>
                <td>${evt.date}<br><small>${evt.time}</small></td>
                <td><span class="table-badge">${evt.format}</span></td>
                <td>${evt.facilitator}</td>
                <td><strong>${evt.rsvps || 0}</strong> / ${evt.capacity || 50}</td>
                <td>
                  <button class="btn-table-action" onclick="window.adminPortal.editEvent('${evt.id}')">✏️ Edit</button>
                  <button class="btn-table-action btn-delete" onclick="window.adminPortal.deleteEvent('${evt.id}')">🗑️ Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  showNewEventForm(eventToEdit = null) {
    const formZone = document.getElementById('event-form-zone');
    if (!formZone) return;

    this.editingEventId = eventToEdit ? eventToEdit.id : null;
    const isEdit = Boolean(eventToEdit);

    formZone.style.display = 'block';
    formZone.innerHTML = `
      <div class="form-header">
        <h5>${isEdit ? '✏️ Edit Workshop' : '➕ Schedule New Workshop'}</h5>
        <button class="btn-close-sm" onclick="document.getElementById('event-form-zone').style.display='none'">✕</button>
      </div>
      <form onsubmit="window.adminPortal.submitEventForm(event)">
        <div class="form-row-2">
          <div class="form-group">
            <label>Workshop Title *</label>
            <input type="text" id="evt-title" class="form-control" value="${eventToEdit?.title || ''}" required>
          </div>
          <div class="form-group">
            <label>Category *</label>
            <input type="text" id="evt-category" class="form-control" value="${eventToEdit?.category || 'Caregiver Support'}" required>
          </div>
        </div>
        <div class="form-row-3">
          <div class="form-group">
            <label>Date *</label>
            <input type="date" id="evt-date" class="form-control" value="${eventToEdit?.date || '2026-10-25'}" required>
          </div>
          <div class="form-group">
            <label>Time *</label>
            <input type="text" id="evt-time" class="form-control" value="${eventToEdit?.time || '7:00 PM - 8:30 PM EDT'}" required>
          </div>
          <div class="form-group">
            <label>Format</label>
            <input type="text" id="evt-format" class="form-control" value="${eventToEdit?.format || 'Virtual (Zoom)'}">
          </div>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label>Facilitator *</label>
            <input type="text" id="evt-facilitator" class="form-control" value="${eventToEdit?.facilitator || 'Dr. Marc Tremblay, MSW'}" required>
          </div>
          <div class="form-group">
            <label>Capacity</label>
            <input type="number" id="evt-capacity" class="form-control" value="${eventToEdit?.capacity || 40}">
          </div>
        </div>
        <div class="form-group">
          <label>Description *</label>
          <textarea id="evt-desc" class="form-control" rows="3" required>${eventToEdit?.description || ''}</textarea>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Schedule Event'}</button>
          <button type="button" class="btn btn-outline" onclick="document.getElementById('event-form-zone').style.display='none'">Cancel</button>
        </div>
      </form>
    `;
    formZone.scrollIntoView({ behavior: 'smooth' });
  }

  submitEventForm(e) {
    e.preventDefault();
    const title = document.getElementById('evt-title')?.value;
    const category = document.getElementById('evt-category')?.value;
    const date = document.getElementById('evt-date')?.value;
    const time = document.getElementById('evt-time')?.value;
    const format = document.getElementById('evt-format')?.value;
    const facilitator = document.getElementById('evt-facilitator')?.value;
    const capacity = parseInt(document.getElementById('evt-capacity')?.value || '40', 10);
    const description = document.getElementById('evt-desc')?.value;

    window.contentStore.saveEvent({
      id: this.editingEventId,
      title,
      category,
      date,
      time,
      format,
      facilitator,
      capacity,
      description
    });

    window.emailService.showToast({
      title: 'Workshop Scheduled',
      message: `"${title}" has been successfully saved.`,
      type: 'success'
    });

    this.renderEventsTab(document.getElementById('admin-tab-content'));
  }

  editEvent(id) {
    const evt = window.contentStore.getEvents().find(e => e.id === id);
    if (evt) this.showNewEventForm(evt);
  }

  deleteEvent(id) {
    if (confirm('Delete this event?')) {
      window.contentStore.deleteEvent(id);
      this.renderEventsTab(document.getElementById('admin-tab-content'));
    }
  }

  // --- 5. INTAKES & INQUIRIES MANAGEMENT ---
  renderIntakesTab(container) {
    const intakes = window.contentStore.getIntakes();

    container.innerHTML = `
      <div class="admin-tab-header">
        <div>
          <h4>Client Intakes & Support Inquiries (${intakes.length})</h4>
          <p class="section-desc">Manage submitted consultation requests, update status, and reply via Email Notification.</p>
        </div>
      </div>

      <div id="intake-detail-zone" style="display:none;" class="admin-editor-card"></div>

      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Case ID</th>
              <th>Client Name</th>
              <th>Contact</th>
              <th>Province</th>
              <th>Program</th>
              <th>Status</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${intakes.map(intk => `
              <tr>
                <td><code>${intk.id}</code></td>
                <td><strong>${intk.name}</strong></td>
                <td>${intk.email}<br><small>${intk.phone || 'No phone'}</small></td>
                <td>${intk.province || 'ON'}</td>
                <td>${intk.program}</td>
                <td><span class="badge-status status-${intk.status.toLowerCase().replace(' ', '-')}">${intk.status}</span></td>
                <td>${new Date(intk.submittedAt).toLocaleDateString()}</td>
                <td>
                  <button class="btn-table-action" onclick="window.adminPortal.openIntakeDetail('${intk.id}')">Manage & Email</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  openIntakeDetail(id) {
    const detailZone = document.getElementById('intake-detail-zone');
    if (!detailZone) return;

    const intake = window.contentStore.getIntakes().find(i => i.id === id);
    if (!intake) return;

    detailZone.style.display = 'block';
    detailZone.innerHTML = `
      <div class="form-header">
        <h5>📋 Client Support Case File: ${intake.id} - ${intake.name}</h5>
        <button class="btn-close-sm" onclick="document.getElementById('intake-detail-zone').style.display='none'">✕</button>
      </div>

      <div class="intake-detail-grid">
        <div class="detail-col">
          <div class="info-block">
            <strong>Client:</strong> ${intake.name}<br>
            <strong>Email:</strong> ${intake.email}<br>
            <strong>Phone:</strong> ${intake.phone || 'N/A'}<br>
            <strong>Province:</strong> ${intake.province}<br>
            <strong>Submitted:</strong> ${new Date(intake.submittedAt).toLocaleString()}
          </div>
          <div class="info-block">
            <strong>Program Interest:</strong> ${intake.program}<br>
            <strong>Client Message / Request Notes:</strong>
            <p class="notes-quote">"${intake.notes || 'No message provided.'}"</p>
          </div>
        </div>

        <div class="action-col">
          <div class="form-group">
            <label>Update Case Status</label>
            <select id="case-status-select" class="form-control" onchange="window.adminPortal.changeIntakeStatus('${intake.id}', this.value)">
              <option value="New" ${intake.status === 'New' ? 'selected' : ''}>New / Unread</option>
              <option value="In Progress" ${intake.status === 'In Progress' ? 'selected' : ''}>In Progress / Assigned</option>
              <option value="Contacted" ${intake.status === 'Contacted' ? 'selected' : ''}>Contacted / Scheduled</option>
              <option value="Completed" ${intake.status === 'Completed' ? 'selected' : ''}>Completed / Closed</option>
            </select>
          </div>

          <div class="email-reply-box">
            <h6>✉️ Send Official Email Notification to Client</h6>
            <div class="form-group">
              <label>Email Subject</label>
              <input type="text" id="intake-reply-subject" class="form-control" value="Update on your CAFHS Health Support Case #${intake.id}">
            </div>
            <div class="form-group">
              <label>Message Content</label>
              <textarea id="intake-reply-body" class="form-control" rows="4">Dear ${intake.name},

Dr. Marc Tremblay and the CAFHS Clinical Navigation team have reviewed your request regarding ${intake.program}.

We are pleased to confirm that an initial appointment has been reserved for you. Please let us know what time of day suits you best. If your inquiry is urgent, remember you can reach provincial nurses anytime at 8-1-1.

Warm regards,
CAFHS Patient Navigation</textarea>
            </div>
            <button class="btn btn-primary" onclick="window.adminPortal.sendIntakeEmailReply('${intake.id}', '${intake.email}', '${intake.name}')">
              🚀 Send Email Notification Now
            </button>
          </div>
        </div>
      </div>
    `;
    detailZone.scrollIntoView({ behavior: 'smooth' });
  }

  changeIntakeStatus(id, newStatus) {
    window.contentStore.updateIntakeStatus(id, newStatus);
    window.emailService.showToast({
      title: 'Status Updated',
      message: `Case ${id} marked as "${newStatus}"`,
      type: 'info'
    });
    this.renderIntakesTab(document.getElementById('admin-tab-content'));
  }

  sendIntakeEmailReply(intakeId, email, name) {
    const subject = document.getElementById('intake-reply-subject')?.value;
    const body = document.getElementById('intake-reply-body')?.value;

    window.emailService.sendEmail({
      to: email,
      toName: name,
      subject: subject,
      body: body,
      category: 'intake_reply'
    });

    window.contentStore.updateIntakeStatus(intakeId, 'Contacted');
    document.getElementById('intake-detail-zone').style.display = 'none';
    this.renderIntakesTab(document.getElementById('admin-tab-content'));
  }

  // --- 6. EMAIL NOTIFICATIONS CENTER ---
  renderEmailsTab(container) {
    const emails = window.emailService.getEmails();

    container.innerHTML = `
      <div class="admin-tab-header">
        <div>
          <h4>Email Notifications Center</h4>
          <p class="section-desc">Compose custom notifications, broadcast announcements, and inspect dispatch logs.</p>
        </div>
        <button class="btn btn-primary" onclick="document.getElementById('compose-email-zone').style.display='block'">+ Compose Notification</button>
      </div>

      <div id="compose-email-zone" style="display:none;" class="admin-editor-card">
        <div class="form-header">
          <h5>✉️ Compose New Email Notification</h5>
          <button class="btn-close-sm" onclick="document.getElementById('compose-email-zone').style.display='none'">✕</button>
        </div>
        <form onsubmit="window.adminPortal.submitCustomEmail(event)">
          <div class="form-row-2">
            <div class="form-group">
              <label>Recipient Email Address *</label>
              <input type="email" id="compose-to" class="form-control" placeholder="client@example.ca" required>
            </div>
            <div class="form-group">
              <label>Recipient Name</label>
              <input type="text" id="compose-name" class="form-control" placeholder="Sarah Chen">
            </div>
          </div>
          <div class="form-group">
            <label>Subject Line *</label>
            <input type="text" id="compose-subject" class="form-control" placeholder="Important Update Regarding Your Caregiver Support Request" required>
          </div>
          <div class="form-group">
            <label>Email Body *</label>
            <textarea id="compose-body" class="form-control" rows="5" placeholder="Write your message to the family member..." required></textarea>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">🚀 Send Email Notification</button>
            <button type="button" class="btn btn-outline" onclick="document.getElementById('compose-email-zone').style.display='none'">Cancel</button>
          </div>
        </form>
      </div>

      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Recipient</th>
              <th>Subject</th>
              <th>Category</th>
              <th>Status</th>
              <th>Preview</th>
            </tr>
          </thead>
          <tbody>
            ${emails.map(e => `
              <tr>
                <td>${new Date(e.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                <td><strong>${e.toName}</strong><br><small>&lt;${e.to}&gt;</small></td>
                <td>${e.subject}</td>
                <td><span class="table-badge">${e.category}</span></td>
                <td><span class="badge-status status-active">Delivered</span></td>
                <td>
                  <button class="btn-table-action" onclick="window.emailService.openNotificationModal('${e.id}')">View Email</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  submitCustomEmail(e) {
    e.preventDefault();
    const to = document.getElementById('compose-to')?.value;
    const name = document.getElementById('compose-name')?.value || 'Community Member';
    const subject = document.getElementById('compose-subject')?.value;
    const body = document.getElementById('compose-body')?.value;

    window.emailService.sendEmail({
      to,
      toName: name,
      subject,
      body,
      category: 'admin_broadcast'
    });

    document.getElementById('compose-email-zone').style.display = 'none';
    this.renderEmailsTab(document.getElementById('admin-tab-content'));
  }

  // --- 7. CHATGPT & AI CONFIGURATION ---
  renderChatGPTTab(container) {
    const provider = localStorage.getItem('cafhs_ai_provider') || 'openai';
    const apiKey = localStorage.getItem('cafhs_ai_key') || '';
    const model = localStorage.getItem('cafhs_ai_model') || 'gpt-4o-mini';

    container.innerHTML = `
      <div class="admin-tab-header">
        <div>
          <h4>🤖 ChatGPT API Integration & AI Health Engine</h4>
          <p class="section-desc">Connect the bottom-right AI health bot directly with OpenAI's ChatGPT API.</p>
        </div>
      </div>

      <div class="chatgpt-config-card">
        <div class="api-status-banner ${apiKey ? 'status-connected' : 'status-fallback'}">
          <div class="status-indicator-dot"></div>
          <div>
            <strong>${apiKey ? 'OpenAI ChatGPT API Active & Connected' : 'Canadian Family Health Heuristic Engine Active (Fallback Mode)'}</strong>
            <p>${apiKey ? `Live queries powered by OpenAI model: ${model}` : 'When no API key is set, the chatbot uses the built-in Canadian healthcare intelligence engine with 988, 811, 211, and caregiver knowledge.'}</p>
          </div>
        </div>

        <form onsubmit="window.adminPortal.saveChatGPTConfig(event)">
          <div class="form-group">
            <label>AI Service Provider</label>
            <select id="admin-ai-provider" class="form-control" onchange="window.adminPortal.onProviderChange(this.value)">
              <option value="openai" ${provider === 'openai' ? 'selected' : ''}>OpenAI (ChatGPT API - Recommended)</option>
              <option value="builtin" ${provider === 'builtin' ? 'selected' : ''}>Built-in Canadian Family Health Engine (No API Key Required)</option>
              <option value="gemini" ${provider === 'gemini' ? 'selected' : ''}>Google Gemini API</option>
            </select>
          </div>

          <div class="form-group">
            <label>OpenAI ChatGPT API Key</label>
            <input type="password" id="admin-ai-key" class="form-control" placeholder="sk-proj-..." value="${apiKey}">
            <small class="helper-text">Your API key is securely stored in your local browser session and used for live ChatGPT navigation responses.</small>
          </div>

          <div class="form-group">
            <label>ChatGPT Model</label>
            <select id="admin-ai-model" class="form-control">
              <option value="gpt-4o-mini" ${model === 'gpt-4o-mini' ? 'selected' : ''}>GPT-4o-mini (Fast, Empathetic, Recommended)</option>
              <option value="gpt-4o" ${model === 'gpt-4o' ? 'selected' : ''}>GPT-4o (Most Intelligent, Deep Reasoning)</option>
              <option value="gpt-3.5-turbo" ${model === 'gpt-3.5-turbo' ? 'selected' : ''}>GPT-3.5-Turbo (Legacy)</option>
            </select>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary">💾 Save API Configuration</button>
            <button type="button" class="btn btn-secondary" onclick="window.adminPortal.testChatGPTConnection()">⚡ Test Connection</button>
          </div>
        </form>

        <div id="chatgpt-test-result" style="margin-top: 1.5rem; display:none;"></div>
      </div>
    `;
  }

  saveChatGPTConfig(e) {
    e.preventDefault();
    const provider = document.getElementById('admin-ai-provider')?.value || 'openai';
    const apiKey = document.getElementById('admin-ai-key')?.value.trim() || '';
    const model = document.getElementById('admin-ai-model')?.value || 'gpt-4o-mini';

    localStorage.setItem('cafhs_ai_provider', provider);
    localStorage.setItem('cafhs_ai_key', apiKey);
    localStorage.setItem('cafhs_ai_model', model);

    if (window.chatEngine) {
      window.chatEngine.apiKeyConfig.provider = provider;
      window.chatEngine.apiKeyConfig.apiKey = apiKey;
      window.chatEngine.apiKeyConfig.model = model;
      window.chatEngine.syncChatHeaderStatus();
      window.chatEngine.renderMessages();
    }

    window.emailService.showToast({
      title: 'AI Config Saved',
      message: `ChatGPT engine configured with model: <strong>${model}</strong>`,
      type: 'success'
    });

    this.renderChatGPTTab(document.getElementById('admin-tab-content'));
  }

  async testChatGPTConnection() {
    const key = document.getElementById('admin-ai-key')?.value.trim();
    const resultBox = document.getElementById('chatgpt-test-result');
    if (!resultBox) return;

    resultBox.style.display = 'block';

    if (!key) {
      resultBox.innerHTML = `
        <div class="test-alert alert-info">
          🍁 <strong>Built-in Canadian Health Engine Active:</strong> No OpenAI API key provided. The chatbot will deliver comprehensive answers using its built-in knowledge base (covering 988, 811, 211, caregiver tax credits, postpartum and youth support).
        </div>
      `;
      return;
    }

    resultBox.innerHTML = `<div class="test-alert alert-loading">⏳ Pinging OpenAI ChatGPT API...</div>`;

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: document.getElementById('admin-ai-model')?.value || 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Respond with "CAFHS Connected" in 3 words.' }],
          max_tokens: 15
        })
      });

      const data = await res.json();
      if (res.ok && data.choices && data.choices[0]) {
        resultBox.innerHTML = `
          <div class="test-alert alert-success">
            ✅ <strong>Connection Successful!</strong> ChatGPT responded: <em>"${data.choices[0].message.content}"</em>
          </div>
        `;
      } else {
        resultBox.innerHTML = `
          <div class="test-alert alert-warning">
            ⚠️ <strong>OpenAI Response:</strong> ${data.error ? data.error.message : 'HTTP ' + res.status}
          </div>
        `;
      }
    } catch (err) {
      resultBox.innerHTML = `
        <div class="test-alert alert-warning">
          ⚠️ <strong>Network Note:</strong> ${err.message}. (Built-in Canadian Healthcare Engine remains ready as fallback).
        </div>
      `;
    }
  }

  // --- USER MANAGEMENT TAB (SQLite Database: users table) ---
  async renderUsersTab(container) {
    container.innerHTML = `<div style="padding: 2.5rem; text-align: center; color: #64748B;">⏳ Loading database users from SQLite (Table: users)...</div>`;

    let dbUsers = [];
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      dbUsers = data.users || [];
    } catch (e) {
      console.error(e);
      dbUsers = window.authService.getUsers();
    }

    this._cachedUsers = dbUsers;

    container.innerHTML = `
      <div class="admin-tab-header">
        <div>
          <h4>👥 Database User Management (SQLite Table: users)</h4>
          <p class="section-desc">Manage all registered users, administrators, and social logins stored in the SQLite database.</p>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn btn-outline" onclick="window.adminPortal.refreshUsersTab()">🔄 Refresh DB</button>
          <button class="btn btn-primary" onclick="window.adminPortal.showNewUserModal()">+ Add New User</button>
        </div>
      </div>

      <div style="background: white; border-radius: 10px; padding: 1rem; border: 1px solid #E2E8F0; margin-bottom: 1.5rem; display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 250px;">
          <input type="text" id="user-search-input" class="form-control" placeholder="Search by name, email, or province..." oninput="window.adminPortal.filterUsersTable()">
        </div>
        <div style="width: 180px;">
          <select id="user-role-filter" class="form-control" onchange="window.adminPortal.filterUsersTable()">
            <option value="">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="user">Registered Members</option>
          </select>
        </div>
        <div style="font-size: 0.88rem; color: #475569; font-weight: 500;">
          Total in DB: <span id="user-count-badge" class="badge-status status-active" style="display:inline-block;">${dbUsers.length} Users</span>
        </div>
      </div>

      <div id="user-create-card" style="display:none; margin-bottom:1.5rem;" class="admin-editor-card">
        <h5>+ Create New User Account (Saved Directly to SQLite)</h5>
        <form onsubmit="window.adminPortal.submitCreateUser(event)">
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
            <div class="form-group">
              <label>Full Name *</label>
              <input type="text" id="new-user-name" class="form-control" required placeholder="e.g. Alex Tremblay">
            </div>
            <div class="form-group">
              <label>Email Address *</label>
              <input type="email" id="new-user-email" class="form-control" required placeholder="alex.tremblay@example.ca">
            </div>
          </div>
          <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:1rem;">
            <div class="form-group">
              <label>Role</label>
              <select id="new-user-role" class="form-control">
                <option value="user">Community Member</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div class="form-group">
              <label>Province</label>
              <select id="new-user-province" class="form-control">
                <option value="ON">Ontario (ON)</option>
                <option value="QC">Quebec (QC)</option>
                <option value="BC">British Columbia (BC)</option>
                <option value="AB">Alberta (AB)</option>
                <option value="NS">Nova Scotia (NS)</option>
                <option value="MB">Manitoba (MB)</option>
                <option value="SK">Saskatchewan (SK)</option>
                <option value="NB">New Brunswick (NB)</option>
                <option value="NL">Newfoundland & Labrador (NL)</option>
                <option value="PE">Prince Edward Island (PE)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Title / Affiliation</label>
              <input type="text" id="new-user-title" class="form-control" placeholder="e.g. Family Peer Supporter">
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Save User to DB</button>
            <button type="button" class="btn btn-outline" onclick="document.getElementById('user-create-card').style.display='none'">Cancel</button>
          </div>
        </form>
      </div>

      <div class="admin-table-wrapper">
        <table class="admin-table" id="db-users-table">
          <thead>
            <tr>
              <th>User / Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Sign-in Provider</th>
              <th>Province</th>
              <th>Status</th>
              <th>Registered / Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="db-users-tbody">
            ${this.buildUsersTableRows(dbUsers)}
          </tbody>
        </table>
      </div>
    `;
  }

  buildUsersTableRows(users) {
    if (!users || users.length === 0) {
      return `<tr><td colspan="8" style="text-align:center; padding: 2.5rem; color: #94A3B8;">No users found in database.</td></tr>`;
    }

    return users.map(u => {
      const isAdmin = u.role === 'admin';
      const isDefaultSuperAdmin = u.email === 'mack.chen@viccollege.com' || u.email === 'admin@cafhs.ca';
      const providerIcon = u.provider === 'google' ? '🌐 Google' : (u.provider === 'linkedin' ? '💼 LinkedIn' : '🔑 Local');
      const createdStr = u.created_at ? (u.created_at.split('T')[0] || u.created_at.substring(0, 10)) : 'Recent';
      
      return `
        <tr data-name="${(u.name || '').toLowerCase()}" data-email="${(u.email || '').toLowerCase()}" data-role="${u.role}">
          <td>
            <strong>${this.escapeHtml(u.name)}</strong>
            <div style="font-size:0.75rem; color:#64748B;">${this.escapeHtml(u.title || (isAdmin ? 'Executive Administrator' : 'Community Member'))}</div>
          </td>
          <td><code style="font-size:0.82rem; background:#F1F5F9; padding:2px 6px; border-radius:4px;">${this.escapeHtml(u.email)}</code></td>
          <td>
            <span class="role-badge ${isAdmin ? 'admin' : 'user'}">
              ${isAdmin ? '🍁 Administrator' : '👤 Member'}
            </span>
          </td>
          <td><small style="color:#475569; font-weight:500;">${providerIcon}</small></td>
          <td><span class="table-badge">${u.province || 'ON'}</span></td>
          <td><span class="badge-status status-active">${u.status || 'Active'}</span></td>
          <td><small style="color:#64748B;">${createdStr}</small></td>
          <td>
            ${isDefaultSuperAdmin ? `
              <span style="font-size:0.75rem; color:#059669; font-weight:600;">🔒 Primary Admin</span>
            ` : `
              <button class="btn-table-action" onclick="window.adminPortal.toggleUserRole('${u.user_id || u.id}', '${u.role}')" title="Change Role">
                ${isAdmin ? '⬇️ Demote' : '⬆️ Make Admin'}
              </button>
              <button class="btn-table-action btn-delete" onclick="window.adminPortal.deleteDbUser('${u.user_id || u.id}', '${this.escapeHtml(u.name)}')" title="Delete User">
                🗑️
              </button>
            `}
          </td>
        </tr>
      `;
    }).join('');
  }

  filterUsersTable() {
    const search = (document.getElementById('user-search-input')?.value || '').toLowerCase().trim();
    const role = document.getElementById('user-role-filter')?.value || '';
    const rows = document.querySelectorAll('#db-users-tbody tr');

    let visibleCount = 0;
    rows.forEach(row => {
      const name = row.getAttribute('data-name') || '';
      const email = row.getAttribute('data-email') || '';
      const rowRole = row.getAttribute('data-role') || '';

      const matchesSearch = !search || name.includes(search) || email.includes(search);
      const matchesRole = !role || rowRole === role;

      if (matchesSearch && matchesRole) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });

    const badge = document.getElementById('user-count-badge');
    if (badge) badge.innerText = `${visibleCount} Shown`;
  }

  showNewUserModal() {
    const card = document.getElementById('user-create-card');
    if (card) {
      card.style.display = card.style.display === 'none' ? 'block' : 'none';
      if (card.style.display === 'block') {
        document.getElementById('new-user-name')?.focus();
      }
    }
  }

  async submitCreateUser(e) {
    e.preventDefault();
    const name = document.getElementById('new-user-name')?.value.trim();
    const email = document.getElementById('new-user-email')?.value.trim();
    const role = document.getElementById('new-user-role')?.value || 'user';
    const province = document.getElementById('new-user-province')?.value || 'ON';
    const title = document.getElementById('new-user-title')?.value.trim() || (role === 'admin' ? 'Executive Administrator' : 'Community Member');

    if (!name || !email) return;

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role, province, title })
      });
      const data = await res.json();
      if (data.success) {
        window.emailService.showToast({
          title: 'User Added to DB',
          message: `User <strong>${name}</strong> successfully registered in SQLite database.`,
          type: 'success'
        });
        document.getElementById('user-create-card').style.display = 'none';
        this.renderUsersTab(document.getElementById('admin-tab-content'));
      } else {
        alert(data.error || 'Failed to create user');
      }
    } catch (err) {
      alert('Error creating user: ' + err.message);
    }
  }

  async toggleUserRole(userId, currentRole) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const newTitle = newRole === 'admin' ? 'Executive Administrator' : 'Community Member';
    if (!confirm(`Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`)) return;

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole, title: newTitle })
      });
      const data = await res.json();
      if (data.success) {
        window.emailService.showToast({
          title: 'Role Updated',
          message: `User role successfully set to <strong>${newRole}</strong> in SQLite database.`,
          type: 'info'
        });
        this.renderUsersTab(document.getElementById('admin-tab-content'));
      }
    } catch (err) {
      alert('Error updating role: ' + err.message);
    }
  }

  async deleteDbUser(userId, name) {
    if (!confirm(`Are you sure you want to delete user "${name}" from the SQLite database?`)) return;

    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        window.emailService.showToast({
          title: 'User Deleted',
          message: `User ${name} removed from SQLite database.`,
          type: 'warning'
        });
        this.renderUsersTab(document.getElementById('admin-tab-content'));
      }
    } catch (err) {
      alert('Error deleting user: ' + err.message);
    }
  }

  refreshUsersTab() {
    this.renderUsersTab(document.getElementById('admin-tab-content'));
  }

  // --- CHAT TRANSCRIPTS & SITE MANAGEMENT ALERTS TAB ---
  async renderChatLogsTab(container) {
    container.innerHTML = `<div style="padding: 2.5rem; text-align: center; color: #64748B;">⏳ Loading chat transcripts and site management alerts from SQLite...</div>`;

    let chatLogs = [];
    let siteEmails = [];
    try {
      const [logsRes, emailsRes] = await Promise.all([
        fetch('/api/chat/logs?limit=100'),
        fetch('/api/admin/emails')
      ]);
      const logsData = await logsRes.json();
      const emailsData = await emailsRes.json();
      chatLogs = logsData.chat_logs || [];
      siteEmails = emailsData.emails || [];
    } catch (e) {
      console.error(e);
    }

    const crisisCount = chatLogs.filter(c => c.is_crisis).length;

    container.innerHTML = `
      <div class="admin-tab-header">
        <div>
          <h4>💬 Chat Transcripts & Site Management Email Alerts</h4>
          <p class="section-desc">Audit logs for all user conversations with Nova AI, with automatic email alerts to site management team (admin@cafhs.ca & mack.chen@viccollege.com).</p>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn btn-outline" onclick="window.adminPortal.switchTab('chatlogs')">🔄 Refresh Logs</button>
        </div>
      </div>

      <div class="admin-overview-grid" style="margin-bottom: 1.5rem;">
        <div class="stat-box highlight">
          <div class="stat-icon">💬</div>
          <div class="stat-data">
            <span class="stat-num">${chatLogs.length}</span>
            <span class="stat-title">Logged Consultations</span>
          </div>
        </div>
        <div class="stat-box" style="border-left: 4px solid #DC2626;">
          <div class="stat-icon">🚨</div>
          <div class="stat-data">
            <span class="stat-num" style="color: #DC2626;">${crisisCount}</span>
            <span class="stat-title">Crisis Guardrails (988)</span>
          </div>
        </div>
        <div class="stat-box">
          <div class="stat-icon">📧</div>
          <div class="stat-data">
            <span class="stat-num">${siteEmails.length}</span>
            <span class="stat-title">Management Alerts Dispatched</span>
          </div>
        </div>
      </div>

      <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;">
        <div>
          <strong style="color: #166534;">📬 Site Management Notification Flow:</strong>
          <span style="color: #15803D; font-size: 0.88rem; margin-left: 0.5rem;">Each conversation logs user email & name and sends automated email records to:</span>
          <div style="margin-top: 0.4rem;">
            <code style="background: white; padding: 3px 8px; border-radius: 4px; font-weight: 600; color: #047857; margin-right: 0.5rem; border:1px solid #A7F3D0;">admin@cafhs.ca</code>
            <code style="background: white; padding: 3px 8px; border-radius: 4px; font-weight: 600; color: #047857; border:1px solid #A7F3D0;">mack.chen@viccollege.com</code>
          </div>
        </div>
        <span class="badge-status status-active">Active in SQLite DB</span>
      </div>

      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Date / Time</th>
              <th>User Name & Email</th>
              <th>Inquiry / Message</th>
              <th>AI Response Preview</th>
              <th>Engine</th>
              <th>Crisis Guardrail</th>
              <th>Site Management Alert</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${chatLogs.length === 0 ? `
              <tr>
                <td colspan="8" style="text-align: center; padding: 2.5rem; color: #94A3B8;">
                  No chat logs recorded yet. Log in as a user and chat with Nova AI to test live database recording & email alerts!
                </td>
              </tr>
            ` : chatLogs.map((log, idx) => `
              <tr style="${log.is_crisis ? 'background: rgba(254, 242, 242, 0.7);' : ''}">
                <td style="white-space: nowrap; font-size: 0.8rem; color: #64748B;">
                  ${log.created_at || 'Recent'}
                </td>
                <td>
                  <strong>${this.escapeHtml(log.user_name || 'Member')}</strong>
                  <div style="font-size: 0.78rem; color: #475569;">${this.escapeHtml(log.user_email || 'N/A')}</div>
                </td>
                <td>
                  <div style="max-width: 200px; font-size: 0.85rem; font-weight: 500; color: #1E293B; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${this.escapeHtml(log.user_message)}">
                    "${this.escapeHtml(log.user_message)}"
                  </div>
                </td>
                <td>
                  <div style="max-width: 240px; font-size: 0.82rem; color: #475569; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${this.escapeHtml(log.ai_response)}">
                    ${this.escapeHtml(log.ai_response)}
                  </div>
                </td>
                <td>
                  <span class="table-badge" style="font-size:0.75rem;">${log.model_used || 'builtin'}</span>
                </td>
                <td>
                  ${log.is_crisis ? `
                    <span class="badge-status" style="background:#FEE2E2; color:#B91C1C; font-weight:700;">🚨 9-8-8 Crisis</span>
                  ` : `
                    <span class="badge-status status-active" style="background:#E0F2FE; color:#0369A1;">Standard</span>
                  `}
                </td>
                <td>
                  <span style="font-size: 0.75rem; color: #047857; font-weight: 600; display: inline-flex; align-items: center; gap: 3px;">
                    ✅ Sent to 2 Admins
                  </span>
                </td>
                <td>
                  <button class="btn-table-action" onclick="window.adminPortal.showChatTranscriptDetail(${idx})">
                    👁️ View Details
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div id="chat-detail-modal" class="modal-overlay">
        <div class="modal-card" style="max-width: 750px; padding: 2rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; border-bottom:1px solid #E2E8F0; padding-bottom:1rem;">
            <h4 style="margin:0;" id="chat-modal-title">Consultation Audit Details</h4>
            <button type="button" class="modal-close-btn" style="position:static;" onclick="document.getElementById('chat-detail-modal').classList.remove('active')">✕</button>
          </div>
          <div id="chat-modal-body"></div>
        </div>
      </div>
    `;

    this._cachedChatLogs = chatLogs;
  }

  showChatTranscriptDetail(index) {
    const log = this._cachedChatLogs ? this._cachedChatLogs[index] : null;
    if (!log) return;

    const modal = document.getElementById('chat-detail-modal');
    const modalBody = document.getElementById('chat-modal-body');
    if (!modal || !modalBody) return;

    modalBody.innerHTML = `
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin-bottom:1.5rem; background:#F8FAFC; padding:1rem; border-radius:8px; border:1px solid #E2E8F0;">
        <div>
          <small style="color:#64748B; font-weight:600;">USER NAME</small>
          <div style="font-weight:700; color:#0F172A; font-size:1.05rem;">${this.escapeHtml(log.user_name)}</div>
        </div>
        <div>
          <small style="color:#64748B; font-weight:600;">USER EMAIL</small>
          <div><code style="font-size:0.9rem; background:white; padding:2px 6px; border-radius:4px; border:1px solid #CBD5E1;">${this.escapeHtml(log.user_email)}</code></div>
        </div>
        <div>
          <small style="color:#64748B; font-weight:600;">DATE & TIME</small>
          <div style="font-size:0.88rem; color:#334155;">${log.created_at}</div>
        </div>
        <div>
          <small style="color:#64748B; font-weight:600;">CRISIS STATUS</small>
          <div>
            ${log.is_crisis 
              ? '<span class="badge-status" style="background:#FEE2E2; color:#B91C1C; font-weight:700;">🚨 9-8-8 Crisis Guardrail Activated</span>'
              : '<span class="badge-status status-active">Standard Consultation</span>'}
          </div>
        </div>
      </div>

      <div style="margin-bottom: 1.25rem;">
        <label style="font-weight:700; color:#0F172A; display:block; margin-bottom:0.4rem;">User Health Inquiry / Prompt:</label>
        <div style="background:#EFF6FF; border-left:4px solid #3B82F6; padding:1rem; border-radius:4px; font-size:0.95rem; color:#1E3A8A; line-height:1.5;">
          ${this.escapeHtml(log.user_message)}
        </div>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <label style="font-weight:700; color:#0F172A; display:block; margin-bottom:0.4rem;">Nova AI Assistant Response:</label>
        <div style="background:#F0FDF4; border-left:4px solid #10B981; padding:1rem; border-radius:4px; font-size:0.9rem; color:#064E3B; line-height:1.6; max-height:260px; overflow-y:auto; white-space:pre-wrap;">
${this.escapeHtml(log.ai_response)}
        </div>
      </div>

      <div style="background:#FEF3C7; border:1px solid #FDE68A; border-radius:8px; padding:0.75rem 1rem; font-size:0.85rem; color:#92400E;">
        <strong>Site Management Email Dispatched:</strong> Automated notification was recorded in SQLite database table <code>site_management_emails</code> and sent to:
        <br>• <code>admin@cafhs.ca</code> (Dr. Marc Tremblay)
        <br>• <code>mack.chen@viccollege.com</code> (Mack Chen)
      </div>
    `;

    modal.classList.add('active');
  }

  // --- 10. CONTRIBUTIONS & OFFICIAL RECEIPTS REGISTRY ---
  async renderContributionsTab(container) {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.25rem;">
        <div>
          <h3 style="margin:0 0 0.25rem 0; color:#0D3B3A;">💰 Grassroots Contributions & Official Receipts Registry</h3>
          <p style="margin:0; font-size:0.85rem; color:#64748B;">
            Live contributions recorded in SQLite database table <code>contributions</code>. Official bilingual receipts automatically issued to donors upon settlement.
          </p>
        </div>
        <button class="btn btn-outline btn-sm" onclick="window.adminPortal.renderContributionsTab(document.getElementById('admin-tab-content'))">
          🔄 Refresh Registry
        </button>
      </div>

      <div class="partner-institution-banner" style="margin-bottom:1.25rem;">
        <span>🎓</span>
        <div>
          <strong>Institutional Healthcare Training Partners:</strong> In collaboration with Ontario public and private education organizations — community healthcare and caregiver support training partners.
        </div>
      </div>

      <div id="contrib-stats-banner-zone">
        <div style="text-align:center; padding:1.5rem; color:#64748B;">Loading financial metrics...</div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; gap:1rem;">
        <div style="position:relative; flex:1; max-width:400px;">
          <input type="text" id="contrib-search-input" class="form-control" placeholder="Search by donor name, email or reference ID..." oninput="window.adminPortal.filterContributionsTable(this.value)">
        </div>
        <button class="btn btn-secondary btn-sm" onclick="window.app.openContributionCheckoutModal()">
          + Add Community Contribution
        </button>
      </div>

      <div class="contrib-table-wrap">
        <table class="contrib-table" id="contrib-table-main">
          <thead>
            <tr>
              <th>Receipt Ref</th>
              <th>Donor Name & Email</th>
              <th>Province</th>
              <th>Amount (CAD)</th>
              <th>Frequency</th>
              <th>Method</th>
              <th>Status</th>
              <th>Date / Time</th>
              <th>Receipt</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="contrib-table-body">
            <tr><td colspan="10" style="text-align:center; padding:2rem; color:#64748B;">Fetching contribution records...</td></tr>
          </tbody>
        </table>
      </div>
    `;

    try {
      const response = await fetch('/api/contributions');
      const data = await response.json();
      this.currentContributions = data.contributions || [];

      // Render stats banner
      const totalAmount = data.total_amount_cad || 0;
      const count = data.total_count || 0;
      const avg = count > 0 ? (totalAmount / count) : 0;

      const bannerZone = document.getElementById('contrib-stats-banner-zone');
      if (bannerZone) {
        bannerZone.innerHTML = `
          <div class="contrib-stats-banner">
            <div class="contrib-stat-card">
              <span class="stat-val">$${totalAmount.toFixed(2)} CAD</span>
              <span class="stat-lbl">Total Funds Raised</span>
            </div>
            <div class="contrib-stat-card">
              <span class="stat-val">${count}</span>
              <span class="stat-lbl">Total Contributions</span>
            </div>
            <div class="contrib-stat-card">
              <span class="stat-val">$${avg.toFixed(2)} CAD</span>
              <span class="stat-lbl">Average Contribution</span>
            </div>
            <div class="contrib-stat-card">
              <span class="stat-val" style="color:#15803D;">100%</span>
              <span class="stat-lbl">Receipts Dispatched</span>
            </div>
          </div>
        `;
      }

      this.renderContributionsRows(this.currentContributions);

    } catch (err) {
      console.error('Error fetching contributions:', err);
      const tbody = document.getElementById('contrib-table-body');
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; color:red; padding:2rem;">Failed to load contributions: ${err.message}</td></tr>`;
      }
    }
  }

  renderContributionsRows(items) {
    const tbody = document.getElementById('contrib-table-body');
    if (!tbody) return;

    if (!items || items.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align:center; padding:3rem; color:#64748B;">
            <div style="font-size:2rem; margin-bottom:0.5rem;">🍁</div>
            No contributions recorded yet. Contributions made via the Support page will appear here with official receipts issued.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = items.map(c => {
      const dateStr = new Date(c.created_at || Date.now()).toLocaleDateString('en-CA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      const methodBadgeClass = c.payment_method === 'interac' ? 'interac' : (c.payment_method === 'paypal' ? 'paypal' : '');

      return `
        <tr>
          <td><code style="font-weight:700; color:#0D3B3A;">${this.escapeHtml(c.transaction_id)}</code></td>
          <td>
            <strong>${this.escapeHtml(c.donor_name)}</strong><br>
            <small style="color:#64748B;">${this.escapeHtml(c.donor_email)}</small>
          </td>
          <td><span class="badge-status status-active">${this.escapeHtml(c.province || 'ON')}</span></td>
          <td><strong style="color:#0D3B3A; font-size:1rem;">$${parseFloat(c.amount).toFixed(2)}</strong></td>
          <td style="text-transform:capitalize;">${this.escapeHtml(c.frequency ? c.frequency.replace('_', ' ') : 'One-Time')}</td>
          <td>
            <span class="badge-payment ${methodBadgeClass}">${this.escapeHtml(c.payment_method ? c.payment_method.replace('_', ' ') : 'Credit Card')}</span>
          </td>
          <td><span class="badge-status status-active">Settled</span></td>
          <td style="white-space:nowrap; font-size:0.78rem; color:#64748B;">${dateStr}</td>
          <td>
            <span class="badge-receipt-sent">✓ Sent to Email</span>
          </td>
          <td style="white-space:nowrap;">
            <button class="btn btn-outline btn-sm" onclick="window.adminPortal.inspectContributionReceipt('${c.transaction_id}')" title="View Official Receipt">
              📄 View Receipt
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  filterContributionsTable(query) {
    if (!this.currentContributions) return;
    const q = (query || '').toLowerCase().trim();
    if (!q) {
      this.renderContributionsRows(this.currentContributions);
      return;
    }
    const filtered = this.currentContributions.filter(c =>
      (c.donor_name && c.donor_name.toLowerCase().includes(q)) ||
      (c.donor_email && c.donor_email.toLowerCase().includes(q)) ||
      (c.transaction_id && c.transaction_id.toLowerCase().includes(q))
    );
    this.renderContributionsRows(filtered);
  }

  inspectContributionReceipt(transactionId) {
    const item = (this.currentContributions || []).find(c => c.transaction_id === transactionId);
    if (!item) {
      alert('Contribution record not found.');
      return;
    }

    if (window.app && window.app.displayOfficialReceiptModal) {
      window.app.displayOfficialReceiptModal(item, {});
    }
  }

  // --- 11. TRAINING PARTNERS TAB ---
  async renderPartnersTab(container) {
    container.innerHTML = `
      <div class="admin-tab-header">
        <div>
          <h2>🎓 Ontario Educational & Training Partners Network</h2>
          <p class="section-desc">
            All community donor gifts are received directly by CAFHS. CAFHS Executive Management administers and allocates healthcare training grants and student bursaries to authorized Ontario educational partners.
          </p>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn btn-outline btn-sm" onclick="window.adminPortal.renderPartnersTab(document.getElementById('admin-tab-content'))">
            🔄 Refresh Registry
          </button>
          <button class="btn btn-primary btn-sm" onclick="window.app.openPartnerRegistrationModal()">
            + Register New Institution
          </button>
        </div>
      </div>

      <div id="tp-stats-banner-zone">
        <div style="text-align:center; padding:1.5rem; color:#64748B;">Loading institutional partner metrics...</div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; gap:1rem; flex-wrap:wrap;">
        <div style="position:relative; flex:1; max-width:400px;">
          <input type="text" id="tp-search-input" class="form-control" placeholder="Search by institution, city, programs or code..." oninput="window.adminPortal.filterPartnersTable(this.value)">
        </div>
        <div style="display:flex; gap:0.5rem;">
          <select id="tp-type-filter" class="form-control" style="width:auto; font-size:0.85rem;" onchange="window.adminPortal.filterPartnersTable(document.getElementById('tp-search-input').value)">
            <option value="">All Institution Types</option>
            <option value="private_career_college">Private Career College</option>
            <option value="public_college">Public College</option>
            <option value="community_training_org">Community Org</option>
            <option value="university">University Faculty</option>
          </select>
        </div>
      </div>

      <div class="contrib-table-wrap" style="margin-bottom: 2rem;">
        <table class="contrib-table" id="tp-table-main">
          <thead>
            <tr>
              <th>Partner Code</th>
              <th>Institution & Location</th>
              <th>Classification</th>
              <th>Primary Contact</th>
              <th>Accredited Programs</th>
              <th>Disbursement / Payout</th>
              <th>Allocated Grants</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="tp-table-body">
            <tr><td colspan="9" style="text-align:center; padding:2rem; color:#64748B;">Loading registered training institutions...</td></tr>
          </tbody>
        </table>
      </div>

      <!-- CAFHS Institutional Grant Disbursements Ledger -->
      <div style="margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <h3 style="font-size: 1.15rem; margin-bottom: 0.25rem; color: #0D3B3A; display: flex; align-items: center; gap: 6px;">
              🏛️ CAFHS Grant Disbursements & Bursary Allocations Ledger
            </h3>
            <p style="font-size: 0.82rem; color: #64748B; margin: 0;">
              Audited record of grants authorized by CAFHS from centralized donor contributions to Ontario educational partners.
            </p>
          </div>
        </div>

        <div class="contrib-table-wrap">
          <table class="contrib-table" id="tp-allocations-table">
            <thead>
              <tr>
                <th>Grant Ref</th>
                <th>Recipient Partner</th>
                <th>Allocated Amount</th>
                <th>Designated Purpose</th>
                <th>Authorized By</th>
                <th>Admin Reference Memo</th>
                <th>Date Disbursed</th>
                <th>Remittance Status</th>
              </tr>
            </thead>
            <tbody id="tp-allocations-body">
              <tr><td colspan="8" style="text-align:center; padding:1.5rem; color:#64748B;">Loading grant allocation ledger...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    try {
      const [partnersRes, statsRes, allocRes] = await Promise.all([
        fetch('/api/training-partners'),
        fetch('/api/stats'),
        fetch('/api/allocations')
      ]);

      if (!partnersRes.ok) throw new Error('Failed to load training partners.');
      const pData = await partnersRes.json();
      this.currentPartners = pData.partners || [];

      let stats = { total_contributed_cad: 0, partner_allocated_cad: 0, cafhs_program_balance: 0 };
      if (statsRes.ok) {
        stats = await statsRes.json();
      }

      let allocations = [];
      if (allocRes.ok) {
        const aData = await allocRes.json();
        allocations = aData.allocations || [];
      }

      // Calculate stats
      const totalPartners = this.currentPartners.length;
      const verifiedPartners = this.currentPartners.filter(p => p.status === 'verified').length;
      const totalContributed = parseFloat(stats.total_contributed_cad) || 0;
      const totalAllocated = parseFloat(stats.partner_allocated_cad) || 0;
      const programBalance = parseFloat(stats.cafhs_program_balance) || Math.max(0, totalContributed - totalAllocated);

      const statsEl = document.getElementById('tp-stats-banner-zone');
      if (statsEl) {
        statsEl.innerHTML = `
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap:1rem; margin-bottom:1.5rem;">
            <div style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:8px; padding:1.1rem; text-align:center;">
              <small style="color:#166534; font-weight:700; text-transform:uppercase;">Centralized Gifts to CAFHS</small>
              <div style="font-size:1.8rem; font-weight:800; color:#15803D; margin-top:4px;">$${totalContributed.toFixed(2)} CAD</div>
              <small style="color:#64748B;">Direct Community Contributions</small>
            </div>
            <div style="background:#FFFBEB; border:1px solid #FDE68A; border-radius:8px; padding:1.1rem; text-align:center;">
              <small style="color:#92400E; font-weight:700; text-transform:uppercase;">Grants Disbursed to Partners</small>
              <div style="font-size:1.8rem; font-weight:800; color:#B45309; margin-top:4px;">$${totalAllocated.toFixed(2)} CAD</div>
              <small style="color:#64748B;">Allocated by CAFHS Management</small>
            </div>
            <div style="background:#ECFDF5; border:1px solid #6EE7B7; border-radius:8px; padding:1.1rem; text-align:center;">
              <small style="color:#065F46; font-weight:700; text-transform:uppercase;">CAFHS Reserve Balance</small>
              <div style="font-size:1.8rem; font-weight:800; color:#047857; margin-top:4px;">$${programBalance.toFixed(2)} CAD</div>
              <small style="color:#64748B;">Available for Grants & Respite</small>
            </div>
            <div style="background:#EFF6FF; border:1px solid #BFDBFE; border-radius:8px; padding:1.1rem; text-align:center;">
              <small style="color:#1E40AF; font-weight:700; text-transform:uppercase;">Registered Partners</small>
              <div style="font-size:1.8rem; font-weight:800; color:#2563EB; margin-top:4px;">${totalPartners}</div>
              <small style="color:#64748B;">${verifiedPartners} Verified & Active</small>
            </div>
          </div>
        `;
      }

      this.renderPartnersRows(this.currentPartners);
      this.renderAllocationsRows(allocations);
    } catch (err) {
      console.error('Error rendering partners tab:', err);
      const tbody = document.getElementById('tp-table-body');
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:#DC2626; padding:2rem;">Error loading partner records: ${err.message}</td></tr>`;
      }
    }
  }

  renderPartnersRows(list) {
    const tbody = document.getElementById('tp-table-body');
    if (!tbody) return;

    if (!list || list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:2rem; color:#64748B;">No training partners match the search criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(p => {
      const typeLabel = (p.institution_type || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const isVerified = p.status === 'verified';
      return `
        <tr>
          <td><code style="font-weight:700; color:#0D3B3A;">${p.partner_code}</code></td>
          <td>
            <strong>${this.escapeHtml(p.institution_name)}</strong>
            <div style="font-size:0.75rem; color:#64748B;">
              📍 ${this.escapeHtml(p.campus_city)}, ${p.province || 'ON'}
              ${p.website ? `• <a href="${p.website}" target="_blank" rel="noopener noreferrer" style="color:#2563EB; text-decoration:underline;">Website ↗</a>` : ''}
            </div>
          </td>
          <td>
            <span style="display:inline-block; padding:2px 8px; border-radius:4px; font-size:0.75rem; font-weight:600; background:#E2E8F0; color:#334155;">
              ${typeLabel}
            </span>
          </td>
          <td>
            <div>${this.escapeHtml(p.contact_name)}</div>
            <small style="color:#64748B;"><a href="mailto:${p.contact_email}" style="color:#047857;">${this.escapeHtml(p.contact_email)}</a></small>
          </td>
          <td style="max-width:200px; font-size:0.78rem; line-height:1.3; color:#475569;">
            ${this.escapeHtml(p.programs || 'Healthcare Aide Training')}
          </td>
          <td style="font-size:0.78rem;">
            <strong>${p.payout_method === 'interac_etransfer' ? '🏦 Interac Auto-Deposit' : '💳 Direct Deposit / EFT'}</strong>
            <div style="font-size:0.72rem; color:#64748B;">${this.escapeHtml(p.banking_info || 'On File')}</div>
          </td>
          <td style="font-weight:700; color:#15803D;">
            $${(parseFloat(p.total_donations_allocated) || 0).toFixed(2)} CAD
          </td>
          <td>
            <span style="display:inline-block; padding:3px 8px; border-radius:12px; font-size:0.72rem; font-weight:700; text-transform:uppercase; background:${isVerified ? '#DCFCE7' : '#FEF3C7'}; color:${isVerified ? '#15803D' : '#92400E'};">
              ${isVerified ? '✓ Verified' : 'Pending'}
            </span>
          </td>
          <td style="white-space:nowrap;">
            <button class="btn btn-primary btn-sm" onclick="window.adminPortal.openAllocateGrantModal(${p.id})" title="Allocate CAFHS Grant from Central Pool" style="padding: 3px 8px; font-size: 0.75rem; margin-right: 4px;">
              💸 Allocate Grant
            </button>
            <button class="btn btn-outline btn-sm" onclick="window.adminPortal.togglePartnerStatus(${p.id}, '${p.status}')" title="Toggle Verification" style="padding: 3px 8px; font-size: 0.75rem;">
              ${isVerified ? 'Deactivate' : 'Verify'}
            </button>
            <button class="btn btn-outline btn-sm" style="color:#DC2626; border-color:#FCA5A5; margin-left:4px; padding: 3px 6px; font-size: 0.75rem;" onclick="window.adminPortal.deletePartner(${p.id})" title="Remove">
              ✕
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  renderAllocationsRows(allocations) {
    const tbody = document.getElementById('tp-allocations-body');
    if (!tbody) return;

    if (!allocations || allocations.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:1.5rem; color:#64748B;">No grant allocations disbursed yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = allocations.map(a => {
      const dateStr = new Date(a.created_at || Date.now()).toLocaleDateString('en-CA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      return `
        <tr>
          <td><code style="font-weight:700; color:#0D3B3A;">#GA-${a.id}</code></td>
          <td>
            <strong>${this.escapeHtml(a.institution_name)}</strong>
            <div style="font-size:0.75rem; color:#64748B;">Code: ${this.escapeHtml(a.partner_code)}</div>
          </td>
          <td><strong style="color:#15803D; font-size:0.95rem;">$${parseFloat(a.amount).toFixed(2)} CAD</strong></td>
          <td style="max-width:200px; font-size:0.8rem; color:#334155;">${this.escapeHtml(a.purpose || 'Caregiver Student Bursary')}</td>
          <td style="font-size:0.8rem; color:#475569;">${this.escapeHtml(a.disbursed_by || 'CAFHS Management')}</td>
          <td style="font-size:0.78rem; color:#64748B;">${this.escapeHtml(a.reference_note || 'Board Authorized')}</td>
          <td style="white-space:nowrap; font-size:0.78rem; color:#64748B;">${dateStr}</td>
          <td>
            <span style="display:inline-block; padding:2px 8px; border-radius:12px; font-size:0.72rem; font-weight:700; background:#DCFCE7; color:#15803D;">
              ✓ Remittance Sent
            </span>
          </td>
        </tr>
      `;
    }).join('');
  }

  openAllocateGrantModal(partnerId) {
    const partner = (this.currentPartners || []).find(p => p.id === partnerId);
    if (!partner) {
      alert('Selected partner not found.');
      return;
    }

    const idInput = document.getElementById('alloc-partner-id');
    const nameDisplay = document.getElementById('alloc-partner-name-display');
    const cityDisplay = document.getElementById('alloc-partner-city-display');
    const payoutDisplay = document.getElementById('alloc-partner-payout-display');
    const amountInput = document.getElementById('alloc-amount');

    if (idInput) idInput.value = partner.id;
    if (nameDisplay) nameDisplay.textContent = `${partner.institution_name} (${partner.partner_code})`;
    if (cityDisplay) cityDisplay.textContent = `${partner.campus_city}, ${partner.province || 'ON'}`;
    if (payoutDisplay) {
      const method = partner.payout_method === 'interac_etransfer' ? 'Interac Auto-Deposit' : 'Direct Deposit / EFT';
      payoutDisplay.textContent = `${method} • ${partner.banking_info || 'On File'}`;
    }
    if (amountInput) amountInput.value = '250.00';

    const modal = document.getElementById('allocate-grant-modal');
    if (modal) modal.classList.add('active');
  }

  closeAllocateGrantModal() {
    const modal = document.getElementById('allocate-grant-modal');
    if (modal) modal.classList.remove('active');
  }

  async submitGrantAllocation(event) {
    event.preventDefault();
    const partnerId = document.getElementById('alloc-partner-id')?.value;
    const amountVal = parseFloat(document.getElementById('alloc-amount')?.value);
    const purpose = document.getElementById('alloc-purpose')?.value;
    const memo = document.getElementById('alloc-memo')?.value;

    if (!partnerId || isNaN(amountVal) || amountVal <= 0) {
      alert('Please enter a valid grant allocation amount.');
      return;
    }

    const submitBtn = document.getElementById('btn-submit-alloc');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing Allocation...';
    }

    try {
      const response = await fetch(`/api/training-partners/${partnerId}/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountVal,
          purpose: purpose,
          reference_note: memo,
          disbursed_by: window.authService?.currentUser?.name || 'Mack Chen (Executive Administrator)'
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to disburse grant allocation.');
      }

      this.closeAllocateGrantModal();
      alert(`🎉 Grant of $${amountVal.toFixed(2)} CAD successfully allocated from CAFHS to ${resData.partner?.institution_name || 'the training partner'}!\n\nOfficial grant remittance and EFT notice emailed directly to the institution contact.`);
      
      // Refresh registry & ledger
      this.renderPartnersTab(document.getElementById('admin-tab-content'));
    } catch (err) {
      alert('Error allocating grant: ' + err.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '💸 Authorize & Disburse Grant';
      }
    }
  }

  filterPartnersTable(query) {
    if (!this.currentPartners) return;
    const q = (query || '').toLowerCase().trim();
    const typeFilter = document.getElementById('tp-type-filter')?.value;

    const filtered = this.currentPartners.filter(p => {
      const matchesSearch = !q || (
        (p.institution_name && p.institution_name.toLowerCase().includes(q)) ||
        (p.campus_city && p.campus_city.toLowerCase().includes(q)) ||
        (p.partner_code && p.partner_code.toLowerCase().includes(q)) ||
        (p.programs && p.programs.toLowerCase().includes(q)) ||
        (p.contact_name && p.contact_name.toLowerCase().includes(q))
      );
      const matchesType = !typeFilter || p.institution_type === typeFilter;
      return matchesSearch && matchesType;
    });

    this.renderPartnersRows(filtered);
  }

  async togglePartnerStatus(partnerId, currentStatus) {
    const nextStatus = currentStatus === 'verified' ? 'pending' : 'verified';
    try {
      const response = await fetch(`/api/training-partners/${partnerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!response.ok) throw new Error('Failed to update status.');
      this.renderPartnersTab(document.getElementById('admin-tab-content'));
    } catch (err) {
      alert('Error updating partner: ' + err.message);
    }
  }

  async deletePartner(partnerId) {
    if (!confirm('Are you sure you want to remove this training partner?')) return;
    try {
      const response = await fetch(`/api/training-partners/${partnerId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete partner.');
      this.renderPartnersTab(document.getElementById('admin-tab-content'));
    } catch (err) {
      alert('Error deleting partner: ' + err.message);
    }
  }

  // --- 12. OUTBOUND EMAIL (SMTP) GATEWAY CONFIGURATION ---
  async renderEmailConfigTab(container) {
    container.innerHTML = `<div style="text-align:center; padding:3rem; color:#64748B;">⏳ Loading outbound email configuration...</div>`;

    let config = {
      enabled: 0,
      smtp_host: 'smtp.gmail.com',
      smtp_port: 587,
      smtp_security: 'starttls',
      smtp_user: '',
      smtp_pass: '',
      has_password: false,
      from_email: 'admin@cafhs.ca',
      from_name: 'Canadian Association of Family Health Support (CAFHS)',
      reply_to: 'admin@cafhs.ca'
    };

    try {
      const res = await fetch('/api/email/config');
      if (res.ok) {
        const data = await res.json();
        config = { ...config, ...(data.config || {}) };
      }
    } catch (e) {
      console.warn('Could not load SMTP config from server:', e);
    }

    const isEnabled = Boolean(config.enabled);

    container.innerHTML = `
      <div class="admin-tab-header">
        <div>
          <h2>📨 Outbound Email & SMTP Gateway Configuration</h2>
          <p class="section-desc">
            Configure live outgoing email delivery for donor contribution receipts, Ontario training partner grant notices, workshop tickets, and emergency clinical alerts.
          </p>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn btn-outline btn-sm" onclick="window.adminPortal.renderEmailConfigTab(document.getElementById('admin-tab-content'))">
            🔄 Refresh Settings
          </button>
          <button class="btn btn-outline btn-sm" onclick="window.adminPortal.switchTab('emails')">
            📬 View Email Audit Log
          </button>
        </div>
      </div>

      <!-- Current Delivery Status Banner -->
      <div id="smtp-status-banner" style="margin-bottom: 1.5rem; padding: 1.1rem 1.4rem; border-radius: 10px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; ${isEnabled ? 'background: #F0FDF4; border: 1px solid #86EFAC;' : 'background: #FFFBEB; border: 1px solid #FDE68A;'}">
        <div style="display: flex; align-items: center; gap: 0.9rem;">
          <span style="font-size: 1.8rem;">${isEnabled ? '🟢' : '🟡'}</span>
          <div>
            <strong style="color: ${isEnabled ? '#166534' : '#92400E'}; font-size: 1rem; display: block;">
              ${isEnabled ? 'Live Outbound Email Delivery is ACTIVE' : 'Outbound Delivery in Simulation / Queue Mode'}
            </strong>
            <small style="color: #64748B;">
              ${isEnabled 
                ? `Outgoing messages are delivered live via ${this.escapeHtml(config.smtp_host || 'SMTP Server')}:${config.smtp_port}.`
                : 'Emails are logged in the SQLite database only. Enable SMTP below and enter your credentials to send real emails to donors and partners.'}
            </small>
          </div>
        </div>
        <span class="badge-status" style="font-weight: 700; ${isEnabled ? 'background: #DCFCE7; color: #15803D;' : 'background: #FEF3C7; color: #B45309;'}">
          ${isEnabled ? '● LIVE SMTP TRANSMISSION' : '○ SIMULATED / QUEUE'}
        </span>
      </div>

      <!-- Quick Provider Presets -->
      <div style="background: #FFFFFF; border: 1px solid var(--border-color); border-radius: 10px; padding: 1.25rem; margin-bottom: 1.5rem; box-shadow: var(--shadow-sm);">
        <label style="font-size: 0.85rem; font-weight: 700; color: #0D3B3A; display: block; margin-bottom: 0.65rem;">
          ⚡ Quick Provider Presets (Auto-Fill Host & Port):
        </label>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button type="button" class="btn btn-outline btn-sm" onclick="window.adminPortal.applySmtpPreset('gmail')">
            🔴 Google / Gmail App Password
          </button>
          <button type="button" class="btn btn-outline btn-sm" onclick="window.adminPortal.applySmtpPreset('office365')">
            🔷 Microsoft 365 / Outlook
          </button>
          <button type="button" class="btn btn-outline btn-sm" onclick="window.adminPortal.applySmtpPreset('sendgrid')">
            🟦 Twilio SendGrid
          </button>
          <button type="button" class="btn btn-outline btn-sm" onclick="window.adminPortal.applySmtpPreset('resend')">
            ⬛ Resend (SMTP)
          </button>
          <button type="button" class="btn btn-outline btn-sm" onclick="window.adminPortal.applySmtpPreset('custom')">
            ⚙️ Custom Host
          </button>
        </div>
      </div>

      <!-- Main Layout: Form + Test Verification Tool -->
      <div style="display: grid; grid-template-columns: 3fr 2fr; gap: 1.5rem; align-items: start;">
        
        <!-- Left: SMTP Credentials Form -->
        <div style="background: #FFFFFF; border: 1px solid var(--border-color); border-radius: 10px; padding: 1.5rem; box-shadow: var(--shadow-sm);">
          <h3 style="font-size: 1.05rem; margin: 0 0 1rem 0; color: #0D3B3A; display: flex; align-items: center; gap: 8px;">
            🔒 SMTP Server Credentials & Identity
          </h3>

          <form id="smtp-config-form" onsubmit="window.adminPortal.saveSmtpConfig(event)">
            
            <!-- Enable Toggle Checkbox -->
            <div style="background: #F8FAFC; border: 1px solid var(--border-color); border-radius: 8px; padding: 0.85rem 1rem; margin-bottom: 1.25rem;">
              <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; margin: 0;">
                <input type="checkbox" id="smtp-enabled" ${isEnabled ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--primary);">
                <div>
                  <strong style="color: #0F172A; font-size: 0.92rem; display: block;">Enable Live Outbound Email Delivery (SMTP)</strong>
                  <small style="color: #64748B;">When unchecked, receipts and notices are recorded to SQLite without connecting to an external mail server.</small>
                </div>
              </label>
            </div>

            <!-- Server & Port Grid -->
            <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem;">
              <div class="form-group" style="margin: 0;">
                <label class="form-label" for="smtp-host">SMTP Host Address *</label>
                <input type="text" id="smtp-host" class="form-control" placeholder="e.g. smtp.gmail.com" value="${this.escapeHtml(config.smtp_host || '')}" required>
              </div>
              <div class="form-group" style="margin: 0;">
                <label class="form-label" for="smtp-port">Port *</label>
                <input type="number" id="smtp-port" class="form-control" placeholder="587" value="${config.smtp_port || 587}" required>
              </div>
              <div class="form-group" style="margin: 0;">
                <label class="form-label" for="smtp-security">Security *</label>
                <select id="smtp-security" class="form-control" required>
                  <option value="starttls" ${config.smtp_security === 'starttls' ? 'selected' : ''}>STARTTLS (587)</option>
                  <option value="ssl" ${config.smtp_security === 'ssl' ? 'selected' : ''}>SSL / TLS (465)</option>
                  <option value="none" ${config.smtp_security === 'none' ? 'selected' : ''}>None (25)</option>
                </select>
              </div>
            </div>

            <!-- Authentication User & Password -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem;">
              <div class="form-group" style="margin: 0;">
                <label class="form-label" for="smtp-user">SMTP Username / Account Email</label>
                <input type="text" id="smtp-user" class="form-control" placeholder="e.g. admin@cafhs.ca or apikey" value="${this.escapeHtml(config.smtp_user || '')}">
                <small style="color: #64748B; font-size: 0.74rem;">Full email for Gmail/Outlook; <code>apikey</code> for SendGrid.</small>
              </div>
              <div class="form-group" style="margin: 0;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <label class="form-label" for="smtp-pass" style="margin: 0;">SMTP Password / App Key</label>
                  <button type="button" class="btn-link" onclick="window.adminPortal.toggleSmtpPasswordVisibility()" style="font-size: 0.75rem; text-decoration: underline;">
                    👁️ Show / Hide
                  </button>
                </div>
                <input type="password" id="smtp-pass" class="form-control" placeholder="${config.has_password ? '•••••••• (Saved)' : 'Enter password / app token'}" autocomplete="new-password">
                <small style="color: #64748B; font-size: 0.74rem;">
                  ${config.has_password ? 'Password saved. Leave blank to keep existing.' : 'Required for authenticated SMTP sending.'}
                </small>
              </div>
            </div>

            <!-- Sender Identity -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem;">
              <div class="form-group" style="margin: 0;">
                <label class="form-label" for="smtp-from-email">Sender "From" Email *</label>
                <input type="email" id="smtp-from-email" class="form-control" placeholder="admin@cafhs.ca" value="${this.escapeHtml(config.from_email || 'admin@cafhs.ca')}" required>
                <small style="color: #64748B; font-size: 0.74rem;">Address appearing on official receipts.</small>
              </div>
              <div class="form-group" style="margin: 0;">
                <label class="form-label" for="smtp-from-name">Sender Display Name *</label>
                <input type="text" id="smtp-from-name" class="form-control" placeholder="CAFHS Canada" value="${this.escapeHtml(config.from_name || 'Canadian Association of Family Health Support (CAFHS)')}" required>
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 1.25rem;">
              <label class="form-label" for="smtp-reply-to">Reply-To Address</label>
              <input type="email" id="smtp-reply-to" class="form-control" placeholder="admin@cafhs.ca" value="${this.escapeHtml(config.reply_to || 'admin@cafhs.ca')}">
            </div>

            <!-- Resend Inbound & API Key Section -->
            <div style="background: #FAF5FF; border: 1px solid #E9D5FF; border-radius: 8px; padding: 1.1rem; margin-bottom: 1.5rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem;">
                <strong style="color: #581C87; font-size: 0.92rem; display: flex; align-items: center; gap: 6px;">
                  <span>📬</span> Resend API Key & Inbound Setup
                </strong>
                <span style="font-size: 0.72rem; background: #F3E8FF; color: #6B21A8; font-weight: 700; padding: 2px 8px; border-radius: 12px;">
                  ${config.has_resend_key ? '✓ API Key Saved' : 'Optional for Direct Sync'}
                </span>
              </div>
              
              <div class="form-group" style="margin-bottom: 0.85rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <label class="form-label" for="resend-api-key" style="margin: 0; color: #581C87;">Resend API Key (re_...)</label>
                  <button type="button" class="btn-link" onclick="window.adminPortal.toggleResendKeyVisibility()" style="font-size: 0.75rem; color: #7E22CE; text-decoration: underline;">
                    👁️ Show / Hide
                  </button>
                </div>
                <input type="password" id="resend-api-key" class="form-control" placeholder="${config.has_resend_key ? '•••••••• (Saved)' : 're_123456789...'}" autocomplete="new-password">
                <small style="color: #6B21A8; font-size: 0.73rem;">Used for automatic body retrieval on incoming webhooks and one-click direct sync from Resend.</small>
              </div>

              <div class="form-group" style="margin: 0;">
                <label class="form-label" for="resend-inbound-domain" style="color: #581C87;">Inbound Receiving Address / Domain</label>
                <input type="text" id="resend-inbound-domain" class="form-control" placeholder="e.g. support@cafhs.ca or inbound.cafhs.ca" value="${this.escapeHtml(config.resend_inbound_domain || '')}">
                <small style="color: #6B21A8; font-size: 0.73rem;">Your registered Resend receiving address or domain name.</small>
              </div>
            </div>

            <button type="submit" id="btn-save-smtp" class="btn btn-primary" style="width: 100%; font-weight: 700; padding: 0.75rem;">
              💾 Save Outbound & Resend Email Configuration
            </button>
          </form>
        </div>

        <!-- Right: Live Connection Test Tool & Provider Setup Guide -->
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          
          <!-- Test Email Box -->
          <div style="background: #FFFFFF; border: 1px solid var(--border-color); border-radius: 10px; padding: 1.5rem; box-shadow: var(--shadow-sm);">
            <h3 style="font-size: 1.05rem; margin: 0 0 0.5rem 0; color: #0D3B3A; display: flex; align-items: center; gap: 8px;">
              🧪 Live Outbound Delivery Test
            </h3>
            <p style="font-size: 0.82rem; color: #64748B; margin-bottom: 1rem;">
              Send an actual test message using current form settings to verify handshake, TLS encryption, and recipient delivery.
            </p>

            <form onsubmit="window.adminPortal.sendSmtpTestEmail(event)">
              <div class="form-group" style="margin-bottom: 0.85rem;">
                <label class="form-label" for="smtp-test-target">Send Verification Email To:</label>
                <input type="email" id="smtp-test-target" class="form-control" placeholder="your.email@example.ca" value="${this.escapeHtml(window.authService?.currentUser?.email || 'admin@cafhs.ca')}" required>
              </div>

              <button type="submit" id="btn-run-smtp-test" class="btn btn-secondary" style="width: 100%; font-weight: 700;">
                🚀 Test Live SMTP Connection Now
              </button>
            </form>

            <div id="smtp-test-result-box" style="margin-top: 1rem; display: none;"></div>
          </div>

          <!-- Setup Help Cards -->
          <div style="background: #F8FAFC; border: 1px solid var(--border-color); border-radius: 10px; padding: 1.25rem;">
            <h4 style="font-size: 0.92rem; color: #0F172A; margin: 0 0 0.65rem 0;">💡 Provider Setup Guidance:</h4>
            
            <div style="font-size: 0.8rem; color: #475569; line-height: 1.5;">
              <details style="margin-bottom: 0.5rem; cursor: pointer;">
                <summary style="font-weight: 700; color: #0D3B3A;">Gmail / Google Workspace Setup</summary>
                <div style="padding: 0.5rem 0 0 0.75rem;">
                  1. Enable <strong>2-Step Verification</strong> on your Google Account.<br>
                  2. Go to <em>Security → App Passwords</em>.<br>
                  3. Generate a 16-character password and paste it above.<br>
                  4. Host: <code>smtp.gmail.com</code> • Port: <code>587</code> • STARTTLS.
                </div>
              </details>

              <details style="margin-bottom: 0.5rem; cursor: pointer;">
                <summary style="font-weight: 700; color: #0D3B3A;">Microsoft 365 / Outlook Setup</summary>
                <div style="padding: 0.5rem 0 0 0.75rem;">
                  1. Host: <code>smtp.office365.com</code> • Port: <code>587</code> • STARTTLS.<br>
                  2. User: your full Microsoft 365 email.<br>
                  3. Ensure <em>Authenticated SMTP</em> is enabled on the mailbox in M365 Admin Center.
                </div>
              </details>

              <details style="cursor: pointer;">
                <summary style="font-weight: 700; color: #0D3B3A;">SendGrid & Resend Setup</summary>
                <div style="padding: 0.5rem 0 0 0.75rem;">
                  1. SendGrid: Host <code>smtp.sendgrid.net</code>, User <code>apikey</code>, Pass = API key.<br>
                  2. Resend: Host <code>smtp.resend.com</code>, Port <code>465</code>, User <code>resend</code>, Pass = API key.
                </div>
              </details>
            </div>
          </div>

          <!-- Resend Inbound Webhook Configuration Card -->
          <div style="background: #F5F3FF; border: 1px solid #DDD6FE; border-radius: 10px; padding: 1.25rem; margin-top: 1rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.5rem;">
              <h4 style="font-size: 0.95rem; color: #4C1D95; margin: 0; display:flex; align-items:center; gap:6px;">
                <span>📥</span> Resend Inbound Email Webhook & API Sync
              </h4>
              <span style="background: #EDE9FE; color: #5B21B6; font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 12px;">
                Endpoint Ready
              </span>
            </div>
            
            <p style="font-size: 0.82rem; color: #5B21B6; margin-bottom: 0.75rem; line-height: 1.45;">
              When emails arrive at your Resend inbound address, Resend automatically posts them to this webhook so you can read them in the Admin Console.
            </p>

            <div style="background: #FFFFFF; border: 1px solid #DDD6FE; border-radius: 6px; padding: 0.75rem; margin-bottom: 0.75rem;">
              <small style="color: #6B7280; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 4px;">
                Your Webhook Endpoint URL:
              </small>
              <div style="display:flex; align-items:center; gap:8px;">
                <code style="font-size: 0.82rem; color: #4C1D95; background: #F3F4F6; padding: 4px 8px; border-radius: 4px; flex: 1; word-break: break-all;">
                  ${window.location.origin}/api/webhooks/resend-inbound
                </code>
                <button type="button" class="btn btn-outline btn-sm" onclick="navigator.clipboard.writeText(window.location.origin + '/api/webhooks/resend-inbound'); alert('Webhook URL copied to clipboard!');">
                  📋 Copy
                </button>
              </div>
            </div>

            <div style="font-size: 0.8rem; color: #4C1D95; line-height: 1.5; margin-bottom: 0.75rem;">
              <strong>Setup Steps in Resend:</strong><br>
              1. In your <a href="https://resend.com/webhooks" target="_blank" style="color: #6D28D9; text-decoration: underline; font-weight: 600;">Resend Webhooks Dashboard</a>, click <strong>Add Webhook</strong>.<br>
              2. Paste your endpoint URL.<br>
              3. Check event: <strong><code>email.received</code></strong>.<br>
              4. All inbound replies will appear instantly under <strong>Email Alerts & Logs</strong>.
            </div>

            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button type="button" id="btn-sync-resend-config" class="btn btn-primary btn-sm" style="background: #6D28D9; border-color: #6D28D9;" onclick="window.adminPortal.syncResendInbound(true)">
                ⚡ Fetch & Sync Received Emails via Resend API
              </button>
              <button type="button" class="btn btn-outline btn-sm" style="color: #5B21B6; border-color: #C4B5FD; background: #FFFFFF;" onclick="window.adminPortal.openSimulateInboundModal()">
                🧪 Test & Simulate Inbound Webhook
              </button>
            </div>
          </div>

        </div>

      </div>
    `;
  }

  applySmtpPreset(preset) {
    const hostEl = document.getElementById('smtp-host');
    const portEl = document.getElementById('smtp-port');
    const secEl = document.getElementById('smtp-security');
    const userEl = document.getElementById('smtp-user');

    if (!hostEl || !portEl || !secEl) return;

    if (preset === 'gmail') {
      hostEl.value = 'smtp.gmail.com';
      portEl.value = 587;
      secEl.value = 'starttls';
      if (userEl && !userEl.value) userEl.value = 'admin@cafhs.ca';
    } else if (preset === 'office365') {
      hostEl.value = 'smtp.office365.com';
      portEl.value = 587;
      secEl.value = 'starttls';
    } else if (preset === 'sendgrid') {
      hostEl.value = 'smtp.sendgrid.net';
      portEl.value = 587;
      secEl.value = 'starttls';
      if (userEl) userEl.value = 'apikey';
    } else if (preset === 'resend') {
      hostEl.value = 'smtp.resend.com';
      portEl.value = 465;
      secEl.value = 'ssl';
      if (userEl) userEl.value = 'resend';
      const fromEl = document.getElementById('smtp-from-email');
      if (fromEl) {
        fromEl.value = 'support@cafhs.ca';
      }
    } else if (preset === 'custom') {
      hostEl.value = 'mail.yourdomain.ca';
      portEl.value = 587;
      secEl.value = 'starttls';
    }
  }

  toggleSmtpPasswordVisibility() {
    const passInput = document.getElementById('smtp-pass');
    if (!passInput) return;
    passInput.type = passInput.type === 'password' ? 'text' : 'password';
  }

  toggleResendKeyVisibility() {
    const keyInput = document.getElementById('resend-api-key');
    if (!keyInput) return;
    keyInput.type = keyInput.type === 'password' ? 'text' : 'password';
  }

  async syncResendInbound(showFeedback = true) {
    const btn = document.getElementById('btn-sync-resend-config') || document.getElementById('btn-sync-resend-inbox');
    const origText = btn ? btn.textContent : '';
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Querying Resend API...';
    }

    try {
      const res = await fetch('/api/resend/sync');
      const data = await res.json();
      if (data.success) {
        const msg = `📬 Resend Sync Complete!\n\n${data.synced_count} new received email(s) downloaded and stored in SQLite.\nTotal remote records: ${data.total_remote}`;
        if (showFeedback) alert(msg);
        // Refresh inbox if on emails tab
        const tabContent = document.getElementById('admin-tab-content');
        if (tabContent && document.querySelector('.admin-nav-item.active[onclick*="emails"]')) {
          this.renderEmailsTab(tabContent);
        }
      } else {
        if (showFeedback) alert(`⚠️ Resend Sync Notice:\n\n${data.error || 'Failed to sync with Resend API.'}`);
      }
    } catch (err) {
      if (showFeedback) alert(`Network error during Resend sync: ${err.message}`);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = origText;
      }
    }
  }

  async saveSmtpConfig(event) {
    event.preventDefault();
    const btn = document.getElementById('btn-save-smtp');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Saving Configuration...';
    }

    const payload = {
      enabled: document.getElementById('smtp-enabled')?.checked ? 1 : 0,
      smtp_host: document.getElementById('smtp-host')?.value.trim(),
      smtp_port: parseInt(document.getElementById('smtp-port')?.value, 10) || 587,
      smtp_security: document.getElementById('smtp-security')?.value,
      smtp_user: document.getElementById('smtp-user')?.value.trim(),
      smtp_pass: document.getElementById('smtp-pass')?.value,
      from_email: document.getElementById('smtp-from-email')?.value.trim(),
      from_name: document.getElementById('smtp-from-name')?.value.trim(),
      reply_to: document.getElementById('smtp-reply-to')?.value.trim(),
      resend_api_key: document.getElementById('resend-api-key')?.value,
      resend_inbound_domain: document.getElementById('resend-inbound-domain')?.value.trim()
    };

    try {
      const res = await fetch('/api/email/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings.');

      alert('✅ Outbound & Resend email configuration successfully updated and saved to SQLite database!');
      this.renderEmailConfigTab(document.getElementById('admin-tab-content'));
    } catch (err) {
      alert('Error saving SMTP settings: ' + err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '💾 Save Outbound & Resend Email Configuration';
      }
    }
  }

  async sendSmtpTestEmail(event) {
    event.preventDefault();
    const btn = document.getElementById('btn-run-smtp-test');
    const resultBox = document.getElementById('smtp-test-result-box');
    const toEmail = document.getElementById('smtp-test-target')?.value.trim();

    if (!toEmail) {
      alert('Please enter a recipient email address for testing.');
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Connecting & Testing SMTP...';
    }

    if (resultBox) {
      resultBox.style.display = 'block';
      resultBox.innerHTML = `
        <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 0.9rem; font-size: 0.85rem; color: #1E40AF;">
          Connecting to SMTP host and attempting handshake...
        </div>
      `;
    }

    const testPayload = {
      to_email: toEmail,
      smtp_host: document.getElementById('smtp-host')?.value.trim(),
      smtp_port: parseInt(document.getElementById('smtp-port')?.value, 10) || 587,
      smtp_security: document.getElementById('smtp-security')?.value,
      smtp_user: document.getElementById('smtp-user')?.value.trim(),
      smtp_pass: document.getElementById('smtp-pass')?.value,
      from_email: document.getElementById('smtp-from-email')?.value.trim(),
      from_name: document.getElementById('smtp-from-name')?.value.trim()
    };

    try {
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });
      const data = await res.json();

      if (data.success) {
        if (resultBox) {
          resultBox.innerHTML = `
            <div style="background: #F0FDF4; border: 1px solid #86EFAC; border-radius: 8px; padding: 1rem; font-size: 0.85rem; color: #166534;">
              <strong style="display:block; margin-bottom: 4px;">🎉 Real Outbound Email Sent Successfully!</strong>
              ${this.escapeHtml(data.message)}<br>
              <small style="color: #64748B; display:block; margin-top: 6px;">
                Check the inbox of <strong>${this.escapeHtml(toEmail)}</strong> (and Spam/Junk folder) to view the message.
              </small>
            </div>
          `;
        }
      } else {
        if (resultBox) {
          resultBox.innerHTML = `
            <div style="background: #FEF2F2; border: 1px solid #FCA5A5; border-radius: 8px; padding: 1rem; font-size: 0.85rem; color: #991B1B;">
              <strong style="display:block; margin-bottom: 4px;">⚠️ SMTP Handshake Failed:</strong>
              <code>${this.escapeHtml(data.error || 'Connection failed')}</code>
              ${(data.error && (data.error.includes('domain is not verified') || data.error.includes('550'))) ? `
                <div style="margin-top: 10px; padding: 8px 12px; background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 6px; font-size: 0.8rem; color: #92400E;">
                  <strong>⚡ Resend Quick Fix:</strong><br>
                  Resend blocks sending from custom domains like <code>cafhs.ca</code> until you verify DNS records at <a href="https://resend.com/domains" target="_blank" style="color:#B45309; text-decoration: underline;">resend.com/domains</a>.<br><br>
                  <strong>For immediate testing without domain verification:</strong><br>
                  1. Set <strong>Sender Email (From)</strong> to: <code style="background:#FEF3C7; font-weight:bold; padding:2px 4px; border-radius:3px;">onboarding@resend.dev</code><br>
                  2. Make sure the <strong>Test Recipient Email</strong> is the email address registered with your Resend account.<br>
                  3. Click <strong>Test Live SMTP Connection Now</strong> again!
                </div>
              ` : `
              <div style="margin-top: 8px; font-size: 0.78rem; color: #7F1D1D;">
                <strong>Troubleshooting tips:</strong><br>
                • For Gmail: Did you generate an App Password? Standard passwords fail if 2FA is on.<br>
                • Verify that the Host (${testPayload.smtp_host}) and Port (${testPayload.smtp_port}) are unblocked on your network.<br>
                • Check username/password spelling.
              </div>
              `}
            </div>
          `;
        }
      }
    } catch (err) {
      if (resultBox) {
        resultBox.innerHTML = `
          <div style="background: #FEF2F2; border: 1px solid #FCA5A5; border-radius: 8px; padding: 1rem; font-size: 0.85rem; color: #991B1B;">
            <strong>Network Error:</strong> ${this.escapeHtml(err.message)}
          </div>
        `;
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '🚀 Test Live SMTP Connection Now';
      }
    }
  }

  // --- 13. EMAIL ALERTS & INBOUND COMMUNICATIONS CENTER ---
  async renderEmailsTab(container) {
    container.innerHTML = `<div style="text-align:center; padding:3rem; color:#64748B;">⏳ Loading email transmission & inbound messages...</div>`;

    let emails = [];
    let inboundCount = 0;
    let outboundCount = 0;
    try {
      const res = await fetch('/api/admin/emails?limit=250');
      if (res.ok) {
        const data = await res.json();
        emails = data.emails || [];
        inboundCount = data.inbound_count || emails.filter(e => e.direction === 'inbound').length;
        outboundCount = data.outbound_count || emails.filter(e => e.direction !== 'inbound').length;
      }
    } catch (err) {
      console.warn('Could not load site emails:', err);
    }

    const unreadInbound = emails.filter(e => e.direction === 'inbound' && e.status === 'unread').length;
    const smtpSentCount = emails.filter(e => e.status === 'sent_smtp' || e.status === 'test_sent_smtp').length;

    this._cachedEmails = emails;
    this._emailFilterDirection = this._emailFilterDirection || 'all';
    this._emailSearchQuery = '';

    container.innerHTML = `
      <div class="admin-tab-header">
        <div>
          <h2>📬 CAFHS Email Communications & Inbound Mail Center</h2>
          <p class="section-desc">
            Audited history of incoming Resend webhooks, donor contribution receipts, training partner notices, and emergency alerts.
          </p>
        </div>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <button class="btn btn-outline btn-sm" onclick="window.adminPortal.renderEmailsTab(document.getElementById('admin-tab-content'))">
            🔄 Refresh Inbox
          </button>
          <button type="button" id="btn-sync-resend-inbox" class="btn btn-primary btn-sm" style="background: #6D28D9; border-color: #6D28D9;" onclick="window.adminPortal.syncResendInbound(true)">
            ⚡ Sync from Resend
          </button>
          <button class="btn btn-outline btn-sm" style="color: #4F46E5; border-color: #C7D2FE; background: #EEF2FF;" onclick="window.adminPortal.openSimulateInboundModal()">
            📥 Test Inbound Webhook
          </button>
          <button class="btn btn-primary btn-sm" onclick="window.adminPortal.switchTab('emailconfig')">
            ⚙️ Gateway & Webhook Setup
          </button>
        </div>
      </div>

      <!-- Overview Stats Cards -->
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; margin-bottom:1.5rem;">
        <div style="background:#EEF2FF; border:1px solid #C7D2FE; border-radius:8px; padding:1.1rem; text-align:center;">
          <small style="color:#3730A3; font-weight:700; text-transform:uppercase;">📥 Inbound Received</small>
          <div style="font-size:1.8rem; font-weight:800; color:#4338CA; margin-top:4px;">${inboundCount}</div>
          <small style="color:#6366F1;">${unreadInbound > 0 ? `<strong>${unreadInbound} unread</strong> (Resend Webhook)` : 'All caught up'}</small>
        </div>
        <div style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:8px; padding:1.1rem; text-align:center;">
          <small style="color:#166534; font-weight:700; text-transform:uppercase;">📤 Outbound Dispatched</small>
          <div style="font-size:1.8rem; font-weight:800; color:#15803D; margin-top:4px;">${outboundCount}</div>
          <small style="color:#64748B;">Receipts & Partner Notices</small>
        </div>
        <div style="background:#EFF6FF; border:1px solid #BFDBFE; border-radius:8px; padding:1.1rem; text-align:center;">
          <small style="color:#1E40AF; font-weight:700; text-transform:uppercase;">✓ Real SMTP Delivered</small>
          <div style="font-size:1.8rem; font-weight:800; color:#2563EB; margin-top:4px;">${smtpSentCount}</div>
          <small style="color:#64748B;">Live Gateway Deliveries</small>
        </div>
        <div style="background:#F8FAFC; border:1px solid var(--border-color); border-radius:8px; padding:1.1rem; text-align:center;">
          <small style="color:#475569; font-weight:700; text-transform:uppercase;">📊 Total Activity</small>
          <div style="font-size:1.8rem; font-weight:800; color:#1E293B; margin-top:4px;">${emails.length}</div>
          <small style="color:#64748B;">Combined Messages</small>
        </div>
      </div>

      <!-- Direction Filter Tabs & Search Bar -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; margin-bottom:1rem;">
        <div style="display:inline-flex; background:#F1F5F9; padding:4px; border-radius:8px; gap:4px;">
          <button type="button" id="btn-filter-all" class="btn btn-sm ${this._emailFilterDirection === 'all' ? 'btn-primary' : 'btn-outline'}" style="border:none; border-radius:6px;" onclick="window.adminPortal.setEmailDirectionFilter('all')">
            All Messages (${emails.length})
          </button>
          <button type="button" id="btn-filter-inbound" class="btn btn-sm ${this._emailFilterDirection === 'inbound' ? 'btn-primary' : 'btn-outline'}" style="border:none; border-radius:6px;" onclick="window.adminPortal.setEmailDirectionFilter('inbound')">
            📥 Inbound Received (${inboundCount})
          </button>
          <button type="button" id="btn-filter-outbound" class="btn btn-sm ${this._emailFilterDirection === 'outbound' ? 'btn-primary' : 'btn-outline'}" style="border:none; border-radius:6px;" onclick="window.adminPortal.setEmailDirectionFilter('outbound')">
            📤 Outbound Sent (${outboundCount})
          </button>
        </div>
        <div style="flex:1; min-width:260px; max-width:380px;">
          <input type="text" id="email-search-input" class="form-control" placeholder="Search by sender, recipient, subject..." oninput="window.adminPortal.filterEmailsTable(this.value)">
        </div>
      </div>

      <div class="contrib-table-wrap">
        <table class="contrib-table" id="emails-audit-table">
          <thead>
            <tr>
              <th>Direction & ID</th>
              <th>From (Sender)</th>
              <th>To (Recipient)</th>
              <th>Subject</th>
              <th>Transmission Status</th>
              <th>Date / Time</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="emails-audit-tbody">
            ${this.renderEmailsTableRows(this.getFilteredEmailsList())}
          </tbody>
        </table>
      </div>

      <!-- Detail Modal -->
      <div id="email-audit-detail-modal" class="modal-overlay">
        <div class="modal-card" style="max-width: 760px; padding: 2rem;">
          <button type="button" class="modal-close-btn" onclick="document.getElementById('email-audit-detail-modal').classList.remove('active')">✕</button>
          <div id="email-audit-detail-content"></div>
        </div>
      </div>

      <!-- Simulate Inbound Webhook Modal -->
      <div id="email-simulate-inbound-modal" class="modal-overlay">
        <div class="modal-card" style="max-width: 620px; padding: 2rem;">
          <button type="button" class="modal-close-btn" onclick="document.getElementById('email-simulate-inbound-modal').classList.remove('active')">✕</button>
          <h3 style="margin-top:0; color:#1E1B4B; display:flex; align-items:center; gap:8px;">
            <span>📥</span> Test Resend Inbound Webhook
          </h3>
          <p style="font-size:0.85rem; color:#64748B; margin-bottom:1rem;">
            Simulate an incoming email sent to CAFHS. This posts the exact Resend <code>email.received</code> webhook payload to <code>/api/webhooks/resend-inbound</code> and records it in your database.
          </p>
          <form onsubmit="window.adminPortal.submitSimulatedInbound(event)">
            <div class="form-group" style="margin-bottom:0.75rem;">
              <label style="font-size:0.8rem; font-weight:600;">From (Sender Email):</label>
              <input type="email" id="sim-inb-sender" class="form-control" value="sarah.caregiver@example.ca" required>
            </div>
            <div class="form-group" style="margin-bottom:0.75rem;">
              <label style="font-size:0.8rem; font-weight:600;">To (Target CAFHS Address):</label>
              <input type="email" id="sim-inb-recipient" class="form-control" value="support@cafhs.ca" required>
            </div>
            <div class="form-group" style="margin-bottom:0.75rem;">
              <label style="font-size:0.8rem; font-weight:600;">Subject:</label>
              <input type="text" id="sim-inb-subject" class="form-control" value="Inquiry: Caregiver Respite Funding Application in Ontario" required>
            </div>
            <div class="form-group" style="margin-bottom:1rem;">
              <label style="font-size:0.8rem; font-weight:600;">Message Body:</label>
              <textarea id="sim-inb-body" class="form-control" rows="4" required>Hello CAFHS Support,

I am caring for my elderly mother in Hamilton, Ontario. Could you please send me the application details for the provincial caregiver respite grant and details on the upcoming Thursday workshop?

Thank you so much!
Sarah</textarea>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('email-simulate-inbound-modal').classList.remove('active')">Cancel</button>
              <button type="submit" class="btn btn-primary" id="btn-submit-sim-inbound">🚀 Dispatch Simulated Webhook</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  setEmailDirectionFilter(dir) {
    this._emailFilterDirection = dir;
    const allBtn = document.getElementById('btn-filter-all');
    const inbBtn = document.getElementById('btn-filter-inbound');
    const outBtn = document.getElementById('btn-filter-outbound');
    
    if (allBtn) allBtn.className = `btn btn-sm ${dir === 'all' ? 'btn-primary' : 'btn-outline'}`;
    if (inbBtn) inbBtn.className = `btn btn-sm ${dir === 'inbound' ? 'btn-primary' : 'btn-outline'}`;
    if (outBtn) outBtn.className = `btn btn-sm ${dir === 'outbound' ? 'btn-primary' : 'btn-outline'}`;

    const tbody = document.getElementById('emails-audit-tbody');
    if (tbody) tbody.innerHTML = this.renderEmailsTableRows(this.getFilteredEmailsList());
  }

  getFilteredEmailsList() {
    if (!this._cachedEmails) return [];
    let list = this._cachedEmails;
    if (this._emailFilterDirection === 'inbound') {
      list = list.filter(e => e.direction === 'inbound');
    } else if (this._emailFilterDirection === 'outbound') {
      list = list.filter(e => e.direction !== 'inbound');
    }

    if (this._emailSearchQuery) {
      const q = this._emailSearchQuery.toLowerCase();
      list = list.filter(e =>
        (e.recipient && e.recipient.toLowerCase().includes(q)) ||
        (e.subject && e.subject.toLowerCase().includes(q)) ||
        (e.sender && e.sender.toLowerCase().includes(q)) ||
        (e.user_name && e.user_name.toLowerCase().includes(q))
      );
    }
    return list;
  }

  filterEmailsTable(query) {
    this._emailSearchQuery = (query || '').trim();
    const tbody = document.getElementById('emails-audit-tbody');
    if (tbody) tbody.innerHTML = this.renderEmailsTableRows(this.getFilteredEmailsList());
  }

  renderEmailsTableRows(list) {
    if (!list || list.length === 0) {
      return `<tr><td colspan="7" style="text-align:center; padding:2.5rem; color:#64748B;">No email messages found for this filter.</td></tr>`;
    }

    return list.map((e) => {
      const originalIdx = this._cachedEmails.indexOf(e);
      const isInbound = e.direction === 'inbound';
      const isSmtp = e.status === 'sent_smtp' || e.status === 'test_sent_smtp';
      const isError = e.status === 'error_smtp';
      const isUnread = isInbound && e.status === 'unread';

      const dateStr = new Date(e.created_at || Date.now()).toLocaleDateString('en-CA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      return `
        <tr style="${isUnread ? 'background:#F8FAFC;' : ''}">
          <td>
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="display:inline-block; padding:2px 7px; border-radius:10px; font-size:0.7rem; font-weight:700; ${isInbound ? 'background:#EEF2FF; color:#4338CA;' : 'background:#F0FDF4; color:#15803D;'}">
                ${isInbound ? '📥 Inbound' : '📤 Outbound'}
              </span>
              <code style="font-size:0.75rem;">#${isInbound ? 'INB' : 'EML'}-${e.id}</code>
            </div>
          </td>
          <td style="max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${this.escapeHtml(e.sender)}">
            <span style="${isInbound ? 'color:#1E1B4B; font-weight:700;' : 'color:#047857;'}">${this.escapeHtml(e.sender)}</span>
          </td>
          <td style="max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${this.escapeHtml(e.recipient)}">
            <span style="${!isInbound ? 'color:#1E1B4B; font-weight:700;' : 'color:#475569;'}">${this.escapeHtml(e.recipient)}</span>
          </td>
          <td style="max-width: 260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${this.escapeHtml(e.subject)}">
            ${isUnread ? '<span style="color:#2563EB; margin-right:4px;" title="Unread Message">●</span>' : ''}
            <strong>${this.escapeHtml(e.subject)}</strong>
          </td>
          <td>
            ${isInbound ? `
              <span style="display:inline-block; padding:2px 8px; border-radius:12px; font-size:0.72rem; font-weight:700; ${isUnread ? 'background:#FEF3C7; color:#92400E;' : 'background:#E2E8F0; color:#475569;'}">
                ${isUnread ? '● Unread Inbound' : '✓ Read Inbound'}
              </span>
            ` : `
              <span style="display:inline-block; padding:2px 8px; border-radius:12px; font-size:0.72rem; font-weight:700; ${isSmtp ? 'background:#DCFCE7; color:#15803D;' : (isError ? 'background:#FEE2E2; color:#B91C1C;' : 'background:#FEF3C7; color:#92400E;')}">
                ${isSmtp ? '✓ Sent via SMTP' : (isError ? '✕ SMTP Error' : '○ Recorded in DB')}
              </span>
            `}
          </td>
          <td style="white-space:nowrap; font-size:0.78rem; color:#64748B;">${dateStr}</td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="window.adminPortal.showEmailDetail(${originalIdx})">
              👁️ View Content
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  showEmailDetail(idx) {
    const email = this._cachedEmails ? this._cachedEmails[idx] : null;
    if (!email) return;

    const modal = document.getElementById('email-audit-detail-modal');
    const content = document.getElementById('email-audit-detail-content');
    if (!modal || !content) return;

    const isInbound = email.direction === 'inbound';
    const isSmtp = email.status === 'sent_smtp' || email.status === 'test_sent_smtp';

    // Auto mark inbound as read if unread
    if (isInbound && email.status === 'unread') {
      email.status = 'read';
      fetch(`/api/inbound-emails/${email.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'read' })
      }).catch(err => console.warn('Could not update status:', err));
    }

    content.innerHTML = `
      <div style="border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 1rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.35rem;">
          <span style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: ${isInbound ? '#4338CA;' : '#008080;'}">
            ${isInbound ? '📥 INBOUND EMAIL (RECEIVED VIA RESEND WEBHOOK)' : `📤 OUTBOUND DISPATCH RECORD #EML-${email.id}`}
          </span>
          <span style="display:inline-block; padding:2px 8px; border-radius:12px; font-size:0.75rem; font-weight:700; ${isInbound ? 'background:#EEF2FF; color:#4338CA;' : (isSmtp ? 'background:#DCFCE7; color:#15803D;' : 'background:#FEF3C7; color:#92400E;')}">
            ${isInbound ? '✓ Inbound Webhook Delivered' : (isSmtp ? '✓ Delivered via Live SMTP Gateway' : '○ Recorded in SQLite DB')}
          </span>
        </div>
        <h3 style="margin: 0.25rem 0 0.5rem 0; color: #0D3B3A; font-size: 1.18rem;">${this.escapeHtml(email.subject)}</h3>
        <div style="font-size: 0.85rem; color: #475569; display:grid; grid-template-columns: auto 1fr; gap: 4px 12px; margin-top: 8px;">
          <strong>From:</strong> <span>${this.escapeHtml(email.sender)}</span>
          <strong>To:</strong> <span>${this.escapeHtml(email.recipient)}</span>
          <strong>Received:</strong> <span>${email.created_at}</span>
        </div>
      </div>

      <!-- Message Content Container with HTML/Text Tabs -->
      <div style="margin-bottom: 1rem;">
        ${email.body_html ? `
          <div style="display:flex; gap:6px; margin-bottom:8px;">
            <button type="button" class="btn btn-sm btn-outline" style="font-size:0.75rem; padding:3px 8px;" onclick="document.getElementById('email-view-html').style.display='block'; document.getElementById('email-view-text').style.display='none';">
              🌐 Formatted View
            </button>
            <button type="button" class="btn btn-sm btn-outline" style="font-size:0.75rem; padding:3px 8px;" onclick="document.getElementById('email-view-html').style.display='none'; document.getElementById('email-view-text').style.display='block';">
              📄 Plain Text
            </button>
          </div>
          <div id="email-view-html" style="background:#FFFFFF; border:1px solid var(--border-color); border-radius:8px; padding:1.25rem; max-height:360px; overflow-y:auto; color:#1E293B;">
            ${email.body_html}
          </div>
          <div id="email-view-text" style="display:none; background:#F8FAFC; border:1px solid var(--border-color); border-radius:8px; padding:1.25rem; font-family:monospace; font-size:0.82rem; line-height:1.5; white-space:pre-wrap; max-height:360px; overflow-y:auto; color:#1E293B;">
${this.escapeHtml(email.body || '')}
          </div>
        ` : `
          <div style="background: #F8FAFC; border: 1px solid var(--border-color); border-radius: 8px; padding: 1.25rem; font-family: monospace; font-size: 0.82rem; line-height: 1.5; white-space: pre-wrap; max-height: 360px; overflow-y: auto; color: #1E293B;">
${this.escapeHtml(email.body || '(Empty body)')}
          </div>
        `}
      </div>

      <div style="margin-top: 1.25rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
        <div>
          ${isInbound ? `
            <button type="button" class="btn btn-primary btn-sm" onclick="window.adminPortal.openQuickReplyModal(${idx})">
              ↩️ Reply to Sender
            </button>
          ` : ''}
        </div>
        <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('email-audit-detail-modal').classList.remove('active')">
          Close Message
        </button>
      </div>
    `;

    modal.classList.add('active');
  }

  openSimulateInboundModal() {
    const modal = document.getElementById('email-simulate-inbound-modal');
    if (modal) modal.classList.add('active');
  }

  async submitSimulatedInbound(event) {
    event.preventDefault();
    const btn = document.getElementById('btn-submit-sim-inbound');
    const sender = document.getElementById('sim-inb-sender')?.value.trim();
    const recipient = document.getElementById('sim-inb-recipient')?.value.trim();
    const subject = document.getElementById('sim-inb-subject')?.value.trim();
    const body = document.getElementById('sim-inb-body')?.value.trim();

    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Posting to Inbound Webhook...';
    }

    try {
      // Structure payload identically to Resend email.received webhook
      const webhookPayload = {
        type: 'email.received',
        created_at: new Date().toISOString(),
        data: {
          email_id: 'resend_inb_test_' + Date.now(),
          from: sender,
          to: [recipient],
          subject: subject,
          text: body,
          html: `<p>${body.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`,
          headers: {
            from: sender,
            to: recipient,
            subject: subject
          }
        }
      };

      const res = await fetch('/api/webhooks/resend-inbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
      });
      const data = await res.json();

      if (data.success) {
        alert(`🎉 Inbound Email Successfully Received!\n\nEmail ID: #${data.id}\nFrom: ${sender}\nSubject: "${subject}"\n\nIt is now logged in your inbox!`);
        document.getElementById('email-simulate-inbound-modal')?.classList.remove('active');
        this.renderEmailsTab(document.getElementById('admin-tab-content'));
      } else {
        alert(`⚠️ Webhook error: ${data.error || 'Failed to process email'}`);
      }
    } catch (err) {
      alert(`Network error dispatching webhook: ${err.message}`);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '🚀 Dispatch Simulated Webhook';
      }
    }
  }

  openQuickReplyModal(idx) {
    const email = this._cachedEmails ? this._cachedEmails[idx] : null;
    if (!email) return;

    // Close detail modal
    document.getElementById('email-audit-detail-modal')?.classList.remove('active');

    // Switch to emailconfig tab with prefilled test panel
    this.switchTab('emailconfig');
    setTimeout(() => {
      const targetEl = document.getElementById('smtp-test-target');
      if (targetEl) {
        // extract pure email address from "Name <email>" if present
        const match = email.sender.match(/<([^>]+)>/);
        targetEl.value = match ? match[1] : email.sender;
        targetEl.focus();
      }
    }, 200);
  }

  // --- 14. CHATGPT API CONFIGURATION TAB ---
  renderChatGPTTab(container) {
    const currentKey = localStorage.getItem('cafhs_openai_api_key') || '';
    const currentModel = localStorage.getItem('cafhs_selected_model') || 'gpt-4o-mini';

    container.innerHTML = `
      <div class="admin-tab-header">
        <div>
          <h2>🤖 ChatGPT & Nova AI Engine Configuration</h2>
          <p class="section-desc">
            Configure direct OpenAI API integration for compassionate Canadian healthcare navigation, clinical resourcing, and automated triage.
          </p>
        </div>
      </div>

      <div style="max-width: 760px; background: #FFFFFF; border: 1px solid var(--border-color); border-radius: 10px; padding: 1.75rem; box-shadow: var(--shadow-sm);">
        <form onsubmit="window.adminPortal.saveChatGPTConfig(event)">
          <div class="form-group" style="margin-bottom: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
              <label class="form-label" for="admin-openai-key" style="margin: 0;">OpenAI API Key (sk-proj-... / AI Key) *</label>
              <button type="button" class="btn-link" onclick="window.adminPortal.toggleChatGPTKeyVisibility()" style="font-size: 0.75rem; text-decoration: underline;">
                👁️ Show / Hide
              </button>
            </div>
            <input type="password" id="admin-openai-key" class="form-control" placeholder="sk-proj-..." value="${this.escapeHtml(currentKey)}" autocomplete="off">
            <small style="color: #64748B; font-size: 0.75rem;">Stored securely in browser local storage and used directly for OpenAI API chat requests.</small>
          </div>

          <div class="form-group" style="margin-bottom: 1.5rem;">
            <label class="form-label" for="admin-openai-model">Language Model</label>
            <select id="admin-openai-model" class="form-control">
              <option value="gpt-4o-mini" ${currentModel === 'gpt-4o-mini' ? 'selected' : ''}>GPT-4o Mini (Fast, Intelligent & Cost-Effective - Recommended)</option>
              <option value="gpt-4o" ${currentModel === 'gpt-4o' ? 'selected' : ''}>GPT-4o (High-Precision Clinical & Complex Health Navigation)</option>
              <option value="gpt-3.5-turbo" ${currentModel === 'gpt-3.5-turbo' ? 'selected' : ''}>GPT-3.5 Turbo (Legacy Model)</option>
            </select>
          </div>

          <div style="display: flex; gap: 0.75rem;">
            <button type="submit" class="btn btn-primary" style="flex: 2; font-weight: 700;">
              💾 Save AI Configuration
            </button>
            <button type="button" class="btn btn-outline" style="flex: 1;" onclick="window.adminPortal.testChatGPTConnection()">
              🧪 Test Connection
            </button>
          </div>
        </form>

        <div id="admin-ai-test-result" style="margin-top: 1.25rem; display: none;"></div>
      </div>
    `;
  }

  toggleChatGPTKeyVisibility() {
    const input = document.getElementById('admin-openai-key');
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
  }

  saveChatGPTConfig(event) {
    event.preventDefault();
    const key = document.getElementById('admin-openai-key')?.value.trim() || '';
    const model = document.getElementById('admin-openai-model')?.value || 'gpt-4o-mini';

    localStorage.setItem('cafhs_openai_api_key', key);
    localStorage.setItem('cafhs_selected_model', model);

    alert('✅ ChatGPT API settings successfully saved!');
  }

  async testChatGPTConnection() {
    const key = document.getElementById('admin-openai-key')?.value.trim() || '';
    const resultBox = document.getElementById('admin-ai-test-result');

    if (!key) {
      alert('Please enter an OpenAI API key first.');
      return;
    }

    if (resultBox) {
      resultBox.style.display = 'block';
      resultBox.innerHTML = `<div style="background:#EFF6FF; border:1px solid #BFDBFE; padding:0.75rem; border-radius:6px; font-size:0.85rem; color:#1E40AF;">Connecting to OpenAI API...</div>`;
    }

    try {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      if (res.ok) {
        if (resultBox) {
          resultBox.innerHTML = `<div style="background:#F0FDF4; border:1px solid #86EFAC; padding:0.75rem; border-radius:6px; font-size:0.85rem; color:#166534;">🎉 OpenAI API Connection Verified Successfully! Key is valid and authorized.</div>`;
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        if (resultBox) {
          resultBox.innerHTML = `<div style="background:#FEF2F2; border:1px solid #FCA5A5; padding:0.75rem; border-radius:6px; font-size:0.85rem; color:#991B1B;">⚠️ Connection Failed: ${this.escapeHtml(errData.error?.message || 'Authentication error')}</div>`;
        }
      }
    } catch (e) {
      if (resultBox) {
        resultBox.innerHTML = `<div style="background:#FEF2F2; border:1px solid #FCA5A5; padding:0.75rem; border-radius:6px; font-size:0.85rem; color:#991B1B;">Network Error: ${this.escapeHtml(e.message)}</div>`;
      }
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

window.adminPortal = new AdminPortal();
