/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, useState, useEffect, useMemo, useRef } from 'react';
import { 
  Home, 
  Search, 
  ShoppingBag, 
  Wallet, 
  User, 
  Plus, 
  Package, 
  CheckCircle, 
  Clock, 
  MapPin, 
  ArrowRight, 
  LogOut, 
  Settings, 
  ShieldCheck,
  Store,
  ChevronRight,
  Trash2,
  PlusCircle,
  MinusCircle,
  AlertCircle,
  CheckCircle2,
  X,
  Bell,
  LayoutDashboard,
  BarChart3,
  Users,
  TrendingUp,
  PieChart,
  Activity,
  Info,
  Volume2,
  Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { GoogleMap, useJsApiLoader, MarkerF, Autocomplete, InfoWindow } from '@react-google-maps/api';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// --- Leaflet Map Component ---
const LeafletMap = ({ center, onLocationChange, mapType, setMapType, setDetectedAddress, isGeocoding, sellers }: { 
  center: { lat: number; lng: number }, 
  onLocationChange: (lat: number, lng: number) => void,
  mapType: 'roadmap' | 'satellite' | 'hybrid',
  setMapType: (type: 'roadmap' | 'satellite' | 'hybrid') => void,
  setDetectedAddress: (addr: string) => void,
  isGeocoding: boolean,
  sellers: UserProfile[]
}) => {
  const [isDragging, setIsDragging] = useState(false);

  // Shop Icon for Leaflet
  const shopIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/606/606363.png', // Shop icon
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  const MapEvents = () => {
    const map = useMap();
    useMapEvents({
      dragstart() {
        setIsDragging(true);
        setDetectedAddress('Moving map...');
      },
      dragend() {
        setIsDragging(false);
        const newCenter = map.getCenter();
        onLocationChange(newCenter.lat, newCenter.lng);
      },
      zoomstart() {
        setIsDragging(true);
      },
      zoomend() {
        setIsDragging(false);
        const newCenter = map.getCenter();
        onLocationChange(newCenter.lat, newCenter.lng);
      }
    });
    return null;
  };

  const ChangeView = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
      map.setView(center, 18);
    }, [center, map]);
    return null;
  };

  const LocateButton = () => {
    const map = useMap();
    return (
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDetectedAddress('Locating you...');
          navigator.geolocation.getCurrentPosition((pos) => {
            const { latitude, longitude } = pos.coords;
            onLocationChange(latitude, longitude);
            map.setView([latitude, longitude], 18);
          }, (err) => {
            console.error('Locate error:', err);
            setDetectedAddress('Could not find location. Please search manually.');
          }, { enableHighAccuracy: true });
        }}
        className={`absolute bottom-6 right-6 z-[1000] bg-white flex items-center gap-2 py-3 px-5 rounded-full shadow-2xl border-2 border-orange-100 text-orange-600 hover:bg-orange-50 transition-all active:scale-95 group ${!center.lat ? 'animate-pulse' : ''}`}
        title="Locate Me"
      >
        <Navigation size={20} className="group-hover:rotate-45 transition-transform" />
        <span className="text-xs font-bold uppercase tracking-wider">Locate Me</span>
      </button>
    );
  };

  const MapTypeControl = () => {
    return (
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <button 
          onClick={() => setMapType('roadmap')}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-lg transition-all ${mapType === 'roadmap' ? 'bg-orange-600 text-white' : 'bg-white text-gray-600'}`}
        >
          Standard
        </button>
        <button 
          onClick={() => setMapType('satellite')}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-lg transition-all ${mapType === 'satellite' ? 'bg-orange-600 text-white' : 'bg-white text-gray-600'}`}
        >
          Satellite
        </button>
        <button 
          onClick={() => setMapType('hybrid')}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-lg transition-all ${mapType === 'hybrid' ? 'bg-orange-600 text-white' : 'bg-white text-gray-600'}`}
        >
          Hybrid
        </button>
      </div>
    );
  };

  const getTileUrl = () => {
    switch(mapType) {
      case 'satellite': return 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}';
      case 'hybrid': return 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
      default: return 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Ola Style Center Pin */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-[1001] pointer-events-none flex flex-col items-center">
        <motion.div 
          animate={{ 
            y: isDragging ? -20 : 0,
            scale: isDragging ? 1.1 : 1
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="relative"
        >
          <div className={`bg-orange-600 text-white p-2 rounded-full shadow-2xl border-2 border-white ${isGeocoding ? 'animate-pulse' : ''}`}>
            <MapPin size={28} fill="white" />
          </div>
          <motion.div 
            animate={{ 
              scale: isDragging ? 0.5 : 1,
              opacity: isDragging ? 0.2 : 0.4
            }}
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-black rounded-full blur-[1px]" 
          />
        </motion.div>
      </div>

      <MapContainer 
        center={[center.lat, center.lng]} 
        zoom={18} 
        scrollWheelZoom={true}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; Google Maps'
          url={getTileUrl()}
          maxZoom={20}
        />
        <MapEvents />
        <ChangeView center={[center.lat, center.lng]} />
        <LocateButton />
        <MapTypeControl />

        {/* Seller Markers */}
        {sellers.map((seller) => (
          seller.location && (
            <Marker 
              key={seller.uid} 
              position={[seller.location.lat, seller.location.lng]}
              icon={shopIcon}
            >
              <Popup>
                <div className="p-1">
                  <p className="font-bold text-orange-600">{seller.shopName || seller.name}</p>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(seller.shopAddress || seller.address || '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[10px] text-gray-500 hover:text-orange-600 transition-colors block"
                  >
                    {seller.shopAddress || seller.address || 'Available Shop'}
                  </a>
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  );
};
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  deleteDoc,
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { auth, db } from './firebase';

// --- Types ---
type Role = 'customer' | 'seller' | 'admin' | 'delivery_boy';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email || undefined,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: Role;
  mobile?: string;
  shopName?: string;
  shopAddress?: string;
  shopCategory?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  licenseNumber?: string;
  applicationDate?: string;
  walletBalance: number;
  status: 'pending' | 'approved' | 'blocked';
  location?: { lat: number; lng: number };
  deliveryRadius?: number;
  deliveryFee?: number;
  address?: string;
  fullAddress?: string;
  upiId?: string;
  isOnline?: boolean;
  pushSubscription?: any;
  createdAt?: string;
  serverSecret?: string;
  sellerId?: string;
  paymentType?: 'fixed' | 'per_delivery';
  salary?: number;
  deliveryCharge?: number;
}

interface Product {
  id: string;
  sellerId: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  location: { lat: number; lng: number };
  expiryTime?: string;
}

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  customerId: string;
  sellerId: string;
  items: OrderItem[];
  totalAmount: number;
  platformFee: number;
  sellerAmount: number;
  deliveryFee: number;
  deliveryCharge?: number;
  paymentMethod: 'cod' | 'online';
  deliveryAddress: string;
  customerMobile: string;
  status: 'pending' | 'accepted' | 'ready' | 'out_for_delivery' | 'delivered' | 'rejected';
  createdAt: any;
  paymentStatus: 'pending' | 'paid';
  deliveryBoyId?: string;
}

interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'system' | 'payment';
  read: boolean;
  createdAt: string;
  serverSecret?: string;
}

interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'earning' | 'withdrawal' | 'payment' | 'refund' | 'fee' | 'deposit';
  status: 'pending' | 'completed' | 'failed';
  description: string;
  createdAt: any;
  upiId?: string;
}

// --- Constants ---
const CATEGORIES = ['Grocery', 'Snacks', 'Medicine', 'Dairy', 'Vegetables', 'Daily Needs'];
const PLATFORM_FEE = 5;

// --- Utils ---
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// --- Components ---
const CountdownTimer = ({ expiryTime }: { expiryTime: string }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(expiryTime).getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft('EXPIRED');
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryTime]);

  if (timeLeft === 'EXPIRED') return null;

  return (
    <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg animate-pulse z-10">
      <Clock size={10} />
      {timeLeft}
    </div>
  );
};

const BottomNav = ({ activeTab, setActiveTab, role, isAdminRoute, setIsAdminRoute }: { activeTab: string, setActiveTab: (t: string) => void, role: Role, isAdminRoute: boolean, setIsAdminRoute: (b: boolean) => void }) => {
  let tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'categories', icon: Search, label: 'Categories' },
    { id: 'orders', icon: Package, label: 'Orders' },
    { id: 'wallet', icon: Wallet, label: 'Wallet' },
    { id: 'account', icon: User, label: 'Account' },
  ];

  if (role === 'seller') {
    tabs = [
      { id: 'home', icon: Home, label: 'Home' },
      { id: 'seller-dashboard', icon: Store, label: 'Dashboard' },
      { id: 'seller-products', icon: Plus, label: 'Products' },
      { id: 'delivery-boys', icon: Users, label: 'Delivery' },
      { id: 'orders', icon: Package, label: 'Orders' },
      { id: 'account', icon: User, label: 'Account' },
    ];
  }

  if (role === 'delivery_boy') {
    tabs = [
      { id: 'home', icon: Home, label: 'Home' },
      { id: 'delivery-dashboard', icon: LayoutDashboard, label: 'Tasks' },
      { id: 'orders', icon: Package, label: 'History' },
      { id: 'account', icon: User, label: 'Account' },
    ];
  }

  if (isAdminRoute) {
    tabs = [
      { id: 'admin-dashboard', icon: LayoutDashboard, label: 'Dash' },
      { id: 'admin-orders', icon: Package, label: 'Orders' },
      { id: 'admin-sellers', icon: Users, label: 'Sellers' },
      { id: 'admin-analytics', icon: BarChart3, label: 'Stats' },
      { id: 'exit-admin', icon: LogOut, label: 'Exit' },
    ];
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center py-2 pb-6 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => {
            if (tab.id === 'exit-admin') {
              setIsAdminRoute(false);
              setActiveTab('home');
              window.location.hash = '';
            } else {
              setActiveTab(tab.id);
            }
          }}
          className={`flex flex-col items-center space-y-1 transition-all duration-300 relative ${
            activeTab === tab.id ? 'text-orange-600 scale-110' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {activeTab === tab.id && (
            <motion.div 
              layoutId="activeTab"
              className="absolute -top-2 w-1 h-1 bg-orange-600 rounded-full"
            />
          )}
          <tab.icon size={22} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
          <span className={`text-[9px] font-bold uppercase tracking-tighter ${activeTab === tab.id ? 'opacity-100' : 'opacity-60'}`}>
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
};

// --- Error Boundary ---
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error) {
          errorMessage = `Firestore Error: ${parsed.error}`;
          if (parsed.error.includes('offline')) {
            errorMessage = "Firestore connection failed. Please ensure you have created a Firestore database in your Firebase Console and that your project ID is correct.";
          }
        }
      } catch (e) {
        errorMessage = this.state.error.message || errorMessage;
      }

      return (
        <div className="h-screen flex flex-col items-center justify-center p-6 bg-red-50 text-center">
          <AlertCircle size={64} className="text-red-600 mb-4" />
          <h2 className="text-2xl font-bold text-red-900 mb-2">Oops!</h2>
          <p className="text-red-700 mb-6">{errorMessage}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-3 rounded-2xl font-bold"
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const GOOGLE_MAPS_LIBRARIES: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

export default function App() {
  return (
    <ErrorBoundary>
      <AlifLailaApp />
    </ErrorBoundary>
  );
}

function AlifLailaApp() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [isAdminRoute, setIsAdminRoute] = useState(window.location.hash === '#/admin');
  
  // Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const handleHashChange = () => {
      setIsAdminRoute(window.location.hash === '#/admin');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (isAdminRoute && profile && profile.role !== 'admin') {
      showToast('Access Denied: You do not have administrator privileges.', 'error');
      setIsAdminRoute(false);
      setActiveTab('home');
      window.location.hash = '';
    }
  }, [isAdminRoute, profile]);

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sellers, setSellers] = useState<UserProfile[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSellerForm, setShowSellerForm] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [lastNotifiedOrderId, setLastNotifiedOrderId] = useState<string | null>(null);
  const [withdrawalAmount, setWithdrawalAmount] = useState<string>('');
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [upiId, setUpiId] = useState<string>('');
  interface Toast {
    id: string;
    title?: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
  }

  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', title?: string, duration: number = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, message, type, title, duration };
    
    setToasts(prev => [...prev, newToast]);

    // Play sound based on type
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (type === 'success') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      } else if (type === 'error') {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      } else {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(660, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      }

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn('Audio context not supported or blocked');
    }

    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Keep showToast for backward compatibility but map it to addToast
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    addToast(message, type);
  };

  const [detectedAddress, setDetectedAddress] = useState<string>('');
  const [manualAddress, setManualAddress] = useState<string>('');
  const [isLocating, setIsLocating] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [mapAuthError, setMapAuthError] = useState(false);
  const [useFreeMap, setUseFreeMap] = useState(false);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap');
  const [freeSearchQuery, setFreeSearchQuery] = useState('');
  const [freeSearchResults, setFreeSearchResults] = useState<any[]>([]);
  const [isSearchingFree, setIsSearchingFree] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [selectedSeller, setSelectedSeller] = useState<UserProfile | null>(null);

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded: isGoogleMapsLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleMapsApiKey,
    libraries: GOOGLE_MAPS_LIBRARIES
  });

  useEffect(() => {
    if (googleMapsApiKey) {
      console.log("Google Maps API Key detected:", googleMapsApiKey.substring(0, 8) + "...");
    } else {
      console.warn("Google Maps API Key is missing. Please set VITE_GOOGLE_MAPS_API_KEY in Secrets.");
    }
  }, [googleMapsApiKey]);

  if (loadError) {
    console.error("Google Maps Load Error:", loadError);
  }
  const [addressFormData, setAddressFormData] = useState({
    address: '',
    mobile: ''
  });
  const [sellerFormData, setSellerFormData] = useState({
    shopName: '',
    shopAddress: '',
    shopCategory: 'Grocery',
    mobile: '',
    aadhaarNumber: '',
    panNumber: '',
    licenseNumber: ''
  });

  // --- Auth & Profile ---
  useEffect(() => {
    // @ts-ignore
    window.gm_authFailure = () => {
      console.error("Google Maps authentication failed.");
      setMapAuthError(true);
    };
  }, []);

  useEffect(() => {
    console.log("Auth useEffect mounted");
    let unsubscribeProfile: (() => void) | null = null;
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      console.log("onAuthStateChanged fired, user:", u?.email || "null");
      try {
        if (u) {
          setUser(u);
          const docRef = doc(db, 'users', u.uid);
          
          // Initial check and creation if needed
          try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const p = docSnap.data() as UserProfile;
              // Migration: If old admin email is still admin, change to seller
              if (p.role === 'admin' && u.email?.toLowerCase() !== 'khanmohammadahmad1@gmail.com' && 
                  (u.email?.toLowerCase() === 'khanmohammadahmad597@gmail.com' || u.email?.toLowerCase() === 'khanmohammadahmad@gmail.com' || u.email?.toLowerCase() === 'khanmohammadahmad3@gmail.com')) {
                await updateDoc(docRef, { role: 'seller' });
              }
            } else {
              // Check if there's a pre-approved profile for this email
              const q = query(collection(db, 'users'), where('email', '==', u.email?.toLowerCase()));
              const querySnap = await getDocs(q);
              
              let initialProfile: UserProfile;

              if (!querySnap.empty) {
                // Claim the pre-approved profile
                const preProfile = querySnap.docs[0].data() as UserProfile;
                initialProfile = {
                  ...preProfile,
                  uid: u.uid // Update to actual Auth UID
                };
                // Delete the temporary pre-approved doc
                await deleteDoc(doc(db, 'users', querySnap.docs[0].id));
              } else {
                // Create new default profile
                initialProfile = {
                  uid: u.uid,
                  name: u.displayName || u.email?.split('@')[0] || 'User',
                  email: u.email || '',
                  mobile: u.phoneNumber || '',
                  role: (u.email?.toLowerCase() === 'khanmohammadahmad1@gmail.com') ? 'admin' : 
                        (u.email?.toLowerCase() === 'khanmohammadahmad597@gmail.com' || u.email?.toLowerCase() === 'khanmohammadahmad@gmail.com' || u.email?.toLowerCase() === 'khanmohammadahmad3@gmail.com') ? 'seller' : 'customer',
                  walletBalance: 0,
                  isOnline: true,
                  status: 'approved',
                  createdAt: new Date().toISOString()
                };
              }
              
              await setDoc(docRef, initialProfile);
              setProfile(initialProfile);
            }
          } catch (error) {
            console.error("Profile fetch/create error:", error);
            // Don't throw here, let the listener handle it or just proceed
          }

          // Real-time profile listener
          unsubscribeProfile = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
              const p = { uid: docSnap.id, ...docSnap.data() } as UserProfile;
              if (isAdminRoute && p.role !== 'admin') {
                showToast('Access Denied: You do not have administrator privileges.', 'error');
                setIsAdminRoute(false);
                setActiveTab('home');
                window.location.hash = '';
                return;
              }
              setProfile(p);
            }
          }, (error) => {
            console.error("Profile listener error:", error);
            // Handle permission error gracefully
            if (error.message.includes('permission')) {
              setInitError("Permission denied while fetching profile. Please check Firestore rules.");
            }
          });

        } else {
          setUser(null);
          setProfile(null);
          if (unsubscribeProfile) unsubscribeProfile();
        }
      } catch (err) {
        console.error("Auth state change error:", err);
        setInitError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        showToast('Push notifications enabled', 'success');
      }
    }
  };

  // --- Audio Notifications for Sellers ---
  useEffect(() => {
    if (profile?.role === 'seller' && isAudioEnabled) {
      const pendingOrders = orders.filter(o => o.sellerId === profile.uid && o.status === 'pending');
      
      if (pendingOrders.length > 0) {
        // Play sound
        if (!audioRef.current) {
          // Using a generic alarm sound. 
          // TO USE ALIF LAILA SONG: Replace the URL below with your song's direct MP3 link
          audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audioRef.current.loop = true;
        }
        
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Audio play failed:", error);
          });
        }

        const latestOrder = pendingOrders[0];
        
        // Voice Notification (only once per order)
        if (latestOrder.id !== lastNotifiedOrderId) {
          if ('speechSynthesis' in window) {
            const msg = new SpeechSynthesisUtterance();
            msg.text = `Naya order aaya hai. Kripya ise accept karein. Order amount is ${latestOrder.totalAmount} rupees.`;
            msg.lang = 'hi-IN'; // Hindi
            window.speechSynthesis.speak(msg);
          }
          setLastNotifiedOrderId(latestOrder.id);
        }

        // Show Push Notification
        if (notificationPermission === 'granted') {
          new Notification("New Order Received!", {
            body: `Order for ₹${latestOrder.totalAmount}. Please accept it.`,
            icon: '/favicon.ico',
            tag: 'new-order'
          });
        }
      } else {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [orders, profile, isAudioEnabled]);

  const enableAudio = () => {
    setIsAudioEnabled(true);
    // Play a silent sound to unlock audio context
    const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
    silentAudio.play().catch(() => {});
    showToast('Audio notifications enabled', 'success');
  };

  // --- Geolocation ---
  const updateLocation = (lat: number, lng: number) => {
    setLocation({ lat, lng });
    setMapCenter({ lat, lng });
    
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }

    setIsGeocoding(true);
    geocodeTimeoutRef.current = setTimeout(async () => {
      const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

      // 1. Try Google Maps Geocoding API first (most reliable)
      if (googleApiKey) {
        try {
          const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleApiKey}`);
          const data = await response.json();
          
          if (data.status === 'OK' && data.results.length > 0) {
            const result = data.results[0];
            setDetectedAddress(result.formatted_address);
            setIsGeocoding(false);
            return;
          }
        } catch (error) {
          console.error('Google Geocoding error:', error);
        }
      }

      // 2. Fallback to Nominatim (OpenStreetMap)
      try {
        const userEmail = 'khanmohammadahmad597@gmail.com';
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1&email=${encodeURIComponent(userEmail)}&zoom=18&countrycodes=in`, {
          headers: {
            'Accept-Language': 'en'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const addr = data.address;
          
          if (addr) {
            // Deep address components for better detection in India
            const building = addr.building || addr.office || addr.amenity || addr.house_name || addr.industrial || addr.commercial || addr.shop || addr.mall || addr.hospital || addr.school || addr.university || addr.theatre || addr.cinema || addr.bank || addr.atm || addr.retail || addr.warehouse || addr.factory || addr.temple || addr.mosque || addr.church || addr.construction || addr.emergency || addr.point_of_interest || '';
            const house = addr.house_number || addr.house_name || addr.flat_number || addr.unit || addr.apartment || addr.block || addr.floor || addr.room || addr.entrance || '';
            const road = addr.road || addr.street || addr.path || addr.lane || addr.alley || addr.square || addr.highway || addr.tertiary || addr.secondary || addr.primary || addr.residential || addr.track || '';
            const landmark = addr.landmark || addr.place_of_worship || addr.tourism || addr.monument || addr.heritage || addr.park || addr.garden || addr.attraction || addr.temple || addr.mosque || addr.church || addr.stadium || addr.museum || addr.memorial || addr.fountain || '';
            
            const neighbourhood = addr.neighbourhood || addr.residential || addr.allotments || addr.colony || addr.sector || addr.suburb || addr.subdivision || addr.phase || addr.pocket || addr.extension || '';
            const suburb = addr.suburb || addr['sub-district'] || addr.quarter || addr.city_district || addr.tehsil || addr.taluka || addr.mandal || addr.block || addr.circle || '';
            const village = addr.village || addr.hamlet || addr.isolated_dwelling || addr.croft || addr.town || addr.locality || addr.municipality || addr.panchayat || '';
            const cityDistrict = addr.city_district || addr.district || addr.borough || addr.county || addr.state_district || addr.region || addr.division || '';
            const city = addr.city || addr.town || addr.municipality || addr.city_block || addr.metropolis || addr.village || '';
            const state = addr.state || addr.province || addr.region || addr.state_district || addr.territory || '';
            const country = addr.country || '';
            const postcode = addr.postcode || '';

            const addressParts = [];
            if (landmark) addressParts.push(`Near ${landmark}`);
            if (building && building !== landmark) addressParts.push(building);
            if (house && house !== building && house !== landmark) {
              const houseDisplay = /^\d+$/.test(house) ? `House No: ${house}` : house;
              addressParts.push(houseDisplay);
            }
            if (road) addressParts.push(road);
            if (neighbourhood) addressParts.push(neighbourhood);
            if (suburb && suburb !== neighbourhood) addressParts.push(suburb);
            if (village && village !== suburb && village !== neighbourhood) addressParts.push(village);
            if (cityDistrict && cityDistrict !== city && cityDistrict !== suburb) addressParts.push(cityDistrict);
            if (city) addressParts.push(city);
            if (state) addressParts.push(state);
            if (country && country !== 'India') addressParts.push(country);
            if (postcode) addressParts.push(postcode);
            
            const fullAddr = addressParts.filter(Boolean).join(', ');
            setDetectedAddress(fullAddr || data.display_name || 'Location Detected');
            setIsGeocoding(false);
            return;
          }
        }
      } catch (error) {
        console.warn('Nominatim Geocoding error (falling back):', error);
      }

      // 3. Fallback to BigDataCloud (Very reliable, no key needed for basic usage)
      try {
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
        if (response.ok) {
          const data = await response.json();
          const parts = [];
          if (data.locality) parts.push(data.locality);
          if (data.principalSubdivision) parts.push(data.principalSubdivision);
          if (data.countryName) parts.push(data.countryName);
          
          if (parts.length > 0) {
            setDetectedAddress(parts.join(', '));
            setIsGeocoding(false);
            return;
          }
        }
      } catch (error) {
        console.error('BigDataCloud error:', error);
      }

      // 4. Secondary Fallback to Geocode.maps.co
      try {
        const response = await fetch(`https://geocode.maps.co/reverse?lat=${lat}&lon=${lng}`);
        if (response.ok) {
          const data = await response.json();
          if (data.display_name) {
            setDetectedAddress(data.display_name);
            setIsGeocoding(false);
            return;
          }
        }
      } catch (error) {
        console.error('Geocode.maps.co error:', error);
      }

      // Final message if all fail
      if (!detectedAddress) {
        setDetectedAddress('Location Detected (Please enter address manually)');
      }
      setIsGeocoding(false);
    }, 500); // 0.5 second debounce
  };

  const refreshLocation = () => {
    if (!("geolocation" in navigator)) {
      showToast('Geolocation not supported', 'error');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await updateLocation(position.coords.latitude, position.coords.longitude);
        setIsLocating(false);
        showToast('Location updated', 'success');
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsLocating(false);
        showToast('Failed to get location', 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleFreeSearch = async (query: string) => {
    if (!query || query.length < 3) return;
    setIsSearchingFree(true);
    try {
      const userEmail = 'khanmohammadahmad597@gmail.com';
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&email=${encodeURIComponent(userEmail)}&countrycodes=in`);
      if (response.ok) {
        const data = await response.json();
        setFreeSearchResults(data);
        setIsSearchingFree(false);
        return;
      }
    } catch (error) {
      console.warn('Nominatim search error (falling back):', error);
    }

    // Secondary fallback for search (Geocode.maps.co)
    try {
      const response = await fetch(`https://geocode.maps.co/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setFreeSearchResults(data);
        setIsSearchingFree(false);
        return;
      }
    } catch (error) {
      console.error('Secondary search error:', error);
    }

    showToast('Search failed', 'error');
    setIsSearchingFree(false);
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      setIsLocating(true);
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          updateLocation(position.coords.latitude, position.coords.longitude);
          setIsLocating(false);
        },
        (error) => {
          console.error('Geolocation watch error:', error);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
      );
      
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  useEffect(() => {
    if (showMapModal || showAddressModal) {
      if (isGoogleMapsLoaded && !mapAuthError && googleMapsApiKey) {
        setUseFreeMap(false);
      } else {
        setUseFreeMap(true);
      }
      refreshLocation();
    }
  }, [showMapModal, showAddressModal, isGoogleMapsLoaded, mapAuthError, googleMapsApiKey]);

  // --- Push Notifications ---
  const subscribeToPushNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return;
    }

    try {
      // Explicitly request permission first
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission denied');
        return;
      }

      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service Worker registered:', registration);

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Get VAPID public key from server
      const response = await fetch('/api/vapid-public-key');
      const { publicKey } = await response.json();

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey
      });

      console.log('Push Subscription:', subscription);
      
      // Store subscription in profile
      if (profile && JSON.stringify(profile.pushSubscription) !== JSON.stringify(subscription)) {
        await handleUpdateProfileDoc({ pushSubscription: subscription.toJSON() });
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      if (error instanceof Error && error.message.includes('permission denied')) {
        alert('Notification permission was denied. Please enable notifications in your browser settings and try again. If you are using an iframe, try opening the app in a new tab.');
      }
    }
  };

  // --- Data Fetching ---
  useEffect(() => {
    if (!profile) return;

    // Fetch Products
    const qProducts = query(collection(db, 'products'));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      const pData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(pData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));

    // Fetch Orders
    const qOrders = profile.role === 'admin' 
      ? query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
      : profile.role === 'seller'
        ? query(collection(db, 'orders'), where('sellerId', '==', profile.uid), orderBy('createdAt', 'desc'))
        : query(collection(db, 'orders'), where('customerId', '==', profile.uid), orderBy('createdAt', 'desc'));
    
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      const oData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(oData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));

    // Fetch Sellers (for everyone to check delivery radius)
    const qSellers = profile.role === 'admin'
      ? query(collection(db, 'users'))
      : query(collection(db, 'users'), where('role', '==', 'seller'), where('status', '==', 'approved'));
    
    const unsubSellers = onSnapshot(qSellers, (snapshot) => {
      const sData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
      setSellers(sData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    // Fetch Transactions
    const qTransactions = profile.role === 'admin'
      ? query(collection(db, 'transactions'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'transactions'), where('userId', '==', profile.uid), orderBy('createdAt', 'desc'));
    
    const unsubTransactions = onSnapshot(qTransactions, (snapshot) => {
      const tData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(tData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'transactions'));

    return () => { unsubProducts(); unsubOrders(); unsubSellers(); unsubTransactions(); };
  }, [profile]);

  // --- Notifications ---
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const nData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
      setNotifications(nData);
      
      // Browser notification for new unread notifications
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data() as AppNotification;
          // Check if it's a new notification (not just initial load)
          const isNew = new Date(data.createdAt).getTime() > Date.now() - 10000;
          if (isNew && !data.read && Notification.permission === "granted") {
            new Notification(data.title, { body: data.message });
          }
        }
      });
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'notifications'));

    return () => unsubscribe();
  }, [user]);

  const sendNotification = async (userId: string, title: string, message: string, type: AppNotification['type']) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        userId,
        title,
        message,
        type,
        read: false,
        createdAt: new Date().toISOString(),
        serverSecret: 'alif-laila-push-secret-2026'
      });
    } catch (error) {
      console.error("Error sending notification:", error);
      handleFirestoreError(error, OperationType.WRITE, 'notifications');
    }
  };

  const markNotificationsAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    for (const n of unread) {
      try {
        await updateDoc(doc(db, 'notifications', n.id), { read: true });
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }
  };

  // --- Actions ---
  const [adminOrderTab, setAdminOrderTab] = useState<'new' | 'preparing' | 'delivery' | 'delivered'>('new');
  const [sellerSearch, setSellerSearch] = useState('');

  const [showAddSellerModal, setShowAddSellerModal] = useState(false);
  const [newSellerData, setNewSellerData] = useState({
    name: '',
    email: '',
    mobile: '',
    shopName: '',
    shopAddress: '',
    shopCategory: CATEGORIES[0],
    aadhaarNumber: '',
    panNumber: '',
    licenseNumber: '',
    deliveryRadius: 10,
    deliveryFee: 40
  });

  const handleEmailPasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthLoading(true);

    try {
      const trimmedEmail = email.trim();
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        if (displayName) {
          await updateProfile(userCredential.user, { displayName });
        }
      } else {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      let message = "Authentication failed. Please try again.";
      
      if (error.code === 'auth/email-already-in-use') {
        message = "This email is already registered. Try logging in or use a different email.";
      } else if (error.code === 'auth/invalid-email') {
        message = "Please enter a valid email address.";
      } else if (error.code === 'auth/weak-password') {
        message = "Password should be at least 6 characters.";
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = "Invalid email or password. If you previously used Google to sign in, please use the Google button below.";
      } else if (error.message) {
        message = error.message;
      }
      
      setAuthError(message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const toggleOnline = async () => {
    if (!profile) return;
    const currentStatus = profile.isOnline !== false;
    const newStatus = !currentStatus;
    try {
      await updateDoc(doc(db, 'users', profile.uid), { isOnline: newStatus });
      showToast(`You are now ${newStatus ? 'Online' : 'Offline'}`, 'success');
    } catch (error) {
      console.error("Toggle online error:", error);
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
    }
  };

  const addSellerInstantly = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSellerData.email || !newSellerData.name || !newSellerData.shopName) {
      showToast('Please fill required fields', 'error');
      return;
    }

    try {
      // Create a unique ID for the pre-approved seller
      const tempUid = `pre_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const sellerProfile: UserProfile = {
        uid: tempUid,
        name: newSellerData.name,
        email: newSellerData.email.toLowerCase(),
        role: 'seller',
        status: 'approved',
        isOnline: true,
        mobile: newSellerData.mobile,
        shopName: newSellerData.shopName,
        shopAddress: newSellerData.shopAddress,
        shopCategory: newSellerData.shopCategory,
        aadhaarNumber: newSellerData.aadhaarNumber,
        panNumber: newSellerData.panNumber,
        licenseNumber: newSellerData.licenseNumber,
        deliveryRadius: newSellerData.deliveryRadius,
        deliveryFee: newSellerData.deliveryFee,
        walletBalance: 0,
        applicationDate: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', tempUid), sellerProfile);
      
      setShowAddSellerModal(false);
      setNewSellerData({
        name: '',
        email: '',
        mobile: '',
        shopName: '',
        shopAddress: '',
        shopCategory: CATEGORIES[0],
        aadhaarNumber: '',
        panNumber: '',
        licenseNumber: '',
        deliveryRadius: 10,
        deliveryFee: 40
      });
      
      showToast('Seller added successfully! They can now log in with this email.', 'success');
    } catch (error) {
      console.error('Error adding seller:', error);
      showToast('Failed to add seller', 'error');
    }
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setActiveTab('home');
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
    addToast(`${product.name} added to cart`, 'success', 'Cart Updated');
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const placeOrder = async () => {
    if (!profile || cart.length === 0) return;

    if (!profile.address || !profile.mobile) {
      setAddressFormData({
        address: profile.address || '',
        mobile: profile.mobile || ''
      });
      setShowAddressModal(true);
      return;
    }
    
    const firstProduct = products.find(p => p.id === cart[0].productId);
    if (!firstProduct) return;

    const seller = sellers.find(s => s.uid === firstProduct.sellerId);
    const deliveryFee = seller?.deliveryFee || 0;

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalAmount = subtotal + deliveryFee + PLATFORM_FEE;

    if (paymentMethod === 'online' && profile.walletBalance < totalAmount) {
      showToast('Insufficient wallet balance for online payment. Please add money or use COD.', 'error');
      return;
    }
    
    const orderData: Omit<Order, 'id'> = {
      customerId: profile.uid,
      sellerId: firstProduct.sellerId,
      items: cart,
      totalAmount,
      deliveryFee,
      deliveryCharge: deliveryFee, // Default delivery charge for boy is the fee customer pays
      paymentMethod,
      deliveryAddress: profile.address,
      customerMobile: profile.mobile,
      platformFee: PLATFORM_FEE,
      sellerAmount: subtotal + deliveryFee, // Seller gets product money + delivery fee
      status: 'pending',
      createdAt: Timestamp.now(),
      paymentStatus: paymentMethod === 'online' ? 'paid' : 'pending'
    };

    try {
      if (paymentMethod === 'online') {
        await updateDoc(doc(db, 'users', profile.uid), {
          walletBalance: profile.walletBalance - totalAmount
        });

        // Log transaction for customer
        await addDoc(collection(db, 'transactions'), {
          userId: profile.uid,
          amount: -totalAmount,
          type: 'payment',
          status: 'completed',
          description: `Payment for Order`,
          createdAt: Timestamp.now()
        });
      }

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      setCart([]);
      setActiveTab('orders');
      addToast('Your order has been placed successfully!', 'success', 'Order Confirmed');
      
      // Notify Seller
      await sendNotification(
        firstProduct.sellerId,
        'New Order Received!',
        `You have a new order #${docRef.id.slice(-6).toUpperCase()} for ₹${totalAmount} (${paymentMethod.toUpperCase()})`,
        'order'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    }
  };

  const saveAddress = async () => {
    if (!profile) return;
    if (!addressFormData.address || !addressFormData.mobile) {
      showToast('Address and Mobile are required!', 'error');
      return;
    }
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        address: addressFormData.address,
        mobile: addressFormData.mobile
      });
      setShowAddressModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
    }
  };

  const depositMoney = async () => {
    const amount = Number(depositAmount);
    if (!profile || isNaN(amount) || amount <= 0) {
      showToast('Invalid deposit amount', 'error');
      return;
    }

    try {
      // In a real app, this would trigger a payment gateway
      // For this demo, we'll simulate success
      
      // 1. Create transaction record
      const transactionData: Omit<Transaction, 'id'> = {
        userId: profile.uid,
        amount: amount,
        type: 'deposit',
        status: 'completed',
        description: 'Wallet Top-up',
        createdAt: Timestamp.now()
      };
      await addDoc(collection(db, 'transactions'), transactionData);

      // 2. Update wallet balance
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        walletBalance: (profile.walletBalance || 0) + amount
      });

      addToast(`₹${amount} added to your wallet successfully!`, 'success', 'Wallet Updated');
      setDepositAmount('');
      setActiveTab('wallet');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'transactions');
    }
  };

  const approveWithdrawal = async (transactionId: string, userId: string, amount: number) => {
    if (profile?.role !== 'admin') return;
    
    try {
      const transRef = doc(db, 'transactions', transactionId);
      await updateDoc(transRef, { status: 'completed' });
      
      await sendNotification(
        userId,
        'Withdrawal Completed',
        `Your withdrawal request for ₹${Math.abs(amount)} has been processed successfully.`,
        'payment'
      );
      
      showToast('Withdrawal approved and marked as completed.', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `transactions/${transactionId}`);
    }
  };

  const rejectWithdrawal = async (transactionId: string, userId: string, amount: number) => {
    if (profile?.role !== 'admin') return;
    
    try {
      const transRef = doc(db, 'transactions', transactionId);
      await updateDoc(transRef, { status: 'failed' });
      
      // Refund the amount back to user's wallet
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data() as UserProfile;
        await updateDoc(userRef, {
          walletBalance: (userData.walletBalance || 0) + Math.abs(amount)
        });
      }

      await sendNotification(
        userId,
        'Withdrawal Rejected',
        `Your withdrawal request for ₹${Math.abs(amount)} was rejected. The amount has been refunded to your wallet.`,
        'payment'
      );
      
      showToast('Withdrawal rejected and amount refunded.', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `transactions/${transactionId}`);
    }
  };
  
  const requestWithdrawal = async () => {
    const amount = Number(withdrawalAmount);
    if (!profile || isNaN(amount) || amount <= 0 || amount > profile.walletBalance) {
      showToast('Invalid withdrawal amount', 'error');
      return;
    }

    const finalUpiId = profile.upiId || upiId;
    if (!finalUpiId) {
      showToast('Please enter your UPI ID', 'error');
      return;
    }

    try {
      // 1. Create transaction record
      const transactionData: Omit<Transaction, 'id'> = {
        userId: profile.uid,
        amount: -amount,
        type: 'withdrawal',
        status: 'pending',
        description: `Withdrawal Request to ${finalUpiId}`,
        createdAt: Timestamp.now(),
        upiId: finalUpiId
      };
      await addDoc(collection(db, 'transactions'), transactionData);

      // 2. Update wallet balance and save UPI ID if it's new
      const userRef = doc(db, 'users', profile.uid);
      const updateData: any = {
        walletBalance: profile.walletBalance - amount
      };
      if (!profile.upiId) {
        updateData.upiId = finalUpiId;
      }
      await updateDoc(userRef, updateData);

      addToast('Withdrawal request submitted successfully', 'success', 'Request Sent');
      setWithdrawalAmount('');
      setUpiId('');
      setActiveTab('wallet');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'transactions');
    }
  };

  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');

  const [isAddDeliveryBoyModalOpen, setIsAddDeliveryBoyModalOpen] = useState(false);
  const [editingDeliveryBoy, setEditingDeliveryBoy] = useState<UserProfile | null>(null);
  const [newDeliveryBoy, setNewDeliveryBoy] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    paymentType: 'per_delivery' as 'fixed' | 'per_delivery',
    salary: '',
    deliveryCharge: ''
  });
  const [deliveryBoys, setDeliveryBoys] = useState<UserProfile[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [orderToAssign, setOrderToAssign] = useState<string | null>(null);

  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: 'Grocery',
    description: '',
    image: '',
    expiryTime: ''
  });

  const resetNewProduct = () => {
    setNewProduct({
      name: '',
      price: '',
      category: 'Grocery',
      description: '',
      image: '',
      expiryTime: ''
    });
    setEditingProduct(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 600;
          const MAX_HEIGHT = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.7 quality
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setNewProduct({ ...newProduct, image: compressedBase64 });
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.uid) return;
    
    setIsUploading(true);

    try {
      // Use current location, or profile location, or default to 0,0
      const finalLocation = location || profile.location || { lat: 0, lng: 0 };

      const productData = {
        sellerId: profile.uid,
        name: newProduct.name,
        price: Number(newProduct.price),
        category: newProduct.category,
        image: newProduct.image || `https://picsum.photos/seed/${newProduct.name}/400/400`,
        location: finalLocation,
        description: newProduct.description,
        expiryTime: newProduct.expiryTime || null,
        updatedAt: new Date().toISOString()
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: new Date().toISOString()
        });
      }

      setIsAddProductModalOpen(false);
      resetNewProduct();
      addToast(editingProduct ? 'Product updated successfully!' : 'Product created successfully!', 'success', 'Inventory Updated');
    } catch (error) {
      console.error("Error saving product:", error);
      showToast("Failed to save product. Please check your connection.", 'error');
      handleFirestoreError(error, OperationType.WRITE, 'products');
    } finally {
      setIsUploading(false);
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      description: product.description,
      image: product.image,
      expiryTime: product.expiryTime || ''
    });
    setIsAddProductModalOpen(true);
  };

  const deleteProduct = async (productId: string) => {
    try {
      await deleteDoc(doc(db, 'products', productId));
      setProductToDelete(null);
      addToast('Product deleted successfully!', 'success', 'Inventory Updated');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${productId}`);
    }
  };

  const handleAddDeliveryBoy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.uid) return;
    
    setIsUploading(true);
    try {
      const dboyData: any = {
        name: newDeliveryBoy.name,
        email: newDeliveryBoy.email,
        mobile: newDeliveryBoy.mobile,
        role: 'delivery_boy',
        sellerId: profile.uid,
        status: 'approved',
        isOnline: false,
        paymentType: newDeliveryBoy.paymentType,
        salary: newDeliveryBoy.paymentType === 'fixed' ? Number(newDeliveryBoy.salary) : 0,
        deliveryCharge: newDeliveryBoy.paymentType === 'per_delivery' ? Number(newDeliveryBoy.deliveryCharge) : 0,
        walletBalance: 0,
        createdAt: new Date().toISOString(),
        serverSecret: 'alif-laila-push-secret-2026'
      };

      if (editingDeliveryBoy) {
        await updateDoc(doc(db, 'users', editingDeliveryBoy.uid), dboyData);
        addToast('Delivery boy updated successfully', 'success', 'Success');
      } else {
        // In a real app, we would use Firebase Admin to create the user
        // For this demo, we'll just add a document to the users collection
        // and assume they can log in with the provided email/password
        const tempUid = `dboy_${Date.now()}`;
        await setDoc(doc(db, 'users', tempUid), {
          ...dboyData,
          uid: tempUid
        });
        addToast('Delivery boy added successfully', 'success', 'Success');
      }

      setIsAddDeliveryBoyModalOpen(false);
      setEditingDeliveryBoy(null);
      setNewDeliveryBoy({
        name: '',
        email: '',
        mobile: '',
        password: '',
        paymentType: 'per_delivery',
        salary: '',
        deliveryCharge: ''
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'users');
    } finally {
      setIsUploading(false);
    }
  };

  const deleteDeliveryBoy = async (uid: string) => {
    try {
      await deleteDoc(doc(db, 'users', uid));
      addToast('Delivery boy removed', 'success', 'Success');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${uid}`);
    }
  };

  const toggleDeliveryBoyStatus = async (uid: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', uid), { isOnline: !currentStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  useEffect(() => {
    if (profile?.role === 'seller') {
      const q = query(collection(db, 'users'), where('sellerId', '==', profile.uid), where('role', '==', 'delivery_boy'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const boys = snapshot.docs.map(doc => doc.data() as UserProfile);
        setDeliveryBoys(boys);
      });
      return () => unsubscribe();
    }
  }, [profile]);

  useEffect(() => {
    if (profile && !profile.serverSecret) {
      handleUpdateProfileDoc({ serverSecret: 'alif-laila-push-secret-2026' });
    }
  }, [profile]);

  const handleUpdateProfileDoc = async (data: Partial<UserProfile>) => {
    if (!profile) return;
    try {
      await updateDoc(doc(db, 'users', profile.uid), data);
      setProfile({ ...profile, ...data });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
    }
  };

  const submitSellerApplication = async () => {
    if (!profile) return;
    if (!sellerFormData.shopName || !sellerFormData.shopAddress || !sellerFormData.mobile || !sellerFormData.aadhaarNumber || !sellerFormData.panNumber) {
      showToast('Please fill all required fields (Shop Name, Address, Mobile, Aadhaar, and PAN)', 'error');
      return;
    }

    const updated: UserProfile = { 
      ...profile, 
      ...sellerFormData,
      location: location || profile.location || { lat: 0, lng: 0 },
      status: 'pending',
      applicationDate: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'users', profile.uid), updated);
      setProfile(updated);
      setShowSellerForm(false);
      
      // Notify Admin (In a real app, we'd notify all admins)
      // For now, we just log it or notify the user themselves that it's submitted
      await sendNotification(
        profile.uid,
        'Application Submitted',
        'Your seller application has been submitted and is under review.',
        'system'
      );
      
      addToast('Application submitted! Please wait 24 hours for admin approval.', 'success', 'Application Received');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    const orderRef = doc(db, 'orders', orderId);
    try {
      await updateDoc(orderRef, { status: newStatus });

      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        const order = orderSnap.data() as Order;
        
        // Notify Customer
        let title = 'Order Update';
        let message = `Your order #${orderId.slice(-6).toUpperCase()} is now ${newStatus.replace(/_/g, ' ')}`;
        
        if (newStatus === 'accepted') {
          title = 'Order Accepted!';
          message = `Great news! Your order #${orderId.slice(-6).toUpperCase()} has been accepted by the seller.`;
        } else if (newStatus === 'out_for_delivery') {
          title = 'Order Out for Delivery';
          message = `Your order #${orderId.slice(-6).toUpperCase()} is on its way!`;
        } else if (newStatus === 'delivered') {
          title = 'Order Delivered';
          message = `Your order #${orderId.slice(-6).toUpperCase()} has been successfully delivered.`;
        } else if (newStatus === 'rejected') {
          title = 'Order Rejected';
          message = `Sorry, your order #${orderId.slice(-6).toUpperCase()} was rejected by the seller.`;
        }

        await sendNotification(order.customerId, title, message, 'order');

        if (newStatus === 'rejected' && order.paymentMethod === 'online') {
          // Refund to customer wallet
          const customerRef = doc(db, 'users', order.customerId);
          const customerSnap = await getDoc(customerRef);
          if (customerSnap.exists()) {
            const customerData = customerSnap.data() as UserProfile;
            await updateDoc(customerRef, {
              walletBalance: (customerData.walletBalance || 0) + order.totalAmount
            });

            // Log refund transaction
            await addDoc(collection(db, 'transactions'), {
              userId: order.customerId,
              amount: order.totalAmount,
              type: 'refund',
              status: 'completed',
              description: `Refund for Rejected Order #${orderId.slice(-6)}`,
              createdAt: Timestamp.now()
            });

            await sendNotification(
              order.customerId,
              'Refund Processed',
              `₹${order.totalAmount} has been refunded to your wallet for order #${orderId.slice(-6).toUpperCase()}`,
              'payment'
            );
          }
        }

        if (newStatus === 'delivered') {
          const sellerRef = doc(db, 'users', order.sellerId);
          const sellerSnap = await getDoc(sellerRef);
          if (sellerSnap.exists()) {
            const sellerData = sellerSnap.data() as UserProfile;
            
            let amountToUpdate = 0;
            if (order.paymentMethod === 'online') {
              // For online, seller gets their share (Subtotal + Delivery Fee)
              // Platform keeps only the Platform Fee
              amountToUpdate = order.sellerAmount;
            } else {
              // For COD, seller collected (Subtotal + Delivery Fee + Platform Fee) in cash.
              // Seller keeps Subtotal + Delivery Fee.
              // Seller owes only the Platform Fee to the platform.
              amountToUpdate = -order.platformFee;
            }

            await updateDoc(sellerRef, { 
              walletBalance: (sellerData.walletBalance || 0) + amountToUpdate 
            });

            // Log transaction for seller
            await addDoc(collection(db, 'transactions'), {
              userId: order.sellerId,
              amount: amountToUpdate,
              type: amountToUpdate > 0 ? 'earning' : 'fee',
              status: 'completed',
              description: amountToUpdate > 0 
                ? `Earnings from Order #${orderId.slice(-6)}` 
                : `Platform Fee for Order #${orderId.slice(-6)}`,
              createdAt: Timestamp.now()
            });
            
            // Notify Seller
            if (amountToUpdate > 0) {
              await sendNotification(
                order.sellerId,
                'Payment Received',
                `₹${amountToUpdate} added to wallet for order #${orderId.slice(-6).toUpperCase()}`,
                'payment'
              );
            } else if (amountToUpdate < 0) {
              await sendNotification(
                order.sellerId,
                'Platform Fee Deducted',
                `₹${Math.abs(amountToUpdate)} platform fee deducted for COD order #${orderId.slice(-6).toUpperCase()}`,
                'payment'
              );
            }

            // --- Handle Delivery Boy Payment ---
            if (order.deliveryBoyId) {
              const dboyRef = doc(db, 'users', order.deliveryBoyId);
              const dboySnap = await getDoc(dboyRef);
              if (dboySnap.exists()) {
                const dboyData = dboySnap.data() as UserProfile;
                // Only pay if they are on per_delivery model
                if (dboyData.paymentType === 'per_delivery') {
                  const charge = order.deliveryCharge || 0;
                  if (charge > 0) {
                    await updateDoc(dboyRef, {
                      walletBalance: (dboyData.walletBalance || 0) + charge
                    });
                    
                    // Log transaction for delivery boy
                    await addDoc(collection(db, 'transactions'), {
                      userId: order.deliveryBoyId,
                      amount: charge,
                      type: 'earning',
                      status: 'completed',
                      description: `Delivery Charge for Order #${orderId.slice(-6)}`,
                      createdAt: Timestamp.now()
                    });

                    // Notify Delivery Boy
                    await sendNotification(
                      order.deliveryBoyId,
                      'Earnings Added',
                      `₹${charge} added to your wallet for delivery #${orderId.slice(-6).toUpperCase()}`,
                      'payment'
                    );
                  }
                }
              }
            }
          }
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  // --- Filtered Data ---
  const nearbyProducts = useMemo(() => {
    return products.filter(p => {
      const seller = sellers.find(s => s.uid === p.sellerId);
      
      // If seller not found (not approved or not a seller), hide product
      if (!seller) return false;

      // Filter out products from offline sellers
      // If isOnline is undefined, we treat it as true (default online)
      if (seller.isOnline === false) {
        return false;
      }

      // Distance filter based on seller's delivery radius
      if (location) {
        if (seller.location) {
          const dist = calculateDistance(location.lat, location.lng, seller.location.lat, seller.location.lng);
          const radius = seller.deliveryRadius || 5; // default 5km
          return dist <= radius;
        }
      }
      return true; // Show if location not available (fallback)
    });
  }, [products, location, sellers]);

  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return nearbyProducts;
    return nearbyProducts.filter(p => p.category === selectedCategory);
  }, [nearbyProducts, selectedCategory]);

  // --- Views ---

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-orange-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full mb-4"
        />
        <p className="text-orange-800 font-medium animate-pulse">Loading Alif Laila...</p>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 bg-red-50 text-center">
        <AlertCircle size={64} className="text-red-600 mb-4" />
        <h2 className="text-2xl font-bold text-red-900 mb-2">Initialization Error</h2>
        <p className="text-red-700 mb-6">{initError}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-red-600 text-white px-6 py-3 rounded-2xl font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!user) {
    if (isAdminRoute) {
      return (
        <div className="h-screen flex flex-col items-center justify-center p-6 bg-gray-900 text-white">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 bg-orange-600 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-orange-900/50"
          >
            <ShieldCheck size={48} className="text-white" />
          </motion.div>
          <h1 className="text-4xl font-black mb-2 tracking-tighter">ADMIN PORTAL</h1>
          <p className="text-gray-400 text-center mb-12 font-medium">Authorized Personnel Only</p>
          
          <button 
            onClick={handleLogin}
            className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-900/50 flex items-center justify-center space-x-3 active:scale-95 transition-transform"
          >
            <span>Admin Login</span>
            <ArrowRight size={20} />
          </button>

          <button 
            onClick={() => { window.location.hash = ''; }}
            className="mt-8 text-gray-500 text-sm font-bold hover:text-gray-300 transition-colors"
          >
            Back to User Site
          </button>
        </div>
      );
    }

    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 bg-white overflow-y-auto">
        <div className="w-20 h-20 bg-orange-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-orange-200 shrink-0">
          <ShoppingBag size={40} className="text-white" />
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Alif Laila</h1>
          <p className="text-gray-500 text-sm">Your local marketplace for everything nearby.</p>
        </div>

        <div className="w-full max-w-sm space-y-6">
          <form onSubmit={handleEmailPasswordAuth} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Full Name</label>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                  required={isSignUp}
                />
              </div>
            )}
            
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            
            {authError && (
              <div className="flex items-center space-x-2 text-red-500 bg-red-50 p-3 rounded-xl text-xs font-bold">
                <AlertCircle size={14} />
                <span>{authError}</span>
              </div>
            )}

            <button 
              type="submit"
              disabled={isAuthLoading || !email || !password}
              className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-orange-200 flex items-center justify-center space-x-3 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
            >
              {isAuthLoading ? (
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <>
                  <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            <button 
              onClick={() => { setIsSignUp(!isSignUp); setAuthError(''); }}
              className="text-gray-500 text-xs font-bold hover:text-orange-600 transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
            </button>
          </div>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-gray-400 font-bold">Or continue with</span>
            </div>
          </div>

          <button 
            onClick={handleLogin}
            className="w-full bg-white border-2 border-gray-100 text-gray-700 py-4 rounded-2xl font-bold text-sm flex items-center justify-center space-x-3 active:scale-95 transition-transform"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            <span>Google Account</span>
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center mb-6">
          <User size={40} className="text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Setting up your profile...</h2>
        <p className="text-gray-500 text-sm mb-8 max-w-xs">We're preparing your Alif Laila experience. This usually takes just a few seconds.</p>
        <div className="flex flex-col space-y-3 w-full max-w-xs">
          <button 
            onClick={() => window.location.reload()}
            className="bg-orange-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-orange-200"
          >
            Refresh Page
          </button>
          <button 
            onClick={async () => {
              if (!user) return;
              const docRef = doc(db, 'users', user.uid);
              const initialProfile: UserProfile = {
                uid: user.uid,
                name: user.displayName || 'User',
                email: user.email || '',
                role: (user.email?.toLowerCase() === 'khanmohammadahmad1@gmail.com') ? 'admin' : 
                      (user.email?.toLowerCase() === 'khanmohammadahmad597@gmail.com' || user.email?.toLowerCase() === 'khanmohammadahmad@gmail.com' || user.email?.toLowerCase() === 'khanmohammadahmad3@gmail.com') ? 'seller' : 'customer',
                status: 'approved',
                walletBalance: 0,
                createdAt: new Date().toISOString()
              };
              try {
                await setDoc(docRef, initialProfile);
                setProfile(initialProfile);
                addToast('Profile created successfully!', 'success', 'Welcome!');
              } catch (err) {
                handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
              }
            }}
            className="text-orange-600 text-sm font-bold py-2"
          >
            Stuck? Click to create profile manually
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="p-4 pb-24 space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Location</p>
                <div className="flex items-center text-orange-600 font-bold">
                  <MapPin size={16} className="mr-1 flex-shrink-0" />
                  <span className="truncate text-sm max-w-[180px]">{detectedAddress || 'Detecting...'}</span>
                  <button 
                    onClick={() => setShowMapModal(true)}
                    className="ml-2 p-1 rounded-full hover:bg-orange-50 transition-colors"
                  >
                    <Search size={14} />
                  </button>
                  <button 
                    onClick={refreshLocation}
                    disabled={isLocating}
                    className={`ml-1 p-1 rounded-full hover:bg-orange-50 transition-colors ${isLocating ? 'animate-spin' : ''}`}
                  >
                    <Activity size={14} />
                  </button>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                <User size={20} />
              </div>
            </div>

            <div className="bg-orange-600 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-orange-100">
              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-1">Fresh Deals!</h2>
                <p className="text-orange-100 text-sm mb-4">Get up to 50% off on daily needs.</p>
                <button className="bg-white text-orange-600 px-4 py-2 rounded-xl text-xs font-bold">Shop Now</button>
              </div>
              <ShoppingBag size={120} className="absolute -right-8 -bottom-8 text-orange-500 opacity-30 rotate-12" />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">Nearby Products</h3>
                <button className="text-orange-600 text-sm font-bold">See All</button>
              </div>
              
              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag className="text-gray-300" size={32} />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1">No Products Found</h4>
                  <p className="text-gray-500 text-xs mb-4">
                    {sellers.length === 0 
                      ? "There are no approved sellers in the system yet." 
                      : location 
                        ? "No sellers are currently within your delivery range." 
                        : "We're looking for products near you..."}
                  </p>
                  {profile?.role === 'admin' && sellers.length === 0 && (
                    <button 
                      onClick={() => {
                        window.location.hash = '#/admin';
                        setIsAdminRoute(true);
                        setActiveTab('admin-dashboard');
                      }}
                      className="text-orange-600 text-xs font-bold underline"
                    >
                      Go to Admin to approve sellers
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {filteredProducts.map(product => (
                    <motion.div 
                      layoutId={product.id}
                      key={product.id} 
                      className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm relative overflow-hidden cursor-pointer"
                      onClick={() => setSelectedProduct(product)}
                    >
                      {product.expiryTime && <CountdownTimer expiryTime={product.expiryTime} />}
                      <img 
                        src={product.image || `https://picsum.photos/seed/${product.name}/200/200`} 
                        alt={product.name} 
                        className="w-full aspect-square object-cover rounded-xl mb-3"
                        referrerPolicy="no-referrer"
                      />
                      <h4 className="font-bold text-gray-900 text-sm truncate">{product.name}</h4>
                      <p className="text-gray-500 text-xs mb-2">{product.category}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-orange-600 font-bold">₹{product.price}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                          }}
                          className="bg-orange-600 text-white p-2 rounded-lg active:scale-90 transition-transform"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Product Preview Modal */}
              <AnimatePresence>
                {selectedProduct && (
                  <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm p-4">
                    <motion.div 
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      exit={{ y: "100%" }}
                      className="bg-white w-full max-w-lg rounded-t-[40px] overflow-hidden shadow-2xl"
                    >
                      <div className="relative h-80">
                        <img 
                          src={selectedProduct.image || `https://picsum.photos/seed/${selectedProduct.name}/400/400`} 
                          alt={selectedProduct.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <button 
                          onClick={() => setSelectedProduct(null)}
                          className="absolute top-6 right-6 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-gray-900 shadow-lg"
                        >
                          <X size={20} />
                        </button>
                      </div>
                      <div className="p-8 space-y-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900">{selectedProduct.name}</h3>
                            <p className="text-orange-600 font-bold text-lg mt-1">₹{selectedProduct.price}</p>
                          </div>
                          <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            {selectedProduct.category}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-600 shadow-sm">
                              <Truck size={20} />
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Delivery Fee</p>
                              <p className="font-bold text-gray-900">₹{sellers.find(s => s.uid === selectedProduct.sellerId)?.deliveryFee || 0}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Seller</p>
                            <p className="font-bold text-gray-900 truncate max-w-[120px]">{sellers.find(s => s.uid === selectedProduct.sellerId)?.shopName || 'Local Seller'}</p>
                          </div>
                        </div>
                        <p className="text-gray-500 leading-relaxed">
                          {selectedProduct.description}
                        </p>
                        <div className="flex items-center space-x-4 pt-4">
                          <button 
                            onClick={() => {
                              addToCart(selectedProduct);
                              setSelectedProduct(null);
                            }}
                            className="flex-1 bg-orange-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-100 active:scale-95 transition-transform flex items-center justify-center space-x-2"
                          >
                            <ShoppingBag size={20} />
                            <span>Add to Cart</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        );

      case 'categories':
        return (
          <div className="p-4 pb-24 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
            <div className="grid grid-cols-3 gap-4">
              {CATEGORIES.map(cat => (
                <button 
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat === selectedCategory ? null : cat);
                    setActiveTab('home');
                  }}
                  className={`flex flex-col items-center p-4 rounded-2xl border transition-all ${
                    selectedCategory === cat 
                      ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-100' 
                      : 'bg-white border-gray-100 text-gray-600'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${
                    selectedCategory === cat ? 'bg-orange-500' : 'bg-orange-50'
                  }`}>
                    <Package size={24} className={selectedCategory === cat ? 'text-white' : 'text-orange-600'} />
                  </div>
                  <span className="text-[10px] font-bold text-center">{cat}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 'orders':
        return (
          <div className="p-4 pb-24 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">My Orders</h2>
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Package size={64} className="mb-4 opacity-20" />
                <p>No orders yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div 
                    key={order.id} 
                    onClick={() => setSelectedOrder(order)}
                    className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3 cursor-pointer active:scale-[0.98] transition-transform"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-gray-400 font-mono">#{order.id.slice(-6).toUpperCase()}</p>
                        <p className="text-sm font-bold text-gray-900">{order.items.length} Items</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-600' :
                        order.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                      <span className="text-gray-500 text-sm">Total Amount</span>
                      <span className="text-orange-600 font-bold">₹{order.totalAmount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'wallet':
        return (
          <div className="p-4 pb-24 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">My Wallet</h2>
            
            <div className="bg-gray-900 rounded-[32px] p-8 text-white shadow-2xl shadow-gray-200 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-orange-600/20 rounded-full blur-3xl" />
              <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">Available Balance</p>
                <h3 className="text-5xl font-bold mb-8">₹{(profile?.walletBalance || 0).toFixed(2)}</h3>
                
                <div className="flex space-x-3">
                  <button 
                    onClick={() => setActiveTab('deposit')}
                    className="flex-1 bg-orange-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-orange-900/20 active:scale-95 transition-transform flex items-center justify-center space-x-2"
                  >
                    <PlusCircle size={18} />
                    <span>Add Money</span>
                  </button>
                  {profile?.role === 'seller' && (
                    <button 
                      onClick={() => setActiveTab('withdraw')}
                      className="flex-1 bg-white/10 backdrop-blur-md text-white py-4 rounded-2xl font-bold text-sm border border-white/10 active:scale-95 transition-transform flex items-center justify-center space-x-2"
                    >
                      <Wallet size={18} />
                      <span>Withdraw</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h4 className="font-bold text-gray-900">Recent Transactions</h4>
                <button onClick={() => setActiveTab('history')} className="text-xs text-orange-600 font-bold">View All</button>
              </div>
              
              <div className="space-y-3">
                {transactions.filter(t => t.userId === profile?.uid).slice(0, 5).length === 0 ? (
                  <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center">
                    <Clock size={32} className="text-gray-200 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm font-bold">No transactions yet</p>
                  </div>
                ) : (
                  transactions.filter(t => t.userId === profile?.uid).slice(0, 5).map(t => (
                    <div key={t.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          t.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {t.type === 'withdrawal' ? <Wallet size={20} /> : <ArrowRight size={20} className={t.amount > 0 ? '-rotate-45' : 'rotate-135'} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 line-clamp-1">{t.description}</p>
                          <p className="text-[10px] text-gray-400">{t.createdAt?.toDate().toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-sm ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {t.amount > 0 ? '+' : ''}₹{Math.abs(t.amount)}
                        </p>
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{t.status}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );

      case 'account':
        if (showSellerForm) {
          return (
            <div className="p-4 pb-24 space-y-6">
              <div className="flex items-center space-x-3">
                <button onClick={() => setShowSellerForm(false)} className="p-2 bg-white rounded-xl border border-gray-100">
                  <ChevronRight className="rotate-180" size={20} />
                </button>
                <h2 className="text-2xl font-bold text-gray-900">Seller Application</h2>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Shop Name</label>
                    <input 
                      type="text" 
                      value={sellerFormData.shopName}
                      onChange={(e) => setSellerFormData({...sellerFormData, shopName: e.target.value})}
                      placeholder="Enter your shop name"
                      className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Shop Address</label>
                    <textarea 
                      value={sellerFormData.shopAddress}
                      onChange={(e) => setSellerFormData({...sellerFormData, shopAddress: e.target.value})}
                      placeholder="Shop No, Building Name, Road, Area, City..."
                      className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-orange-500 min-h-[100px]"
                    />
                    <button 
                      onClick={() => setSellerFormData({...sellerFormData, shopAddress: detectedAddress})}
                      className="text-[10px] text-orange-600 font-bold mt-1 ml-1"
                    >
                      Use Current Location
                    </button>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Mobile Number</label>
                    <input 
                      type="tel" 
                      value={sellerFormData.mobile}
                      onChange={(e) => setSellerFormData({...sellerFormData, mobile: e.target.value})}
                      placeholder="Enter contact number"
                      className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Category</label>
                    <select 
                      value={sellerFormData.shopCategory}
                      onChange={(e) => setSellerFormData({...sellerFormData, shopCategory: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-3">Identity & Licenses</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Aadhaar Card Number</label>
                        <input 
                          type="text" 
                          value={sellerFormData.aadhaarNumber}
                          onChange={(e) => setSellerFormData({...sellerFormData, aadhaarNumber: e.target.value})}
                          placeholder="12-digit Aadhaar Number"
                          className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">PAN Card Number</label>
                        <input 
                          type="text" 
                          value={sellerFormData.panNumber}
                          onChange={(e) => setSellerFormData({...sellerFormData, panNumber: e.target.value})}
                          placeholder="10-digit PAN Number"
                          className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                          {sellerFormData.shopCategory === 'Medicine' ? 'Medical License Number' : 
                           (sellerFormData.shopCategory === 'Grocery' || sellerFormData.shopCategory === 'Snacks') ? 'Food License (FSSAI) Number' : 
                           'Shop/Trade License Number'}
                        </label>
                        <input 
                          type="text" 
                          value={sellerFormData.licenseNumber}
                          onChange={(e) => setSellerFormData({...sellerFormData, licenseNumber: e.target.value})}
                          placeholder="Enter License Number"
                          className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={submitSellerApplication}
                  className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-100 active:scale-95 transition-transform mt-4"
                >
                  Submit Application
                </button>
                <p className="text-[10px] text-gray-400 text-center italic">
                  Note: Approval usually takes 24 hours.
                </p>
              </div>
            </div>
          );
        }

        return (
          <div className="p-4 pb-24 space-y-6">
            <div className="flex flex-col items-center py-6">
              <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mb-4 border-4 border-white shadow-lg">
                <User size={48} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{profile?.name}</h2>
              <p className="text-gray-500 text-sm">{profile?.email}</p>
              {profile?.role === 'seller' && (
                <p className="text-orange-600 font-bold text-sm mt-1 flex items-center">
                  <Store size={14} className="mr-1" />
                  {profile.shopName}
                </p>
              )}
              <span className="mt-2 text-[10px] font-bold px-3 py-1 bg-orange-100 text-orange-600 rounded-full uppercase tracking-widest">
                {profile?.role}
              </span>
            </div>

            <div className="space-y-2">
              <button 
                onClick={() => {
                  setAddressFormData({
                    address: profile?.address || '',
                    mobile: profile?.mobile || ''
                  });
                  setShowAddressModal(true);
                }}
                className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100"
              >
                <div className="flex items-center space-x-3 text-gray-700">
                  <MapPin size={20} />
                  <span className="font-bold text-sm">
                    {profile?.address ? 'Update Address' : 'Add Address'}
                  </span>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100"
              >
                <div className="flex items-center space-x-3 text-gray-700">
                  <Settings size={20} />
                  <span className="font-bold text-sm">Settings</span>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </button>
              <button 
                onClick={() => setActiveTab('wallet')}
                className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100"
              >
                <div className="flex items-center space-x-3 text-orange-600">
                  <Wallet size={20} />
                  <span className="font-bold text-sm">My Wallet</span>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100"
              >
                <div className="flex items-center space-x-3 text-gray-700">
                  <Clock size={20} />
                  <span className="font-bold text-sm">Transaction History</span>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </button>
              {profile?.role === 'seller' && (
                <button 
                  onClick={() => setActiveTab('seller-dashboard')}
                  className="w-full flex items-center justify-between p-4 bg-orange-600 text-white rounded-2xl border border-orange-500 shadow-lg shadow-orange-100"
                >
                  <div className="flex items-center space-x-3">
                    <Store size={20} />
                    <span className="font-bold text-sm uppercase tracking-widest">Seller Dashboard</span>
                  </div>
                  <ChevronRight size={16} className="text-orange-200" />
                </button>
              )}
              {profile?.role === 'admin' && (
                <button 
                  onClick={() => {
                    window.location.hash = '#/admin';
                    setIsAdminRoute(true);
                    setActiveTab('admin-dashboard');
                  }}
                  className="w-full flex items-center justify-between p-4 bg-gray-900 text-white rounded-2xl border border-gray-800 shadow-lg shadow-gray-200"
                >
                  <div className="flex items-center space-x-3">
                    <ShieldCheck size={20} className="text-orange-500" />
                    <span className="font-bold text-sm uppercase tracking-widest">Admin Control Panel</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>
              )}
              {profile?.role === 'customer' && profile?.status === 'approved' && (
                <button 
                  onClick={() => setShowSellerForm(true)}
                  className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100"
                >
                  <div className="flex items-center space-x-3 text-orange-600">
                    <Store size={20} />
                    <span className="font-bold text-sm">Become a Seller</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>
              )}
              {profile?.status === 'pending' && profile?.role === 'customer' && (
                <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 space-y-2 text-orange-600">
                  <div className="flex items-center space-x-3">
                    <Clock size={20} />
                    <span className="font-bold text-sm">Application Pending</span>
                  </div>
                  <p className="text-[10px] italic ml-8 opacity-80">
                    Your application is under review. Please wait 24 hours for approval.
                  </p>
                </div>
              )}
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100 mt-4"
              >
                <div className="flex items-center space-x-3 text-red-600">
                  <LogOut size={20} />
                  <span className="font-bold text-sm">Logout</span>
                </div>
              </button>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="p-4 pb-24 space-y-6">
            <div className="flex items-center space-x-3">
              <button onClick={() => setActiveTab('account')} className="p-2 bg-white rounded-xl border border-gray-100">
                <ChevronRight className="rotate-180" size={20} />
              </button>
              <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-4">
                <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wider">Profile Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Full Name</label>
                    <input 
                      type="text" 
                      defaultValue={profile?.name}
                      onBlur={(e) => handleUpdateProfileDoc({ name: e.target.value })}
                      className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Mobile Number</label>
                    <input 
                      type="tel" 
                      defaultValue={profile?.mobile}
                      onBlur={(e) => handleUpdateProfileDoc({ mobile: e.target.value })}
                      placeholder="Enter mobile number"
                      className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Delivery Address</label>
                    <textarea 
                      defaultValue={profile?.address}
                      onBlur={(e) => handleUpdateProfileDoc({ address: e.target.value })}
                      placeholder="Enter your full delivery address"
                      className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-orange-500 min-h-[80px]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Notifications</label>
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl mt-1">
                      <span className={`text-sm font-bold ${Notification.permission === 'denied' ? 'text-red-600' : 'text-gray-700'}`}>
                        {Notification.permission === 'granted' ? 'Enabled' : Notification.permission === 'denied' ? 'Blocked' : 'Disabled'}
                      </span>
                      {Notification.permission !== 'granted' && (
                        <button 
                          onClick={() => subscribeToPushNotifications()}
                          className="text-[10px] font-bold text-orange-600 uppercase tracking-widest"
                        >
                          {Notification.permission === 'denied' ? 'Retry' : 'Enable'}
                        </button>
                      )}
                    </div>
                    {Notification.permission === 'denied' && (
                      <p className="text-[8px] text-red-400 mt-1 ml-1 leading-tight">
                        Permission was denied. Please reset permissions in your browser settings or try opening the app in a new tab.
                      </p>
                    )}
                  </div>
                  {profile?.role === 'seller' && (
                    <>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Shop Name</label>
                        <input 
                          type="text" 
                          defaultValue={profile?.shopName}
                          onBlur={(e) => handleUpdateProfileDoc({ shopName: e.target.value })}
                          className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Delivery Radius (km)</label>
                        <input 
                          type="number" 
                          defaultValue={profile?.deliveryRadius || 5}
                          onBlur={(e) => handleUpdateProfileDoc({ deliveryRadius: Number(e.target.value) })}
                          className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                          placeholder="e.g. 5"
                        />
                        <p className="text-[10px] text-gray-400 mt-1 ml-1">How far you can deliver from your shop.</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Delivery Fee (₹)</label>
                        <input 
                          type="number" 
                          defaultValue={profile?.deliveryFee || 0}
                          onBlur={(e) => handleUpdateProfileDoc({ deliveryFee: Number(e.target.value) })}
                          className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                          placeholder="e.g. 20"
                        />
                        <p className="text-[10px] text-gray-400 mt-1 ml-1">Flat fee for delivery.</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-2">
                <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-2">Preferences</h3>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-bold text-gray-700">Push Notifications</span>
                  <div className="w-10 h-6 bg-orange-600 rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-gray-50">
                  <span className="text-sm font-bold text-gray-700">Dark Mode</span>
                  <div className="w-10 h-6 bg-gray-200 rounded-full relative">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'history':
        return (
          <div className="p-4 pb-24 space-y-6">
            <div className="flex items-center space-x-3">
              <button onClick={() => setActiveTab('account')} className="p-2 bg-white rounded-xl border border-gray-100">
                <ChevronRight className="rotate-180" size={20} />
              </button>
              <h2 className="text-2xl font-bold text-gray-900">History</h2>
            </div>

            <div className="space-y-3">
              {(profile?.role === 'admin' ? transactions : transactions.filter(t => t.userId === profile?.uid)).length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mx-auto mb-4">
                    <Clock size={32} />
                  </div>
                  <p className="text-gray-400 font-bold">No transactions yet</p>
                </div>
              ) : (
                (profile?.role === 'admin' ? transactions : transactions.filter(t => t.userId === profile?.uid)).map(t => (
                  <div key={t.id} className="bg-white p-4 rounded-2xl border border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          t.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {t.type === 'withdrawal' ? <Wallet size={20} /> : <ArrowRight size={20} className={t.amount > 0 ? '-rotate-45' : 'rotate-135'} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{t.description}</p>
                          <p className="text-[10px] text-gray-400">{t.createdAt?.toDate().toLocaleString()}</p>
                          {t.upiId && <p className="text-[10px] text-blue-600 font-bold">UPI: {t.upiId}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {t.amount > 0 ? '+' : ''}₹{Math.abs(t.amount)}
                        </p>
                        <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          t.status === 'completed' ? 'bg-green-100 text-green-600' : 
                          t.status === 'pending' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                    
                    {profile?.role === 'admin' && t.type === 'withdrawal' && t.status === 'pending' && (
                      <div className="flex space-x-2 pt-2 border-t border-gray-50">
                        <button 
                          onClick={() => approveWithdrawal(t.id, t.userId, t.amount)}
                          className="flex-1 bg-green-600 text-white py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => rejectWithdrawal(t.id, t.userId, t.amount)}
                          className="flex-1 bg-red-600 text-white py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'deposit':
        return (
          <div className="p-4 pb-24 space-y-6">
            <div className="flex items-center space-x-3">
              <button onClick={() => setActiveTab('wallet')} className="p-2 bg-white rounded-xl border border-gray-100">
                <ChevronRight className="rotate-180" size={20} />
              </button>
              <h2 className="text-2xl font-bold text-gray-900">Add Money</h2>
            </div>

            <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-lg shadow-blue-100">
              <p className="text-blue-100 text-sm font-bold uppercase tracking-widest mb-1">Current Balance</p>
              <h3 className="text-4xl font-bold">₹{(profile?.walletBalance || 0).toFixed(2)}</h3>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Amount to Add</label>
                <div className="relative mt-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-lg">₹</span>
                  <input 
                    type="number" 
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 pl-10 text-xl font-bold focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[100, 500, 1000].map(amt => (
                  <button 
                    key={amt}
                    onClick={() => setDepositAmount(amt.toString())}
                    className="py-2 bg-gray-50 rounded-xl text-sm font-bold text-gray-600 border border-gray-100 active:bg-blue-50 active:text-blue-600 active:border-blue-100"
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>

              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start space-x-3">
                <ShieldCheck size={20} className="text-blue-600 mt-0.5" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  Your payment is secured with 256-bit encryption. Money will be added instantly to your wallet.
                </p>
              </div>

              <button 
                onClick={depositMoney}
                disabled={!depositAmount || Number(depositAmount) <= 0}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-100 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
              >
                Add Money
              </button>
            </div>
          </div>
        );

      case 'withdraw':
        return (
          <div className="p-4 pb-24 space-y-6">
            <div className="flex items-center space-x-3">
              <button onClick={() => setActiveTab('wallet')} className="p-2 bg-white rounded-xl border border-gray-100">
                <ChevronRight className="rotate-180" size={20} />
              </button>
              <h2 className="text-2xl font-bold text-gray-900">Withdraw</h2>
            </div>

            <div className="bg-orange-600 rounded-3xl p-6 text-white shadow-lg shadow-orange-100">
              <p className="text-orange-100 text-sm font-bold uppercase tracking-widest mb-1">Available Balance</p>
              <h3 className="text-4xl font-bold">₹{(profile?.walletBalance || 0).toFixed(2)}</h3>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Amount to Withdraw</label>
                <div className="relative mt-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-lg">₹</span>
                  <input 
                    type="number" 
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 pl-10 text-xl font-bold focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">UPI ID</label>
                <input 
                  type="text" 
                  value={profile?.upiId || upiId}
                  onChange={(e) => !profile?.upiId && setUpiId(e.target.value)}
                  disabled={!!profile?.upiId}
                  placeholder="example@upi"
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 mt-1 text-sm font-bold focus:ring-2 focus:ring-orange-500 disabled:opacity-70"
                />
                {profile?.upiId && (
                  <p className="text-[10px] text-gray-400 mt-1 ml-1">Using saved UPI ID. To change, contact support.</p>
                )}
              </div>

              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start space-x-3">
                <AlertCircle size={20} className="text-blue-600 mt-0.5" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  Withdrawals are processed within 24-48 hours. Funds will be sent to the UPI ID provided above.
                </p>
              </div>

              <button 
                onClick={requestWithdrawal}
                disabled={!withdrawalAmount || Number(withdrawalAmount) <= 0 || Number(withdrawalAmount) > (profile?.walletBalance || 0) || (!profile?.upiId && !upiId)}
                className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-100 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
              >
                Submit Request
              </button>
            </div>
          </div>
        );

      case 'seller-dashboard':
        return (
          <div className="p-4 pb-24 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tighter uppercase">Seller Dashboard</h2>
              <div className="flex items-center space-x-2">
                {notificationPermission !== 'granted' && (
                  <button 
                    onClick={requestNotificationPermission}
                    className="p-2 bg-blue-100 text-blue-600 rounded-xl flex items-center space-x-1 animate-bounce"
                    title="Enable Push Notifications"
                  >
                    <Bell size={16} />
                    <span className="text-[10px] font-bold">Push</span>
                  </button>
                )}
                {!isAudioEnabled && (
                  <button 
                    onClick={enableAudio}
                    className="p-2 bg-orange-100 text-orange-600 rounded-xl flex items-center space-x-1 animate-pulse"
                    title="Enable Order Sound"
                  >
                    <Volume2 size={16} />
                    <span className="text-[10px] font-bold">Sound</span>
                  </button>
                )}
                <button 
                  onClick={toggleOnline}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                    profile?.isOnline !== false 
                    ? 'bg-green-100 text-green-600 shadow-sm shadow-green-100' 
                    : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${profile?.isOnline !== false ? 'bg-green-600 animate-pulse' : 'bg-gray-400'}`} />
                  <span>{profile?.isOnline !== false ? 'Online' : 'Offline'}</span>
                </button>
              </div>
            </div>

            {orders.filter(o => o.sellerId === profile.uid && o.status === 'pending').length > 0 && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-red-600 rounded-3xl p-6 text-white shadow-xl shadow-red-100 border-4 border-white animate-pulse"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-2xl">
                    <AlertCircle size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tighter">New Order Received!</h3>
                    <p className="text-red-100 text-xs font-bold">Please accept the order to stop the alarm.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab('orders')}
                  className="w-full mt-4 bg-white text-red-600 py-3 rounded-2xl font-black uppercase tracking-widest text-xs"
                >
                  View Orders Now
                </button>
              </motion.div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-orange-600 rounded-3xl p-4 text-white shadow-lg shadow-orange-100">
                <p className="text-orange-100 text-[10px] uppercase font-bold tracking-wider mb-1">Total Earnings</p>
                <h3 className="text-2xl font-bold">₹{profile?.walletBalance || 0}</h3>
              </div>
              <div className="bg-gray-900 rounded-3xl p-4 text-white shadow-lg shadow-gray-100">
                <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">Active Orders</p>
                <h3 className="text-2xl font-bold">{orders.filter(o => o.status !== 'delivered' && o.status !== 'rejected').length}</h3>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-gray-900">Recent Orders</h3>
              {orders.length === 0 ? (
                <p className="text-gray-400 text-sm italic">No orders yet.</p>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <div 
                      key={order.id} 
                      onClick={() => setSelectedOrder(order)}
                      className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3 cursor-pointer active:scale-[0.98] transition-transform"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs text-gray-400 font-mono">#{order.id.slice(-6).toUpperCase()}</p>
                          <p className="text-sm font-bold text-gray-900">{order.items.length} Items • ₹{order.totalAmount}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      {order.status === 'pending' && (
                        <div className="flex space-x-2 pt-2">
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'accepted')}
                            className="flex-1 bg-orange-600 text-white py-2 rounded-xl text-xs font-bold"
                          >
                            Accept
                          </button>
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'rejected')}
                            className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-xs font-bold"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {order.status === 'accepted' && (
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                          className="w-full bg-blue-600 text-white py-2 rounded-xl text-xs font-bold"
                        >
                          Mark Ready for Delivery
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button 
                          onClick={() => {
                            setOrderToAssign(order.id);
                            setIsAssignModalOpen(true);
                          }}
                          className="w-full bg-purple-600 text-white py-2 rounded-xl text-xs font-bold"
                        >
                          Assign Delivery Boy
                        </button>
                      )}
                      {order.status === 'out_for_delivery' && (
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          className="w-full bg-green-600 text-white py-2 rounded-xl text-xs font-bold"
                        >
                          Mark Delivered
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assign Delivery Boy Modal */}
            <AnimatePresence>
              {isAssignModalOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsAssignModalOpen(false)}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                  />
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold">Assign Delivery Boy</h3>
                      <button onClick={() => setIsAssignModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} />
                      </button>
                    </div>

                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                      {deliveryBoys.filter(b => b.isOnline).length === 0 ? (
                        <div className="text-center py-8">
                          <Users className="mx-auto text-gray-300 mb-2" size={48} />
                          <p className="text-gray-500 text-sm">No delivery boys are currently online.</p>
                        </div>
                      ) : (
                        deliveryBoys.filter(b => b.isOnline).map(boy => (
                          <button
                            key={boy.uid}
                            onClick={async () => {
                              if (!orderToAssign) return;
                              try {
                                await updateDoc(doc(db, 'orders', orderToAssign), {
                                  deliveryBoyId: boy.uid,
                                  status: 'out_for_delivery'
                                });
                                showToast(`Order assigned to ${boy.name}`, 'success');
                                setIsAssignModalOpen(false);
                                setOrderToAssign(null);
                              } catch (error) {
                                showToast('Failed to assign delivery boy', 'error');
                              }
                            }}
                            className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-orange-50 hover:border-orange-200 border border-transparent transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center font-bold">
                                {boy.name[0]}
                              </div>
                              <div className="text-left">
                                <p className="font-bold text-gray-900">{boy.name}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{boy.mobile}</p>
                              </div>
                            </div>
                            <ChevronRight className="text-gray-400" size={20} />
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        );

      case 'seller-products': {
        const filteredSellerProducts = products
          .filter(p => p.sellerId === profile?.uid)
          .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.category.toLowerCase().includes(productSearch.toLowerCase()));

        return (
          <div className="p-4 pb-24 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">My Products</h2>
              <button 
                onClick={() => setIsAddProductModalOpen(true)}
                className="bg-orange-600 text-white p-2 rounded-xl shadow-lg shadow-orange-100"
              >
                <Plus size={24} />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text"
                placeholder="Search products or categories..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {filteredSellerProducts.length === 0 ? (
                <div className="col-span-2 bg-white rounded-3xl p-10 text-center border border-dashed border-gray-200">
                  <Package className="text-gray-300 mx-auto mb-4" size={48} />
                  <p className="text-gray-500 text-sm">No products found. Add your first product!</p>
                </div>
              ) : (
                filteredSellerProducts.map(product => (
                  <motion.div 
                    key={product.id}
                    layout
                    className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm"
                  >
                    <div className="relative h-32">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button 
                          onClick={() => openEditModal(product)}
                          className="bg-white/90 backdrop-blur-sm p-1.5 rounded-lg text-blue-600 shadow-sm"
                        >
                          <Settings size={14} />
                        </button>
                        <button 
                          onClick={() => setProductToDelete(product.id)}
                          className="bg-white/90 backdrop-blur-sm p-1.5 rounded-lg text-red-600 shadow-sm"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="font-bold text-gray-900 text-sm truncate">{product.name}</h4>
                      <p className="text-orange-600 font-bold text-sm">₹{product.price}</p>
                      <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">{product.category}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Add/Edit Product Modal */}
            <AnimatePresence>
              {isAddProductModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => { setIsAddProductModalOpen(false); resetNewProduct(); }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                  />
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl overflow-hidden"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                      <button onClick={() => { setIsAddProductModalOpen(false); resetNewProduct(); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} />
                      </button>
                    </div>
                    
                    <form onSubmit={handleAddProduct} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                      <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-4 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative overflow-hidden group">
                        {newProduct.image ? (
                          <img src={newProduct.image} alt="Preview" className="w-full h-32 object-cover rounded-xl" />
                        ) : (
                          <div className="flex flex-col items-center text-gray-400">
                            <Plus size={32} />
                            <span className="text-xs mt-1 font-medium">Upload Image</span>
                          </div>
                        )}
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        {newProduct.image && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-xs font-bold">Change Image</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                        <input 
                          type="text" 
                          required
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                          className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                          placeholder="e.g. Fresh Milk"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                          <input 
                            type="number" 
                            required
                            value={newProduct.price}
                            onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                            className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                          <select 
                            value={newProduct.category}
                            onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                            className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                          >
                            {CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Offer Expiry (Optional)</label>
                        <input 
                          type="datetime-local" 
                          value={newProduct.expiryTime}
                          onChange={(e) => setNewProduct({...newProduct, expiryTime: e.target.value})}
                          className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Leave empty if it's not a limited-time offer.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea 
                          value={newProduct.description}
                          onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                          className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none"
                          rows={3}
                          placeholder="Tell customers more about this product..."
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={isUploading}
                        className={`w-full bg-orange-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-100 active:scale-95 transition-transform mt-2 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isUploading ? 'Uploading...' : (editingProduct ? 'Update Product' : 'Add Product')}
                      </button>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
              {productToDelete && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setProductToDelete(null)}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                  />
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl text-center"
                  >
                    <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trash2 size={32} />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Delete Product?</h3>
                    <p className="text-sm text-gray-500 mb-6">This action cannot be undone. Are you sure?</p>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setProductToDelete(null)}
                        className="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => deleteProduct(productToDelete)}
                        className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 shadow-lg shadow-red-100 active:scale-95 transition-transform"
                      >
                        Delete
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        );
      }

      case 'delivery-boys':
        return (
          <div className="p-4 pb-24 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Delivery Boys</h2>
              <button 
                onClick={() => {
                  setEditingDeliveryBoy(null);
                  setNewDeliveryBoy({
                    name: '',
                    email: '',
                    mobile: '',
                    password: '',
                    paymentType: 'per_delivery',
                    salary: '',
                    deliveryCharge: ''
                  });
                  setIsAddDeliveryBoyModalOpen(true);
                }}
                className="bg-orange-600 text-white p-2 rounded-xl shadow-lg shadow-orange-100"
              >
                <Plus size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {deliveryBoys.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-gray-200">
                  <Users className="text-gray-300 mx-auto mb-4" size={48} />
                  <p className="text-gray-500 text-sm">No delivery boys added yet.</p>
                </div>
              ) : (
                deliveryBoys.map(boy => (
                  <div key={boy.uid} className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${boy.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}>
                        {boy.name[0]}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{boy.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${boy.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                          <span className="text-[10px] text-gray-500 uppercase font-bold">{boy.isOnline ? 'Online' : 'Offline'}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {boy.paymentType === 'fixed' ? `Salary: ₹${boy.salary}` : `Per Delivery: ₹${boy.deliveryCharge}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setEditingDeliveryBoy(boy);
                          setNewDeliveryBoy({
                            name: boy.name,
                            email: boy.email,
                            mobile: boy.mobile || '',
                            password: '',
                            paymentType: boy.paymentType || 'per_delivery',
                            salary: boy.salary?.toString() || '',
                            deliveryCharge: boy.deliveryCharge?.toString() || ''
                          });
                          setIsAddDeliveryBoyModalOpen(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                      >
                        <Settings size={18} />
                      </button>
                      <button 
                        onClick={() => deleteDeliveryBoy(boy.uid)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add/Edit Delivery Boy Modal */}
            <AnimatePresence>
              {isAddDeliveryBoyModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsAddDeliveryBoyModalOpen(false)}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                  />
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl overflow-hidden"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold">{editingDeliveryBoy ? 'Edit Delivery Boy' : 'Add Delivery Boy'}</h3>
                      <button onClick={() => setIsAddDeliveryBoyModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} />
                      </button>
                    </div>
                    
                    <form onSubmit={handleAddDeliveryBoy} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input 
                          type="text" 
                          required
                          value={newDeliveryBoy.name}
                          onChange={(e) => setNewDeliveryBoy({...newDeliveryBoy, name: e.target.value})}
                          className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                          placeholder="e.g. Rahul Kumar"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input 
                            type="email" 
                            required
                            value={newDeliveryBoy.email}
                            onChange={(e) => setNewDeliveryBoy({...newDeliveryBoy, email: e.target.value})}
                            className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                            placeholder="rahul@example.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                          <input 
                            type="tel" 
                            required
                            value={newDeliveryBoy.mobile}
                            onChange={(e) => setNewDeliveryBoy({...newDeliveryBoy, mobile: e.target.value})}
                            className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                            placeholder="10-digit number"
                          />
                        </div>
                      </div>
                      {!editingDeliveryBoy && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Initial Password</label>
                          <input 
                            type="password" 
                            required
                            value={newDeliveryBoy.password}
                            onChange={(e) => setNewDeliveryBoy({...newDeliveryBoy, password: e.target.value})}
                            className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                            placeholder="At least 6 characters"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Model</label>
                        <select 
                          value={newDeliveryBoy.paymentType}
                          onChange={(e) => setNewDeliveryBoy({...newDeliveryBoy, paymentType: e.target.value as any})}
                          className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        >
                          <option value="per_delivery">Per Delivery Charge</option>
                          <option value="fixed">Fixed Salary (Pagar)</option>
                        </select>
                      </div>
                      {newDeliveryBoy.paymentType === 'fixed' ? (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Salary (₹)</label>
                          <input 
                            type="number" 
                            required
                            value={newDeliveryBoy.salary}
                            onChange={(e) => setNewDeliveryBoy({...newDeliveryBoy, salary: e.target.value})}
                            className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                            placeholder="e.g. 15000"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Charge per Order (₹)</label>
                          <input 
                            type="number" 
                            required
                            value={newDeliveryBoy.deliveryCharge}
                            onChange={(e) => setNewDeliveryBoy({...newDeliveryBoy, deliveryCharge: e.target.value})}
                            className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                            placeholder="e.g. 30"
                          />
                        </div>
                      )}
                      <button 
                        type="submit"
                        disabled={isUploading}
                        className={`w-full bg-orange-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-100 active:scale-95 transition-transform mt-2 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isUploading ? 'Saving...' : (editingDeliveryBoy ? 'Update' : 'Add Delivery Boy')}
                      </button>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        );

      case 'delivery-dashboard':
        const readyOrders = orders.filter(o => o.sellerId === profile?.sellerId && o.status === 'ready');
        const activeTasks = orders.filter(o => o.deliveryBoyId === profile?.uid && (o.status === 'out_for_delivery'));

        return (
          <div className="p-4 pb-24 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Delivery Tasks</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2 h-2 rounded-full ${profile?.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{profile?.isOnline ? 'Online' : 'Offline'}</span>
                </div>
              </div>
              <button 
                onClick={() => toggleDeliveryBoyStatus(profile!.uid, profile!.isOnline || false)}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${profile?.isOnline ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}
              >
                Go {profile?.isOnline ? 'Offline' : 'Online'}
              </button>
            </div>

            {activeTasks.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Active Delivery</h3>
                {activeTasks.map(order => (
                  <div key={order.id} className="bg-orange-50 border-2 border-orange-200 rounded-3xl p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Order #{order.id.slice(-6)}</p>
                        <h4 className="font-bold text-gray-900 mt-1">{order.deliveryAddress}</h4>
                      </div>
                      <div className="bg-orange-600 text-white px-2 py-1 rounded-lg text-[10px] font-bold uppercase">
                        ₹{order.deliveryCharge || 0} Earn
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-orange-600 shadow-sm">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Customer Mobile</p>
                        <p className="font-bold text-gray-900">{order.customerMobile}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-100 active:scale-95 transition-transform"
                    >
                      Mark as Delivered
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Ready for Pickup</h3>
              {readyOrders.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-gray-200">
                  <Package className="text-gray-300 mx-auto mb-4" size={48} />
                  <p className="text-gray-500 text-sm">No orders ready for pickup.</p>
                </div>
              ) : (
                readyOrders.map(order => (
                  <div key={order.id} className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Order #{order.id.slice(-6)}</p>
                        <h4 className="font-bold text-gray-900 mt-1 truncate max-w-[200px]">{order.deliveryAddress}</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Charge</p>
                        <p className="font-bold text-orange-600">₹{order.deliveryCharge || 0}</p>
                      </div>
                    </div>
                    <button 
                      onClick={async () => {
                        try {
                          await updateDoc(doc(db, 'orders', order.id), {
                            deliveryBoyId: profile?.uid,
                            status: 'out_for_delivery'
                          });
                          showToast('Order picked up!', 'success');
                        } catch (error) {
                          showToast('Failed to pick up order', 'error');
                        }
                      }}
                      disabled={!profile?.isOnline}
                      className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${profile?.isOnline ? 'bg-orange-600 text-white shadow-lg shadow-orange-100 active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                    >
                      {profile?.isOnline ? 'Pick Up Order' : 'Go Online to Pick Up'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'admin-dashboard':
        return (
          <div className="p-4 pb-24 space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => {
                    setIsAdminRoute(false);
                    setActiveTab('home');
                    window.location.hash = '';
                  }}
                  className="p-2 bg-gray-100 rounded-2xl text-gray-600 active:scale-90 transition-transform"
                  title="Exit Admin Panel"
                >
                  <X size={20} />
                </button>
                <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Dashboard</h2>
              </div>
              <div className="flex items-center space-x-2 bg-red-50 text-red-600 px-3 py-1 rounded-full animate-pulse">
                <Activity size={14} />
                <span className="text-[10px] font-black uppercase">Live</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-3">
                  <ShoppingBag size={20} />
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Today's Orders</p>
                <h3 className="text-2xl font-black text-gray-900">{orders.filter(o => {
                  const today = new Date().toDateString();
                  return new Date(o.createdAt).toDateString() === today;
                }).length}</h3>
              </div>
              <div className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-3">
                  <TrendingUp size={20} />
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Revenue</p>
                <h3 className="text-2xl font-black text-gray-900">₹{orders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.totalAmount, 0)}</h3>
              </div>
              <div className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-3">
                  <Users size={20} />
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Users</p>
                <h3 className="text-2xl font-black text-gray-900">{sellers.length + 12}</h3>
              </div>
              <div className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mb-3">
                  <Bell size={20} />
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pending Apps</p>
                <h3 className="text-2xl font-black text-gray-900">{sellers.filter(s => s.status === 'pending').length}</h3>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest ml-1">Quick Actions</h3>
              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={() => {
                    setIsAdminRoute(false);
                    setActiveTab('home');
                    window.location.hash = '';
                  }}
                  className="bg-gray-900 text-white p-4 rounded-3xl flex flex-col items-center space-y-2 shadow-lg shadow-gray-100 active:scale-95 transition-transform"
                >
                  <LogOut size={20} />
                  <span className="text-[9px] font-bold uppercase">Exit Mode</span>
                </button>
                <button 
                  onClick={() => setActiveTab('admin-sellers')}
                  className="bg-orange-600 text-white p-4 rounded-3xl flex flex-col items-center space-y-2 shadow-lg shadow-orange-100 active:scale-95 transition-transform"
                >
                  <Plus size={20} />
                  <span className="text-[9px] font-bold uppercase">Add Seller</span>
                </button>
                <button 
                  onClick={() => setActiveTab('admin-orders')}
                  className="bg-gray-900 text-white p-4 rounded-3xl flex flex-col items-center space-y-2 shadow-lg shadow-gray-200 active:scale-95 transition-transform"
                >
                  <Package size={20} />
                  <span className="text-[9px] font-bold uppercase">Orders</span>
                </button>
                <button 
                  onClick={() => setActiveTab('admin-analytics')}
                  className="bg-white border border-gray-100 p-4 rounded-3xl flex flex-col items-center space-y-2 shadow-sm active:scale-95 transition-transform"
                >
                  <BarChart3 size={20} className="text-orange-600" />
                  <span className="text-[9px] font-bold uppercase text-gray-600">Reports</span>
                </button>
              </div>
            </div>

            {/* Recent Orders Preview */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Recent Orders</h3>
                <button onClick={() => setActiveTab('admin-orders')} className="text-orange-600 text-[10px] font-black uppercase">View All</button>
              </div>
              <div className="space-y-3">
                {orders.slice(0, 3).map(order => (
                  <div key={order.id} className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                        <Package size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-900 uppercase tracking-tighter">#{order.id.slice(-6).toUpperCase()}</p>
                        <p className="text-[10px] text-gray-400 font-bold">₹{order.totalAmount} • {order.status}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-300" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'admin-orders':
        return (
          <div className="p-4 pb-24 space-y-6">
            <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Order Management</h2>
            
            {/* Order Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-2xl">
              {(['new', 'preparing', 'delivery', 'delivered'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setAdminOrderTab(tab)}
                  className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                    adminOrderTab === tab ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {orders.filter(o => {
                if (adminOrderTab === 'new') return o.status === 'pending';
                if (adminOrderTab === 'preparing') return o.status === 'accepted';
                if (adminOrderTab === 'delivery') return o.status === 'out_for_delivery';
                return o.status === 'delivered';
              }).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 opacity-40">
                  <Package size={48} className="mb-2" />
                  <p className="text-sm font-bold uppercase tracking-widest">No {adminOrderTab} orders</p>
                </div>
              ) : (
                orders.filter(o => {
                  if (adminOrderTab === 'new') return o.status === 'pending';
                  if (adminOrderTab === 'preparing') return o.status === 'accepted';
                  if (adminOrderTab === 'delivery') return o.status === 'out_for_delivery';
                  return o.status === 'delivered';
                }).map(order => (
                  <div key={order.id} className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">#{order.id.toUpperCase()}</p>
                        <h4 className="font-black text-gray-900 mt-1">₹{order.totalAmount}</h4>
                        <p className="text-[8px] font-black text-orange-600 uppercase mt-1">
                          Seller: {sellers.find(s => s.uid === order.sellerId)?.name || 'Unknown Seller'}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                      }`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-3 py-3 border-y border-gray-50">
                      <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                        <User size={14} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-900">
                          <a href={`tel:${order.customerMobile}`} className="hover:text-orange-600 transition-colors">{order.customerMobile}</a>
                        </p>
                        <p className="text-[8px] text-gray-400 truncate max-w-[200px]">
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress)}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="hover:text-orange-600 transition-colors"
                          >
                            {order.deliveryAddress}
                          </a>
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {order.status === 'pending' && (
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'accepted')}
                          className="flex-1 bg-orange-600 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform"
                        >
                          Accept Order
                        </button>
                      )}
                      {order.status === 'accepted' && (
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                          className="flex-1 bg-blue-600 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform"
                        >
                          Ship Order
                        </button>
                      )}
                      {order.status === 'out_for_delivery' && (
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          className="flex-1 bg-green-600 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform"
                        >
                          Mark Delivered
                        </button>
                      )}
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="p-3 bg-gray-100 text-gray-600 rounded-2xl active:scale-95 transition-transform"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'admin-sellers':
        const filteredSellers = sellers.filter(s => 
          s.name.toLowerCase().includes(sellerSearch.toLowerCase()) || 
          s.shopName?.toLowerCase().includes(sellerSearch.toLowerCase())
        );

        return (
          <div className="p-4 pb-24 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Seller Management</h2>
              <button 
                onClick={() => setShowAddSellerModal(true)}
                className="bg-orange-600 text-white p-3 rounded-2xl shadow-lg shadow-orange-100 active:scale-95 transition-transform"
              >
                <Plus size={20} />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text"
                placeholder="Search sellers or shops..."
                value={sellerSearch}
                onChange={(e) => setSellerSearch(e.target.value)}
                className="w-full bg-white border border-gray-100 rounded-[24px] py-4 pl-12 pr-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>

            <AnimatePresence>
              {showAddSellerModal && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-white w-full max-w-md rounded-[40px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-black text-gray-900 tracking-tighter uppercase">Quick Add Seller</h3>
                      <button onClick={() => setShowAddSellerModal(false)} className="p-2 bg-gray-50 rounded-xl text-gray-400">
                        <X size={20} />
                      </button>
                    </div>

                    <form onSubmit={addSellerInstantly} className="space-y-4">
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name *</label>
                          <input 
                            required
                            type="text" 
                            value={newSellerData.name}
                            onChange={(e) => setNewSellerData({...newSellerData, name: e.target.value})}
                            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                            placeholder="Seller's Name"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address *</label>
                          <input 
                            required
                            type="email" 
                            value={newSellerData.email}
                            onChange={(e) => setNewSellerData({...newSellerData, email: e.target.value})}
                            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                            placeholder="seller@example.com"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mobile *</label>
                            <input 
                              required
                              type="tel" 
                              value={newSellerData.mobile}
                              onChange={(e) => setNewSellerData({...newSellerData, mobile: e.target.value})}
                              className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                              placeholder="10-digit mobile"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                            <select 
                              value={newSellerData.shopCategory}
                              onChange={(e) => setNewSellerData({...newSellerData, shopCategory: e.target.value})}
                              className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                            >
                              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Shop Name *</label>
                          <input 
                            required
                            type="text" 
                            value={newSellerData.shopName}
                            onChange={(e) => setNewSellerData({...newSellerData, shopName: e.target.value})}
                            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                            placeholder="Business Name"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Shop Address</label>
                          <textarea 
                            value={newSellerData.shopAddress}
                            onChange={(e) => setNewSellerData({...newSellerData, shopAddress: e.target.value})}
                            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 h-20 resize-none"
                            placeholder="Full location details"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Aadhaar</label>
                            <input 
                              type="text" 
                              value={newSellerData.aadhaarNumber}
                              onChange={(e) => setNewSellerData({...newSellerData, aadhaarNumber: e.target.value})}
                              className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                              placeholder="12-digit"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">PAN</label>
                            <input 
                              type="text" 
                              value={newSellerData.panNumber}
                              onChange={(e) => setNewSellerData({...newSellerData, panNumber: e.target.value})}
                              className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                              placeholder="10-digit"
                            />
                          </div>
                        </div>
                      </div>

                      <button 
                        type="submit"
                        className="w-full bg-orange-600 text-white py-4 rounded-3xl font-black text-sm uppercase tracking-widest shadow-lg shadow-orange-100 active:scale-95 transition-transform mt-4"
                      >
                        Create Seller Account
                      </button>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
            
            <div className="space-y-6">
              {/* Pending Applications */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Pending Applications ({filteredSellers.filter(s => s.status === 'pending').length})</h3>
                <div className="space-y-3">
                  {filteredSellers.filter(s => s.status === 'pending').map(s => (
                    <div key={s.uid} className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 font-black text-xl">
                            {s.name[0]}
                          </div>
                          <div>
                            <h4 className="font-black text-gray-900">{s.name}</h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{s.shopName}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-2xl">
                        <div>
                          <label className="text-[8px] font-bold text-gray-400 uppercase">Category</label>
                          <p className="text-[10px] font-black">{s.shopCategory}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-gray-400 uppercase">Contact</p>
                          <a href={`tel:${s.mobile}`} className="text-[10px] font-black hover:text-orange-600 transition-colors">{s.mobile}</a>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button 
                          onClick={async () => {
                            await updateDoc(doc(db, 'users', s.uid), { status: 'approved', role: 'seller', isOnline: true });
                            await sendNotification(s.uid, 'Approved!', 'Your seller account is ready.', 'system');
                          }}
                          className="flex-1 bg-green-600 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={async () => {
                            await updateDoc(doc(db, 'users', s.uid), { status: 'blocked' });
                            await sendNotification(s.uid, 'Rejected', 'Your application was rejected.', 'system');
                          }}
                          className="flex-1 bg-red-600 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Sellers */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Active Sellers</h3>
                <div className="space-y-3">
                  {filteredSellers.filter(s => s.status === 'approved' && s.role === 'seller').map(s => (
                    <div key={s.uid} className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 font-black text-xl">
                            {s.name[0]}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-black text-gray-900">{s.name}</h4>
                              <div className={`w-2 h-2 rounded-full ${s.isOnline !== false ? 'bg-green-600 animate-pulse' : 'bg-gray-300'}`} />
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{s.shopName}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => blockUser(s.uid, s.status)}
                          className={`${s.status === 'blocked' ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-600'} px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors`}
                        >
                          {s.status === 'blocked' ? 'Unblock' : 'Block'}
                        </button>
                      </div>

                      <div className="p-4 bg-orange-50 rounded-2xl space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[8px] font-bold text-gray-400 uppercase">Category</p>
                            <p className="text-[10px] font-black text-orange-600">{s.shopCategory}</p>
                          </div>
                          <div>
                          <p className="text-[8px] font-bold text-gray-400 uppercase">Mobile</p>
                          <a href={`tel:${s.mobile}`} className="text-[10px] font-black hover:text-orange-600 transition-colors">{s.mobile}</a>
                          </div>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-gray-400 uppercase">Address</p>
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.shopAddress)}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[10px] font-bold leading-tight hover:text-orange-600 transition-colors block"
                          >
                            {s.shopAddress}
                          </a>
                        </div>
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-orange-100">
                          <div>
                            <p className="text-[8px] font-bold text-gray-400 uppercase">Aadhaar</p>
                            <p className="text-[9px] font-black">{s.aadhaarNumber}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-gray-400 uppercase">PAN</p>
                            <p className="text-[9px] font-black">{s.panNumber}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-gray-400 uppercase">License</p>
                            <p className="text-[9px] font-black truncate">{s.licenseNumber || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-orange-100">
                          <div>
                            <p className="text-[8px] font-bold text-gray-400 uppercase">Wallet Balance</p>
                            <p className="text-xs font-black text-green-600">₹{s.walletBalance}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-gray-400 uppercase">Email</p>
                            <p className="text-[9px] font-black">{s.email}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'admin-customers':
        return (
          <div className="p-4 pb-24 space-y-6">
            <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Customer Management</h2>
            
            <div className="space-y-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Registered Customers ({sellers.filter(s => s.role === 'customer').length})</h3>
              <div className="space-y-3">
                {sellers.filter(s => s.role === 'customer').map(c => (
                  <div key={c.uid} className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-black text-xl">
                          {c.name[0]}
                        </div>
                        <div>
                          <h4 className="font-black text-gray-900">{c.name}</h4>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{c.email}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => blockUser(c.uid, c.status)}
                        className={`${c.status === 'blocked' ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-600'} px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors`}
                      >
                        {c.status === 'blocked' ? 'Unblock' : 'Block'}
                      </button>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-2xl space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[8px] font-bold text-gray-400 uppercase">Mobile</p>
                          <a href={`tel:${c.mobile}`} className="text-[10px] font-black hover:text-orange-600 transition-colors">{c.mobile || 'N/A'}</a>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-gray-400 uppercase">Wallet</p>
                          <p className="text-[10px] font-black text-green-600">₹{c.walletBalance}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-gray-400 uppercase">Delivery Address</p>
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address || '')}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[10px] font-bold leading-tight hover:text-orange-600 transition-colors block"
                        >
                          {c.address || 'No address added'}
                        </a>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-blue-100">
                        <div>
                          <p className="text-[8px] font-bold text-gray-400 uppercase">Orders Placed</p>
                          <p className="text-xs font-black text-gray-900">{orders.filter(o => o.customerId === c.uid).length}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-gray-400 uppercase">Status</p>
                          <p className={`text-[9px] font-black uppercase ${c.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>{c.status}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'admin-analytics':
        const revenueData = [
          { name: 'Mon', revenue: 4000 },
          { name: 'Tue', revenue: 3000 },
          { name: 'Wed', revenue: 2000 },
          { name: 'Thu', revenue: 2780 },
          { name: 'Fri', revenue: 1890 },
          { name: 'Sat', revenue: 2390 },
          { name: 'Sun', revenue: 3490 },
        ];

        const categoryData = [
          { name: 'Grocery', value: 400 },
          { name: 'Fruits', value: 300 },
          { name: 'Dairy', value: 300 },
          { name: 'Bakery', value: 200 },
        ];

        const COLORS = ['#E23744', '#FC8019', '#000000', '#666666'];

        return (
          <div className="p-4 pb-24 space-y-6">
            <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Business Insights</h2>

            {/* Revenue Chart */}
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Weekly Revenue</h3>
                <span className="text-green-600 text-[10px] font-black uppercase">+12.5%</span>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FC8019" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#FC8019" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#9ca3af'}} />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#FC8019" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Categories */}
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Top Categories</h3>
              <div className="space-y-4">
                {categoryData.map((cat, idx) => (
                  <div key={cat.name} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span>{cat.name}</span>
                      <span>{Math.round((cat.value / 1200) * 100)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(cat.value / 1200) * 100}%` }}
                        transition={{ duration: 1, delay: idx * 0.1 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900 p-5 rounded-[32px] text-white">
                <PieChart size={20} className="text-orange-500 mb-2" />
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Avg Order Value</p>
                <h4 className="text-xl font-black">₹452</h4>
              </div>
              <div className="bg-orange-600 p-5 rounded-[32px] text-white">
                <Activity size={20} className="text-white mb-2" />
                <p className="text-[8px] font-bold text-orange-100 uppercase tracking-widest">Conversion Rate</p>
                <h4 className="text-xl font-black">3.2%</h4>
              </div>
            </div>
          </div>
        );

      case 'admin-profile':
        return (
          <div className="p-4 pb-24 space-y-6">
            <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Admin Settings</h2>
            
            <div className="bg-white p-6 rounded-[40px] border border-gray-100 shadow-sm flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 bg-orange-600 rounded-[32px] flex items-center justify-center text-white shadow-xl shadow-orange-100 relative">
                <ShieldCheck size={48} />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 border-4 border-white rounded-full flex items-center justify-center text-white">
                  <CheckCircle2 size={14} />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">{profile?.name}</h3>
                <p className="text-xs text-gray-400 font-bold">{profile?.email}</p>
                <span className="inline-block mt-2 bg-gray-900 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                  Super Admin
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <button className="w-full bg-white p-5 rounded-3xl border border-gray-100 flex items-center justify-between active:scale-95 transition-transform group">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Bell size={20} />
                  </div>
                  <span className="text-sm font-black text-gray-700 uppercase tracking-widest">Notifications</span>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </button>
              <button className="w-full bg-white p-5 rounded-3xl border border-gray-100 flex items-center justify-between active:scale-95 transition-transform group">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <Wallet size={20} />
                  </div>
                  <span className="text-sm font-black text-gray-700 uppercase tracking-widest">Payout Settings</span>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </button>
              <button className="w-full bg-white p-5 rounded-3xl border border-gray-100 flex items-center justify-between active:scale-95 transition-transform group">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-600 group-hover:bg-gray-900 group-hover:text-white transition-colors">
                    <Settings size={20} />
                  </div>
                  <span className="text-sm font-black text-gray-700 uppercase tracking-widest">Security</span>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </button>
              <button 
                onClick={() => signOut(auth)}
                className="w-full bg-red-50 p-5 rounded-3xl border border-red-100 flex items-center justify-between active:scale-95 transition-transform group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-red-600">
                    <LogOut size={20} />
                  </div>
                  <span className="text-sm font-black text-red-600 uppercase tracking-widest">Logout</span>
                </div>
                <ChevronRight size={18} className="text-red-200" />
              </button>
            </div>

            <div className="text-center pt-4">
              <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.2em]">Alif Laila Admin v2.0.4</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 max-w-md mx-auto shadow-2xl relative">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md z-40 px-4 py-3 flex justify-between items-center border-b border-gray-100">
        <h1 className="text-xl font-black text-orange-600 tracking-tighter">ALIF LAILA</h1>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => {
              setShowNotifications(true);
              markNotificationsAsRead();
              requestNotificationPermission();
            }}
            className="p-2 text-gray-600 relative"
          >
            <Bell size={22} />
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('cart')}
            className="p-2 text-gray-600 relative"
          >
            <ShoppingBag size={22} />
            {cart.length > 0 && (
              <span className="absolute top-1 right-1 bg-orange-600 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Notification Center Overlay */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex justify-end"
            onClick={() => setShowNotifications(false)}
          >
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-[280px] bg-white h-full shadow-2xl flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-black text-lg">Notifications</h3>
                <button onClick={() => setShowNotifications(false)} className="p-2 text-gray-400 hover:text-gray-900">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400 opacity-40">
                    <Bell size={48} className="mb-2" />
                    <p className="text-sm font-bold">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`p-4 rounded-2xl border transition-colors ${n.read ? 'bg-white border-gray-100' : 'bg-orange-50 border-orange-100'}`}>
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-xl ${
                          n.type === 'order' ? 'bg-blue-100 text-blue-600' : 
                          n.type === 'payment' ? 'bg-green-100 text-green-600' : 
                          'bg-orange-100 text-orange-600'
                        }`}>
                          {n.type === 'order' ? <ShoppingBag size={16} /> : 
                           n.type === 'payment' ? <CheckCircle size={16} /> : 
                           <AlertCircle size={16} />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-sm text-gray-900">{n.title}</h4>
                          <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">{n.message}</p>
                          <p className="text-[8px] text-gray-400 mt-2 font-medium">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'cart' ? (
            <div className="p-4 pb-24 space-y-6">
              <div className="flex items-center space-x-3">
                <button onClick={() => setActiveTab('home')} className="p-2 bg-white rounded-xl border border-gray-100">
                  <ChevronRight className="rotate-180" size={20} />
                </button>
                <h2 className="text-2xl font-bold text-gray-900">My Cart</h2>
              </div>
              
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <ShoppingBag size={64} className="mb-4 opacity-20" />
                  <p>Your cart is empty</p>
                  <button 
                    onClick={() => setActiveTab('home')}
                    className="mt-4 text-orange-600 font-bold"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.productId} className="flex items-center space-x-4 bg-white p-4 rounded-2xl border border-gray-100">
                      <div className="w-16 h-16 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 font-bold">
                        {item.name[0]}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm">{item.name}</h4>
                        <p className="text-orange-600 font-bold text-sm">₹{item.price}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button onClick={() => updateQuantity(item.productId, -1)} className="text-gray-400">
                          <MinusCircle size={20} />
                        </button>
                        <span className="font-bold text-sm">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, 1)} className="text-orange-600">
                          <PlusCircle size={20} />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4 mt-8">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-bold text-gray-900">Delivery Address</h4>
                        <button 
                          onClick={() => {
                            setAddressFormData({
                              address: profile?.address || '',
                              mobile: profile?.mobile || ''
                            });
                            setShowMapModal(true);
                          }}
                          className="text-[10px] text-orange-600 font-bold"
                        >
                          {profile?.address ? 'Change' : 'Add'}
                        </button>
                      </div>
                      {profile?.address ? (
                        <div className="bg-gray-50 p-3 rounded-xl">
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profile.address || '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xs text-gray-600 leading-relaxed hover:text-orange-600 transition-colors block"
                          >
                            {profile.address}
                          </a>
                          <a href={`tel:${profile.mobile}`} className="text-xs text-gray-900 font-bold mt-1 hover:text-orange-600 transition-colors block">
                            {profile.mobile}
                          </a>
                        </div>
                      ) : (
                        <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                          <p className="text-xs text-orange-600 font-bold">Please add a delivery address</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 pt-4 border-t border-gray-50">
                      <h4 className="text-sm font-bold text-gray-900">Payment Method</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => setPaymentMethod('cod')}
                          className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                            paymentMethod === 'cod' ? 'border-orange-600 bg-orange-50 text-orange-600' : 'border-gray-100 text-gray-400'
                          }`}
                        >
                          Cash on Delivery
                        </button>
                        <button 
                          onClick={() => setPaymentMethod('online')}
                          className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                            paymentMethod === 'online' ? 'border-orange-600 bg-orange-50 text-orange-600' : 'border-gray-100 text-gray-400'
                          }`}
                        >
                          Online (Wallet)
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-50 space-y-2">
                      <div className="flex justify-between text-gray-500 text-sm">
                        <span>Subtotal</span>
                        <span>₹{cart.reduce((s, i) => s + (i.price * i.quantity), 0)}</span>
                      </div>
                      <div className="flex justify-between text-gray-500 text-sm">
                        <span>Delivery Fee</span>
                        <span className="text-orange-600 font-bold">
                          ₹{sellers.find(s => s.uid === products.find(p => p.id === cart[0].productId)?.sellerId)?.deliveryFee || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-500 text-sm">
                        <span>Platform Charges</span>
                        <span className="text-orange-600 font-bold">₹{PLATFORM_FEE}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold text-gray-900 pt-4 border-t border-gray-50">
                        <span>Total</span>
                        <span>
                          ₹{cart.reduce((s, i) => s + (i.price * i.quantity), 0) + 
                            (sellers.find(s => s.uid === products.find(p => p.id === cart[0].productId)?.sellerId)?.deliveryFee || 0) +
                            PLATFORM_FEE}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={placeOrder}
                      className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-100 active:scale-95 transition-transform"
                    >
                      {paymentMethod === 'online' ? 'Pay & Place Order' : 'Place Order (COD)'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : renderContent()}
        </motion.div>
      </AnimatePresence>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-black text-gray-900">Order Details</h3>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">#{selectedOrder.id.toUpperCase()}</p>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-white rounded-full transition-colors shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Status Banner */}
                <div className={`p-4 rounded-2xl flex items-center space-x-3 ${
                  selectedOrder.status === 'delivered' ? 'bg-green-50 text-green-700' :
                  selectedOrder.status === 'rejected' ? 'bg-red-50 text-red-700' :
                  'bg-orange-50 text-orange-700'
                }`}>
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    {selectedOrder.status === 'delivered' ? <CheckCircle2 size={20} /> :
                     selectedOrder.status === 'pending' ? <Clock size={20} /> :
                     <Package size={20} />}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Current Status</p>
                    <p className="font-black text-sm uppercase">{selectedOrder.status.replace(/_/g, ' ')}</p>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Items Ordered</h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[10px] font-bold text-orange-600 shadow-sm">
                            {item.quantity}x
                          </div>
                          <span className="text-sm font-bold text-gray-700">{item.name}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Info */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Delivery Information</h4>
                  <div className="bg-white border border-gray-100 p-4 rounded-2xl space-y-4">
                    <div className="flex items-start space-x-3">
                      <MapPin size={18} className="text-orange-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Address</p>
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedOrder.deliveryAddress)}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-sm text-gray-700 leading-relaxed hover:text-orange-600 transition-colors block"
                        >
                          {selectedOrder.deliveryAddress}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <User size={18} className="text-orange-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Contact</p>
                        <a href={`tel:${selectedOrder.customerMobile}`} className="text-sm text-gray-700 hover:text-orange-600 transition-colors block">
                          {selectedOrder.customerMobile}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Payment Summary</h4>
                  <div className="bg-gray-900 text-white p-6 rounded-[32px] space-y-3 shadow-xl">
                    <div className="flex justify-between text-xs opacity-60">
                      <span>Payment Method</span>
                      <span className="uppercase font-bold">{selectedOrder.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between text-xs opacity-60">
                      <span>Payment Status</span>
                      <span className="uppercase font-bold">{selectedOrder.paymentStatus}</span>
                    </div>
                    <div className="h-px bg-white/10 my-2" />
                    <div className="flex justify-between text-sm">
                      <span className="opacity-60">Delivery Fee</span>
                      <span className="font-bold">₹{selectedOrder.deliveryFee}</span>
                    </div>
                    <div className="flex justify-between text-xl font-black pt-2">
                      <span>Total Paid</span>
                      <span className="text-orange-500">₹{selectedOrder.totalAmount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Seller */}
              {profile?.role === 'seller' && selectedOrder.sellerId === profile.uid && (
                <div className="p-6 bg-gray-50 border-t border-gray-100">
                  {selectedOrder.status === 'pending' && (
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => { updateOrderStatus(selectedOrder.id, 'rejected'); setSelectedOrder(null); }}
                        className="flex-1 bg-white text-gray-500 py-4 rounded-2xl font-bold text-sm border border-gray-200"
                      >
                        Reject
                      </button>
                      <button 
                        onClick={() => { updateOrderStatus(selectedOrder.id, 'accepted'); setSelectedOrder(null); }}
                        className="flex-1 bg-orange-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-orange-100"
                      >
                        Accept Order
                      </button>
                    </div>
                  )}
                  {selectedOrder.status === 'accepted' && (
                    <button 
                      onClick={() => { updateOrderStatus(selectedOrder.id, 'out_for_delivery'); setSelectedOrder(null); }}
                      className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-blue-100"
                    >
                      Mark Out for Delivery
                    </button>
                  )}
                  {selectedOrder.status === 'out_for_delivery' && (
                    <button 
                      onClick={() => { updateOrderStatus(selectedOrder.id, 'delivered'); setSelectedOrder(null); }}
                      className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-green-100"
                    >
                      Mark as Delivered
                    </button>
                  )}
                </div>
              )}

              {profile?.role === 'customer' && selectedOrder.customerId === profile.uid && selectedOrder.status === 'out_for_delivery' && (
                <div className="p-6 bg-gray-50 border-t border-gray-100">
                  <button 
                    onClick={() => { updateOrderStatus(selectedOrder.id, 'delivered'); setSelectedOrder(null); }}
                    className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-green-100"
                  >
                    Confirm Delivery
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Map Picker Modal */}
      <AnimatePresence>
        {showMapModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[32px] p-6 shadow-2xl space-y-4"
            >
              <div className="sticky top-0 bg-white z-[140] pb-2 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900">Pick Location</h3>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setUseFreeMap(!useFreeMap)}
                      className="text-[10px] bg-orange-50 px-2 py-1 rounded-lg font-bold text-orange-600 hover:bg-orange-100 transition-colors border border-orange-100"
                    >
                      {useFreeMap ? 'Try Google Maps' : 'Try Free Map'}
                    </button>
                    <button onClick={() => setShowMapModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Search for your building</p>
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 bg-orange-500 rounded-full animate-ping"></div>
                      <span className="text-[9px] text-orange-500 font-bold">Live Search</span>
                    </div>
                  </div>
                  {!useFreeMap && isGoogleMapsLoaded && !mapAuthError && googleMapsApiKey ? (
                    <div className="relative">
                      <Autocomplete
                        onLoad={(autocomplete) => setAutocomplete(autocomplete)}
                        onPlaceChanged={() => {
                          if (autocomplete) {
                            const place = autocomplete.getPlace();
                            if (place.geometry?.location) {
                              const lat = place.geometry.location.lat();
                              const lng = place.geometry.location.lng();
                              updateLocation(lat, lng);
                            }
                          }
                        }}
                      >
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={18} />
                          <input 
                            type="text" 
                            placeholder="Search for building, area, or street..."
                            className="w-full bg-orange-50/50 border border-orange-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none placeholder:text-gray-400 shadow-inner"
                          />
                        </div>
                      </Autocomplete>
                    </div>
                  ) : (
                    <div className="relative space-y-2">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={18} />
                        <input 
                          type="text" 
                          placeholder="Search for building, area, or street..."
                          value={freeSearchQuery}
                          onChange={(e) => {
                            setFreeSearchQuery(e.target.value);
                            if (e.target.value.length >= 3) {
                              handleFreeSearch(e.target.value);
                            } else {
                              setFreeSearchResults([]);
                            }
                          }}
                          className="w-full bg-orange-50/50 border border-orange-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none placeholder:text-gray-400 shadow-inner"
                        />
                        {isSearchingFree && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent"></div>
                          </div>
                        )}
                      </div>
                      
                      {freeSearchResults.length > 0 && (
                        <div className="absolute z-[130] left-0 right-0 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto mt-1">
                          {freeSearchResults.map((result, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                updateLocation(parseFloat(result.lat), parseFloat(result.lon));
                                setFreeSearchQuery(result.display_name);
                                setFreeSearchResults([]);
                              }}
                              className="w-full text-left p-4 hover:bg-orange-50 border-b border-gray-50 last:border-0 transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                <MapPin size={16} className="text-orange-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-bold text-gray-900 line-clamp-1">
                                    {result.display_name.split(',')[0]}
                                  </p>
                                  <p className="text-[10px] text-gray-500 line-clamp-1">
                                    {result.display_name.split(',').slice(1).join(',').trim()}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {!useFreeMap && isGoogleMapsLoaded && !mapAuthError && googleMapsApiKey ? (
                <div className="w-full h-80 rounded-2xl overflow-hidden border border-gray-100">
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={mapCenter || location || { lat: 20.5937, lng: 78.9629 }}
                    zoom={15}
                    onClick={(e) => {
                      if (e.latLng) {
                        updateLocation(e.latLng.lat(), e.latLng.lng());
                      }
                    }}
                  >
                    {location && <MarkerF position={location} />}
                    {sellers.map(seller => seller.location && (
                      <MarkerF 
                        key={seller.uid} 
                        position={seller.location} 
                        icon={window.google ? {
                          url: 'https://cdn-icons-png.flaticon.com/512/606/606363.png',
                          scaledSize: new window.google.maps.Size(32, 32)
                        } : undefined}
                        title={seller.shopName || seller.name}
                        onClick={() => setSelectedSeller(seller)}
                      />
                    ))}
                    {selectedSeller && selectedSeller.location && (
                      <InfoWindow
                        position={selectedSeller.location}
                        onCloseClick={() => setSelectedSeller(null)}
                      >
                        <div className="p-1">
                          <p className="font-bold text-orange-600">{selectedSeller.shopName || selectedSeller.name}</p>
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedSeller.shopAddress || selectedSeller.address || '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[10px] text-gray-500 hover:text-orange-600 transition-colors block"
                          >
                            {selectedSeller.shopAddress || selectedSeller.address || 'Available Shop'}
                          </a>
                        </div>
                      </InfoWindow>
                    )}
                  </GoogleMap>
                </div>
              ) : (
                <div className="w-full h-80 rounded-2xl overflow-hidden border border-gray-100">
                  <LeafletMap 
                    center={mapCenter || location || { lat: 20.5937, lng: 78.9629 }} 
                    onLocationChange={(lat, lng) => updateLocation(lat, lng)}
                    mapType={mapType}
                    setMapType={setMapType}
                    setDetectedAddress={setDetectedAddress}
                    isGeocoding={isGeocoding}
                    sellers={sellers}
                  />
                </div>
              )}

              <div className="bg-orange-50 p-4 rounded-2xl space-y-3">
                <div className="flex items-start gap-2">
                  <Info size={14} className="text-orange-600 mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-orange-600 font-bold">
                    Move the map to align the target with your building.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Detected Address</p>
                  <div className="flex items-center gap-2 min-h-[40px]">
                    {isGeocoding && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin flex-shrink-0" 
                      />
                    )}
                    <motion.p 
                      key={detectedAddress}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`text-sm font-bold line-clamp-2 leading-relaxed ${isGeocoding || detectedAddress === 'Moving map...' ? 'text-orange-400 italic' : 'text-gray-900'}`}
                    >
                      {detectedAddress || 'Detecting address...'}
                    </motion.p>
                  </div>
                </div>

                <div className="pt-2 border-t border-orange-100">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">House / Flat / Floor No.</p>
                    <span className="text-[9px] text-orange-500 font-bold italic">Required for exact delivery</span>
                  </div>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="e.g. Flat 402, 4th Floor, Building A"
                      value={manualAddress}
                      onChange={(e) => setManualAddress(e.target.value)}
                      className="w-full bg-white border-2 border-orange-100 rounded-xl py-4 px-4 text-sm font-bold focus:border-orange-500 focus:ring-4 focus:ring-orange-50 outline-none placeholder:text-gray-300 transition-all"
                    />
                    {manualAddress.length === 0 && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <span className="text-[10px] text-orange-400 font-bold animate-pulse">Type here...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  const finalAddress = manualAddress ? `${manualAddress}, ${detectedAddress}` : detectedAddress;
                  setDetectedAddress(finalAddress);
                  setAddressFormData(prev => ({ ...prev, address: finalAddress }));
                  setShowMapModal(false);
                  // Automatically open address modal to complete details
                  setShowAddressModal(true);
                }}
                className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle size={20} />
                Confirm & Save Location
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Address Modal */}
      <AnimatePresence>
        {showAddressModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 mx-auto mb-4">
                  <MapPin size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Delivery Details</h3>
                <p className="text-gray-500 text-sm mt-1">Please provide your address and mobile number to continue.</p>
              </div>

              {!useFreeMap && isGoogleMapsLoaded && !mapAuthError && googleMapsApiKey ? (
                <div className="w-full h-48 rounded-2xl overflow-hidden border border-gray-100">
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={mapCenter || location || { lat: 20.5937, lng: 78.9629 }}
                    zoom={15}
                    onClick={(e) => {
                      if (e.latLng) {
                        updateLocation(e.latLng.lat(), e.latLng.lng());
                      }
                    }}
                    options={{
                      disableDefaultUI: true,
                      zoomControl: true,
                    }}
                  >
                    {location && <MarkerF position={location} />}
                    {sellers.map(seller => seller.location && (
                      <MarkerF 
                        key={seller.uid} 
                        position={seller.location} 
                        icon={window.google ? {
                          url: 'https://cdn-icons-png.flaticon.com/512/606/606363.png',
                          scaledSize: new window.google.maps.Size(24, 24)
                        } : undefined}
                        title={seller.shopName || seller.name}
                        onClick={() => setSelectedSeller(seller)}
                      />
                    ))}
                    {selectedSeller && selectedSeller.location && (
                      <InfoWindow
                        position={selectedSeller.location}
                        onCloseClick={() => setSelectedSeller(null)}
                      >
                        <div className="p-1">
                          <p className="font-bold text-orange-600 text-xs">{selectedSeller.shopName || selectedSeller.name}</p>
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedSeller.shopAddress || selectedSeller.address || '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[9px] text-gray-500 hover:text-orange-600 transition-colors block"
                          >
                            {selectedSeller.shopAddress || selectedSeller.address || 'Available Shop'}
                          </a>
                        </div>
                      </InfoWindow>
                    )}
                  </GoogleMap>
                </div>
              ) : (
                <div className="w-full h-48 rounded-2xl overflow-hidden border border-gray-100">
                  <LeafletMap 
                    center={location || { lat: 20.5937, lng: 78.9629 }} 
                    onLocationChange={(lat, lng) => updateLocation(lat, lng)}
                    mapType={mapType}
                    setMapType={setMapType}
                    setDetectedAddress={setDetectedAddress}
                    isGeocoding={isGeocoding}
                    sellers={sellers}
                  />
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Full Address</label>
                  <textarea 
                    value={addressFormData.address}
                    onChange={(e) => setAddressFormData({...addressFormData, address: e.target.value})}
                    placeholder="House No, Building Name, Road, Area, City..."
                    className="w-full bg-gray-50 border-none rounded-xl p-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 min-h-[100px]"
                  />
                  <button 
                    onClick={() => setAddressFormData({...addressFormData, address: detectedAddress})}
                    className="text-[10px] text-orange-600 font-bold mt-1 ml-1"
                  >
                    Use Current Location
                  </button>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Mobile Number</label>
                  <input 
                    type="tel" 
                    value={addressFormData.mobile}
                    onChange={(e) => setAddressFormData({...addressFormData, mobile: e.target.value})}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full bg-gray-50 border-none rounded-xl p-4 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button 
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-bold"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveAddress}
                  className="flex-1 bg-orange-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-100"
                >
                  Save & Continue
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Nav */}
      {activeTab !== 'cart' && (
        <BottomNav 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          role={profile?.role || 'customer'} 
          isAdminRoute={isAdminRoute} 
          setIsAdminRoute={setIsAdminRoute}
        />
      )}

      {/* Toast Notification Stack */}
      <div className="fixed bottom-24 left-4 right-4 z-[200] flex flex-col items-center space-y-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
              layout
              className="pointer-events-auto"
            >
              <div className={`px-6 py-4 rounded-[24px] shadow-2xl flex items-start space-x-4 backdrop-blur-xl border-2 min-w-[280px] max-w-md ${
                t.type === 'success' ? 'bg-green-600/90 text-white border-green-400/50' :
                t.type === 'error' ? 'bg-red-600/90 text-white border-red-400/50' :
                t.type === 'warning' ? 'bg-amber-500/90 text-white border-amber-300/50' :
                'bg-gray-900/90 text-white border-gray-700/50'
              }`}>
                <div className="p-2 bg-white/20 rounded-xl mt-0.5">
                  {t.type === 'success' ? <CheckCircle2 size={20} /> :
                   t.type === 'error' ? <AlertCircle size={20} /> :
                   t.type === 'warning' ? <AlertCircle size={20} /> :
                   <Info size={20} />}
                </div>
                <div className="flex-1">
                  {t.title && <h4 className="font-black text-sm uppercase tracking-wider mb-0.5">{t.title}</h4>}
                  <p className="text-sm font-medium opacity-90 leading-relaxed">{t.message}</p>
                </div>
                <button 
                  onClick={() => removeToast(t.id)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

