import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import { productService } from "../../services/productService";
import toast from "react-hot-toast";

const ProductAdd = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    unit_price: "",
    category_id: "",
    size: "",
    color: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare data - remove empty strings and is_active for creation
      const productData = {
        name: formData.name,
        sku: formData.sku,
        unit_price: parseFloat(formData.unit_price),
        description: formData.description || "",
      };

      // Add optional fields only if they have values
      if (formData.category_id) {
        productData.category_id = parseInt(formData.category_id);
      }
      if (formData.size) {
        productData.size = formData.size;
      }
      if (formData.color) {
        productData.color = formData.color;
      }

      await productService.createProduct(productData);
      toast.success("Product created successfully");
      navigate("/products");
    } catch (error) {
      toast.error("Failed to create product");
      console.error("Error creating product:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/products")}
          className="mr-4"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-dark-900">Add New Product</h1>
          <p className="text-dark-600 mt-2">
            Create a new product in your catalog
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Product Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter product name"
            />

            <Input
              label="SKU"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              required
              placeholder="Enter SKU"
            />

            <Input
              label="Unit Price"
              name="unit_price"
              type="number"
              step="0.01"
              value={formData.unit_price}
              onChange={handleChange}
              required
              placeholder="0.00"
            />

            <Input
              label="Size"
              name="size"
              type="text"
              value={formData.size}
              onChange={handleChange}
              placeholder="e.g., Small, Medium, Large"
            />

            <Input
              label="Color"
              name="color"
              type="text"
              value={formData.color}
              onChange={handleChange}
              placeholder="e.g., Red, Blue, Green"
            />

            <div className="md:col-span-2">
              <Input
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter product description"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/products")}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              <Save size={18} className="mr-2" />
              Save Product
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ProductAdd;
