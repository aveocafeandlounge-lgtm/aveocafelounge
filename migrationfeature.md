# POS System Migration Guide

## Overview
This document provides a comprehensive guide for migrating the Loavashi Hub Cafe POS system functionality to another application. The POS system is a React-based point of sale application with Firebase/Firestore backend integration, designed for restaurant management with dine-in, takeaway, and dine-and-go credit system capabilities.

## Technology Stack
- **Frontend**: React with TypeScript
- **Backend**: Firebase/Firestore
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router
- **State Management**: React Hooks (useState, useEffect, useMemo)

## Key Features

### 1. Order Management
- **Dine-in Orders**: Table-based ordering with seat assignment
- **Takeaway Orders**: Timestamp-based bill numbering
- **Order Status Tracking**: Pending → Preparing → Ready → Served
- **Bill Splitting**: Split bills between multiple customers
- **Item Management**: Add, remove, modify quantities with custom items

### 2. Payment Processing
- **Multiple Payment Methods**: Cash, Card, Bank Transfer, Dine-and-Go
- **Payment Status Tracking**: Unpaid, Partial, Paid
- **Change Calculation**: Automatic change calculation for cash payments
- **Payment Confirmation**: Print confirmation and status updates

### 3. Dine-and-Go Credit System
- **Customer Credit Accounts**: Running balance tracking
- **Charge Management**: Add charges from POS orders
- **Payment Recording**: Full and partial payment tracking
- **Customer Breakdown**: Individual customer balance tracking
- **Day End Reporting**: Daily charges and payments summary

### 4. Printing & Reporting
- **Thermal Printer Support**: 58mm paper width formatting
- **Bill Printing**: Itemized bills with tax calculations
- **Day End Reports**: Comprehensive daily sales reports
- **Payment Method Breakdown**: Cash, Card, Transfer, Dine-and-Go totals
- **Item Sales Tracking**: Quantity and revenue per item

### 5. Customer Management
- **Customer Database**: Name, phone, email, notes
- **Customer Assignment**: Link customers to bills
- **Quick Add Presets**: Save frequently used custom items

## Data Structures

### Core Types

#### Bill Interface
```typescript
interface Bill {
  id: string;
  billNumber: string;
  title: string;
  table: string;
  seat?: string;
  items: OrderItem[];
  customerId?: string;
  customerName?: string;
  orderType: 'Dine-in' | 'Takeaway' | 'Delivery';
  discount: number;
  tax: number;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Served';
  notes: string;
  paymentMethod: 'Cash' | 'Card' | 'Bank transfer' | 'Dine-and-Go';
  paymentStatus: 'Unpaid' | 'Partial' | 'Paid';
  cashGiven?: number;
  change?: number;
  dineAndGoCustomerId?: string;
  createdAt: string;
}
```

#### OrderItem Interface
```typescript
interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  notes: string;
}
```

#### MenuItem Interface
```typescript
interface MenuItem {
  id: string;
  name: string;
  nameBn?: string;
  category: string;
  price: number;
  costPrice?: number;
  description: string;
  image: string;
  isSignature?: boolean;
}
```

#### TableItem Interface
```typescript
interface TableItem {
  id: string;
  name: string;
  seats: number;
  section: 'Indoor' | 'Outdoor' | 'VIP';
}
```

#### AppUser Interface
```typescript
interface AppUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

type UserRole = 'admin' | 'cashier';
```

#### Customer Interface
```typescript
interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
}
```

#### DineAndGoCustomer Interface
```typescript
interface DineAndGoCustomer {
  id?: string;
  name?: string;
  table?: string;
  company?: string;
  runningTotal?: number;
  lastPaymentDate?: string;
  payments?: PaymentRecord[];
  charges?: ChargeRecord[];
  createdAt?: string;
}

interface PaymentRecord {
  id?: string;
  date: string;
  amount: number;
  paymentType: 'full' | 'partial';
  notes?: string;
}

interface ChargeRecord {
  id?: string;
  date: string;
  amount: number;
  notes?: string;
  source?: string;
}
```

## Firestore Collections

### Primary Collections
1. **menuItems**: Product catalog with categories, prices, images
2. **tables**: Restaurant table configuration with seat counts
3. **bills**: Order/bill records with full transaction details
4. **customers**: Customer contact information
5. **dineAndGoCustomers**: Credit account customers with payment history

### Collection Relationships
- Bills reference customers via `customerId`
- Bills reference dine-and-go customers via `dineAndGoCustomerId`
- Bills reference tables via `table` field
- Order items reference menu items via `productId`

## Key Components & Functions

### Bill Number Generation
```typescript
function generateBillNumber(tableName: string, seatNumber: string, existingBills: Bill[], orderType: 'Dine-in' | 'Takeaway'): string
```
- **Dine-in**: Format "Table Name Seat (Sequence)" - max 6 active bills per table
- **Takeaway**: Format "Takeaway-YYYYMMDD-HHMMSS" - timestamp-based unique IDs

### Bill Creation
```typescript
function createEmptyBill(tableName: string, seatNumber: string, existingBills: Bill[], orderType: 'Dine-in' | 'Takeaway', defaultTaxRate = 0): Bill
```
- Creates new bill with default settings
- Applies default tax rate if configured
- Only includes seat for dine-in orders

### Order Item Building
```typescript
function buildOrderItem(item: MenuItem | { name: string; price: number }): OrderItem
```
- Converts menu items or custom items to order items
- Generates unique IDs for each item

### Bill Update Function
```typescript
const updateBill = (updatedBill: Bill) => {
  setBills((current) => current.map((bill) => (bill.id === updatedBill.id ? updatedBill : bill)));
  if (hasFirebaseConfig) {
    saveDocument('bills', updatedBill.id, updatedBill);
  }
};
```
- Updates local state and persists to Firestore
- Real-time synchronization with database

### Dine-and-Go Charging
```typescript
const chargeToDineAndGo = async (customerId: string, bill: Bill) => {
  // Adds charge to customer's running total
  // Creates charge record with date, amount, source
  // Updates customer record in Firestore
};
```

### Printing Functions

#### Current Bill Printing
```typescript
const printCurrentBill = () => {
  // Opens new window with thermal printer formatted HTML
  // 58mm paper width, 18px font size
  // Includes logo, QR code, item details, totals
};
```

#### Day End Report Generation
```typescript
const generateDayEndReport = () => {
  // Filters bills by current date
  // Calculates totals by payment method
  // Aggregates item sales data
  // Includes dine-and-go statistics
  // Generates thermal printer formatted report
};
```

## State Management

### Key State Variables
```typescript
const [products, setProducts] = useState<MenuItem[]>([]);
const [tables, setTables] = useState<TableItem[]>([]);
const [customers, setCustomers] = useState<Customer[]>([]);
const [bills, setBills] = useState<Bill[]>([]);
const [activeBillId, setActiveBillId] = useState<string>('');
const [dineAndGoCustomers, setDineAndGoCustomers] = useState<DineAndGoCustomer[]>([]);
```

### Local Storage Usage
- **posDefaultTaxRate**: Stores default tax rate preference
- **posUseDefaultTaxRate**: Stores whether to use default tax rate
- **posQuickPresets**: Stores frequently used custom items (max 20)

## UI Components Structure

### Main Layout
- **AppShell**: Main application wrapper with navigation
- **Product Grid**: Category-filtered menu items display
- **Bill Panel**: Active bill management with item list
- **Table Management**: Visual table status display
- **Action Bar**: Quick actions (hold, void, print, etc.)

### Modals
- **Quick Add Modal**: Add custom items to bill
- **Split Bill Modal**: Split bill between multiple customers
- **Payment Modal**: Process payments with method selection
- **Dine-and-Go Conversion Modal**: Convert bill to credit account
- **Print Preview Modal**: Preview and print bills

## Migration Steps

### Phase 1: Setup & Configuration
1. **Environment Setup**
   - Install React with TypeScript
   - Configure Firebase project
   - Set up Firestore database
   - Install dependencies: Tailwind CSS, Lucide React, React Router

2. **Firebase Configuration**
   - Create Firebase project
   - Enable Firestore database
   - Set up authentication (if needed)
   - Configure Firebase SDK in application

### Phase 2: Data Structure Migration
1. **Create Firestore Collections**
   - Set up `menuItems` collection
   - Set up `tables` collection
   - Set up `bills` collection
   - Set up `customers` collection
   - Set up `dineAndGoCustomers` collection

2. **Import Existing Data**
   - Export data from current system
   - Transform to match new schema
   - Import to Firestore collections
   - Validate data integrity

### Phase 3: Core Functionality Implementation
1. **Data Loading**
   - Implement `loadCollection` function
   - Set up real-time data synchronization
   - Handle loading states and errors

2. **Bill Management**
   - Implement bill creation logic
   - Add item management functions
   - Implement bill update/persistence
   - Add bill status tracking

3. **Order Processing**
   - Implement add/remove item functions
   - Add quantity modification
   - Implement custom item creation
   - Add quick add presets

### Phase 4: Payment System
1. **Payment Processing**
   - Implement payment modal
   - Add payment method selection
   - Calculate change for cash payments
   - Update payment status

2. **Dine-and-Go Integration**
   - Implement customer charging
   - Add payment recording
   - Implement balance tracking
   - Add customer management

### Phase 5: Printing & Reporting
1. **Thermal Printer Setup**
   - Configure paper width (58mm)
   - Set appropriate font sizes (18px base)
   - Test printer compatibility
   - Adjust formatting as needed

2. **Report Generation**
   - Implement day end report logic
   - Add date filtering
   - Calculate payment method totals
   - Generate item sales reports

### Phase 6: UI Implementation
1. **Main Interface**
   - Build product grid with categories
   - Implement bill panel
   - Add table management view
   - Create action bar

2. **Modals & Overlays**
   - Implement quick add modal
   - Add split bill functionality
   - Create payment modal
   - Add dine-and-go conversion modal

### Phase 7: Testing & Validation
1. **Functional Testing**
   - Test order creation flow
   - Verify payment processing
   - Test dine-and-go charging
   - Validate printing functionality

2. **Data Integrity**
   - Verify Firestore synchronization
   - Test concurrent bill handling
   - Validate calculations
   - Check data persistence

### Phase 8: Deployment
1. **Production Setup**
   - Configure production Firebase
   - Set up environment variables
   - Optimize build for production
   - Configure hosting

2. **User Training**
   - Train staff on new interface
   - Document procedures
   - Provide support resources
   - Monitor initial usage

## Important Considerations

### Data Migration
- **Bill IDs**: Ensure unique ID generation across systems
- **Date Formats**: Use ISO format for consistency
- **Currency**: Maintain MVR formatting
- **Tax Calculations**: Verify tax rate application

### Performance
- **Real-time Updates**: Consider Firestore real-time listeners
- **Large Datasets**: Implement pagination for bill history
- **Offline Support**: Consider offline capabilities for reliability

### Security
- **Firebase Rules**: Implement proper Firestore security rules
- **Authentication**: Add user authentication if needed
- **Data Validation**: Validate all user inputs
- **Error Handling**: Implement comprehensive error handling

### Printer Compatibility
- **Driver Support**: Ensure thermal printer drivers are installed
- **Paper Size**: Verify 58mm paper width support
- **Font Rendering**: Test monospace font rendering
- **Popup Blocking**: Ensure browser allows print popups

### User Experience
- **Touch Interface**: Optimize for touch screens
- **Keyboard Shortcuts**: Consider adding keyboard shortcuts
- **Error Messages**: Provide clear error messages
- **Loading States**: Show loading indicators for data operations

## File Structure Reference

```
src/
├── pages/
│   └── POSPage.tsx          # Main POS component
├── components/
│   └── AppShell.tsx         # Application shell
├── lib/
│   ├── firebase.ts          # Firebase configuration
│   ├── firestore.ts         # Firestore operations
│   └── mvr.ts               # Currency formatting
├── types/
│   ├── index.ts             # Core type definitions
│   └── dineAndGo.ts         # Dine-and-go types
└── data/
    └── demo.ts              # Demo data
```

## Key Dependencies

```json
{
  "react": "^18.x",
  "react-router-dom": "^6.x",
  "firebase": "^10.x",
  "lucide-react": "^0.x",
  "typescript": "^5.x",
  "tailwindcss": "^3.x"
}
```

## Conclusion

This migration guide provides a comprehensive overview of the POS system functionality. The system is designed to be modular and scalable, with clear separation of concerns between data management, business logic, and UI components. Following this guide should enable successful migration to a new application while maintaining all core functionality.

For questions or clarifications during migration, refer to the source code in `src/pages/POSPage.tsx` and the type definitions in `src/types/`.
