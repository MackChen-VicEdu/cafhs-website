/**
 * Canadian Association of Family Health Support (CAFHS)
 * Interactive Wellness Assessment Screeners
 */

const assessments = {
  caregiver: {
    titleEn: "Caregiver Burden & Stress Index (CSI)",
    titleFr: "Indice de stress et de fardeau du proche aidant",
    descEn: "Answer 7 quick questions about your daily experience caring for a family member. Get personalized relief tips and direct NGO support programs.",
    descFr: "Répondez à 7 questions sur votre quotidien auprès d'un proche. Obtenez des conseils de soulagement et des programmes d'aide.",
    questions: [
      {
        id: "c1",
        qEn: "My sleep is frequently disturbed due to caregiving duties (e.g. night assistance, worry, waking up).",
        qFr: "Mon sommeil est souvent perturbé par mes tâches d'aidant (aide nocturne, inquiétude, réveils).",
        weights: { yes: 1, no: 0 }
      },
      {
        id: "c2",
        qEn: "Caregiving is inconvenient or requires major adjustments to my daily routine or work schedule.",
        qFr: "Le rôle d'aidant exige des ajustements majeurs à ma routine quotidienne ou mon travail.",
        weights: { yes: 1, no: 0 }
      },
      {
        id: "c3",
        qEn: "It is a physical strain (e.g., lifting, transferring, assisting with bathing or mobility).",
        qFr: "C'est un effort physique (ex. lever, transférer, aide au bain ou à la mobilité).",
        weights: { yes: 1, no: 0 }
      },
      {
        id: "c4",
        qEn: "It is confining — caregiving restricts my free time, social life, or visiting friends.",
        qFr: "C'est contraignant — cela restreint mes loisirs, ma vie sociale ou mes visites amicales.",
        weights: { yes: 1, no: 0 }
      },
      {
        id: "c5",
        qEn: "There have been emotional adjustments (e.g., feeling anxious, irritable, guilty, or overwhelmed).",
        qFr: "Il y a eu des bouleversements émotionnels (anxiété, irritabilité, culpabilité, épuisement).",
        weights: { yes: 1, no: 0 }
      },
      {
        id: "c6",
        qEn: "I feel financially strained by healthcare costs, medical supplies, or reduced work hours.",
        qFr: "Je ressens une pression financière due aux frais de santé ou à la réduction de mes heures de travail.",
        weights: { yes: 1, no: 0 }
      },
      {
        id: "c7",
        qEn: "I feel completely overwhelmed and unsure where to turn for respite or community help.",
        qFr: "Je me sens dépassé(e) et ne sais pas vers qui me tourner pour obtenir du répit.",
        weights: { yes: 1, no: 0 }
      }
    ],
    getResults: function(score, lang) {
      const isFr = lang === 'fr';
      if (score <= 2) {
        return {
          level: isFr ? "Niveau de stress modéré / gérable" : "Mild / Manageable Caregiver Strain",
          badgeClass: "badge-success",
          scoreText: `${score} / 7`,
          summary: isFr 
            ? "Vous semblez maintenir un bon équilibre, mais la prévention est essentielle dans la durée."
            : "You are currently managing well, but maintaining regular respite and self-care is vital for long-term health.",
          actions: isFr ? [
            "Participez à nos groupes virtuels mensuels d'aidants pour préserver votre énergie.",
            "Consultez notre répertoire pour vous familiariser à l'avance avec les crédits d'impôt pour aidants.",
            "Téléchargez notre guide de planification des soins familiaux."
          ] : [
            "Join our monthly virtual Caregiver Peer Circles to maintain balance and connection.",
            "Explore Canada's Caregiver Tax Credit and provincial caregiver allowances in our directory.",
            "Set healthy boundaries and maintain scheduled weekly respite time."
          ],
          programRecommendation: "prog_caregiver"
        };
      } else if (score <= 4) {
        return {
          level: isFr ? "Niveau de stress élevé — Risque d'épuisement" : "Elevated Strain — Risk of Caregiver Burnout",
          badgeClass: "badge-warning",
          scoreText: `${score} / 7`,
          summary: isFr
            ? "Vous portez une charge importante qui commence à peser sur votre santé physique et mentale."
            : "You are experiencing substantial caregiver burden. Intervening now can prevent burnout and health complications.",
          actions: isFr ? [
            "Demandez une consultation gratuite avec un navigateur familial de l'ACSSF pour planifier du répit.",
            "Contactez la ligne d'aide pour proches aidants de votre province (ex. OCO en Ontario, L'Appui au Québec).",
            "Parlez à votre médecin de famille de l'impact des soins sur votre sommeil et votre énergie."
          ] : [
            "Book a free 1-on-1 consultation with a CAFHS Family Navigator to apply for funded respite care.",
            "Connect with your provincial caregiver helpline (e.g. Ontario Caregiver Organization, FCBC, L'Appui).",
            "Delegate daily tasks or explore community volunteer meal and companion programs (2-1-1)."
          ],
          programRecommendation: "prog_caregiver"
        };
      } else {
        return {
          level: isFr ? "Épuisement critique — Soutien immédiat requis" : "High Critical Strain — Immediate Support Needed",
          badgeClass: "badge-danger",
          scoreText: `${score} / 7`,
          summary: isFr
            ? "Votre niveau de stress est critique. Vous ne devez pas traverser cette épreuve seul(e)."
            : "Your caregiver burden has reached critical levels. It is essential to prioritize your own wellbeing immediately.",
          actions: isFr ? [
            "Programmez d'urgence un rendez-vous d'admission avec un travailleur social de l'ACSSF.",
            "Appelez le 8-1-1 ou le 2-1-1 pour accéder aux services d'urgence de répit à domicile.",
            "Si vous ressentez une détresse psychologique extrême, composez ou textez le 9-8-8 sans attendre."
          ] : [
            "Book an urgent intake consultation with a CAFHS Case Manager for emergency respite allocation.",
            "Call your provincial 811 / 211 service for subsidized home care and adult day program access.",
            "If feeling overwhelmed with despair or anxiety, call or text 9-8-8 for immediate crisis support."
          ],
          programRecommendation: "prog_caregiver"
        };
      }
    }
  },

  postpartum: {
    titleEn: "Postpartum & Early Parenting Wellness Screener",
    titleFr: "Évaluation du bien-être périnatal et post-partum",
    descEn: "A 6-question gentle check-in for expectant and new mothers/parents in the first year after childbirth.",
    descFr: "Un bilan bienveillant en 6 questions pour les futures et nouvelles mères au cours de la première année.",
    questions: [
      {
        id: "p1",
        qEn: "I have been able to laugh and see the bright side of things.",
        qFr: "J'ai été capable de rire et de voir le bon côté des choses.",
        options: [
          { labelEn: "As much as I always could", labelFr: "Autant que d'habitude", val: 0 },
          { labelEn: "Not quite so much now", labelFr: "Pas autant qu'avant", val: 1 },
          { labelEn: "Definitely not so much now", labelFr: "Beaucoup moins qu'avant", val: 2 },
          { labelEn: "Not at all", labelFr: "Pas du tout", val: 3 }
        ]
      },
      {
        id: "p2",
        qEn: "I have looked forward with enjoyment to things.",
        qFr: "J'ai envisagé l'avenir avec plaisir et optimisme.",
        options: [
          { labelEn: "As much as I ever did", labelFr: "Autant que d'habitude", val: 0 },
          { labelEn: "Rather less than I used to", labelFr: "Un peu moins qu'avant", val: 1 },
          { labelEn: "Definitely less than I used to", labelFr: "Nettement moins qu'avant", val: 2 },
          { labelEn: "Hardly at all", labelFr: "Presque pas", val: 3 }
        ]
      },
      {
        id: "p3",
        qEn: "I have blamed myself unnecessarily when things went wrong.",
        qFr: "Je me suis blâmée inutilement quand les choses allaient mal.",
        options: [
          { labelEn: "No, never", labelFr: "Non, jamais", val: 0 },
          { labelEn: "Not very often", labelFr: "Pas très souvent", val: 1 },
          { labelEn: "Yes, some of the time", labelFr: "Oui, parfois", val: 2 },
          { labelEn: "Yes, most of the time", labelFr: "Oui, la plupart du temps", val: 3 }
        ]
      },
      {
        id: "p4",
        qEn: "I have been anxious or worried for no good reason.",
        qFr: "Je me suis sentie anxieuse ou inquiète sans motif sérieux.",
        options: [
          { labelEn: "No, not at all", labelFr: "Non, pas du tout", val: 0 },
          { labelEn: "Hardly ever", labelFr: "Presque jamais", val: 1 },
          { labelEn: "Yes, sometimes", labelFr: "Oui, parfois", val: 2 },
          { labelEn: "Yes, very often", labelFr: "Oui, très souvent", val: 3 }
        ]
      },
      {
        id: "p5",
        qEn: "I have felt scared or panicky without any clear reason.",
        qFr: "J'ai eu des moments de panique sans raison apparente.",
        options: [
          { labelEn: "No, not at all", labelFr: "Non, pas du tout", val: 0 },
          { labelEn: "No, not much", labelFr: "Non, rarement", val: 1 },
          { labelEn: "Yes, sometimes", labelFr: "Oui, parfois", val: 2 },
          { labelEn: "Yes, quite a lot", labelFr: "Oui, souvent", val: 3 }
        ]
      },
      {
        id: "p6",
        qEn: "Things have been getting on top of me (feeling overwhelmed).",
        qFr: "Les événements m'ont dépassée (sentiment d'être submergée).",
        options: [
          { labelEn: "No, I have been coping well", labelFr: "Non, je m'en sors bien", val: 0 },
          { labelEn: "No, most of the time I cope", labelFr: "La plupart du temps, je gère", val: 1 },
          { labelEn: "Yes, sometimes I cannot cope", labelFr: "Oui, parfois j'ai du mal", val: 2 },
          { labelEn: "Yes, most of the time I can't cope", labelFr: "Oui, je n'arrive plus à faire face", val: 3 }
        ]
      }
    ],
    getResults: function(score, lang) {
      const isFr = lang === 'fr';
      if (score <= 5) {
        return {
          level: isFr ? "Bien-être émotionnel stable / Baby blues léger" : "Stable Emotional Wellbeing / Normal Adjustment",
          badgeClass: "badge-success",
          scoreText: `${score} / 18`,
          summary: isFr
            ? "Vos réponses suggèrent une adaptation saine à la parentalité. Des hauts et des bas sont tout à fait normaux."
            : "Your score reflects normal early parenting adjustments. Minor fatigue and emotional shifts are very common in the fourth trimester.",
          actions: isFr ? [
            "Rejoignez nos cercles hebdomadaires virtuels 'Café Parents' pour échanger avec d'autres mamans.",
            "Accordez-vous des pauses sans culpabilité lorsque bébé dort.",
            "Consultez nos ressources en nutrition et allaitement."
          ] : [
            "Join our free virtual 'New Parents Coffee Circle' every Thursday at 11 AM EST.",
            "Rest without guilt and maintain open communication with your partner/support network.",
            "Bookmark our 24/7 maternal support line in case questions arise."
          ],
          programRecommendation: "prog_maternal"
        };
      } else if (score <= 10) {
        return {
          level: isFr ? "Symptômes modérés de dépression / anxiété post-partum" : "Moderate Postpartum Anxiety or Depression Symptoms",
          badgeClass: "badge-warning",
          scoreText: `${score} / 18`,
          summary: isFr
            ? "Vous vivez une période éprouvante. Ce n'est pas de votre faute et des solutions existent."
            : "You are experiencing signs of perinatal mood or anxiety strain. Remember that postpartum depression and anxiety are very treatable with the right support.",
          actions: isFr ? [
            "Inscrivez-vous à notre jumelage gratuit de doulas paires et mentorat maternel.",
            "Mentionnez vos symptômes à votre sage-femme, obstétricien ou médecin de famille.",
            "Discutez avec notre compagnon IA Nova pour trouver des cliniques spécialisées dans votre région."
          ] : [
            "Match with a free CAFHS Peer Postpartum Mentor who has walked this exact path.",
            "Schedule a visit with your family physician, OBGYN, or midwife to discuss perinatal care options.",
            "Ask our AI Companion Nova to locate perinatal mental health clinics in your province."
          ],
          programRecommendation: "prog_maternal"
        };
      } else {
        return {
          level: isFr ? "Détresse post-partum significative — Aide clinique recommandée" : "Significant Postpartum Distress — Clinical Support Advised",
          badgeClass: "badge-danger",
          scoreText: `${score} / 18`,
          summary: isFr
            ? "Vos réponses indiquent une souffrance importante. Vous méritez un soutien rapide et attentionné."
            : "Your score indicates significant emotional distress. You do not have to carry this alone — professional perinatal healthcare makes an immense positive difference.",
          actions: isFr ? [
            "Demandez une admission prioritaire avec notre équipe clinique périnatale CAFHS.",
            "Contactez la ligne 8-1-1 de votre province ou le Réseau périnatal spécialisé.",
            "Si vous avez des pensées d'automutilation ou de détresse sévère, composez immédiatement le 9-8-8."
          ] : [
            "Request priority clinical intake through CAFHS for direct psychotherapy and doula matching.",
            "Call 8-1-1 to speak with a maternal triage nurse and get fast-tracked to a reproductive mental health program.",
            "If in immediate distress or having thoughts of harm, call or text 9-8-8 (available 24/7)."
          ],
          programRecommendation: "prog_maternal"
        };
      }
    }
  }
};

window.assessments = assessments;
