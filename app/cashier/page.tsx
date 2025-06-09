"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import Image from "next/image";
import { useReactToPrint } from "react-to-print";
import { formatCurrency } from "@/lib/utils";

type Product = {
  id: number;
  name: string;
  price: number;
  photo_url: string | null;
  stock_quantity: number;
  category: {
    name: string;
  };
};

type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
};

export default function CashierPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const receiptRef = useRef(null);
  const [receiptData, setReceiptData] = useState<any>(null);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      toast.error("Failed to fetch products");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []); //Fixed useEffect dependency

  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) {
      toast.error("Product out of stock");
      return;
    }

    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === product.id);

      if (existingItem) {
        if (existingItem.quantity >= product.stock_quantity) {
          toast.error("Maximum stock reached");
          return currentCart;
        }

        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...currentCart,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ];
    });
  };

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    onAfterPrint: () => {
      setReceiptData(null);
      setCart([]);
      setPaymentMethod("");
      fetchProducts();
    },
  });

  const handleCheckout = async () => {
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cart,
          payment_method: paymentMethod,
          total_price: total,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process transaction");
      }

      const transactionData = await response.json();
      setReceiptData({
        ...transactionData,
        items: cart,
        total: total,
        paymentMethod: paymentMethod,
      });
      // Call handlePrint after setting the receipt data
      setTimeout(() => {
        handlePrint();
      }, 100);
    } catch (error) {
      toast.error(error.message || "Failed to process transaction");
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">New Transaction</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => addToCart(product)}
                  >
                    <div className="aspect-square relative">
                      {product.photo_url ? (
                        <Image
                          src={product.photo_url || "/placeholder.svg"}
                          alt={product.name}
                          fill
                          className="object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          No Image
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-medium truncate">{product.name}</h3>
                      <p className="text-sm text-gray-500">
                        {product.category.name}
                      </p>
                      <div className="flex justify-between text-sm items-center mt-2">
                        <p className="font-bold">
                          {formatCurrency(product.price)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Stock: {product.stock_quantity}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Cart</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.name} x {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.price * item.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-bold">Total</TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(total)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Method</label>
                  <Select
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tunai">Cash</SelectItem>
                      <SelectItem value="kartu">Card</SelectItem>
                      <SelectItem value="e_wallet">E-Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleCheckout}
                  className="w-full"
                  disabled={cart.length === 0 || !paymentMethod}
                >
                  Checkout
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setCart([])}
                  disabled={cart.length === 0}
                >
                  Clear Cart
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hidden receipt template for printing */}
      <div className="hidden">
        <div ref={receiptRef} className="p-4">
          {receiptData && (
            <>
              <h2 className="text-center font-bold text-xl mb-4">
                Sales Receipt
              </h2>
              <div className="mb-4">
                <p>Date: {new Date().toLocaleString()}</p>
                <p>
                  Receipt Number: {receiptData.receipt?.receipt_number || "N/A"}
                </p>
                <p>Payment Method: {receiptData.paymentMethod}</p>
              </div>
              <table className="w-full mb-4">
                <thead>
                  <tr>
                    <th className="text-left">Item</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptData.items.map((item: CartItem) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td className="text-right">{item.quantity}</td>
                      <td className="text-right">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="text-right">
                        {formatCurrency(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="text-right font-bold">
                      Total:
                    </td>
                    <td className="text-right font-bold">
                      {formatCurrency(receiptData.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
              <p className="text-center text-sm">
                Thank you for your purchase!
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
