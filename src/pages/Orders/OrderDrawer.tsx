// ...existing code...
import { useSelector, useDispatch } from "react-redux";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { motion } from "framer-motion";
import {
  Phone,
  MapPin,
  Wallet,
  Trash2,
  ShoppingBag,
  PackageCheck,
  RefreshCcw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ICheckout } from "@/interfaces/ICheckout";
import { ProductActions } from "@/store/ProductSlice";
import type { IState } from "@/store/interfaces/IState";
import { updateOrder } from "../api";
import { OrdersActions, type IOrder, OrderStatus } from "@/store/OrdersSlice";
// import type { IOption } from "@/interfaces/IProduct";



interface OrderSummaryProps {
  onClose?: () => void;
}

export default function OrderSummary({ onClose }: OrderSummaryProps) {
  // Manual update handler for Update Order button
  const handleUpdateOrder = async () => {
    if (!cart?.id) return;
    const updatedOrder: Partial<IOrder> = {
      ...cart,
      status: status as OrderStatus,
      checkoutdata: formData,
    };
    await updateOrder(String(cart.id), updatedOrder);
    toast.success("Order updated successfully!");
    if (onClose) onClose();
  };


  
  const cart = useSelector((state: IState) => state.Orders.showOrder);
  const cartitems = useSelector((state: IState) => state.Orders.showOrder?.cartitems || []);
  const totalAmount = cartitems?.reduce((acc, item) => acc + item.totalPrice, 0);
  const dispatch = useDispatch();
  const checkoutData = useSelector((state: IState) => state.Orders.showOrder?.checkoutdata);
  // All fields should be editable regardless of status
  const isPending = true;
  const [status, setStatus] = useState(cart?.status || 'Pending');

    const [formData, setFormData] = useState<ICheckout>(
    checkoutData || {
      phone: "",
      email: "",
      whatsapp: "",
      address: "",
      city: "",
      pincode: "",
      paymentMethod: "cod",
    }
  );
  

  // Status change handler
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value);
  };
  

  useEffect(() => {    
    dispatch(ProductActions.setProductDetail(null));
  }, []);



  const [sameAsPhone, setSameAsPhone] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    setSameAsPhone(formData.whatsapp === formData.phone && formData.whatsapp !== "");
  }, [formData]);

  const handleChange = (field: keyof ICheckout, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: false }));
  };

  const handleSameAsPhoneToggle = () => {
    const newValue = !sameAsPhone;
    setSameAsPhone(newValue);
    setFormData((prev) => ({
      ...prev,
      whatsapp: newValue ? prev.phone : "",
    }));
  };

  // ...existing code...

  const handleRemoveItem = (item: any) => {
    dispatch(
      OrdersActions.removeItem({
        productId: item.product.id,
        selectedOptions: item.selectedOptions,
      })
    );
  };

  // ...existing code...

  // Status subtext mapping
  const statusSubtext: Record<string, string> = {
    Pending: 'We are preparing your order',
    Confirmed: 'Order confirmed',
    Processing: 'Order is being processed',
    Shipped: 'Your order is on the way',
    Delivered: 'Your order has been delivered',
    Cancelled: 'Your order was cancelled',
    Returned: 'Order returned',
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white dark:bg-zinc-900 border-b dark:border-zinc-800 flex items-center justify-between px-4 py-3">
        <h1 className="text-lg font-bold text-green-700 dark:text-green-200">Order Details</h1>
        <button
          onClick={onClose}
          className="p-1 bg-transparent border-none shadow-none text-gray-400 hover:text-red-500 transition-colors focus:outline-none"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Order Details Card */}
  <Card className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 shadow-sm mb-2">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Order Number</span>
            <span className="text-xl font-bold text-green-700">#{cart?.id ?? '--'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Status Update Card */}
  <Card className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 shadow-sm mb-2">
        <CardContent className="p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <RefreshCcw className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-700 font-semibold">Order Status</span>
          </div>
          <select
            className="border rounded-md px-3 py-2 text-sm mt-2"
            value={status}
            onChange={handleStatusChange}
          >
            {Object.values(OrderStatus).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span className="text-xs text-gray-400 mt-1">{statusSubtext[status] ?? ''}</span>
        </CardContent>
      </Card>
      <div className="flex justify-between items-center">
        {/* <Button
          variant="ghost"
          className="flex items-center text-sm text-gray-600 hover:text-green-700"
          onClick={() => navigationHelper.goToProducts()}
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Continue Shopping
        </Button> */}

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full text-center"
        >
          {/* <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-green-600 to-lime-500 text-transparent bg-clip-text flex justify-center items-center gap-2">
            <Wallet className="w-8 h-8" />
             Summary
          </h1> */}
          {/* <div className="mt-2 h-1 w-24 bg-green-400 mx-auto rounded-full" /> */}
        </motion.div>

        <div className="w-32" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Left: Cart Summary */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-green-50 dark:bg-zinc-900 border-green-200 dark:border-zinc-800">
              <CardContent className="p-4 space-y-4">
                <h2 className="text-lg font-semibold text-green-800 dark:text-green-300 flex-row  pb-3 border-b border-zinc-200 dark:border-zinc-800">
                  🛒 Order Items     
                  {/* Product & Item Count */}
                  <div className="pl-1 flex items-center gap-2 bg-green-50 dark:bg-zinc-800 rounded-full text-sm font-medium flex-shrink-0">
                    <ShoppingBag className="w-4 h-4" />
                    {cartitems.length} Product{cartitems.length > 1 && "s"}
                    <span className="mx-1">•</span>
                    <PackageCheck className="w-4 h-4" />
                    {cartitems?.reduce((total, item) => total + item.quantity, 0)} Item
                    {cartitems?.reduce((total, item) => total + item.quantity, 0) > 1 && "s"}
                  </div>                         
                </h2>
                {cartitems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex gap-4 border-b border-zinc-200 dark:border-zinc-800 py-4 text-sm relative bg-transparent"
                  >
                    {/* Product Image */}
                    <img
                      src={item.product.imageUrls?.[0]}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 dark:text-gray-100 truncate">
                        {item.product.name}
                      </p>
                      {item.selectedOptions &&
                        Object.entries(item.selectedOptions).map(([variantName, option]) => (
                          <p key={variantName} className="text-gray-500 dark:text-gray-400 text-xs">
                            {variantName}: <span className="font-medium">{option?.name}</span>
                          </p>
                        ))}
                      {/* Quantity & Price Section */}
                      <div className="flex justify-between items-center mt-3 flex-wrap gap-2">
                        {/* Quantity Controls */}
                        <div className="flex items-center bg-gray-100 dark:bg-zinc-800 rounded-full px-2 py-1 gap-2 border border-gray-200 dark:border-zinc-700">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-lg text-gray-700 dark:text-gray-100 bg-white dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 focus:bg-gray-200 dark:focus:bg-zinc-600 border border-gray-200 dark:border-zinc-700"
                            style={{ color: 'inherit', backgroundColor: 'inherit' }}
                            onClick={() => dispatch(OrdersActions.decreaseQuantity({ productId: item.product.id ?? 0, selectedOptions: item.selectedOptions }))}
                            disabled={item.quantity <= 1}
                          >
                            -
                          </Button>
                          <span className="px-2 min-w-[24px] text-center font-semibold text-gray-800 dark:text-gray-100">{item.quantity}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-lg text-gray-700 dark:text-gray-100 bg-white dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 focus:bg-gray-200 dark:focus:bg-zinc-600 border border-gray-200 dark:border-zinc-700"
                            style={{ color: 'inherit', backgroundColor: 'inherit' }}
                            onClick={() => dispatch(OrdersActions.increaseQuantity({ productId: item.product.id ?? 0, selectedOptions: item.selectedOptions }))}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    </div>
                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 absolute top-2 right-2 bg-white dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-zinc-700 focus:bg-red-100 dark:focus:bg-zinc-700 border border-red-200 dark:border-zinc-700"
                      style={{ color: '#ef4444', backgroundColor: 'inherit' }}
                      onClick={() => handleRemoveItem(item)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div className="pt-2 flex items-center justify-between text-green-800 dark:text-green-200 font-semibold gap-4 flex-wrap sm:flex-nowrap border-t border-zinc-200 dark:border-zinc-800 mt-2 pt-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                    {/* Label */}
                    <span className="text-base whitespace-nowrap">Total</span>
                  </div>
                  {/* Amount */}
                  <span className="text-sm font-extrabold text-white bg-green-500 dark:bg-green-700 px-3 py-1 rounded-md shadow-sm">
                    ₹{totalAmount}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right: Address + Contact */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-4 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Phone className="w-4 h-4" /> Contact
              </h2>
              <Input
                type="tel"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className={fieldErrors.phone ? "border-red-500" : ""}
                disabled={!isPending}
              />
              <Input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className={fieldErrors.email ? "border-red-500" : ""}
                disabled={!isPending}
              />
              <Input
                type="text"
                placeholder="WhatsApp (Optional)"
                value={formData.whatsapp}
                onChange={(e) => handleChange("whatsapp", e.target.value)}
                disabled={!isPending}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={sameAsPhone}
                  onChange={handleSameAsPhoneToggle}
                  disabled={!isPending}
                />
                Same as phone number
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Shipping Address
              </h2>
              <Input
                placeholder="Full Address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                className={fieldErrors.address ? "border-red-500" : ""}
                disabled={!isPending}
              />
              <Input
                placeholder="City"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                className={fieldErrors.city ? "border-red-500" : ""}
                disabled={!isPending}
              />
              <Input
                placeholder="Pincode"
                value={formData.pincode}
                onChange={(e) => handleChange("pincode", e.target.value)}
                className={fieldErrors.pincode ? "border-red-500" : ""}
                disabled={!isPending}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Wallet className="w-4 h-4" /> Payment Method
              </h2>
              <RadioGroup
                value={formData.paymentMethod}
                onValueChange={(val: any) => handleChange("paymentMethod", val)}
                className="space-y-2"
                disabled={!isPending}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="cod" id="cod" />
                  <label htmlFor="cod" className="text-sm">
                    Cash on Delivery
                  </label>
                </div>
                <div className="flex items-center gap-2 opacity-50 cursor-not-allowed">
                  <RadioGroupItem value="upi" id="upi" disabled />
                  <label htmlFor="upi" className="text-sm">
                    UPI (Coming Soon)
                  </label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <Button
              onClick={handleUpdateOrder}
              className="w-full bg-[#5DBF13] hover:bg-green-700 text-white rounded-xl mt-4 focus:bg-green-800"
              style={{ backgroundColor: '#5DBF13', color: '#fff' }}
              disabled={cartitems.length === 0}
            >
              Update Order
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}