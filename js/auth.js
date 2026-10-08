/**
 * Canadian Association of Family Health Support (CAFHS)
 * User & Administrator Authentication & Role-Based Access Control
 * Supports Local Auth, Social Sign-In (Google & LinkedIn), and Administrator Roles
 */

class AuthService {
  constructor() {
    this.STORAGE_KEYS = {
      USERS: 'cafhs_registered_users',
      SESSION: 'cafhs_active_session'
    };

    this.initDefaultUsers();
    this.currentUser = this.loadSession();
  }

  initDefaultUsers() {
    let users = [];
    try {
      users = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.USERS)) || [];
    } catch {
      users = [];
    }

    const defaultAdminsAndUsers = [
      {
        id: 'usr-admin-mack',
        name: 'Mack Chen',
        email: 'mack.chen@viccollege.com',
        password: 'admin',
        role: 'admin',
        province: 'ON',
        title: 'Executive Administrator & Lead Coordinator',
        avatar: '🍁'
      },
      {
        id: 'usr-admin-1',
        name: 'Dr. Marc Tremblay, MSW',
        email: 'admin@cafhs.ca',
        password: 'admin',
        role: 'admin',
        province: 'QC',
        title: 'Clinical Director & Lead Navigator',
        avatar: '🍁'
      },
      {
        id: 'usr-sarah-2',
        name: 'Sarah Chen',
        email: 'sarah.chen@example.ca',
        password: 'user',
        role: 'user',
        province: 'ON',
        title: 'Family Caregiver Member',
        avatar: '🌸'
      }
    ];

    // Ensure all default users (especially mack.chen@viccollege.com as Admin) exist in the user store
    defaultAdminsAndUsers.forEach(defaultUser => {
      const existingIdx = users.findIndex(u => u.email.toLowerCase() === defaultUser.email.toLowerCase());
      if (existingIdx === -1) {
        users.unshift(defaultUser);
      } else {
        // Ensure role is preserved as admin if defined as admin
        if (defaultUser.role === 'admin') {
          users[existingIdx].role = 'admin';
        }
      }
    });

    localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  getUsers() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.USERS)) || [];
    } catch {
      return [];
    }
  }

  loadSession() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SESSION)) || null;
    } catch {
      return null;
    }
  }

  isLoggedIn() {
    return this.currentUser !== null;
  }

  isAdmin() {
    return this.currentUser !== null && this.currentUser.role === 'admin';
  }

  getCurrentUser() {
    return this.currentUser;
  }

  login(email, password) {
    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    
    if (!user || user.password !== password) {
      throw new Error('Invalid email or password. You can use the Quick Login buttons or social login below.');
    }

    this.currentUser = { ...user };
    localStorage.setItem(this.STORAGE_KEYS.SESSION, JSON.stringify(this.currentUser));
    this.syncUI();
    this.syncUserToBackend(this.currentUser);

    // Trigger toast notification
    window.emailService.showToast({
      title: '🍁 Welcome Back!',
      message: `Signed in as <strong>${this.currentUser.name}</strong> (${this.currentUser.role === 'admin' ? 'Administrator' : 'Member'})`,
      type: 'info'
    });

    window.dispatchEvent(new CustomEvent('cafhs:auth-changed', { detail: this.currentUser }));
    return this.currentUser;
  }

  register({ name, email, password, province, role = 'user' }) {
    const users = this.getUsers();
    const cleanEmail = email.trim().toLowerCase();
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('An account with this email address already exists. Please sign in.');
    }

    // Auto-grant admin role if specific admin email
    const assignedRole = (cleanEmail === 'mack.chen@viccollege.com' || cleanEmail === 'admin@cafhs.ca') ? 'admin' : (role || 'user');

    const newUser = {
      id: 'usr-' + Date.now(),
      name,
      email: email.trim(),
      password,
      province: province || 'ON',
      role: assignedRole,
      title: assignedRole === 'admin' ? 'Administrator' : 'Community Member',
      avatar: assignedRole === 'admin' ? '🍁' : '🌸'
    };

    users.push(newUser);
    localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(users));

    this.currentUser = { ...newUser };
    localStorage.setItem(this.STORAGE_KEYS.SESSION, JSON.stringify(this.currentUser));
    this.syncUI();
    this.syncUserToBackend(this.currentUser);

    // Send welcome email notification
    window.emailService.sendEmail({
      to: newUser.email,
      toName: newUser.name,
      subject: 'Welcome to Canadian Association of Family Health Support (CAFHS)',
      body: `Hello ${newUser.name},

Welcome to the CAFHS family health community. Your account has been successfully created.

As a registered member, you now have access to:
- Nova AI Health Companion powered by ChatGPT
- Confidential Family Healthcare Navigators
- Provincial Caregiver Respite & Postpartum Navigation
- Provincial Healthcare Directory & Screeners

If you ever need urgent support, remember:
Canada Suicide Crisis Helpline: 9-8-8 (Call/Text 24/7)
Provincial Tele-Health: 8-1-1

In health and solidarity,
The CAFHS Team`,
      category: 'welcome'
    });

    window.dispatchEvent(new CustomEvent('cafhs:auth-changed', { detail: this.currentUser }));
    return newUser;
  }

  // --- Social Logins (Google & LinkedIn) ---
  loginWithGoogle() {
    const modal = document.getElementById('social-google-modal');
    if (modal) {
      modal.classList.add('active');
    }
  }

  loginWithLinkedIn() {
    const modal = document.getElementById('social-linkedin-modal');
    if (modal) {
      modal.classList.add('active');
    }
  }

  completeSocialLogin(provider, email, name, customRole = null) {
    const cleanEmail = email.toLowerCase().trim();
    const users = this.getUsers();
    let user = users.find(u => u.email.toLowerCase() === cleanEmail);

    const isAdminEmail = cleanEmail === 'mack.chen@viccollege.com' || cleanEmail === 'admin@cafhs.ca';
    const role = customRole || (isAdminEmail ? 'admin' : (user ? user.role : 'user'));

    if (!user) {
      user = {
        id: `usr-${provider}-${Date.now()}`,
        name: name,
        email: cleanEmail,
        password: `oauth-${provider}`,
        role: role,
        provider: provider,
        province: 'ON',
        title: role === 'admin' ? 'Executive Administrator' : `${provider.toUpperCase()} Verified Member`,
        avatar: provider === 'google' ? '🌐' : '💼'
      };
      users.push(user);
      localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(users));
    } else {
      user.name = name;
      if (isAdminEmail) user.role = 'admin';
      user.provider = provider;
      localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(users));
    }

    this.currentUser = { ...user };
    localStorage.setItem(this.STORAGE_KEYS.SESSION, JSON.stringify(this.currentUser));
    this.syncUI();
    this.syncUserToBackend(this.currentUser);

    // Close all auth & social modals
    this.closeAuthModal();
    const gModal = document.getElementById('social-google-modal');
    const lModal = document.getElementById('social-linkedin-modal');
    const gateModal = document.getElementById('auth-gate-modal');
    if (gModal) gModal.classList.remove('active');
    if (lModal) lModal.classList.remove('active');
    if (gateModal) gateModal.classList.remove('active');

    window.emailService.showToast({
      title: `🍁 Connected via ${provider === 'google' ? 'Google' : 'LinkedIn'}`,
      message: `Signed in as <strong>${this.currentUser.name}</strong> (${this.currentUser.role === 'admin' ? 'Administrator' : 'Member'})`,
      type: 'success'
    });

    window.dispatchEvent(new CustomEvent('cafhs:auth-changed', { detail: this.currentUser }));
    return this.currentUser;
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem(this.STORAGE_KEYS.SESSION);
    this.syncUI();

    // If chat drawer was open, close it
    if (window.app && window.app.closeChat) {
      window.app.closeChat();
    }

    // If admin portal was open, close it
    if (window.adminPortal && window.adminPortal.close) {
      window.adminPortal.close();
    }

    window.emailService.showToast({
      title: 'Signed Out',
      message: 'You have been safely signed out of your CAFHS session.',
      type: 'info'
    });

    window.dispatchEvent(new CustomEvent('cafhs:auth-changed', { detail: null }));
  }

  quickLogin(target) {
    if (target === 'mack') {
      this.login('mack.chen@viccollege.com', 'admin');
    } else if (target === 'admin') {
      this.login('admin@cafhs.ca', 'admin');
    } else {
      this.login('sarah.chen@example.ca', 'user');
    }
    this.closeAuthModal();
    const gateModal = document.getElementById('auth-gate-modal');
    if (gateModal) gateModal.classList.remove('active');
  }

  openAuthModal(initialTab = 'signin') {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;

    this.switchAuthTab(initialTab);
    modal.classList.add('active');
  }

  closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.remove('active');
  }

  switchAuthTab(tab) {
    const signinForm = document.getElementById('auth-signin-form');
    const signupForm = document.getElementById('auth-signup-form');
    const tabSignin = document.getElementById('tab-auth-signin');
    const tabSignup = document.getElementById('tab-auth-signup');

    if (tab === 'signup') {
      if (signinForm) signinForm.style.display = 'none';
      if (signupForm) signupForm.style.display = 'block';
      if (tabSignin) tabSignin.classList.remove('active');
      if (tabSignup) tabSignup.classList.add('active');
    } else {
      if (signinForm) signinForm.style.display = 'block';
      if (signupForm) signupForm.style.display = 'none';
      if (tabSignin) tabSignin.classList.add('active');
      if (tabSignup) tabSignup.classList.remove('active');
    }
  }

  syncUI() {
    const guestNav = document.getElementById('nav-guest-actions');
    const userNav = document.getElementById('nav-user-actions');
    const userNameEl = document.getElementById('nav-user-name');
    const userRoleEl = document.getElementById('nav-user-role');
    const userAvatarEl = document.getElementById('nav-user-avatar');
    const adminLink = document.getElementById('nav-admin-link');
    const chatLockBadge = document.getElementById('chat-lock-badge');

    const dropNameEl = document.getElementById('dropdown-user-name');
    const dropEmailEl = document.getElementById('dropdown-user-email');
    const dropRoleEl = document.getElementById('dropdown-user-role');
    const dropAvatarEl = document.getElementById('dropdown-user-avatar');

    if (this.currentUser) {
      if (guestNav) guestNav.style.display = 'none';
      if (userNav) userNav.style.display = 'inline-block';
      if (userNameEl) userNameEl.innerText = this.currentUser.name;
      if (userRoleEl) {
        userRoleEl.innerText = this.currentUser.role === 'admin' ? '🍁 Admin' : '👤 Member';
        userRoleEl.className = `role-badge ${this.currentUser.role}`;
      }
      if (userAvatarEl) userAvatarEl.innerText = this.currentUser.avatar || '🍁';

      if (dropNameEl) dropNameEl.innerText = this.currentUser.name;
      if (dropEmailEl) dropEmailEl.innerText = this.currentUser.email;
      if (dropRoleEl) {
        dropRoleEl.innerText = this.currentUser.role === 'admin' ? '🍁 Administrator' : '👤 Community Member';
        dropRoleEl.className = `role-badge ${this.currentUser.role}`;
      }
      if (dropAvatarEl) dropAvatarEl.innerText = this.currentUser.avatar || '🍁';

      if (adminLink) {
        adminLink.style.display = this.currentUser.role === 'admin' ? 'flex' : 'none';
      }
      if (chatLockBadge) chatLockBadge.style.display = 'none';
    } else {
      if (guestNav) guestNav.style.display = 'flex';
      if (userNav) userNav.style.display = 'none';
      if (adminLink) adminLink.style.display = 'none';
      if (chatLockBadge) chatLockBadge.style.display = 'flex';
      if (window.app && window.app.closeUserDropdown) {
        window.app.closeUserDropdown();
      }
    }
  }

  async syncUserToBackend(user) {
    if (!user) return;
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          provider: user.provider || 'local',
          province: user.province || 'ON',
          title: user.title || (user.role === 'admin' ? 'Executive Administrator' : 'Community Member')
        })
      });
    } catch (err) {
      console.warn('Backend SQLite user sync notice:', err);
    }
  }
}

window.authService = new AuthService();
