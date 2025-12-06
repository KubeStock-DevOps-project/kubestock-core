import { useState, useEffect } from "react";
import {
  ShoppingCart,
  TrendingUp,
  Clock,
  CheckCircle,
  Package,
  DollarSign,
} from "lucide-react";
import Card from "../../components/common/Card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { supplierService } from "../../services/supplierService";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import toast from "react-hot-toast";

const SupplierDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
  });
  const [monthlyOrders, setMonthlyOrders] = useState([]);
  const [orderStatus, setOrderStatus] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const purchaseOrders = await supplierService
        .getAllPurchaseOrders()
        .catch(() => ({ data: [] }));

      const orders = purchaseOrders.data || [];

      // Calculate stats
      const pending = orders.filter((o) => o.status === "pending").length;
      const completed = orders.filter((o) => o.status === "completed").length;
      const cancelled = orders.filter((o) => o.status === "cancelled").length;
      const totalRevenue = orders
        .filter((o) => o.status === "completed")
        .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

      setStats({
        totalOrders: orders.length,
        pendingOrders: pending,
        completedOrders: completed,
        totalRevenue: Math.round(totalRevenue),
      });

      // Group orders by month
      if (orders.length > 0) {
        const monthCounts = {};
        orders.forEach((order) => {
          const month = new Date(order.created_at).toLocaleDateString("en-US", {
            month: "short",
          });
          monthCounts[month] = (monthCounts[month] || 0) + 1;
        });
        setMonthlyOrders(
          Object.entries(monthCounts).map(([month, orders]) => ({
            month,
            orders,
          }))
        );
      } else {
        // Default data
        setMonthlyOrders([
          { month: "Jan", orders: 12 },
          { month: "Feb", orders: 15 },
          { month: "Mar", orders: 18 },
          { month: "Apr", orders: 22 },
          { month: "May", orders: 25 },
          { month: "Jun", orders: 28 },
        ]);
      }

      // Order status distribution
      setOrderStatus([
        { name: "Completed", value: completed, color: "#10B981" },
        { name: "Pending", value: pending, color: "#F97316" },
        { name: "Cancelled", value: cancelled, color: "#EF4444" },
      ]);

      // Recent orders
      setRecentOrders(
        orders.slice(0, 3).map((order) => ({
          id: `PO-${order.id}`,
          product: `Order #${order.id}`,
          qty: order.quantity || 0,
          amount: parseFloat(order.total_amount || 0),
          status: order.status,
        }))
      );
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load supplier data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading supplier dashboard..." />;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-900">Supplier Dashboard</h1>
        <p className="text-dark-600 mt-2">
          Track your orders, deliveries, and performance metrics.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-primary text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Orders</p>
              <h3 className="text-3xl font-bold mt-2">{stats.totalOrders}</h3>
            </div>
            <ShoppingCart size={40} className="opacity-80" />
          </div>
        </Card>

        <Card className="bg-gradient-orange text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Pending Orders</p>
              <h3 className="text-3xl font-bold mt-2">{stats.pendingOrders}</h3>
            </div>
            <Clock size={40} className="opacity-80" />
          </div>
        </Card>

        <Card className="bg-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Completed</p>
              <h3 className="text-3xl font-bold mt-2">
                {stats.completedOrders}
              </h3>
            </div>
            <CheckCircle size={40} className="opacity-80" />
          </div>
        </Card>

        <Card className="bg-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Revenue</p>
              <h3 className="text-3xl font-bold mt-2">
                ${stats.totalRevenue.toLocaleString()}
              </h3>
            </div>
            <DollarSign size={40} className="opacity-80" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <h3 className="text-lg font-semibold text-dark-900 mb-4 flex items-center">
            <TrendingUp size={20} className="mr-2 text-primary" />
            Order Trends
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyOrders}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#F97316"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-dark-900 mb-4 flex items-center">
            <Package size={20} className="mr-2 text-primary" />
            Order Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={orderStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {orderStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Purchase Orders */}
      <Card>
        <h3 className="text-lg font-semibold text-dark-900 mb-4">
          Recent Purchase Orders
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-600">
                  Order ID
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-600">
                  Product
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-600">
                  Quantity
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-600">
                  Amount
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-600">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length > 0 ? (
                recentOrders.map((order, idx) => (
                  <tr key={idx} className="border-b border-dark-100">
                    <td className="py-3 px-4 text-sm text-dark-900">
                      {order.id}
                    </td>
                    <td className="py-3 px-4 text-sm text-dark-900">
                      {order.product}
                    </td>
                    <td className="py-3 px-4 text-sm text-dark-900">
                      {order.qty}
                    </td>
                    <td className="py-3 px-4 text-sm text-dark-900">
                      ${order.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full capitalize ${
                          order.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : order.status === "pending"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-dark-500">
                    No purchase orders yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default SupplierDashboard;
