/**
 * Canadian Association of Family Health Support (CAFHS)
 * AI Health Companion ("Nova") Engine
 */

class AIChatEngine {
  constructor() {
    this.messages = [];
    this.currentLanguage = 'en';
    this.speechSynthesisEnabled = false;
    this.isListening = false;
    this.recognition = null;
    this.apiKeyConfig = {
      provider: localStorage.getItem('cafhs_ai_provider') || 'openai',
      apiKey: localStorage.getItem('cafhs_ai_key') || '',
      model: localStorage.getItem('cafhs_ai_model') || 'gpt-4o-mini'
    };

    this.initSpeechRecognition();
    this.initKnowledgeBase();
  }

  initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRec();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = this.currentLanguage === 'fr' ? 'fr-CA' : 'en-CA';

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const inputField = document.getElementById('chat-input-text');
        if (inputField) {
          inputField.value = transcript;
          this.sendMessage(transcript);
        }
      };

      this.recognition.onerror = () => {
        this.stopListening();
      };

      this.recognition.onend = () => {
        this.stopListening();
      };
    }
  }

  toggleSpeechListening() {
    if (!this.recognition) {
      alert(this.currentLanguage === 'fr' 
        ? "La reconnaissance vocale n'est pas prise en charge par ce navigateur." 
        : "Speech recognition is not supported in this browser.");
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
      this.stopListening();
    } else {
      this.recognition.lang = this.currentLanguage === 'fr' ? 'fr-CA' : 'en-CA';
      try {
        this.recognition.start();
        this.isListening = true;
        const micBtn = document.getElementById('chat-mic-btn');
        if (micBtn) micBtn.classList.add('recording');
      } catch (e) {
        console.error(e);
      }
    }
  }

  stopListening() {
    this.isListening = false;
    const micBtn = document.getElementById('chat-mic-btn');
    if (micBtn) micBtn.classList.remove('recording');
  }

  speakText(text) {
    if (!('speechSynthesis' in window) || !this.speechSynthesisEnabled) return;
    window.speechSynthesis.cancel();
    // Strip markdown formatting for cleaner audio
    const cleanText = text.replace(/[*_#`[\]()]/g, '').replace(/https?:\/\/\S+/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = this.currentLanguage === 'fr' ? 'fr-CA' : 'en-CA';
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  }

  toggleSpeechAudio() {
    this.speechSynthesisEnabled = !this.speechSynthesisEnabled;
    if (!this.speechSynthesisEnabled) {
      window.speechSynthesis.cancel();
    }
    return this.speechSynthesisEnabled;
  }

  setLanguage(lang) {
    this.currentLanguage = lang;
  }

  initKnowledgeBase() {
    this.knowledgeBase = {
      crisisKeywords: [
        'suicide', 'kill myself', 'end my life', 'want to die', 'self harm', 'cutting',
        'me tuer', 'suicider', 'mettre fin à mes jours', 'automutilation', 'overdose'
      ],
      emergencyKeywords: [
        'heart attack', 'chest pain', 'cannot breathe', 'stroke', 'unconscious', 'severe bleeding',
        'crise cardiaque', 'douleur poitrine', 'inconscient', 'étouffement'
      ]
    };
  }

  async sendMessage(userText) {
    if (!userText || !userText.trim()) return;
    const cleanText = userText.trim();

    // AUTH GATING: User must log in before starting chat
    if (!window.authService || !window.authService.isLoggedIn()) {
      if (window.app && window.app.openAuthGateModal) {
        window.app.openAuthGateModal();
      } else if (window.authService) {
        window.authService.openAuthModal('signin');
      }
      return;
    }

    // Append User Message
    this.messages.push({
      role: 'user',
      content: cleanText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    this.renderMessages();

    // Show Typing indicator
    this.showTypingIndicator(true);

    try {
      // 1. Check Emergency & Crisis Guardrails First
      const crisisDetected = this.checkCrisisTrigger(cleanText);
      if (crisisDetected) {
        this.showTypingIndicator(false);
        const reply = this.generateCrisisResponse();
        this.messages.push({
          role: 'assistant',
          content: reply.text,
          isCrisis: true,
          actionCards: reply.actionCards,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        this.renderMessages();
        this.speakText(reply.audioSummary || reply.text);

        // Record in SQLite DB & send email to site management team
        this.logChatToDatabaseAndNotifyManagement(cleanText, reply.text, true, 'crisis-guardrail-988');
        return;
      }

      // 2. Check if Live LLM API Key is configured
      if (this.apiKeyConfig.provider !== 'builtin' && this.apiKeyConfig.apiKey) {
        const liveResponse = await this.queryExternalLLM(cleanText);
        this.showTypingIndicator(false);
        this.messages.push({
          role: 'assistant',
          content: liveResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        this.renderMessages();
        this.speakText(liveResponse);

        // Record in SQLite DB & send email to site management team
        this.logChatToDatabaseAndNotifyManagement(cleanText, liveResponse, false, this.apiKeyConfig.model || 'gpt-4o-mini');
        return;
      }

      // 3. Built-in Heuristic Canadian Family Health Intelligence
      await new Promise(r => setTimeout(r, 650)); // realistic smooth delay
      const aiReply = this.generateBuiltinResponse(cleanText);
      this.showTypingIndicator(false);

      this.messages.push({
        role: 'assistant',
        content: aiReply.text,
        followUpChips: aiReply.chips,
        resources: aiReply.resources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      this.renderMessages();
      this.speakText(aiReply.text);

      // Record in SQLite DB & send email to site management team
      this.logChatToDatabaseAndNotifyManagement(cleanText, aiReply.text, false, 'canadian-health-engine');

    } catch (err) {
      console.error(err);
      this.showTypingIndicator(false);
      const errorMsg = this.currentLanguage === 'fr'
        ? "Désolé, une erreur s'est produite. Veuillez réessayer ou contacter notre équipe au 1-800-668-6868."
        : "I apologize, but I encountered an error. Please try again or reach our team via our 24/7 provincial directory.";
      this.messages.push({
        role: 'assistant',
        content: errorMsg,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      this.renderMessages();
    }
  }

  checkCrisisTrigger(text) {
    const lower = text.toLowerCase();
    const isCrisis = this.knowledgeBase.crisisKeywords.some(kw => lower.includes(kw));
    const isEmergency = this.knowledgeBase.emergencyKeywords.some(kw => lower.includes(kw));
    return isCrisis ? 'crisis' : (isEmergency ? 'emergency' : null);
  }

  generateCrisisResponse() {
    const isFr = this.currentLanguage === 'fr';
    if (isFr) {
      return {
        text: "**IMPORTANT : Votre vie a une valeur inestimable et vous n'êtes pas seul(e).**\n\nSi vous traversez une crise suicidaire ou vivez une détresse insurmontable, des spécialistes formés et bienveillants sont prêts à vous écouter dès maintenant.",
        audioSummary: "Votre vie compte et vous n'êtes pas seul. Composez ou textez le 9 8 8 dès maintenant pour une aide immédiate et gratuite.",
        actionCards: [
          {
            title: "9-8-8 : Ligne d'aide en cas de crise de suicide",
            desc: "Gratuit, confidentiel, 24/7 partout au Canada.",
            phone: "988",
            btnLabel: "Appeler le 9-8-8"
          },
          {
            title: "Jeunesse, J'écoute (Jeunes & Adolescents)",
            desc: "Textez PARLER au 686868 ou appelez 24/7.",
            phone: "1-800-668-6868",
            btnLabel: "Appeler Jeunesse J'écoute"
          },
          {
            title: "Urgence médicale immédiate : 9-1-1",
            desc: "Pour tout danger vital ou situation d'urgence.",
            phone: "911",
            btnLabel: "Appeler le 9-1-1"
          }
        ]
      };
    } else {
      return {
        text: "**URGENT: Your life and wellbeing matter deeply, and you do not have to carry this alone.**\n\nIf you are feeling overwhelmed, having thoughts of suicide, or experiencing a crisis, please connect with immediate, free, confidential Canadian support right now:",
        audioSummary: "Your life matters and you are not alone. Please call or text 9 8 8 right now for free, confidential 24/7 support.",
        actionCards: [
          {
            title: "9-8-8 Suicide Crisis Helpline",
            desc: "Toll-free, bilingual, 24/7 support by phone or text across Canada.",
            phone: "988",
            btnLabel: "Call or Text 9-8-8"
          },
          {
            title: "Kids Help Phone (Youth & Teens)",
            desc: "Free 24/7 support. Text CONNECT to 686868 or call toll-free.",
            phone: "1-800-668-6868",
            btnLabel: "Call Kids Help Phone"
          },
          {
            title: "Immediate Life Threat : 9-1-1",
            desc: "For urgent medical emergencies or immediate safety intervention.",
            phone: "911",
            btnLabel: "Call 9-1-1"
          }
        ]
      };
    }
  }

  generateBuiltinResponse(query) {
    const isFr = this.currentLanguage === 'fr';
    const q = query.toLowerCase();

    // 1. Maternal / Postpartum / Newborn
    if (q.includes('postpartum') || q.includes('baby') || q.includes('maternal') || q.includes('mother') || 
        q.includes('breastfeed') || q.includes('doula') || q.includes('bébé') || q.includes('maman') || q.includes('grossesse') || q.includes('allaitement')) {
      return {
        text: isFr
          ? `### Soutien à la santé maternelle et périnatale 🌸\n\nL'arrivée d'un enfant entraîne de profonds bouleversements émotionnels et physiques. Voici les ressources et l'accompagnement offerts par l'ACSSF :\n\n1. **Dépistage du bien-être post-partum :** Faites notre évaluation interactive pour faire le point en toute bienveillance.\n2. **Programme de jumelage de doulas bénévoles :** Accompagnement gratuit par les pairs pour l'alimentation, le repos et les soins du nouveau-né.\n3. **Ligne Info-Santé 8-1-1 :** Accessible 24/7 pour parler directement avec une infirmière en périnatalité.\n4. **Orientation vers les soins cliniques :** Nous vous guidons vers les programmes publics périnataux et la psychothérapie couverte par votre province (l'ACSSF offre un accompagnement à la navigation et ne verse pas de subventions directes).`
          : `### Maternal & Postpartum Family Care 🌸\n\nWelcoming a baby brings significant physical, hormonal, and emotional transitions. Here is how CAFHS can support your family:\n\n1. **Postpartum Wellbeing Check :** Try our free interactive screener below to assess emotional recovery.\n2. **Free Peer Doula & Postpartum Mentorship :** Connect 1-on-1 with a trained peer mentor for feeding guidance, sleep strategies, and emotional grounding.\n3. **Provincial 8-1-1 Maternal Triage :** Call **811** anytime to speak directly with a registered perinatal triage nurse.\n4. **Perinatal Healthcare Navigation :** We guide parents toward publicly funded therapy and local hospital clinic resources (CAFHS provides navigational guidance and does not provide direct subsidies).`,
        chips: isFr 
          ? ["Faire l'évaluation post-partum", "Jumelage doula bénévole", "Conseils allaitement 811", "Prendre un rendez-vous"]
          : ["Take Postpartum Screener", "Request Free Peer Doula", "Talk to 811 Nurse", "Book Counseling Intake"],
        resources: [
          { name: isFr ? "Ligne Santé 8-1-1" : "HealthLink 8-1-1", phone: "811" },
          { name: isFr ? "ACSSF Consultation Périnatale" : "CAFHS Perinatal Care Hub", action: "open-intake" }
        ]
      };
    }

    // 2. Caregiver Burnout & Respite
    if (q.includes('caregiver') || q.includes('respite') || q.includes('burnout') || q.includes('exhausted') || 
        q.includes('proche aidant') || q.includes('aidant') || q.includes('répit') || q.includes('épuisement') || q.includes('fatigue')) {
      return {
        text: isFr
          ? `### Répit et soutien aux proches aidants 🌿\n\nPrendre soin d'un parent âgé ou d'un proche vulnérable est un acte généreux, mais le risque d'épuisement est réel. Vous avez le droit d'être soutenu(e) :\n\n* **Accompagnement aux programmes de répit :** L'ACSSF ne verse pas de subventions directes en argent, mais nos navigateurs vous guident pas à pas pour demander des heures de répit financées par les programmes provinciaux et communautaires.\n* **Organismes provinciaux dédiés :** L'Appui au Québec (**1-855-852-7784**), Ontario Caregiver Organization (**1-833-416-2273**) et Family Caregivers of BC (**1-877-520-3267**).\n* **Crédit d'impôt canadien pour aidants naturels (CRA) :** Conseils pour faire valoir vos déductions fiscales non remboursables auprès de l'ARC.\n* **Évaluation du fardeau de l'aidant :** Calculez votre indice de stress avec notre outil gratuit ci-dessous.`
          : `### Caregiver Respite & Relief Navigation 🌿\n\nCaring for an aging parent, ill spouse, or child with complex needs is deeply rewarding yet intensely exhausting. You deserve structured support:\n\n* **Provincial Respite Program Navigation :** CAFHS does not provide direct financial subsidies, but our family navigators guide you step-by-step through applying for publicly funded in-home respite hours (such as Ontario Health atHome, FCBC relief programs, or provincial home care).\n* **Provincial Caregiver Hotlines :** Dedicated 24/7 lines like Ontario Caregiver Org (**1-833-416-2273**), FCBC in British Columbia (**1-877-520-3267**), and L'Appui in Quebec (**1-855-852-7784**).\n* **Canada Caregiver Tax Credit (CRA) :** Guidance on non-refundable tax credits to offset caregiving expenses.\n* **Caregiver Strain Index (CSI) :** Take our 2-minute confidential screener on this page to identify your burnout risk level.`,
        chips: isFr 
          ? ["Calculer l'indice de stress aidant", "Programmes de répit provinciaux", "Crédits d'impôt aidants", "Contacter l'Appui"]
          : ["Take Caregiver Strain Screener", "Provincial Respite Programs", "Caregiver Tax Benefits", "Book Family Navigator"],
        resources: [
          { name: "Ontario Caregiver Helpline", phone: "1-833-416-2273" },
          { name: "L'Appui Proches Aidants QC", phone: "1-855-852-7784" }
        ]
      };
    }

    // 3. Youth & Adolescent Mental Health
    if (q.includes('youth') || q.includes('teen') || q.includes('adolescent') || q.includes('child') || q.includes('school') ||
        q.includes('jeune') || q.includes('ado') || q.includes('enfant') || q.includes('anxiété') || q.includes('anxiety') || q.includes('bullying')) {
      return {
        text: isFr
          ? `### Santé mentale et soutien pour les jeunes 🌟\n\nLes enfants et adolescents font face à des pressions importantes (anxiété scolaire, isolement social, identité). Voici nos services d'accompagnement :\n\n1. **Jeunesse, J'écoute (24/7) :** Textez **PARLER au 686868** ou composez le **1-800-668-6868** pour une écoute immédiate et sans jugement.\n2. **Cercles de discussion jeunesse CAFHS :** Ateliers virtuels hebdomadaires animés par des pairs éducateurs pour développer la résilience émotionnelle.\n3. **Centres intégrés pour jeunes :** Des espaces comme **Foundry BC** ou les carrefours **Youth Wellness Hubs Ontario** offrant des soins sans rendez-vous.\n4. **Orientation pour les parents :** Coaching familial pour mieux comprendre et accompagner l'anxiété de votre enfant.`
          : `### Youth & Adolescent Mental Health Hub 🌟\n\nCanadian youth face unprecedented challenges with social anxiety, academic pressure, and emotional transitions. Here are immediate pathways to care:\n\n1. **Kids Help Phone (24/7) :** Text **CONNECT to 686868** or call **1-800-668-6868** for free, confidential, 24/7 youth counseling.\n2. **Foundry BC & Youth Wellness Hubs :** Integrated walk-in youth health centers offering free mental health, peer support, and primary care without doctor referrals.\n3. **CAFHS Peer Circles for Teens :** Clinician-guided virtual groups focused on coping mechanisms, mindfulness, and neurodivergent support (ADHD/Autism).\n4. **Parent Guidance Sessions :** 1-on-1 coaching for parents on communication and de-escalating youth anxiety.`,
        chips: isFr
          ? ["Jeunesse J'écoute (Texto)", "Ateliers jeunes CAFHS", "Centres jeunesse sans RDV", "Rendez-vous parent-enfant"]
          : ["Text Kids Help Phone (686868)", "Join Youth Peer Circle", "Find Local Youth Hub", "Book Parent Consultation"],
        resources: [
          { name: "Kids Help Phone / Jeunesse J'écoute", phone: "1-800-668-6868" },
          { name: "9-8-8 Suicide Crisis Line", phone: "988" }
        ]
      };
    }

    // 4. Seniors & Eldercare / Dementia / Aging at home
    if (q.includes('senior') || q.includes('elder') || q.includes('dementia') || q.includes('alzheimer') || q.includes('aging') ||
        q.includes('aîné') || q.includes('vieux') || q.includes('démence') || q.includes('maintien à domicile') || q.includes('chsld')) {
      return {
        text: isFr
          ? `### Soins aux aînés et maintien de l'autonomie 🍁\n\nPermettre à nos aînés de vieillir en santé et dans la dignité est une priorité fondamentale :\n\n* **Programmes de maintien à domicile :** Accédez aux services publics de soins à domicile (CSSS/CLSC, Santé Ontario à domicile, Home Care Alberta) pour l'hygiène, la médication et la physiothérapie.\n* **Soutien pour la mémoire et l'Alzheimer :** Groupes de soutien pour les familles et ateliers de stimulation cognitive.\n* **Service 2-1-1 :** Pour trouver des popotes roulantes locales, du transport adapté bénévole et des visites amicales pour briser l'isolement.\n* **Navigateurs de soins de longue durée :** Nos conseillers vous aident à comprendre les listes d'attente et l'admission en résidence ou CHSLD.`
          : `### Senior Care & Active Aging Navigation 🍁\n\nSupporting our elders to live safely, comfortably, and with dignity at home:\n\n* **Public Home Care Navigation :** We help families initiate assessments with provincial home care authorities (Ontario Health atHome, AHS Home Care, BC Community Health) for funded personal support, nursing, and physio.\n* **Memory Care & Dementia Circles :** Gentle cognitive stimulation programs and family caregiver coaching for Alzheimer's and related conditions.\n* **2-1-1 Community Connection :** Find local subsidized Meals on Wheels, friendly volunteer check-in calls, and accessible medical transportation.\n* **Long-Term Care Advocacy :** Understanding public vs. private facility waitlists, resident rights, and provincial subsidies.`,
        chips: isFr
          ? ["Demander des soins à domicile", "Trouver popote roulante (211)", "Aide Alzheimer & mémoire", "Consultation aînés"]
          : ["Navigate Home Care (811)", "Find Meals on Wheels (211)", "Dementia Family Support", "Book Elder Care Intake"],
        resources: [
          { name: "2-1-1 Community Navigator", phone: "211" },
          { name: "8-1-1 HealthLink Triage", phone: "811" }
        ]
      };
    }

    // 5. Provincial Health Cards & 811 / Doctors
    if (q.includes('811') || q.includes('doctor') || q.includes('health card') || q.includes('ohip') || q.includes('ramq') || q.includes('msp') ||
        q.includes('médecin') || q.includes('carte soleil') || q.includes('assurance maladie') || q.includes('clinique')) {
      return {
        text: isFr
          ? `### Système de santé et accès aux soins provinciaux 🏥\n\nVoici les repères indispensables pour naviguer dans le système canadien :\n\n* **Info-Santé 8-1-1 :** Accessible sans frais 24/7 dans toutes les provinces pour parler à un infirmier autorisé, obtenir un conseil médical et connaître les temps d'attente des cliniques.\n* **Inscription pour un médecin de famille :**\n  - Ontario : Accès Soins de Santé Ontario (Health Care Connect)\n  - Québec : Guichet d'accès à un médecin de famille (GAMF)\n  - Colombie-Britannique : Health Connect Registry\n* **Cartes d'assurance maladie :** Nous guidons les nouveaux arrivants pour accélérer l'obtention de la RAMQ, l'OHIP ou la MSP.`
          : `### Navigating Canadian Provincial Healthcare 🏥\n\nHere is your guide to accessing publicly funded healthcare across Canada:\n\n* **What is 8-1-1?** A free 24/7 tele-health line in every province connecting you directly to registered nurses, dietitians, and pharmacists for triage and advice.\n* **Finding a Family Doctor / Nurse Practitioner :**\n  - **Ontario:** Register for *Health Care Connect* (1-800-445-1822)\n  - **British Columbia:** Join the *Health Connect Registry* via HealthLink BC\n  - **Alberta:** Use *Find a Doctor Alberta* (albertadoctors.org)\n  - **Quebec:** Register on *GAMF* (Guichet d'accès à un médecin de famille)\n* **Provincial Health Cards:** We provide step-by-step assistance for new residents and immigrants applying for OHIP, MSP, AHCIP, or RAMQ.`,
        chips: isFr
          ? ["Comment appeler le 811", "Trouver un médecin de famille", "Carte RAMQ / OHIP", "Répertoire provincial"]
          : ["How to Call 8-1-1", "Register for Family Doctor", "Health Card Assistance", "Explore Directory"],
        resources: [
          { name: "Provincial 8-1-1 HealthLink", phone: "811" },
          { name: "2-1-1 Community Services", phone: "211" }
        ]
      };
    }

    // 6. Drug Benefits / Financial Grants
    if (q.includes('drug') || q.includes('medication') || q.includes('pharma') || q.includes('trillium') || q.includes('cost') || q.includes('money') ||
        q.includes('médicament') || q.includes('ordonnance') || q.includes('argent') || q.includes('financier') || q.includes('subvention')) {
      return {
        text: isFr
          ? `### Programmes d'aide financière et assurance médicaments 💊\n\nNe laissez pas le coût des médicaments compromettre la santé de votre famille :\n\n* **Régimes provinciaux d'aide :** Programme Trillium en Ontario, Fair PharmaCare en C.-B., Régime public d'assurance médicaments (RAMQ) au Québec, et Alberta Non-Group Coverage.\n* **Programme pour appareils et accessoires fonctionnels (PAAM) :** Subventions gouvernementales pour fauteuils roulants, prothèses et appareils respiratoires.\n* **Crédit d'impôt pour personnes handicapées (CIPH) :** Notre équipe vous aide à monter votre dossier médical pour l'Agence du revenu du Canada (ARC).`
          : `### Drug Benefits & Healthcare Financial Assistance 💊\n\nNo Canadian family should have to choose between groceries and prescribed medications:\n\n* **Provincial Catastrophic Drug Coverage :**\n  - **Ontario:** *Trillium Drug Program* covers high-cost prescriptions based on household income.\n  - **British Columbia:** *Fair PharmaCare* provides income-tested prescription subsidies.\n  - **Alberta:** *Alberta Non-Group & Adult Health Benefit*.\n* **Assistive Devices & Medical Grants :** Subsidies covering wheelchairs, pediatric hearing aids, insulin pumps, and home accessibility modifications.\n* **Disability Tax Credit (DTC) Navigation :** CAFHS social navigators help families properly complete CRA medical certification forms.`,
        chips: isFr
          ? ["Programme Trillium", "Fair PharmaCare", "Crédit d'impôt handicap", "Parler à un conseiller"]
          : ["Trillium Drug Program", "Fair PharmaCare BC", "Disability Tax Credit (DTC)", "Book Benefits Navigator"],
        resources: [
          { name: "Ontario Trillium Program", phone: "1-800-575-5386" },
          { name: "2-1-1 Financial Aid", phone: "211" }
        ]
      };
    }

    // Default Empathetic General Family Health Guidance
    return {
      text: isFr
        ? `### Merci pour votre message 🍁\n\nL'Association Canadienne de Soutien à la Santé Familiale est à vos côtés. Nous offrons des services gratuits de navigation et de soutien communautaire dans plusieurs domaines clés :\n\n1. **Santé maternelle et périnatale :** Dépistage de la dépression post-partum, jumelage de doulas bénévoles et soutien aux nouvelles mamans.\n2. **Santé mentale des jeunes :** Cercles d'entraide et accompagnement pour l'anxiété et le bien-être des enfants et ados.\n3. **Répit pour proches aidants :** Orientation vers les programmes publics de répit, coaching émotionnel et crédits d'impôt (l'ACSSF offre une aide à la navigation et ne verse pas de subventions directes).\n4. **Orientation provinciale :** Accès aux services 8-1-1, 2-1-1 et recherche de médecins de famille.\n\nComment puis-je orienter votre recherche aujourd'hui ?`
        : `### Thank you for connecting with CAFHS 🍁\n\nThe Canadian Association of Family Health Support provides free, confidential healthcare navigation across vital family health pillars:\n\n1. **Maternal & Infant Health :** Postpartum wellness screening, lactation guidance, and free peer doula matching.\n2. **Youth Mental Resilience :** Anxiety coping circles, teen peer groups, and school transition support.\n3. **Caregiver Burnout & Respite :** Provincial respite program navigation, emotional coaching, and caregiver tax credit guidance (CAFHS provides navigation assistance; does not provide direct subsidies).\n4. **Healthcare System Navigation :** Understanding 8-1-1, finding a family physician, and provincial drug coverage.\n\nFeel free to choose one of the quick topics below or ask a specific question about your family's situation.`,
      chips: isFr
        ? ["Santé post-partum", "Répit proches aidants", "Santé mentale ados", "Guide 8-1-1", "Prendre rendez-vous"]
        : ["Postpartum Support", "Caregiver Respite", "Youth Mental Health", "How to use 8-1-1", "Book Intake Consultation"],
      resources: [
        { name: "9-8-8 Crisis Helpline", phone: "988" },
        { name: "8-1-1 HealthLine", phone: "811" }
      ]
    };
  }

  async queryExternalLLM(prompt) {
    const isFr = this.currentLanguage === 'fr';
    const systemPrompt = `You are Nova, an empathetic, expert Canadian Family Health Assistant representing the Canadian Association of Family Health Support (CAFHS / ACSSF), an unregistered Canadian non-profit community association.
You provide accurate, compassionate, and evidence-informed health navigation for Canadian families.
IMPORTANT OPERATIONAL PRINCIPLE: CAFHS does NOT provide direct cash subsidies, direct financial payouts, or direct monetary grants. Instead, CAFHS assists Canadian families with navigation, advocacy, and applications for government/provincial subsidies and public programs (such as provincial home care respite relief, Trillium Drug Program, Fair PharmaCare, Canada Caregiver Credit, Disability Tax Credit), along with free direct community peer support circles and health screeners. Never claim that CAFHS provides direct subsidies or direct checks.
Always keep in mind Canadian healthcare realities: public Medicare, 811 Tele-health lines, 988 Suicide Crisis line, 211 Community services, provincial drug programs (Trillium, Fair PharmaCare), and caregiver respite programs.
Language: Respond in ${isFr ? 'French' : 'English'}.
Disclaimer: Remind users gently when appropriate that you provide healthcare education and resource navigation, not emergency medical diagnosis.`;

    if (this.apiKeyConfig.provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKeyConfig.apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Question: ${prompt}` }] }
          ]
        })
      });
      const data = await res.json();
      if (data.candidates && data.candidates[0].content.parts[0].text) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error(data.error ? data.error.message : 'Gemini API Error');
      }
    } else if (this.apiKeyConfig.provider === 'openai') {
      try {
        const url = 'https://api.openai.com/v1/chat/completions';
        // Multi-turn context memory: pass up to 6 previous messages
        const history = this.messages.slice(-6).map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        }));

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKeyConfig.apiKey}`
          },
          body: JSON.stringify({
            model: this.apiKeyConfig.model || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              ...history,
              { role: 'user', content: prompt }
            ],
            temperature: 0.7
          })
        });

        const data = await res.json();
        if (res.ok && data.choices && data.choices[0].message.content) {
          return data.choices[0].message.content;
        } else {
          console.warn('OpenAI API returned non-200, smoothly falling back:', data.error);
          return this.generateBuiltinResponse(prompt).text;
        }
      } catch (e) {
        console.warn('OpenAI network issue, falling back to Canadian Health Engine:', e);
        return this.generateBuiltinResponse(prompt).text;
      }
    }

    return this.generateBuiltinResponse(prompt).text;
  }

  syncChatHeaderStatus() {
    const headerStatus = document.getElementById('chat-header-status-text');
    if (headerStatus) {
      const isFr = this.currentLanguage === 'fr';
      headerStatus.innerText = isFr 
        ? 'Soutien santé familial 24/7' 
        : 'Online • 24/7 Family Health Support';
    }
  }

  saveInlineKey() {
    const input = document.getElementById('inline-openai-key');
    if (!input || !input.value.trim()) {
      alert('Please enter your OpenAI API key (starts with sk-proj- or sk-).');
      return;
    }

    const key = input.value.trim();
    this.apiKeyConfig.provider = 'openai';
    this.apiKeyConfig.apiKey = key;
    this.apiKeyConfig.model = 'gpt-4o-mini';

    localStorage.setItem('cafhs_ai_provider', 'openai');
    localStorage.setItem('cafhs_ai_key', key);
    localStorage.setItem('cafhs_ai_model', 'gpt-4o-mini');

    this.syncChatHeaderStatus();

    this.messages.push({
      role: 'assistant',
      content: `🍁 **ChatGPT API is now directly connected!**\n\nAll questions will now be answered in real-time by OpenAI's **gpt-4o-mini** model.\n\nHow can I support you and your family today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    this.renderMessages();

    if (window.emailService) {
      window.emailService.showToast({
        title: '🤖 ChatGPT Connected Directly',
        message: 'OpenAI API key configured successfully! Live AI answers enabled.',
        type: 'success'
      });
    }
  }

  async testApiKey(apiKey, model = 'gpt-4o-mini') {
    if (!apiKey) {
      return { success: false, error: 'Please enter an API key to test.' };
    }
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Say hello in 2 words.' }],
          max_tokens: 10
        })
      });

      const data = await res.json();
      if (res.ok && data.choices && data.choices[0]) {
        return { success: true, message: `Connected to OpenAI (${model}) successfully!` };
      } else {
        const msg = data.error ? data.error.message : `HTTP Error ${res.status}`;
        return { success: false, error: msg };
      }
    } catch (err) {
      return { success: false, error: `Network error: ${err.message}` };
    }
  }

  showTypingIndicator(show) {
    const container = document.getElementById('chat-messages-container');
    const existing = document.getElementById('chat-typing-indicator');
    if (show) {
      if (!existing && container) {
        const div = document.createElement('div');
        div.id = 'chat-typing-indicator';
        div.className = 'chat-message message-assistant typing';
        div.innerHTML = `
          <div class="message-avatar">🍁</div>
          <div class="message-bubble typing-bubble">
            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
          </div>
        `;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
      }
    } else {
      if (existing) existing.remove();
    }
  }

  renderMessages() {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;

    this.syncChatHeaderStatus();
    container.innerHTML = '';

    // If no messages yet, display welcoming initial prompt
    if (this.messages.length === 0) {
      const welcome = document.createElement('div');
      welcome.className = 'chat-welcome-box';
      const t = window.translations[this.currentLanguage] || window.translations.en;
      const currentUser = window.authService ? window.authService.getCurrentUser() : null;
      const userName = currentUser ? currentUser.name.split(' ')[0] : 'Family';
      const isChatGPTActive = this.apiKeyConfig.provider === 'openai' && Boolean(this.apiKeyConfig.apiKey);

      welcome.innerHTML = `
        <div class="welcome-avatar">🍁</div>
        <h4>${currentUser ? `Hello, ${userName}! 🍁` : t.chat_header_title}</h4>
        <p>${currentUser 
          ? `Welcome to your private session, ${userName}. How can I assist you with Canadian healthcare navigation, caregiver respite, or provincial programs today?`
          : t.chat_welcome_msg}</p>

        ${!currentUser ? `
          <div style="background: rgba(0, 128, 128, 0.08); border: 1.5px dashed #008080; border-radius: 10px; padding: 1rem; margin-bottom: 1.25rem; text-align: center;">
            <div style="font-weight: 700; color: #0d3b3a; margin-bottom: 0.35rem; display:flex; align-items:center; justify-content:center; gap:0.4rem;">
              <span>🔒</span> <span>Login Required to Start Chat</span>
            </div>
            <p style="margin: 0 0 0.75rem 0; font-size: 0.85rem; color: #374151;">
              Please sign in to begin your confidential health consultation. Your session details are saved to your account and shared with our healthcare navigators.
            </p>
            <div style="display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap;">
              <button type="button" class="btn btn-primary btn-sm" onclick="window.authService.openAuthModal('signin')">Sign In</button>
              <button type="button" class="btn btn-outline btn-sm" onclick="window.authService.openAuthModal('signup')">Register</button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.authService.quickLogin('user')">Demo User</button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.authService.quickLogin('mack')">Mack Chen (Admin)</button>
            </div>
          </div>
        ` : `
          <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 0.5rem 0.75rem; margin-bottom: 1rem; font-size: 0.82rem; color: #065F46; display:flex; align-items:center; justify-content:space-between;">
            <span>👤 Signed in as <strong>${currentUser.name}</strong> (${currentUser.email})</span>
            <span style="font-size:0.75rem; background:#D1FAE5; padding:2px 6px; border-radius:4px;">Verified</span>
          </div>
        `}

        <div class="welcome-chips">
          <button class="chip-btn" onclick="window.chatEngine.sendMessage('${this.currentLanguage === 'fr' ? 'Soutien dépression post-partum' : 'Postpartum mental health support'}')">🌸 ${this.currentLanguage === 'fr' ? 'Soutien post-partum' : 'Postpartum Support'}</button>
          <button class="chip-btn" onclick="window.chatEngine.sendMessage('${this.currentLanguage === 'fr' ? 'Répit pour proche aidant épuisé' : 'Caregiver burnout & respite navigation'}')">🌿 ${this.currentLanguage === 'fr' ? 'Répit proches aidants' : 'Caregiver Respite'}</button>
          <button class="chip-btn" onclick="window.chatEngine.sendMessage('${this.currentLanguage === 'fr' ? 'Santé mentale pour adolescent anxieux' : 'Youth & teen anxiety resources'}')">🌟 ${this.currentLanguage === 'fr' ? 'Santé mentale jeunes' : 'Youth Mental Health'}</button>
          <button class="chip-btn" onclick="window.chatEngine.sendMessage('${this.currentLanguage === 'fr' ? 'Comment fonctionne la ligne 8-1-1 ?' : 'How does 8-1-1 HealthLink work?'}')">🏥 ${this.currentLanguage === 'fr' ? 'Guide Ligne 8-1-1' : '8-1-1 HealthLink Info'}</button>
        </div>
      `;
      container.appendChild(welcome);
      return;
    }

    this.messages.forEach(msg => {
      const msgDiv = document.createElement('div');
      msgDiv.className = `chat-message message-${msg.role} ${msg.isCrisis ? 'crisis-alert-msg' : ''}`;

      const avatar = msg.role === 'user' ? '👤' : '🍁';
      let contentHtml = this.formatMarkdown(msg.content);

      let actionCardsHtml = '';
      if (msg.actionCards && msg.actionCards.length > 0) {
        actionCardsHtml = `
          <div class="crisis-action-cards">
            ${msg.actionCards.map(c => `
              <div class="crisis-card">
                <h5>${c.title}</h5>
                <p>${c.desc}</p>
                <a href="tel:${c.phone}" class="btn-crisis-call">${c.btnLabel} (${c.phone})</a>
              </div>
            `).join('')}
          </div>
        `;
      }

      let chipsHtml = '';
      if (msg.followUpChips && msg.followUpChips.length > 0) {
        chipsHtml = `
          <div class="follow-up-chips">
            ${msg.followUpChips.map(ch => `
              <button class="chip-btn" onclick="window.chatEngine.sendMessage('${ch}')">${ch}</button>
            `).join('')}
          </div>
        `;
      }

      let resourcesHtml = '';
      if (msg.resources && msg.resources.length > 0) {
        resourcesHtml = `
          <div class="message-resources">
            <span class="resources-label">🍁 ${this.currentLanguage === 'fr' ? 'Ressources recommandées :' : 'Recommended Hotlines & Links :'}</span>
            ${msg.resources.map(r => r.phone ? `<a href="tel:${r.phone}" class="resource-badge">📞 ${r.name} (${r.phone})</a>` : `<button onclick="window.app.openIntakeModal()" class="resource-badge action">📋 ${r.name}</button>`).join('')}
          </div>
        `;
      }

      msgDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-bubble-wrapper">
          <div class="message-bubble">
            ${contentHtml}
            ${actionCardsHtml}
            ${resourcesHtml}
          </div>
          ${chipsHtml}
          <span class="message-time">${msg.timestamp}</span>
        </div>
      `;

      container.appendChild(msgDiv);
    });

    container.scrollTop = container.scrollHeight;
  }

  formatMarkdown(text) {
    if (!text) return '';
    let formatted = text
      .replace(/### (.*)/g, '<h4>$1</h4>')
      .replace(/## (.*)/g, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/^\* (.*)/gm, '<li>$1</li>')
      .replace(/^1\. (.*)/gm, '<li>$1</li>')
      .replace(/\n\n/g, '<br><br>');
    return formatted;
  }

  clearChat() {
    this.messages = [];
    this.renderMessages();
  }

  exportSummary() {
    if (this.messages.length === 0) {
      alert(this.currentLanguage === 'fr' ? "Aucune conversation à exporter." : "No conversation to export.");
      return;
    }

    const isFr = this.currentLanguage === 'fr';
    const dateStr = new Date().toLocaleDateString(isFr ? 'fr-CA' : 'en-CA', { 
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });

    let printContent = `
      <html>
      <head>
        <title>CAFHS / ACSSF - Family Health Consultation Notes</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1a252c; line-height: 1.6; }
          .header { border-bottom: 2px solid #008080; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { color: #008080; font-size: 24px; font-weight: bold; }
          .disclaimer { background: #f0f7f6; padding: 15px; border-radius: 8px; font-size: 13px; margin-bottom: 25px; border-left: 4px solid #008080; }
          .msg-block { margin-bottom: 20px; padding: 15px; border-radius: 8px; background: #fafafa; border: 1px solid #eee; }
          .msg-user { background: #eef6fc; border-color: #d0e7f9; }
          .msg-role { font-weight: bold; color: #0d3b3a; margin-bottom: 5px; font-size: 14px; }
          .msg-time { float: right; font-size: 12px; color: #888; }
          .footer { margin-top: 40px; font-size: 12px; color: #666; text-align: center; border-top: 1px solid #ddd; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🍁 Canadian Association of Family Health Support (CAFHS)</div>
          <div>Association Canadienne de Soutien à la Santé Familiale (ACSSF)</div>
          <p><strong>Family Health AI Navigation Summary</strong> | Generated: ${dateStr}</p>
        </div>

        <div class="disclaimer">
          <strong>Medical Information Disclaimer:</strong> This summary contains educational health navigation records provided by Nova (CAFHS AI Assistant). It is designed to assist family discussions with physicians, midwives, nurses, or social workers and is not a clinical medical diagnosis. In case of emergency, call 9-1-1 or 9-8-8.
        </div>

        <div class="conversation">
          ${this.messages.map(m => `
            <div class="msg-block ${m.role === 'user' ? 'msg-user' : ''}">
              <span class="msg-time">${m.timestamp}</span>
              <div class="msg-role">${m.role === 'user' ? '👤 Family / User Inquiry' : '🍁 Nova (CAFHS AI Health Companion)'}</div>
              <div>${this.formatMarkdown(m.content)}</div>
            </div>
          `).join('')}
        </div>

        <div class="footer">
          Canadian Association of Family Health Support | Canadian Non-Profit Community Association<br>
          Canada Suicide Crisis Helpline: 9-8-8 | Tele-Health Advice: 8-1-1 | Community Resources: 2-1-1
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  }

  async logChatToDatabaseAndNotifyManagement(userMessage, aiResponse, isCrisis = false, modelUsed = 'builtin') {
    const currentUser = window.authService ? window.authService.getCurrentUser() : null;
    const userName = currentUser ? currentUser.name : 'Registered Member';
    const userEmail = currentUser ? currentUser.email : 'member@cafhs.ca';
    const userId = currentUser ? currentUser.id : 'usr-unknown';

    if (!this.sessionId) {
      this.sessionId = 'sess-' + Date.now();
    }

    // 1. Post to Server SQLite Database (/api/chat/log)
    try {
      const payload = {
        session_id: this.sessionId,
        user_id: userId,
        user_name: userName,
        user_email: userEmail,
        user_message: userMessage,
        ai_response: aiResponse,
        model_used: modelUsed,
        is_crisis: isCrisis ? 1 : 0
      };

      const res = await fetch('/api/chat/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      console.log('✓ Chat logged in SQLite DB & dispatched to site management team:', data);
    } catch (err) {
      console.warn('Backend chat log API notice:', err);
    }

    // 2. Also dispatch to client-side window.emailService so site management notification inbox displays it
    if (window.emailService) {
      const crisisAlert = isCrisis ? '🚨 [CRISIS/988 ALERT] ' : '';
      const managementRecipients = [
        { email: 'admin@cafhs.ca', name: 'Dr. Marc Tremblay (Clinical Director)' },
        { email: 'mack.chen@viccollege.com', name: 'Mack Chen (Executive Administrator)' }
      ];

      managementRecipients.forEach(admin => {
        window.emailService.sendEmail({
          to: admin.email,
          toName: admin.name,
          subject: `${crisisAlert}[AI Chat Consultation] Inquiry from ${userName} (${userEmail})`,
          body: `Notice to CAFHS Site Management Team:

A verified user has engaged with the Nova AI Health Companion on the CAFHS portal.

--- USER DETAILS ---
Name:  ${userName}
Email: ${userEmail}
Status: Verified Logged-in User
Timestamp: ${new Date().toLocaleString()}
Crisis Triggered: ${isCrisis ? 'YES (Suicide/Crisis Referral Protocols Activated)' : 'No'}

--- USER HEALTH INQUIRY ---
"${userMessage}"

--- AI HEALTH COMPANION RESPONSE ---
${aiResponse}

-----------------------------------------------------
Recorded in CAFHS Database (Table: chat_logs)
Notification Dispatched to: ${admin.email}`,
          category: isCrisis ? 'crisis_alert' : 'chat_inquiry'
        });
      });
    }
  }
}

window.AIChatEngine = AIChatEngine;
