/**
 * Canadian Association of Family Health Support (CAFHS)
 * Main Application Logic & UI Controller
 */

class CAFHSApp {
  constructor() {
    this.currentLanguage = 'en';
    this.activeAssessment = 'caregiver';
    this.assessmentAnswers = {};
    this.selectedProvince = 'ALL';
    this.selectedCategory = 'ALL';
    this.searchTerm = '';
    this.donationAmount = 100;
    this.donationFrequency = 'one-time';
    this.selectedRsvpEvent = null;
    
    this.init();
  }

  init() {
    // 1. Initialize AI Chat
    window.chatEngine = new AIChatEngine();
    window.chatEngine.setLanguage(this.currentLanguage);
    window.chatEngine.renderMessages();

    // 2. Render Initial Dynamic Components
    this.applyTranslations(this.currentLanguage);
    this.renderDynamicPrograms();
    this.renderDynamicEvents();
    this.renderDynamicArticles();
    this.renderDirectory();
    this.renderAssessment(this.activeAssessment);
    this.initEventListeners();
    this.initDonationCalculator();
    this.setupSmoothScroll();

    // 3. Sync Auth & Notifications
    if (window.authService) window.authService.syncUI();
    if (window.emailService) window.emailService.updateBadge();

    // 4. Reactive Listeners for Content Updates & Auth
    window.addEventListener('cafhs:content-updated', (e) => {
      this.renderDynamicPrograms();
      this.renderDynamicEvents();
      this.renderDynamicArticles();
    });

    window.addEventListener('cafhs:auth-changed', (e) => {
      if (window.chatEngine) window.chatEngine.renderMessages();
      this.updateUserPortalIfOpen();
    });
  }

  setLanguage(lang) {
    this.currentLanguage = lang;
    window.chatEngine.setLanguage(lang);
    this.applyTranslations(lang);
    this.renderDynamicPrograms();
    this.renderDynamicEvents();
    this.renderDynamicArticles();
    this.renderDirectory();
    this.renderAssessment(this.activeAssessment);
    
    // Update button states
    const btnEn = document.getElementById('btn-lang-en');
    const btnFr = document.getElementById('btn-lang-fr');
    if (btnEn && btnFr) {
      if (lang === 'en') {
        btnEn.classList.add('active');
        btnFr.classList.remove('active');
      } else {
        btnFr.classList.add('active');
        btnEn.classList.remove('active');
      }
    }
  }

  applyTranslations(lang) {
    const t = window.translations[lang] || window.translations.en;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key]) {
        el.innerHTML = t[key];
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (t[key]) {
        el.placeholder = t[key];
      }
    });

    document.documentElement.lang = lang;
  }

  // --- Dynamic Programs Rendering ---
  renderDynamicPrograms() {
    const container = document.getElementById('dynamic-programs-grid');
    if (!container || !window.contentStore) return;

    const isFr = this.currentLanguage === 'fr';
    const programs = window.contentStore.getPrograms();

    container.innerHTML = programs.map(prog => {
      const title = (isFr && prog.titleFr) ? prog.titleFr : prog.title;
      const desc = (isFr && prog.descriptionFr) ? prog.descriptionFr : prog.description;
      return `
        <div class="program-card">
          <div class="program-img-wrap">
            <img src="${prog.image || 'assets/images/community-wellness.jpg'}" alt="${title}">
            <span class="program-badge">${prog.icon || '🍁'} ${prog.category}</span>
          </div>
          <div class="program-content">
            <h3 class="program-title">${title}</h3>
            <p class="program-desc">${desc}</p>
            <div class="program-actions">
              <button type="button" class="btn-card-link" onclick="window.app.openIntakeModal('${title.replace(/'/g, "\\'")}')">
                ${isFr ? "Demander ce soutien →" : "Book Intake →"}
              </button>
              <button type="button" class="btn-card-link" onclick="window.app.triggerProgramAIChat('${title.replace(/'/g, "\\'")}')">
                ${isFr ? "Explorer avec l'IA ✨" : "Ask Nova AI ✨"}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- Dynamic Events Rendering ---
  renderDynamicEvents() {
    const container = document.getElementById('dynamic-events-grid');
    if (!container || !window.contentStore) return;

    const isFr = this.currentLanguage === 'fr';
    const events = window.contentStore.getEvents();

    container.innerHTML = events.map(evt => {
      const title = (isFr && evt.titleFr) ? evt.titleFr : evt.title;
      const desc = (isFr && evt.descriptionFr) ? evt.descriptionFr : evt.description;
      const dateFormatted = new Date(evt.date + 'T12:00:00').toLocaleDateString(isFr ? 'fr-CA' : 'en-CA', {
        weekday: 'long', month: 'short', day: 'numeric'
      });

      return `
        <div class="event-card">
          <span class="event-date-badge">🗓️ ${dateFormatted} • ${evt.time}</span>
          <h3 class="event-title">${title}</h3>
          <p class="event-desc">${desc}</p>
          <div class="event-card-footer" style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem;">
            <small style="color:var(--text-subtle);">Facilitator: ${evt.facilitator}</small>
            <button type="button" class="btn btn-outline btn-sm" onclick="window.app.openEventModal('${evt.id}')">
              ${isFr ? "Inscription gratuite" : "Register for Free"}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- Dynamic Articles & Health Bulletins Rendering ---
  renderDynamicArticles() {
    const container = document.getElementById('dynamic-articles-grid');
    if (!container || !window.contentStore) return;

    const isFr = this.currentLanguage === 'fr';
    const articles = window.contentStore.getArticles().filter(a => a.published !== false);

    container.innerHTML = articles.map(art => {
      const title = (isFr && art.titleFr) ? art.titleFr : art.title;
      const excerpt = (isFr && art.excerptFr) ? art.excerptFr : art.excerpt;
      const category = (isFr && art.categoryFr) ? art.categoryFr : art.category;

      return `
        <div class="article-card">
          <div class="article-img-wrap">
            <img src="${art.image || 'assets/images/family-consultation.jpg'}" alt="${title}">
            <span class="article-badge">${category}</span>
          </div>
          <div class="article-body">
            <div class="article-meta">
              <span>📅 ${art.date}</span>
              <span>•</span>
              <span>⏱️ ${art.readTime || '4 min'}</span>
            </div>
            <h3 class="article-title">${title}</h3>
            <p class="article-excerpt">${excerpt}</p>
            <div class="article-footer">
              <span class="article-author">By ${art.author}</span>
              <button type="button" class="btn-card-link" onclick="window.app.readFullArticle('${art.id}')">
                ${isFr ? "Lire l'article →" : "Read Full Bulletin →"}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  readFullArticle(articleId) {
    const article = window.contentStore.getArticles().find(a => a.id === articleId);
    if (!article) return;

    const isFr = this.currentLanguage === 'fr';
    const title = (isFr && article.titleFr) ? article.titleFr : article.title;
    const content = (isFr && article.contentFr) ? article.contentFr : article.content;

    const modal = document.getElementById('article-reader-modal');
    const container = document.getElementById('article-reader-content');
    if (modal && container) {
      container.innerHTML = `
        <div class="article-full-view">
          <span class="table-badge" style="margin-bottom:0.75rem;">${article.category}</span>
          <h2>${title}</h2>
          <div class="article-meta" style="margin: 0.75rem 0 1.5rem 0;">
            <strong>By ${article.author}</strong> • Published ${article.date} • ${article.readTime}
          </div>
          <div class="article-body-text" style="font-size:1.05rem; line-height:1.75; color:#2D3748;">
            <p>${content}</p>
            <div class="article-support-callout" style="background:var(--primary-light); padding:1.25rem; border-radius:12px; margin-top:2rem;">
              <h5>🍁 Need personalized guidance on this topic?</h5>
              <p style="margin-bottom:0.75rem;">Connect with a CAFHS family health navigator or chat with Nova AI for 24/7 provincial resources.</p>
              <button class="btn btn-primary btn-sm" onclick="window.app.closeArticleModal(); window.app.openChat();">Chat with Nova AI</button>
            </div>
          </div>
        </div>
      `;
      modal.classList.add('active');
    }
  }

  closeArticleModal() {
    const modal = document.getElementById('article-reader-modal');
    if (modal) modal.classList.remove('active');
  }

  // --- Provincial Directory Filtering & Rendering ---
  renderDirectory() {
    const container = document.getElementById('directory-grid');
    if (!container) return;

    const isFr = this.currentLanguage === 'fr';
    let data = window.provincialDirectory || [];

    if (this.selectedProvince !== 'ALL') {
      data = data.filter(item => item.province === this.selectedProvince || item.province === 'National');
    }

    if (this.selectedCategory !== 'ALL') {
      data = data.filter(item => item.category === this.selectedCategory);
    }

    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const q = this.searchTerm.toLowerCase().trim();
      data = data.filter(item => {
        const title = (isFr ? item.titleFr : item.titleEn).toLowerCase();
        const desc = (isFr ? item.descFr : item.descEn).toLowerCase();
        const prov = item.provinceName.toLowerCase();
        const tags = item.tags.map(tag => tag.toLowerCase()).join(' ');
        return title.includes(q) || desc.includes(q) || prov.includes(q) || tags.includes(q);
      });
    }

    if (data.length === 0) {
      container.innerHTML = `
        <div class="directory-empty-state">
          <div class="empty-icon">🔍</div>
          <h4>${isFr ? "Aucune ressource trouvée" : "No healthcare resources match your search"}</h4>
          <p>${isFr ? "Essayez d'ajuster vos filtres de province ou de réinitialiser la recherche." : "Try clearing filters or searching for terms like '811', 'caregiver', or 'postpartum'."}</p>
          <button class="btn btn-outline" onclick="window.app.resetDirectoryFilters()">${isFr ? "Réinitialiser les filtres" : "Reset Filters"}</button>
        </div>
      `;
      return;
    }

    container.innerHTML = data.map(item => {
      const title = isFr ? item.titleFr : item.titleEn;
      const desc = isFr ? item.descFr : item.descEn;
      const provinceLabel = item.province === 'National' 
        ? (isFr ? '🍁 Pancanadien' : '🍁 Canada-Wide') 
        : `📍 ${item.provinceName}`;

      return `
        <div class="resource-card ${item.featured ? 'resource-featured' : ''}" data-id="${item.id}">
          <div class="card-top">
            <span class="prov-badge">${provinceLabel}</span>
            <span class="hours-badge">⏱️ ${item.hours}</span>
          </div>
          <h3 class="resource-title">${title}</h3>
          <p class="resource-desc">${desc}</p>
          <div class="resource-tags">
            ${item.tags.map(t => `<span class="tag-pill">${t}</span>`).join('')}
          </div>
          <div class="resource-footer">
            ${item.phone ? `<a href="tel:${item.phone.split(' ')[0]}" class="btn-phone">📞 ${item.phone}</a>` : ''}
            <a href="${item.website}" target="_blank" rel="noopener noreferrer" class="btn-website">
              ${isFr ? "Site officiel ↗" : "Official Website ↗"}
            </a>
          </div>
        </div>
      `;
    }).join('');
  }

  resetDirectoryFilters() {
    this.selectedProvince = 'ALL';
    this.selectedCategory = 'ALL';
    this.searchTerm = '';
    const provSelect = document.getElementById('dir-province-select');
    const catSelect = document.getElementById('dir-category-select');
    const searchInput = document.getElementById('dir-search-input');
    if (provSelect) provSelect.value = 'ALL';
    if (catSelect) catSelect.value = 'ALL';
    if (searchInput) searchInput.value = '';
    this.renderDirectory();
  }

  // --- Assessments Screeners ---
  switchAssessment(type) {
    this.activeAssessment = type;
    this.assessmentAnswers = {};
    const tabCaregiver = document.getElementById('tab-btn-caregiver');
    const tabPostpartum = document.getElementById('tab-btn-postpartum');
    if (tabCaregiver && tabPostpartum) {
      if (type === 'caregiver') {
        tabCaregiver.classList.add('active');
        tabPostpartum.classList.remove('active');
      } else {
        tabPostpartum.classList.add('active');
        tabCaregiver.classList.remove('active');
      }
    }
    this.renderAssessment(type);
  }

  renderAssessment(type) {
    const container = document.getElementById('assessment-container');
    if (!container) return;

    const isFr = this.currentLanguage === 'fr';
    const assessmentData = window.assessments[type];
    if (!assessmentData) return;

    const title = isFr ? assessmentData.titleFr : assessmentData.titleEn;
    const desc = isFr ? assessmentData.descFr : assessmentData.descEn;

    let questionsHtml = '';
    if (type === 'caregiver') {
      questionsHtml = assessmentData.questions.map((q, idx) => {
        const questionText = isFr ? q.qFr : q.qEn;
        const currentVal = this.assessmentAnswers[q.id];
        return `
          <div class="assessment-q-row">
            <div class="q-num">${idx + 1}</div>
            <div class="q-text">${questionText}</div>
            <div class="q-options">
              <button type="button" class="btn-opt ${currentVal === 1 ? 'selected' : ''}" onclick="window.app.recordAnswer('${q.id}', 1)">${isFr ? 'Oui' : 'Yes'}</button>
              <button type="button" class="btn-opt ${currentVal === 0 ? 'selected' : ''}" onclick="window.app.recordAnswer('${q.id}', 0)">${isFr ? 'Non' : 'No'}</button>
            </div>
          </div>
        `;
      }).join('');
    } else {
      questionsHtml = assessmentData.questions.map((q, idx) => {
        const questionText = isFr ? q.qFr : q.qEn;
        const currentVal = this.assessmentAnswers[q.id];
        return `
          <div class="assessment-q-block">
            <div class="q-header">
              <span class="q-num">${idx + 1}</span>
              <span class="q-text">${questionText}</span>
            </div>
            <div class="q-options-grid">
              ${q.options.map(opt => `
                <button type="button" class="btn-opt-card ${currentVal === opt.val ? 'selected' : ''}" onclick="window.app.recordAnswer('${q.id}', ${opt.val})">
                  ${isFr ? opt.labelFr : opt.labelEn}
                </button>
              `).join('')}
            </div>
          </div>
        `;
      }).join('');
    }

    const answeredCount = Object.keys(this.assessmentAnswers).length;
    const totalQuestions = assessmentData.questions.length;
    const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

    container.innerHTML = `
      <div class="assessment-card-wrapper">
        <div class="assessment-header">
          <div class="assessment-badge">🌱 ${isFr ? "Outil d'auto-évaluation" : "Self-Assessment Tool"}</div>
          <h3 class="assessment-title">${title}</h3>
          <p class="assessment-intro">${desc}</p>
          <div class="assessment-progress-bar-container">
            <div class="progress-info">
              <span>${isFr ? "Progression" : "Progress"}: ${answeredCount}/${totalQuestions} ${isFr ? "questions répondues" : "questions answered"}</span>
              <span>${progressPercent}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width: ${progressPercent}%;"></div>
            </div>
          </div>
        </div>

        <div class="assessment-body">
          <form id="assessment-form">
            ${questionsHtml}
          </form>
        </div>

        <div class="assessment-footer">
          <div class="assessment-disclaimer">
            🔒 ${isFr 
              ? "Vos réponses demeurent entièrement confidentielles sur votre appareil et ne sont jamais partagées sans votre consentement."
              : "Your responses are strictly confidential on your local device and are never shared without explicit consent."}
          </div>
          <button type="button" class="btn btn-primary" onclick="window.app.calculateAssessmentResults()" ${answeredCount < totalQuestions ? 'disabled' : ''}>
            ${isFr ? "Obtenir mon bilan confidentiel" : "View Confidential Results"}
          </button>
        </div>
      </div>
    `;
  }

  recordAnswer(questionId, val) {
    this.assessmentAnswers[questionId] = val;
    this.renderAssessment(this.activeAssessment);
  }

  calculateAssessmentResults() {
    const isFr = this.currentLanguage === 'fr';
    const type = this.activeAssessment;
    const assessmentData = window.assessments[type];
    if (!assessmentData) return;

    let score = 0;
    Object.values(this.assessmentAnswers).forEach(v => score += v);

    let resultTier = null;
    for (const tier of assessmentData.scoringTiers) {
      if (score >= tier.min && score <= tier.max) {
        resultTier = tier;
        break;
      }
    }
    if (!resultTier) resultTier = assessmentData.scoringTiers[assessmentData.scoringTiers.length - 1];

    const container = document.getElementById('assessment-container');
    if (!container) return;

    container.innerHTML = `
      <div class="assessment-results-card">
        <div class="result-badge ${resultTier.level}">${isFr ? resultTier.labelFr : resultTier.labelEn}</div>
        <h3 class="result-title">${isFr ? "Votre indice de bien-être" : "Your Confidential Wellbeing Assessment"}</h3>
        <div class="score-display">Score: <strong>${score}</strong> / ${type === 'caregiver' ? 13 : 30}</div>
        <p class="result-desc">${isFr ? resultTier.descFr : resultTier.descEn}</p>
        
        <div class="result-actions">
          <button class="btn btn-primary" onclick="window.app.openIntakeModal('${type === 'caregiver' ? 'Caregiver Respite Support' : 'Postpartum Support'}')">
            🍁 ${isFr ? "Prendre rendez-vous avec un intervenant" : "Connect with a CAFHS Navigator"}
          </button>
          <button class="btn btn-secondary" onclick="window.app.openChat(); window.chatEngine.sendMessage('I just completed the ${type} screener with a score of ${score}. Can you provide recommendations?')">
            ✨ ${isFr ? "Consulter l'IA Nova" : "Ask Nova AI for Coping Tools"}
          </button>
          <button class="btn btn-outline" onclick="window.app.switchAssessment('${type}')">
            🔄 ${isFr ? "Recommencer" : "Retake Assessment"}
          </button>
        </div>
      </div>
    `;
  }

  // --- Donation Calculator ---
  initDonationCalculator() {
    this.updateDonationDisplay();
  }

  setDonationAmount(amount) {
    this.donationAmount = amount;
    document.querySelectorAll('.donation-preset-btn').forEach(btn => {
      btn.classList.toggle('selected', parseInt(btn.getAttribute('data-amount'), 10) === amount);
    });
    const customInput = document.getElementById('custom-donation-input');
    if (customInput) customInput.value = '';
    this.updateDonationDisplay();
  }

  setCustomDonationAmount(val) {
    const amt = parseFloat(val);
    if (!isNaN(amt) && amt > 0) {
      this.donationAmount = amt;
      document.querySelectorAll('.donation-preset-btn').forEach(btn => btn.classList.remove('selected'));
      this.updateDonationDisplay();
    }
  }

  setDonationFrequency(freq) {
    this.donationFrequency = freq;
    const btnOne = document.getElementById('freq-onetime');
    const btnMonth = document.getElementById('freq-monthly');
    if (btnOne && btnMonth) {
      if (freq === 'one-time') {
        btnOne.classList.add('active');
        btnMonth.classList.remove('active');
      } else {
        btnMonth.classList.add('active');
        btnOne.classList.remove('active');
      }
    }
    this.updateDonationDisplay();
  }

  updateDonationDisplay() {
    const isFr = this.currentLanguage === 'fr';
    const amount = this.donationAmount || 0;
    
    let impactText = '';
    if (amount < 50) {
      impactText = isFr 
        ? "Fournit 1 trousse de soins essentiels et de dépistage du bien-être post-partum pour une nouvelle maman."
        : "Funds 1 newborn postpartum care & emotional recovery kit for a new mother.";
    } else if (amount < 150) {
      impactText = isFr
        ? "Finance une séance de coaching anti-épuisement et une trousse d'orientation au répit pour un proche aidant."
        : "Provides a family caregiver burnout relief coaching session & respite navigation toolkit.";
    } else if (amount < 300) {
      impactText = isFr
        ? "Permet à 5 adolescents en détresse de participer à des cercles cliniques de santé mentale et résilience."
        : "Enrolls 5 vulnerable youth in clinician-led anxiety & resilience peer support circles.";
    } else {
      impactText = isFr
        ? "Prend en charge la navigation santé personnalisée et le soutien par les pairs pour une famille vulnérable pendant un mois."
        : "Sponsors comprehensive 1-on-1 healthcare navigation & peer support for a vulnerable family for a month.";
    }

    const amtEl = document.getElementById('calc-don-amount');
    const taxEl = document.getElementById('calc-tax-credit');
    const netEl = document.getElementById('calc-net-cost');
    const impactEl = document.getElementById('calc-impact-text');

    if (amtEl) amtEl.innerText = `$${amount.toFixed(2)} CAD`;
    if (taxEl) taxEl.innerText = isFr ? "100 % affecté aux programmes" : "100% to Community Programs";
    if (netEl) netEl.innerText = `$${amount.toFixed(2)} CAD`;
    if (impactEl) impactEl.innerText = impactText;
  }

  // --- Real Non-Profit Contribution Checkout & Official Receipt Dispatch ---

  openContributionCheckoutModal() {
    const isFr = this.currentLanguage === 'fr';
    const amount = this.donationAmount || 100;
    const freq = this.donationFrequency === 'monthly' ? (isFr ? 'Mensuel' : 'Monthly Support') : (isFr ? 'Unique' : 'One-Time Contribution');

    const modal = document.getElementById('contribution-checkout-modal');
    if (!modal) return;

    // Update amount & frequency display in modal
    const amtEl = document.getElementById('checkout-amount-display');
    const freqEl = document.getElementById('checkout-freq-display');
    if (amtEl) amtEl.innerText = `$${amount.toFixed(2)} CAD`;
    if (freqEl) freqEl.innerText = freq;

    // Pre-fill user details if logged in
    const currentUser = window.authService ? window.authService.getCurrentUser() : null;
    const nameInput = document.getElementById('contrib-donor-name');
    const emailInput = document.getElementById('contrib-donor-email');
    const provSelect = document.getElementById('contrib-donor-province');

    if (currentUser) {
      if (nameInput && !nameInput.value) nameInput.value = currentUser.name;
      if (emailInput && !emailInput.value) emailInput.value = currentUser.email;
      if (provSelect && currentUser.province) provSelect.value = currentUser.province;
    }

    this.setContributionPaymentMethod(this.selectedPaymentMethod || 'credit_card');
    modal.classList.add('active');
  }

  openPartnerRegistrationModal() {
    const modal = document.getElementById('training-partner-modal');
    if (modal) {
      modal.classList.add('active');
      const nameInput = document.getElementById('tp-name');
      if (nameInput) nameInput.focus();
    }
  }

  closePartnerRegistrationModal() {
    const modal = document.getElementById('training-partner-modal');
    if (modal) modal.classList.remove('active');
  }

  async submitPartnerRegistration(event) {
    if (event) event.preventDefault();

    const submitBtn = document.getElementById('btn-submit-tp-reg');
    const institution_name = document.getElementById('tp-name')?.value.trim();
    const institution_type = document.getElementById('tp-type')?.value;
    const campus_city = document.getElementById('tp-city')?.value.trim();
    const website = document.getElementById('tp-website')?.value.trim();
    const accreditation_id = document.getElementById('tp-accreditation')?.value.trim();
    const contact_name = document.getElementById('tp-contact-name')?.value.trim();
    const contact_title = document.getElementById('tp-contact-title')?.value.trim();
    const contact_email = document.getElementById('tp-contact-email')?.value.trim();
    const contact_phone = document.getElementById('tp-contact-phone')?.value.trim();
    const programs = document.getElementById('tp-programs')?.value.trim();
    const payout_method = document.getElementById('tp-payout-method')?.value;
    const allocation_focus = document.getElementById('tp-focus')?.value.trim();
    const banking_info = document.getElementById('tp-banking')?.value.trim();
    const agreed = document.getElementById('tp-agreement')?.checked;

    if (!institution_name || !contact_name || !contact_email) {
      alert('Please fill out all required institution profile fields.');
      return;
    }

    if (!agreed) {
      alert('Please confirm the agreement checkbox to register with CAFHS to accept training grants and bursaries.');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = '🎓 Processing Registration & Setting Up Payout...';
    }

    try {
      const response = await fetch('/api/training-partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institution_name,
          institution_type,
          campus_city,
          province: 'ON',
          website,
          accreditation_id,
          contact_name,
          contact_title,
          contact_email,
          contact_phone,
          programs,
          payout_method,
          allocation_focus,
          banking_info,
          notes: 'Registered via CAFHS public partner intake portal'
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Server error saving partner registration.');
      }

      this.closePartnerRegistrationModal();
      document.getElementById('training-partner-reg-form')?.reset();

      // Show instant notification in on-screen inbox
      if (window.emailService) {
        window.emailService.sendEmail({
          to: contact_email,
          toName: contact_name,
          subject: `🎓 Registration Confirmed: Ontario Healthcare Training Partner #${data.partner.partner_code}`,
          body: `Congratulations ${contact_name}!\n\n${institution_name} is now officially registered as an authorized Ontario Training Partner with the Canadian Association of Family Health Support.\n\nCAFHS administrators can now disburse healthcare & caregiver student training grants and bursaries directly to your institution!`,
          category: 'partner_registration'
        });
      }

      alert(`✅ Registration Successful!\n\n${institution_name} is now registered (Partner Code: #${data.partner.partner_code}).\n\nYour institution profile and EFT payout details are on file. CAFHS will administer and allocate community training grants directly to your institution. A confirmation notice has been dispatched to ${contact_email}.`);

      // Trigger reactive content update event so admin tabs refresh
      window.dispatchEvent(new CustomEvent('cafhs:content-updated'));

    } catch (err) {
      console.error('Error registering training partner:', err);
      alert('Error registering institution: ' + err.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = '🎓 Complete Registration & Enable Donation Acceptance';
      }
    }
  }

  closeContributionCheckoutModal() {
    const modal = document.getElementById('contribution-checkout-modal');
    if (modal) modal.classList.remove('active');
  }

  setContributionPaymentMethod(method) {
    this.selectedPaymentMethod = method;

    const btnCc = document.getElementById('btn-method-cc');
    const btnInterac = document.getElementById('btn-method-interac');
    const btnPaypal = document.getElementById('btn-method-paypal');

    if (btnCc) btnCc.classList.toggle('active', method === 'credit_card');
    if (btnInterac) btnInterac.classList.toggle('active', method === 'interac');
    if (btnPaypal) btnPaypal.classList.toggle('active', method === 'paypal');

    const cardFields = document.getElementById('contrib-card-fields');
    const interacNotice = document.getElementById('contrib-interac-notice');
    const paypalNotice = document.getElementById('contrib-paypal-notice');

    if (cardFields) cardFields.style.display = method === 'credit_card' ? 'block' : 'none';
    if (interacNotice) interacNotice.style.display = method === 'interac' ? 'block' : 'none';
    if (paypalNotice) paypalNotice.style.display = method === 'paypal' ? 'block' : 'none';
  }

  async submitRealContribution(event) {
    if (event) event.preventDefault();

    const nameInput = document.getElementById('contrib-donor-name');
    const emailInput = document.getElementById('contrib-donor-email');
    const provSelect = document.getElementById('contrib-donor-province');
    const notesInput = document.getElementById('contrib-donor-notes');
    const submitBtn = document.getElementById('btn-submit-real-contrib');

    const donor_name = nameInput ? nameInput.value.trim() : '';
    const donor_email = emailInput ? emailInput.value.trim() : '';
    const province = provSelect ? provSelect.value : 'ON';
    const notes = notesInput ? notesInput.value.trim() : '';
    const amount = this.donationAmount || 100;
    const frequency = this.donationFrequency || 'one-time';
    const payment_method = this.selectedPaymentMethod || 'credit_card';

    if (!donor_name || !donor_email) {
      alert('Please provide your name and email address to receive your official contribution receipt.');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = '🍁 Processing & Issuing Receipt...';
    }

    try {
      const response = await fetch('/api/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donor_name,
          donor_email,
          amount,
          currency: 'CAD',
          frequency,
          payment_method,
          province,
          notes
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Server error processing contribution.');
      }

      // Close checkout modal
      this.closeContributionCheckoutModal();

      // Dispatch client-side notification toast & save in on-screen notification center
      if (window.emailService) {
        window.emailService.sendEmail({
          to: donor_email,
          toName: donor_name,
          subject: data.receipt.subject,
          body: data.receipt.body,
          category: 'contribution_receipt'
        });
      }

      // Display official bilingual receipt modal
      this.displayOfficialReceiptModal(data.contribution, data.receipt);

      // Trigger reactive content update event so admin tabs refresh
      window.dispatchEvent(new CustomEvent('cafhs:content-updated'));

    } catch (err) {
      console.error('Error submitting contribution:', err);
      alert('Error processing contribution: ' + err.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = '🍁 Complete Contribution & Issue Official Receipt';
      }
    }
  }

  displayOfficialReceiptModal(contribution, receiptMeta) {
    const isFr = this.currentLanguage === 'fr';
    const modal = document.getElementById('donation-success-modal');
    const details = document.getElementById('donation-modal-details');

    if (!modal || !details) return;

    const formattedDate = new Date(contribution.created_at || Date.now()).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    details.innerHTML = `
      <div class="donation-receipt-preview" id="printable-receipt-area">
        <div class="receipt-watermark">CAFHS • ACSSF</div>
        <div class="receipt-header">
          <div style="font-size: 2rem; margin-bottom: 0.25rem;">🍁</div>
          <h4>${isFr ? "REÇU OFFICIEL DE CONTRIBUTION COMMUNAUTAIRE" : "OFFICIAL COMMUNITY CONTRIBUTION RECEIPT"}</h4>
          <p><strong>Canadian Association of Family Health Support (CAFHS)</strong><br>
          Association Canadienne de Soutien à la Santé Familiale (ACSSF)</p>
          <small style="color: #64748B;">Canadian Non-Profit Community Association • Grassroots Family Care & Respite</small>
        </div>

        <div class="receipt-row highlight">
          <span>${isFr ? "Numéro de référence officiel" : "Official Transaction Reference"}:</span>
          <strong><code>${contribution.transaction_id}</code></strong>
        </div>

        <div class="receipt-row">
          <span>${isFr ? "Date d'émission" : "Date of Issuance"}:</span>
          <strong>${formattedDate}</strong>
        </div>

        <div class="receipt-row">
          <span>${isFr ? "Contributeur" : "Contributor"}:</span>
          <strong>${contribution.donor_name} &lt;${contribution.donor_email}&gt;</strong>
        </div>

        <div class="receipt-row">
          <span>${isFr ? "Province d'origine" : "Province of Origin"}:</span>
          <strong>${contribution.province || 'ON'}</strong>
        </div>

        <div class="receipt-row">
          <span>${isFr ? "Montant de la contribution" : "Contribution Amount"}:</span>
          <strong style="color: #0D3B3A; font-size: 1.15rem;">$${parseFloat(contribution.amount).toFixed(2)} ${contribution.currency} (${contribution.frequency.replace('_', ' ')})</strong>
        </div>

        <div class="receipt-row">
          <span>${isFr ? "Mode de paiement" : "Payment Method"}:</span>
          <strong>${contribution.payment_method.replace('_', ' ').toUpperCase()} • Settled (100% Impact)</strong>
        </div>

        <div class="receipt-row">
          <span>${isFr ? "Affectation des fonds" : "Grassroots Allocation"}:</span>
          <strong>100% Direct Caregiver Respite, Perinatal & Youth Mental Health Navigation</strong>
        </div>

        ${contribution.allocated_partner_name ? `
        <div class="receipt-row" style="background:#F0FDF4; border:1px solid #BBF7D0; padding:0.45rem 0.65rem; border-radius:4px;">
          <span>${isFr ? "Partenaire de formation récipiendaire" : "Recipient Training Partner"}:</span>
          <strong style="color: #047857;">🎓 ${contribution.allocated_partner_name}</strong>
        </div>
        ` : ''}

        <div style="margin: 1.25rem 0; padding: 0.85rem; background: #F8FAFC; border-radius: 6px; font-size: 0.78rem; line-height: 1.45; color: #475569; border: 1px solid #E2E8F0;">
          🎓 <strong>Institutional & Training Partners:</strong> In collaboration with Ontario public and private education organizations — community healthcare and caregiver support training partners.<br>
          🛡️ <strong>Non-Profit Association Disclosure:</strong> The Canadian Association of Family Health Support is an unregistered Canadian non-profit community association. Under the Canada Income Tax Act, contributions to unregistered non-profit associations are not tax-deductible as charitable donations.
        </div>

        <div class="receipt-footer">
          <p>❤️ Thank you for empowering Canadian caregivers and families!</p>
          <small style="color: #15803D; font-weight: 600;">
            ✓ Official receipt dispatched to ${contribution.donor_email} and logged in SQLite registry (ID #${contribution.id}).
          </small>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  printReceipt() {
    window.print();
  }

  processDonationSimulation() {
    this.openContributionCheckoutModal();
  }

  // --- Intake Consultation Form & Email Notification ---
  openIntakeModal(defaultProgram = '') {
    const modal = document.getElementById('intake-modal');
    if (modal) {
      modal.classList.add('active');
      const formZone = document.getElementById('intake-form-fields');
      const confirmZone = document.getElementById('intake-confirmation-content');
      if (formZone) formZone.style.display = 'block';
      if (confirmZone) confirmZone.style.display = 'none';

      if (defaultProgram) {
        const progSelect = document.getElementById('intake-program-select');
        if (progSelect) progSelect.value = defaultProgram;
      }

      // Prefill if user logged in
      const currentUser = window.authService ? window.authService.getCurrentUser() : null;
      if (currentUser) {
        const nameInput = document.getElementById('intake-name');
        const emailInput = document.getElementById('intake-email');
        if (nameInput && !nameInput.value) nameInput.value = currentUser.name;
        if (emailInput && !emailInput.value) emailInput.value = currentUser.email;
      }
    }
  }

  closeIntakeModal() {
    const modal = document.getElementById('intake-modal');
    if (modal) modal.classList.remove('active');
  }

  submitIntakeForm(e) {
    e.preventDefault();
    const isFr = this.currentLanguage === 'fr';
    const name = document.getElementById('intake-name')?.value || 'Valued Family';
    const email = document.getElementById('intake-email')?.value;
    const phone = document.getElementById('intake-phone')?.value || '';
    const prov = document.getElementById('intake-province')?.value || 'ON';
    const need = document.getElementById('intake-program-select')?.value || 'Caregiver Respite & Burnout';
    const notes = document.getElementById('intake-notes')?.value || '';

    // 1. Record in Dynamic Data Store
    const savedIntake = window.contentStore.addIntake({
      name,
      email,
      phone,
      province: prov,
      program: need,
      notes: notes
    });

    // 2. Dispatch Email Notification to User
    window.emailService.sendEmail({
      to: email,
      toName: name,
      subject: `Intake Confirmed: CAFHS Family Health Case #${savedIntake.id}`,
      body: `Dear ${name},

Thank you for reaching out to the Canadian Association of Family Health Support (CAFHS). We have received your request for: "${need}".

Case File: #${savedIntake.id}
Province: ${prov}
Status: Received & Assigned to Regional Navigation Team

A dedicated CAFHS Family Healthcare Navigator will review your file and contact you at ${email} within 24 to 48 hours to assess funded care options and caregiver respite availability.

If your family requires immediate support, free assistance is available 24/7:
- Canada Suicide Crisis Helpline: 9-8-8 (Call/Text)
- Provincial Tele-Health Advice: 8-1-1
- Community Social Services: 2-1-1

Warm regards,
CAFHS Patient & Family Navigation Services
Canadian Non-Profit Community Association`,
      category: 'intake_confirmation'
    });

    // 3. Dispatch Email Alert to Admin
    window.emailService.sendEmail({
      to: 'info@cafhs.org',
      toName: 'CAFHS Intake Coordinator',
      subject: `[ADMIN ALERT] New Intake Submission: ${name} (${prov}) - Case #${savedIntake.id}`,
      body: `A new family health intake has been submitted on the CAFHS portal:

Client Name: ${name}
Email: ${email}
Phone: ${phone || 'Not provided'}
Province: ${prov}
Program: ${need}
Case ID: ${savedIntake.id}
Notes: "${notes || 'No extra notes provided'}"

Please review this file in the CAFHS Admin Portal under "Client Intakes".`,
      category: 'admin_alert'
    });

    // 4. Update UI confirmation display
    const confirmationZone = document.getElementById('intake-confirmation-content');
    const formZone = document.getElementById('intake-form-fields');
    
    if (confirmationZone && formZone) {
      formZone.style.display = 'none';
      confirmationZone.style.display = 'block';
      confirmationZone.innerHTML = `
        <div class="intake-success-card" style="text-align:center; padding: 2rem;">
          <div class="success-icon" style="font-size:3rem; margin-bottom:1rem;">✅</div>
          <h3>${isFr ? "Demande d'admission transmise avec succès !" : "Intake Request Confirmed!"}</h3>
          <p>${isFr 
            ? `Merci <strong>${name}</strong>. Une notification officielle de confirmation a été envoyée par courriel à <strong>${email}</strong>. Un navigateur familial de l'ACSSF communiquera avec vous sous 24 à 48 heures.`
            : `Thank you <strong>${name}</strong>. An official confirmation email has been dispatched to <strong>${email}</strong>. A dedicated CAFHS Family Navigator will contact you within 24 to 48 hours.`}
          </p>
          <div class="intake-summary-box" style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:12px; padding:1.25rem; margin:1.5rem 0; text-align:left;">
            <div><strong>Case File #:</strong> <code>${savedIntake.id}</code></div>
            <div><strong>Province:</strong> ${prov}</div>
            <div><strong>Focus:</strong> ${need}</div>
            <div><strong>Status:</strong> <span class="badge-status status-active">Received & Active</span></div>
          </div>
          <div class="intake-actions" style="display:flex; justify-content:center; gap:1rem;">
            <button class="btn btn-primary" onclick="window.app.downloadCalendarInvite('${name}', '${need}')">
              📅 ${isFr ? "Ajouter au calendrier (.ics)" : "Add Follow-up to Calendar (.ics)"}
            </button>
            <button class="btn btn-outline" onclick="window.app.closeIntakeModal()">
              ${isFr ? "Fermer" : "Close Window"}
            </button>
          </div>
        </div>
      `;
    }
  }

  downloadCalendarInvite(name, need) {
    const icsData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CAFHS//Family Health Support Consultation//EN
BEGIN:VEVENT
SUMMARY:CAFHS Family Health Consultation - ${need}
DESCRIPTION:Confidential consultation with Canadian Association of Family Health Support for ${name}.
DTSTART:${new Date(Date.now() + 86400000 * 2).toISOString().replace(/-|:|\.\d\d\d/g, "").substring(0, 15)}Z
DTEND:${new Date(Date.now() + 86400000 * 2 + 3600000).toISOString().replace(/-|:|\.\d\d\d/g, "").substring(0, 15)}Z
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'CAFHS_Consultation.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // --- Event RSVP & Email Notification ---
  openEventModal(eventIdOrTitle) {
    const events = window.contentStore.getEvents();
    let targetEvent = events.find(e => e.id === eventIdOrTitle || e.title === eventIdOrTitle);
    if (!targetEvent && events.length > 0) targetEvent = events[0];

    this.selectedRsvpEvent = targetEvent;

    const modal = document.getElementById('event-rsvp-modal');
    const titleEl = document.getElementById('event-modal-title');
    if (modal && targetEvent) {
      if (titleEl) titleEl.innerText = `${targetEvent.title} (${targetEvent.date} @ ${targetEvent.time})`;
      
      const currentUser = window.authService ? window.authService.getCurrentUser() : null;
      if (currentUser) {
        const nameInput = document.getElementById('rsvp-name-input');
        const emailInput = document.getElementById('rsvp-email-input');
        if (nameInput) nameInput.value = currentUser.name;
        if (emailInput) emailInput.value = currentUser.email;
      }
      modal.classList.add('active');
    }
  }

  closeEventModal() {
    const modal = document.getElementById('event-rsvp-modal');
    if (modal) modal.classList.remove('active');
  }

  submitEventRSVP(e) {
    e.preventDefault();
    const name = document.getElementById('rsvp-name-input')?.value || 'Community Participant';
    const email = document.getElementById('rsvp-email-input')?.value;
    const evt = this.selectedRsvpEvent;

    if (!email) return;

    if (evt && window.contentStore) {
      window.contentStore.incrementEventRSVP(evt.id);
    }

    // Dispatch Email Notification to registrant
    window.emailService.sendEmail({
      to: email,
      toName: name,
      subject: `RSVP Confirmed: ${evt ? evt.title : 'CAFHS Community Workshop'}`,
      body: `Hello ${name},

Your registration for the upcoming CAFHS workshop is confirmed!

Event: ${evt ? evt.title : 'Family Health Learning Circle'}
Date & Time: ${evt ? `${evt.date} • ${evt.time}` : 'Upcoming Session'}
Format: Virtual Zoom Webinar (Access link will be active 15 minutes before start)
Facilitator: ${evt ? evt.facilitator : 'CAFHS Clinical Specialist'}

Please mark your calendar. We look forward to welcoming you to this safe, supportive community learning space.

Sincerely,
CAFHS Education & Community Outreach
Canadian Non-Profit Community Association`,
      category: 'event_confirmation'
    });

    this.closeEventModal();
  }

  // --- AI Chat Access Control (Gating for Logged In Users) ---
  openChat() {
    // Auth Check: Chatbot is accessible after user logs in
    if (!window.authService || !window.authService.isLoggedIn()) {
      this.openAuthGateModal();
      return;
    }

    const drawer = document.getElementById('ai-chat-drawer');
    if (drawer) {
      drawer.classList.add('open');
      if (window.chatEngine) window.chatEngine.renderMessages();
      const input = document.getElementById('chat-input-text');
      if (input) setTimeout(() => input.focus(), 300);
    }
  }

  closeChat() {
    const drawer = document.getElementById('ai-chat-drawer');
    if (drawer) drawer.classList.remove('open');
  }

  toggleChat() {
    const drawer = document.getElementById('ai-chat-drawer');
    if (drawer && drawer.classList.contains('open')) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }

  triggerProgramAIChat(programTitle) {
    if (!window.authService || !window.authService.isLoggedIn()) {
      this.openAuthGateModal();
      return;
    }
    this.openChat();
    if (window.chatEngine) {
      window.chatEngine.sendMessage(`Tell me about your ${programTitle} and how my family can access funding and support in Canada.`);
    }
  }

  openAuthGateModal() {
    const modal = document.getElementById('auth-gate-modal');
    if (modal) modal.classList.add('active');
  }

  closeAuthGateModal() {
    const modal = document.getElementById('auth-gate-modal');
    if (modal) modal.classList.remove('active');
  }

  // --- User Health Portal Modal ---
  openUserPortalModal() {
    if (!window.authService || !window.authService.isLoggedIn()) {
      window.authService.openAuthModal();
      return;
    }

    const modal = document.getElementById('user-portal-modal');
    const container = document.getElementById('user-portal-content');
    if (!modal || !container) return;

    const user = window.authService.getCurrentUser();
    const intakes = window.contentStore.getIntakes().filter(i => i.email.toLowerCase() === user.email.toLowerCase());
    const emails = window.emailService.getEmails().filter(e => e.to.toLowerCase() === user.email.toLowerCase());

    container.innerHTML = `
      <div class="user-portal-dashboard">
        <div class="user-portal-header" style="display:flex; align-items:center; gap:1.25rem; border-bottom:1px solid var(--border-color); padding-bottom:1.5rem; margin-bottom:1.5rem;">
          <div class="avatar-lg" style="width:60px; height:60px; border-radius:50%; background:var(--primary-light); display:flex; align-items:center; justify-content:center; font-size:2rem;">
            ${user.avatar || '🌸'}
          </div>
          <div>
            <h3 style="margin:0;">${user.name}</h3>
            <p style="margin:0; font-size:0.9rem; color:var(--text-muted);">${user.email} • 📍 ${user.province} • <span class="role-badge ${user.role}">${user.role === 'admin' ? 'Administrator' : 'Verified Member'}</span></p>
          </div>
        </div>

        <div class="portal-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem;">
          <div class="portal-col">
            <h5>📋 My Submitted Health Intake Files (${intakes.length})</h5>
            ${intakes.length === 0 ? `<p style="font-size:0.88rem; color:var(--text-subtle);">No active intake applications yet.</p>` : `
              <div class="portal-list">
                ${intakes.map(intk => `
                  <div class="portal-card-item" style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:0.9rem; margin-bottom:0.75rem;">
                    <div style="display:flex; justify-content:space-between;">
                      <strong>${intk.program}</strong>
                      <span class="badge-status status-${intk.status.toLowerCase().replace(' ', '-')}">${intk.status}</span>
                    </div>
                    <small style="color:var(--text-subtle);">Case #${intk.id} • Submitted ${new Date(intk.submittedAt).toLocaleDateString()}</small>
                  </div>
                `).join('')}
              </div>
            `}
            <button class="btn btn-outline btn-sm" onclick="window.app.closeUserPortalModal(); window.app.openIntakeModal();" style="margin-top:0.5rem;">+ Submit New Support Request</button>
          </div>

          <div class="portal-col">
            <h5>📧 My Received Email Notifications (${emails.length})</h5>
            ${emails.length === 0 ? `<p style="font-size:0.88rem; color:var(--text-subtle);">No emails received yet.</p>` : `
              <div class="portal-list">
                ${emails.map(eml => `
                  <div class="portal-card-item" style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:0.9rem; margin-bottom:0.75rem; cursor:pointer;" onclick="window.app.closeUserPortalModal(); window.emailService.openNotificationModal('${eml.id}');">
                    <div style="font-weight:600; font-size:0.88rem; color:var(--primary-deep);">${eml.subject}</div>
                    <small style="color:var(--text-subtle);">${new Date(eml.timestamp).toLocaleDateString()} • From: ${eml.fromName}</small>
                  </div>
                `).join('')}
              </div>
            `}
            <button class="btn btn-outline btn-sm" onclick="window.app.closeUserPortalModal(); window.emailService.openNotificationModal();" style="margin-top:0.5rem;">View Full Notification Inbox</button>
          </div>
        </div>

        <div style="margin-top:2rem; padding:1.25rem; background:var(--primary-light); border-radius:12px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h5 style="margin:0; color:var(--primary-deep);">🤖 Nova AI Health Companion</h5>
            <p style="margin:0; font-size:0.85rem; color:var(--text-muted);">24/7 Canadian Health Guidance powered by ChatGPT is active for your account.</p>
          </div>
          <button class="btn btn-primary" onclick="window.app.closeUserPortalModal(); window.app.openChat();">Launch AI Chat</button>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  closeUserPortalModal() {
    const modal = document.getElementById('user-portal-modal');
    if (modal) modal.classList.remove('active');
  }

  updateUserPortalIfOpen() {
    const modal = document.getElementById('user-portal-modal');
    if (modal && modal.classList.contains('active')) {
      this.openUserPortalModal();
    }
  }

  // --- AI Settings Modal ---
  openSettingsModal() {
    const modal = document.getElementById('ai-settings-modal');
    if (modal) {
      const provInput = document.getElementById('settings-provider-select');
      const modelInput = document.getElementById('settings-model-select');
      const keyInput = document.getElementById('settings-apikey-input');
      const testStatus = document.getElementById('api-test-status');

      if (provInput) provInput.value = window.chatEngine.apiKeyConfig.provider || 'openai';
      if (modelInput) modelInput.value = window.chatEngine.apiKeyConfig.model || 'gpt-4o-mini';
      if (keyInput) keyInput.value = window.chatEngine.apiKeyConfig.apiKey || '';
      if (testStatus) {
        testStatus.innerHTML = window.chatEngine.apiKeyConfig.apiKey 
          ? `<span style="color:#166534; font-weight:600;">● Active (${window.chatEngine.apiKeyConfig.model || 'gpt-4o-mini'})</span>`
          : 'No API key configured yet';
      }

      this.onProviderChange(provInput ? provInput.value : 'openai');
      modal.classList.add('active');
    }
  }

  closeSettingsModal() {
    const modal = document.getElementById('ai-settings-modal');
    if (modal) modal.classList.remove('active');
  }

  toggleKeyVisibility() {
    const input = document.getElementById('settings-apikey-input');
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  }

  onProviderChange(provider) {
    const modelGroup = document.getElementById('settings-model-group');
    if (modelGroup) {
      modelGroup.style.display = provider === 'openai' ? 'block' : 'none';
    }
  }

  async testAISettings() {
    const apiKey = document.getElementById('settings-apikey-input')?.value.trim() || '';
    const model = document.getElementById('settings-model-select')?.value || 'gpt-4o-mini';
    const statusEl = document.getElementById('api-test-status');
    const testBtn = document.getElementById('btn-test-ai-key');

    if (!apiKey) {
      if (statusEl) statusEl.innerHTML = '<span style="color:#DC2626; font-weight:600;">❌ Please enter an API key first</span>';
      return;
    }

    if (testBtn) {
      testBtn.disabled = true;
      testBtn.innerText = 'Testing...';
    }
    if (statusEl) {
      statusEl.innerHTML = '<span style="color:#475569;">⏳ Testing connection to OpenAI...</span>';
    }

    const res = await window.chatEngine.testApiKey(apiKey, model);

    if (testBtn) {
      testBtn.disabled = false;
      testBtn.innerText = '🧪 Test Connection';
    }

    if (statusEl) {
      if (res.success) {
        statusEl.innerHTML = `<span style="color:#166534; font-weight:700;">✅ ${res.message}</span>`;
      } else {
        statusEl.innerHTML = `<span style="color:#DC2626; font-weight:600;" title="${res.error}">❌ Error: ${res.error.substring(0, 50)}...</span>`;
      }
    }
  }

  saveAISettings(e) {
    e.preventDefault();
    const provider = document.getElementById('settings-provider-select')?.value || 'openai';
    const model = document.getElementById('settings-model-select')?.value || 'gpt-4o-mini';
    const apiKey = document.getElementById('settings-apikey-input')?.value.trim() || '';
    
    window.chatEngine.apiKeyConfig.provider = provider;
    window.chatEngine.apiKeyConfig.apiKey = apiKey;
    window.chatEngine.apiKeyConfig.model = model;

    localStorage.setItem('cafhs_ai_provider', provider);
    localStorage.setItem('cafhs_ai_key', apiKey);
    localStorage.setItem('cafhs_ai_model', model);

    window.chatEngine.syncChatHeaderStatus();
    window.chatEngine.renderMessages();
    
    this.closeSettingsModal();
    window.emailService.showToast({
      title: 'AI Configuration Saved',
      message: apiKey 
        ? `Model configured to <strong>${model}</strong>.` 
        : `Provider set to <strong>${provider}</strong>.`,
      type: 'success'
    });
  }

  toggleHighContrast() {
    document.body.classList.toggle('high-contrast');
  }

  toggleMobileNav() {
    const nav = document.getElementById('nav-links');
    if (nav) nav.classList.toggle('mobile-open');
  }

  toggleUserDropdown() {
    const menu = document.getElementById('user-dropdown-menu');
    const btn = document.getElementById('user-dropdown-btn');
    if (menu) {
      const isOpen = menu.classList.toggle('show');
      if (btn) btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }
  }

  closeUserDropdown() {
    const menu = document.getElementById('user-dropdown-menu');
    const btn = document.getElementById('user-dropdown-btn');
    if (menu) {
      menu.classList.remove('show');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }
  }

  initEventListeners() {
    // Close user dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const container = document.getElementById('nav-user-actions');
      if (container && !container.contains(e.target)) {
        this.closeUserDropdown();
      }
    });

    const searchInput = document.getElementById('dir-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value;
        this.renderDirectory();
      });
    }

    const provSelect = document.getElementById('dir-province-select');
    if (provSelect) {
      provSelect.addEventListener('change', (e) => {
        this.selectedProvince = e.target.value;
        this.renderDirectory();
      });
    }

    const catSelect = document.getElementById('dir-category-select');
    if (catSelect) {
      catSelect.addEventListener('change', (e) => {
        this.selectedCategory = e.target.value;
        this.renderDirectory();
      });
    }

    const chatForm = document.getElementById('chat-input-form');
    if (chatForm) {
      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('chat-input-text');
        if (input && input.value.trim()) {
          const val = input.value;
          input.value = '';
          window.chatEngine.sendMessage(val);
        }
      });
    }
  }

  setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#' || !href) return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
          const nav = document.getElementById('nav-links');
          if (nav) nav.classList.remove('mobile-open');
        }
      });
    });
  }
}

// Global initialization on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new CAFHSApp();
});
