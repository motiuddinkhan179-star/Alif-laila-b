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
  ChevronLeft,
  HelpCircle,
  MessageCircle,
  Camera,
  Filter,
  Phone,
  Star,
  Trash2,
  AlertTriangle,
  PlusCircle,
  MinusCircle,
  AlertCircle,
  CheckCircle2,
  X,
  Bell,
  Eye,
  EyeOff,
  LayoutDashboard,
  BarChart3,
  Users,
  TrendingUp,
  PieChart,
  Activity,
  Info,
  Volume2,
  Navigation,
  Truck,
  Send,
  Tag
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
  updateProfile,
  getAuth,
  sendPasswordResetEmail
} from 'firebase/auth';
import { initializeApp } from 'firebase/app';
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
import { auth, db, firebaseConfig, secondaryAuth } from './firebase';

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
  avatar?: string;
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
  currentLocation?: { lat: number; lng: number; updatedAt: string };
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
  language?: 'en' | 'hi' | 'ur';
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
  stock?: number;
  isAvailable?: boolean;
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
  status: 'pending' | 'accepted' | 'ready' | 'out_for_delivery' | 'delivered' | 'rejected' | 'cancelled';
  createdAt: any;
  paymentStatus: 'pending' | 'paid';
  deliveryBoyId?: string;
  deliveryOtp?: string;
  couponCode?: string;
  discountAmount?: number;
  address?: any;
  cancellationReason?: string;
  isReviewed?: boolean;
}

interface Review {
  id: string;
  orderId: string;
  customerId: string;
  customerName?: string;
  sellerId: string;
  productId?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  receiverId: string;
  message: string;
  createdAt: string;
}

interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  expiryDate: string;
  isActive: boolean;
}

interface UserAddress {
  id: string;
  userId: string;
  label: 'Home' | 'Work' | 'Other';
  addressLine: string;
  city: string;
  pincode: string;
  location: { lat: number; lng: number };
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
  orderId?: string;
  imageUrl?: string;
  customerPhone?: string;
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

const TRANSLATIONS = {
  en: {
    home: 'Home',
    categories: 'Categories',
    orders: 'Orders',
    wallet: 'Wallet',
    account: 'Account',
    search: 'Search products...',
    all: 'All',
    delivery: 'Delivery',
    dashboard: 'Dashboard',
    products: 'Products',
    deliveryBoys: 'Delivery Boys',
    admin: 'Admin',
    exit: 'Exit',
    cart: 'Cart',
    checkout: 'Checkout',
    profile: 'Profile',
    settings: 'Settings',
    logout: 'Logout',
    login: 'Login',
    signup: 'Sign Up',
    welcome: 'Welcome to Alif Laila',
    shopNow: 'Shop Now',
    popular: 'Popular Products',
    nearby: 'Nearby Shops',
    stock: 'Stock',
    outOfStock: 'Out of Stock',
    rating: 'Rating',
    reviews: 'Reviews',
    chat: 'Chat',
    track: 'Track Order',
    cancel: 'Cancel Order',
    apply: 'Apply',
    coupon: 'Coupon Code',
    address: 'Address',
    addAddress: 'Add New Address',
    selectAddress: 'Select Delivery Address',
    language: 'Language',
    sellerAnalytics: 'Seller Analytics',
    totalSales: 'Total Sales',
    totalOrders: 'Total Orders',
    activeOrders: 'Active Orders',
    completedOrders: 'Completed Orders',
    earnings: 'Earnings',
    inventory: 'Inventory',
    lowStock: 'Low Stock Alert',
    otp: 'Enter OTP',
    verify: 'Verify',
    otpSent: 'OTP sent to customer',
    call: 'Call',
    accept: 'Accept',
    reject: 'Reject',
    ready: 'Ready',
    pickup: 'Pickup',
    delivered: 'Delivered',
    status: 'Status',
    pending: 'Pending',
    accepted: 'Accepted',
    outForDelivery: 'Out for Delivery',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    reason: 'Reason',
    submit: 'Submit',
    writeReview: 'Write a Review',
    stars: 'Stars',
    comment: 'Comment',
    noReviews: 'No reviews yet',
    noOrders: 'No orders found',
    noProducts: 'No products found',
    noNotifications: 'No notifications',
    walletBalance: 'Wallet Balance',
    withdraw: 'Withdraw',
    deposit: 'Deposit',
    history: 'Transaction History',
    amount: 'Amount',
    upiId: 'UPI ID',
    invalidCoupon: 'Invalid or expired coupon',
    couponApplied: 'Coupon applied successfully',
    orderPlaced: 'Order placed successfully',
    orderCancelled: 'Order cancelled',
    locationRequired: 'Location permission is required',
    detecting: 'Detecting location...',
    locateMe: 'Locate Me',
    save: 'Save',
    online: 'Online',
    offline: 'Offline',
    goOnline: 'Go Online',
    goOffline: 'Go Offline',
    activeDelivery: 'Active Delivery',
    pickupReady: 'Ready for Pickup',
    noPickupOrders: 'No orders ready for pickup',
    pickUpOrder: 'Pick Up Order',
    goOnlineToPickUp: 'Go Online to Pick Up',
    todaysOrders: "Today's Orders",
    revenue: 'Revenue',
    activeUsers: 'Active Users',
    pendingApps: 'Pending Apps',
    quickActions: 'Quick Actions',
    exitMode: 'Exit Mode',
    addSeller: 'Add Seller',
    reports: 'Reports',
    recentOrders: 'Recent Orders',
    viewAll: 'View All',
    orderManagement: 'Order Management',
    earningsOverview: 'Earnings Overview',
    toPayRestaurants: 'To Pay Restaurants',
    pendingWithdrawals: 'Pending Withdrawals',
    noPendingRequests: 'No pending requests',
    requestFrom: 'Request from',
    approveAndPay: 'Approve & Pay',
    sellerPayouts: 'Seller Payouts',
    pendingPayout: 'Pending Payout',
    acceptOrder: 'Accept Order',
    shipOrder: 'Ship Order',
    markDelivered: 'Mark Delivered',
    sellerManagement: 'Seller Management',
    quickAddSeller: 'Quick Add Seller',
    fullName: 'Full Name',
    emailAddress: 'Email Address',
    shopAddress: 'Shop Address',
    category: 'Category',
    addProduct: 'Add Product',
    editProduct: 'Edit Product',
    deleteProduct: 'Delete Product',
    confirmDelete: 'Are you sure you want to delete this?',
    yesDelete: 'Yes, Delete',
    noCancel: 'No, Cancel',
    productName: 'Product Name',
    price: 'Price',
    description: 'Description',
    image: 'Image',
    uploading: 'Uploading...',
    saveChanges: 'Save Changes',
    deliveryBoyManagement: 'Delivery Boy Management',
    addDeliveryBoy: 'Add Delivery Boy',
    editDeliveryBoy: 'Edit Delivery Boy',
    paymentModel: 'Payment Model',
    perOrder: 'Per Order',
    fixedSalary: 'Fixed Salary',
    salaryAmount: 'Salary Amount',
    commissionPerOrder: 'Commission per Order',
    onlineStatus: 'Online Status',
    notifications: 'Notifications',
    audioEnabled: 'Audio Enabled',
    permissionGranted: 'Permission Granted',
    requestPermission: 'Request Permission',
    languageSettings: 'Language Settings',
    trackOrder: 'Track Order',
    orderSummary: 'Order Summary',
    items: 'Items',
    deliveryCharge: 'Delivery Charge',
    total: 'Total',
    customerInfo: 'Customer Info',
    sellerInfo: 'Seller Info',
    deliveryInfo: 'Delivery Info',
    chatWithSeller: 'Chat with Seller',
    chatWithCustomer: 'Chat with Customer',
    chatWithDeliveryBoy: 'Chat with Delivery Boy',
    deleteConfirmMessage: 'This action cannot be undone. Are you sure?',
    removeDeliveryBoy: 'Remove Delivery Boy',
    removeSeller: 'Remove Seller',
    productDeleted: 'Product deleted successfully!',
    inventoryUpdated: 'Inventory Updated',
    deliveryBoyRemoved: 'Delivery boy removed',
    sellerRemoved: 'Seller removed',
    success: 'Success',
    error: 'Error',
    info: 'Info',
    location: 'Location',
    nearbyProducts: 'Nearby Products',
    seeAll: 'See All',
    myCart: 'My Cart',
    cartEmpty: 'Your cart is empty',
    startShopping: 'Start Shopping',
    orderDetails: 'Order Details',
    subtotal: 'Subtotal',
    totalAmount: 'Total Amount',
    myOrders: 'My Orders',
    change: 'Change',
    add: 'Add',
    coupons: 'Coupons',
    seller: 'Seller',
    addToCart: 'Add to Cart',
    deliveryAddress: 'Delivery Address',
    deliveryFee: 'Delivery Fee',
  },
  hi: {
    home: 'होम',
    categories: 'श्रेणियां',
    orders: 'ऑर्डर',
    wallet: 'वॉलेट',
    account: 'खाता',
    search: 'उत्पाद खोजें...',
    all: 'सभी',
    delivery: 'डिलीवरी',
    dashboard: 'डैशबोर्ड',
    products: 'उत्पाद',
    deliveryBoys: 'डिलीवरी बॉय',
    admin: 'एडमिन',
    exit: 'बाहर निकलें',
    cart: 'कार्ट',
    checkout: 'चेकआउट',
    profile: 'प्रोफ़ाइल',
    settings: 'सेटिंग्स',
    logout: 'लॉगआउट',
    login: 'लॉगिन',
    signup: 'साइन अप',
    welcome: 'अलिफ लैला में आपका स्वागत है',
    shopNow: 'अभी खरीदारी करें',
    popular: 'लोकप्रिय उत्पाद',
    nearby: 'पास की दुकानें',
    stock: 'स्टॉक',
    outOfStock: 'स्टॉक में नहीं',
    rating: 'रेटिंग',
    reviews: 'समीक्षाएं',
    chat: 'चैट',
    track: 'ऑर्डर ट्रैक करें',
    cancel: 'ऑर्डर रद्द करें',
    apply: 'लागू करें',
    coupon: 'कूपन कोड',
    address: 'पता',
    addAddress: 'नया पता जोड़ें',
    selectAddress: 'डिलीवरी पता चुनें',
    language: 'भाषा',
    sellerAnalytics: 'विक्रेता विश्लेषण',
    totalSales: 'कुल बिक्री',
    totalOrders: 'कुल ऑर्डर',
    activeOrders: 'सक्रिय ऑर्डर',
    completedOrders: 'पूरे हुए ऑर्डर',
    earnings: 'कमाई',
    inventory: 'इन्वेंट्री',
    lowStock: 'कम स्टॉक अलर्ट',
    otp: 'ओटीपी दर्ज करें',
    verify: 'सत्यापित करें',
    otpSent: 'ग्राहक को ओटीपी भेजा गया',
    call: 'कॉल करें',
    accept: 'स्वीकार करें',
    reject: 'अस्वीकार करें',
    ready: 'तैयार',
    pickup: 'पिकअप',
    delivered: 'डिलीवर किया गया',
    status: 'स्थिति',
    pending: 'लंबित',
    accepted: 'स्वीकार किया गया',
    outForDelivery: 'डिलीवरी के लिए निकला',
    rejected: 'अस्वीकार कर दिया गया',
    cancelled: 'रद्द कर दिया गया',
    reason: 'कारण',
    submit: 'जमा करें',
    writeReview: 'समीक्षा लिखें',
    stars: 'सितारे',
    comment: 'टिप्पणी',
    noReviews: 'अभी तक कोई समीक्षा नहीं',
    noOrders: 'कोई ऑर्डर नहीं मिला',
    noProducts: 'कोई उत्पाद नहीं मिला',
    noNotifications: 'कोई सूचना नहीं',
    walletBalance: 'वॉलेट बैलेंस',
    withdraw: 'निकालें',
    deposit: 'जमा करें',
    history: 'लेनदेन का इतिहास',
    amount: 'राशि',
    upiId: 'यूपीआई आईडी',
    invalidCoupon: 'अमान्य या समाप्त कूपन',
    couponApplied: 'कूपन सफलतापूर्वक लागू किया गया',
    orderPlaced: 'ऑर्डर सफलतापूर्वक दिया गया',
    orderCancelled: 'ऑर्डर रद्द कर दिया गया',
    locationRequired: 'स्थान की अनुमति आवश्यक है',
    detecting: 'स्थान का पता लगाया जा रहा है...',
    locateMe: 'मेरी स्थिति जानें',
    save: 'सहेजें',
    online: 'ऑनलाइन',
    offline: 'ऑफलाइन',
    goOnline: 'ऑनलाइन जाएं',
    goOffline: 'ऑफलाइन जाएं',
    activeDelivery: 'सक्रिय डिलीवरी',
    pickupReady: 'पिकअप के लिए तैयार',
    noPickupOrders: 'पिकअप के लिए कोई ऑर्डर तैयार नहीं है',
    pickUpOrder: 'ऑर्डर पिकअप करें',
    goOnlineToPickUp: 'पिकअप करने के लिए ऑनलाइन जाएं',
    todaysOrders: 'आज के ऑर्डर',
    revenue: 'राजस्व',
    activeUsers: 'सक्रिय उपयोगकर्ता',
    pendingApps: 'लंबित आवेदन',
    quickActions: 'त्वरित कार्रवाई',
    exitMode: 'मोड से बाहर निकलें',
    addSeller: 'विक्रेता जोड़ें',
    reports: 'रिपोर्ट',
    recentOrders: 'हाल के ऑर्डर',
    viewAll: 'सभी देखें',
    orderManagement: 'ऑर्डर प्रबंधन',
    earningsOverview: 'कमाई का अवलोकन',
    toPayRestaurants: 'रेस्तरां को भुगतान करें',
    pendingWithdrawals: 'लंबित निकासी',
    noPendingRequests: 'कोई लंबित अनुरोध नहीं',
    requestFrom: 'से अनुरोध',
    approveAndPay: 'अनुमोदित करें और भुगतान करें',
    sellerPayouts: 'विक्रेता भुगतान',
    pendingPayout: 'लंबित भुगतान',
    acceptOrder: 'ऑर्डर स्वीकार करें',
    shipOrder: 'ऑर्डर शिप करें',
    markDelivered: 'डिलीवर चिह्नित करें',
    sellerManagement: 'विक्रेता प्रबंधन',
    quickAddSeller: 'त्वरित विक्रेता जोड़ें',
    fullName: 'पूरा नाम',
    emailAddress: 'ईमेल पता',
    shopAddress: 'दुकान का पता',
    category: 'श्रेणी',
    addProduct: 'उत्पाद जोड़ें',
    editProduct: 'उत्पाद संपादित करें',
    deleteProduct: 'उत्पाद हटाएं',
    confirmDelete: 'क्या आप वाकई इसे हटाना चाहते हैं?',
    yesDelete: 'हाँ, हटाएं',
    noCancel: 'नहीं, रद्द करें',
    productName: 'उत्पाद का नाम',
    price: 'कीमत',
    description: 'विवरण',
    image: 'छवि',
    uploading: 'अपलोड हो रहा है...',
    saveChanges: 'परिवर्तन सहेजें',
    deliveryBoyManagement: 'डिलीवरी बॉय प्रबंधन',
    addDeliveryBoy: 'डिलीवरी बॉय जोड़ें',
    editDeliveryBoy: 'डिलीवरी बॉय संपादित करें',
    paymentModel: 'भुगतान मॉडल',
    perOrder: 'प्रति ऑर्डर',
    fixedSalary: 'निश्चित वेतन',
    salaryAmount: 'वेतन राशि',
    commissionPerOrder: 'प्रति ऑर्डर कमीशन',
    onlineStatus: 'ऑनलाइन स्थिति',
    notifications: 'सूचनाएं',
    audioEnabled: 'ऑडियो सक्षम',
    permissionGranted: 'अनुमति दी गई',
    requestPermission: 'अनुमति का अनुरोध करें',
    languageSettings: 'भाषा सेटिंग्स',
    trackOrder: 'ऑर्डर ट्रैक करें',
    orderSummary: 'ऑर्डर सारांश',
    items: 'वस्तुएं',
    deliveryCharge: 'डिलीवरी शुल्क',
    total: 'कुल',
    customerInfo: 'ग्राहक जानकारी',
    sellerInfo: 'विक्रेता जानकारी',
    deliveryInfo: 'डिलीवरी जानकारी',
    chatWithSeller: 'विक्रेता के साथ चैट करें',
    chatWithCustomer: 'ग्राहक के साथ चैट करें',
    chatWithDeliveryBoy: 'डिलीवरी बॉय के साथ चैट करें',
    deleteConfirmMessage: 'यह क्रिया पूर्ववत नहीं की जा सकती। क्या आप सुनिश्चित हैं?',
    removeDeliveryBoy: 'डिलीवरी बॉय को हटाएं',
    removeSeller: 'विक्रेता को हटाएं',
    productDeleted: 'उत्पाद सफलतापूर्वक हटा दिया गया!',
    inventoryUpdated: 'इन्वेंटरी अपडेट की गई',
    deliveryBoyRemoved: 'डिलीवरी बॉय को हटा दिया गया',
    sellerRemoved: 'विक्रेता को हटा दिया गया',
    success: 'सफलता',
    error: 'त्रुटि',
    info: 'जानकारी',
    location: 'स्थान',
    nearbyProducts: 'आस-पास के उत्पाद',
    seeAll: 'सभी देखें',
    myCart: 'मेरी कार्ट',
    cartEmpty: 'आपकी कार्ट खाली है',
    startShopping: 'खरीदारी शुरू करें',
    orderDetails: 'ऑर्डर विवरण',
    subtotal: 'उप-योग',
    totalAmount: 'कुल राशि',
    myOrders: 'मेरे ऑर्डर',
    change: 'बदलें',
    add: 'जोड़ें',
    coupons: 'कूपन',
    seller: 'विक्रेता',
    addToCart: 'कार्ट में जोड़ें',
    deliveryAddress: 'डिलीवरी का पता',
    deliveryFee: 'डिलीवरी शुल्क',
    mobile: 'मोबाइल',
    aadhaar: 'आधार',
    pan: 'पैन',
    license: 'लाइसेंस',
    activeSellers: 'सक्रिय विक्रेता',
    unblock: 'अनब्लॉक',
    block: 'ब्लॉक',
    email: 'ईमेल',
    customerManagement: 'ग्राहक प्रबंधन',
    registeredCustomers: 'पंजीकृत ग्राहक',
    ordersPlaced: 'दिए गए ऑर्डर',
    businessInsights: 'व्यावसायिक अंतर्दृष्टि',
    weeklyRevenue: 'साप्ताहिक राजस्व',
    topCategories: 'शीर्ष श्रेणियां',
    mobileNumber: 'मोबाइल नंबर',
    enterMobile: 'मोबाइल नंबर दर्ज करें',
    enterAddress: 'अपना पूरा डिलीवरी पता दर्ज करें',
    enabled: 'सक्षम',
    blocked: 'अवरुद्ध',
    disabled: 'अक्षम',
    retry: 'पुनः प्रयास करें',
    enable: 'सक्षम करें',
    permissionDenied: 'अनुमति अस्वीकार कर दी गई थी। कृपया अपने ब्राउज़र सेटिंग्स में अनुमति रीसेट करें या ऐप को नए टैब में खोलने का प्रयास करें।',
    shopName: 'दुकान का नाम',
    deliveryRadius: 'डिलीवरी त्रिज्या (किमी)',
    eg5: 'जैसे: 5',
    radiusInfo: 'आप अपनी दुकान से कितनी दूर तक डिलीवरी कर सकते हैं।',
    deliveryFeeLabel: 'डिलीवरी शुल्क (₹)',
    eg20: 'जैसे: 20',
    flatFeeInfo: 'डिलीवरी के लिए फ्लैट शुल्क।',
    preferences: 'वरीयताएं',
    pushNotifications: 'पुश सूचनाएं',
    darkMode: 'डार्क मोड',
    noTransactions: 'अभी तक कोई लेनदेन नहीं',
    approve: 'अनुमोदित करें',
    addMoney: 'पैसे जोड़ें',
    currentBalance: 'वर्तमान शेष',
    amountToAdd: 'जोड़ने के लिए राशि',
    zeroAmount: '0.00',
    paymentSecurityInfo: 'आपका भुगतान 256-बिट एन्क्रिप्शन के साथ सुरक्षित है। पैसा तुरंत आपके वॉलेट में जोड़ दिया जाएगा।',
    availableBalance: 'उपलब्ध शेष',
    amountToWithdraw: 'निकालने के लिए राशि',
    upiIdPlaceholder: 'example@upi',
    savedUpiInfo: 'सहेजे गए यूपीआई आईडी का उपयोग किया जा रहा है। बदलने के लिए, सहायता से संपर्क करें।',
    withdrawalInfo: 'निकासी 24-48 घंटों के भीतर संसाधित की जाती है। धनराशि ऊपर दिए गए यूपीआई आईडी पर भेजी जाएगी।',
    submitRequest: 'अनुरोध सबमिट करें',
    sellerDashboard: 'विक्रेता डैशबोर्ड',
    push: 'पुश',
    sound: 'ध्वनि',
    newOrderReceived: 'नया ऑर्डर प्राप्त हुआ!',
    acceptToStopAlarm: 'अलार्म बंद करने के लिए कृपया ऑर्डर स्वीकार करें।',
    viewOrdersNow: 'अभी ऑर्डर देखें',
    totalEarnings: 'कुल कमाई',
    tapToWithdraw: 'निकालने के लिए टैप करें',
    markReady: 'डिलीवरी के लिए तैयार चिह्नित करें',
    assignDeliveryBoy: 'डिलीवरी बॉय असाइन करें',
    noDeliveryBoysOnline: 'अभी कोई डिलीवरी बॉय ऑनलाइन नहीं है।',
    orderAssignedTo: 'ऑर्डर असाइन किया गया',
    failedToAssign: 'डिलीवरी बॉय असाइन करने में विफल',
    myProducts: 'मेरे उत्पाद',
    searchPlaceholder: 'उत्पाद या श्रेणियां खोजें...',
    noProductsFound: 'कोई उत्पाद नहीं मिला। अपना पहला उत्पाद जोड़ें!',
    addNewProduct: 'नया उत्पाद जोड़ें',
    uploadImage: 'छवि अपलोड करें',
    changeImage: 'छवि बदलें',
    egFreshMilk: 'जैसे: ताजा दूध',
    priceLabel: 'कीमत (₹)',
    offerExpiry: 'ऑफर समाप्ति (वैकल्पिक)',
    expiryInfo: 'यदि यह सीमित समय का ऑफर नहीं है तो खाली छोड़ दें।',
    descriptionPlaceholder: 'ग्राहकों को इस उत्पाद के बारे में और बताएं...',
    noDeliveryBoysAdded: 'अभी तक कोई डिलीवरी बॉय नहीं जोड़ा गया है।',
  },
  ur: {
    home: 'ہوم',
    categories: 'اقسام',
    orders: 'آرڈرز',
    wallet: 'والٹ',
    account: 'اکاؤنٹ',
    search: 'مصنوعات تلاش کریں...',
    all: 'تمام',
    delivery: 'ڈیلیوری',
    dashboard: 'ڈیش بورڈ',
    products: 'مصنوعات',
    deliveryBoys: 'ڈیلیوری بوائے',
    admin: 'ایڈمن',
    exit: 'باہر نکلیں',
    cart: 'کارٹ',
    checkout: 'چیک آؤٹ',
    profile: 'پروفائل',
    settings: 'سیٹنگز',
    logout: 'لاگ آؤٹ',
    login: 'لاگ ان',
    signup: 'سائن اپ',
    welcome: 'الف لیلیٰ میں خوش آمدید',
    shopNow: 'ابھی خریداری کریں',
    popular: 'مقبول مصنوعات',
    nearby: 'قریبی دکانیں',
    stock: 'اسٹاک',
    outOfStock: 'اسٹاک میں نہیں',
    rating: 'ریٹنگ',
    reviews: 'تبصرے',
    chat: 'چیٹ',
    track: 'آرڈر ٹریک کریں',
    cancel: 'آرڈر منسوخ کریں',
    apply: 'لاگو کریں',
    coupon: 'کوپن کوڈ',
    addAddress: 'نیا پتہ شامل کریں',
    selectAddress: 'ڈیلیوری کا پتہ منتخب کریں',
    language: 'زبان',
    sellerAnalytics: 'سیلر اینالیٹکس',
    totalSales: 'کل فروخت',
    totalOrders: 'کل آرڈرز',
    activeOrders: 'فعال آرڈرز',
    completedOrders: 'مکمل آرڈرز',
    earnings: 'کمائی',
    inventory: 'انوینٹری',
    lowStock: 'کم اسٹاک الرٹ',
    otp: 'او ٹی پی درج کریں',
    verify: 'تصدیق کریں',
    otpSent: 'گاہک کو او ٹی پی بھیجا گیا',
    call: 'کال کریں',
    accept: 'قبول کریں',
    reject: 'مسترد کریں',
    ready: 'تیار',
    pickup: 'پک اپ',
    delivered: 'ڈیلیور ہو گیا',
    status: 'حیثیت',
    pending: 'زیر التواء',
    accepted: 'قبول شدہ',
    outForDelivery: 'ڈیلیوری کے لیے روانہ',
    rejected: 'مسترد شدہ',
    cancelled: 'منسوخ شدہ',
    reason: 'وجہ',
    submit: 'جمع کرائیں',
    writeReview: 'تبصرہ لکھیں',
    stars: 'ستارے',
    comment: 'تبصرہ',
    noReviews: 'ابھی تک کوئی تبصرہ نہیں',
    noOrders: 'کوئی آرڈر نہیں ملا',
    noProducts: 'کوئی مصنوعات نہیں ملی',
    noNotifications: 'کوئی اطلاع نہیں',
    walletBalance: 'والٹ بیلنس',
    withdraw: 'نکالیں',
    deposit: 'جمع کریں',
    history: 'لین دین کی تاریخ',
    amount: 'رقم',
    upiId: 'یو پی آئی آئی ڈی',
    invalidCoupon: 'غلط یا ختم شدہ کوپن',
    couponApplied: 'کوپن کامیابی سے لاگو ہو گیا',
    orderPlaced: 'آرڈر کامیابی سے دیا گیا',
    orderCancelled: 'آرڈر منسوخ کر دیا گیا',
    locationRequired: 'مقام کی اجازت درکار ہے',
    detecting: 'مقام کا پتہ لگایا جا رہا ہے...',
    locateMe: 'میرا مقام معلوم کریں',
    save: 'محفوظ کریں',
    online: 'آن لائن',
    offline: 'آف لائن',
    goOnline: 'آن لائن جائیں',
    goOffline: 'آف لائن جائیں',
    activeDelivery: 'فعال ڈیلیوری',
    pickupReady: 'پک اپ کے لیے تیار',
    noPickupOrders: 'پک اپ کے لیے کوئی آرڈر تیار نہیں ہے',
    pickUpOrder: 'آرڈر پک اپ کریں',
    goOnlineToPickUp: 'پک اپ کرنے کے لیے آن لائن جائیں',
    todaysOrders: 'آج کے آرڈرز',
    revenue: 'آمدنی',
    activeUsers: 'فعال صارفین',
    pendingApps: 'التوا میں درخواستیں',
    quickActions: 'فوری کارروائیاں',
    exitMode: 'موڈ سے باہر نکلیں',
    addSeller: 'سیلر شامل کریں',
    reports: 'رپورٹس',
    recentOrders: 'حالیہ آرڈرز',
    viewAll: 'تمام دیکھیں',
    earningsOverview: 'آمدنی کا جائزہ',
    pendingWithdrawals: 'التوا میں نکاسی',
    noPendingRequests: 'کوئی التوا میں درخواست نہیں',
    requestFrom: 'سے درخواست',
    approveAndPay: 'منظور کریں اور ادائیگی کریں',
    sellerPayouts: 'سیلر کی ادائیگیاں',
    pendingPayout: 'التوا میں ادائیگی',
    acceptOrder: 'آرڈر قبول کریں',
    shipOrder: 'آرڈر روانہ کریں',
    markDelivered: 'ڈیلیور نشان زد کریں',
    sellerManagement: 'سیلر مینجمنٹ',
    quickAddSeller: 'فوری سیلر شامل کریں',
    fullName: 'پورا نام',
    emailAddress: 'ای میل پتہ',
    shopAddress: 'دکان کا پتہ',
    category: 'زمرہ',
    addProduct: 'مصنوعات شامل کریں',
    editProduct: 'مصنوعات ترمیم کریں',
    deleteProduct: 'مصنوعات حذف کریں',
    confirmDelete: 'کیا آپ واقعی اسے حذف کرنا چاہتے ہیں؟',
    yesDelete: 'ہاں، حذف کریں',
    noCancel: 'نہیں، منسوخ کریں',
    productName: 'مصنوعات کا نام',
    price: 'قیمت',
    description: 'تفصیل',
    image: 'تصویر',
    uploading: 'اپ لوڈ ہو رہا ہے...',
    saveChanges: 'تبدیلیاں محفوظ کریں',
    deliveryBoyManagement: 'ڈیلیوری بوائے مینجمنٹ',
    addDeliveryBoy: 'ڈیلیوری بوائے شامل کریں',
    editDeliveryBoy: 'ڈیلیوری بوائے ترمیم کریں',
    perOrder: 'فی آرڈر',
    commissionPerOrder: 'فی آرڈر کمیشن',
    onlineStatus: 'آن لائن حالت',
    audioEnabled: 'آڈیو فعال',
    permissionGranted: 'اجازت مل گئی',
    requestPermission: 'اجازت کی درخواست کریں',
    languageSettings: 'زبان کی ترتیبات',
    trackOrder: 'آرڈر ٹریک کریں',
    orderSummary: 'آرڈر کا خلاصہ',
    items: 'اشیاء',
    deliveryCharge: 'ڈیلیوری چارج',
    total: 'کل',
    customerInfo: 'گاہک کی معلومات',
    sellerInfo: 'سیلر کی معلومات',
    deliveryInfo: 'ڈیلیوری کی معلومات',
    chatWithSeller: 'سیلر کے ساتھ چیٹ کریں',
    chatWithCustomer: 'گاہک کے ساتھ چیٹ کریں',
    chatWithDeliveryBoy: 'ڈیلیوری بوائے کے ساتھ چیٹ کریں',
    deleteConfirmMessage: 'اس عمل کو واپس نہیں لیا جا سکتا۔ کیا آپ کو یقین ہے؟',
    removeDeliveryBoy: 'ڈیلیوری بوائے کو ہٹائیں',
    removeSeller: 'سیلر کو ہٹائیں',
    productDeleted: 'مصنوعات کامیابی کے ساتھ حذف ہو گئی!',
    inventoryUpdated: 'انوینٹری اپ ڈیٹ ہو گئی',
    deliveryBoyRemoved: 'ڈیلیوری بوائے کو ہٹا دیا گیا',
    sellerRemoved: 'سیلر کو ہٹا دیا گیا',
    success: 'کامیابی',
    error: 'غلطی',
    info: 'معلومات',
    location: 'مقام',
    nearbyProducts: 'قریبی مصنوعات',
    seeAll: 'سب دیکھیں',
    myCart: 'میری کارٹ',
    cartEmpty: 'آپ کی کارٹ خالی ہے',
    startShopping: 'خریداری شروع کریں',
    orderDetails: 'آرڈر کی تفصیلات',
    subtotal: 'ذیلی کل',
    totalAmount: 'کل رقم',
    myOrders: 'میرے آرڈرز',
    change: 'تبدیل کریں',
    add: 'شامل کریں',
    coupons: 'کوپن',
    seller: 'سیلر',
    addToCart: 'کارٹ میں شامل کریں',
    deliveryAddress: 'ڈیلیوری کا پتہ',
    deliveryFee: 'ڈیلیوری فیس',
    mobile: 'موبائل',
    address: 'پتہ',
    aadhaar: 'آدھار',
    pan: 'پین',
    license: 'لائسنس',
    activeSellers: 'فعال فروخت کنندگان',
    unblock: 'ان بلاک',
    block: 'بلاک',
    email: 'ای میل',
    customerManagement: 'کسٹمر مینجمنٹ',
    registeredCustomers: 'رجسٹرڈ صارفین',
    ordersPlaced: 'دیے گئے آرڈرز',
    businessInsights: 'کاروباری بصیرت',
    withdrawalInfo: 'نکاسی 24-48 گھنٹوں کے اندر عمل میں لائی جاتی ہے۔ رقم اوپر فراہم کردہ یو پی آئی آئی ڈی پر بھیجی جائے گی۔',
    submitRequest: 'درخواست جمع کرائیں',
    sellerDashboard: 'سیلر ڈیش بورڈ',
    push: 'پش',
    sound: 'آواز',
    newOrderReceived: 'نیا آرڈر موصول ہوا!',
    acceptToStopAlarm: 'الارم روکنے کے لیے براہ کرم آرڈر قبول کریں۔',
    viewOrdersNow: 'ابھی آرڈرز دیکھیں',
    totalEarnings: 'کل کمائی',
    tapToWithdraw: 'نکالنے کے لیے ٹیپ کریں',
    markReady: 'ڈیلیوری کے لیے تیار نشان زد کریں',
    assignDeliveryBoy: 'ڈیلیوری بوائے تفویض کریں',
    noDeliveryBoysOnline: 'ابھی کوئی ڈیلیوری بوائے آن لائن نہیں ہے۔',
    orderAssignedTo: 'آرڈر تفویض کر دیا گیا',
    failedToAssign: 'ڈیلیوری بوائے تفویض کرنے میں ناکام',
    myProducts: 'میری مصنوعات',
    searchPlaceholder: 'مصنوعات یا زمرے تلاش کریں...',
    noProductsFound: 'کوئی مصنوعات نہیں ملی۔ اپنی پہلی مصنوعات شامل کریں!',
    addNewProduct: 'نئی مصنوعات شامل کریں',
    uploadImage: 'تصویر اپ لوڈ کریں',
    changeImage: 'تصویر تبدیل کریں',
    egFreshMilk: 'مثال کے طور پر: تازہ دودھ',
    priceLabel: 'قیمت (₹)',
    offerExpiry: 'آفر کی میعاد ختم (اختیاری)',
    expiryInfo: 'اگر یہ محدود وقت کی پیشکش نہیں ہے تو خالی چھوڑ دیں۔',
    descriptionPlaceholder: 'گاہکوں کو اس مصنوعات کے بارے میں مزید بتائیں...',
    noDeliveryBoysAdded: 'ابھی تک کوئی ڈیلیوری بوائے شامل نہیں کیا گیا ہے۔',
  }
};

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

  if (role === 'delivery_boy') {
    tabs = [
      { id: 'delivery-dashboard', icon: Truck, label: 'Delivery' },
      { id: 'wallet', icon: Wallet, label: 'Wallet' },
      { id: 'account', icon: User, label: 'Account' },
    ];
  }

  if (role === 'seller') {
    tabs = [
      { id: 'home', icon: Home, label: 'Home' },
      { id: 'seller-dashboard', icon: Store, label: 'Dashboard' },
      { id: 'seller-analysis', icon: BarChart3, label: 'Analysis' },
      { id: 'seller-products', icon: Plus, label: 'Products' },
      { id: 'delivery-boys', icon: Users, label: 'Delivery' },
      { id: 'orders', icon: Package, label: 'Orders' },
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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex overflow-x-auto whitespace-nowrap items-center py-2 pb-6 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] no-scrollbar">
      <div className="flex justify-around items-center w-full min-w-max px-2 gap-4 sm:gap-0">
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
            className={`flex flex-col items-center space-y-1 transition-all duration-300 relative min-w-[60px] ${
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

const TrackingChangeView = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 14);
  }, [center, map]);
  return null;
};

export default function App() {
  return (
    <ErrorBoundary>
      <AlifLailaApp />
    </ErrorBoundary>
  );
}

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText, 
  cancelText,
  type = 'danger',
  t
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string; 
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  t: (key: string) => string;
}) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl text-center"
        >
          <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-6 ${
            type === 'danger' ? 'bg-red-50 text-red-600' : 
            type === 'warning' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
          }`}>
            {type === 'danger' ? <Trash2 size={40} /> : type === 'warning' ? <AlertTriangle size={40} /> : <Info size={40} />}
          </div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase mb-2">{title}</h3>
          <p className="text-gray-500 text-sm font-medium leading-relaxed mb-8">{message}</p>
          <div className="flex flex-col space-y-3">
            <button 
              onClick={() => { onConfirm(); onClose(); }}
              className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg transition-all active:scale-95 ${
                type === 'danger' ? 'bg-red-600 text-white shadow-red-100' : 
                type === 'warning' ? 'bg-orange-600 text-white shadow-orange-100' : 'bg-blue-600 text-white shadow-blue-100'
              }`}
            >
              {confirmText || t('yesDelete')}
            </button>
            <button 
              onClick={onClose}
              className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-all"
            >
              {cancelText || t('noCancel')}
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

function AlifLailaApp() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [isAdminRoute, setIsAdminRoute] = useState(window.location.hash === '#/admin');
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'rating'>('relevance');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [minRating, setMinRating] = useState(0);
  
  // Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isDeliveryBoyLogin, setIsDeliveryBoyLogin] = useState(false);
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

  useEffect(() => {
    if (profile && activeTab === 'home') {
      if (profile.role === 'delivery_boy') {
        setActiveTab('delivery-dashboard');
      } else if (profile.role === 'seller' && profile.status === 'approved') {
        setActiveTab('seller-dashboard');
      }
    }
  }, [profile]);

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sellers, setSellers] = useState<UserProfile[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [userAddresses, setUserAddresses] = useState<UserAddress[]>([]);
  const [language, setLanguage] = useState<'en' | 'hi' | 'ur'>('en');
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'product' | 'deliveryBoy' | 'seller' | 'coupon'>('product');

  const t = (key: string) => {
    return (TRANSLATIONS[language] as any)[key] || key;
  };

  // Real-time tracking for delivery boys
  useEffect(() => {
    if (profile && profile.role === 'delivery_boy' && profile.isOnline) {
      const interval = setInterval(() => {
        navigator.geolocation.getCurrentPosition((pos) => {
          const { latitude, longitude } = pos.coords;
          updateDoc(doc(db, 'users', profile.uid), {
            currentLocation: {
              lat: latitude,
              lng: longitude,
              updatedAt: new Date().toISOString()
            }
          }).catch(err => console.error('Tracking error:', err));
        }, (err) => console.error('Geolocation error:', err), { enableHighAccuracy: true });
      }, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [profile]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderToReview, setOrderToReview] = useState<Order | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingDeliveryBoy, setTrackingDeliveryBoy] = useState<UserProfile | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentCallback, setPaymentCallback] = useState<(() => void) | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const [showNotifications, setShowNotifications] = useState(false);
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
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
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
              // Create new default profile
              let initialProfile: UserProfile = {
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

  // --- Handle Action Query Params ---
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    const orderId = urlParams.get('orderId');

    if (action && orderId && profile?.role === 'seller') {
      if (action === 'accept') {
        updateOrderStatus(orderId, 'accepted');
        showToast('Order accepted from notification', 'success');
      } else if (action === 'reject') {
        updateOrderStatus(orderId, 'rejected');
        showToast('Order rejected from notification', 'error');
      }
      // Clear query params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [profile, orders]);
  useEffect(() => {
    if (profile?.role === 'seller' && isAudioEnabled) {
      const pendingOrders = orders.filter(o => o.sellerId === profile.uid && o.status === 'pending');
      
      if (pendingOrders.length > 0) {
        // Play sound
        if (!audioRef.current) {
          // Using a more urgent emergency alarm sound. 
          // TO USE ALIF LAILA SONG: Replace the URL below with your song's direct MP3 link
          audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3');
          audioRef.current.loop = true;
        }
        
        // Only play if not already playing
        if (audioRef.current.paused) {
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              if (error.name !== 'AbortError') {
                console.error("Audio play failed:", error);
              }
            });
          }
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
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      }
    } else {
      if (audioRef.current && !audioRef.current.paused) {
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
          console.warn('Google Geocoding failed, trying fallback');
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

      // 3. Secondary Fallback to Geocode.maps.co
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
        console.warn('Geocode.maps.co geocoding failed');
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
        : profile.role === 'delivery_boy'
          ? query(collection(db, 'orders'), where('sellerId', '==', profile.sellerId), orderBy('createdAt', 'desc'))
          : query(collection(db, 'orders'), where('customerId', '==', profile.uid), orderBy('createdAt', 'desc'));
    
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      const oData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      
      // Check for new orders assigned to this delivery boy
      if (profile.role === 'delivery_boy') {
        const newAssignedOrder = oData.find(o => 
          o.deliveryBoyId === profile.uid && 
          o.status === 'out_for_delivery' && 
          !orders.find(oldO => oldO.id === o.id)
        );
        
        if (newAssignedOrder && isAudioEnabled) {
          const audio = new Audio('/notification.mp3');
          audio.play().catch(e => {
            if (e.name !== 'NotSupportedError' && e.message !== 'Failed to load because no supported source was found.') {
              console.error("Audio playback failed", e);
            }
          });
          setPendingOrderForDeliveryBoy(newAssignedOrder);
        }
      }

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

    // Fetch Addresses
    const qAddresses = query(collection(db, 'addresses'), where('userId', '==', profile.uid));
    const unsubAddresses = onSnapshot(qAddresses, (snapshot) => {
      const aData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserAddress));
      setUserAddresses(aData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'addresses'));

    // Fetch Reviews
    const qReviews = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const unsubReviews = onSnapshot(qReviews, (snapshot) => {
      const rData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
      setReviews(rData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'reviews'));

    // Fetch Coupons
    const qCoupons = query(collection(db, 'coupons'), where('isActive', '==', true));
    const unsubCoupons = onSnapshot(qCoupons, (snapshot) => {
      const cData = snapshot.docs.map(doc => ({ ...doc.data() } as Coupon));
      setCoupons(cData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'coupons'));

    return () => { 
      unsubProducts(); 
      unsubOrders(); 
      unsubSellers(); 
      unsubTransactions(); 
      unsubAddresses();
      unsubReviews();
      unsubCoupons();
    };
  }, [profile]);

  // Listen to chats for active order
  useEffect(() => {
    if (!profile || !selectedOrder) return;
    const qChats = query(collection(db, 'chats'), where('orderId', '==', selectedOrder.id), orderBy('createdAt', 'asc'));
    const unsubChats = onSnapshot(qChats, (snapshot) => {
      const cData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      setChats(cData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'chats'));
    return () => unsubChats();
  }, [profile, selectedOrder]);

  // Fetch tracking delivery boy
  useEffect(() => {
    if (showTrackingModal && selectedOrder?.deliveryBoyId) {
      const unsub = onSnapshot(doc(db, 'users', selectedOrder.deliveryBoyId), (docSnap) => {
        if (docSnap.exists()) {
          setTrackingDeliveryBoy(docSnap.data() as UserProfile);
        }
      });
      return () => unsub();
    } else {
      setTrackingDeliveryBoy(null);
    }
  }, [showTrackingModal, selectedOrder]);

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

  const sendNotification = async (userId: string, title: string, message: string, type: AppNotification['type'], orderId?: string, imageUrl?: string, customerPhone?: string) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        userId,
        title,
        message,
        type,
        orderId: orderId || null,
        imageUrl: imageUrl || null,
        customerPhone: customerPhone || null,
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
  const [adminOrderTab, setAdminOrderTab] = useState<'new' | 'preparing' | 'delivery' | 'delivered' | 'earnings'>('new');
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
    deliveryFee: 40,
    password: ''
  });

  const handleEmailPasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthLoading(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();
      if (isSignUp && !isDeliveryBoyLogin) {
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
      const errorCode = error.code || "";
      const errorMessage = error.message || "";
      
      if (errorCode === 'auth/email-already-in-use') {
        message = "This email is already registered. If you are a delivery boy, please log in. Otherwise, try a different email.";
      } else if (errorCode === 'auth/invalid-email') {
        message = "Please enter a valid email address.";
      } else if (errorCode === 'auth/weak-password') {
        message = "Password should be at least 6 characters.";
      } else if (errorCode === 'auth/network-request-failed') {
        message = "Network error. Please check your internet connection and try again.";
      } else if (
        errorCode === 'auth/user-not-found' || 
        errorCode === 'auth/wrong-password' || 
        errorCode === 'auth/invalid-credential' ||
        errorCode === 'auth/invalid-login-credentials' ||
        errorCode === 'auth/user-disabled' ||
        errorMessage.toLowerCase().includes('invalid-credential') ||
        errorMessage.toLowerCase().includes('auth/invalid-credential') ||
        errorMessage.toLowerCase().includes('invalid-login-credentials')
      ) {
        message = "Invalid email or password. Please check your credentials. If you were added by a seller, use the password they provided.";
      } else if (errorMessage) {
        message = errorMessage;
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
    if (!newSellerData.email || !newSellerData.name || !newSellerData.shopName || !newSellerData.password) {
      showToast('Please fill required fields including password', 'error');
      return;
    }

    try {
      const email = newSellerData.email.trim().toLowerCase();
      
      // First check if a user with this email already exists in Firestore
      try {
        const q = query(collection(db, 'users'), where('email', '==', email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const existingUser = querySnapshot.docs[0].data();
          showToast(`This email is already registered as a ${existingUser.role || 'user'}. Please use a unique email for new seller.`, 'error');
          return;
        }
      } catch (checkError) {
        console.error("Error checking existing user:", checkError);
      }

      let tempUid = '';
      try {
        const userCredential = await createUserWithEmailAndPassword(
          secondaryAuth, 
          email, 
          newSellerData.password
        );
        tempUid = userCredential.user.uid;
        await signOut(secondaryAuth);
      } catch (authError: any) {
        console.error("Error creating seller auth:", authError);
        let errorMsg = "Failed to create seller account.";
        if (authError.code === 'auth/email-already-in-use') {
          errorMsg = "This email is already registered.";
        } else if (authError.code === 'auth/weak-password') {
          errorMsg = "Password should be at least 6 characters.";
        }
        showToast(errorMsg, 'error');
        return;
      }
      
      const sellerProfile: UserProfile = {
        uid: tempUid,
        name: newSellerData.name,
        email: email,
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
        deliveryFee: 40,
        password: ''
      });
      
      showToast('Seller added successfully! They can now log in with their email and password.', 'success');
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

    if (!selectedAddress && (!profile.address || !profile.mobile)) {
      setAddressFormData({
        address: profile.address || '',
        mobile: profile.mobile || ''
      });
      setShowAddressModal(true);
      return;
    }
    
    // Check stock
    for (const item of cart) {
      const product = products.find(p => p.id === item.productId);
      if (product && product.stock !== undefined && product.stock < item.quantity) {
        showToast(`Sorry, ${product.name} is out of stock or insufficient quantity.`, 'error');
        return;
      }
    }

    const firstProduct = products.find(p => p.id === cart[0].productId);
    if (!firstProduct) return;

    const seller = sellers.find(s => s.uid === firstProduct.sellerId);
    const deliveryFee = seller?.deliveryFee || 0;

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    let discountAmount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.discountType === 'percentage') {
        discountAmount = (subtotal * appliedCoupon.discountValue) / 100;
        if (appliedCoupon.maxDiscount) {
          discountAmount = Math.min(discountAmount, appliedCoupon.maxDiscount);
        }
      } else {
        discountAmount = appliedCoupon.discountValue;
      }
    }

    const totalAmount = subtotal - discountAmount + deliveryFee + PLATFORM_FEE;

    if (paymentMethod === 'online' && profile.walletBalance < totalAmount) {
      showToast('Insufficient wallet balance for online payment. Please add money or use COD.', 'error');
      return;
    }
    
    const orderData: Omit<Order, 'id'> = {
      customerId: auth.currentUser?.uid || profile.uid || '',
      sellerId: firstProduct.sellerId,
      items: cart,
      totalAmount,
      deliveryFee,
      deliveryCharge: deliveryFee,
      paymentMethod,
      deliveryAddress: selectedAddress ? `${selectedAddress.label}: ${selectedAddress.addressLine}, ${selectedAddress.city} - ${selectedAddress.pincode}` : profile.address || '',
      customerMobile: profile.mobile || '',
      platformFee: PLATFORM_FEE,
      sellerAmount: subtotal - discountAmount + deliveryFee,
      status: 'pending',
      createdAt: Timestamp.now(),
      paymentStatus: paymentMethod === 'online' ? 'paid' : 'pending',
      deliveryOtp: Math.floor(1000 + Math.random() * 9000).toString(),
      couponCode: appliedCoupon?.code || null,
      discountAmount: discountAmount || null,
      address: {
        addressLine: selectedAddress ? selectedAddress.addressLine : (profile.address || ''),
        location: (selectedAddress?.location || profile.location) ? {
          lat: (selectedAddress?.location?.lat || profile.location?.lat || 0),
          lng: (selectedAddress?.location?.lng || profile.location?.lng || 0)
        } : null
      }
    };

    const processOrder = async () => {
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
        
        // Decrement stock
        for (const item of cart) {
          const productRef = doc(db, 'products', item.productId);
          const product = products.find(p => p.id === item.productId);
          if (product && product.stock !== undefined) {
            await updateDoc(productRef, {
              stock: product.stock - item.quantity,
              isAvailable: (product.stock - item.quantity) > 0
            });
          }
        }

        setCart([]);
        setAppliedCoupon(null);
        setActiveTab('orders');
        addToast(t('orderPlaced'), 'success', 'Order Confirmed');
        
        // Notify Seller
        await sendNotification(
          firstProduct.sellerId,
          'New Order Received!',
          `You have a new order #${docRef.id.slice(-6).toUpperCase()} for ₹${totalAmount} (${paymentMethod.toUpperCase()})`,
          'order',
          docRef.id,
          firstProduct.image,
          profile.mobile
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'orders');
      }
    };

    if (paymentMethod === 'online') {
      setPaymentAmount(totalAmount);
      setPaymentCallback(() => processOrder);
      setShowPaymentModal(true);
    } else {
      processOrder();
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

    setPaymentAmount(amount);
    setPaymentCallback(() => async () => {
      try {
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
    });
    setShowPaymentModal(true);
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
  const [pendingOrderForDeliveryBoy, setPendingOrderForDeliveryBoy] = useState<Order | null>(null);
  const [orderToAssign, setOrderToAssign] = useState<string | null>(null);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [orderToComplete, setOrderToComplete] = useState<Order | null>(null);

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
      setShowDeleteConfirm(false);
      addToast(t('productDeleted'), 'success', t('inventoryUpdated'));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${productId}`);
    }
  };

  const deleteSeller = async (uid: string) => {
    try {
      await deleteDoc(doc(db, 'users', uid));
      setProductToDelete(null);
      setShowDeleteConfirm(false);
      addToast(t('sellerRemoved'), 'success', t('success'));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${uid}`);
    }
  };

  const handleAddDeliveryBoy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.uid) return;
    
    setIsUploading(true);
    try {
      const trimmedEmail = newDeliveryBoy.email.trim().toLowerCase();
      const dboyData: any = {
        name: newDeliveryBoy.name,
        email: trimmedEmail,
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
        // First check if a user with this email already exists in Firestore
        try {
          const q = query(collection(db, 'users'), where('email', '==', trimmedEmail));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const existingUser = querySnapshot.docs[0].data();
            if (existingUser.role === 'delivery_boy') {
              if (existingUser.sellerId === profile.uid) {
                addToast('This delivery boy is already in your team.', 'info', 'Info');
              } else {
                addToast('This email is already registered as a delivery boy for another seller.', 'error', 'Error');
              }
            } else {
              addToast(`This email is already registered as a ${existingUser.role || 'user'}. Please use a unique email for delivery boy.`, 'error', 'Error');
            }
            setIsUploading(false);
            return;
          }
        } catch (checkError) {
          console.error("Error checking existing user:", checkError);
          // Continue if check fails, Auth will catch it anyway
        }

        // Create a real Firebase Auth user using the secondary app instance
        // to avoid logging out the current seller
        try {
          const userCredential = await createUserWithEmailAndPassword(
            secondaryAuth, 
            trimmedEmail, 
            newDeliveryBoy.password
          );
          
          const tempUid = userCredential.user.uid;
          
          await setDoc(doc(db, 'users', tempUid), {
            ...dboyData,
            uid: tempUid
          });
          
          // Sign out the secondary app so it doesn't interfere
          await signOut(secondaryAuth);
          addToast('Delivery boy added successfully', 'success', 'Success');
        } catch (authError: any) {
          console.error("Error creating delivery boy auth:", authError);
          let errorMsg = "Failed to create delivery boy account.";
          const errorCode = authError.code || "";
          
          if (errorCode === 'auth/email-already-in-use') {
            errorMsg = "This email is already registered in the system. Please use a different email for this delivery boy.";
          } else if (errorCode === 'auth/weak-password') {
            errorMsg = "Password should be at least 6 characters.";
          } else if (errorCode === 'auth/invalid-email') {
            errorMsg = "Please enter a valid email address.";
          } else if (errorCode === 'auth/operation-not-allowed') {
            errorMsg = "Email/password accounts are not enabled. Please contact support.";
          }
          addToast(errorMsg, 'error', 'Error');
          setIsUploading(false);
          return;
        }
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

  useEffect(() => {
    const hasPermission = localStorage.getItem('locationPermissionGranted');
    if (!hasPermission && "geolocation" in navigator) {
      // Check if permission is already granted in the browser
      if (navigator.permissions && (navigator.permissions as any).query) {
        (navigator.permissions as any).query({ name: 'geolocation' }).then((result: any) => {
          if (result.state === 'prompt') {
            setShowLocationPrompt(true);
          } else if (result.state === 'granted') {
            localStorage.setItem('locationPermissionGranted', 'true');
          }
        });
      } else {
        // Fallback for browsers that don't support navigator.permissions.query
        setShowLocationPrompt(true);
      }
    }
  }, []);

  const handleAllowLocation = () => {
    setShowLocationPrompt(false);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
          localStorage.setItem('locationPermissionGranted', 'true');
          addToast('Location access granted!', 'success');
        },
        (error) => {
          console.error('Location access denied:', error);
          addToast('Location access denied. Please enable it in settings.', 'error');
        }
      );
    }
  };

  const handleDenyLocation = () => {
    setShowLocationPrompt(false);
    localStorage.setItem('locationPermissionGranted', 'denied');
  };

  const handleUpdateProfileDoc = async (data: Partial<UserProfile>) => {
    if (!profile) return;
    try {
      await updateDoc(doc(db, 'users', profile.uid), data);
      setProfile({ ...profile, ...data });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
    }
  };

  const blockUser = async (userId: string, currentStatus: string | undefined) => {
    try {
      const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
      await updateDoc(doc(db, 'users', userId), { status: newStatus });
      addToast(`User ${newStatus === 'blocked' ? 'blocked' : 'unblocked'} successfully.`, 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const cancelOrder = async (orderId: string, reason: string) => {
    if (!profile) return;
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      if (!orderSnap.exists()) return;
      const orderData = orderSnap.data() as Order;

      if (orderData.status !== 'pending') {
        showToast('Order cannot be cancelled now.', 'error');
        return;
      }

      await updateDoc(orderRef, {
        status: 'cancelled',
        cancellationReason: reason
      });

      // Refund if paid online
      if (orderData.paymentStatus === 'paid') {
        const customerRef = doc(db, 'users', orderData.customerId);
        const customerSnap = await getDoc(customerRef);
        if (customerSnap.exists()) {
          const customerData = customerSnap.data() as UserProfile;
          await updateDoc(customerRef, {
            walletBalance: (customerData.walletBalance || 0) + orderData.totalAmount
          });
          await addDoc(collection(db, 'transactions'), {
            userId: orderData.customerId,
            amount: orderData.totalAmount,
            type: 'refund',
            status: 'completed',
            description: `Refund for Cancelled Order #${orderId.slice(-6)}`,
            createdAt: Timestamp.now()
          });
        }
      }

      // Restore stock
      for (const item of orderData.items) {
        const productRef = doc(db, 'products', item.productId);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          const productData = productSnap.data() as Product;
          await updateDoc(productRef, {
            stock: (productData.stock || 0) + item.quantity,
            isAvailable: true
          });
        }
      }

      showToast(t('orderCancelled'), 'success');
      setSelectedOrder(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const submitReview = async (orderId: string, sellerId: string, rating: number, comment: string) => {
    if (!profile) return;
    try {
      await addDoc(collection(db, 'reviews'), {
        orderId,
        customerId: profile.uid,
        customerName: profile.name || 'Anonymous',
        sellerId,
        rating,
        comment,
        createdAt: new Date().toISOString()
      });
      showToast('Review submitted successfully!', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reviews');
    }
  };

  const sendMessage = async (orderId: string, receiverId: string, message: string) => {
    if (!profile) return;
    try {
      await addDoc(collection(db, 'chats'), {
        orderId,
        senderId: profile.uid,
        receiverId,
        message,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chats');
    }
  };

  const addAddress = async (label: 'Home' | 'Work' | 'Other', addressLine: string, city: string, pincode: string, location: { lat: number; lng: number }) => {
    if (!profile) return;
    try {
      await addDoc(collection(db, 'addresses'), {
        userId: profile.uid,
        label,
        addressLine,
        city,
        pincode,
        location
      });
      showToast('Address added successfully!', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'addresses');
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
          message = `Your order #${orderId.slice(-6).toUpperCase()} is on its way! Your delivery OTP is ${order.deliveryOtp}. Please share this with the delivery boy.`;
        } else if (newStatus === 'delivered') {
          title = 'Order Delivered';
          message = `Your order #${orderId.slice(-6).toUpperCase()} has been successfully delivered.`;
        } else if (newStatus === 'rejected') {
          title = 'Order Rejected';
          message = `Sorry, your order #${orderId.slice(-6).toUpperCase()} was rejected by the seller.`;
        }

        await sendNotification(order.customerId, title, message, 'order', orderId);

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
    let result = nearbyProducts;
    
    if (selectedCategory) {
      result = result.filter(p => p.category === selectedCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.category.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }
    
    if (priceRange.min > 0 || priceRange.max < 10000) {
      result = result.filter(p => p.price >= priceRange.min && p.price <= priceRange.max);
    }
    
    if (minRating > 0) {
      result = result.filter(p => {
        const productReviews = reviews.filter(r => r.productId === p.id);
        if (productReviews.length === 0) return false;
        const avg = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
        return avg >= minRating;
      });
    }
    
    if (sortBy === 'price_asc') {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result = [...result].sort((a, b) => {
        const aReviews = reviews.filter(r => r.productId === a.id);
        const bReviews = reviews.filter(r => r.productId === b.id);
        const aAvg = aReviews.length ? aReviews.reduce((sum, r) => sum + r.rating, 0) / aReviews.length : 0;
        const bAvg = bReviews.length ? bReviews.reduce((sum, r) => sum + r.rating, 0) / bReviews.length : 0;
        return bAvg - aAvg;
      });
    }
    
    return result;
  }, [nearbyProducts, selectedCategory, searchQuery, priceRange, minRating, sortBy, reviews]);

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
          <h1 className="text-3xl font-black text-gray-900 mb-2">
            {isDeliveryBoyLogin ? 'Delivery Boy Login' : 'Alif Laila'}
          </h1>
          <p className="text-gray-500 text-sm">Your local marketplace for everything nearby.</p>
        </div>

        <div className="w-full max-w-sm space-y-6">
          <form onSubmit={handleEmailPasswordAuth} className="space-y-4">
            {!isDeliveryBoyLogin && isSignUp && (
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
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <div className="text-right">
              <button 
                type="button"
                onClick={async () => {
                  if (!email) {
                    setAuthError("Please enter your email address first.");
                    return;
                  }
                  try {
                    await sendPasswordResetEmail(auth, email);
                    setAuthError("Password reset email sent. Please check your inbox.");
                  } catch (error: any) {
                    setAuthError(error.message);
                  }
                }}
                className="text-orange-600 text-[10px] font-bold hover:underline"
              >
                Forgot Password?
              </button>
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
                  <span>
                    {isDeliveryBoyLogin ? 'Login as Delivery Boy' : (isSignUp ? 'Create Account' : 'Sign In')}
                  </span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            {!isDeliveryBoyLogin && (
              <button 
                onClick={() => { setIsSignUp(!isSignUp); setAuthError(''); }}
                className="text-gray-500 text-xs font-bold hover:text-orange-600 transition-colors"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
              </button>
            )}
            <div className="mt-4">
              <button 
                onClick={() => { 
                  setIsDeliveryBoyLogin(!isDeliveryBoyLogin); 
                  setIsSignUp(false);
                  setAuthError(''); 
                }}
                className="text-blue-600 text-xs font-bold hover:text-blue-800 transition-colors"
              >
                {isDeliveryBoyLogin ? 'Back to Main Login' : 'Delivery Boy Login'}
              </button>
            </div>
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

  const renderSellerAnalytics = () => {
    if (profile?.role !== 'seller') return null;

    const sellerOrders = orders.filter(o => o.sellerId === profile.uid);
    const completedOrders = sellerOrders.filter(o => o.status === 'delivered');
    const totalEarnings = completedOrders.reduce((sum, o) => sum + (o.sellerAmount || 0), 0);
    
    // Prepare data for charts
    const salesData = completedOrders.reduce((acc: any[], order) => {
      const date = order.createdAt.toDate().toLocaleDateString();
      const existing = acc.find(d => d.date === date);
      if (existing) {
        existing.amount += order.sellerAmount || 0;
        existing.orders += 1;
      } else {
        acc.push({ date, amount: order.sellerAmount || 0, orders: 1 });
      }
      return acc;
    }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
      <div className="p-4 pb-24 space-y-6">
        <div className="flex items-center space-x-3">
          <button onClick={() => setActiveTab('profile')} className="p-2 bg-white rounded-xl border border-gray-100">
            <ChevronRight className="rotate-180" size={20} />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">{t('sellerAnalytics')}</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-orange-600 p-6 rounded-3xl text-white shadow-lg shadow-orange-100">
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-1">Total Earnings</p>
            <h3 className="text-2xl font-black">₹{totalEarnings.toFixed(2)}</h3>
          </div>
          <div className="bg-gray-900 p-6 rounded-3xl text-white shadow-lg shadow-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-1">Total Orders</p>
            <h3 className="text-2xl font-black">{sellerOrders.length}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4">
          <h4 className="font-bold text-gray-900">Sales Trend</h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 'bold', color: '#ea580c' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#ea580c" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4">
          <h4 className="font-bold text-gray-900">Order Statistics</h4>
          <div className="space-y-3">
            {[
              { label: 'Pending', count: sellerOrders.filter(o => o.status === 'pending').length, color: 'bg-orange-500' },
              { label: 'Accepted', count: sellerOrders.filter(o => o.status === 'accepted').length, color: 'bg-blue-500' },
              { label: 'Delivered', count: sellerOrders.filter(o => o.status === 'delivered').length, color: 'bg-green-500' },
              { label: 'Cancelled', count: sellerOrders.filter(o => o.status === 'cancelled').length, color: 'bg-red-500' },
            ].map(stat => (
              <div key={stat.label} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${stat.color}`} />
                  <span className="text-sm text-gray-600 font-medium">{stat.label}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{stat.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderOrderDetails = (order: Order) => {
    const isCustomer = profile?.uid === order.customerId;
    const isSeller = profile?.uid === order.sellerId;
    const isDeliveryBoy = profile?.uid === order.deliveryBoyId;

    return (
      <div className="p-4 pb-24 space-y-6">
        <div className="flex items-center space-x-3">
          <button onClick={() => setSelectedOrder(null)} className="p-2 bg-white rounded-xl border border-gray-100">
            <ChevronRight className="rotate-180" size={20} />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">{t('orderDetails')}</h2>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-400 font-mono">#{order.id.slice(-6).toUpperCase()}</p>
              <p className="text-sm font-bold text-gray-900">{order.items.length} Items</p>
              <p className="text-[10px] text-gray-400">{order.createdAt.toDate().toLocaleString()}</p>
            </div>
            <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
              order.status === 'delivered' ? 'bg-green-100 text-green-600' :
              order.status === 'pending' ? 'bg-orange-100 text-orange-600' :
              order.status === 'cancelled' ? 'bg-red-100 text-red-600' :
              'bg-blue-100 text-blue-600'
            }`}>
              {order.status.replace('_', ' ')}
            </span>
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-50">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.name} x {item.quantity}</span>
                <span className="font-bold text-gray-900">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-50 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>{t('subtotal')}</span>
              <span>₹{order.totalAmount - (order.deliveryFee || 0) - (order.platformFee || 0) + (order.discountAmount || 0)}</span>
            </div>
            {order.discountAmount && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount ({order.couponCode})</span>
                <span>-₹{order.discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-500">
              <span>{t('deliveryFee')}</span>
              <span>₹{order.deliveryFee}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-50">
              <span>{t('total')}</span>
              <span>₹{order.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-2">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('deliveryAddress')}</h4>
          <p className="text-sm text-gray-900 font-medium">{order.deliveryAddress}</p>
          <p className="text-xs text-gray-500">{order.customerMobile}</p>
        </div>

        {/* Chat Section */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">In-App Chat</h4>
          <div className="max-h-60 overflow-y-auto space-y-3 p-2 bg-gray-50 rounded-2xl">
            {chats.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-4">No messages yet</p>
            ) : (
              chats.map(chat => (
                <div key={chat.id} className={`flex ${chat.senderId === profile?.uid ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-xs ${
                    chat.senderId === profile?.uid ? 'bg-orange-600 text-white rounded-tr-none' : 'bg-white text-gray-900 border border-gray-100 rounded-tl-none'
                  }`}>
                    {chat.message}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex space-x-2">
            <input 
              type="text" 
              placeholder="Type a message..." 
              className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const msg = (e.target as HTMLInputElement).value;
                  if (msg.trim()) {
                    const receiverId = isCustomer ? order.sellerId : order.customerId;
                    sendMessage(order.id, receiverId, msg);
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
            />
            <button className="bg-orange-600 text-white p-2 rounded-xl">
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {isCustomer && order.status === 'pending' && (
            <button 
              onClick={() => {
                const reason = prompt('Reason for cancellation?');
                if (reason) cancelOrder(order.id, reason);
              }}
              className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-bold text-sm border border-red-100"
            >
              Cancel Order
            </button>
          )}

          {isCustomer && order.status === 'delivered' && !reviews.find(r => r.orderId === order.id) && (
            <button 
              onClick={() => {
                const rating = Number(prompt('Rate your experience (1-5):'));
                const comment = prompt('Any comments?');
                if (rating && comment) submitReview(order.id, order.sellerId, rating, comment);
              }}
              className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-orange-100"
            >
              Rate & Review
            </button>
          )}

          {isSeller && order.status === 'pending' && (
            <button 
              onClick={() => updateOrderStatus(order.id, 'accepted')}
              className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-orange-100"
            >
              Accept Order
            </button>
          )}

          {isDeliveryBoy && order.status === 'accepted' && (
            <button 
              onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
              className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-orange-100"
            >
              Out for Delivery
            </button>
          )}

          {isDeliveryBoy && order.status === 'out_for_delivery' && (
            <button 
              onClick={() => {
                setOrderToComplete(order);
                setOtpModalOpen(true);
              }}
              className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-green-100"
            >
              Complete Delivery
            </button>
          )}

          {isCustomer && order.status === 'delivered' && !reviews.some(r => r.orderId === order.id) && (
            <button 
              onClick={() => {
                setOrderToReview(order);
                setShowReviewModal(true);
              }}
              className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-orange-100 mt-4"
            >
              Rate Order
            </button>
          )}

          {isCustomer && order.status === 'out_for_delivery' && (
            <button 
              onClick={() => setShowTrackingModal(true)}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-blue-100 mt-4 flex items-center justify-center space-x-2"
            >
              <MapPin size={18} />
              <span>Track Live Location</span>
            </button>
          )}

          {isCustomer && order.status !== 'delivered' && order.status !== 'cancelled' && order.status !== 'rejected' && (
            <button 
              onClick={() => setShowChatModal(true)}
              className="w-full bg-white text-orange-600 border border-orange-200 py-4 rounded-2xl font-bold text-sm mt-4 flex items-center justify-center space-x-2 hover:bg-orange-50 transition-colors"
            >
              <MessageCircle size={18} />
              <span>Chat with Seller</span>
            </button>
          )}

          {(isSeller || isDeliveryBoy) && order.status !== 'delivered' && order.status !== 'cancelled' && order.status !== 'rejected' && (
            <button 
              onClick={() => setShowChatModal(true)}
              className="w-full bg-white text-orange-600 border border-orange-200 py-4 rounded-2xl font-bold text-sm mt-4 flex items-center justify-center space-x-2 hover:bg-orange-50 transition-colors"
            >
              <MessageCircle size={18} />
              <span>Chat with Customer</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (selectedOrder) return renderOrderDetails(selectedOrder);

    switch (activeTab) {
      case 'home':
        return (
          <div className="p-4 pb-24 space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{t('location')}</p>
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

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
              <button 
                onClick={() => setShowFilters(true)}
                className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm text-gray-600 hover:text-orange-600 transition-colors"
              >
                <Filter size={20} />
              </button>
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
                <h3 className="text-lg font-bold text-gray-900">{t('nearbyProducts')}</h3>
                <button className="text-orange-600 text-sm font-bold">{t('seeAll')}</button>
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
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-gray-500 text-xs">{product.category}</p>
                        {(() => {
                          const productReviews = reviews.filter(r => r.productId === product.id);
                          if (productReviews.length === 0) return null;
                          const avg = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
                          return (
                            <div className="flex items-center text-orange-500 text-[10px] font-bold">
                              <Star size={10} fill="currentColor" className="mr-0.5" />
                              {avg.toFixed(1)}
                            </div>
                          );
                        })()}
                      </div>
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
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('deliveryFee')}</p>
                              <p className="font-bold text-gray-900">₹{sellers.find(s => s.uid === selectedProduct.sellerId)?.deliveryFee || 0}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('seller')}</p>
                            <p className="font-bold text-gray-900 truncate max-w-[120px]">{sellers.find(s => s.uid === selectedProduct.sellerId)?.shopName || 'Local Seller'}</p>
                          </div>
                        </div>
                        <p className="text-gray-500 leading-relaxed mb-6">
                          {selectedProduct.description}
                        </p>
                        
                        {/* Reviews Section */}
                        {(() => {
                          const productReviews = reviews.filter(r => r.productId === selectedProduct.id);
                          if (productReviews.length === 0) return null;
                          const avg = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
                          return (
                            <div className="mb-6">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-gray-900">Reviews</h4>
                                <div className="flex items-center text-orange-500 font-bold">
                                  <Star size={16} fill="currentColor" className="mr-1" />
                                  {avg.toFixed(1)} <span className="text-gray-400 text-sm ml-1 font-normal">({productReviews.length})</span>
                                </div>
                              </div>
                              <div className="space-y-4 max-h-40 overflow-y-auto pr-2">
                                {productReviews.map(review => (
                                  <div key={review.id} className="bg-gray-50 p-3 rounded-xl">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-bold text-sm text-gray-900">{review.customerName}</span>
                                      <div className="flex text-orange-500">
                                        {[...Array(5)].map((_, i) => (
                                          <Star key={i} size={10} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "" : "text-gray-300"} />
                                        ))}
                                      </div>
                                    </div>
                                    {review.comment && <p className="text-xs text-gray-600">{review.comment}</p>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        <div className="flex items-center space-x-4 pt-4 border-t border-gray-100">
                          <button 
                            onClick={() => {
                              addToCart(selectedProduct);
                              setSelectedProduct(null);
                            }}
                            className="flex-1 bg-orange-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-100 active:scale-95 transition-transform flex items-center justify-center space-x-2"
                          >
                            <ShoppingBag size={20} />
                            <span>{t('addToCart')}</span>
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
            <h2 className="text-2xl font-bold text-gray-900">{t('categories')}</h2>
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
            <h2 className="text-2xl font-bold text-gray-900">{t('myOrders')}</h2>
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Package size={64} className="mb-4 opacity-20" />
                <p>{t('noOrders')}</p>
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
                        order.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                      <span className="text-gray-500 text-sm">{t('totalAmount')}</span>
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
            <h2 className="text-2xl font-bold text-gray-900">{t('myWallet')}</h2>
            
            <div className="bg-gray-900 rounded-[32px] p-8 text-white shadow-2xl shadow-gray-200 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-orange-600/20 rounded-full blur-3xl" />
              <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">{t('availableBalance')}</p>
                <h3 className="text-5xl font-bold mb-8">₹{(profile?.walletBalance || 0).toFixed(2)}</h3>
                
                <div className="flex space-x-3">
                  <button 
                    onClick={() => setActiveTab('deposit')}
                    className="flex-1 bg-orange-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-orange-900/20 active:scale-95 transition-transform flex items-center justify-center space-x-2"
                  >
                    <PlusCircle size={18} />
                    <span>{t('addMoney')}</span>
                  </button>
                  {profile?.role === 'seller' && (
                    <button 
                      onClick={() => setActiveTab('withdraw')}
                      className="flex-1 bg-white/10 backdrop-blur-md text-white py-4 rounded-2xl font-bold text-sm border border-white/10 active:scale-95 transition-transform flex items-center justify-center space-x-2"
                    >
                      <Wallet size={18} />
                      <span>{t('withdraw')}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h4 className="font-bold text-gray-900">{t('recentTransactions')}</h4>
                <button onClick={() => setActiveTab('history')} className="text-xs text-orange-600 font-bold">{t('viewAll')}</button>
              </div>
              
              <div className="space-y-3">
                {transactions.filter(t => t.userId === profile?.uid).slice(0, 5).length === 0 ? (
                  <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center">
                    <Clock size={32} className="text-gray-200 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm font-bold">No transactions yet</p>
                  </div>
                ) : (
                  transactions.filter(tx => tx.userId === profile?.uid).slice(0, 5).map(tx => (
                    <div key={tx.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          tx.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {tx.type === 'withdrawal' ? <Wallet size={20} /> : <ArrowRight size={20} className={tx.amount > 0 ? '-rotate-45' : 'rotate-135'} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 line-clamp-1">{tx.description}</p>
                          <p className="text-[10px] text-gray-400">{tx.createdAt?.toDate().toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-sm ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount)}
                        </p>
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{tx.status}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );

      case 'seller-analysis':
        return renderSellerAnalytics();

      case 'account':
        return (
          <div className="p-4 pb-24 space-y-6">
            <div className="flex flex-col items-center py-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mb-4 border-4 border-white shadow-lg overflow-hidden">
                  {profile?.avatar ? (
                    <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={48} />
                  )}
                </div>
                <label className="absolute bottom-4 right-0 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center cursor-pointer border border-gray-100 hover:bg-gray-50 transition-colors">
                  <Camera size={14} className="text-gray-600" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          if (profile) {
                            updateDoc(doc(db, 'users', profile.uid), { avatar: reader.result as string })
                              .then(() => addToast('Profile picture updated', 'success'))
                              .catch(err => addToast('Failed to update picture', 'error'));
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
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
                <>
                  <button 
                    onClick={() => setActiveTab('seller-dashboard')}
                    className="w-full flex items-center justify-between p-4 bg-orange-600 text-white rounded-2xl border border-orange-500 shadow-lg shadow-orange-100 mb-3"
                  >
                    <div className="flex items-center space-x-3">
                      <Store size={20} />
                      <span className="font-bold text-sm uppercase tracking-widest">Seller Dashboard</span>
                    </div>
                    <ChevronRight size={16} className="text-orange-200" />
                  </button>
                  <button 
                    onClick={() => setActiveTab('seller-analysis')}
                    className="w-full flex items-center justify-between p-4 bg-blue-600 text-white rounded-2xl border border-blue-500 shadow-lg shadow-blue-100"
                  >
                    <div className="flex items-center space-x-3">
                      <BarChart3 size={20} />
                      <span className="font-bold text-sm uppercase tracking-widest">Seller Analysis</span>
                    </div>
                    <ChevronRight size={16} className="text-blue-200" />
                  </button>
                </>
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
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t('mobileNumber')}</label>
                    <input 
                      type="tel" 
                      defaultValue={profile?.mobile}
                      onBlur={(e) => handleUpdateProfileDoc({ mobile: e.target.value })}
                      placeholder={t('enterMobile')}
                      className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t('deliveryAddress')}</label>
                    <textarea 
                      defaultValue={profile?.address}
                      onBlur={(e) => handleUpdateProfileDoc({ address: e.target.value })}
                      placeholder={t('enterAddress')}
                      className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-orange-500 min-h-[80px]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t('notifications')}</label>
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl mt-1">
                      <span className={`text-sm font-bold ${Notification.permission === 'denied' ? 'text-red-600' : 'text-gray-700'}`}>
                        {Notification.permission === 'granted' ? t('enabled') : Notification.permission === 'denied' ? t('blocked') : t('disabled')}
                      </span>
                      {Notification.permission !== 'granted' && (
                        <button 
                          onClick={() => subscribeToPushNotifications()}
                          className="text-[10px] font-bold text-orange-600 uppercase tracking-widest"
                        >
                          {Notification.permission === 'denied' ? t('retry') : t('enable')}
                        </button>
                      )}
                    </div>
                    {Notification.permission === 'denied' && (
                      <p className="text-[8px] text-red-400 mt-1 ml-1 leading-tight">
                        {t('permissionDenied')}
                      </p>
                    )}
                  </div>
                  {profile?.role === 'seller' && (
                    <>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t('shopName')}</label>
                        <input 
                          type="text" 
                          defaultValue={profile?.shopName}
                          onBlur={(e) => handleUpdateProfileDoc({ shopName: e.target.value })}
                          className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t('deliveryRadius')}</label>
                        <input 
                          type="number" 
                          defaultValue={profile?.deliveryRadius || 5}
                          onBlur={(e) => handleUpdateProfileDoc({ deliveryRadius: Number(e.target.value) })}
                          className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                          placeholder={t('eg5')}
                        />
                        <p className="text-[10px] text-gray-400 mt-1 ml-1">{t('radiusInfo')}</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t('deliveryFeeLabel')}</label>
                        <input 
                          type="number" 
                          defaultValue={profile?.deliveryFee || 0}
                          onBlur={(e) => handleUpdateProfileDoc({ deliveryFee: Number(e.target.value) })}
                          className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                          placeholder={t('eg20')}
                        />
                        <p className="text-[10px] text-gray-400 mt-1 ml-1">{t('flatFeeInfo')}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-2">
                <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-2">{t('preferences')}</h3>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-bold text-gray-700">{t('pushNotifications')}</span>
                  <div className="w-10 h-6 bg-orange-600 rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-gray-50">
                  <span className="text-sm font-bold text-gray-700">{t('darkMode')}</span>
                  <button 
                    onClick={() => setDarkMode(!darkMode)}
                    className={`w-10 h-6 rounded-full relative transition-colors ${darkMode ? 'bg-orange-600' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${darkMode ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-4">
                <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-2">{t('helpSupport')}</h3>
                <button 
                  onClick={() => setActiveTab('help')}
                  className="w-full flex items-center justify-between py-2"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                      <HelpCircle size={18} />
                    </div>
                    <span className="text-sm font-bold text-gray-700">{t('faqs')}</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>
                <button 
                  onClick={() => window.open('mailto:support@aliflaila.com')}
                  className="w-full flex items-center justify-between py-2 border-t border-gray-50 pt-4"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                      <MessageCircle size={18} />
                    </div>
                    <span className="text-sm font-bold text-gray-700">{t('contactSupport')}</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        );

      case 'help':
        return (
          <div className="p-4 pb-24 space-y-6">
            <div className="flex items-center space-x-4 mb-6">
              <button onClick={() => setActiveTab('account')} className="p-2 bg-white rounded-xl shadow-sm">
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-xl font-bold text-gray-900">{t('helpSupport')}</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">{t('frequentlyAskedQuestions')}</h3>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                      <h4 className="font-bold text-sm text-gray-800 mb-2">{t(`faqQ${i}`)}</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">{t(`faqA${i}`)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-orange-600 p-6 rounded-3xl text-white shadow-lg shadow-orange-100">
                <h3 className="font-bold mb-2">{t('stillNeedHelp')}</h3>
                <p className="text-orange-100 text-xs mb-4">{t('contactOurSupportTeam')}</p>
                <button 
                  onClick={() => window.open('mailto:support@aliflaila.com')}
                  className="w-full bg-white text-orange-600 py-3 rounded-2xl font-bold text-sm"
                >
                  {t('emailUs')}
                </button>
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
              <h2 className="text-2xl font-bold text-gray-900">{t('history')}</h2>
            </div>

            <div className="space-y-3">
              {(profile?.role === 'admin' ? transactions : transactions.filter(tx => tx.userId === profile?.uid)).length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mx-auto mb-4">
                    <Clock size={32} />
                  </div>
                  <p className="text-gray-400 font-bold">{t('noTransactions')}</p>
                </div>
              ) : (
                (profile?.role === 'admin' ? transactions : transactions.filter(tx => tx.userId === profile?.uid)).map(tx => (
                  <div key={tx.id} className="bg-white p-4 rounded-2xl border border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          tx.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {tx.type === 'withdrawal' ? <Wallet size={20} /> : <ArrowRight size={20} className={tx.amount > 0 ? '-rotate-45' : 'rotate-135'} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{tx.description}</p>
                          <p className="text-[10px] text-gray-400">{tx.createdAt?.toDate().toLocaleString()}</p>
                          {tx.upiId && <p className="text-[10px] text-blue-600 font-bold">UPI: {tx.upiId}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount)}
                        </p>
                        <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          tx.status === 'completed' ? 'bg-green-100 text-green-600' : 
                          tx.status === 'pending' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                    
                    {profile?.role === 'admin' && tx.type === 'withdrawal' && tx.status === 'pending' && (
                      <div className="flex space-x-2 pt-2 border-t border-gray-50">
                        <button 
                          onClick={() => approveWithdrawal(tx.id, tx.userId, tx.amount)}
                          className="flex-1 bg-green-600 text-white py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider"
                        >
                          {t('approve')}
                        </button>
                        <button 
                          onClick={() => rejectWithdrawal(tx.id, tx.userId, tx.amount)}
                          className="flex-1 bg-red-600 text-white py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider"
                        >
                          {t('reject')}
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
              <h2 className="text-2xl font-bold text-gray-900">{t('addMoney')}</h2>
            </div>

            <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-lg shadow-blue-100">
              <p className="text-blue-100 text-sm font-bold uppercase tracking-widest mb-1">{t('currentBalance')}</p>
              <h3 className="text-4xl font-bold">₹{(profile?.walletBalance || 0).toFixed(2)}</h3>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t('amountToAdd')}</label>
                <div className="relative mt-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-lg">₹</span>
                  <input 
                    type="number" 
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder={t('zeroAmount')}
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
                  {t('paymentSecurityInfo')}
                </p>
              </div>

              <button 
                onClick={depositMoney}
                disabled={!depositAmount || Number(depositAmount) <= 0}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-100 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
              >
                {t('addMoney')}
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
              <h2 className="text-2xl font-bold text-gray-900">{t('withdraw')}</h2>
            </div>

            <div className="bg-orange-600 rounded-3xl p-6 text-white shadow-lg shadow-orange-100">
              <p className="text-orange-100 text-sm font-bold uppercase tracking-widest mb-1">{t('availableBalance')}</p>
              <h3 className="text-4xl font-bold">₹{(profile?.walletBalance || 0).toFixed(2)}</h3>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t('amountToWithdraw')}</label>
                <div className="relative mt-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-lg">₹</span>
                  <input 
                    type="number" 
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    placeholder={t('zeroAmount')}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 pl-10 text-xl font-bold focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t('upiId')}</label>
                <input 
                  type="text" 
                  value={profile?.upiId || upiId}
                  onChange={(e) => !profile?.upiId && setUpiId(e.target.value)}
                  disabled={!!profile?.upiId}
                  placeholder={t('upiIdPlaceholder')}
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 mt-1 text-sm font-bold focus:ring-2 focus:ring-orange-500 disabled:opacity-70"
                />
                {profile?.upiId && (
                  <p className="text-[10px] text-gray-400 mt-1 ml-1">{t('savedUpiInfo')}</p>
                )}
              </div>

              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start space-x-3">
                <AlertCircle size={20} className="text-blue-600 mt-0.5" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  {t('withdrawalInfo')}
                </p>
              </div>

              <button 
                onClick={requestWithdrawal}
                disabled={!withdrawalAmount || Number(withdrawalAmount) <= 0 || Number(withdrawalAmount) > (profile?.walletBalance || 0) || (!profile?.upiId && !upiId)}
                className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-100 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
              >
                {t('submitRequest')}
              </button>
            </div>
          </div>
        );

      case 'seller-dashboard':
        return (
          <div className="p-4 pb-24 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tighter uppercase">{t('sellerDashboard')}</h2>
              <div className="flex items-center space-x-2">
                {notificationPermission !== 'granted' && (
                  <button 
                    onClick={requestNotificationPermission}
                    className="p-2 bg-blue-100 text-blue-600 rounded-xl flex items-center space-x-1 animate-bounce"
                    title={t('pushNotifications')}
                  >
                    <Bell size={16} />
                    <span className="text-[10px] font-bold">{t('push')}</span>
                  </button>
                )}
                {!isAudioEnabled && (
                  <button 
                    onClick={enableAudio}
                    className="p-2 bg-orange-100 text-orange-600 rounded-xl flex items-center space-x-1 animate-pulse"
                    title={t('audioEnabled')}
                  >
                    <Volume2 size={16} />
                    <span className="text-[10px] font-bold">{t('sound')}</span>
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
                  <span>{profile?.isOnline !== false ? t('online') : t('offline')}</span>
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
                    <h3 className="text-xl font-black uppercase tracking-tighter">{t('newOrderReceived')}</h3>
                    <p className="text-red-100 text-xs font-bold">{t('acceptToStopAlarm')}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab('orders')}
                  className="w-full mt-4 bg-white text-red-600 py-3 rounded-2xl font-black uppercase tracking-widest text-xs"
                >
                  {t('viewOrdersNow')}
                </button>
              </motion.div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div 
                onClick={() => setActiveTab('withdraw')}
                className="bg-orange-600 rounded-3xl p-4 text-white shadow-lg shadow-orange-100 cursor-pointer active:scale-95 transition-transform"
              >
                <div className="flex justify-between items-start mb-1">
                  <p className="text-orange-100 text-[10px] uppercase font-bold tracking-wider">{t('totalEarnings')}</p>
                  <ChevronRight size={14} className="text-orange-200" />
                </div>
                <h3 className="text-2xl font-bold">₹{profile?.walletBalance || 0}</h3>
                <p className="text-[8px] text-orange-200 mt-1 font-bold uppercase tracking-widest">{t('tapToWithdraw')}</p>
              </div>
              <div className="bg-gray-900 rounded-3xl p-4 text-white shadow-lg shadow-gray-100">
                <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">{t('activeOrders')}</p>
                <h3 className="text-2xl font-bold">{orders.filter(o => o.status !== 'delivered' && o.status !== 'rejected').length}</h3>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-gray-900">{t('recentOrders')}</h3>
              {orders.length === 0 ? (
                <p className="text-gray-400 text-sm italic">{t('noOrders')}</p>
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
                          <p className="text-sm font-bold text-gray-900">{order.items.length} {t('items')} • ₹{order.totalAmount}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                        }`}>
                          {t(order.status)}
                        </span>
                      </div>
                      {order.status === 'pending' && (
                        <div className="flex space-x-2 pt-2">
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'accepted')}
                            className="flex-1 bg-orange-600 text-white py-2 rounded-xl text-xs font-bold"
                          >
                            {t('accept')}
                          </button>
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'rejected')}
                            className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-xs font-bold"
                          >
                            {t('reject')}
                          </button>
                        </div>
                      )}
                      {order.status === 'accepted' && (
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                          className="w-full bg-blue-600 text-white py-2 rounded-xl text-xs font-bold"
                        >
                          {t('markReady')}
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
                          {t('assignDeliveryBoy')}
                        </button>
                      )}
                      {order.status === 'out_for_delivery' && !order.deliveryBoyId && (
                        <button 
                          onClick={() => {
                            setOrderToComplete(order);
                            setOtpValue('');
                            setOtpModalOpen(true);
                          }}
                          className="w-full bg-green-600 text-white py-2 rounded-xl text-xs font-bold"
                        >
                          {t('markDelivered')}
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
                      <h3 className="text-xl font-bold">{t('assignDeliveryBoy')}</h3>
                      <button onClick={() => setIsAssignModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} />
                      </button>
                    </div>

                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                      {deliveryBoys.filter(b => b.isOnline).length === 0 ? (
                        <div className="text-center py-8">
                          <Users className="mx-auto text-gray-300 mb-2" size={48} />
                          <p className="text-gray-500 text-sm">{t('noDeliveryBoysOnline')}</p>
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
                                showToast(`${t('orderAssignedTo')} ${boy.name}`, 'success');
                                setIsAssignModalOpen(false);
                                setOrderToAssign(null);
                              } catch (error) {
                                showToast(t('failedToAssign'), 'error');
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
              <h2 className="text-2xl font-bold text-gray-900">{t('myProducts')}</h2>
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
                placeholder={t('searchPlaceholder')}
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {filteredSellerProducts.length === 0 ? (
                <div className="col-span-2 bg-white rounded-3xl p-10 text-center border border-dashed border-gray-200">
                  <Package className="text-gray-300 mx-auto mb-4" size={48} />
                  <p className="text-gray-500 text-sm">{t('noProductsFound')}</p>
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
                          onClick={() => {
                          setProductToDelete(product.id);
                          setDeleteType('product');
                          setShowDeleteConfirm(true);
                        }}
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
                      <h3 className="text-xl font-bold">{editingProduct ? t('editProduct') : t('addNewProduct')}</h3>
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
                            <span className="text-xs mt-1 font-medium">{t('uploadImage')}</span>
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
                            <span className="text-white text-xs font-bold">{t('changeImage')}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('productName')}</label>
                        <input 
                          type="text" 
                          required
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                          className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                          placeholder={t('egFreshMilk')}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{t('priceLabel')}</label>
                          <input 
                            type="number" 
                            required
                            value={newProduct.price}
                            onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                            className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                            placeholder={t('zeroAmount')}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{t('category')}</label>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('offerExpiry')}</label>
                        <input 
                          type="datetime-local" 
                          value={newProduct.expiryTime}
                          onChange={(e) => setNewProduct({...newProduct, expiryTime: e.target.value})}
                          className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">{t('expiryInfo')}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label>
                        <textarea 
                          value={newProduct.description}
                          onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                          className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none"
                          rows={3}
                          placeholder={t('descriptionPlaceholder')}
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={isUploading}
                        className={`w-full bg-orange-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-100 active:scale-95 transition-transform mt-2 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isUploading ? t('uploading') : (editingProduct ? t('updateProduct') : t('addProduct'))}
                      </button>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Delete Confirmation Modal removed from here and moved to global scope */}
          </div>
        );
      }

      case 'delivery-boys':
        return (
          <div className="p-4 pb-24 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">{t('deliveryBoys')}</h2>
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
                          <span className="text-[10px] text-gray-500 uppercase font-bold">{boy.isOnline ? t('online') : t('offline')}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {boy.paymentType === 'fixed' ? `${t('fixedSalary')}: ₹${boy.salary}` : `${t('perOrder')}: ₹${boy.deliveryCharge}`}
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
                        onClick={() => {
                          setProductToDelete(boy.uid);
                          setDeleteType('deliveryBoy');
                          setShowDeleteConfirm(true);
                        }}
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
        const readyOrders = orders.filter(o => profile?.sellerId && o.sellerId === profile.sellerId && o.status === 'ready');
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
                      onClick={() => {
                        setOrderToComplete(order);
                        setOtpValue('');
                        setOtpModalOpen(true);
                      }}
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
                  <Users size={20} />
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Sellers</p>
                <h3 className="text-2xl font-black text-gray-900">{sellers.filter(s => s.role === 'seller').length}</h3>
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
            <div className="flex bg-gray-100 p-1 rounded-2xl overflow-x-auto">
              {(['new', 'preparing', 'delivery', 'delivered', 'earnings'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setAdminOrderTab(tab)}
                  className={`flex-1 py-2 px-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    adminOrderTab === tab ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {adminOrderTab === 'earnings' ? (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                    <h3 className="text-lg font-black text-gray-900">Earnings Overview</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-orange-50 p-4 rounded-2xl">
                        <p className="text-[10px] font-bold text-orange-600 uppercase">Total Earnings</p>
                        <p className="text-2xl font-black text-orange-900 mt-1">₹{orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.totalAmount, 0)}</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-2xl">
                        <p className="text-[10px] font-bold text-blue-600 uppercase">To Pay Restaurants</p>
                        <p className="text-2xl font-black text-blue-900 mt-1">₹{orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.sellerAmount, 0)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Pending Withdrawals */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest ml-1">Pending Withdrawals</h3>
                    {transactions.filter(tx => tx.type === 'withdrawal' && tx.status === 'pending').length === 0 ? (
                      <div className="bg-gray-50 p-8 rounded-[32px] text-center border border-dashed border-gray-200">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">No pending requests</p>
                      </div>
                    ) : (
                      transactions.filter(tx => tx.type === 'withdrawal' && tx.status === 'pending').map(tx => (
                        <div key={tx.id} className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Request from</p>
                              <h4 className="font-black text-gray-900 mt-1">{sellers.find(s => s.uid === tx.userId)?.name || 'Unknown Seller'}</h4>
                              <p className="text-[10px] font-black text-blue-600 mt-1">{tx.upiId}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-black text-gray-900">₹{Math.abs(tx.amount)}</p>
                              <p className="text-[8px] text-gray-400 font-bold uppercase mt-1">{tx.createdAt.toDate().toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => approveWithdrawal(tx.id, tx.userId, tx.amount)}
                              className="flex-1 bg-green-600 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform"
                            >
                              Approve & Pay
                            </button>
                            <button 
                              onClick={async () => {
                                if (confirm('Are you sure you want to reject this withdrawal? The amount will be refunded to the seller.')) {
                                  try {
                                    await updateDoc(doc(db, 'transactions', tx.id), { status: 'failed' });
                                    const sellerRef = doc(db, 'users', tx.userId);
                                    const sellerDoc = await getDoc(sellerRef);
                                    if (sellerDoc.exists()) {
                                      await updateDoc(sellerRef, {
                                        walletBalance: (sellerDoc.data().walletBalance || 0) + Math.abs(tx.amount)
                                      });
                                    }
                                    showToast('Withdrawal rejected and refunded', 'success');
                                  } catch (error) {
                                    showToast('Failed to reject withdrawal', 'error');
                                  }
                                }
                              }}
                              className="px-6 bg-red-50 text-red-600 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Seller Balances */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest ml-1">Seller Payouts</h3>
                    <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                      {sellers.filter(s => s.role === 'seller' && (s.walletBalance || 0) > 0).map((s, idx) => (
                        <div key={s.uid} className={`p-4 flex justify-between items-center ${idx !== 0 ? 'border-t border-gray-50' : ''}`}>
                          <div>
                            <p className="font-black text-gray-900 text-sm">{s.name}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{s.shopName}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-orange-600">₹{s.walletBalance || 0}</p>
                            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Pending Payout</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                orders.filter(o => {
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
              )
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
                        <div className="grid grid-cols-2 gap-3">
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
                          <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password *</label>
                            <input 
                              required
                              type="password" 
                              value={newSellerData.password}
                              onChange={(e) => setNewSellerData({...newSellerData, password: e.target.value})}
                              className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                              placeholder="At least 6 chars"
                            />
                          </div>
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
              {/* Active Sellers */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t('activeSellers')}</h3>
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
                          {s.status === 'blocked' ? t('unblock') : t('block')}
                        </button>
                      </div>

                      <div className="p-4 bg-orange-50 rounded-2xl space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[8px] font-bold text-gray-400 uppercase">{t('category')}</p>
                            <p className="text-[10px] font-black text-orange-600">{s.shopCategory}</p>
                          </div>
                          <div>
                          <p className="text-[8px] font-bold text-gray-400 uppercase">{t('mobile')}</p>
                          <a href={`tel:${s.mobile}`} className="text-[10px] font-black hover:text-orange-600 transition-colors">{s.mobile}</a>
                          </div>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-gray-400 uppercase">{t('address')}</p>
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
                            <p className="text-[8px] font-bold text-gray-400 uppercase">{t('aadhaar')}</p>
                            <p className="text-[9px] font-black">{s.aadhaarNumber}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-gray-400 uppercase">{t('pan')}</p>
                            <p className="text-[9px] font-black">{s.panNumber}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-gray-400 uppercase">{t('license')}</p>
                            <p className="text-[9px] font-black truncate">{s.licenseNumber || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-orange-100">
                          <div>
                            <p className="text-[8px] font-bold text-gray-400 uppercase">{t('walletBalance')}</p>
                            <p className="text-xs font-black text-green-600">₹{s.walletBalance}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => {
                                setProductToDelete(s.uid);
                                setDeleteType('seller');
                                setShowDeleteConfirm(true);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                            <div className="text-right">
                              <p className="text-[8px] font-bold text-gray-400 uppercase">{t('email')}</p>
                              <p className="text-[9px] font-black">{s.email}</p>
                            </div>
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
            <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">{t('customerManagement')}</h2>
            
            <div className="space-y-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t('registeredCustomers')} ({sellers.filter(s => s.role === 'customer').length})</h3>
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
                        {c.status === 'blocked' ? t('unblock') : t('block')}
                      </button>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-2xl space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[8px] font-bold text-gray-400 uppercase">{t('mobile')}</p>
                          <a href={`tel:${c.mobile}`} className="text-[10px] font-black hover:text-orange-600 transition-colors">{c.mobile || 'N/A'}</a>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-gray-400 uppercase">{t('wallet')}</p>
                          <p className="text-[10px] font-black text-green-600">₹{c.walletBalance}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-gray-400 uppercase">{t('deliveryAddress')}</p>
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
                          <p className="text-[8px] font-bold text-gray-400 uppercase">{t('ordersPlaced')}</p>
                          <p className="text-xs font-black text-gray-900">{orders.filter(o => o.customerId === c.uid).length}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-gray-400 uppercase">{t('status')}</p>
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
            <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">{t('businessInsights')}</h2>

            {/* Revenue Chart */}
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('weeklyRevenue')}</h3>
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
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('topCategories')}</h3>
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
                <h2 className="text-2xl font-bold text-gray-900">{t('myCart')}</h2>
              </div>
              
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <ShoppingBag size={64} className="mb-4 opacity-20" />
                  <p>{t('cartEmpty')}</p>
                  <button 
                    onClick={() => setActiveTab('home')}
                    className="mt-4 text-orange-600 font-bold"
                  >
                    {t('startShopping')}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.productId} className="flex items-center space-x-4 bg-white p-4 rounded-2xl border border-gray-100">
                      <div className="w-16 h-16 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 font-bold overflow-hidden">
                        {products.find(p => p.id === item.productId)?.image ? (
                          <img src={products.find(p => p.id === item.productId)?.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          item.name[0]
                        )}
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
                    {/* Address Selection */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-bold text-gray-900">{t('deliveryAddress')}</h4>
                        <button 
                          onClick={() => setShowAddressModal(true)}
                          className="text-[10px] text-orange-600 font-bold"
                        >
                          {userAddresses.length > 0 ? t('change') : t('add')}
                        </button>
                      </div>
                      
                      {selectedAddress ? (
                        <div className="bg-gray-50 p-3 rounded-xl border border-orange-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">{selectedAddress.label}</span>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">{selectedAddress.addressLine}, {selectedAddress.city} - {selectedAddress.pincode}</p>
                        </div>
                      ) : profile?.address ? (
                        <div className="bg-gray-50 p-3 rounded-xl">
                          <p className="text-xs text-gray-600 leading-relaxed">{profile.address}</p>
                          <p className="text-xs text-gray-900 font-bold mt-1">{profile.mobile}</p>
                        </div>
                      ) : (
                        <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                          <p className="text-xs text-orange-600 font-bold">Please add a delivery address</p>
                        </div>
                      )}
                    </div>

                    {/* Coupon Section */}
                    <div className="space-y-3 pt-4 border-t border-gray-50">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-bold text-gray-900">{t('coupons')}</h4>
                        {appliedCoupon && (
                          <button onClick={() => setAppliedCoupon(null)} className="text-[10px] text-red-500 font-bold uppercase">Remove</button>
                        )}
                      </div>
                      
                      {appliedCoupon ? (
                        <div className="bg-green-50 p-3 rounded-xl border border-green-100 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Tag size={16} className="text-green-600" />
                            <div>
                              <p className="text-xs font-bold text-green-700">{appliedCoupon.code}</p>
                              <p className="text-[10px] text-green-600">Applied successfully</p>
                            </div>
                          </div>
                          <div className="text-xs font-bold text-green-700">
                            -₹{appliedCoupon.discountType === 'percentage' 
                              ? Math.min((cart.reduce((s, i) => s + (i.price * i.quantity), 0) * appliedCoupon.discountValue) / 100, appliedCoupon.maxDiscount || Infinity)
                              : appliedCoupon.discountValue}
                          </div>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <input 
                            type="text" 
                            placeholder="Enter coupon code" 
                            className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const code = (e.target as HTMLInputElement).value.toUpperCase();
                                const coupon = coupons.find(c => c.code === code && c.isActive);
                                if (coupon) {
                                  setAppliedCoupon(coupon);
                                  showToast('Coupon applied!', 'success');
                                  (e.target as HTMLInputElement).value = '';
                                } else {
                                  showToast('Invalid or expired coupon', 'error');
                                }
                              }
                            }}
                          />
                          <button className="bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold">Apply</button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 pt-4 border-t border-gray-50">
                      <h4 className="text-sm font-bold text-gray-900">{t('paymentMethod')}</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => setPaymentMethod('cod')}
                          className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                            paymentMethod === 'cod' ? 'border-orange-600 bg-orange-50 text-orange-600' : 'border-gray-100 text-gray-400'
                          }`}
                        >
                          {t('cod')}
                        </button>
                        <button 
                          onClick={() => setPaymentMethod('online')}
                          className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                            paymentMethod === 'online' ? 'border-orange-600 bg-orange-50 text-orange-600' : 'border-gray-100 text-gray-400'
                          }`}
                        >
                          {t('onlinePayment')}
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-50 space-y-2">
                      <div className="flex justify-between text-gray-500 text-sm">
                        <span>{t('subtotal')}</span>
                        <span>₹{cart.reduce((s, i) => s + (i.price * i.quantity), 0)}</span>
                      </div>
                      {appliedCoupon && (
                        <div className="flex justify-between text-green-600 text-sm">
                          <span>Discount</span>
                          <span>-₹{appliedCoupon.discountType === 'percentage' 
                            ? Math.min((cart.reduce((s, i) => s + (i.price * i.quantity), 0) * appliedCoupon.discountValue) / 100, appliedCoupon.maxDiscount || Infinity)
                            : appliedCoupon.discountValue}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-500 text-sm">
                        <span>{t('deliveryFee')}</span>
                        <span className="text-orange-600 font-bold">
                          ₹{sellers.find(s => s.uid === products.find(p => p.id === cart[0].productId)?.sellerId)?.deliveryFee || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-500 text-sm">
                        <span>Platform Charges</span>
                        <span className="text-orange-600 font-bold">₹{PLATFORM_FEE}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold text-gray-900 pt-4 border-t border-gray-50">
                        <span>{t('total')}</span>
                        <span>
                          ₹{cart.reduce((s, i) => s + (i.price * i.quantity), 0) - 
                            (appliedCoupon ? (appliedCoupon.discountType === 'percentage' ? Math.min((cart.reduce((s, i) => s + (i.price * i.quantity), 0) * appliedCoupon.discountValue) / 100, appliedCoupon.maxDiscount || Infinity) : appliedCoupon.discountValue) : 0) +
                            (sellers.find(s => s.uid === products.find(p => p.id === cart[0].productId)?.sellerId)?.deliveryFee || 0) +
                            PLATFORM_FEE}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={placeOrder}
                      className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-100 active:scale-95 transition-transform"
                    >
                      {paymentMethod === 'online' ? t('payPlaceOrder') : t('placeOrder')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : renderContent()}
        </motion.div>
      </AnimatePresence>

      {/* Order Acceptance Modal */}
      <AnimatePresence>
        {pendingOrderForDeliveryBoy && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPendingOrderForDeliveryBoy(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-[32px] p-8 shadow-2xl max-w-sm w-full text-center border border-gray-100 overflow-hidden"
            >
              <h2 className="text-2xl font-black text-gray-900 mb-2">New Order!</h2>
              <p className="text-gray-500 mb-6">You have a new order #{pendingOrderForDeliveryBoy.id.slice(-6).toUpperCase()}.</p>
              <div className="space-y-3">
                <button 
                  onClick={async () => {
                    await updateDoc(doc(db, 'orders', pendingOrderForDeliveryBoy.id), { status: 'accepted' });
                    setPendingOrderForDeliveryBoy(null);
                    addToast('Order accepted!', 'success', 'Success');
                  }}
                  className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold"
                >
                  Accept Order
                </button>
                <button 
                  onClick={() => setPendingOrderForDeliveryBoy(null)}
                  className="w-full bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold"
                >
                  Ignore
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OTP Modal */}
      <AnimatePresence>
        {otpModalOpen && orderToComplete && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOtpModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Enter Delivery OTP</h3>
              <p className="text-sm text-gray-500 mb-6">Ask the customer for the 4-digit OTP to confirm delivery.</p>
              
              <input
                type="text"
                maxLength={4}
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                placeholder="0000"
                className="w-full text-center text-4xl tracking-[1em] font-black bg-gray-50 border-none rounded-2xl py-4 focus:ring-2 focus:ring-orange-500 mb-6"
              />

              <div className="flex gap-3 mb-4">
                <button 
                  onClick={() => setOtpModalOpen(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (otpValue === orderToComplete.deliveryOtp) {
                      updateOrderStatus(orderToComplete.id, 'delivered');
                      setOtpModalOpen(false);
                      setOrderToComplete(null);
                      setOtpValue('');
                      showToast('Order delivered successfully!', 'success');
                    } else {
                      showToast('Invalid OTP. Please try again.', 'error');
                    }
                  }}
                  disabled={otpValue.length !== 4}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-orange-600 shadow-lg shadow-orange-100 active:scale-95 transition-transform disabled:opacity-50"
                >
                  Verify & Deliver
                </button>
              </div>

              <button 
                onClick={async () => {
                  const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
                  try {
                    await updateDoc(doc(db, 'orders', orderToComplete.id), { deliveryOtp: newOtp });
                    await addDoc(collection(db, 'notifications'), {
                      userId: orderToComplete.customerId,
                      title: 'New Delivery OTP',
                      message: `Your new delivery OTP is ${newOtp}. Please share this with the delivery boy.`,
                      type: 'order',
                      read: false,
                      createdAt: new Date().toISOString(),
                      serverSecret: "alif-laila-push-secret-2026"
                    });
                    showToast('New OTP sent to customer', 'success');
                  } catch (error) {
                    showToast('Failed to resend OTP', 'error');
                  }
                }}
                className="w-full text-[10px] font-black text-orange-600 uppercase tracking-widest hover:underline"
              >
                Resend OTP to Customer
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      <AnimatePresence>
        {showChatModal && selectedOrder && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowChatModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col h-[80vh]"
            >
              <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">
                    {profile?.uid === selectedOrder.customerId ? 'S' : 'C'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{profile?.uid === selectedOrder.customerId ? 'Seller Support' : 'Customer'}</h3>
                    <p className="text-xs text-green-500 font-medium">Online</p>
                  </div>
                </div>
                <button onClick={() => setShowChatModal(false)} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 p-2 bg-gray-50 rounded-2xl mb-4">
                {chats.filter(c => c.orderId === selectedOrder.id)
                  .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                  .map((msg) => {
                    const isMe = profile?.uid === msg.senderId;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`${isMe ? 'bg-orange-600 text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'} p-3 rounded-2xl max-w-[80%] shadow-sm`}>
                          <p className="text-sm">{msg.message}</p>
                          <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-orange-200' : 'text-gray-400'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                })}
                {chats.filter(c => c.orderId === selectedOrder.id).length === 0 && (
                  <div className="flex justify-center items-center h-full text-gray-400 text-sm">
                    No messages yet. Start the conversation!
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input 
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && chatMessage.trim()) {
                      sendMessage(selectedOrder.id, profile?.uid === selectedOrder.customerId ? selectedOrder.sellerId : selectedOrder.customerId, chatMessage);
                      setChatMessage('');
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-orange-500"
                />
                <button 
                  onClick={() => {
                    if (chatMessage.trim()) {
                      sendMessage(selectedOrder.id, profile?.uid === selectedOrder.customerId ? selectedOrder.sellerId : selectedOrder.customerId, chatMessage);
                      setChatMessage('');
                    }
                  }}
                  className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-100 active:scale-95 transition-transform"
                >
                  <Send size={18} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mx-auto mb-4">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Secure Payment</h3>
              <p className="text-gray-500 text-sm mb-6">You are about to pay</p>
              <div className="text-4xl font-black text-blue-600 mb-8">
                ₹{paymentAmount.toFixed(2)}
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={async () => {
                    setIsProcessingPayment(true);
                    // Simulate payment delay
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    setIsProcessingPayment(false);
                    setShowPaymentModal(false);
                    if (paymentCallback) {
                      paymentCallback();
                    }
                  }}
                  disabled={isProcessingPayment}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-100 active:scale-95 transition-transform disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center"
                >
                  {isProcessingPayment ? (
                    <>
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                      />
                      Processing...
                    </>
                  ) : (
                    'Pay Now'
                  )}
                </button>
                <button 
                  onClick={() => {
                    if (!isProcessingPayment) {
                      setShowPaymentModal(false);
                      setPaymentCallback(null);
                    }
                  }}
                  disabled={isProcessingPayment}
                  className="w-full py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tracking Modal */}
      <AnimatePresence>
        {showTrackingModal && selectedOrder && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTrackingModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col h-[80vh]"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Live Tracking</h3>
                <button onClick={() => setShowTrackingModal(false)} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 rounded-2xl overflow-hidden relative bg-gray-100">
                {selectedOrder.address?.location ? (
                  <MapContainer 
                    center={[selectedOrder.address.location.lat, selectedOrder.address.location.lng]} 
                    zoom={14} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    
                    {/* Customer Location */}
                    <Marker position={[selectedOrder.address.location.lat, selectedOrder.address.location.lng]}>
                      <Popup>
                        <div className="text-center">
                          <p className="font-bold">Delivery Location</p>
                          <p className="text-xs text-gray-500">{selectedOrder.deliveryAddress}</p>
                        </div>
                      </Popup>
                    </Marker>

                    {/* Delivery Boy Location */}
                    {trackingDeliveryBoy?.currentLocation && (
                      <Marker position={[trackingDeliveryBoy.currentLocation.lat, trackingDeliveryBoy.currentLocation.lng]}>
                        <Popup>
                          <div className="text-center">
                            <p className="font-bold">{trackingDeliveryBoy.name}</p>
                            <p className="text-xs text-gray-500">Delivery Partner</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Last updated: {new Date(trackingDeliveryBoy.currentLocation.updatedAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    )}
                    
                    {/* Auto-center map to show both markers if delivery boy location is available */}
                    {trackingDeliveryBoy?.currentLocation && (
                      <TrackingChangeView center={[
                        (selectedOrder.address.location.lat + trackingDeliveryBoy.currentLocation.lat) / 2,
                        (selectedOrder.address.location.lng + trackingDeliveryBoy.currentLocation.lng) / 2
                      ]} />
                    )}
                  </MapContainer>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin size={48} className="text-blue-500 mx-auto mb-2 animate-bounce" />
                      <p className="text-gray-500 font-bold">Delivery Partner is on the way!</p>
                      <p className="text-xs text-gray-400 mt-1">Location data not available.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 bg-gray-50 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                    {selectedOrder.deliveryBoyId ? 'DB' : '?'}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Delivery Partner</p>
                    <p className="text-xs text-gray-500">Arriving in ~15 mins</p>
                  </div>
                </div>
                <button className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                  <Phone size={18} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && orderToReview && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReviewModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Rate Your Order</h3>
                <button onClick={() => setShowReviewModal(false)} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex justify-center space-x-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className={`p-2 transition-transform ${reviewRating >= star ? 'text-orange-500 scale-110' : 'text-gray-200 hover:text-orange-200'}`}
                  >
                    <Star size={32} fill={reviewRating >= star ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>

              <div className="mb-6">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 mb-2 block">Tell us more (Optional)</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="How was the product and delivery?"
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-orange-500 min-h-[100px] resize-none"
                />
              </div>

              <button 
                onClick={async () => {
                  if (!profile) return;
                  try {
                    const reviewData: any = {
                      orderId: orderToReview.id,
                      customerId: profile.uid,
                      customerName: profile.name || 'Anonymous',
                      sellerId: orderToReview.sellerId,
                      rating: reviewRating,
                      comment: reviewComment,
                      createdAt: new Date().toISOString()
                    };
                    
                    // If order has only 1 item, attach review to product directly
                    if (orderToReview.items.length === 1) {
                      reviewData.productId = orderToReview.items[0].productId;
                    }

                    await addDoc(collection(db, 'reviews'), reviewData);
                    
                    // Also update order to mark as reviewed
                    await updateDoc(doc(db, 'orders', orderToReview.id), { isReviewed: true });
                    
                    addToast('Thank you for your feedback!', 'success');
                    setShowReviewModal(false);
                    setOrderToReview(null);
                    setReviewRating(5);
                    setReviewComment('');
                  } catch (error) {
                    console.error('Error submitting review:', error);
                    addToast('Failed to submit review', 'error');
                  }
                }}
                className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-100 active:scale-95 transition-transform"
              >
                Submit Review
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Filter Modal */}
      <AnimatePresence>
        {showFilters && (
          <div className="fixed inset-0 z-[130] flex items-end justify-center sm:items-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative bg-white w-full max-w-md rounded-t-[32px] sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Filters & Sort</h3>
                <button onClick={() => setShowFilters(false)} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Sort By */}
                <div>
                  <h4 className="font-bold text-sm text-gray-900 mb-3">Sort By</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'relevance', label: 'Relevance' },
                      { id: 'price_asc', label: 'Price: Low to High' },
                      { id: 'price_desc', label: 'Price: High to Low' },
                      { id: 'rating', label: 'Top Rated' }
                    ].map(option => (
                      <button
                        key={option.id}
                        onClick={() => setSortBy(option.id as any)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                          sortBy === option.id 
                            ? 'bg-orange-50 border-orange-200 text-orange-600' 
                            : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-sm text-gray-900">Price Range</h4>
                    <span className="text-xs font-bold text-orange-600">₹{priceRange.min} - ₹{priceRange.max}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <input 
                      type="number" 
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({...priceRange, min: Number(e.target.value)})}
                      className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                      placeholder="Min"
                    />
                    <span className="text-gray-400 font-bold">to</span>
                    <input 
                      type="number" 
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({...priceRange, max: Number(e.target.value)})}
                      className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                      placeholder="Max"
                    />
                  </div>
                </div>

                {/* Minimum Rating */}
                <div>
                  <h4 className="font-bold text-sm text-gray-900 mb-3">Minimum Rating</h4>
                  <div className="flex space-x-2">
                    {[0, 1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setMinRating(rating)}
                        className={`flex-1 py-2 rounded-xl flex items-center justify-center transition-colors ${
                          minRating === rating 
                            ? 'bg-orange-600 text-white' 
                            : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        {rating === 0 ? <span className="text-xs font-bold">Any</span> : (
                          <>
                            <span className="text-xs font-bold mr-1">{rating}</span>
                            <Star size={12} fill="currentColor" />
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => {
                    setSortBy('relevance');
                    setPriceRange({min: 0, max: 10000});
                    setMinRating(0);
                  }}
                  className="flex-1 py-4 rounded-2xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  Reset
                </button>
                <button 
                  onClick={() => setShowFilters(false)}
                  className="flex-[2] bg-orange-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-100 active:scale-95 transition-transform"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </div>
        )}
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

                {(selectedOrder.customerId === profile?.uid || selectedOrder.sellerId === profile?.uid || profile?.role === 'admin') && ['accepted', 'ready', 'out_for_delivery'].includes(selectedOrder.status) && selectedOrder.deliveryOtp && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Delivery OTP</p>
                      <p className="text-xs text-blue-800 mt-1">
                        {selectedOrder.customerId === profile?.uid ? 'Share this with the delivery boy' : 'Customer must share this with you'}
                      </p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-blue-100 flex flex-col items-center">
                      <span className="text-2xl font-black text-blue-600 tracking-widest">{selectedOrder.deliveryOtp}</span>
                      <button 
                        onClick={async () => {
                          const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
                          try {
                            await updateDoc(doc(db, 'orders', selectedOrder.id), { deliveryOtp: newOtp });
                            
                            // Create notification
                            await addDoc(collection(db, 'notifications'), {
                              userId: selectedOrder.customerId,
                              title: 'New Delivery OTP',
                              message: `Your new delivery OTP is ${newOtp}. Please share this with the delivery boy.`,
                              type: 'order',
                              read: false,
                              createdAt: new Date().toISOString(),
                              serverSecret: "alif-laila-push-secret-2026"
                            });
                            showToast('New OTP sent to customer', 'success');
                          } catch (error) {
                            showToast('Failed to resend OTP', 'error');
                          }
                        }}
                        className="text-[10px] text-blue-500 underline mt-1"
                      >
                        Resend OTP
                      </button>
                    </div>
                  </div>
                )}

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
                      onClick={() => { updateOrderStatus(selectedOrder.id, 'ready'); setSelectedOrder(null); }}
                      className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-blue-100"
                    >
                      Mark Ready for Delivery
                    </button>
                  )}
                  {selectedOrder.status === 'ready' && (
                    <button 
                      onClick={() => { 
                        setOrderToAssign(selectedOrder.id);
                        setIsAssignModalOpen(true);
                        setSelectedOrder(null);
                      }}
                      className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-purple-100"
                    >
                      Assign Delivery Boy
                    </button>
                  )}
                  {selectedOrder.status === 'out_for_delivery' && !selectedOrder.deliveryBoyId && (
                    <button 
                      onClick={() => { 
                        setOrderToComplete(selectedOrder);
                        setOtpValue('');
                        setOtpModalOpen(true);
                        setSelectedOrder(null);
                      }}
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

      {/* Persistent Order Alert for Sellers */}
      <AnimatePresence>
        {profile?.role === 'seller' && profile?.isOnline !== false && orders.filter(o => o.sellerId === profile.uid && o.status === 'pending').length > 0 && (
          <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center p-6 bg-red-600/95 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-[40px] p-8 shadow-2xl text-center space-y-6 border-4 border-white"
            >
              <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-600 animate-bounce shadow-inner">
                <Bell size={48} strokeWidth={2.5} />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Naya Order Aaya Hai!</h2>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Kripya ise turant accept karein</p>
              </div>

              <div className="bg-gray-50 rounded-3xl p-6 space-y-4 border border-gray-100 max-h-[40vh] overflow-y-auto">
                {orders.filter(o => o.sellerId === profile.uid && o.status === 'pending').map(order => (
                  <div key={order.id} className="flex justify-between items-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="text-left">
                      <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">#{order.id.slice(-6).toUpperCase()}</p>
                      <p className="text-lg font-black text-gray-900">₹{order.totalAmount}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'accepted')}
                        className="bg-green-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-green-100 active:scale-95 transition-transform"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'rejected')}
                        className="bg-gray-200 text-gray-600 px-4 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-transform"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-red-600 font-black animate-pulse text-sm uppercase tracking-widest">Alarm tab tak bajega jab tak aap accept nahi karte!</p>
              
              {!isAudioEnabled && (
                <button 
                  onClick={enableAudio}
                  className="w-full bg-orange-100 text-orange-600 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] animate-pulse"
                >
                  Enable Sound Alarm
                </button>
              )}
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

      {/* Location Permission Prompt Modal */}
      <AnimatePresence>
        {showLocationPrompt && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={handleDenyLocation}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[32px] p-8 shadow-2xl max-w-sm w-full text-center border border-gray-100 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-orange-600" />
              <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-600 shadow-inner">
                <MapPin size={40} strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Enable Location Access</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-8 font-medium">
                We’d like to access your location to show your current position on the map and provide nearby results. Your location data will only be used to improve your experience and won’t be stored or shared without your consent.
              </p>
              <div className="space-y-3">
                <button 
                  onClick={handleAllowLocation}
                  className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-orange-200 active:scale-95 transition-all uppercase tracking-widest"
                >
                  Allow Location
                </button>
                <button 
                  onClick={handleDenyLocation}
                  className="w-full bg-white text-gray-400 py-3 rounded-2xl font-bold text-sm hover:text-gray-600 transition-colors uppercase tracking-widest"
                >
                  Not Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification Stack */}
      <div className="fixed bottom-24 left-4 right-4 z-[200] flex flex-col items-center space-y-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
              layout
              className="pointer-events-auto"
            >
              <div className={`px-6 py-4 rounded-[24px] shadow-2xl flex items-start space-x-4 backdrop-blur-xl border-2 min-w-[280px] max-w-md ${
                toast.type === 'success' ? 'bg-green-600/90 text-white border-green-400/50' :
                toast.type === 'error' ? 'bg-red-600/90 text-white border-red-400/50' :
                toast.type === 'warning' ? 'bg-amber-500/90 text-white border-amber-300/50' :
                'bg-gray-900/90 text-white border-gray-700/50'
              }`}>
                <div className="p-2 bg-white/20 rounded-xl mt-0.5">
                  {toast.type === 'success' ? <CheckCircle2 size={20} /> :
                   toast.type === 'error' ? <AlertCircle size={20} /> :
                   toast.type === 'warning' ? <AlertCircle size={20} /> :
                   <Info size={20} />}
                </div>
                <div className="flex-1">
                  {toast.title && <h4 className="font-black text-sm uppercase tracking-wider mb-0.5">{toast.title}</h4>}
                  <p className="text-sm font-medium opacity-90 leading-relaxed">{toast.message}</p>
                </div>
                <button 
                  onClick={() => removeToast(toast.id)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Global Confirmation Modal */}
      <ConfirmationModal 
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setProductToDelete(null); }}
        onConfirm={() => {
          if (deleteType === 'product' && productToDelete) deleteProduct(productToDelete);
          if (deleteType === 'deliveryBoy' && productToDelete) deleteDeliveryBoy(productToDelete);
          if (deleteType === 'seller' && productToDelete) deleteSeller(productToDelete);
        }}
        title={deleteType === 'product' ? t('deleteProduct') : deleteType === 'deliveryBoy' ? t('removeDeliveryBoy') : t('removeSeller')}
        message={t('deleteConfirmMessage')}
        t={t}
      />
    </div>
  );
}

