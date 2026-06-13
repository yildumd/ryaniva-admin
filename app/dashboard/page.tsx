'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setAuthToken } from '@/lib/api';
import { Analytics, Order, Rider } from '@/lib/types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Package, Users, Bike, TrendingUp, LogOut, RefreshCw,
  CheckCircle, Clock, MapPin, Phone, Star,
  ChevronRight, Menu, LayoutDashboard, ShoppingBag,
  Wallet, Settings, Headphones, BarChart2, CreditCard,
  Download, Search, ArrowUpRight, AlertCircle, FileText
} from 'lucide-react';

const BLUE = '#1A3A8F';
const ORANGE = '#E85C1A';
const DARK_BLUE = '#0D2260';

const statusColors: Record<string, string> = {
  REQUESTED: '#F59E0B',
  ACCEPTED: '#1A3A8F',
  PICKED: '#E85C1A',
  DELIVERED: '#10B981',
  CANCELLED: '#EF4444',
};

const navItems = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'riders', label: 'Riders', icon: Bike },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'earnings', label: 'Earnings', icon: Wallet },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'reports', label: 'Reports', icon: BarChart2 },
  { id: 'support', label: 'Support', icon: Headphones },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function DateRangePicker({ fromDate, toDate, onFromChange, onToChange, onClear }: {
  fromDate: string; toDate: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-500 font-medium">From:</label>
        <input type="date" value={fromDate} onChange={e => onFromChange(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2"
          style={{ '--tw-ring-color': BLUE } as any} />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-500 font-medium">To:</label>
        <input type="date" value={toDate} onChange={e => onToChange(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2"
          style={{ '--tw-ring-color': BLUE } as any} />
      </div>
      {(fromDate || toDate) && (
        <button onClick={onClear}
          className="text-xs text-gray-400 hover:text-red-500 underline transition-colors">
          Clear
        </button>
      )}
      {fromDate && toDate && (
        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg font-medium">
          Filter active
        </span>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [orderFilter, setOrderFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Date range states
  const [earningsFrom, setEarningsFrom] = useState('');
  const [earningsTo, setEarningsTo] = useState('');
  const [reportsFrom, setReportsFrom] = useState('');
  const [reportsTo, setReportsTo] = useState('');
  const [paymentsFrom, setPaymentsFrom] = useState('');
  const [paymentsTo, setPaymentsTo] = useState('');

  // Payment tab state
  const [paymentTab, setPaymentTab] = useState<'all' | 'cod' | 'card' | 'disputes' | 'failed'>('all');

  useEffect(() => {
    const token = localStorage.getItem('ryaniva_token');
    const userData = localStorage.getItem('ryaniva_user');
    if (!token) { router.push('/login'); return; }
    setAuthToken(token);
    if (userData) setUser(JSON.parse(userData));
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [analyticsRes, ordersRes, ridersRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/orders'),
        api.get('/admin/riders'),
      ]);
      setAnalytics(analyticsRes.data);
      setOrders(ordersRes.data);
      setRiders(ridersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const approveRider = async (riderId: string) => {
    await api.patch(`/admin/riders/${riderId}/approve`);
    loadAll();
  };

  const suspendRider = async (riderId: string) => {
    await api.patch(`/admin/riders/${riderId}/suspend`);
    loadAll();
  };

  const logout = () => { localStorage.clear(); router.push('/login'); };

  const filterByDateRange = (items: Order[], from: string, to: string) => {
    if (!from && !to) return items;
    return items.filter(o => {
      const date = new Date(o.createdAt);
      const fromDate = from ? new Date(from) : null;
      const toDate = to ? new Date(to + 'T23:59:59') : null;
      if (fromDate && date < fromDate) return false;
      if (toDate && date > toDate) return false;
      return true;
    });
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const keys = Object.keys(data[0]);
    const csv = [
      keys.join(','),
      ...data.map(row => keys.map(k => `"${row[k] || ''}"`).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredOrders = orders.filter(o => {
    const matchesFilter = orderFilter === 'ALL' || o.status === orderFilter;
    const matchesSearch = searchQuery === '' ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.pickupAddress.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const earningsOrders = filterByDateRange(
    orders.filter(o => o.status === 'DELIVERED'),
    earningsFrom, earningsTo
  );

  const paymentsOrders = filterByDateRange(orders, paymentsFrom, paymentsTo);

  const filteredPayments = paymentsOrders.filter(o => {
    if (paymentTab === 'all') return true;
    if (paymentTab === 'cod') return o.paymentMethod === 'CASH';
    if (paymentTab === 'card') return o.paymentMethod === 'CARD';
    if (paymentTab === 'failed') return o.paymentStatus === 'FAILED';
    if (paymentTab === 'disputes') return o.paymentStatus === 'FAILED' && o.paymentMethod === 'CARD';
    return true;
  });

  const earningsTotal = earningsOrders.reduce((sum, o) => sum + o.price, 0);
  const earningsPlatform = Math.round(earningsTotal * 0.1);
  const earningsRider = earningsTotal - earningsPlatform;

  const pieData = analytics ? [
    { name: 'Delivered', value: analytics.orders.completed, color: '#10B981' },
    { name: 'Active', value: analytics.orders.active, color: ORANGE },
    { name: 'Cancelled', value: analytics.orders.cancelled, color: '#EF4444' },
  ] : [];

  const topRiders = [...riders]
    .filter(r => r.status === 'APPROVED')
    .sort((a, b) => b.totalTrips - a.totalTrips)
    .slice(0, 5);

  const totalRevenue = analytics?.revenue.totalDeliveryValue || 0;
  const platformEarnings = analytics?.revenue.platformEarnings || 0;

  const weeklyData = [
    { day: 'Mon', orders: 12, revenue: 24000 },
    { day: 'Tue', orders: 19, revenue: 38000 },
    { day: 'Wed', orders: 8, revenue: 16000 },
    { day: 'Thu', orders: 24, revenue: 48000 },
    { day: 'Fri', orders: 31, revenue: 62000 },
    { day: 'Sat', orders: 28, revenue: 56000 },
    { day: 'Sun', orders: 15, revenue: 30000 },
  ];

  const inputClass = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 placeholder-gray-400";

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-60' : 'w-16'} transition-all duration-300 flex flex-col text-white flex-shrink-0`}
        style={{ background: DARK_BLUE }}>
        <div className="flex items-center gap-3 p-4 border-b border-white/10 h-16">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: ORANGE }}>
            <span className="text-white font-bold text-sm">R</span>
          </div>
          {sidebarOpen && (
            <div>
              <div className="font-bold text-sm tracking-wider">RYANIVA</div>
              <div className="text-white/40 text-xs">Business Services</div>
            </div>
          )}
        </div>

        {sidebarOpen && (
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ background: ORANGE }}>
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div>
                <div className="text-sm font-semibold">{user?.name || 'Admin'}</div>
                <div className="text-white/40 text-xs">Super Admin</div>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 p-2 space-y-0.5 mt-1 overflow-y-auto">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                activeTab === item.id ? 'text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
              style={activeTab === item.id ? { background: BLUE } : {}}>
              <item.icon size={17} className="flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-2 border-t border-white/10">
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 text-sm transition-all">
            <LogOut size={17} className="flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b px-6 h-16 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-gray-600">
              <Menu size={20} />
            </button>
            <div>
              <h1 className="font-bold text-gray-800">{navItems.find(n => n.id === activeTab)?.label}</h1>
              <p className="text-xs text-gray-400">Ryaniva Admin Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadAll}
              className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600">
              <RefreshCw size={13} /> Refresh
            </button>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: BLUE }}>
              {user?.name?.charAt(0) || 'A'}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-3"
                  style={{ borderColor: BLUE, borderTopColor: 'transparent' }} />
                <p className="text-gray-500 text-sm">Loading Ryaniva data...</p>
              </div>
            </div>
          ) : (
            <>
              {/* ── OVERVIEW ── */}
              {activeTab === 'overview' && analytics && (
                <div className="space-y-5">
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: 'Total Orders', value: analytics.orders.total, icon: Package, color: BLUE, sub: 'All time' },
                      { label: 'Delivered', value: analytics.orders.completed, icon: CheckCircle, color: '#10B981', sub: `${analytics.orders.total > 0 ? Math.round((analytics.orders.completed / analytics.orders.total) * 100) : 0}% completion rate` },
                      { label: 'Active Orders', value: analytics.orders.active, icon: Clock, color: ORANGE, sub: 'In progress' },
                      { label: 'Platform Earnings', value: `₦${platformEarnings.toLocaleString()}`, icon: TrendingUp, color: BLUE, sub: `Total value: ₦${totalRevenue.toLocaleString()}` },
                    ].map((stat, i) => (
                      <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">{stat.label}</span>
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: `${stat.color}15` }}>
                            <stat.icon size={17} style={{ color: stat.color }} />
                          </div>
                        </div>
                        <div className="text-2xl font-bold mb-1" style={{ color: DARK_BLUE }}>{stat.value}</div>
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                          <ArrowUpRight size={11} className="text-green-500" />
                          {stat.sub}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-700">Weekly Orders & Revenue</h3>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">This Week</span>
                      </div>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={weeklyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                          <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                          <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                          <Tooltip formatter={(val, name) => [name === 'revenue' ? `₦${Number(val).toLocaleString()}` : val, name === 'revenue' ? 'Revenue' : 'Orders']} />
                          <Bar dataKey="orders" fill={BLUE} radius={[4, 4, 0, 0]} name="orders" />
                          <Bar dataKey="revenue" fill={ORANGE} radius={[4, 4, 0, 0]} name="revenue" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                      <h3 className="font-semibold text-gray-700 mb-4">Order Status</h3>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                            {pieData.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                            ))}
                          </Pie>
                          <Legend iconSize={10} iconType="circle" />
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
                      <div className="p-4 border-b flex items-center justify-between">
                        <h3 className="font-semibold text-gray-700">Recent Orders</h3>
                        <button onClick={() => setActiveTab('orders')}
                          className="text-xs flex items-center gap-1 font-medium" style={{ color: BLUE }}>
                          View all <ChevronRight size={12} />
                        </button>
                      </div>
                      <div className="divide-y">
                        {orders.slice(0, 5).map(order => (
                          <div key={order.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ background: `${statusColors[order.status]}15` }}>
                                <Package size={13} style={{ color: statusColors[order.status] }} />
                              </div>
                              <div>
                                <div className="font-semibold text-xs text-gray-800">#{order.id.substring(0, 8).toUpperCase()}</div>
                                <div className="text-xs text-gray-400">{order.customer?.name || 'Customer'}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-0.5 rounded-full text-white"
                                style={{ background: statusColors[order.status] }}>
                                {order.status}
                              </span>
                              <span className="font-bold text-sm" style={{ color: ORANGE }}>
                                ₦{order.price.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                        {orders.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">No orders yet</div>}
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                      <div className="p-4 border-b flex items-center justify-between">
                        <h3 className="font-semibold text-gray-700">Top Riders</h3>
                        <button onClick={() => setActiveTab('riders')}
                          className="text-xs flex items-center gap-1 font-medium" style={{ color: BLUE }}>
                          View all <ChevronRight size={12} />
                        </button>
                      </div>
                      <div className="divide-y">
                        {topRiders.length === 0 ? (
                          <div className="p-8 text-center text-gray-400 text-sm">No approved riders yet</div>
                        ) : topRiders.map((rider, i) => (
                          <div key={rider.id} className="px-4 py-3 flex items-center gap-3">
                            <div className="text-xs font-bold text-gray-400 w-4">{i + 1}</div>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                              style={{ background: BLUE }}>
                              {rider.user.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-800 truncate">{rider.user.name}</div>
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <span className="flex items-center gap-0.5">
                                  <Star size={10} className="text-yellow-400" fill="currentColor" /> {rider.rating}
                                </span>
                                <span>{rider.totalTrips} trips</span>
                              </div>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${rider.isOnline ? 'bg-green-400' : 'bg-gray-300'}`} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Total Customers', value: analytics.users.customers, icon: Users, color: '#8B5CF6' },
                      { label: 'Active Riders', value: analytics.users.approvedRiders, icon: Bike, color: BLUE },
                      { label: 'Pending Approval', value: analytics.users.pendingRiders, icon: Clock, color: ORANGE },
                    ].map((stat, i) => (
                      <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `${stat.color}15` }}>
                          <stat.icon size={20} style={{ color: stat.color }} />
                        </div>
                        <div>
                          <div className="text-xl font-bold" style={{ color: DARK_BLUE }}>{stat.value}</div>
                          <div className="text-gray-500 text-xs">{stat.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── ORDERS ── */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 flex-wrap">
                    <div className="relative flex-1 min-w-48">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" placeholder="Search by order ID, customer name..."
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none placeholder-gray-400" />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {['ALL', 'REQUESTED', 'ACCEPTED', 'PICKED', 'DELIVERED', 'CANCELLED'].map(f => (
                        <button key={f} onClick={() => setOrderFilter(f)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            orderFilter === f ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          style={orderFilter === f ? { background: f === 'ALL' ? BLUE : statusColors[f] || BLUE } : {}}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b flex items-center justify-between">
                      <h3 className="font-semibold text-gray-700">{filteredOrders.length} Orders</h3>
                      <button onClick={() => exportToCSV(filteredOrders.map(o => ({
                        ID: o.id.substring(0, 8).toUpperCase(),
                        Customer: o.customer?.name || '',
                        Phone: o.customer?.phone || '',
                        Pickup: o.pickupAddress,
                        Dropoff: o.dropoffAddress,
                        Distance: `${o.distanceKm}km`,
                        Amount: `₦${o.price}`,
                        Payment: o.paymentMethod,
                        Status: o.status,
                        Date: new Date(o.createdAt).toLocaleDateString(),
                      })), 'ryaniva-orders')}
                        className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                        <Download size={13} /> Export CSV
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                            <th className="px-4 py-3 text-left">Order ID</th>
                            <th className="px-4 py-3 text-left">Customer</th>
                            <th className="px-4 py-3 text-left">Pickup</th>
                            <th className="px-4 py-3 text-left">Dropoff</th>
                            <th className="px-4 py-3 text-left">Dist.</th>
                            <th className="px-4 py-3 text-left">Payment</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {filteredOrders.map(order => (
                            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3">
                                <span className="font-mono text-xs font-semibold text-gray-700">
                                  #{order.id.substring(0, 8).toUpperCase()}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm font-medium text-gray-800">{order.customer?.name || 'N/A'}</div>
                                <div className="text-xs text-gray-400">{order.customer?.phone}</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1 text-xs text-gray-600 max-w-32 truncate">
                                  <MapPin size={10} style={{ color: BLUE, flexShrink: 0 }} />
                                  {order.pickupAddress}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1 text-xs text-gray-600 max-w-32 truncate">
                                  <MapPin size={10} style={{ color: ORANGE, flexShrink: 0 }} />
                                  {order.dropoffAddress}
                                </div>
                              </td>
                              <td className="px-4 py-3"><span className="text-xs text-gray-500">{order.distanceKm} km</span></td>
                              <td className="px-4 py-3">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  order.paymentMethod === 'CARD' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                }`}>{order.paymentMethod}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                                  style={{ background: statusColors[order.status] }}>{order.status}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-bold text-sm" style={{ color: ORANGE }}>₦{order.price.toLocaleString()}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {filteredOrders.length === 0 && <div className="p-12 text-center text-gray-400 text-sm">No orders found</div>}
                    </div>
                  </div>
                </div>
              )}

              {/* ── RIDERS ── */}
              {activeTab === 'riders' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 mb-2">
                    {[
                      { label: 'Total Riders', value: riders.length, color: BLUE },
                      { label: 'Approved', value: riders.filter(r => r.status === 'APPROVED').length, color: '#10B981' },
                      { label: 'Pending Approval', value: riders.filter(r => r.status === 'PENDING').length, color: ORANGE },
                    ].map((s, i) => (
                      <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                        <div className="text-gray-500 text-sm mt-1">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {riders.map(rider => (
                      <div key={rider.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                              style={{ background: BLUE }}>{rider.user.name.charAt(0)}</div>
                            <div>
                              <div className="font-semibold text-gray-800">{rider.user.name}</div>
                              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                <span className="flex items-center gap-1"><Phone size={12} /> {rider.user.phone}</span>
                                <span className="flex items-center gap-1"><Bike size={12} /> {rider.vehicle}</span>
                                <span className="flex items-center gap-1"><Star size={12} className="text-yellow-400" fill="currentColor" /> {rider.rating}</span>
                                <span className="flex items-center gap-1"><Package size={12} /> {rider.totalTrips} trips</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${rider.isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${rider.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                              {rider.isOnline ? 'Online' : 'Offline'}
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              rider.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                              rider.status === 'SUSPENDED' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                            }`}>{rider.status}</span>
                            <div className="flex gap-2">
                              {rider.status !== 'APPROVED' && (
                                <button onClick={() => approveRider(rider.id)}
                                  className="px-4 py-1.5 rounded-lg text-white text-xs font-semibold hover:opacity-90"
                                  style={{ background: '#10B981' }}>✓ Approve</button>
                              )}
                              {rider.status !== 'SUSPENDED' && (
                                <button onClick={() => suspendRider(rider.id)}
                                  className="px-4 py-1.5 rounded-lg text-white text-xs font-semibold bg-red-500 hover:bg-red-600">
                                  Suspend
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {riders.length === 0 && (
                      <div className="bg-white rounded-xl p-16 text-center shadow-sm border">
                        <Bike size={48} className="mx-auto mb-3 text-gray-200" />
                        <p className="text-gray-400">No riders registered yet</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── EARNINGS ── */}
              {activeTab === 'earnings' && analytics && (
                <div className="space-y-4">
                  <DateRangePicker
                    fromDate={earningsFrom} toDate={earningsTo}
                    onFromChange={setEarningsFrom} onToChange={setEarningsTo}
                    onClear={() => { setEarningsFrom(''); setEarningsTo(''); }}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: earningsFrom || earningsTo ? 'Filtered Delivery Value' : 'Total Delivery Value', value: `₦${earningsTotal.toLocaleString()}`, color: BLUE },
                      { label: 'Platform Earnings (10%)', value: `₦${earningsPlatform.toLocaleString()}`, color: '#10B981' },
                      { label: 'Rider Payouts (90%)', value: `₦${earningsRider.toLocaleString()}`, color: ORANGE },
                    ].map((s, i) => (
                      <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                        <div className="text-2xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
                        <div className="text-gray-500 text-sm">{s.label}</div>
                        {(earningsFrom || earningsTo) && i === 0 && (
                          <div className="text-xs text-blue-500 mt-1">
                            {earningsOrders.length} completed orders in range
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-700">Revenue Breakdown</h3>
                      <button onClick={() => exportToCSV(earningsOrders.map(o => ({
                        ID: o.id.substring(0, 8).toUpperCase(),
                        Customer: o.customer?.name || '',
                        Amount: o.price,
                        Platform: Math.round(o.price * 0.1),
                        Rider: Math.round(o.price * 0.9),
                        Date: new Date(o.createdAt).toLocaleDateString(),
                      })), 'ryaniva-earnings')}
                        className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                        <Download size={13} /> Export CSV
                      </button>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                        <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6B7280' }} />
                        <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                        <Tooltip formatter={(val) => `₦${Number(val).toLocaleString()}`} />
                        <Bar dataKey="revenue" fill={BLUE} radius={[6, 6, 0, 0]} name="Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {earningsOrders.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="p-4 border-b">
                        <h3 className="font-semibold text-gray-700">
                          Earnings Detail {earningsFrom || earningsTo ? `(Filtered: ${earningsOrders.length} orders)` : ''}
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                              <th className="px-4 py-3 text-left">Order ID</th>
                              <th className="px-4 py-3 text-left">Customer</th>
                              <th className="px-4 py-3 text-left">Total</th>
                              <th className="px-4 py-3 text-left">Platform (10%)</th>
                              <th className="px-4 py-3 text-left">Rider (90%)</th>
                              <th className="px-4 py-3 text-left">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {earningsOrders.map(order => (
                              <tr key={order.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">
                                  #{order.id.substring(0, 8).toUpperCase()}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">{order.customer?.name}</td>
                                <td className="px-4 py-3 font-bold text-sm" style={{ color: DARK_BLUE }}>₦{order.price.toLocaleString()}</td>
                                <td className="px-4 py-3 font-semibold text-sm text-green-600">₦{Math.round(order.price * 0.1).toLocaleString()}</td>
                                <td className="px-4 py-3 font-semibold text-sm" style={{ color: ORANGE }}>₦{Math.round(order.price * 0.9).toLocaleString()}</td>
                                <td className="px-4 py-3 text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── PAYMENTS ── */}
              {activeTab === 'payments' && (
                <div className="space-y-4">
                  <DateRangePicker
                    fromDate={paymentsFrom} toDate={paymentsTo}
                    onFromChange={setPaymentsFrom} onToChange={setPaymentsTo}
                    onClear={() => { setPaymentsFrom(''); setPaymentsTo(''); }}
                  />

                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: 'Total Transactions', value: paymentsOrders.length, color: BLUE },
                      { label: 'Cash (COD)', value: paymentsOrders.filter(o => o.paymentMethod === 'CASH').length, color: '#10B981' },
                      { label: 'Card (Flutterwave)', value: paymentsOrders.filter(o => o.paymentMethod === 'CARD').length, color: ORANGE },
                      { label: 'Failed / Disputes', value: paymentsOrders.filter(o => o.paymentStatus === 'FAILED').length, color: '#EF4444' },
                    ].map((s, i) => (
                      <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="text-2xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
                        <div className="text-gray-500 text-xs">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Payment sub-tabs */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="border-b flex">
                      {[
                        { id: 'all', label: 'All Transactions' },
                        { id: 'cod', label: 'COD Reconciliation' },
                        { id: 'card', label: 'Card Payments' },
                        { id: 'disputes', label: 'Disputes' },
                        { id: 'failed', label: 'Failed' },
                      ].map(tab => (
                        <button key={tab.id}
                          onClick={() => setPaymentTab(tab.id as any)}
                          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                            paymentTab === tab.id
                              ? 'border-blue-600 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                          style={paymentTab === tab.id ? { borderBottomColor: BLUE, color: BLUE } : {}}>
                          {tab.label}
                          {tab.id === 'failed' && paymentsOrders.filter(o => o.paymentStatus === 'FAILED').length > 0 && (
                            <span className="ml-1.5 bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full">
                              {paymentsOrders.filter(o => o.paymentStatus === 'FAILED').length}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    {paymentTab === 'cod' && (
                      <div className="p-4">
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          {[
                            { label: 'COD Orders', value: paymentsOrders.filter(o => o.paymentMethod === 'CASH').length, color: BLUE },
                            { label: 'COD Collected', value: `₦${paymentsOrders.filter(o => o.paymentMethod === 'CASH' && o.paymentStatus === 'PAID').reduce((s, o) => s + o.price, 0).toLocaleString()}`, color: '#10B981' },
                            { label: 'COD Pending', value: `₦${paymentsOrders.filter(o => o.paymentMethod === 'CASH' && o.paymentStatus === 'PENDING').reduce((s, o) => s + o.price, 0).toLocaleString()}`, color: ORANGE },
                          ].map((s, i) => (
                            <div key={i} className="bg-gray-50 rounded-xl p-4 border">
                              <div className="text-xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
                              <div className="text-gray-500 text-xs">{s.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {paymentTab === 'disputes' && (
                      <div className="p-6 text-center">
                        <AlertCircle size={40} className="mx-auto mb-3 text-red-300" />
                        <p className="text-gray-500 text-sm font-medium">Payment Disputes</p>
                        <p className="text-gray-400 text-xs mt-1">
                          {paymentsOrders.filter(o => o.paymentStatus === 'FAILED' && o.paymentMethod === 'CARD').length === 0
                            ? 'No disputes at the moment. All card payments are resolved.'
                            : `${paymentsOrders.filter(o => o.paymentStatus === 'FAILED' && o.paymentMethod === 'CARD').length} dispute(s) require attention`}
                        </p>
                      </div>
                    )}

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                            <th className="px-4 py-3 text-left">Order ID</th>
                            <th className="px-4 py-3 text-left">Customer</th>
                            <th className="px-4 py-3 text-left">Method</th>
                            <th className="px-4 py-3 text-left">Amount</th>
                            <th className="px-4 py-3 text-left">Pay Status</th>
                            <th className="px-4 py-3 text-left">Order Status</th>
                            <th className="px-4 py-3 text-left">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {filteredPayments.map(order => (
                            <tr key={order.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">
                                #{order.id.substring(0, 8).toUpperCase()}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">{order.customer?.name}</td>
                              <td className="px-4 py-3">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  order.paymentMethod === 'CARD' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                }`}>{order.paymentMethod === 'CARD' ? '💳 Card' : '💵 Cash'}</span>
                              </td>
                              <td className="px-4 py-3 font-bold text-sm" style={{ color: ORANGE }}>
                                ₦{order.price.toLocaleString()}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' :
                                  order.paymentStatus === 'FAILED' ? 'bg-red-100 text-red-700' :
                                  'bg-orange-100 text-orange-700'
                                }`}>{order.paymentStatus}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs px-2 py-0.5 rounded-full text-white"
                                  style={{ background: statusColors[order.status] }}>{order.status}</span>
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-400">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {filteredPayments.length === 0 && (
                        <div className="p-12 text-center text-gray-400 text-sm">No transactions found</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── REPORTS ── */}
              {activeTab === 'reports' && (
                <div className="space-y-4">
                  <DateRangePicker
                    fromDate={reportsFrom} toDate={reportsTo}
                    onFromChange={setReportsFrom} onToChange={setReportsTo}
                    onClear={() => { setReportsFrom(''); setReportsTo(''); }}
                  />

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-700 mb-1">Generate Reports</h3>
                    <p className="text-gray-400 text-sm mb-6">
                      {reportsFrom || reportsTo
                        ? `Filtered: ${reportsFrom || 'start'} → ${reportsTo || 'now'}`
                        : 'Select a date range above to filter reports, or export all data'}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        {
                          title: 'Orders Report', desc: 'All orders with status, pricing, customer info',
                          icon: ShoppingBag,
                          data: () => filterByDateRange(orders, reportsFrom, reportsTo).map(o => ({
                            ID: o.id.substring(0, 8).toUpperCase(),
                            Customer: o.customer?.name || '',
                            Phone: o.customer?.phone || '',
                            Pickup: o.pickupAddress,
                            Dropoff: o.dropoffAddress,
                            Distance_KM: o.distanceKm,
                            Amount_NGN: o.price,
                            Payment: o.paymentMethod,
                            PayStatus: o.paymentStatus,
                            Status: o.status,
                            Date: new Date(o.createdAt).toLocaleDateString(),
                          })),
                          filename: 'ryaniva-orders-report',
                        },
                        {
                          title: 'Revenue Report', desc: 'Platform earnings, delivery values, rider payouts',
                          icon: TrendingUp,
                          data: () => filterByDateRange(orders.filter(o => o.status === 'DELIVERED'), reportsFrom, reportsTo).map(o => ({
                            ID: o.id.substring(0, 8).toUpperCase(),
                            Customer: o.customer?.name || '',
                            Total_NGN: o.price,
                            Platform_10pct: Math.round(o.price * 0.1),
                            Rider_90pct: Math.round(o.price * 0.9),
                            Payment: o.paymentMethod,
                            Date: new Date(o.createdAt).toLocaleDateString(),
                          })),
                          filename: 'ryaniva-revenue-report',
                        },
                        {
                          title: 'Riders Report', desc: 'Rider performance, ratings, trip counts, status',
                          icon: Bike,
                          data: () => riders.map(r => ({
                            Name: r.user.name,
                            Phone: r.user.phone,
                            Vehicle: r.vehicle,
                            Status: r.status,
                            Rating: r.rating,
                            Total_Trips: r.totalTrips,
                            Online: r.isOnline ? 'Yes' : 'No',
                            Joined: r.user.createdAt ? new Date(r.user.createdAt).toLocaleDateString() : '',
                          })),
                          filename: 'ryaniva-riders-report',
                        },
                        {
                          title: 'Payments Report', desc: 'All transactions, COD, card payments, failed',
                          icon: CreditCard,
                          data: () => filterByDateRange(orders, reportsFrom, reportsTo).map(o => ({
                            ID: o.id.substring(0, 8).toUpperCase(),
                            Customer: o.customer?.name || '',
                            Method: o.paymentMethod,
                            Amount_NGN: o.price,
                            Pay_Status: o.paymentStatus,
                            Order_Status: o.status,
                            Date: new Date(o.createdAt).toLocaleDateString(),
                          })),
                          filename: 'ryaniva-payments-report',
                        },
                      ].map((r, i) => (
                        <div key={i} className="border border-gray-200 rounded-xl p-5 hover:border-blue-200 transition-colors">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                              style={{ background: `${BLUE}15` }}>
                              <r.icon size={18} style={{ color: BLUE }} />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800 text-sm">{r.title}</div>
                              <div className="text-gray-400 text-xs">{r.desc}</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => exportToCSV(r.data(), r.filename)}
                              className="flex-1 py-2 text-xs rounded-lg text-white font-semibold flex items-center justify-center gap-1.5"
                              style={{ background: BLUE }}>
                              <Download size={12} /> CSV
                            </button>
                            <button className="flex-1 py-2 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium flex items-center justify-center gap-1.5">
                              <FileText size={12} /> PDF
                            </button>
                          </div>
                          <p className="text-xs text-gray-400 mt-2 text-center">
                            {filterByDateRange(orders, reportsFrom, reportsTo).length} records
                            {(reportsFrom || reportsTo) ? ' in selected range' : ' total'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── SUPPORT ── */}
              {activeTab === 'support' && (
                <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                  <Headphones size={56} className="mx-auto mb-4 opacity-20" style={{ color: BLUE }} />
                  <h3 className="font-semibold text-gray-700 text-lg mb-2">Support Center</h3>
                  <p className="text-gray-400 text-sm max-w-md mx-auto">
                    Customer and rider support ticket management will be available here. Coming in the next update.
                  </p>
                </div>
              )}

              {/* ── SETTINGS ── */}
              {activeTab === 'settings' && (
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-700 mb-1">Delivery Pricing</h3>
                    <p className="text-gray-400 text-sm mb-4">Configure base pricing for all deliveries</p>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: 'Base Fare (₦)', value: '500', desc: 'Starting price for every delivery' },
                        { label: 'Per Kilometer (₦)', value: '80', desc: 'Cost per km of distance' },
                        { label: 'Platform Commission (%)', value: '10', desc: 'Ryaniva platform fee per order' },
                        { label: 'Minimum Order (₦)', value: '500', desc: 'Minimum delivery charge' },
                      ].map((s, i) => (
                        <div key={i} className="border border-gray-200 rounded-xl p-4">
                          <label className="text-sm font-medium text-gray-700 block mb-2">{s.label}</label>
                          <input defaultValue={s.value} className={inputClass} />
                          <p className="text-xs text-gray-400 mt-1.5">{s.desc}</p>
                        </div>
                      ))}
                    </div>
                    <button className="mt-4 px-6 py-2.5 rounded-xl text-white text-sm font-semibold"
                      style={{ background: BLUE }}>
                      Save Settings
                    </button>
                  </div>

                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-700 mb-1">Payment Gateway</h3>
                    <p className="text-gray-400 text-sm mb-4">Configure Flutterwave payment settings</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border border-gray-200 rounded-xl p-4">
                        <label className="text-sm font-medium text-gray-700 block mb-2">Flutterwave Public Key</label>
                        <input placeholder="FLWPUBK_TEST-xxxxxxxxxxxx" className={inputClass} />
                        <p className="text-xs text-gray-400 mt-1.5">Get from your Flutterwave dashboard</p>
                      </div>
                      <div className="border border-gray-200 rounded-xl p-4">
                        <label className="text-sm font-medium text-gray-700 block mb-2">Business Name</label>
                        <input defaultValue="Ryaniva Business Services" className={inputClass} />
                        <p className="text-xs text-gray-400 mt-1.5">Shown on payment receipts</p>
                      </div>
                    </div>
                    <button className="mt-4 px-6 py-2.5 rounded-xl text-white text-sm font-semibold"
                      style={{ background: ORANGE }}>
                      Save Payment Settings
                    </button>
                  </div>
                </div>
              )}

              {/* ── CUSTOMERS ── */}
              {activeTab === 'customers' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="p-5 border-b">
                    <h3 className="font-semibold text-gray-700">Customers ({analytics?.users.customers || 0})</h3>
                  </div>
                  <div className="p-12 text-center">
                    <Users size={48} className="mx-auto mb-3 opacity-10" style={{ color: BLUE }} />
                    <p className="text-gray-400 text-sm">Full customer management coming in next update</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}