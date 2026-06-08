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
  CheckCircle, Clock, XCircle, MapPin, Phone, Star,
  ChevronRight, Menu, LayoutDashboard, ShoppingBag,
  Wallet, Settings, Headphones, BarChart2, CreditCard,
  Map, UserCheck, AlertCircle, Download, Search,
  Filter, MoreVertical, ArrowUpRight
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

  const filteredOrders = orders.filter(o => {
    const matchesFilter = orderFilter === 'ALL' || o.status === orderFilter;
    const matchesSearch = searchQuery === '' ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.pickupAddress.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
        {/* Topbar */}
        <div className="bg-white border-b px-6 h-16 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-gray-600">
              <Menu size={20} />
            </button>
            <div>
              <h1 className="font-bold text-gray-800">
                {navItems.find(n => n.id === activeTab)?.label}
              </h1>
              <p className="text-xs text-gray-400">Ryaniva Admin Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadAll}
              className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600">
              <RefreshCw size={13} />
              {sidebarOpen && 'Refresh'}
            </button>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: BLUE }}>
              {user?.name?.charAt(0) || 'A'}
            </div>
          </div>
        </div>

        {/* Page content */}
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
                  {/* Stat cards */}
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: 'Total Orders', value: analytics.orders.total, icon: Package, color: BLUE, sub: 'All time' },
                      { label: 'Delivered', value: analytics.orders.completed, icon: CheckCircle, color: '#10B981', sub: `${analytics.orders.total > 0 ? Math.round((analytics.orders.completed / analytics.orders.total) * 100) : 0}% completion` },
                      { label: 'Active Orders', value: analytics.orders.active, icon: Clock, color: ORANGE, sub: 'In progress' },
                      { label: 'Platform Earnings', value: `₦${platformEarnings.toLocaleString()}`, icon: TrendingUp, color: BLUE, sub: `Total: ₦${totalRevenue.toLocaleString()}` },
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

                  {/* Charts row */}
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
                          <Tooltip formatter={(val, name) => [name === 'revenue' ? `₦${val}` : val, name === 'revenue' ? 'Revenue' : 'Orders']} />
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

                  {/* Bottom row */}
                  <div className="grid grid-cols-3 gap-4">
                    {/* Recent orders */}
                    <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
                      <div className="p-4 border-b flex items-center justify-between">
                        <h3 className="font-semibold text-gray-700">Recent Orders</h3>
                        <button onClick={() => setActiveTab('orders')}
                          className="text-xs flex items-center gap-1 font-medium"
                          style={{ color: BLUE }}>
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
                            <div className="text-xs text-gray-400 hidden md:block max-w-32 truncate">
                              {order.pickupAddress}
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
                        {orders.length === 0 && (
                          <div className="p-8 text-center text-gray-400 text-sm">No orders yet</div>
                        )}
                      </div>
                    </div>

                    {/* Top Riders */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                      <div className="p-4 border-b flex items-center justify-between">
                        <h3 className="font-semibold text-gray-700">Top Riders</h3>
                        <button onClick={() => setActiveTab('riders')}
                          className="text-xs flex items-center gap-1 font-medium"
                          style={{ color: BLUE }}>
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

                  {/* User stats */}
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
                  {/* Filters */}
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="relative flex-1">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by order ID, customer name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2"
                        style={{ '--tw-ring-color': BLUE } as any}
                      />
                    </div>
                    <div className="flex gap-2">
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
                      <h3 className="font-semibold text-gray-700">
                        {filteredOrders.length} Orders
                      </h3>
                      <button className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                        <Download size={13} /> Export
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
                            <th className="px-4 py-3 text-left">Distance</th>
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
                              <td className="px-4 py-3">
                                <span className="text-xs text-gray-500">{order.distanceKm} km</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  order.paymentMethod === 'CARD' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {order.paymentMethod}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                                  style={{ background: statusColors[order.status] }}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-bold text-sm" style={{ color: ORANGE }}>
                                  ₦{order.price.toLocaleString()}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {filteredOrders.length === 0 && (
                        <div className="p-12 text-center text-gray-400 text-sm">
                          No orders found
                        </div>
                      )}
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
                              style={{ background: BLUE }}>
                              {rider.user.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800">{rider.user.name}</div>
                              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                <span className="flex items-center gap-1">
                                  <Phone size={12} /> {rider.user.phone}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Bike size={12} /> {rider.vehicle}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Star size={12} className="text-yellow-400" fill="currentColor" /> {rider.rating}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Package size={12} /> {rider.totalTrips} trips
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              rider.isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${rider.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                              {rider.isOnline ? 'Online' : 'Offline'}
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              rider.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                              rider.status === 'SUSPENDED' ? 'bg-red-100 text-red-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {rider.status}
                            </span>
                            <div className="flex gap-2">
                              {rider.status !== 'APPROVED' && (
                                <button onClick={() => approveRider(rider.id)}
                                  className="px-4 py-1.5 rounded-lg text-white text-xs font-semibold transition-opacity hover:opacity-90"
                                  style={{ background: '#10B981' }}>
                                  ✓ Approve
                                </button>
                              )}
                              {rider.status !== 'SUSPENDED' && (
                                <button onClick={() => suspendRider(rider.id)}
                                  className="px-4 py-1.5 rounded-lg text-white text-xs font-semibold bg-red-500 hover:bg-red-600 transition-colors">
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
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Total Delivery Value', value: `₦${analytics.revenue.totalDeliveryValue.toLocaleString()}`, color: BLUE },
                      { label: 'Platform Earnings (10%)', value: `₦${analytics.revenue.platformEarnings.toLocaleString()}`, color: '#10B981' },
                      { label: 'Rider Payouts (90%)', value: `₦${(analytics.revenue.totalDeliveryValue - analytics.revenue.platformEarnings).toLocaleString()}`, color: ORANGE },
                    ].map((s, i) => (
                      <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                        <div className="text-2xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
                        <div className="text-gray-500 text-sm">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-700 mb-4">Revenue Breakdown</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                        <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(val) => `₦${Number(val).toLocaleString()}`} />
                        <Bar dataKey="revenue" fill={BLUE} radius={[6, 6, 0, 0]} name="Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* ── PAYMENTS ── */}
              {activeTab === 'payments' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                      <h3 className="font-semibold text-gray-700 mb-4">Payment Method Breakdown</h3>
                      <div className="space-y-3">
                        {[
                          { label: 'Cash on Delivery', count: orders.filter(o => o.paymentMethod === 'CASH').length, color: BLUE },
                          { label: 'Card (Paystack)', count: orders.filter(o => o.paymentMethod === 'CARD').length, color: ORANGE },
                        ].map((p, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-lg"
                            style={{ background: `${p.color}08` }}>
                            <span className="text-sm text-gray-700">{p.label}</span>
                            <span className="font-bold" style={{ color: p.color }}>{p.count} orders</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                      <h3 className="font-semibold text-gray-700 mb-4">Payment Status</h3>
                      <div className="space-y-3">
                        {[
                          { label: 'Paid', count: orders.filter(o => o.paymentStatus === 'PAID').length, color: '#10B981' },
                          { label: 'Pending', count: orders.filter(o => o.paymentStatus === 'PENDING').length, color: ORANGE },
                          { label: 'Failed', count: orders.filter(o => o.paymentStatus === 'FAILED').length, color: '#EF4444' },
                        ].map((p, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-lg"
                            style={{ background: `${p.color}08` }}>
                            <span className="text-sm text-gray-700">{p.label}</span>
                            <span className="font-bold" style={{ color: p.color }}>{p.count} orders</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold text-gray-700">All Transactions</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                            <th className="px-4 py-3 text-left">Order ID</th>
                            <th className="px-4 py-3 text-left">Customer</th>
                            <th className="px-4 py-3 text-left">Method</th>
                            <th className="px-4 py-3 text-left">Amount</th>
                            <th className="px-4 py-3 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {orders.map(order => (
                            <tr key={order.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">
                                #{order.id.substring(0, 8).toUpperCase()}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">{order.customer?.name}</td>
                              <td className="px-4 py-3">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  order.paymentMethod === 'CARD' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                }`}>{order.paymentMethod}</span>
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
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ── REPORTS ── */}
              {activeTab === 'reports' && (
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-700 mb-2">Generate Reports</h3>
                    <p className="text-gray-400 text-sm mb-6">Export your data in different formats</p>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { title: 'Orders Report', desc: 'All orders with status and pricing', icon: ShoppingBag },
                        { title: 'Revenue Report', desc: 'Platform earnings and delivery values', icon: TrendingUp },
                        { title: 'Riders Report', desc: 'Rider performance and trip counts', icon: Bike },
                        { title: 'Customers Report', desc: 'Customer activity and order history', icon: Users },
                      ].map((r, i) => (
                        <div key={i} className="border border-gray-200 rounded-xl p-4 hover:border-blue-200 transition-colors cursor-pointer">
                          <div className="flex items-center gap-3 mb-3">
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
                            {['PDF', 'Excel', 'CSV'].map(fmt => (
                              <button key={fmt}
                                className="flex-1 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium">
                                {fmt}
                              </button>
                            ))}
                          </div>
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
                    <h3 className="font-semibold text-gray-700 mb-4">Delivery Pricing</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: 'Base Fare (₦)', value: '500', desc: 'Starting price for every delivery' },
                        { label: 'Per Kilometer (₦)', value: '80', desc: 'Cost per km of distance' },
                        { label: 'Platform Commission (%)', value: '10', desc: 'Ryaniva platform fee' },
                        { label: 'Minimum Order (₦)', value: '500', desc: 'Minimum delivery charge' },
                      ].map((s, i) => (
                        <div key={i} className="border border-gray-200 rounded-xl p-4">
                          <label className="text-sm font-medium text-gray-700 block mb-1">{s.label}</label>
                          <input defaultValue={s.value}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
                            style={{ '--tw-ring-color': BLUE } as any} />
                          <p className="text-xs text-gray-400 mt-1">{s.desc}</p>
                        </div>
                      ))}
                    </div>
                    <button className="mt-4 px-6 py-2 rounded-xl text-white text-sm font-semibold"
                      style={{ background: BLUE }}>
                      Save Settings
                    </button>
                  </div>
                </div>
              )}

              {/* ── CUSTOMERS ── */}
              {activeTab === 'customers' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="p-5 border-b flex items-center justify-between">
                    <h3 className="font-semibold text-gray-700">
                      Customers ({analytics?.users.customers || 0})
                    </h3>
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