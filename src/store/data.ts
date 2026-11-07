import { v4 as uuid } from "uuid";
import * as bcrypt from "bcryptjs";

export type QueueStatus =
  | "in_job"
  | "in_queue"
  | "unregistered"
  | "payment_pending";

export interface CheckpointProfile {
  id: string;
  name: string;
  sthaniyaSangh: string;
  email: string;
  passwordHash: string;
  checkpointType: string;
  province: string;
  district: string;
  region: string;
  geoLocation: string | null;
  status: "active" | "inactive";
}

export interface CheckpointUser {
  id: string;
  name: string;
  address: string | null;
  contact: string;
  email: string;
  provinceId: string;
  districtId: string;
  isActive: boolean;
}

export interface Vehicle {
  id: string;
  plateNo: string;
  lotNo: string | null;
  vehicleNumber: string;
  vehicleTypeId: string;
  vehicleType: string;
  sanghId: string;
  sanghName: string | null;
  ownerId: string;
  ownerName: string | null;
  mobile: string | null;
  email: string | null;
  form: Record<string, any>;
  general: Record<string, any>;
  tareWeight: number;
  sub: Record<string, any[]>; // documents, owners, etc.
  auditLogs: {
    id: string;
    at: string;
    user: string;
    action: string;
    detail: string;
  }[];
}

export interface VehicleOwner {
  id: string;
  name: string;
  email: string | null;
  address: string;
  phone: string;
  linkedOwner: string | null;
  isAssigned: boolean;
  isVerified: boolean;
  form: Record<string, any>;
  province: string;
  district: string;
  files: Record<string, string>;
  banks: any[];
}

export interface OtherVehicle {
  id: string;
  kind: "indian" | "unregistered";
  vehicleNumber: string;
  vehicleTypeId: string;
  vehicleType: string;
  plateTypeId?: string;
}

export interface Queue {
  id: string;
  queueNumber: string;
  vehicleNumber: string;
  vehicleId?: string;
  vehicleType: string;
  cardType: string | null;
  cardNumber: string | null;
  lastCheckpoint: string | null;
  status: QueueStatus;
  owner: string | null;
  isRegistered: boolean;
  sangh: string | null;
  route: string | null;
  transportCompany: string | null;
  loadDetails: string | null;
  checkpointWeight: number | null;
  entryDate: string;
  entries: any[];
  from: string;
  to: string;
  kind: string;
}

export interface PendingQueue {
  id: string;
  vehicleNumber: string;
  route: string;
  entryDate: string;
  material: string | null;
  remarks: string | null;
  driverPhone: string | null;
}

// ---------- LOOKUPS ----------
const provinces = [
  { value: "p1", label: "Koshi Province (P1)" },
  { value: "p2", label: "Madhesh Province (P2)" },
  { value: "p3", label: "Bagmati Province (P3)" },
  { value: "p4", label: "Gandaki Province (P4)" },
  { value: "p5", label: "Lumbini Province (P5)" },
  { value: "p6", label: "Karnali Province (P6)" },
  { value: "p7", label: "Sudurpashchim Province (P7)" },
];

const districts: Record<string, { value: string; label: string }[]> = {
  // Koshi (P1) – 14
  p1: [
    { value: "d-taplejung", label: "Taplejung" },
    { value: "d-sankhuwasabha", label: "Sankhuwasabha" },
    { value: "d-solukhumbu", label: "Solukhumbu" },
    { value: "d-okhaldhunga", label: "Okhaldhunga" },
    { value: "d-khotang", label: "Khotang" },
    { value: "d-bhojpur", label: "Bhojpur" },
    { value: "d-dhankuta", label: "Dhankuta" },
    { value: "d-terhathum", label: "Terhathum" },
    { value: "d-panchthar", label: "Panchthar" },
    { value: "d-ilan", label: "Ilam" },
    { value: "d-jhapa", label: "Jhapa" },
    { value: "d-morang", label: "Morang" },
    { value: "d-sunsari", label: "Sunsari" },
    { value: "d-udayapur", label: "Udayapur" },
  ],
  // Madhesh (P2) – 8
  p2: [
    { value: "d-saptari", label: "Saptari" },
    { value: "d-siraha", label: "Siraha" },
    { value: "d-dhanusha", label: "Dhanusha" },
    { value: "d-mahottari", label: "Mahottari" },
    { value: "d-sarlahi", label: "Sarlahi" },
    { value: "d-rautahat", label: "Rautahat" },
    { value: "d-bara", label: "Bara" },
    { value: "d-parsa", label: "Parsa" },
  ],
  // Bagmati (P3) – 13
  p3: [
    { value: "d-dolakha", label: "Dolakha" },
    { value: "d-sindhupalchok", label: "Sindhupalchok" },
    { value: "d-rasuwa", label: "Rasuwa" },
    { value: "d-dhading", label: "Dhading" },
    { value: "d-nuwakot", label: "Nuwakot" },
    { value: "d-kathmandu", label: "Kathmandu" },
    { value: "d-bhaktapur", label: "Bhaktapur" },
    { value: "d-lalitpur", label: "Lalitpur" },
    { value: "d-kavrepalanchok", label: "Kavrepalanchok" },
    { value: "d-ramechhap", label: "Ramechhap" },
    { value: "d-sindhuli", label: "Sindhuli" },
    { value: "d-makwanpur", label: "Makwanpur" },
    { value: "d-chitwan", label: "Chitwan" },
  ],
  // Gandaki (P4) – 11
  p4: [
    { value: "d-gorkha", label: "Gorkha" },
    { value: "d-manang", label: "Manang" },
    { value: "d-mustang", label: "Mustang" },
    { value: "d-myagdi", label: "Myagdi" },
    { value: "d-kaski", label: "Kaski" },
    { value: "d-lamjung", label: "Lamjung" },
    { value: "d-tanahu", label: "Tanahu" },
    { value: "d-nawalpur", label: "Nawalpur" },
    { value: "d-syangja", label: "Syangja" },
    { value: "d-parbat", label: "Parbat" },
    { value: "d-baglung", label: "Baglung" },
  ],
  // Lumbini (P5) – 12
  p5: [
    { value: "d-rukum-east", label: "Rukum East" },
    { value: "d-rolpa", label: "Rolpa" },
    { value: "d-pyuthan", label: "Pyuthan" },
    { value: "d-gulmi", label: "Gulmi" },
    { value: "d-arghakhanchi", label: "Arghakhanchi" },
    { value: "d-palpa", label: "Palpa" },
    { value: "d-nawalparasi-west", label: "Nawalparasi West" },
    { value: "d-rupandehi", label: "Rupandehi" },
    { value: "d-kapilvastu", label: "Kapilvastu" },
    { value: "d-dang", label: "Dang" },
    { value: "d-banke", label: "Banke" },
    { value: "d-bardiya", label: "Bardiya" },
  ],
  // Karnali (P6) – 10
  p6: [
    { value: "d-dolpa", label: "Dolpa" },
    { value: "d-mugu", label: "Mugu" },
    { value: "d-humla", label: "Humla" },
    { value: "d-jumla", label: "Jumla" },
    { value: "d-kalikot", label: "Kalikot" },
    { value: "d-dailekh", label: "Dailekh" },
    { value: "d-jajarkot", label: "Jajarkot" },
    { value: "d-rukum-west", label: "Rukum West" },
    { value: "d-salyan", label: "Salyan" },
    { value: "d-surkhet", label: "Surkhet" },
  ],
  // Sudurpashchim (P7) – 9
  p7: [
    { value: "d-bajura", label: "Bajura" },
    { value: "d-bajhang", label: "Bajhang" },
    { value: "d-darchula", label: "Darchula" },
    { value: "d-baitadi", label: "Baitadi" },
    { value: "d-dadeldhura", label: "Dadeldhura" },
    { value: "d-kanchanpur", label: "Kanchanpur" },
    { value: "d-kailali", label: "Kailali" },
    { value: "d-doti", label: "Doti" },
    { value: "d-achham", label: "Achham" },
  ],
};

const vehicleTypes = [
  { value: "vt-truck", label: "Truck" },
  { value: "vt-tipper", label: "Tipper" },
  { value: "vt-trailer", label: "Trailer" },
  { value: "vt-pickup", label: "Pickup" },
];

const plateColors = [
  { value: "pc-black", label: "Black" },
  { value: "pc-red", label: "Red" },
  { value: "pc-yellow", label: "Yellow" },
];

const plateTypes = [
  { value: "pt-embossed", label: "Embossed" },
  { value: "pt-provincial", label: "Provincial" },
  { value: "pt-zonal", label: "Zonal" },
];

const zonalCodes = [
  { value: "zc-me", label: "Mechi (ME)" },
  { value: "zc-ko", label: "Koshi (KO)" },
  { value: "zc-sa", label: "Sagarmatha (SA)" },
  { value: "zc-ja", label: "Janakpur (JA)" },
  { value: "zc-ba", label: "Bagmati (BA)" },
  { value: "zc-na", label: "Narayani (NA)" },
  { value: "zc-ga", label: "Gandaki (GA)" },
  { value: "zc-lu", label: "Lumbini (LU)" },
  { value: "zc-dh", label: "Dhaulagiri (DH)" },
  { value: "zc-ra", label: "Rapti (RA)" },
  { value: "zc-ka", label: "Karnali (KA)" },
  { value: "zc-bh", label: "Bheri (BH)" },
  { value: "zc-se", label: "Seti (SE)" },
  { value: "zc-ma", label: "Mahakali (MA)" },
];

const symbols = [
  { value: "sym-ka", label: "(KA) Heavy Vehicles (Private)" },
  { value: "sym-ca", label: "(CA) Light Vehicles (Private)" },
  { value: "sym-pa", label: "(PA) Motorcycles (Private)" },
  { value: "sym-kha", label: "(KHA) Heavy Vehicles (Public/Commercial)" },
  { value: "sym-ja", label: "(JA) Light Vehicles (Public/Commercial)" },
  { value: "sym-pha", label: "(PHA) Motorcycles (Public/Commercial)" },
  { value: "sym-ga", label: "(GA) Heavy Vehicles (Government)" },
  { value: "sym-jha", label: "(JHA) Light Vehicles (Government)" },
  { value: "sym-ba", label: "(BA) Motorcycles (Government)" },
];

const stations = [
  { value: "st-ktm", label: "Kathmandu Checkpoint" },
  { value: "st-nar", label: "Narayangadh Checkpoint" },
];

const cardTypes = [
  { value: "ct-green", label: "Green Card" },
  { value: "ct-yellow", label: "Yellow Card" },
];

const banks = [
  { value: "b-nabil", label: "Nabil Bank" },
  { value: "b-nbl", label: "Nepal Bank Ltd" },
  { value: "b-gic", label: "Global IME Bank" },
];

const insuranceCompanies = [
  { value: "ic-sagarmatha", label: "Sagarmatha Insurance" },
  { value: "ic-shikhar", label: "Shikhar Insurance" },
];

const policyTypes = [
  { value: "pol-comp", label: "Comprehensive" },
  { value: "pol-third", label: "Third Party" },
];

const goods = [
  { value: "g-sand", label: "Sand" },
  { value: "g-gravel", label: "Gravel" },
  { value: "g-cement", label: "Cement" },
  { value: "g-steel", label: "Steel" },
];

const sanghs = [
  { value: "sg-ktm", label: "Kathmandu Truck Sangh" },
  { value: "sg-chit", label: "Chitwan Truck Sangh" },
];

const entryPositions = [
  { value: "ep-cp1", label: "Checkpoint 1" },
  { value: "ep-cp2", label: "Checkpoint 2" },
  { value: "ep-cp3", label: "Checkpoint 3" },
];

const documentTypes = [
  { value: "dt-bluebook", label: "Bluebook" },
  { value: "dt-insurance", label: "Insurance" },
  { value: "dt-permit", label: "Route Permit" },
];

export const LOOKUPS: Record<string, { value: string; label: string }[]> = {
  provinces,
  "vehicle-types": vehicleTypes,
  "plate-colors": plateColors,
  "plate-types": plateTypes,
  "zonal-codes": zonalCodes,
  symbols,
  stations,
  "card-types": cardTypes,
  banks,
  "insurance-companies": insuranceCompanies,
  "policy-types": policyTypes,
  goods,
  sanghs,
  "entry-positions": entryPositions,
  "document-types": documentTypes,
  "other-vehicle-kinds": [
    { value: "indian", label: "Indian" },
    { value: "unregistered", label: "Unregistered" },
  ],
};

export function getDistricts(parentId?: string) {
  if (!parentId) return Object.values(districts).flat();
  return districts[parentId] ?? [];
}

// ---------- SEED DATA ----------
const passwordHash = bcrypt.hashSync("password123", 10);

export const db = {
  sessions: new Map<string, string>(), // sessionId -> userId

  users: [
    {
      id: "u1",
      name: "Bimal Chaudahry",
      sthaniyaSangh: "Kathmandu Truck Sangh",
      email: "checkpoint@tqms.local",
      passwordHash,
      checkpointType: "Weight Station",
      province: "Bagmati Province",
      district: "Kathmandu",
      region: "Central",
      geoLocation: "27.7172,85.3240",
      status: "active" as const,
    },
  ] as CheckpointProfile[],

  checkpointUsers: [
    {
      id: "cu1",
      name: "Sita Sharma",
      address: "Thamel, Kathmandu",
      contact: "9801234567",
      email: "sita@example.com",
      provinceId: "p3",
      districtId: "d-ktm",
      isActive: true,
    },
    {
      id: "cu2",
      name: "Hari Thapa",
      address: "Balkumari, Lalitpur",
      contact: "9812345678",
      email: "hari@example.com",
      provinceId: "p3",
      districtId: "d-lalit",
      isActive: true,
    },
  ] as CheckpointUser[],

  narration:
    "All vehicles must stop at the weighbridge. Overloading will incur fines as per federal regulation.",

  vehicleOwners: [
    {
      id: "vo1",
      name: "Krishna Transport",
      email: "krishna@transport.com",
      address: "Kalanki, Kathmandu",
      phone: "9851001234",
      linkedOwner: null,
      isAssigned: true,
      isVerified: true,
      form: {
        name: "Krishna Transport",
        provinceId: "p3",
        districtId: "d-ktm",
        localLevel: "Kathmandu Metropolitan",
        streetAddress: "Kalanki Chowk",
        email: "krishna@transport.com",
        panNumber: "123456789",
        phone: "9851001234",
        isIndividual: false,
        contactName: "Krishna Bahadur",
        contactEmail: "krishna@transport.com",
        contactNumber: "9851001234",
        registrationNumber: "REG-2020-001",
      },
      province: "Bagmati Province",
      district: "Kathmandu",
      files: {},
      banks: [
        {
          id: "ob1",
          bankId: "b-nabil",
          bank: "Nabil Bank",
          branch: "Kalanki",
          accountHolder: "Krishna Transport",
          accountNumber: "0123456789",
          chequeUrl: null,
          isCurrent: true,
        },
      ],
    },
  ] as VehicleOwner[],

  vehicles: [
    {
      id: "v1",
      plateNo: "BA 1 JA 1234",
      lotNo: "L-001",
      vehicleNumber: "BA1JA1234",
      vehicleTypeId: "vt-truck",
      vehicleType: "Truck",
      sanghId: "sg-ktm",
      sanghName: "Kathmandu Truck Sangh",
      ownerId: "vo1",
      ownerName: "Krishna Transport",
      mobile: "9851001234",
      email: "krishna@transport.com",
      form: {
        sanghId: "sg-ktm",
        ownerId: "vo1",
        vehicleTypeId: "vt-truck",
        plateColorId: "pc-black",
        engineNumber: "ENG-998877",
        chassisNumber: "CHS-112233",
        companyName: "Tata",
        modelNo: "LPT 1613",
        plateType: "zonal",
        zonalCodeId: "zc-ba",
        provinceId: "",
        symbolId: "sym-jha",
        lotNo: "L-001",
        vehicleNumber: "1234",
        embossedNumber: "",
      },
      general: {
        engineNumber: "ENG-998877",
        chassisNumber: "CHS-112233",
        registrationDate: "2020-05-12",
        modelNo: "LPT 1613",
        plateType: "Zonal",
        companyName: "Tata",
        tyres: 6,
        ownerName: "Krishna Transport",
        plateNo: "BA 1 JA 1234",
        category: "Goods",
        vehicleType: "Truck",
        capacityTons: 10,
        insuranceCompany: "Sagarmatha Insurance",
        policyType: "Comprehensive",
        policyNumber: "POL-2024-001",
        policyExpiry: "2025-12-31",
      },
      tareWeight: 4500,
      sub: {
        documents: [],
        owners: [],
        beneficiaries: [],
        "check-passes": [],
        "route-permits": [],
        insurances: [],
        "type-cards": [],
        bluebooks: [],
      },
      auditLogs: [
        {
          id: "al1",
          at: new Date().toISOString(),
          user: "Ram Bahadur",
          action: "Created",
          detail: "Vehicle registered",
        },
      ],
    },
  ] as Vehicle[],

  otherVehicles: [
    {
      id: "ov1",
      kind: "unregistered" as const,
      vehicleNumber: "UNREG-7788",
      vehicleTypeId: "vt-tipper",
      vehicleType: "Tipper",
      plateTypeId: "pt-provincial",
    },
  ] as OtherVehicle[],

  queues: [
    {
      id: "q1",
      queueNumber: "Q-2024-001",
      vehicleNumber: "BA 1 JA 1234",
      vehicleId: "v1",
      vehicleType: "Truck",
      cardType: "Green Card",
      cardNumber: "GC-1001",
      lastCheckpoint: "Kathmandu Checkpoint",
      status: "in_queue" as QueueStatus,
      owner: "Krishna Transport",
      isRegistered: true,
      sangh: "Kathmandu Truck Sangh",
      route: "Kathmandu → Narayangadh",
      transportCompany: "Krishna Transport",
      loadDetails: "Sand 8 tons",
      checkpointWeight: null,
      entryDate: new Date().toISOString(),
      from: "Kathmandu",
      to: "Narayangadh",
      kind: "registered",
      entries: [
        {
          id: "qe1",
          entryDate: new Date().toISOString(),
          from: "Kathmandu",
          to: "Narayangadh",
          weights: { cp1: null, cp2: null, cp3: null },
          billNo: null,
        },
      ],
    },
  ] as Queue[],

  pendingQueues: [
    {
      id: "pq1",
      vehicleNumber: "TEMP-5566",
      route: "Birgunj → Kathmandu",
      entryDate: new Date().toISOString(),
      material: "Cement",
      remarks: "Scanned via QR",
      driverPhone: "9809876543",
    },
  ] as PendingQueue[],
};

export function paginate<T>(items: T[], page = 1, pageSize = 10) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const p = Math.min(Math.max(1, page), totalPages);
  const start = (p - 1) * pageSize;
  return {
    data: items.slice(start, start + pageSize),
    meta: { page: p, pageSize, total, totalPages },
  };
}

export function newId() {
  return uuid();
}
