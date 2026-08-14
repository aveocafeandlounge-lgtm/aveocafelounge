import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Grid as GridIcon,
  ShoppingCart,
  X,
  ArrowRight,
  Pause,
  Trash2,
  Plus,
  Minus,
  Printer,
  Divide,
  Maximize,
  Minimize,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { formatMVR } from '../lib/mvr';
import { hasFirebaseConfig } from '../lib/firebase';
import { loadCollection, saveDocument } from '../lib/firestore';
import { loadDineAndGoCustomers, saveDineAndGoCustomer } from '../lib/firestore';
import type { Bill, Customer, MenuItem, OrderItem, TableItem } from '../types';
import type { DineAndGoCustomer } from '../types/dineAndGo';

const defaultCustomer: Partial<Customer> = {
  name: '',
  phone: '',
  email: '',
  notes: '',
};

function generateBillNumber(tableName: string, seatNumber: string, existingBills: Bill[], orderType: 'Dine-in' | 'Takeaway'): string {
  if (orderType === 'Takeaway') {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    return `Takeaway-${year}${month}${day}-${hour}${minute}${second}`;
  }
  
  const prefix = tableName.trim() || 'Table';
  
  // Count active (not served) bills for this table and seat
  const activeBillsForTable = existingBills.filter(
    bill => bill.table === tableName && bill.status !== 'Served'
  );
  
  // Check if max 6 bills reached
  if (activeBillsForTable.length >= 6) {
    return `${prefix} (MAX)`;
  }
  
  // Find the next sequence number
  const sequence = activeBillsForTable.length + 1;
  return `${prefix} ${seatNumber} (${sequence})`;
}

function buildOrderItem(item: MenuItem | { name: string; price: number }): OrderItem {
  return {
    id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    productId: 'id' in item ? item.id : `custom-${Date.now()}`,
    name: item.name,
    price: item.price,
    quantity: 1,
    notes: '',
  };
}

function createEmptyBill(tableName: string, seatNumber: string, existingBills: Bill[], orderType: 'Dine-in' | 'Takeaway', defaultTaxRate = 0): Bill {
  const billNumber = generateBillNumber(tableName, seatNumber, existingBills, orderType);
  const bill: Bill = {
    id: `bill-${Date.now()}`,
    billNumber,
    title: billNumber,
    table: tableName,
    items: [],
    orderType,
    discount: 0,
    tax: defaultTaxRate,
    status: 'Pending',
    notes: '',
    paymentMethod: 'Cash',
    paymentStatus: 'Unpaid',
    createdAt: new Date().toISOString(),
  };
  
  // Only include seat for Dine-in orders
  if (orderType === 'Dine-in' && seatNumber) {
    bill.seat = seatNumber;
  }
  
  return bill;
}

export default function POSPage() {
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [activeBillId, setActiveBillId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [discountPercent] = useState(0);
  const [customerPanelOpen, setCustomerPanelOpen] = useState(false);
  const [tableMenuOpen, setTableMenuOpen] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [defaultTaxRate, setDefaultTaxRate] = useState(0);
  const [useDefaultTaxRate, setUseDefaultTaxRate] = useState(false);
  const [splitBillOpen, setSplitBillOpen] = useState(false);
  const [splitBills, setSplitBills] = useState<Bill[]>([]);
  const [draggedItem, setDraggedItem] = useState<{ item: OrderItem; sourceBillId: string } | null>(null);
  const [quantityPromptOpen, setQuantityPromptOpen] = useState(false);
  const [targetBillId, setTargetBillId] = useState('');
  const [quantityToMove, setQuantityToMove] = useState(1);
  const [quickItemName, setQuickItemName] = useState('');
  const [quickItemPrice, setQuickItemPrice] = useState<number | ''>('');
  const [quickItemQty, setQuickItemQty] = useState<number>(1);
  const [quickPresets, setQuickPresets] = useState<Array<{ id: string; name: string; price: number; qty: number }>>([]);
  const [saveAsPreset, setSaveAsPreset] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>(defaultCustomer);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [selectedTableForNewOrder, setSelectedTableForNewOrder] = useState<string>('');
  const [selectedSeatForNewOrder, setSelectedSeatForNewOrder] = useState('S1');
  const [selectedOrderType, setSelectedOrderType] = useState<'Dine-in' | 'Takeaway'>('Dine-in');
  const [selectedPaxForNewOrder, setSelectedPaxForNewOrder] = useState(1);
  const [selectedDineAndGoCustomer, setSelectedDineAndGoCustomer] = useState<string>('');
  const [dineAndGoCustomers, setDineAndGoCustomers] = useState<DineAndGoCustomer[]>([]);
  const [showPrintConfirmation, setShowPrintConfirmation] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [billToPrint, setBillToPrint] = useState<Bill | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'dineandgo' | null>(null);
  const [cashGiven, setCashGiven] = useState('');
  const [showConvertToDineAndGoModal, setShowConvertToDineAndGoModal] = useState(false);
  const [convertBillId, setConvertBillId] = useState<string>('');
  const [newDineAndGoName, setNewDineAndGoName] = useState('');
  const [newDineAndGoTable, setNewDineAndGoTable] = useState('');
  const [newDineAndGoCompany, setNewDineAndGoCompany] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch((err) => {
        console.error('Error attempting to exit fullscreen:', err);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  const navigate = useNavigate();
  const defaultTaxRateStorageKey = 'posDefaultTaxRate';
  const useDefaultTaxRateStorageKey = 'posUseDefaultTaxRate';

  useEffect(() => {
    try {
      const storedRate = localStorage.getItem(defaultTaxRateStorageKey);
      const storedUse = localStorage.getItem(useDefaultTaxRateStorageKey);
      if (storedRate !== null) setDefaultTaxRate(Number(storedRate));
      if (storedUse !== null) setUseDefaultTaxRate(storedUse === 'true');
    } catch (error) {
      console.error('Failed to load POS tax settings', error);
    }
  }, []);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(products.map((product) => product.category)))],
    [products],
  );

  const activeBill = useMemo(
    () => bills.find((bill) => bill.id === activeBillId) ?? null,
    [bills, activeBillId],
  );

  const loadData = async () => {
    if (!hasFirebaseConfig) {
      return;
    }

    try {
      const [loadedProducts, loadedTables, loadedBills, loadedCustomers, loadedDineAndGoCustomers] = await Promise.all([
        loadCollection<MenuItem>('menuItems', []),
        loadCollection<TableItem>('tables', []),
        loadCollection<Bill>('bills', []),
        loadCollection<Customer>('customers', []),
        loadDineAndGoCustomers(),
      ]);

      setProducts(loadedProducts);
      setTables(loadedTables);
      setCustomers(loadedCustomers);
      setDineAndGoCustomers(loadedDineAndGoCustomers);

      // Filter out empty bills and do not auto-select any bill on load
      const billsWithItems = loadedBills.filter((bill) => bill.items.length > 0);
      setBills(billsWithItems);
      setActiveBillId('');

      if (!loadedTables.length) {
      }
    } catch (error) {
      console.error('Failed to load POS data from Firestore:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);



  const updateBill = (updatedBill: Bill) => {
    setBills((current) => current.map((bill) => (bill.id === updatedBill.id ? updatedBill : bill)));
    if (hasFirebaseConfig) {
      saveDocument('bills', updatedBill.id, updatedBill).catch((error) => {
        console.error('Failed to persist bill:', error);
      });
    }
  };

  const handleAddItem = (product: MenuItem) => {
    if (!activeBill) return;
    const updatedBill: Bill = {
      ...activeBill,
      items: activeBill.items.some((item) => item.productId === product.id)
        ? activeBill.items.map((item) =>
            item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item,
          )
        : [...activeBill.items, buildOrderItem(product)],
    };
    updateBill(updatedBill);
  };



  const removeItem = (itemId: string) => {
    if (!activeBill) return;
    const updatedBill: Bill = {
      ...activeBill,
      items: activeBill.items.filter((item) => item.id !== itemId),
    };
    updateBill(updatedBill);
  };

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (!activeBill || newQuantity < 1) return;
    const updatedBill: Bill = {
      ...activeBill,
      items: activeBill.items.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item,
      ),
    };
    updateBill(updatedBill);
  };

  const chargeToDineAndGo = async (customerId: string, bill: Bill) => {
    const customer = dineAndGoCustomers.find((c) => c.id === customerId);
    if (!customer) return;

    const billTotal = bill.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const updated: DineAndGoCustomer = {
      id: customer.id,
      ...(customer.name ? { name: customer.name } : {}),
      ...(customer.table ? { table: customer.table } : {}),
      ...(customer.company ? { company: customer.company } : {}),
      runningTotal: (customer.runningTotal ?? 0) + billTotal,
      ...(customer.lastPaymentDate ? { lastPaymentDate: customer.lastPaymentDate } : {}),
      ...(customer.payments ? { payments: customer.payments } : {}),
      ...(customer.createdAt ? { createdAt: customer.createdAt } : {}),
    };

    setDineAndGoCustomers((cur) => cur.map((c) => (c.id === customerId ? updated : c)));
    
    if (hasFirebaseConfig) {
      try {
        await saveDineAndGoCustomer(customerId, updated);
      } catch (error) {
        console.error('Failed to charge dine-and-go customer:', error);
      }
    }
  };

  const printCurrentBill = () => {
    if (!activeBill) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the bill');
      return;
    }

    const itemsHtml = activeBill.items.map(item => 
      `<div style="display: flex; justify-content: space-between; padding: 4px 0;">
        <span>${item.name} x${item.quantity}</span>
        <span>${formatMVR(item.price * item.quantity)}</span>
      </div>`
    ).join('');

    const subtotal = activeBill.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const taxAmount = Math.round((subtotal * (activeBill.tax ?? 0)) / 100);
    const total = subtotal + taxAmount;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill - ${activeBill.billNumber || activeBill.title}</title>
        <style>
          body {
            font-family: monospace;
            font-size: 42px;
            width: 300mm;
            margin: 0;
            padding: 45px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 45px;
          }
          .header-left {
            flex: 0 0 auto;
          }
          .header-center {
            flex: 1;
            text-align: center;
          }
          .header-right {
            flex: 0 0 auto;
          }
          .logo {
            width: 180px;
            height: 180px;
            border-radius: 50%;
          }
          .qr {
            width: 180px;
            height: 180px;
          }
          .section {
            border-top: 1px dashed #000;
            padding-top: 24px;
            margin-top: 45px;
          }
          .row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
          }
          .total {
            font-weight: bold;
            font-size: 54px;
          }
          .center {
            text-align: center;
          }
          @media print {
            body {
              width: 300mm;
              margin: 0;
            }
            @page {
              margin: 0;
              size: 300mm auto;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            <img src="/logo.jpeg" alt="Logo" class="logo" />
          </div>
          <div class="header-center">
            <h3>Loavashi Hub</h3>
            <p>Restaurant Management System</p>
          </div>
          <div class="header-right">
            <img src="/qr code.PNG" alt="QR Code" class="qr" />
          </div>
        </div>
        <div class="section">
          <div class="row"><strong>Bill #:</strong> ${activeBill.billNumber || activeBill.title}</div>
          <div class="row"><strong>Table:</strong> ${activeBill.table}</div>
          <div class="row"><strong>Date:</strong> ${new Date(activeBill.createdAt).toLocaleString()}</div>
        </div>
        <div class="section">
          ${itemsHtml}
        </div>
        <div class="section">
          <div class="row"><strong>Subtotal:</strong> ${formatMVR(subtotal)}</div>
          <div class="row"><strong>Tax (${activeBill.tax || 0}%):</strong> ${formatMVR(taxAmount)}</div>
          <div class="row total"><strong>Total:</strong> ${formatMVR(total)}</div>
        </div>
        <div class="section center">
          <p><strong>Payment Details</strong></p>
          <p>BML Account: 7730000865890</p>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const assignCustomer = (customerId: string) => {
    if (!activeBill) return;
    const customer = customers.find((entry) => entry.id === customerId);
    if (!customer) return;
    updateBill({ ...activeBill, customerId: customer.id, customerName: customer.name });
    setCustomerPanelOpen(false);
  };

  const addCustomer = async () => {
    if (!newCustomer.name?.trim()) {
      return;
    }

    const payload: Customer = {
      id: `customer-${Date.now()}`,
      name: newCustomer.name.trim(),
      phone: newCustomer.phone?.trim() || 'N/A',
      email: newCustomer.email?.trim() || 'N/A',
      notes: newCustomer.notes?.trim() || '',
    };

    setCustomers((current) => [payload, ...current]);
    setNewCustomer(defaultCustomer);
    if (hasFirebaseConfig) {
      await saveDocument('customers', payload.id, payload).catch((error) => {
        console.error('Failed to save customer in Firestore:', error);
      });
    }
  };



  const togglePaymentStatus = () => {
    if (!activeBill) return;
    const paid = activeBill.paymentStatus === 'Paid';
    updateBill({
      ...activeBill,
      paymentStatus: paid ? 'Unpaid' : 'Paid',
      status: paid ? 'Pending' : 'Served',
    });
  };

  const addQuickItemToBill = async () => {
    if (!quickItemName.trim() || !quickItemPrice || quickItemQty < 1) {
      return;
    }

    // Require an active bill - do not auto-select a table
    let targetBill = activeBill;
    if (!targetBill) {
      setShowQuickAddModal(false);
      return;
    }

    const newItem: OrderItem = {
      id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: `custom-${Date.now()}`,
      name: quickItemName.trim(),
      price: Number(quickItemPrice),
      quantity: quickItemQty,
      notes: '',
    };

    const updatedBill: Bill = {
      ...targetBill,
      items: [...(targetBill.items || []), newItem],
    };

    updateBill(updatedBill);

    setQuickItemName('');
    setQuickItemPrice('');
    setQuickItemQty(1);
    setShowQuickAddModal(false);
  };

  const presetsStorageKey = 'posQuickPresets';

  useEffect(() => {
    try {
      const raw = localStorage.getItem(presetsStorageKey);
      if (raw) setQuickPresets(JSON.parse(raw));
    } catch (e) {
      console.error('Failed to load quick presets', e);
    }
  }, []);

  const savePresets = (presets: typeof quickPresets) => {
    try {
      localStorage.setItem(presetsStorageKey, JSON.stringify(presets));
    } catch (e) {
      console.error('Failed to save quick presets', e);
    }
  };

  const addPreset = (name: string, price: number, qty: number) => {
    const preset = { id: `preset-${Date.now()}`, name, price, qty };
    const next = [preset, ...quickPresets].slice(0, 20);
    setQuickPresets(next);
    savePresets(next);
  };

  const removePreset = (id: string) => {
    const next = quickPresets.filter((p) => p.id !== id);
    setQuickPresets(next);
    savePresets(next);
  };

  const addPresetToBill = async (preset: { id: string; name: string; price: number; qty: number }) => {
    // Similar logic to addQuickItemToBill but using preset values
    let targetBill = activeBill;
    if (!targetBill) {
      const tableName = tables[0]?.name || 'Table';
      // Check if table already has 6 active bills
      const activeBillsForTable = bills.filter(
        bill => bill.table === tableName && bill.status !== 'Served'
      );
      if (activeBillsForTable.length >= 6) {
        return;
      }
      const newBill = createEmptyBill(tableName, 'S1', bills, 'Dine-in', useDefaultTaxRate ? defaultTaxRate : 0);
      if (newBill.billNumber && newBill.billNumber.includes('MAX')) {
        return;
      }
      setBills((current) => [...current, newBill]);
      targetBill = newBill;
      setActiveBillId(newBill.id);
      if (hasFirebaseConfig) {
        try {
          await saveDocument('bills', newBill.id, newBill);
        } catch (error) {
          console.error('Failed to create bill for quick add preset:', error);
        }
      }
    }

    const newItem: OrderItem = {
      id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: `custom-${Date.now()}`,
      name: preset.name,
      price: Number(preset.price),
      quantity: preset.qty,
      notes: '',
    };

    const updatedBill: Bill = {
      ...targetBill,
      items: [...(targetBill.items || []), newItem],
    };

    updateBill(updatedBill);
  };

  const holdOrder = () => {
    if (!activeBill) return;
    updateBill({ ...activeBill, status: 'Pending' });
  };

  const voidBill = () => {
    if (!activeBill) return;
    if (!activeBill.items.length) {
      return;
    }
    updateBill({ ...activeBill, items: [], status: 'Pending' });
  };

  const processRefund = () => {
    if (!activeBill) return;
    if (activeBill.status !== 'Served') {
      return;
    }
    updateBill({ ...activeBill, paymentStatus: 'Paid', notes: (activeBill.notes || '') + ' [REFUNDED]' });
  };

  const goBack = () => {
    if (activeBill?.items.length) {
      return;
    }
    navigate('/pos');
  };

  const handlePrintConfirmation = async (print: boolean) => {
    if (!activeBill) return;

    const savedBill: Bill = {
      ...activeBill,
      status: 'Pending',
      paymentStatus: 'Unpaid',
      paymentMethod: activeBill.paymentMethod ?? 'Cash',
    };

    updateBill(savedBill);

    // Clear the active bill - user must create new order explicitly
    setActiveBillId('');

    setShowPrintConfirmation(false);

    if (print) {
      setBillToPrint(savedBill);
      setShowPrintPreview(true);
    } else {
      navigate('/bills/pending');
    }
  };

  const closePrintPreview = () => {
    setShowPrintPreview(false);
    navigate('/bills/pending');
  };

  const printBill = () => {
    if (!billToPrint) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the bill');
      return;
    }

    const itemsHtml = billToPrint.items.map(item => 
      `<div style="display: flex; justify-content: space-between; padding: 4px 0;">
        <span>${item.name} x${item.quantity}</span>
        <span>${formatMVR(item.price * item.quantity)}</span>
      </div>`
    ).join('');

    const total = billToPrint.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill - ${billToPrint.billNumber}</title>
        <style>
          body {
            font-family: monospace;
            font-size: 42px;
            width: 300mm;
            margin: 0;
            padding: 45px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 45px;
          }
          .header-left {
            flex: 0 0 auto;
          }
          .header-center {
            flex: 1;
            text-align: center;
          }
          .header-right {
            flex: 0 0 auto;
          }
          .logo {
            width: 180px;
            height: 180px;
            border-radius: 50%;
          }
          .qr {
            width: 180px;
            height: 180px;
          }
          .section {
            border-top: 1px dashed #000;
            padding-top: 24px;
            margin-top: 45px;
          }
          .row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
          }
          .total {
            font-weight: bold;
            font-size: 54px;
          }
          .center {
            text-align: center;
          }
          @media print {
            body {
              width: 300mm;
              margin: 0;
            }
            @page {
              margin: 0;
              size: 300mm auto;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            <img src="/logo.jpeg" alt="Logo" class="logo" />
          </div>
          <div class="header-center">
            <h3>Loavashi Hub</h3>
            <p>Restaurant Management System</p>
          </div>
          <div class="header-right">
            <img src="/qr code.PNG" alt="QR Code" class="qr" />
          </div>
        </div>
        <div class="section">
          <div class="row"><strong>Bill #:</strong> ${billToPrint.billNumber}</div>
          <div class="row"><strong>Table:</strong> ${billToPrint.table}</div>
          <div class="row"><strong>Date:</strong> ${new Date(billToPrint.createdAt).toLocaleString()}</div>
        </div>
        <div class="section">
          ${itemsHtml}
        </div>
        <div class="section">
          <div class="row total"><strong>Total:</strong> ${formatMVR(total)}</div>
        </div>
        <div class="section center">
          <p><strong>Payment Details</strong></p>
          <p>BML Account: 7730000865890</p>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
      closePrintPreview();
    };
  };

  const payable = useMemo(() => {
    if (!activeBill) return 0;
    const subtotal = activeBill.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const taxAmount = Math.round((subtotal * (activeBill.tax ?? 0)) / 100);
    const discountValue = Math.round((subtotal * discountPercent) / 100);
    return Math.max(0, subtotal + taxAmount - discountValue);
  }, [activeBill, discountPercent]);

  const canSaveCurrentBill = Boolean(activeBill?.items.length);

  const selectTable = (tableId: string) => {
    if (!activeBill) return;
    const table = tables.find((entry) => entry.id === tableId);
    if (!table) return;
    updateBill({ ...activeBill, table: table.name });
    setTableMenuOpen(false);
  };



  const subtotal = useMemo(
    () => activeBill?.items.reduce((sum, item) => sum + item.price * item.quantity, 0) ?? 0,
    [activeBill],
  );

  const taxAmount = Math.round((subtotal * (activeBill?.tax ?? 0)) / 100);

  const availableTables = useMemo(
    () =>
      tables.filter(
        (table) => {
          const activeBillsForTable = bills.filter(
            bill => bill.table === table.name && bill.status !== 'Served'
          );
          return activeBillsForTable.length < 6;
        }
      ),
    [tables, bills]
  );

  const filteredProducts = useMemo(
    () =>
      products
        .filter((product) => (activeCategory === 'All' ? true : product.category === activeCategory))
        .filter((product) => product.name.toLowerCase().includes(search.toLowerCase())),
    [activeCategory, products, search],
  );

  return (
    <AppShell>
      <div className="mx-auto w-full px-3 md:px-4 py-3 md:py-4">
        {/* Product Grid */}

        {/* Search and Action Bar */}
        <div className="mb-3 flex flex-wrap items-center gap-2 md:gap-3">
          <div className="flex-1 min-w-[150px]">
            <div className="relative rounded-[24px] border border-slate-200 bg-slate-50 px-3 md:px-4 py-2 md:py-2">
              <Search className="absolute left-3 md:left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Scan item..."
                className="w-full bg-transparent pl-8 md:pl-10 text-xs md:text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowNewOrderModal(true)}
            className="inline-flex items-center gap-2 rounded-[20px] bg-green-500 px-2 md:px-3 py-2 md:py-2 text-xs font-semibold text-white shadow-lg transition hover:bg-green-600"
          >
            <GridIcon className="h-3 w-3 md:h-4 md:w-4" />
            New Order
          </button>
          <button
            type="button"
            onClick={() => setTableMenuOpen((current) => !current)}
            className="inline-flex items-center gap-2 rounded-[20px] bg-green-500 px-2 md:px-3 py-2 md:py-2 text-xs font-semibold text-white shadow-lg transition hover:bg-green-600"
          >
            <GridIcon className="h-3 w-3 md:h-4 md:w-4" />
            Scan
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-2 rounded-[20px] bg-slate-900 px-2 md:px-3 py-2 md:py-2 text-xs font-semibold text-white shadow-lg transition hover:bg-slate-700"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize className="h-3 w-3 md:h-4 md:w-4" /> : <Maximize className="h-3 w-3 md:h-4 md:w-4" />}
            {isFullscreen ? 'Exit' : 'Full'}
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-3 md:gap-4 min-h-[calc(100vh-280px)]">
          <main className="flex flex-col gap-3 md:gap-4">
            {/* New Order Modal */}
            {showNewOrderModal ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                <div className="rounded-[28px] bg-white p-3 md:p-4 shadow-2xl max-w-6xl w-full max-h-[85vh] overflow-y-auto">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h2 className="text-lg md:text-xl font-bold text-slate-900">Create New Order</h2>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewOrderModal(false);
                          setSelectedTableForNewOrder('');
                          setSelectedPaxForNewOrder(1);
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-green-300 bg-green-500 text-white hover:bg-green-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end mb-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewOrderModal(false);
                        setSelectedTableForNewOrder('');
                        setSelectedSeatForNewOrder('S1');
                        setSelectedOrderType('Dine-in');
                        setSelectedPaxForNewOrder(1);
                      }}
                      className="rounded-[28px] border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (selectedOrderType === 'Takeaway') {
                          const newBill = createEmptyBill('Takeaway', '', bills, 'Takeaway', useDefaultTaxRate ? defaultTaxRate : 0);
                          setBills((current) => [...current, newBill]);
                          setActiveBillId(newBill.id);
                          if (hasFirebaseConfig) {
                            saveDocument('bills', newBill.id, newBill).catch((error) => {
                              console.error('Failed to save takeaway bill:', error);
                            });
                          }
                          
                          // Handle dine-and-go customer
                          if (selectedDineAndGoCustomer) {
                            await chargeToDineAndGo(selectedDineAndGoCustomer, newBill);
                          }
                          
                          setShowNewOrderModal(false);
                          setSelectedTableForNewOrder('');
                          setSelectedSeatForNewOrder('S1');
                          setSelectedPaxForNewOrder(1);
                          setSelectedDineAndGoCustomer('');
                        } else {
                          if (!selectedTableForNewOrder) {
                            return;
                          }
                          const tableName = selectedTableForNewOrder;
                          const activeBillsForTable = bills.filter(
                            bill => bill.table === tableName && bill.status !== 'Served'
                          );
                          if (activeBillsForTable.length >= 6) {
                            return;
                          }
                          const newBill = createEmptyBill(tableName, selectedSeatForNewOrder, bills, selectedOrderType, useDefaultTaxRate ? defaultTaxRate : 0);
                          setBills((current) => [...current, newBill]);
                          setActiveBillId(newBill.id);
                          if (hasFirebaseConfig) {
                            saveDocument('bills', newBill.id, newBill).catch((error) => {
                              console.error('Failed to save dine-in bill:', error);
                            });
                          }
                          
                          // Handle dine-and-go customer
                          if (selectedDineAndGoCustomer) {
                            await chargeToDineAndGo(selectedDineAndGoCustomer, newBill);
                          }
                          
                          setShowNewOrderModal(false);
                          setSelectedTableForNewOrder('');
                          setSelectedSeatForNewOrder('S1');
                          setSelectedPaxForNewOrder(1);
                          setSelectedDineAndGoCustomer('');
                        }
                      }}
                      disabled={selectedOrderType === 'Dine-in' && !selectedTableForNewOrder}
                      className="inline-flex items-center justify-center rounded-[28px] bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                      Create Order
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {/* Left side - Form */}
                    <div className="space-y-2">
                      {/* Order Type Selection */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-900 mb-2">
                          Order Type
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedOrderType('Dine-in')}
                            className={`rounded-[16px] border-2 p-3 text-center transition ${
                              selectedOrderType === 'Dine-in'
                                ? 'border-green-500 bg-green-50'
                                : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            <p className="text-sm font-semibold text-slate-900">Dine-in</p>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedOrderType('Takeaway')}
                            className={`rounded-[16px] border-2 p-3 text-center transition ${
                              selectedOrderType === 'Takeaway'
                                ? 'border-green-500 bg-green-50'
                                : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            <p className="text-sm font-semibold text-slate-900">Takeaway</p>
                          </button>
                        </div>
                      </div>

                      {/* Table Selection - Only for Dine-in */}
                      {selectedOrderType === 'Dine-in' && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-900 mb-2">
                            Select Table ({availableTables.length} available)
                          </label>
                          {availableTables.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                              {availableTables.filter(table => !['Table 7', 'Table 8', 'Table 9'].includes(table.name)).map((table) => (
                                <button
                                  key={table.id}
                                  type="button"
                                  onClick={() => setSelectedTableForNewOrder(table.id)}
                                  className={`rounded-[16px] border-2 p-3 text-center transition ${
                                    selectedTableForNewOrder === table.id
                                      ? 'border-green-500 bg-green-50'
                                      : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                                  }`}
                                >
                                  <p className="text-sm font-semibold text-slate-900">{table.name}</p>
                                  <p className="text-xs text-slate-500 mt-1">{table.section}</p>
                                  <p className="text-xs text-slate-500">Max: {table.seats} pax</p>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="rounded-[16px] border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
                              No tables available. Add tables in Table Management first.
                            </div>
                          )}
                        </div>
                      )}

                      {/* Seat Selection - Only for Dine-in */}
                      {selectedOrderType === 'Dine-in' && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-900 mb-2">
                            Selected Seat
                          </label>
                          <div className="w-full rounded-[16px] border-2 border-slate-200 bg-slate-50 p-3 text-center">
                            <p className="text-sm font-semibold text-slate-900">{selectedSeatForNewOrder}</p>
                            <p className="text-xs text-slate-500 mt-1">Select from seating canvas</p>
                          </div>
                        </div>
                      )}

                      {/* Pax Selection */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-900 mb-2">
                          Number of Guests
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={selectedPaxForNewOrder}
                          onChange={(e) => setSelectedPaxForNewOrder(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                          className="w-full rounded-[18px] border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                        />
                      </div>

                      {/* Dine-and-Go Customer Selection */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-900 mb-2">
                          Dine-and-Go Customer (Optional)
                        </label>
                        <select
                          value={selectedDineAndGoCustomer}
                          onChange={(e) => setSelectedDineAndGoCustomer(e.target.value)}
                          className="w-full rounded-[18px] border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                        >
                          <option value="">None (Regular Order)</option>
                          {dineAndGoCustomers.map((customer) => (
                            <option key={customer.id} value={customer.id}>
                              {customer.name || 'Unnamed'} - {customer.table || 'No Table'} ({customer.company || 'No Company'})
                            </option>
                          ))}
                        </select>
                        {selectedDineAndGoCustomer && (
                          <div className="mt-2 rounded-lg bg-blue-50 p-2 border border-blue-200">
                            <p className="text-xs text-blue-700">
                              Order will be charged to dine-and-go account
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right side - Seating Canvas */}
                    <div className="space-y-2">
                      {selectedOrderType === 'Dine-in' && (
                        <>
                          <h3 className="text-sm font-semibold text-slate-900">Seating Canvas</h3>
                          
                          {/* Entrance Door - above Table 3 & 4 */}
                          <div className="flex justify-center">
                            <div className="w-24 h-12 rounded-lg border-4 border-slate-600 bg-slate-100 flex items-center justify-center">
                              <span className="text-xs font-semibold text-slate-600">ENTRANCE</span>
                            </div>
                          </div>

                          {/* Seating Layout - 2 columns x 3 rows */}
                          <div className="grid grid-cols-2 gap-3">
                            {[1, 2, 3, 4, 5, 6].map((tableNum) => {
                              const displayNumMap: Record<number, number> = { 1: 3, 2: 4, 3: 2, 4: 5, 5: 1 };
                              const displayNum = displayNumMap[tableNum] || tableNum;
                              const tableName = `Table ${tableNum}`;
                              const tableBills = bills.filter(bill => bill.table === tableName && bill.status !== 'Served');
                              const occupiedSeats = tableBills.map(bill => bill.seat);
                              
                              return (
                                <div key={tableNum} className="rounded-[14px] border-2 border-slate-200 bg-slate-50 p-2">
                                  <p className="text-xs font-semibold text-slate-900 mb-1 text-center">Table {displayNum}</p>
                                  
                                  {/* Table with 6 chairs - 3 on top, 3 on bottom */}
                                  <div className="flex flex-col items-center justify-center gap-1">
                                    {/* Top side chairs */}
                                    <div className="flex gap-1">
                                      {['S1', 'S2', 'S3'].map((seat) => {
                                        const isOccupied = occupiedSeats.includes(seat);
                                        const isSelected = selectedSeatForNewOrder === seat && selectedTableForNewOrder === tableName;
                                        return (
                                          <button
                                            key={seat}
                                            type="button"
                                            onClick={() => {
                                              setSelectedSeatForNewOrder(seat);
                                              setSelectedTableForNewOrder(tableName);
                                            }}
                                            disabled={isOccupied}
                                            className={`w-9 h-9 rounded-lg text-xs font-semibold transition ${
                                              isOccupied
                                                ? 'bg-red-600 text-white cursor-not-allowed'
                                                : isSelected
                                                ? 'bg-green-600 text-white'
                                                : 'bg-blue-200 text-slate-700 hover:bg-blue-300'
                                            }`}
                                          >
                                            {seat}
                                          </button>
                                        );
                                      })}
                                    </div>
                                    
                                    {/* Table - longer horizontal */}
                                    <div className="w-32 h-9 rounded-lg bg-amber-200 border-2 border-amber-300 flex items-center justify-center">
                                      <span className="text-xs font-semibold text-amber-800">{displayNum}</span>
                                    </div>
                                    
                                    {/* Bottom side chairs */}
                                    <div className="flex gap-1">
                                      {['S4', 'S5', 'S6'].map((seat) => {
                                        const isOccupied = occupiedSeats.includes(seat);
                                        const isSelected = selectedSeatForNewOrder === seat && selectedTableForNewOrder === tableName;
                                        return (
                                          <button
                                            key={seat}
                                            type="button"
                                            onClick={() => {
                                              setSelectedSeatForNewOrder(seat);
                                              setSelectedTableForNewOrder(tableName);
                                            }}
                                            disabled={isOccupied}
                                            className={`w-9 h-9 rounded-lg text-xs font-semibold transition ${
                                              isOccupied
                                                ? 'bg-red-600 text-white cursor-not-allowed'
                                                : isSelected
                                                ? 'bg-green-600 text-white'
                                                : 'bg-blue-200 text-slate-700 hover:bg-blue-300'
                                            }`}
                                          >
                                            {seat}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Counter - outside Table 1 container */}
                          <div className="flex justify-start">
                            <div className="w-32 h-7 rounded-lg bg-blue-200 border-2 border-blue-300 flex items-center justify-center">
                              <span className="text-xs font-semibold text-blue-800">COUNTER</span>
                            </div>
                          </div>

                          {/* Legend */}
                          <div className="flex items-center justify-center gap-4 text-xs">
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded bg-blue-200"></div>
                              <span>Available</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded bg-red-600"></div>
                              <span>Occupied</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded bg-green-600"></div>
                              <span>Selected</span>
                            </div>
                          </div>
                        </>
                      )}
                      {selectedOrderType === 'Takeaway' && (
                        <div className="rounded-[14px] border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
                          Seating canvas is only available for Dine-in orders
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Table Menu */}
            {tableMenuOpen ? (
              <div className="grid gap-2 rounded-[24px] border border-slate-200 bg-slate-50 p-2 md:p-3">
                <label className="block text-xs text-slate-600">
                  Assign table
                  <select
                    value={tables.find((table) => table.name === activeBill?.table)?.id ?? ''}
                    onChange={(event) => selectTable(event.target.value)}
                    className="mt-1 w-full rounded-[18px] border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none"
                  >
                    <option value="">Select a table</option>
                    {tables.map((table) => (
                      <option key={table.id} value={table.id}>
                        {table.name} � {table.section}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="rounded-[20px] border border-slate-300 bg-white p-2 md:p-3 text-xs text-slate-600">
                  <p className="font-semibold text-slate-900">Current table</p>
                  <p className="mt-1">{activeBill?.table || 'Not assigned'}</p>
                </div>
              </div>
            ) : null}

            {/* Occupied Tables Section */}
            {bills.filter((bill) => bill.status !== 'Served').length > 0 && (
              <section className="rounded-[24px] border-2 border-red-400 bg-red-50 p-3 md:p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-xs md:text-sm font-bold text-red-600">?? OCCUPIED TABLES: {bills.filter((bill) => bill.status !== 'Served').length}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {bills
                    .filter((bill) => bill.status !== 'Served')
                    .map((bill) => (
                      <button
                        key={bill.id}
                        type="button"
                        onClick={() => setActiveBillId(bill.id)}
                        className={`rounded-[16px] border-2 px-3 py-2 text-xs font-semibold transition ${
                          activeBillId === bill.id
                            ? 'border-green-700 bg-green-600 text-white shadow-md'
                            : 'border-red-400 bg-white text-red-600 hover:bg-red-100'
                        }`}
                      >
                        {bill.table} {bill.seat} {bill.items.length > 0 && `(${bill.items.length})`}
                      </button>
                    ))}
                </div>
              </section>
            )}

            <section className="flex flex-wrap gap-1.5 md:gap-2">{categories.map((tab) => {
                const isActive = tab === activeCategory;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveCategory(tab)}
                    className={`rounded-full border-2 px-3 py-2 text-xs font-bold transition ${
                      isActive
                        ? 'border-green-700 bg-green-600 text-white shadow-md'
                        : 'border-green-500 bg-green-500 text-white hover:bg-green-600 shadow-md'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </section>

            <section className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 md:gap-3 overflow-y-auto max-h-[60vh]">
              {filteredProducts.length ? (
                filteredProducts.slice(0, 20).map((product) => (
                  <article key={product.id} className="rounded-[20px] border-2 border-green-400 bg-white p-0 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <button type="button" onClick={() => handleAddItem(product)} className="flex h-full w-full flex-col items-center gap-1 md:gap-2 text-center">
                      <div className="flex h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-slate-100">
                        <img src={product.image} alt={product.name} className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 rounded-full object-cover" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[13px] md:text-sm font-bold text-slate-900 line-clamp-1">{product.name}</p>
                        {product.nameBn ? <p className="text-[10px] md:text-[11px] text-slate-500">{product.nameBn}</p> : null}
                        <p className="text-[8px] md:text-[10px] text-slate-500">{product.category}</p>
                      </div>
                      <p className="text-xs md:text-sm font-bold text-slate-900">{formatMVR(product.price)}</p>
                    </button>
                  </article>
                ))
              ) : (
                <div className="col-span-5 rounded-[24px] border border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
                  No menu items found.
                </div>
              )}
            </section>
          </main>

          {/* Right Order Panel */}
          <aside className="flex flex-col gap-3 md:gap-4 rounded-[24px] border border-slate-200 bg-white p-3 md:p-4 shadow-sm max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-2 md:p-3">
              <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomerPanelOpen((current) => !current)}
                    className="inline-flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg border-2 border-green-700 bg-green-600 text-white text-xs font-bold hover:bg-green-700 shadow-md"
                  >
                    +
                  </button>
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowQuickAddModal(true)}
                      className="inline-flex h-8 w-auto md:h-10 md:w-auto items-center justify-center rounded-lg border border-green-300 bg-green-500 text-white px-3 hover:bg-green-600 text-xs font-semibold"
                    >
                      Quick Add
                    </button>
                    <button
                      type="button"
                      onClick={togglePaymentStatus}
                      className="inline-flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg border border-green-300 bg-green-500 text-white hover:bg-green-600"
                    >
                      <span className="h-2 w-2 rounded-full bg-white" />
                    </button>
                  </div>
                </div>
              </div>

              {customerPanelOpen ? (
                <div className="mt-2 space-y-2 rounded-[16px] border border-slate-200 bg-white p-2">
                  <label className="block text-xs text-slate-500">
                    Customer
                    <select
                      value={activeBill?.customerId ?? ''}
                      onChange={(event) => assignCustomer(event.target.value)}
                      className="mt-1 w-full rounded-[12px] border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-900 outline-none"
                    >
                      <option value="">Select customer</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <input
                    value={newCustomer.name}
                    onChange={(event) => setNewCustomer((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Name"
                    className="w-full rounded-[12px] border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-900 outline-none"
                  />
                  <button
                    type="button"
                    onClick={addCustomer}
                    className="w-full rounded-[12px] bg-green-500 px-2 py-1.5 text-xs font-semibold text-white hover:bg-green-600"
                  >
                    Add
                  </button>
                </div>
              ) : null}

              {/* Quick Add Modal */}
              {showQuickAddModal ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                  <div className="rounded-[20px] bg-white p-4 md:p-6 shadow-2xl max-w-sm w-full">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-slate-900">Quick Add Item</h3>
                      <button onClick={() => setShowQuickAddModal(false)} className="text-slate-500 hover:text-slate-700">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {quickPresets.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-600 mb-2">Presets</p>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {quickPresets.map((p) => (
                              <div key={p.id} className="flex items-center gap-2">
                                <button onClick={() => addPresetToBill(p)} className="rounded-md bg-slate-100 px-3 py-2 text-xs font-semibold hover:bg-slate-200">
                                  {p.name} � {formatMVR(p.price)} x{p.qty}
                                </button>
                                <button onClick={() => removePreset(p.id)} className="text-red-500 p-1" title="Remove preset">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <label className="block text-sm text-slate-700">
                        Item name
                        <input value={quickItemName} onChange={(e) => setQuickItemName(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none" />
                      </label>

                      <div className="grid grid-cols-2 gap-2">
                        <label className="block text-sm text-slate-700">
                          Price
                          <input type="number" value={quickItemPrice as any} onChange={(e) => setQuickItemPrice(e.target.value === '' ? '' : Number(e.target.value))} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none" />
                        </label>
                        <label className="block text-sm text-slate-700">
                          Qty
                          <input type="number" min={1} value={quickItemQty} onChange={(e) => setQuickItemQty(Math.max(1, Number(e.target.value) || 1))} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none" />
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-xs">
                          <input type="checkbox" checked={saveAsPreset} onChange={(e) => setSaveAsPreset(e.target.checked)} />
                          <span>Save as preset</span>
                        </label>
                      </div>

                      <div className="flex gap-2">
                        <button onClick={() => setShowQuickAddModal(false)} className="flex-1 rounded-lg bg-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-400">Cancel</button>
                        <button onClick={() => {
                          if (saveAsPreset && quickItemName.trim() && quickItemPrice) {
                            addPreset(quickItemName.trim(), Number(quickItemPrice), quickItemQty);
                          }
                          addQuickItemToBill();
                        }} className="flex-1 rounded-lg bg-green-500 px-3 py-2 text-sm font-semibold text-white hover:bg-green-600">Add</button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Split Bill Modal */}
              {splitBillOpen && activeBill ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                  <div className="rounded-[20px] bg-green-50 p-4 md:p-6 shadow-2xl max-w-4xl w-full border-2 border-green-200 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-green-900">Split Bill</h3>
                      <button onClick={() => setSplitBillOpen(false)} className="text-green-600 hover:text-green-800">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const newBill = createEmptyBill(activeBill.table + ' Split', 'S1', bills, 'Dine-in', activeBill.tax);
                            setSplitBills([...splitBills, newBill]);
                          }}
                          className="flex-1 rounded-lg bg-green-500 px-3 py-2 text-sm font-semibold text-white hover:bg-green-600"
                        >
                          + Add New Bill
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {splitBills.map((bill) => (
                          <div
                            key={bill.id}
                            className="bg-white rounded-lg p-3 border-2 border-green-200 min-h-[200px]"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (draggedItem) {
                                const { item, sourceBillId } = draggedItem;
                                if (sourceBillId !== bill.id) {
                                  if (item.quantity > 1) {
                                    setTargetBillId(bill.id);
                                    setQuantityToMove(1);
                                    setQuantityPromptOpen(true);
                                  } else {
                                    // Remove from source bill immediately
                                    const sourceBill = splitBills.find(b => b.id === sourceBillId);
                                    if (sourceBill) {
                                      const updatedSource = {
                                        ...sourceBill,
                                        items: sourceBill.items.filter(i => i.id !== item.id)
                                      };
                                      setSplitBills(prev => prev.map(b => b.id === sourceBillId ? updatedSource : b));
                                    }
                                    // Add to target bill immediately
                                    const updatedTarget = {
                                      ...bill,
                                      items: [...bill.items, item]
                                    };
                                    setSplitBills(prev => prev.map(b => b.id === bill.id ? updatedTarget : b));
                                  }
                                }
                                setDraggedItem(null);
                              }
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-green-900">{bill.title || 'New Bill'}</span>
                              <span className="text-xs text-green-700">
                                {formatMVR(bill.items.reduce((sum, item) => sum + item.price * item.quantity, 0))}
                              </span>
                            </div>
                            <div className="space-y-1">
                              {bill.items.map((item) => (
                                <div
                                  key={item.id}
                                  draggable
                                  onDragStart={() => setDraggedItem({ item, sourceBillId: bill.id })}
                                  className="bg-green-50 rounded p-2 cursor-move hover:bg-green-100 border border-green-200 relative"
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedBill = {
                                        ...bill,
                                        items: bill.items.filter(i => i.id !== item.id)
                                      };
                                      setSplitBills(prev => prev.map(b => b.id === bill.id ? updatedBill : b));
                                    }}
                                    className="absolute top-1 right-1 text-red-500 hover:text-red-700 p-1"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                  <div className="flex items-center justify-between pr-4">
                                    <span className="text-xs font-medium text-green-900">{item.name}</span>
                                    <span className="text-xs text-green-700">×{item.quantity}</span>
                                  </div>
                                  <div className="text-xs text-green-600">{formatMVR(item.price * item.quantity)}</div>
                                </div>
                              ))}
                              {bill.items.length === 0 && (
                                <div className="text-center text-xs text-green-400 py-4">
                                  Drop items here
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <button onClick={() => setSplitBillOpen(false)} className="flex-1 rounded-lg bg-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-400">Cancel</button>
                        <button onClick={() => {
                          // Save all split bills that have items
                          const billsWithItems = splitBills.filter(bill => bill.items.length > 0);
                          setBills(prev => {
                            const billsWithoutOriginal = prev.filter(b => b.id !== activeBill.id);
                            return [...billsWithoutOriginal, ...billsWithItems];
                          });
                          setActiveBillId('');
                          setSplitBillOpen(false);
                        }} className="flex-1 rounded-lg bg-green-500 px-3 py-2 text-sm font-semibold text-white hover:bg-green-600">Save Split Bills</button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Quantity Prompt Modal */}
              {quantityPromptOpen && draggedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                  <div className="rounded-[20px] bg-green-50 p-4 md:p-6 shadow-2xl max-w-sm w-full border-2 border-green-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-green-900">Move Quantity</h3>
                      <button onClick={() => setQuantityPromptOpen(false)} className="text-green-600 hover:text-green-800">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-3 border border-green-200">
                        <p className="text-sm font-medium text-green-900">{draggedItem.item.name}</p>
                        <p className="text-xs text-green-700">Available: {draggedItem.item.quantity}</p>
                      </div>

                      <div>
                        <label className="block text-sm text-green-800 mb-2">Quantity to move</label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setQuantityToMove(Math.max(1, quantityToMove - 1))}
                            className="rounded-lg bg-green-200 px-3 py-2 text-sm font-semibold hover:bg-green-300 text-green-900"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="text-xl font-bold text-green-900 w-12 text-center">{quantityToMove}</span>
                          <button
                            type="button"
                            onClick={() => setQuantityToMove(Math.min(draggedItem.item.quantity, quantityToMove + 1))}
                            className="rounded-lg bg-green-200 px-3 py-2 text-sm font-semibold hover:bg-green-300 text-green-900"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button onClick={() => setQuantityPromptOpen(false)} className="flex-1 rounded-lg bg-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-400">Cancel</button>
                        <button onClick={() => {
                          if (!draggedItem) return;
                          const { item, sourceBillId } = draggedItem;
                          
                          // Update source bill with functional state update
                          setSplitBills(prev => {
                            const sourceBill = prev.find(b => b.id === sourceBillId);
                            if (!sourceBill) return prev;
                            
                            const remainingQty = item.quantity - quantityToMove;
                            let updatedSource;
                            if (remainingQty <= 0) {
                              updatedSource = {
                                ...sourceBill,
                                items: sourceBill.items.filter(i => i.id !== item.id)
                              };
                            } else {
                              updatedSource = {
                                ...sourceBill,
                                items: sourceBill.items.map(i => 
                                  i.id === item.id 
                                    ? { ...i, quantity: remainingQty }
                                    : i
                                )
                              };
                            }
                            return prev.map(b => b.id === sourceBillId ? updatedSource : b);
                          });

                          // Update target bill with functional state update
                          setSplitBills(prev => {
                            const targetBill = prev.find(b => b.id === targetBillId);
                            if (!targetBill) return prev;
                            
                            const existingItem = targetBill.items.find(i => i.id === item.id);
                            let updatedTarget;
                            if (existingItem) {
                              updatedTarget = {
                                ...targetBill,
                                items: targetBill.items.map(i =>
                                  i.id === item.id
                                    ? { ...i, quantity: i.quantity + quantityToMove }
                                    : i
                                )
                              };
                            } else {
                              updatedTarget = {
                                ...targetBill,
                                items: [...targetBill.items, { ...item, quantity: quantityToMove }]
                              };
                            }
                            return prev.map(b => b.id === targetBillId ? updatedTarget : b);
                          });

                          setQuantityPromptOpen(false);
                          setDraggedItem(null);
                        }} className="flex-1 rounded-lg bg-green-500 px-3 py-2 text-sm font-semibold text-white hover:bg-green-600">Move</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Print Confirmation Modal */}
              {showPrintConfirmation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                  <div className="rounded-[20px] bg-white p-4 md:p-6 shadow-2xl max-w-sm w-full">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-900">Print Receipt?</h3>
                      <button onClick={() => setShowPrintConfirmation(false)} className="text-slate-500 hover:text-slate-700">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <p className="text-sm text-slate-600 mb-6">Would you like to print the receipt for this order?</p>
                    <div className="flex gap-2">
                      <button onClick={() => handlePrintConfirmation(false)} className="flex-1 rounded-lg bg-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-400">No</button>
                      <button onClick={() => handlePrintConfirmation(true)} className="flex-1 rounded-lg bg-green-500 px-3 py-2 text-sm font-semibold text-white hover:bg-green-600">Yes</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Print Preview Modal */}
              {showPrintPreview && billToPrint && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                  <div className="rounded-[20px] bg-white p-4 md:p-6 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-end mb-4 no-print">
                      <button onClick={() => setShowPrintPreview(false)} className="text-slate-500 hover:text-slate-700">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="bg-white p-4 rounded-lg mb-4 font-mono text-xs border border-slate-300" id="print-bill">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex-0">
                          <img src="/logo.jpeg" alt="Loavashi Hub" className="h-12 w-12 rounded-full" />
                        </div>
                        <div className="flex-1 text-center">
                          <h4 className="font-bold text-sm">Loavashi Hub</h4>
                          <p className="text-slate-600 text-xs">Restaurant Management System</p>
                        </div>
                        <div className="flex-0">
                          <img src="/qr code.PNG" alt="QR Code" className="h-12 w-12" />
                        </div>
                      </div>
                      <div className="border-t border-slate-300 pt-2 mb-2">
                        <p><strong>Bill #:</strong> {billToPrint.billNumber}</p>
                        <p><strong>Table:</strong> {billToPrint.table}</p>
                        <p><strong>Date:</strong> {new Date(billToPrint.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="border-t border-slate-300 pt-2 mb-2">
                        {billToPrint.items.map((item) => (
                          <div key={item.id} className="flex justify-between py-1">
                            <span>{item.name} x{item.quantity}</span>
                            <span>{formatMVR(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-slate-300 pt-2 mb-2">
                        <div className="flex justify-between font-bold">
                          <span>Total</span>
                          <span>{formatMVR(billToPrint.items.reduce((sum, item) => sum + item.price * item.quantity, 0))}</span>
                        </div>
                      </div>
                      <div className="border-t border-slate-300 pt-2 mt-4">
                        <p className="text-center text-slate-600 mb-2">Payment Details</p>
                        <p className="text-center"><strong>BML Account:</strong> 7730000865890</p>
                      </div>
                    </div>
                    <div className="flex gap-2 no-print">
                      <button onClick={closePrintPreview} className="flex-1 rounded-lg bg-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-400">Close</button>
                      <button onClick={printBill} className="flex-1 rounded-lg bg-green-500 px-3 py-2 text-sm font-semibold text-white hover:bg-green-600">Print</button>
                    </div>
                  </div>
                </div>
              )}
              <style>{`
                @media print {
                  * {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  body > *:not(#print-bill) {
                    display: none !important;
                  }
                  #print-bill {
                    display: block !important;
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    margin: 0 !important;
                    padding: 10mm !important;
                    background: white !important;
                    z-index: 9999 !important;
                  }
                  .no-print {
                    display: none !important;
                  }
                  @page {
                    margin: 0;
                    size: 80mm auto;
                  }
                }
              `}</style>
            </div>

            <div className="space-y-2 rounded-[20px] border border-slate-200 bg-white p-2 md:p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-900">Order ({activeBill?.items.length ?? 0})</p>
              </div>
              <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                {activeBill?.items.map((item) => (
                  <div key={item.id} className="rounded-[12px] border border-slate-200 bg-slate-50 p-1.5">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-slate-900 truncate flex-1">{item.name}</p>
                      <button type="button" onClick={() => removeItem(item.id)} className="ml-1 text-slate-400 hover:text-slate-600">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                          className="w-5 h-5 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-medium text-slate-900 w-6 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                          className="w-5 h-5 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500">{formatMVR(item.price)} � {item.quantity}</p>
                        <p className="text-xs font-semibold text-slate-900">{formatMVR(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {!activeBill?.items.length && (
                  <p className="text-xs text-slate-500 py-4 text-center">No items</p>
                )}
              </div>
            </div>

            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-2 md:p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold">{formatMVR(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <label className="flex items-center gap-2">
                  <span>Tax</span>
                  <input
                    type="number"
                    value={activeBill?.tax ?? 0}
                    onChange={(e) => {
                      if (!activeBill) return;
                      const next = { ...activeBill, tax: Number(e.target.value) } as Bill;
                      updateBill(next);
                    }}
                    className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 outline-none"
                  />
                  <span>%</span>
                </label>
                <span className="font-semibold">{formatMVR(taxAmount)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-1.5 text-sm font-bold text-slate-900">
                <span>Total</span>
                <span>{formatMVR(payable)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (activeBill && activeBill.items.length > 0) {
                    setShowPaymentModal(true);
                  }
                }}
                disabled={!canSaveCurrentBill}
                className={`flex-1 rounded-[18px] px-3 py-2 text-xs md:text-sm font-semibold text-white shadow-lg transition ${
                  canSaveCurrentBill
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                PAY {formatMVR(payable)}
              </button>
              <button
                type="button"
                onClick={printCurrentBill}
                disabled={!activeBill || !activeBill.items.length}
                className="flex-1 rounded-[18px] px-3 py-2 text-xs md:text-sm font-semibold text-white shadow-lg transition bg-slate-900 hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                Print
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <nav className="sticky bottom-0 z-40 flex items-center gap-1 md:gap-2 border-t border-slate-200 bg-white px-2 md:px-3 py-2 md:py-3 shadow-lg overflow-x-auto">
        <button
          type="button"
          onClick={() => setShowQuickAddModal(true)}
          className="inline-flex h-10 md:h-12 min-w-fit items-center justify-center gap-1.5 rounded-[16px] bg-slate-900 border-2 border-slate-900 px-2 md:px-3 text-xs md:text-sm font-semibold text-white hover:bg-slate-700 flex-shrink-0"
        >
          <GridIcon className="h-4 w-4" />
          Speed Key
        </button>
        <button
          type="button"
          onClick={() => setShowQuickAddModal(true)}
          className="inline-flex h-10 md:h-12 min-w-fit items-center justify-center gap-1.5 rounded-[16px] bg-slate-900 border-2 border-slate-900 px-2 md:px-3 text-xs md:text-sm font-semibold text-white hover:bg-slate-700 flex-shrink-0"
        >
          Quick Add
        </button>
        <button
          type="button"
          className="inline-flex h-10 md:h-12 min-w-fit items-center justify-center gap-1.5 rounded-[16px] bg-slate-900 border-2 border-slate-900 px-2 md:px-3 text-xs md:text-sm font-semibold text-white hover:bg-slate-700 flex-shrink-0"
        >
          Depts
        </button>
        <button
          type="button"
          onClick={() => navigate('/bills/pending')}
          className="inline-flex h-10 md:h-12 min-w-fit items-center justify-center gap-1.5 rounded-[16px] bg-slate-900 border-2 border-slate-900 px-2 md:px-3 text-xs md:text-sm font-semibold text-white hover:bg-slate-700 flex-shrink-0"
        >
          <ShoppingCart className="h-4 w-4" />
          Orders
        </button>
        <button
          type="button"
          className="inline-flex h-10 md:h-12 min-w-fit items-center justify-center gap-1.5 rounded-[16px] bg-slate-900 border-2 border-slate-900 px-2 md:px-3 text-xs md:text-sm font-semibold text-white hover:bg-slate-700 flex-shrink-0"
        >
          Table Orders
        </button>
        <button
          type="button"
          onClick={holdOrder}
          className="inline-flex h-10 md:h-12 min-w-fit items-center justify-center gap-1.5 rounded-[16px] bg-slate-900 border-2 border-slate-900 px-2 md:px-3 text-xs md:text-sm font-semibold text-white hover:bg-slate-700 flex-shrink-0"
        >
          <Pause className="h-4 w-4" />
          Hold
        </button>
        <button
          type="button"
          onClick={() => {
            if (activeBill) {
              setSplitBills([activeBill]);
              setSplitBillOpen(true);
            }
          }}
          disabled={!activeBill || !activeBill.items.length}
          className="inline-flex h-10 md:h-12 min-w-fit items-center justify-center gap-1.5 rounded-[16px] bg-slate-900 border-2 border-slate-900 px-2 md:px-3 text-xs md:text-sm font-semibold text-white hover:bg-slate-700 flex-shrink-0 disabled:bg-slate-300 disabled:border-slate-300 disabled:cursor-not-allowed"
        >
          <Divide className="h-4 w-4" />
          Split Bill
        </button>
        <button
          type="button"
          onClick={printCurrentBill}
          disabled={!activeBill || !activeBill.items.length}
          className="inline-flex h-10 md:h-12 min-w-fit items-center justify-center gap-1.5 rounded-[16px] bg-slate-900 border-2 border-slate-900 px-2 md:px-3 text-xs md:text-sm font-semibold text-white hover:bg-slate-700 flex-shrink-0 disabled:bg-slate-300 disabled:border-slate-300 disabled:cursor-not-allowed"
        >
          <Printer className="h-4 w-4" />
          Print
        </button>
        <button
          type="button"
          onClick={voidBill}
          className="inline-flex h-10 md:h-12 min-w-fit items-center justify-center gap-1.5 rounded-[16px] bg-slate-900 border-2 border-slate-900 px-2 md:px-3 text-xs md:text-sm font-semibold text-white hover:bg-slate-700 flex-shrink-0"
        >
          Void
        </button>
        <button
          type="button"
          onClick={() => {
            if (!activeBill?.items.length) {
              return;
            }
            const updatedBill = { ...activeBill, items: activeBill.items.slice(0, -1) };
            updateBill(updatedBill);
          }}
          className="inline-flex h-10 md:h-12 min-w-fit items-center justify-center gap-1.5 rounded-[16px] bg-slate-900 border-2 border-slate-900 px-2 md:px-3 text-xs md:text-sm font-semibold text-white hover:bg-slate-700 flex-shrink-0"
        >
          No Sales
        </button>
        <button
          type="button"
          onClick={processRefund}
          className="inline-flex h-10 md:h-12 min-w-fit items-center justify-center gap-1.5 rounded-[16px] bg-slate-900 border-2 border-slate-900 px-2 md:px-3 text-xs md:text-sm font-semibold text-white hover:bg-slate-700 flex-shrink-0"
        >
          Refund
        </button>
        <button
          type="button"
          className="inline-flex h-10 md:h-12 min-w-fit items-center justify-center gap-1.5 rounded-[16px] bg-slate-900 border-2 border-slate-900 px-2 md:px-3 text-xs md:text-sm font-semibold text-white hover:bg-slate-700 flex-shrink-0"
        >
          Price Check
        </button>
        <button
          type="button"
          onClick={goBack}
          className="inline-flex h-10 md:h-12 min-w-fit items-center justify-center gap-1.5 rounded-[16px] bg-slate-900 border-2 border-slate-900 px-2 md:px-3 text-xs md:text-sm font-semibold text-white hover:bg-slate-700 flex-shrink-0"
        >
          <ArrowRight className="h-4 w-4" />
          BACK
        </button>
      </nav>

      {/* Payment Method Selection Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="rounded-[20px] bg-white p-4 md:p-6 shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Select Payment Method</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-500 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Convert to Dine-and-Go Option */}
            <div className="mb-4">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (activeBill) {
                    setConvertBillId(activeBill.id);
                    setShowConvertToDineAndGoModal(true);
                    setShowPaymentModal(false);
                  }
                }}
                className="w-full rounded-[16px] border-2 border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition cursor-pointer"
              >
                📋 Convert to Dine-and-Go (Pay Later)
              </button>
            </div>

            <div className="border-t border-slate-200 pt-4 mb-4">
              <p className="text-xs text-slate-500 mb-3">Or select payment method:</p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('cash');
                  setCashGiven('');
                }}
                className={`w-full rounded-[16px] border-2 px-4 py-3 text-sm font-semibold transition ${
                  paymentMethod === 'cash'
                    ? 'border-green-600 bg-green-600 text-white'
                    : 'border-slate-200 bg-white text-slate-900 hover:border-green-600'
                }`}
              >
                💵 Cash
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('card');
                  setCashGiven('');
                }}
                className={`w-full rounded-[16px] border-2 px-4 py-3 text-sm font-semibold transition ${
                  paymentMethod === 'card'
                    ? 'border-green-600 bg-green-600 text-white'
                    : 'border-slate-200 bg-white text-slate-900 hover:border-green-600'
                }`}
              >
                💳 Card
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('transfer');
                  setCashGiven('');
                }}
                className={`w-full rounded-[16px] border-2 px-4 py-3 text-sm font-semibold transition ${
                  paymentMethod === 'transfer'
                    ? 'border-green-600 bg-green-600 text-white'
                    : 'border-slate-200 bg-white text-slate-900 hover:border-green-600'
                }`}
              >
                📱 Bank Transfer
              </button>
              {activeBill?.dineAndGoCustomerId && (
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('dineandgo');
                    setCashGiven('');
                  }}
                  className={`w-full rounded-[16px] border-2 px-4 py-3 text-sm font-semibold transition ${
                    paymentMethod === 'dineandgo'
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-200 bg-white text-slate-900 hover:border-blue-600'
                  }`}
                >
                  📋 Dine-and-Go Payment
                </button>
              )}
            </div>

            {paymentMethod === 'cash' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Amount Given (MVR)
                </label>
                <input
                  type="number"
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value)}
                  placeholder="Enter amount given by customer"
                  className="w-full rounded-[16px] border-2 border-slate-200 px-3 py-2 text-sm focus:border-green-600 focus:outline-none"
                />
                {cashGiven && Number(cashGiven) >= payable && (
                  <div className="mt-2 text-sm font-semibold text-green-600">
                    Change: {formatMVR(Number(cashGiven) - payable)}
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 rounded-[16px] bg-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!paymentMethod) {
                    return;
                  }
                  if (paymentMethod === 'cash') {
                    if (!cashGiven || Number(cashGiven) < payable) {
                      return;
                    }
                    // Process cash payment - save bill with cash payment method
                    if (activeBill) {
                      const updatedBill: Bill = {
                        ...activeBill,
                        status: 'Served',
                        paymentStatus: 'Paid',
                        paymentMethod: 'Cash',
                        cashGiven: Number(cashGiven),
                        change: Number(cashGiven) - payable,
                      };
                      updateBill(updatedBill);
                      setShowPaymentModal(false);
                      setPaymentMethod(null);
                      setCashGiven('');
                    }
                  } else if (paymentMethod === 'dineandgo') {
                    // Process dine-and-go payment
                    if (activeBill && activeBill.dineAndGoCustomerId) {
                      const customer = dineAndGoCustomers.find(c => c.id === activeBill.dineAndGoCustomerId);
                      if (customer) {
                        const newBalance = Math.max(0, (customer.runningTotal ?? 0) - payable);
                        const updated: DineAndGoCustomer = {
                          id: customer.id,
                          ...(customer.name ? { name: customer.name } : {}),
                          ...(customer.table ? { table: customer.table } : {}),
                          ...(customer.company ? { company: customer.company } : {}),
                          runningTotal: newBalance,
                          lastPaymentDate: new Date().toISOString().split('T')[0],
                          payments: [...(customer.payments || []), {
                            id: `payment-${Date.now()}`,
                            date: new Date().toISOString().split('T')[0],
                            amount: payable,
                            paymentType: 'partial',
                            notes: `Bill payment - ${activeBill.billNumber}`
                          }],
                          ...(customer.createdAt ? { createdAt: customer.createdAt } : {}),
                        };
                        
                        setDineAndGoCustomers((cur) => cur.map((c) => (c.id === activeBill.dineAndGoCustomerId ? updated : c)));
                        
                        if (hasFirebaseConfig) {
                          try {
                            await saveDineAndGoCustomer(activeBill.dineAndGoCustomerId, updated);
                          } catch (error) {
                            console.error('Failed to process dine-and-go payment:', error);
                          }
                        }

                        const updatedBill: Bill = {
                          ...activeBill,
                          status: 'Served',
                          paymentStatus: 'Paid',
                          paymentMethod: 'Dine-and-Go',
                        };
                        updateBill(updatedBill);
                        setShowPaymentModal(false);
                        setPaymentMethod(null);
                        setCashGiven('');
                      }
                    }
                  } else {
                    // Process card or transfer payment
                    if (activeBill) {
                      const updatedBill: Bill = {
                        ...activeBill,
                        status: 'Served',
                        paymentStatus: 'Paid',
                        paymentMethod: paymentMethod === 'card' ? 'Card' : 'Bank transfer',
                      };
                      updateBill(updatedBill);
                      setShowPaymentModal(false);
                      setPaymentMethod(null);
                      setCashGiven('');
                    }
                  }
                }}
                disabled={!paymentMethod || (paymentMethod === 'cash' && (!cashGiven || Number(cashGiven) < payable))}
                className="flex-1 rounded-[16px] bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Dine-and-Go Modal */}
      {showConvertToDineAndGoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="rounded-[20px] bg-white p-4 md:p-6 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Convert to Dine-and-Go</h3>
              <button onClick={() => {
                setShowConvertToDineAndGoModal(false);
                setConvertBillId('');
                setNewDineAndGoName('');
                setNewDineAndGoTable('');
                setNewDineAndGoCompany('');
              }} className="text-slate-500 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            {(() => {
              const bill = bills.find(b => b.id === convertBillId);
              const billTotal = bill ? bill.items.reduce((sum, item) => sum + item.price * item.quantity, 0) : 0;
              return (
                <>
                  <div className="bg-slate-50 rounded-xl p-3 mb-4">
                    <p className="text-xs text-slate-500">Bill Amount</p>
                    <p className="text-2xl font-bold text-slate-900">{formatMVR(billTotal)}</p>
                  </div>

                  {/* Existing Customers */}
                  {dineAndGoCustomers.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Select Existing Customer
                      </label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {dineAndGoCustomers.map((customer) => (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={async () => {
                              if (!bill || !customer.id) return;

                              const updated: DineAndGoCustomer = {
                                id: customer.id,
                                ...(customer.name ? { name: customer.name } : {}),
                                ...(customer.table ? { table: customer.table } : {}),
                                ...(customer.company ? { company: customer.company } : {}),
                                runningTotal: (customer.runningTotal ?? 0) + billTotal,
                                ...(customer.lastPaymentDate ? { lastPaymentDate: customer.lastPaymentDate } : {}),
                                ...(customer.payments ? { payments: customer.payments } : {}),
                                ...(customer.createdAt ? { createdAt: customer.createdAt } : {}),
                              };

                              setDineAndGoCustomers((cur) => cur.map((c) => (c.id === customer.id ? updated : c)));

                              if (hasFirebaseConfig) {
                                try {
                                  await saveDineAndGoCustomer(customer.id, updated);
                                } catch (error) {
                                  console.error('Failed to charge dine-and-go customer:', error);
                                }
                              }

                              // Mark bill as served but unpaid
                              const updatedBill: Bill = {
                                ...bill,
                                status: 'Served',
                                paymentStatus: 'Unpaid',
                                dineAndGoCustomerId: customer.id,
                              };
                              updateBill(updatedBill);

                              setShowConvertToDineAndGoModal(false);
                              setConvertBillId('');
                            }}
                            className="w-full rounded-[16px] border-2 border-slate-200 bg-white px-4 py-3 text-left hover:border-green-600 hover:bg-green-50 transition"
                          >
                            <p className="text-sm font-semibold text-slate-900">{customer.name || 'Unnamed'}</p>
                            <p className="text-xs text-slate-500">{customer.table || 'No Table'} - {customer.company || 'No Company'}</p>
                            <p className="text-xs text-slate-600 mt-1">Current Balance: {formatMVR(customer.runningTotal ?? 0)}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-4 mb-4">
                    <p className="text-xs text-slate-500 mb-3">Or create new customer:</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        value={newDineAndGoName}
                        onChange={(e) => setNewDineAndGoName(e.target.value)}
                        placeholder="Enter customer name"
                        className="w-full rounded-[16px] border-2 border-slate-200 px-3 py-2 text-sm focus:border-green-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Table (Optional)
                      </label>
                      <input
                        type="text"
                        value={newDineAndGoTable}
                        onChange={(e) => setNewDineAndGoTable(e.target.value)}
                        placeholder="Table number"
                        className="w-full rounded-[16px] border-2 border-slate-200 px-3 py-2 text-sm focus:border-green-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Company (Optional)
                      </label>
                      <input
                        type="text"
                        value={newDineAndGoCompany}
                        onChange={(e) => setNewDineAndGoCompany(e.target.value)}
                        placeholder="Company name"
                        className="w-full rounded-[16px] border-2 border-slate-200 px-3 py-2 text-sm focus:border-green-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowConvertToDineAndGoModal(false);
                        setConvertBillId('');
                        setNewDineAndGoName('');
                        setNewDineAndGoTable('');
                        setNewDineAndGoCompany('');
                      }}
                      className="flex-1 rounded-[16px] bg-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newDineAndGoName || !bill) return;

                        const newCustomer: DineAndGoCustomer = {
                          id: `dineandgo-${Date.now()}`,
                          name: newDineAndGoName,
                          ...(newDineAndGoTable ? { table: newDineAndGoTable } : { table: bill.table }),
                          ...(newDineAndGoCompany ? { company: newDineAndGoCompany } : {}),
                          runningTotal: billTotal,
                          lastPaymentDate: '',
                          payments: [],
                          createdAt: new Date().toISOString(),
                        };

                        setDineAndGoCustomers((cur) => [newCustomer, ...cur]);

                        if (hasFirebaseConfig) {
                          try {
                            if (newCustomer.id) {
                              await saveDineAndGoCustomer(newCustomer.id, newCustomer);
                            }
                          } catch (error) {
                            console.error('Failed to save dine-and-go customer:', error);
                          }
                        }

                        // Mark bill as served but unpaid
                        const updatedBill: Bill = {
                          ...bill,
                          status: 'Served',
                          paymentStatus: 'Unpaid',
                          dineAndGoCustomerId: newCustomer.id,
                        };
                        updateBill(updatedBill);

                        setShowConvertToDineAndGoModal(false);
                        setConvertBillId('');
                        setNewDineAndGoName('');
                        setNewDineAndGoTable('');
                        setNewDineAndGoCompany('');
                      }}
                      disabled={!newDineAndGoName}
                      className="flex-1 rounded-[16px] bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                      Create & Charge
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </AppShell>
  );
}
