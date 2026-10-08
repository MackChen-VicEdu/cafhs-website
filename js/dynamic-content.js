/**
 * Canadian Association of Family Health Support (CAFHS)
 * Dynamic Content Management & Data Store
 * Provides reactive persistence for Articles, Programs, Events, Intakes, and Emails
 */

class DynamicContentStore {
  constructor() {
    this.STORAGE_KEYS = {
      ARTICLES: 'cafhs_dynamic_articles',
      PROGRAMS: 'cafhs_dynamic_programs',
      EVENTS: 'cafhs_dynamic_events',
      INTAKES: 'cafhs_client_intakes',
      EMAILS: 'cafhs_email_notifications'
    };

    this.initDefaultData();
  }

  initDefaultData() {
    // Check schema version to force upgrade if old subsidy wording was stored
    const CURRENT_VERSION = 'cafhs_v3_no_direct_subsidies';
    const needsRefresh = localStorage.getItem('cafhs_content_version') !== CURRENT_VERSION;
    if (needsRefresh) {
      localStorage.removeItem(this.STORAGE_KEYS.ARTICLES);
      localStorage.removeItem(this.STORAGE_KEYS.PROGRAMS);
      localStorage.removeItem(this.STORAGE_KEYS.EVENTS);
      localStorage.setItem('cafhs_content_version', CURRENT_VERSION);
    }

    // Seed default articles if not present
    if (!localStorage.getItem(this.STORAGE_KEYS.ARTICLES)) {
      const defaultArticles = [
        {
          id: 'art-1',
          title: 'Understanding the 9-8-8 Suicide Crisis Helpline Across Canada',
          titleFr: 'Comprendre la ligne d\'aide en cas de crise de suicide 9-8-8 au Canada',
          category: 'Crisis & Mental Health',
          categoryFr: 'Crise et santé mentale',
          author: 'Dr. Marc Tremblay, MSW',
          date: '2026-09-28',
          readTime: '4 min read',
          excerpt: 'Canada\'s nationwide 9-8-8 helpline provides free, confidential 24/7 bilingual support by phone and text. Here is how it works and what to expect when you connect.',
          excerptFr: 'La ligne 9-8-8 pancanadienne offre un soutien bilingue gratuit, confidentiel 24/7 par appel et texto. Découvrez son fonctionnement.',
          content: 'The 9-8-8 Suicide Crisis Helpline is a vital Canadian lifeline accessible in English and French. When you reach out, you are connected to a trained responder who listens without judgment and provides compassionate de-escalation, safety planning, and local referral resources.',
          image: 'assets/images/youth-wellness.jpg',
          published: true,
          views: 1420
        },
        {
          id: 'art-2',
          title: 'Navigating Canada Caregiver Tax Credits & Provincial Respite Programs',
          titleFr: 'Naviguer les crédits d\'impôt canadiens pour aidants et programmes provinciaux de répit',
          category: 'Caregiver Support',
          categoryFr: 'Soutien aux proches aidants',
          author: 'Sarah Lin, Clinical Care Coordinator',
          date: '2026-09-15',
          readTime: '6 min read',
          excerpt: 'Family caregivers spend an average of 22 hours weekly supporting loved ones. Learn how to claim non-refundable tax credits and access provincial in-home relief hours.',
          excerptFr: 'Les proches aidants consacrent 22h par semaine à leurs proches. Apprenez à réclamer vos crédits fiscaux et à accéder aux heures de répit provinciales.',
          content: 'Through CRA programs and provincial caregiver associations such as the Ontario Caregiver Organization and L\'Appui in Quebec, eligible families can unlock essential relief. CAFHS family navigators assist families with guidance through public applications (CAFHS facilitates navigation and does not provide direct financial subsidies).',
          image: 'assets/images/caregiver-support.jpg',
          published: true,
          views: 2150
        },
        {
          id: 'art-3',
          title: 'Postpartum Emotional Recovery: The 4th Trimester Survival Guide',
          titleFr: 'Rétablissement émotionnel post-partum : Guide de survie du 4e trimestre',
          category: 'Maternal & Newborn',
          categoryFr: 'Maternité et nouveau-né',
          author: 'Émilie Bouchard, Perinatal Nurse',
          date: '2026-08-30',
          readTime: '5 min read',
          excerpt: 'Over 20% of new Canadian mothers experience postpartum anxiety or depression. Discover compassionate coping strategies and free peer doula mentorship.',
          excerptFr: 'Plus de 20% des nouvelles mamans vivent de l\'anxiété ou de la dépression post-partum. Découvrez nos stratégies et le parrainage doula.',
          content: 'The postpartum transition brings intense hormonal shifts and sleep deprivation. CAFHS connects new parents with volunteer peer doula mentorship, free support groups, and navigation toward hospital perinatal psychotherapy.',
          image: 'assets/images/maternal-care.jpg',
          published: true,
          views: 1890
        }
      ];
      localStorage.setItem(this.STORAGE_KEYS.ARTICLES, JSON.stringify(defaultArticles));
    }

    // Seed default programs if not present
    if (!localStorage.getItem(this.STORAGE_KEYS.PROGRAMS)) {
      const defaultPrograms = [
        {
          id: 'prog-1',
          title: 'Perinatal & Maternal Well-being Pathway',
          titleFr: 'Parcours Bien-être Périnatale et Maternelle',
          category: 'Maternal Care',
          icon: '🌸',
          province: 'National',
          audience: 'New & Expecting Parents',
          description: 'Comprehensive family navigation offering postpartum mental health screenings, free volunteer peer doula matching, and clinical lactation navigation across Canada (CAFHS provides navigation; does not provide direct subsidies).',
          descriptionFr: 'Accompagnement périnatal complet : dépistage post-partum, jumelage de doulas bénévoles et orientation vers les services cliniques (l\'ACSSF offre un accompagnement à la navigation et ne verse pas de subventions directes).',
          activeEnrollees: 342,
          isAccepting: true
        },
        {
          id: 'prog-2',
          title: 'Family Caregiver Respite & Relief Navigation',
          titleFr: 'Navigation Répit et Soutien aux Proches Aidants',
          category: 'Caregiver Respite',
          icon: '🌿',
          province: 'National',
          audience: 'Eldercare & Complex Needs Caregivers',
          description: 'Personalized 1-on-1 navigation assisting family caregivers to access and apply for provincial public respite hours, caregiver tax credits, and community relief services to prevent burnout (CAFHS facilitates program navigation and does not provide direct subsidies).',
          descriptionFr: 'Accompagnement personnalisé pour aider les proches aidants à accéder aux heures de répit financées par les programmes provinciaux et aux crédits d\'impôt (l\'ACSSF offre une aide à la navigation et ne verse pas de subventions directes).',
          activeEnrollees: 518,
          isAccepting: true
        },
        {
          id: 'prog-3',
          title: 'Youth & Teen Emotional Resilience Circles',
          titleFr: 'Cercles de Résilience Émotionnelle Jeunesse',
          category: 'Youth Mental Health',
          icon: '🌟',
          province: 'National',
          audience: 'Ages 12-24 & Families',
          description: 'Weekly clinician-facilitated virtual groups helping adolescents manage academic anxiety, social isolation, and neurodivergence coping strategies.',
          descriptionFr: 'Groupes virtuels hebdomadaires animés par des cliniciens pour aider les jeunes à apprivoiser l\'anxiété et renforcer l\'estime de soi.',
          activeEnrollees: 289,
          isAccepting: true
        },
        {
          id: 'prog-4',
          title: 'Senior Dignity & Home Independence Navigation',
          titleFr: 'Maintien de l\'Autonomie et Soins aux Aînés',
          category: 'Senior Care',
          icon: '🍁',
          province: 'National',
          audience: 'Seniors (65+) & Adult Children',
          description: 'Assisting families in securing provincial public home care assessments (Ontario Health atHome, AHS, CLSC), Meals on Wheels, and accessible transit.',
          descriptionFr: 'Orientation pour l\'accès aux soins à domicile publics provinciaux, popotes roulantes et adaptation de domicile.',
          activeEnrollees: 412,
          isAccepting: true
        }
      ];
      localStorage.setItem(this.STORAGE_KEYS.PROGRAMS, JSON.stringify(defaultPrograms));
    }

    // Seed default events if not present
    if (!localStorage.getItem(this.STORAGE_KEYS.EVENTS)) {
      const defaultEvents = [
        {
          id: 'evt-1',
          title: 'Postpartum Emotional Wellness & Healing Circle',
          titleFr: 'Cercle de Bien-être Émotionnel Post-partum',
          date: '2026-10-18',
          time: '7:00 PM - 8:30 PM EDT',
          format: 'Virtual (Zoom)',
          facilitator: 'Émilie Bouchard, Perinatal Nurse & Lactation Specialist',
          description: 'A compassionate, judgment-free virtual circle for parents navigating baby blues, postpartum anxiety, and newborn adjustments.',
          descriptionFr: 'Un cercle virtuel bienveillant pour échanger sur la transition parentale et briser l\'isolement.',
          rsvps: 28,
          capacity: 40,
          category: 'Maternal Care'
        },
        {
          id: 'evt-2',
          title: 'Family Caregiver Burnout: Boundary Setting & Respite Strategy',
          titleFr: 'Épuisement des Aidants : Poser ses Limites et Accéder au Répit',
          date: '2026-10-22',
          time: '1:00 PM - 2:30 PM EDT',
          format: 'Virtual & Hybrid',
          facilitator: 'Dr. Marc Tremblay, MSW & Registered Clinical Social Worker',
          description: 'Practical clinical strategies for managing compassion fatigue, navigating provincial public respite programs, and claiming the CRA Caregiver Tax Credit (CAFHS provides navigation guidance; does not provide direct subsidies).',
          descriptionFr: 'Conseils cliniques pour gérer l\'épuisement de compassion, naviguer les programmes provinciaux de répit et réclamer les crédits d\'impôt aidants.',
          rsvps: 34,
          capacity: 50,
          category: 'Caregiver Support'
        },
        {
          id: 'evt-3',
          title: 'Youth Mental Health: Guiding Your Teen Through Anxiety',
          titleFr: 'Santé Mentale des Jeunes : Accompagner l\'Adolescent Anxieux',
          date: '2026-11-04',
          time: '6:30 PM - 8:00 PM EDT',
          format: 'Virtual (Interactive Webinar)',
          facilitator: 'Kiran Patel, Adolescent Psychotherapist',
          description: 'Evidence-based tools for parents to recognize anxiety warning signs, build emotional safety at home, and connect with free youth hubs.',
          descriptionFr: 'Outils concrets pour reconnaître les signes de détresse chez l\'adolescent et instaurer un dialogue sécurisant.',
          rsvps: 19,
          capacity: 45,
          category: 'Youth Mental Health'
        }
      ];
      localStorage.setItem(this.STORAGE_KEYS.EVENTS, JSON.stringify(defaultEvents));
    }

    // Seed default sample intakes if not present
    if (!localStorage.getItem(this.STORAGE_KEYS.INTAKES)) {
      const defaultIntakes = [
        {
          id: 'INT-94281',
          name: 'Sarah Chen',
          email: 'sarah.chen@example.ca',
          phone: '(416) 555-0182',
          province: 'ON',
          program: 'Caregiver Respite Relief Fund',
          notes: 'Caring for my 82-year-old mother with early stage dementia. Need guidance on Ontario Health atHome hours and respite relief.',
          status: 'In Progress',
          submittedAt: '2026-10-04T14:32:00Z',
          assignedTo: 'Dr. Marc Tremblay'
        },
        {
          id: 'INT-93112',
          name: 'David Tremblay',
          email: 'david.tremblay@example.qc.ca',
          phone: '(514) 555-0199',
          province: 'QC',
          program: 'Perinatal & Maternal Well-being Pathway',
          notes: 'Looking for peer doula support for my partner after the birth of our second child in Montreal.',
          status: 'Contacted',
          submittedAt: '2026-10-02T10:15:00Z',
          assignedTo: 'Émilie Bouchard'
        }
      ];
      localStorage.setItem(this.STORAGE_KEYS.INTAKES, JSON.stringify(defaultIntakes));
    }
  }

  // --- Articles CRUD ---
  getArticles() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ARTICLES)) || [];
    } catch {
      return [];
    }
  }

  saveArticle(article) {
    const articles = this.getArticles();
    if (article.id) {
      const idx = articles.findIndex(a => a.id === article.id);
      if (idx !== -1) {
        articles[idx] = { ...articles[idx], ...article, updatedAt: new Date().toISOString() };
      } else {
        articles.unshift(article);
      }
    } else {
      article.id = 'art-' + Date.now();
      article.date = new Date().toISOString().split('T')[0];
      article.views = 0;
      article.published = true;
      articles.unshift(article);
    }
    localStorage.setItem(this.STORAGE_KEYS.ARTICLES, JSON.stringify(articles));
    this.notifyUpdate('articles');
    return article;
  }

  deleteArticle(id) {
    let articles = this.getArticles();
    articles = articles.filter(a => a.id !== id);
    localStorage.setItem(this.STORAGE_KEYS.ARTICLES, JSON.stringify(articles));
    this.notifyUpdate('articles');
  }

  // --- Programs CRUD ---
  getPrograms() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.PROGRAMS)) || [];
    } catch {
      return [];
    }
  }

  saveProgram(program) {
    const programs = this.getPrograms();
    if (program.id) {
      const idx = programs.findIndex(p => p.id === program.id);
      if (idx !== -1) {
        programs[idx] = { ...programs[idx], ...program };
      } else {
        programs.unshift(program);
      }
    } else {
      program.id = 'prog-' + Date.now();
      program.activeEnrollees = 0;
      program.isAccepting = true;
      programs.unshift(program);
    }
    localStorage.setItem(this.STORAGE_KEYS.PROGRAMS, JSON.stringify(programs));
    this.notifyUpdate('programs');
    return program;
  }

  deleteProgram(id) {
    let programs = this.getPrograms();
    programs = programs.filter(p => p.id !== id);
    localStorage.setItem(this.STORAGE_KEYS.PROGRAMS, JSON.stringify(programs));
    this.notifyUpdate('programs');
  }

  // --- Events CRUD ---
  getEvents() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.EVENTS)) || [];
    } catch {
      return [];
    }
  }

  saveEvent(event) {
    const events = this.getEvents();
    if (event.id) {
      const idx = events.findIndex(e => e.id === event.id);
      if (idx !== -1) {
        events[idx] = { ...events[idx], ...event };
      } else {
        events.unshift(event);
      }
    } else {
      event.id = 'evt-' + Date.now();
      event.rsvps = 0;
      events.unshift(event);
    }
    localStorage.setItem(this.STORAGE_KEYS.EVENTS, JSON.stringify(events));
    this.notifyUpdate('events');
    return event;
  }

  deleteEvent(id) {
    let events = this.getEvents();
    events = events.filter(e => e.id !== id);
    localStorage.setItem(this.STORAGE_KEYS.EVENTS, JSON.stringify(events));
    this.notifyUpdate('events');
  }

  incrementEventRSVP(eventId) {
    const events = this.getEvents();
    const event = events.find(e => e.id === eventId);
    if (event) {
      event.rsvps = (event.rsvps || 0) + 1;
      localStorage.setItem(this.STORAGE_KEYS.EVENTS, JSON.stringify(events));
      this.notifyUpdate('events');
    }
  }

  // --- Intakes CRUD ---
  getIntakes() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.INTAKES)) || [];
    } catch {
      return [];
    }
  }

  addIntake(intake) {
    const intakes = this.getIntakes();
    intake.id = 'INT-' + Math.floor(10000 + Math.random() * 90000);
    intake.submittedAt = new Date().toISOString();
    intake.status = 'New';
    intakes.unshift(intake);
    localStorage.setItem(this.STORAGE_KEYS.INTAKES, JSON.stringify(intakes));
    this.notifyUpdate('intakes');
    return intake;
  }

  updateIntakeStatus(id, newStatus, adminNotes = '') {
    const intakes = this.getIntakes();
    const intake = intakes.find(i => i.id === id);
    if (intake) {
      intake.status = newStatus;
      if (adminNotes) intake.adminNotes = adminNotes;
      intake.updatedAt = new Date().toISOString();
      localStorage.setItem(this.STORAGE_KEYS.INTAKES, JSON.stringify(intakes));
      this.notifyUpdate('intakes');
      return intake;
    }
    return null;
  }

  notifyUpdate(entityType) {
    window.dispatchEvent(new CustomEvent('cafhs:content-updated', { detail: { entityType } }));
  }
}

window.contentStore = new DynamicContentStore();
