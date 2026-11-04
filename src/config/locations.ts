import { GhatLocation, BridgeFeature, ProjectBoundary } from '../types/gis';

// Main Godavari Pushkar Ghat Digital Twin Focus Area (Rajamahendravaram)
export const RAJAMAHENDRAVARAM_DEFAULT_CENTER = {
  longitude: 81.7774,
  latitude: 16.9984,
  height: 1450, // Overview altitude in meters
  heading: 320,  // Looking northwest along Godavari curvature
  pitch: -38,   // 3D perspective showing bridge crossings & riverfront
  roll: 0,
};

export const GHAT_LOCATIONS: GhatLocation[] = [
  {
    id: 'pushkar-ghat',
    name: 'Godavari Pushkar Ghat [APPROXIMATE]',
    teluguName: 'గోదావరి పుష్కర ఘాట్',
    category: 'ghat',
    coordinates: {
      longitude: 81.7774,
      latitude: 16.9984,
      height: 16.5,
    },
    cameraView: {
      destination: {
        longitude: 81.7798,
        latitude: 16.9962,
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
  },
  {
    id: 'kotilingala-ghat',
    name: 'Kotilingala Ghat [APPROXIMATE]',
    teluguName: 'కోటిలింగాల ఘాట్',
    category: 'ghat',
    coordinates: {
      longitude: 81.7725,
      latitude: 17.0062,
      height: 17.0,
    },
    cameraView: {
      destination: {
        longitude: 81.7758,
        latitude: 17.0040,
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
  },
  {
    id: 'markandeya-ghat',
    name: 'Markandeya Ghat [APPROXIMATE]',
    teluguName: 'మార్కండేయ ఘాట్',
    category: 'ghat',
    coordinates: {
      longitude: 81.7801,
      latitude: 16.9940,
      height: 16.2,
    },
    cameraView: {
      destination: {
        longitude: 81.7825,
        latitude: 16.9920,
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
  },
  {
    id: 'saraswati-ghat',
    name: 'Saraswati Ghat [APPROXIMATE]',
    teluguName: 'సరస్వతి ఘాట్',
    category: 'ghat',
    coordinates: {
      longitude: 81.7670,
      latitude: 17.0125,
      height: 17.4,
    },
    cameraView: {
      destination: {
        longitude: 81.7695,
        latitude: 17.0100,
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
  },
  {
    id: 'vip-ghat',
    name: 'VIP & Protocol Ghat [APPROXIMATE]',
    teluguName: 'వీఐపీ ఘాట్',
    category: 'ghat',
    coordinates: {
      longitude: 81.7788,
      latitude: 16.9968,
      height: 16.8,
    },
    cameraView: {
      destination: {
        longitude: 81.7810,
        latitude: 16.9950,
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
  },
  {
    id: 'river-police-post',
    name: 'River Police & SDRF Rescue Post [APPROXIMATE]',
    teluguName: 'రివర్ పోలీస్ & రెస్క్యూ కేంద్రం',
    category: 'emergency',
    coordinates: {
      longitude: 81.7760,
      latitude: 16.9995,
      height: 16.0,
    },
    cameraView: {
      destination: {
        longitude: 81.7785,
        latitude: 16.9980,
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
  },
  {
    id: 'central-command-post',
    name: 'Pushkar Smart Command Centre [APPROXIMATE]',
    teluguName: 'పుష్కర స్మార్ట్ కమాండ్ కంట్రోల్ రూమ్',
    category: 'command',
    coordinates: {
      longitude: 81.7765,
      latitude: 16.9975,
      height: 22.0,
    },
    cameraView: {
      destination: {
        longitude: 81.7790,
        latitude: 16.9960,
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
  },
  {
    id: 'evacuation-ground',
    name: 'Arts College Emergency Assembly [APPROXIMATE]',
    teluguName: 'ఆర్ట్స్ కళాశాల మైదానం (ఎవాక్యుయేషన్ జోన్)',
    category: 'emergency',
    coordinates: {
      longitude: 81.7890,
      latitude: 17.0050,
      height: 24.0,
    },
    cameraView: {
      destination: {
        longitude: 81.7915,
        latitude: 17.0025,
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
  }
];

export const BRIDGES: BridgeFeature[] = [
  {
    id: 'godavari-arch-bridge',
    name: 'Godavari Arch Bridge [APPROXIMATE ALIGNMENT]',
    type: 'Prestressed Concrete Bowstring Arch',
    lengthMeters: 2750,
    yearBuilt: 1997,
    coordinates: [
      [81.7615, 16.9858],
      [81.7675, 16.9898],
      [81.7745, 16.9945],
      [81.7815, 16.9992],
      [81.7875, 17.0035]
    ],
    description: 'An architectural marvel spanning the Godavari, featuring 28 spans of 97.5m prestressed concrete arches carrying twin-track railway lines.',
    status: 'ACTIVE'
  },
  {
    id: 'havelock-bridge',
    name: 'Old Havelock Bridge [APPROXIMATE ALIGNMENT]',
    type: 'Historic Steel Girder Heritage Bridge',
    lengthMeters: 2750,
    yearBuilt: 1900,
    coordinates: [
      [81.7595, 16.9840],
      [81.7655, 16.9880],
      [81.7725, 16.9928],
      [81.7795, 16.9975],
      [81.7855, 17.0018]
    ],
    description: 'Constructed by British engineer Sir Arthur Cotton and railway pioneers in 1900. Decommissioned and now being conserved as a pedestrian heritage promenade.',
    status: 'HERITAGE'
  },
  {
    id: 'road-cum-rail-bridge',
    name: 'Road-cum-Rail Bridge [APPROXIMATE ALIGNMENT]',
    type: 'Double-Deck Steel Truss Bridge',
    lengthMeters: 4100,
    yearBuilt: 1974,
    coordinates: [
      [81.7580, 16.9825],
      [81.7640, 16.9868],
      [81.7710, 16.9915],
      [81.7780, 16.9962],
      [81.7840, 17.0005]
    ],
    description: 'Double-decker truss bridge spanning Kovvur and Rajamahendravaram with roadway on top and railway track below.',
    status: 'ACTIVE'
  }
];

export const PROJECT_BOUNDARIES: ProjectBoundary[] = [
  {
    id: 'godavari-digital-twin-core-zone',
    name: 'Pushkar Ghat Digital Twin Study Zone [APPROXIMATE]',
    description: 'Spatial study boundary covering 6.8 km of Godavari riverfront, riparian buffer, and arrival corridors. (Approximate boundary for 3D modeling).',
    areaSqKm: 8.45,
    coordinates: [
      [81.7550, 16.9780],
      [81.7650, 16.9950],
      [81.7720, 17.0180],
      [81.7820, 17.0250],
      [81.7950, 17.0150],
      [81.7920, 16.9900],
      [81.7750, 16.9750],
      [81.7550, 16.9780]
    ]
  }
];
