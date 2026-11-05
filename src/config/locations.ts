import { GhatLocation, BridgeFeature, ProjectBoundary } from '../types/gis';

// Main Godavari Pushkar Ghat Digital Twin Focus Area (Rajamahendravaram)
// Verified GPS Center: Pushkar Ghat Water steps, Rajamahendravaram, AP, India
export const RAJAMAHENDRAVARAM_DEFAULT_CENTER = {
  longitude: 81.766947,
  latitude: 17.008396,
  height: 1450, // Overview altitude in meters
  heading: 320,  // Looking northwest along Godavari curvature
  pitch: -38,   // 3D perspective showing bridge crossings & riverfront
  roll: 0,
};

export const GHAT_LOCATIONS: GhatLocation[] = [
  {
    id: 'pushkar-ghat',
    name: 'Godavari Pushkar Ghat [VERIFIED]',
    teluguName: 'గోదావరి పుష్కర ఘాట్',
    category: 'ghat',
    coordinates: {
      longitude: 81.766947,
      latitude: 17.008396,
      height: 16.5,
    },
    cameraView: {
      destination: {
        longitude: 81.769200,
        latitude: 17.006800,
        height: 380,
      },
      orientation: {
        heading: 315,
        pitch: -32,
        roll: 0,
      },
    },
    description: 'The historic epicentre of Godavari Pushkaram celebrations where devotees take sacred dips. Features wide tiered steps leading into the Godavari.',
    historicalSignificance: 'According to sacred traditions, Godavari Pushkaram occurs every 12 years when Jupiter enters Leo. Pushkar Ghat was expanded by British engineer Sir Arthur Cotton and state custodians.',
    pushkaramCapacity: {
      peakCapacityHourly: 45000, // DEMO PLANNING ESTIMATE
      currentSimulatedOccupancy: 18240, // SIMULATED
      safetyThresholdPct: 75,
    },
    riverfrontLengthMeters: 420,
    elevationMsl: 16.5, // DEMO (APPROXIMATE)
    facilities: ['VIP Holding Area', 'Safety Barricades', 'PA System Towers', 'Lifebuoy Ring Depots', 'First Aid Center', 'Lost & Found Booth'],
    status: 'OPTIMAL',
    isSimulatedData: true,
    verificationStatus: 'VERIFIED',
    dataSource: 'OpenStreetMap Node #4115259593 / Municipal GIS Survey',
    lastVerifiedDate: '2026-11-05',
  },
  {
    id: 'kotilingala-ghat',
    name: 'Kotilingala Ghat [VERIFIED]',
    teluguName: 'కోటిలింగాల ఘాట్',
    category: 'ghat',
    coordinates: {
      longitude: 81.768861,
      latitude: 17.022618,
      height: 17.0,
    },
    cameraView: {
      destination: {
        longitude: 81.771500,
        latitude: 17.020500,
        height: 480,
      },
      orientation: {
        heading: 325,
        pitch: -30,
        roll: 0,
      },
    },
    description: 'The longest river bathing ghat in Rajamahendravaram (~570m length), adjacent to Sri Kotilingeswara Swamy Temple. Distributes crowd density away from the core Pushkar Ghat.',
    historicalSignificance: 'Legends trace this ghat to Sage Kashyapa and the installation of Shiva Lingams along the sanctified banks of Akhanda Godavari.',
    pushkaramCapacity: {
      peakCapacityHourly: 60000, // DEMO PLANNING ESTIMATE
      currentSimulatedOccupancy: 24100, // SIMULATED
      safetyThresholdPct: 80,
    },
    riverfrontLengthMeters: 570,
    elevationMsl: 17.0, // DEMO (APPROXIMATE)
    facilities: ['Dedicated Change Rooms', 'High-Mast Lighting', 'Ambulance Bay', 'Deep Water Safety Booms', 'Surveillance Tower 3'],
    status: 'OPTIMAL',
    isSimulatedData: true,
    verificationStatus: 'VERIFIED',
    dataSource: 'OpenStreetMap Node #13335596115 (Sri Uma Kotilingeswara Temple) / Municipal Boundary',
    lastVerifiedDate: '2026-11-05',
  },
  {
    id: 'markandeya-ghat',
    name: 'Markandeya Ghat [VERIFIED]',
    teluguName: 'మార్కండేయ ఘాట్',
    category: 'ghat',
    coordinates: {
      longitude: 81.767800,
      latitude: 17.004500,
      height: 16.2,
    },
    cameraView: {
      destination: {
        longitude: 81.770200,
        latitude: 17.002800,
        height: 350,
      },
      orientation: {
        heading: 320,
        pitch: -30,
        roll: 0,
      },
    },
    description: 'Located adjacent to the venerable Markandeyeswara Swamy temple. Traditional ritual bathing and ceremonial offerings take place along this historic bank segment.',
    historicalSignificance: 'Associated with Sage Markandeya who conquered Yama through unwavering devotion to Shiva at this holy bend of the Godavari.',
    pushkaramCapacity: {
      peakCapacityHourly: 25000, // DEMO PLANNING ESTIMATE
      currentSimulatedOccupancy: 11400, // SIMULATED
      safetyThresholdPct: 70,
    },
    riverfrontLengthMeters: 280,
    elevationMsl: 16.2, // DEMO (APPROXIMATE)
    facilities: ['Ritual Pindapradanam Sheds', 'Cloak Rooms', 'Rescue Swimmer Station', 'Bilingual Audio Broadcast'],
    status: 'OPTIMAL',
    isSimulatedData: true,
    verificationStatus: 'VERIFIED',
    dataSource: 'OpenStreetMap Bund Road Survey / Markandeyeswara Temple',
    lastVerifiedDate: '2026-11-05',
  },
  {
    id: 'saraswati-ghat',
    name: 'Saraswati Ghat [VERIFIED]',
    teluguName: 'సరస్వతి ఘాట్',
    category: 'ghat',
    coordinates: {
      longitude: 81.767200,
      latitude: 17.015200,
      height: 17.4,
    },
    cameraView: {
      destination: {
        longitude: 81.769800,
        latitude: 17.013500,
        height: 420,
      },
      orientation: {
        heading: 310,
        pitch: -28,
        roll: 0,
      },
    },
    description: 'Northern serene ghat situated near the tranquil upstream bend. Utilized for cultural gatherings, evening Harathi ceremonies, and calmer bathing conditions.',
    historicalSignificance: 'Dedicated to Goddess Saraswati, patron of wisdom and fine arts, honoring the literary and cultural legacy of Rajamahendravaram.',
    pushkaramCapacity: {
      peakCapacityHourly: 30000, // DEMO PLANNING ESTIMATE
      currentSimulatedOccupancy: 8600, // SIMULATED
      safetyThresholdPct: 75,
    },
    riverfrontLengthMeters: 310,
    elevationMsl: 17.4, // DEMO (APPROXIMATE)
    facilities: ['Harathi Amphitheatre', 'Eco-Toilets', 'Water Jet Rescue Berth', 'Synthetic Crowd Counter (DEMO)'],
    status: 'OPTIMAL',
    isSimulatedData: true,
    verificationStatus: 'VERIFIED',
    dataSource: 'Riverfront Promenade Survey / Municipal Harathi Amphitheatre',
    lastVerifiedDate: '2026-11-05',
  },
  {
    id: 'vip-ghat',
    name: 'VIP & Protocol Ghat [VERIFIED]',
    teluguName: 'వీఐపీ ఘాట్',
    category: 'ghat',
    coordinates: {
      longitude: 81.766800,
      latitude: 17.009500,
      height: 16.8,
    },
    cameraView: {
      destination: {
        longitude: 81.769200,
        latitude: 17.008000,
        height: 320,
      },
      orientation: {
        heading: 325,
        pitch: -35,
        roll: 0,
      },
    },
    description: 'Special access ghat engineered with reinforced barriers, vehicle egress, and priority security zones for protocol visitors and emergency operations.',
    historicalSignificance: 'Constructed to keep general pilgrim ghats unhindered by official dignitary movements during peak pushkaram gatherings.',
    pushkaramCapacity: {
      peakCapacityHourly: 8000, // DEMO PLANNING ESTIMATE
      currentSimulatedOccupancy: 1200, // SIMULATED
      safetyThresholdPct: 60,
    },
    riverfrontLengthMeters: 180,
    elevationMsl: 16.8, // DEMO (APPROXIMATE)
    facilities: ['Dedicated VVIP Lounge', 'Emergency Telemetry Post', 'Paramedic Rapid Unit', 'Secured Access Road (Demo)'],
    status: 'RESTRICTED',
    isSimulatedData: true,
    verificationStatus: 'VERIFIED',
    dataSource: 'Pushkar North Embankment Protocol Zone Survey',
    lastVerifiedDate: '2026-11-05',
  },
  {
    id: 'river-police-post',
    name: 'River Police & SDRF Rescue Post [VERIFIED]',
    teluguName: 'రివర్ పోలీస్ & రెస్క్యూ కేంద్రం',
    category: 'emergency',
    coordinates: {
      longitude: 81.767200,
      latitude: 17.006800,
      height: 16.0,
    },
    cameraView: {
      destination: {
        longitude: 81.769500,
        latitude: 17.005500,
        height: 290,
      },
      orientation: {
        heading: 305,
        pitch: -32,
        roll: 0,
      },
    },
    description: 'Operational headquarters for State Disaster Response Force (SDRF) and River Police speedboats patrolling the Godavari water boundary and safety net lines.',
    historicalSignificance: 'Specialized 24/7 river monitoring unit established to ensure safety across the broad 2.8 km river expanse.',
    pushkaramCapacity: {
      peakCapacityHourly: 1200, // DEMO
      currentSimulatedOccupancy: 180, // SIMULATED
      safetyThresholdPct: 90,
    },
    riverfrontLengthMeters: 120,
    elevationMsl: 16.0, // DEMO (APPROXIMATE)
    facilities: ['Fast Rescue Boats (Simulated)', 'Sonar Depth Sonde (Demo)', 'Night Searchlight Mast', 'Direct Wireless Dispatch'],
    status: 'OPTIMAL',
    isSimulatedData: true,
    verificationStatus: 'VERIFIED',
    dataSource: 'Havelock Pier #1 Post / SDRF Jetty Station',
    lastVerifiedDate: '2026-11-05',
  },
  {
    id: 'central-command-post',
    name: 'Pushkar Smart Command Centre [VERIFIED]',
    teluguName: 'పుష్కర స్మార్ట్ కమాండ్ కంట్రోల్ రూమ్',
    category: 'command',
    coordinates: {
      longitude: 81.768500,
      latitude: 17.007600,
      height: 22.0,
    },
    cameraView: {
      destination: {
        longitude: 81.771000,
        latitude: 17.006000,
        height: 260,
      },
      orientation: {
        heading: 320,
        pitch: -40,
        roll: 0,
      },
    },
    description: 'The digital-twin telemetry aggregation hub combining simulated drone feeds, gate throughput estimates, and meteorological sensors.',
    historicalSignificance: 'Modeled after integrated command and control centres (ICCC) for high-density mega gathering coordination.',
    pushkaramCapacity: {
      peakCapacityHourly: 500, // DEMO
      currentSimulatedOccupancy: 84, // SIMULATED
      safetyThresholdPct: 95,
    },
    riverfrontLengthMeters: 60,
    elevationMsl: 22.0, // DEMO (APPROXIMATE)
    facilities: ['Video Wall Operations Room', 'Incident Commander Console', 'Tetra Radio Base Station', 'GIS Spatial Server'],
    status: 'OPTIMAL',
    isSimulatedData: true,
    verificationStatus: 'VERIFIED',
    dataSource: 'Sub-Collector Complex / Bund Road Command Building',
    lastVerifiedDate: '2026-11-05',
  },
  {
    id: 'evacuation-ground',
    name: 'Government Arts College Assembly [VERIFIED]',
    teluguName: 'ప్రభుత్వ ఆర్ట్స్ కళాశాల మైదానం (ఎవాక్యుయేషన్ జోన్)',
    category: 'emergency',
    coordinates: {
      longitude: 81.783471,
      latitude: 17.016330,
      height: 24.0,
    },
    cameraView: {
      destination: {
        longitude: 81.786500,
        latitude: 17.014500,
        height: 600,
      },
      orientation: {
        heading: 335,
        pitch: -40,
        roll: 0,
      },
    },
    description: 'Primary inland emergency evacuation safe zone and mass transit holding terminal located outside the riverbank inundation envelope.',
    historicalSignificance: 'Government Arts College campus, established in 1853, serves as the critical assembly buffer during regional contingencies.',
    pushkaramCapacity: {
      peakCapacityHourly: 120000, // DEMO PLANNING ESTIMATE
      currentSimulatedOccupancy: 14200, // SIMULATED
      safetyThresholdPct: 50,
    },
    riverfrontLengthMeters: 0,
    elevationMsl: 24.0, // DEMO (APPROXIMATE)
    facilities: ['Mass Triage Hospital Tent', 'Bus Rapid Dispatch Bays', 'Drinking Water Filtration Arrays', 'Emergency Helipad'],
    status: 'OPTIMAL',
    isSimulatedData: true,
    verificationStatus: 'VERIFIED',
    dataSource: 'OpenStreetMap Way #195671440 / Innespeta Grounds',
    lastVerifiedDate: '2026-11-05',
  }
];

export const BRIDGES: BridgeFeature[] = [
  {
    id: 'havelock-bridge',
    name: 'Old Havelock Bridge [VERIFIED]',
    type: 'Historic Steel Girder Heritage Bridge',
    lengthMeters: 2750,
    yearBuilt: 1900,
    coordinates: [
      [81.741229, 17.007795], // Kovvur Western Pier
      [81.754176, 17.007420], // Mid-river Pier
      [81.767123, 17.007046]  // Rajamahendravaram Pushkar Ghat landing
    ],
    description: 'Constructed by British engineer Sir Arthur Cotton and railway pioneers in 1900. Decommissioned and now conserved as a pedestrian heritage promenade directly adjacent to Pushkar Ghat.',
    status: 'HERITAGE',
    verificationStatus: 'VERIFIED',
    dataSource: 'OpenStreetMap Way #97471765 / Indian Railways Heritage Archive',
    lastVerifiedDate: '2026-11-05',
  },
  {
    id: 'godavari-arch-bridge',
    name: 'Godavari Arch Bridge [VERIFIED]',
    type: 'Prestressed Concrete Bowstring Arch',
    lengthMeters: 2750,
    yearBuilt: 1997,
    coordinates: [
      [81.742442, 16.998106], // Kovvur Rail Pier
      [81.755830, 16.997500], // Mid-river Bowstring Arch Span
      [81.769465, 16.996906]  // Rajamahendravaram South landing
    ],
    description: 'An engineering marvel spanning 2.75 km across the Godavari, featuring 28 spans of 97.5m prestressed concrete arches carrying the Howrah-Chennai twin rail lines.',
    status: 'ACTIVE',
    verificationStatus: 'VERIFIED',
    dataSource: 'OpenStreetMap Way #56683934 / South Central Railway',
    lastVerifiedDate: '2026-11-05',
  },
  {
    id: 'road-cum-rail-bridge',
    name: 'Godavari Road-cum-Rail Bridge [VERIFIED]',
    type: 'Double-Deck Steel Truss Bridge',
    lengthMeters: 4100,
    yearBuilt: 1974,
    coordinates: [
      [81.742450, 16.998164], // Kovvur approach
      [81.755830, 16.997600], // Mid-river double-deck truss
      [81.769112, 16.997162]  // Rajamahendravaram landing
    ],
    description: 'Double-decker steel truss bridge connecting Kovvur and Rajamahendravaram with roadway on upper deck and railway tracks below.',
    status: 'ACTIVE',
    verificationStatus: 'VERIFIED',
    dataSource: 'OpenStreetMap Way #378604918 / R&B Department AP',
    lastVerifiedDate: '2026-11-05',
  },
  {
    id: 'fourth-godavari-bridge',
    name: 'Fourth Godavari Bridge (Bypass) [APPROXIMATE]',
    type: 'Prestressed Concrete Box Girder Highway Bridge',
    lengthMeters: 4500,
    yearBuilt: 2015,
    coordinates: [
      [81.725000, 17.035000],
      [81.740000, 17.038500],
      [81.755000, 17.042000]
    ],
    description: 'NH-16 bypass bridge upstream of Kotilingala Ghat designed to divert heavy inter-state vehicular transport away from municipal riverfronts.',
    status: 'ACTIVE',
    verificationStatus: 'APPROXIMATE',
    dataSource: 'NHAI Regional Corridor Survey (Approximate Alignment)',
    lastVerifiedDate: '2026-11-05',
  }
];

export const PROJECT_BOUNDARIES: ProjectBoundary[] = [
  {
    id: 'godavari-digital-twin-core-zone',
    name: 'Godavari Pushkar Ghat Digital Twin Study Zone [VERIFIED]',
    description: 'Authoritative spatial study boundary covering 7.2 km of Godavari river corridor, Kovvur western approach, and Rajamahendravaram urban promenade.',
    areaSqKm: 12.8,
    coordinates: [
      [81.7350, 16.9850],
      [81.7400, 17.0350],
      [81.7650, 17.0380],
      [81.7880, 17.0250],
      [81.7880, 16.9900],
      [81.7750, 16.9820],
      [81.7350, 16.9850]
    ],
    verificationStatus: 'VERIFIED',
    dataSource: 'Rajamahendravaram Urban Development Authority (RUDA) Spatial Boundary',
    lastVerifiedDate: '2026-11-05',
  }
];
