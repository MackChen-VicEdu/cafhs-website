/**
 * Canadian Association of Family Health Support (CAFHS)
 * Email Notification Engine & In-App Notification Center
 * Handles simulated email dispatches, audit logs, and interactive toasts
 */

class EmailNotificationService {
  constructor() {
    this.STORAGE_KEY = 'cafhs_email_notifications';
    this.initDefaultNotifications();
  }

  initDefaultNotifications() {
    if (!localStorage.getItem(this.STORAGE_KEY)) {
      const defaultEmails = [
        {
          id: 'eml-101',
          to: 'sarah.chen@example.ca',
          toName: 'Sarah Chen',
          from: 'intake@cafhs.org',
          fromName: 'CAFHS Family Navigation Team',
          subject: 'Intake Confirmed: Caregiver Respite Relief Case #INT-94281',
          body: `Dear Sarah,

Thank you for contacting the Canadian Association of Family Health Support (CAFHS). We have received your request for Caregiver Respite Relief Navigation regarding your mother in Ontario.

A registered Family Healthcare Navigator has been assigned to your case (Dr. Marc Tremblay, MSW). You will receive an exploratory follow-up within 24 to 48 hours to assess eligibility for in-home funded respite hours and provincial health card benefits.

If your situation requires immediate tele-health triage before our call, please dial 8-1-1 anytime (free & confidential across Canada).

Warm regards,
CAFHS Patient & Family Care Coordination
Canadian Non-Profit Community Association
Toll-Free Support: 1-800-555-CAFHS (2234)`,
          category: 'intake_confirmation',
          timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
          read: true
        },
        {
          id: 'eml-102',
          to: 'sarah.chen@example.ca',
          toName: 'Sarah Chen',
          from: 'events@cafhs.org',
          fromName: 'CAFHS Community Workshops',
          subject: 'RSVP Confirmed: Family Caregiver Burnout & Respite Strategy (Oct 22)',
          body: `Hi Sarah,

Your registration for the upcoming workshop "Family Caregiver Burnout: Boundary Setting & Respite Strategy" is confirmed!

🗓️ Date: Thursday, October 22, 2026
⏰ Time: 1:00 PM - 2:30 PM EDT
📍 Format: Interactive Zoom Webinar
Facilitator: Dr. Marc Tremblay, Registered Clinical Social Worker

Please find your calendar link attached. Prior to the session, we invite you to complete the free 2-minute Caregiver Strain Screener available on our portal.

Sincerely,
CAFHS Community Education Hub`,
          category: 'event_confirmation',
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          read: false
        }
      ];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(defaultEmails));
    }
  }

  getEmails() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  getUnreadCount() {
    const emails = this.getEmails();
    return emails.filter(e => !e.read).length;
  }

  markAllAsRead() {
    const emails = this.getEmails().map(e => ({ ...e, read: true }));
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(emails));
    this.updateBadge();
  }

  sendEmail({ to, toName, subject, body, category = 'general', sendAdminCopy = true }) {
    const emailRecord = {
      id: 'eml-' + Date.now(),
      to: to || 'community@cafhs.org',
      toName: toName || 'Valued Community Member',
      from: 'info@cafhs.org',
      fromName: 'CAFHS Canada Health Network',
      subject: subject || 'Notice from CAFHS',
      body: body || '',
      category: category,
      timestamp: new Date().toISOString(),
      read: false
    };

    const emails = this.getEmails();
    emails.unshift(emailRecord);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(emails));

    // Show on-screen toast
    this.showToast({
      title: '📧 Email Notification Sent',
      message: `Delivered to <strong>${emailRecord.to}</strong>: "${emailRecord.subject}"`,
      type: 'success'
    });

    // Asynchronously dispatch through backend SMTP gateway if configured
    fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: emailRecord.to,
        toName: emailRecord.toName,
        from: emailRecord.from,
        subject: emailRecord.subject,
        body: emailRecord.body
      })
    }).catch(err => console.debug('Outbound email gateway note:', err));

    this.updateBadge();
    window.dispatchEvent(new CustomEvent('cafhs:email-sent', { detail: emailRecord }));
    return emailRecord;
  }

  showToast({ title, message, type = 'info', duration = 5000 }) {
    let toastContainer = document.getElementById('cafhs-toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'cafhs-toast-container';
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `cafhs-toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon">🍁</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button type="button" class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-fade-out');
      setTimeout(() => toast.remove(), 400);
    }, duration);
  }

  updateBadge() {
    const count = this.getUnreadCount();
    const badge = document.getElementById('notif-unread-badge');
    if (badge) {
      badge.innerText = count;
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
  }

  openNotificationModal(selectedEmailId = null) {
    const modal = document.getElementById('email-notification-modal');
    if (!modal) return;

    this.renderEmailInbox(selectedEmailId);
    modal.classList.add('active');
  }

  closeNotificationModal() {
    const modal = document.getElementById('email-notification-modal');
    if (modal) modal.classList.remove('active');
  }

  renderEmailInbox(selectedId = null) {
    const listContainer = document.getElementById('email-list-container');
    const previewContainer = document.getElementById('email-detail-container');
    if (!listContainer || !previewContainer) return;

    const emails = this.getEmails();

    if (emails.length === 0) {
      listContainer.innerHTML = `<div class="email-empty">No email notifications on record.</div>`;
      previewContainer.innerHTML = `<div class="email-preview-placeholder">Select an email to view full message.</div>`;
      return;
    }

    const currentSelectedId = selectedId || emails[0].id;

    listContainer.innerHTML = emails.map(eml => {
      const dateStr = new Date(eml.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      return `
        <div class="email-list-item ${eml.id === currentSelectedId ? 'active' : ''} ${!eml.read ? 'unread' : ''}" onclick="window.emailService.selectEmail('${eml.id}')">
          <div class="email-item-header">
            <span class="email-item-sender">${eml.fromName}</span>
            <span class="email-item-date">${dateStr}</span>
          </div>
          <div class="email-item-subj">${eml.subject}</div>
          <div class="email-item-snippet">${eml.body.substring(0, 75)}...</div>
        </div>
      `;
    }).join('');

    const targetEmail = emails.find(e => e.id === currentSelectedId) || emails[0];
    this.displayEmailPreview(targetEmail);
  }

  selectEmail(id) {
    const emails = this.getEmails();
    const eml = emails.find(e => e.id === id);
    if (eml) {
      eml.read = true;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(emails));
      this.updateBadge();
      this.renderEmailInbox(id);
    }
  }

  displayEmailPreview(email) {
    const previewContainer = document.getElementById('email-detail-container');
    if (!previewContainer || !email) return;

    const dateStr = new Date(email.timestamp).toLocaleString();
    previewContainer.innerHTML = `
      <div class="email-viewer-card">
        <div class="email-header-top">
          <div class="email-branding">
            <img src="assets/images/cafhs-logo.jpg" alt="CAFHS Logo" class="email-logo-thumb">
            <div>
              <div class="email-brand-title">Canadian Association of Family Health Support</div>
              <div class="email-brand-sub">Canadian Non-Profit Community Association • Official Dispatch</div>
            </div>
          </div>
          <span class="email-badge-status">Delivered</span>
        </div>

        <div class="email-meta-table">
          <div class="meta-row"><strong>To:</strong> ${email.toName} &lt;${email.to}&gt;</div>
          <div class="meta-row"><strong>From:</strong> ${email.fromName} &lt;${email.from}&gt;</div>
          <div class="meta-row"><strong>Date:</strong> ${dateStr}</div>
          <div class="meta-row"><strong>Subject:</strong> <span class="subject-bold">${email.subject}</span></div>
        </div>

        <div class="email-body-content">
          ${email.body.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>')}
        </div>

        <div class="email-footer-legal">
          <p>🍁 <strong>Canadian Crisis & Navigation Helplines:</strong><br>
          Canada Suicide Crisis Helpline: <strong>9-8-8</strong> | Provincial Tele-Health: <strong>8-1-1</strong> | Community Resources: <strong>2-1-1</strong></p>
          <p style="margin-top:0.5rem; font-size:11px; color:#888;">You received this automated notification as part of your healthcare support file with CAFHS. Safeguarding your family's health privacy is our utmost priority under PIPEDA and provincial health information acts.</p>
        </div>
      </div>
    `;
  }
}

window.emailService = new EmailNotificationService();
