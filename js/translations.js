/**
 * Canadian Association of Family Health Support (CAFHS)
 * Bilingual Translations Dictionary (EN / FR)
 */

const translations = {
  en: {
    // Top Bar & Crisis
    crisis_banner: "In crisis? Call or text 9-8-8 for Canada's Suicide Crisis Helpline (24/7, Toll-Free)",
    quick_call: "Call 9-8-8",
    health_link: "Non-Emergency Health Advice: Call 8-1-1",
    registered_charity: "Canadian Non-Profit Community Association | Dedicated to Family Health Support",
    
    // Nav
    nav_home: "Home",
    nav_programs: "Programs",
    nav_directory: "Navigator",
    nav_assessments: "Screeners",
    nav_intake: "Intake",
    nav_events: "Workshops",
    nav_donate: "Support",
    nav_chat_btn: "Nova AI",
    
    // Hero
    hero_badge: "🍁 Trusted Canadian Family Health Network",
    hero_title: "Compassionate Health Support for Every Canadian Family",
    hero_subtitle: "From postpartum & child development to youth mental wellness, caregiver respite, and senior care — we help families navigate Canada's healthcare landscape with personalized guidance and AI-powered support.",
    hero_cta_chat: "Chat with AI Health Companion",
    hero_cta_explore: "Explore Free Programs",
    hero_stat_families: "18,500+",
    hero_stat_families_label: "Canadian Families Supported",
    hero_stat_provinces: "13",
    hero_stat_provinces_label: "Provinces & Territories",
    hero_stat_caregivers: "45,000+",
    hero_stat_caregivers_label: "Caregiver Relief Hours",
    hero_stat_response: "24/7",
    hero_stat_response_label: "AI Guidance & Crisis Direct",

    // Quick Help Bar
    quick_help_title: "Immediate Canadian Health & Community Helplines",
    quick_help_desc: "Free, confidential assistance available across Canada 24 hours a day, 7 days a week.",
    
    // Programs Section
    programs_tag: "Our Core Pillars",
    programs_title: "Comprehensive Family Health & Care Programs",
    programs_subtitle: "Designed by Canadian clinicians, social workers, and peer specialists to meet your family at every stage of life.",
    
    prog_maternal_title: "Maternal, Postpartum & Infant Health",
    prog_maternal_desc: "Dedicated support for expectant and new mothers. Includes postpartum depression screening, peer doula connections, newborn feeding support, and perinatal wellness groups.",
    prog_maternal_badge: "Perinatal Care",
    
    prog_youth_title: "Youth & Child Mental Health Resilience",
    prog_youth_desc: "Safe, confidential peer circles and counseling for children, teens, and youth navigating anxiety, depression, neurodiversity, and school transitions across Canada.",
    prog_youth_badge: "Mental Wellness",
    
    prog_caregiver_title: "Caregiver Respite & Burnout Relief",
    prog_caregiver_desc: "Supporting the unsung heroes caring for aging parents, chronically ill children, or partners. Access provincial respite program navigation, peer mentorship, and caregiver tax credit guidance (CAFHS provides navigation guidance and does not provide direct subsidies).",
    prog_caregiver_badge: "Caregiver Support",
    
    prog_seniors_title: "Active Aging & Senior Care Advocacy",
    prog_seniors_desc: "Helping older adults age with dignity at home. Includes chronic disease self-management, memory care support circles, and navigating provincial long-term care systems.",
    prog_seniors_badge: "Elder Care",

    prog_newcomer_title: "Newcomer Family Health Navigation",
    prog_newcomer_desc: "Multilingual guidance for immigrant and refugee families on obtaining provincial health cards (OHIP, MSP, RAMQ), finding family doctors, and community clinics.",
    prog_newcomer_badge: "Health Equity",

    prog_financial_title: "Drug Benefits & Medical Aid Navigator",
    prog_financial_desc: "Expert assistance navigating provincial drug programs (Trillium, Fair PharmaCare, Alberta Non-Group), assistive device programs, and disability tax credits (CAFHS assists with applications and does not disburse direct subsidies).",
    prog_financial_badge: "Financial Aid",

    // Provincial Directory Section
    dir_tag: "Interactive Navigator",
    dir_title: "Canadian Provincial Healthcare & Support Directory",
    dir_subtitle: "Select your province or territory to find verified local health authorities, tele-health services, specialized family programs, and emergency support.",
    dir_search_placeholder: "Search by keyword (e.g., postpartum, dementia, youth, 811, Calgary, Toronto)...",
    dir_filter_all: "All Provinces & Territories",
    dir_category_all: "All Categories",
    dir_category_mental: "Mental Health",
    dir_category_maternal: "Maternal & Child",
    dir_category_caregiver: "Caregiver & Seniors",
    dir_category_telehealth: "Telehealth & Navigation",

    // Assessment Section
    assess_tag: "Confidential Self-Check",
    assess_title: "Interactive Family Wellness Screeners",
    assess_subtitle: "Take a free, evidence-informed check-in to assess caregiver stress or postpartum emotional health. Receive instant personalized guidance and resources.",
    assess_tab_caregiver: "Caregiver Strain Index (CSI)",
    assess_tab_postpartum: "Postpartum Wellbeing Screener",
    assess_btn_start: "Begin Assessment",
    assess_disclaimer: "Note: These educational screeners are not clinical diagnoses. If you are experiencing high distress or thoughts of harm, please call 9-8-8 immediately.",

    // Intake Section
    intake_tag: "1-on-1 Personalized Care",
    intake_title: "Book a Free Confidential Family Health Intake",
    intake_subtitle: "Speak with a certified CAFHS Family Navigator or peer specialist who will listen, assess your family's unique needs, and match you with funded local care.",
    intake_step1: "Family Details",
    intake_step2: "Care Needs",
    intake_step3: "Preferred Time",
    intake_submit_btn: "Request Confidential Consultation",

    // Impact & Stories
    impact_tag: "Our Community Impact",
    impact_title: "Strengthening Canadian Families Coast to Coast",
    impact_subtitle: "Every family deserves timely, compassionate healthcare guidance without financial or bureaucratic barriers.",

    // Donation / Community Support Section
    donate_tag: "Support Grassroots Care",
    donate_title: "Support Canadian Families in Need",
    donate_subtitle: "As a Canadian non-profit community association, 100% of community contributions directly fund respite relief hours for exhausted caregivers and peer mental wellness circles. (Contributions are direct community gifts supporting our grassroots mission and not CRA tax-deductible).",
    donate_tax_calc_title: "Community Health Impact Estimator",
    donate_one_time: "One-Time Contribution",
    donate_monthly: "Monthly Support",
    donate_custom: "Custom Amount ($CAD)",
    donate_button: "Complete Contribution",

    // Events Section
    events_tag: "Upcoming Learning & Circles",
    events_title: "Free Family Wellness Webinars & Support Groups",
    events_subtitle: "Join interactive, clinician-guided virtual sessions from the comfort of your home.",
    events_rsvp_btn: "Register for Free",

    // AI Chat Component
    chat_header_title: "Nova • CAFHS AI Companion",
    chat_header_subtitle: "Canadian Family Health & Community Navigation",
    chat_welcome_msg: "Hello! I'm Nova, your AI Family Health Companion from the Canadian Association of Family Health Support. How can I support your family today?",
    chat_disclaimer: "Nova provides informational guidance and Canadian health resource navigation. Not a substitute for emergency medical care. In emergency, call 911 or 988.",
    chat_input_placeholder: "Type your question or family health concern...",
    chat_send: "Send",
    chat_voice_hint: "Voice input",
    chat_export_btn: "Export/Print Summary",
    chat_settings_btn: "AI Model Settings",
    chat_clear_btn: "Clear Chat",

    // Footer
    footer_mission: "The Canadian Association of Family Health Support (CAFHS) is a grassroots Canadian non-profit community association dedicated to bridging the gaps in family healthcare navigation, caregiver respite, youth mental health, and equitable community navigation.",
    footer_links_title: "Navigation",
    footer_provinces_title: "Regional Coverage",
    footer_emergency_title: "Crisis & Helplines",
    footer_copyright: "© 2026 Canadian Association of Family Health Support (CAFHS / ACSSF). All rights reserved. Canadian Non-Profit Community Association."
  },

  fr: {
    // Top Bar & Crisis
    crisis_banner: "En crise ? Appelez ou textez le 9-8-8 pour la Ligne d'aide en cas de crise de suicide (24/7, sans frais)",
    quick_call: "Appeler 9-8-8",
    health_link: "Conseils de santé non urgents : composez le 8-1-1 (Info-Santé)",
    registered_charity: "Association communautaire canadienne à but non lucratif | Dévouée au soutien de la santé familiale",
    
    // Nav
    nav_home: "Accueil",
    nav_programs: "Programmes",
    nav_directory: "Navigateur",
    nav_assessments: "Évaluations",
    nav_intake: "Intake",
    nav_events: "Ateliers",
    nav_donate: "Soutenir",
    nav_chat_btn: "IA Nova",
    
    // Hero
    hero_badge: "🍁 Réseau de soutien à la santé familiale au Canada",
    hero_title: "Un soutien bienveillant pour chaque famille canadienne",
    hero_subtitle: "Du soutien périnatal au développement de l'enfant, en passant par la santé mentale des jeunes, le répit des proches aidants et les soins aux aînés — nous guidons les familles à travers le système de santé canadien.",
    hero_cta_chat: "Discuter avec l'IA Compagnon",
    hero_cta_explore: "Découvrir nos programmes",
    hero_stat_families: "18 500+",
    hero_stat_families_label: "Familles accompagnées",
    hero_stat_provinces: "13",
    hero_stat_provinces_label: "Provinces et territoires",
    hero_stat_caregivers: "45 000+",
    hero_stat_caregivers_label: "Heures de répit financées",
    hero_stat_response: "24/7",
    hero_stat_response_label: "Assistance IA et crise",

    // Quick Help Bar
    quick_help_title: "Lignes d'assistance immédiates au Canada",
    quick_help_desc: "Aide gratuite, confidentielle et bilingue accessible 24 heures sur 24, 7 jours sur 7 partout au Canada.",
    
    // Programs Section
    programs_tag: "Nos Piliers Fondamentaux",
    programs_title: "Programmes complets de santé familiale",
    programs_subtitle: "Conçus par des cliniciens, travailleurs sociaux et pairs aidants canadiens pour accompagner votre famille à chaque étape de la vie.",
    
    prog_maternal_title: "Santé maternelle, périnatale et infantile",
    prog_maternal_desc: "Accompagnement bienveillant pour futures et nouvelles mères : dépistage de la dépression post-partum, jumelage de doulas paires et soutien à l'allaitement.",
    prog_maternal_badge: "Soins périnataux",
    
    prog_youth_title: "Résilience et santé mentale des jeunes",
    prog_youth_desc: "Espaces sécuritaires et confidentiels de soutien par les pairs pour enfants, adolescents et jeunes adultes aux prises avec l'anxiété, la dépression et la neurodiversité.",
    prog_youth_badge: "Bien-être psychologique",
    
    prog_caregiver_title: "Répit et soutien aux proches aidants",
    prog_caregiver_desc: "Soutien indispensable pour ceux qui prennent soin d'un parent âgé ou d'un proche malade : accès aux programmes de répit provinciaux, mentorat par les pairs et orientation fiscale (l'ACSSF offre un accompagnement à la navigation et ne verse pas de subventions directes).",
    prog_caregiver_badge: "Proches aidants",
    
    prog_seniors_title: "Vieillissement actif et défense des aînés",
    prog_seniors_desc: "Permettre aux aînés de vieillir dans la dignité à domicile : gestion des maladies chroniques, soutien pour la mémoire et accès aux soins de longue durée.",
    prog_seniors_badge: "Soins aux aînés",

    prog_newcomer_title: "Navigation santé pour familles arrivantes",
    prog_newcomer_desc: "Assistance multilingue pour l'obtention des cartes d'assurance maladie provinciales (RAMQ, OHIP, MSP), la recherche de médecins de famille et les cliniques communautaires.",
    prog_newcomer_badge: "Équité en santé",

    prog_financial_title: "Régimes médicaments et aide financière",
    prog_financial_desc: "Aide experte pour naviguer les régimes provinciaux d'assurance médicaments (Trillium, RAMQ, PharmaCare), programmes pour appareils fonctionnels et crédits d'impôt (l'ACSSF offre une aide à la navigation et ne verse pas de subventions directes).",
    prog_financial_badge: "Aide financière",

    // Provincial Directory Section
    dir_tag: "Navigateur Interactif",
    dir_title: "Répertoire provincial des soins de santé et du soutien",
    dir_subtitle: "Sélectionnez votre province ou territoire pour trouver des régies de santé vérifiées, services de télésanté, programmes familiaux et lignes d'urgence.",
    dir_search_placeholder: "Rechercher par mot-clé (ex. post-partum, démence, jeunes, 811, Montréal, Québec)...",
    dir_filter_all: "Toutes les provinces et territoires",
    dir_category_all: "Toutes les catégories",
    dir_category_mental: "Santé mentale",
    dir_category_maternal: "Maternelle et infantile",
    dir_category_caregiver: "Proches aidants et aînés",
    dir_category_telehealth: "Télésanté et navigation",

    // Assessment Section
    assess_tag: "Auto-évaluation Confidentielle",
    assess_title: "Outils interactifs de bien-être familial",
    assess_subtitle: "Faites un bilan gratuit pour évaluer le stress du proche aidant ou la santé émotionnelle post-partum. Obtenez des conseils et ressources personnalisés.",
    assess_tab_caregiver: "Indice de fardeau du proche aidant (CSI)",
    assess_tab_postpartum: "Évaluation du bien-être post-partum",
    assess_btn_start: "Commencer l'évaluation",
    assess_disclaimer: "Remarque : Ces questionnaires éducatifs ne constituent pas un diagnostic médical. En cas de détresse sévère, composez immédiatement le 9-8-8.",

    // Intake Section
    intake_tag: "Accompagnement Personnalisé",
    intake_title: "Demander une consultation gratuite et confidentielle",
    intake_subtitle: "Échangez avec un navigateur familial ou pair spécialisé de l'ACSSF qui évaluera vos besoins et vous orientera vers des soins locaux subventionnés.",
    intake_step1: "Détails de la famille",
    intake_step2: "Besoins de soins",
    intake_step3: "Disponibilité",
    intake_submit_btn: "Demander une consultation confidentielle",

    // Impact & Stories
    impact_tag: "Notre Impact Communautaire",
    impact_title: "Renforcer les familles canadiennes d'un océan à l'autre",
    impact_subtitle: "Chaque famille mérite un accès équitable et bienveillant aux soins de santé, sans barrières financières ou administratives.",

    // Donation Section
    donate_tag: "Soutenir l'entraide de proximité",
    donate_title: "Aidez les familles canadiennes dans le besoin",
    donate_subtitle: "En tant qu'association communautaire canadienne à but non lucratif, 100 % de vos contributions financent directement les heures de répit pour proches aidants et nos cercles de santé mentale. (Les contributions sont des dons de soutien communautaire non déductibles d'impôt).",
    donate_tax_calc_title: "Estimateur d'impact sur la santé communautaire",
    donate_one_time: "Contribution unique",
    donate_monthly: "Soutien mensuel",
    donate_custom: "Montant personnalisé ($CAD)",
    donate_button: "Effectuer la contribution",

    // Events Section
    events_tag: "Ateliers et Rencontres à Venir",
    events_title: "Webinaires et groupes de soutien familiaux gratuits",
    events_subtitle: "Participez à des sessions virtuelles guidées par des cliniciens depuis le confort de votre foyer.",
    events_rsvp_btn: "S'inscrire gratuitement",

    // AI Chat Component
    chat_header_title: "Nova • Compagnon IA Santé",
    chat_header_subtitle: "Navigation en santé familiale et communautaire",
    chat_welcome_msg: "Bonjour ! Je suis Nova, votre compagnon santé IA de l'Association Canadienne de Soutien à la Santé Familiale. Comment puis-je vous aider aujourd'hui ?",
    chat_disclaimer: "Nova fournit des renseignements et oriente vers les ressources de santé canadiennes. Ne remplace pas un médecin. En cas d'urgence, composez le 911 ou le 988.",
    chat_input_placeholder: "Posez votre question ou préoccupation de santé...",
    chat_send: "Envoyer",
    chat_voice_hint: "Entrée vocale",
    chat_export_btn: "Exporter/Imprimer le résumé",
    chat_settings_btn: "Paramètres du modèle IA",
    chat_clear_btn: "Effacer la discussion",

    // Footer
    footer_mission: "L'Association Canadienne de Soutien à la Santé Familiale (ACSSF) est une association communautaire canadienne à but non lucratif dédiée à combler les lacunes en matière de navigation dans les soins, de répit des proches aidants et de santé mentale des jeunes.",
    footer_links_title: "Navigation",
    footer_provinces_title: "Couverture Régionale",
    footer_emergency_title: "Lignes d'urgence et crise",
    footer_copyright: "© 2026 Association Canadienne de Soutien à la Santé Familiale (CAFHS / ACSSF). Tous droits réservés. Association communautaire canadienne à but non lucratif."
  }
};

window.translations = translations;
