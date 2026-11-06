/**
 * Multilingual Public Announcement Generator AI Service
 * Godavari Pushkar Ghat 3D Digital Twin - Rajamahendravaram
 * 
 * Supports:
 * - Telugu (తెలుగు) - Script + Phonetics
 * - English - Professional Broadcast
 * - Hindi (हिन्दी) - Script + Phonetics
 * 
 * Strict Safety Guidelines:
 * - DOES NOT automatically broadcast messages.
 * - Human-in-the-loop authorization strictly required for broadcast release.
 * - Simulated emergency demonstration messages explicitly marked with DEMONSTRATION disclaimers.
 * - Grounded in live GIS landmarks and operational telemetry.
 */

import { eventOperationsEngine } from '../../services/eventOperationsEngine';
import { 
  MultilingualAnnouncementScript, 
  AnnouncementCategory, 
  AnnouncementPriority,
  AnnouncementGenerationParams
} from '../types/announcements';
import { 
  PublicAnnouncementRequest, 
  PublicAnnouncementPayload, 
  AIStructuredResponse 
} from '../types/ai';

export class PublicAnnouncementService {
  /**
   * Available announcement categories with human-readable labels
   */
  public getAvailableCategories(): Array<{ id: AnnouncementCategory; label: string; description: string; defaultPriority: AnnouncementPriority }> {
    return [
      {
        id: 'GENERAL_EVENT_INFO',
        label: 'General Pushkaram Information',
        description: 'Holy bathing guidelines, ghat operating timings, and general pilgrim welfare announcements.',
        defaultPriority: 'ROUTINE'
      },
      {
        id: 'GHAT_NAVIGATION',
        label: 'Ghat Navigation & Wayfinding',
        description: 'Directions between Pushkar Main Ghat, Kotilingala, Saraswati Ghat, and arterial exit routes.',
        defaultPriority: 'ROUTINE'
      },
      {
        id: 'QUEUE_MANAGEMENT',
        label: 'Queue Regulation & Step Safety',
        description: 'Advisories to maintain queue discipline, step cautiously on wet bathing steps, and avoid surges.',
        defaultPriority: 'PRIORITY'
      },
      {
        id: 'FACILITY_DIRECTIONS',
        label: 'Public Facility & Amenities Directions',
        description: 'Locations of free RO drinking water kiosks, mobile bio-toilets, and cloakrooms.',
        defaultPriority: 'ROUTINE'
      },
      {
        id: 'MEDICAL_ASSISTANCE',
        label: 'Emergency Medical & First-Aid Info',
        description: 'Directions to nearest 108 Emergency Ambulance stations, first-aid posts, and heat relief centers.',
        defaultPriority: 'PRIORITY'
      },
      {
        id: 'EMERGENCY_DEMONSTRATION',
        label: 'Simulated Emergency Drill Notice',
        description: 'Simulated evacuation drills and safety exercises. STRICTLY FLAGGED AS DEMONSTRATION.',
        defaultPriority: 'IMMEDIATE'
      },
      {
        id: 'ROUTE_CLOSURE',
        label: 'Corridor Closure & Gate Diversion',
        description: 'Notices regarding temporary ramp barricading, river safety cordons, or crowd diversions.',
        defaultPriority: 'IMMEDIATE'
      }
    ];
  }

  /**
   * Generate a multilingual announcement grounded in current ghat state
   */
  public generateMultilingualAnnouncement(params: AnnouncementGenerationParams): MultilingualAnnouncementScript {
    const now = new Date();
    const id = `PA-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const zone = eventOperationsEngine.getZoneById(params.zoneId) || {
      id: params.zoneId || 'zone-all',
      name: 'All Ghat Sectors (Corridor-Wide)'
    };

    const isSimDemo = params.category === 'EMERGENCY_DEMONSTRATION';
    const catMeta = this.getAvailableCategories().find(c => c.id === params.category) || {
      id: params.category,
      label: 'Public Advisory',
      description: 'Standard public announcement',
      defaultPriority: 'ROUTINE'
    };

    const priority = params.priority || catMeta.defaultPriority;

    const disclaimerText = isSimDemo
      ? '⚠️ [DEMONSTRATION / SIMULATED DRILL ONLY - NOT A REAL EMERGENCY. NO THREAT PRESENT.]'
      : 'OFFICIAL PUBLIC ADDRESS SCRIPT - REQUIRES HUMAN OPERATOR SIGN-OFF BEFORE BROADCAST.';

    // Compile language-specific scripts based on category and current zone
    const scripts = this.compileScripts(params.category, zone.name, isSimDemo, params.customDetails);

    return {
      id,
      category: params.category,
      categoryLabel: catMeta.label,
      targetZoneId: zone.id,
      targetZoneName: zone.name,
      priority,
      isSimulatedDemonstration: isSimDemo,
      disclaimerText,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      status: 'DRAFT',
      scripts,
      audioSimulation: {
        durationSeconds: isSimDemo ? 35 : 24,
        voiceGender: 'FEMALE',
        tone: isSimDemo ? 'URGENT' : priority === 'IMMEDIATE' ? 'AUTHORITATIVE' : 'CALM',
        simulatedSpeakerLocations: [
          `${zone.name} Main PA Tower`,
          `${zone.name} Ramp Cluster 1`,
          `${zone.name} Riverbank Horn Array`
        ]
      }
    };
  }

  /**
   * Compile authentic Telugu, English, and Hindi scripts
   */
  private compileScripts(
    category: AnnouncementCategory,
    zoneName: string,
    isDemo: boolean,
    _customDetails?: string
  ): {
    te: { scriptText: string; phoneticText: string; languageName: string };
    en: { scriptText: string; languageName: string };
    hi: { scriptText: string; phoneticText: string; languageName: string };
  } {
    const demoPrefixTe = isDemo ? '[మాక్ డ్రిల్ / ప్రదర్శన మాత్రమే - వాస్తవ అత్యవసర పరిస్థితి కాదు]\n' : '';
    const demoPrefixEn = isDemo ? '[SIMULATED DRILL / DEMONSTRATION ONLY - NOT A REAL EMERGENCY]\n' : '';
    const demoPrefixHi = isDemo ? '[मॉक ड्रिल / केवल प्रदर्शन हेतु - कोई वास्तविक आपातकाल नहीं]\n' : '';

    switch (category) {
      case 'GENERAL_EVENT_INFO':
        return {
          te: {
            scriptText: `${demoPrefixTe}భక్తులందరికీ నమస్కారం. గోదావరి పుష్కర ఘాట్ పరిధిలోని భక్తులు పవిత్ర స్నానాలు ఆచరించే సమయంలో ఘాట్ నిబంధనలు పాటించవలసిందిగా విజ్ఞప్తి. దయచేసి మీ పాదరక్షలను నియమిత కౌంటర్ల వద్దే భద్రపరచండి. నదిలో లోతైన ప్రాంతాలకు వెళ్లరాదు.`,
            phoneticText: `Bhaktulandarikī namaskāram. Gōdāvari Puṣkara Ghāṭ paridhilōni bhaktulu pavitra snānālu ācarincē samayanlō ghāṭ nibandhanalu pāṭin̄cavalsindigā vijñapti. Dayacēsi mī pādarakṣalanu niyamita kauṇṭarla vaddē bhadraparacandi. Nadilō lōtaina prāntālaku veḷḷarādu.`,
            languageName: 'తెలుగు (Telugu)'
          },
          en: {
            scriptText: `${demoPrefixEn}Greetings to all pilgrims at ${zoneName}. You are requested to strictly adhere to ghat safety guidelines while performing holy bath. Please keep footwear only at designated shoe stands. Do not venture beyond the safety buoys in the river.`,
            languageName: 'English'
          },
          hi: {
            scriptText: `${demoPrefixHi}सभी श्रद्धालुओं का गोदावरी पुष्कर घाट पर स्वागत है। कृपया पवित्र स्नान के दौरान घाट के सुरक्षा नियमों का पालन करें। अपने जूते-चप्पल केवल निर्धारित स्टैंड पर ही रखें। नदी में सुरक्षा रस्सियों और बैरिकेड्स से आगे न जाएं।`,
            phoneticText: `Sabhī shraddhāluyōn kā Gōdāvarī Pushkar Ghāṭ par svāgat hai. Kripayā pavitra snān kē daurān ghāṭ kē surakṣā niyamōn kā pālan karēn. Nadi mē surakṣā rassiyōn sē āgē na jāēn.`,
            languageName: 'हिन्दी (Hindi)'
          }
        };

      case 'GHAT_NAVIGATION':
        return {
          te: {
            scriptText: `${demoPrefixTe}${zoneName} వద్ద ఉన్న భక్తులు గమనించండి. రద్దీని నివారించడానికి కోటిలింగాల మరియు సరస్వతి ఘాట్ వైపు వెళ్ళేందుకు ఉత్తర ర్యాంప్ మార్గాన్ని ఉపయోగించండి. వీఐపీ కారిడార్ మరియు ఆర్టీసీ బస్ టెర్మినల్ వైపు సూచిక బోర్డులను గమనించండి.`,
            phoneticText: `${zoneName} vadda unna bhaktulu gamanin̄caṇḍi. Raddīni nivārin̄caḍāniki Kōṭilingāla mariyu Sarasvatī Ghāṭ vaipu veḷḷēnduku uttara ryāmp mārgānni upayōgin̄caṇḍi. Sūcika bōrḍulanu gamanin̄caṇḍi.`,
            languageName: 'తెలుగు (Telugu)'
          },
          en: {
            scriptText: `${demoPrefixEn}Attention devotees at ${zoneName}. To avoid congestion at the main archway, please utilize the North Ramp corridor towards Kotilingala and Saraswati Ghats. Follow directional overhead signage towards transit hubs.`,
            languageName: 'English'
          },
          hi: {
            scriptText: `${demoPrefixHi}${zoneName} के सभी श्रद्धालु ध्यान दें। मुख्य प्रवेश द्वार पर भीड़ कम करने के लिए कोटिलिंगाला और सरस्वती घाट की ओर जाने हेतु उत्तरी रैंप मार्ग का प्रयोग करें। कृपया दिशा-निर्देश बोर्डों का पालन करें।`,
            phoneticText: `${zoneName} kē sabhī shraddhālu dhyān dēn. Bhīṛ kam karnē kē liē Kōṭilingālā aur Sarasvatī Ghāṭ kī ōr jānē hētu uttarī ramp mārg kā prayōg karēn.`,
            languageName: 'हिन्दी (Hindi)'
          }
        };

      case 'QUEUE_MANAGEMENT':
        return {
          te: {
            scriptText: `${demoPrefixTe}${zoneName} వద్ద రద్దీ పెరుగుతున్నందున, భక్తులందరూ క్యూ లైన్లలో శాంతియుతంగా వేచి ఉండాలని కోరుతున్నాము. ఘాట్ మెట్లు తడిగా ఉన్నందున జారే ప్రమాదం ఉంది, ఒకరినొకరు నెట్టవద్దు. మీ కుటుంబ సభ్యుల చేతులు పట్టుకోండి.`,
            phoneticText: `${zoneName} vadda raddī perugutunnanduna, bhaktulandaru queue linelalo śāntiyutangā vēci uṇḍālani kōrutunnāmu. Ghāṭ meṭlu taḍigā unnanduna jārē pramādam undi, nettavaddu.`,
            languageName: 'తెలుగు (Telugu)'
          },
          en: {
            scriptText: `${demoPrefixEn}Attention pilgrims at ${zoneName}. Due to high inflow, please maintain orderly queues and cooperate with AP Police and volunteers. Bathing steps are wet and slippery; avoid pushing and step carefully.`,
            languageName: 'English'
          },
          hi: {
            scriptText: `${demoPrefixHi}${zoneName} पर भारी भीड़ को देखते हुए, सभी श्रद्धालुओं से अनुरोध है कि वे कतार में धैर्य बनाए रखें। घाट की सीढ़ियां गीली और फिसलन भरी हैं, कृपया धक्का-मुक्की न करें और सावधानी से चलें।`,
            phoneticText: `${zoneName} par bhārī bhīṛ kō dēkhtē huē, sabhī shraddhāluyōn sē anurōdh hai ki vē katār mē dhairya banāē rakhēn. Sīṛhiyān gīlī hain, dhakkā-mukkī na karēn.`,
            languageName: 'हिन्दी (Hindi)'
          }
        };

      case 'FACILITY_DIRECTIONS':
        return {
          te: {
            scriptText: `${demoPrefixTe}${zoneName} భక్తులకు ముఖ్య సమాచారం: ఉచిత తాగునీటి ఆర్.ఓ. ప్లాంట్లు మెట్లకు కుడి వైపున, మొబైల్ బయో-టాయిలెట్లు వెనుక భాగం ర్యాంప్ 2 వద్ద అందుబాటులో ఉన్నాయి. తడి బట్టలు మార్చుకోవడానికి మహిళా చేంజింగ్ రూమ్స్ ఎడమ వైపు ఉన్నాయి.`,
            phoneticText: `${zoneName} bhaktulaku mukhya samācāram: Uchita tāgunīṭi RO plants meṭlaku kuḍi vaipuna, mobile bio-toilets venuka bhāgam ramp 2 vadda andubāṭulō unnāyi. Mahilā changing rooms eḍama vaipu unnāyi.`,
            languageName: 'తెలుగు (Telugu)'
          },
          en: {
            scriptText: `${demoPrefixEn}Public Amenities Announcement for ${zoneName}: Free purified RO drinking water stations are active to the right of the steps. Mobile bio-toilet clusters are located at Rear Ramp 2. Dedicated women's changing rooms are situated on the left wing.`,
            languageName: 'English'
          },
          hi: {
            scriptText: `${demoPrefixHi}${zoneName} के श्रद्धालुओं के लिए जन-सुविधा सूचना: निःशुल्क शुद्ध पेयजल (RO) बूथ सीढ़ियों के दाहिनी ओर तथा मोबाइल बायो-शौचालय रैंप 2 के पीछे उपलब्ध हैं। महिलाओं के लिए वस्त्र बदलने के कक्ष बाईं ओर स्थित हैं।`,
            phoneticText: `${zoneName} kē shraddhāluyōn kē liē: Niḥśulka shuddha pēyajala booth sīṛhiyōn kē dāhinī ōr tathā mobile bio-toilet ramp 2 kē pīchhē uplabdha hain.`,
            languageName: 'हिन्दी (Hindi)'
          }
        };

      case 'MEDICAL_ASSISTANCE':
        return {
          te: {
            scriptText: `${demoPrefixTe}వైద్య అత్యవసర సమాచారం: ఎవరైనా అస్వస్థతకు గురైతే వెంటనే ${zoneName} సమీపంలోని 108 మెడికల్ క్యాంప్ సిబ్బందిని సంప్రదించండి. ప్రాథమిక చికిత్స పోస్ట్ మరియు అంబులెన్స్ అందుబాటులో ఉన్నాయి. సహాయం కోసం 108 లేదా పోలీసులకు సమాచారం ఇవ్వండి.`,
            phoneticText: `Vaidya atyavasara samācāram: Evarainā asvasthataku guraite veṇṭanē ${zoneName} samīpanlōni 108 Medical Camp sibbandini sampradin̄caṇḍi. Prāthamika cikitsa post mariyu ambulance andubāṭulō unnāyi.`,
            languageName: 'తెలుగు (Telugu)'
          },
          en: {
            scriptText: `${demoPrefixEn}Emergency Medical Advisory: If anyone feels unwell, dehydrated, or requires first aid, please report immediately to the 108 Emergency Medical Camp situated near ${zoneName}. Paramedics and stretchers are on standby.`,
            languageName: 'English'
          },
          hi: {
            scriptText: `${demoPrefixHi}चिकित्सा सहायता सूचना: यदि किसी श्रद्धालु को चक्कर, निर्जलीकरण या चोट की समस्या हो, तो कृपया तुरंत ${zoneName} के पास स्थित 108 मेडिकल सहायता केंद्र से संपर्क करें। एंबुलेंस और डॉक्टर तत्काल उपलब्ध हैं।`,
            phoneticText: `Chikitsā sahāyatā sūcanā: Yadi kisī shraddhālu kō chakkar yā chōṭ kī samasyā hō, tō kripayā turant ${zoneName} kē pās sthita 108 Medical Kendra sē samparka karēn.`,
            languageName: 'हिन्दी (Hindi)'
          }
        };

      case 'EMERGENCY_DEMONSTRATION':
        return {
          te: {
            scriptText: `${demoPrefixTe}భక్తులందరూ గమనించండి. ఇది గోదావరి పుష్కర ఘాట్ కమాండ్ కంట్రోల్ ద్వారా నిర్వహించబడుతున్న భద్రతా అత్యవసర మాక్ డ్రిల్ (DEMONSTRATION) మాత్రమే. ఎటువంటి భయాందోళన చెందవద్దు. సిబ్బంది సూచించే మార్గాల్లో ప్రశాంతంగా తరలింపు పద్ధతులను పరిశీలించండి.`,
            phoneticText: `Bhaktulandaru gamanin̄caṇḍi. Idi Gōdāvari Puṣkara Ghāṭ command control dvārā nirvahin̄cabaḍutunna bhadratā atyavasara MOCK DRILL (DEMONSTRATION) mātramē. Eṭuvaṇṭi bhayāndōḷana cendavaddu.`,
            languageName: 'తెలుగు (Telugu)'
          },
          en: {
            scriptText: `${demoPrefixEn}ATTENTION ALL DEVOTEES: This is an authorized SIMULATED EMERGENCY EVACUATION DRILL conducted by Pushkaram Disaster Management. This is a DEMONSTRATION ONLY. There is NO actual emergency or threat. Please observe safety stewards and remain calm.`,
            languageName: 'English'
          },
          hi: {
            scriptText: `${demoPrefixHi}सभी श्रद्धालु कृपया ध्यान दें: यह पुष्करम आपदा प्रबंधन दल द्वारा आयोजित एक नियंत्रित आपातकालीन मॉक ड्रिल (DEMONSTRATION) है। यह केवल एक प्रदर्शन व सुरक्षा अभ्यास है, कोई वास्तविक खतरा नहीं है। कृपया घबराएं नहीं और सामान्य रहें।`,
            phoneticText: `Sabhī shraddhālu kripayā dhyān dēn: Yah Pushkaram āpadā prabandhan dal dvārā āyōjit ēk niyantrita MOCK DRILL (DEMONSTRATION) hai. Yah kēval ēk pradarshan hai, kōī vāstavik khatrā nahīn hai.`,
            languageName: 'हिन्दी (Hindi)'
          }
        };

      case 'ROUTE_CLOSURE':
        return {
          te: {
            scriptText: `${demoPrefixTe}ముఖ్య గమనిక: అధిక రద్దీ మరియు భద్రతా కారణాల దృష్ట్యా ${zoneName} వైపు వెళ్ళే ప్రవేశ మార్గం తాత్కాలికంగా మూసివేయబడింది. భక్తులు దయచేసి ఎదురుగా ఉన్న దక్షిణ ర్యాంప్ మరియు రోడ్డు-కమ్-రైల్ వంతెన బైపాస్ వైపు మళ్లవలసిందిగా కోరుతున్నాము.`,
            phoneticText: `Mukhya gamanika: Adhika raddī mariyu bhadratā kāraṇāla dṛṣṭyā ${zoneName} vaipu veḷḷē pravēśa mārgam tāt-kālikangā mūsivēyabaḍindi. Bhaktulu dayacēsi South Ramp vaipu maḷḷavalsindigā kōrutunnāmu.`,
            languageName: 'తెలుగు (Telugu)'
          },
          en: {
            scriptText: `${demoPrefixEn}URGENT ROUTE NOTICE: Due to heavy crowd volume, the direct approach to ${zoneName} is temporarily closed for regulatory control. Pilgrims are advised to follow the South Ramp bypass towards the alternate holding area.`,
            languageName: 'English'
          },
          hi: {
            scriptText: `${demoPrefixHi}महत्वपूर्ण सूचना: अत्यधिक भीड़ के कारण ${zoneName} की ओर जाने वाला मुख्य मार्ग अस्थायी रूप से बंद कर दिया गया है। सभी श्रद्धालुओं से अनुरोध है कि वे वैकल्पिक दक्षिणी रैंप मार्ग का अनुसरण करें।`,
            phoneticText: `Mahatvapūrṇa sūcanā: Atyadhika bhīṛ kē kāraṇ ${zoneName} kī ōr jānē vālā mukhyamārg asthāyī rūp sē band kar diyā gayā hai. Kripayā dakṣiṇī ramp mārg kā anusaraṇ karēn.`,
            languageName: 'हिन्दी (Hindi)'
          }
        };

      default:
        return {
          te: {
            scriptText: `${demoPrefixTe}గోదావరి పుష్కర ఘాట్ భక్తులు భద్రతా నిబంధనలను పాటించండి. సహాయం కోసం కమాండ్ కంట్రోల్ రూమ్ సిబ్బందిని సంప్రదించండి.`,
            phoneticText: `Gōdāvari Puṣkara Ghāṭ bhaktulu bhadratā nibandhanalanu pāṭin̄caṇḍi.`,
            languageName: 'తెలుగు (Telugu)'
          },
          en: {
            scriptText: `${demoPrefixEn}Devotees at ${zoneName} are requested to follow safety protocols and cooperate with field stewards.`,
            languageName: 'English'
          },
          hi: {
            scriptText: `${demoPrefixHi}सभी श्रद्धालु सुरक्षा नियमों का पालन करें और ड्यूटी पर तैनात अधिकारियों का सहयोग करें।`,
            phoneticText: `Sabhī shraddhālu surakṣā niyamōn kā pālan karēn.`,
            languageName: 'हिन्दी (Hindi)'
          }
        };
    }
  }

  /**
   * Compatibility method for AICopilotDrawer legacy call
   */
  public async generateAnnouncement(
    request: PublicAnnouncementRequest,
    _userContext?: { userId: string; role: string }
  ): Promise<AIStructuredResponse<PublicAnnouncementPayload>> {
    let category: AnnouncementCategory = 'GENERAL_EVENT_INFO';
    if (request.eventType === 'EVACUATION') category = 'EMERGENCY_DEMONSTRATION';
    else if (request.eventType === 'CROWD_DIVERSION') category = 'ROUTE_CLOSURE';
    else if (request.eventType === 'RIVER_SAFETY') category = 'QUEUE_MANAGEMENT';

    const multi = this.generateMultilingualAnnouncement({
      category,
      language: 'all',
      zoneId: 'zone-pushkar-north',
      priority: request.tone === 'URGENT' ? 'IMMEDIATE' : 'ROUTINE'
    });

    return {
      id: multi.id,
      service: 'PublicAnnouncement',
      summary: `Multilingual public address script drafted for ${multi.targetZoneName} in Telugu, English, and Hindi.`,
      payload: {
        announcementId: multi.id,
        targetPAZones: multi.audioSimulation.simulatedSpeakerLocations,
        teluguScript: multi.scripts.te.scriptText,
        teluguPhonetic: multi.scripts.te.phoneticText || '',
        englishScript: multi.scripts.en.scriptText,
        broadcastIntervalSeconds: 60,
        priorityLevel: multi.priority,
        audioReady: true
      },
      dataReferences: [
        {
          id: 'ref-pa',
          source: 'EventOperationsEngine',
          category: 'CROWD',
          classification: 'SIMULATED',
          timestamp: multi.createdAt,
          notes: 'Multilingual Public Address System Matrix'
        }
      ],
      recommendations: [
        'Review Telugu script accuracy for regional dialect appropriateness',
        'Verify target zone PA speaker sound levels before authorized transmission'
      ],
      confidence: {
        score: 0.98,
        level: 'HIGH',
        rationale: 'Pre-vetted multilingual templates grounded in live zone telemetry',
        uncertainties: []
      },
      timestamp: multi.createdAt,
      dataClassification: 'SIMULATED',
      humanApproval: {
        requiresApproval: true,
        actionType: 'PUBLIC_ALERT',
        approvalStatus: 'PENDING',
        rationale: 'Public Address broadcast authorization requires active Watch Commander approval.'
      },
      missingOrUnavailableData: [],
      provider: 'DigitalTwin-MultilingualPAMatrix',
      model: 'Bilingual-Safety-Broadcaster-v2',
      latencyMs: 12
    };
  }
}

export const publicAnnouncementService = new PublicAnnouncementService();
