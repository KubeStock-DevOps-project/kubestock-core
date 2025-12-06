import { useState, useEffect } from "react";
import {
  Package,
  TrendingUp,
  AlertCircle,
  Activity,
  Box,
  CheckCircle,
} from "lucide-react";
import Card from "../../components/common/Card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { inventoryService } from "../../services/inventoryService";
import { productService } from "../../services/productService";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import toast from "react-hot-toast";

const WarehouseDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInventory: 0,
    lowStockItems: 0,
    pendingAdjustments: 0,
    todayMovements: 0,
  });
  const [stockData, setStockData] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [recentMovements, setRecentMovements] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [inventory, products, movements] = await Promise.all([
        inventoryService.getAllInventory(),
        productService.getAllProducts(),
        inventoryService
          .getStockMovements({ limit: 10 })
          .catch(() => ({ data: [] })),
      ]);

      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Calculate today's movements
      const todayMovementsCount =
        movements.data?.filter((m) => {
          const movementDate = new Date(m.created_at);
          movementDate.setHours(0, 0, 0, 0);
          return movementDate.getTime() === today.getTime();
        }).length || 0;

      setStats({
        totalInventory:
          inventory.data?.reduce((sum, item) => sum + item.quantity, 0) || 0,
        lowStockItems:
          inventory.data?.filter((item) => item.quantity < item.min_quantity)
            .length || 0,
        pendingAdjustments: 0, // This would come from a real API
        todayMovements: todayMovementsCount,
      });

      // Group products by category for chart
      if (products.data && products.data.length > 0 && inventory.data) {
        const categoryStock = {};
        products.data.forEach((product) => {
          const category = product.category_name || "Uncategorized";
          const inventoryItem = inventory.data.find(
            (inv) => inv.product_id === product.id
          );
          const qty = inventoryItem?.quantity || 0;
          categoryStock[category] = (categoryStock[category] || 0) + qty;
        });
        setStockData(
          Object.entries(categoryStock)
            .map(([name, stock]) => ({ name, stock }))
            .slice(0, 5)
        );
      } else {
        setStockData([
          { name: "Electronics", stock: 450 },
          { name: "Clothing", stock: 320 },
          { name: "Food", stock: 280 },
        ]);
      }

      // Get low stock items with product details
      if (inventory.data && products.data) {
        const lowStock = inventory.data
          .filter((item) => item.quantity < item.min_quantity)
          .slice(0, 3)
          .map((item) => {
            const product = products.data.find((p) => p.id === item.product_id);
            return {
              name: product?.name || `Product #${item.product_id}`,
              qty: item.quantity,
              min: item.min_quantity,
            };
          });
        setLowStockProducts(lowStock);
      }

      // Process recent movements
      if (movements.data && movements.data.length > 0) {
        setRecentMovements(
          movements.data.slice(0, 3).map((movement) => {
            const product = products.data?.find(
              (p) => p.id === movement.product_id
            );
            return {
              type: movement.movement_type,
              product: product?.name || `Product #${movement.product_id}`,
              qty: Math.abs(movement.quantity),
              time: new Date(movement.created_at).toLocaleString(),
            };
          })
        );
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load warehouse data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading warehouse dashboard..." />;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-900">
          Warehouse Dashboard
        </h1>
        <p className="text-dark-600 mt-2">
          Monitor stock levels and manage inventory operations.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-dark text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Inventory</p>
              <h3 className="text-3xl font-bold mt-2">
                {stats.totalInventory}
              </h3>
            </div>
            <Box size={40} className="opacity-80" />
          </div>
        </Card>

        <Card className="bg-gradient-orange text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Low Stock Alert</p>
              <h3 className="text-3xl font-bold mt-2">{stats.lowStockItems}</h3>
            </div>
            <AlertCircle size={40} className="opacity-80" />
          </div>
        </Card>

        <Card className="bg-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Pending Adjustments</p>
              <h3 className="text-3xl font-bold mt-2">
                {stats.pendingAdjustments}
              </h3>
            </div>
            <Activity size={40} className="opacity-80" />
          </div>
        </Card>

        <Card className="bg-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Today's Movements</p>
              <h3 className="text-3xl font-bold mt-2">
                {stats.todayMovements}
              </h3>
            </div>
            <TrendingUp size={40} className="opacity-80" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <h3 className="text-lg font-semibold text-dark-900 mb-4 flex items-center">
            <Package size={20} className="mr-2 text-primary" />
            Stock by Category
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stockData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="stock" fill="#1E293B" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-dark-900 mb-4 flex items-center">
            <AlertCircle size={20} className="mr-2 text-orange-600" />
            Low Stock Items
          </h3>
          <div className="space-y-3">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
                >
                  <div>
                    <p className="text-sm font-medium text-dark-900">
                      {item.name}
                    </p>
                    <p className="text-xs text-dark-500">
                      Current: {item.qty} | Min: {item.min}
                    </p>
                  </div>
                  <AlertCircle size={20} className="text-orange-600" />
                </div>
              ))
            ) : (
              <p className="text-center text-dark-500 py-4">
                All stock levels are healthy!
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Stock Movements */}
      <Card>
        <h3 className="text-lg font-semibold text-dark-900 mb-4">
          Recent Stock Movements
        </h3>
        <div className="space-y-3">
          {recentMovements.length > 0 ? (
            recentMovements.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center p-3 bg-dark-50 rounded-lg"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                    item.type === "IN" || item.type === "INBOUND"
                      ? "bg-green-600"
                      : "bg-red-600"
                  }`}
                >
                  {item.type === "IN" || item.type === "INBOUND" ? (
                    <CheckCircle size={20} />
                  ) : (
                    <Activity size={20} />
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-dark-900">
                    {item.type === "IN" || item.type === "INBOUND"
                      ? "Stock In"
                      : "Stock Out"}
                    : {item.product}
                  </p>
                  <p className="text-xs text-dark-500">
                    Quantity: {item.qty} • {item.time}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-dark-500 py-4">
              No recent stock movements
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default WarehouseDashboard;
