import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/lib/models/Order";
import Product from "@/lib/models/Product";
import { sendOrderConfirmation, sendAdminOrderAlert } from "@/lib/email";
import { notifyOrderPlaced } from "@/lib/push";
import axios from "axios";

const CLIENT_ID     = process.env.PHONEPE_CLIENT_ID     || "";
const CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET || "";
const MERCHANT_ID   = process.env.PHONEPE_MERCHANT_ID   || "";

// True only when real credentials are set (not placeholder strings)
const PHONEPE_READY =
  CLIENT_ID     && !CLIENT_ID.startsWith("your_") &&
  CLIENT_SECRET && !CLIENT_SECRET.startsWith("your_") &&
  MERCHANT_ID   && !MERCHANT_ID.startsWith("your_");

export async function POST(req: NextRequest) {
  await connectDB();
  try {
    const body = await req.json();
    const { amount, redirectUrl, cartItems, contactEmail, shippingAddress, billingAddress, paymentMethod, userId, transactionId } = body;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!redirectUrl)
      return Response.json({ success: false, message: "redirectUrl is required" }, { status: 400 });
    if (!paymentMethod)
      return Response.json({ success: false, message: "paymentMethod is required" }, { status: 400 });
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0)
      return Response.json({ success: false, message: "Cart items are required" }, { status: 400 });
    if (!amount || Number(amount) <= 0)
      return Response.json({ success: false, message: "Valid amount is required" }, { status: 400 });

    // ── Create Order ──────────────────────────────────────────────────────────
    const merchantOrderId = "WOW" + Date.now() + Math.floor(Math.random() * 1000);
    const returnUrl = `${redirectUrl}?orderId=${merchantOrderId}`;

    const newOrder = await Order.create({
      orderId:      merchantOrderId,
      userId:       userId || null,
      contactEmail: contactEmail || "",
      items: cartItems.map((item: {
        id?: string; _id?: string; productId?: string;
        title: string; price: number; quantity: number; image?: string;
      }) => ({
        productId: item.id || item._id || item.productId || "unknown",
        title:     item.title,
        price:     Number(item.price),
        quantity:  Number(item.quantity),
        image:     item.image,
      })),
      totalAmount:     Number(amount),
      shippingAddress: shippingAddress || {},
      billingAddress:  billingAddress  || shippingAddress || {},
      paymentMethod,
      transactionId: transactionId || "",
      paymentStatus: "PENDING",
      orderStatus:   "Processing",
    });

    // ── COD Flow ──────────────────────────────────────────────────────────────
    if (paymentMethod === "cod") {
      newOrder.paymentStatus = "SUCCESS";
      await newOrder.save();

      // Deduct stock (non-blocking)
      for (const item of newOrder.items) {
        if (item.productId && item.productId !== "unknown") {
          Product.findById(item.productId).then(async (product) => {
            if (product) {
              const newStock = Math.max(0, (product.totalStock || 0) - item.quantity);
              await Product.updateOne(
                { _id: item.productId },
                { $set: { totalStock: newStock, availability: newStock === 0 ? "Out Of Stock" : product.availability } }
              );
            }
          }).catch(() => {});
        }
      }

      // Send emails (non-blocking)
      sendOrderConfirmation(newOrder as any).catch(() => {});
      sendAdminOrderAlert(newOrder as any).catch(() => {});

      // Push notifications: admin (navbar bell + push) + customer confirmation
      notifyOrderPlaced(newOrder as any).catch(() => {});

      return Response.json({ success: true, isCod: true, url: returnUrl });
    }

    // ── UPI Flow ──────────────────────────────────────────────────────────────
    if (paymentMethod === "upi") {
      newOrder.paymentStatus = "PENDING"; // Admin verifies transaction ID
      await newOrder.save();

      // Deduct stock (non-blocking)
      for (const item of newOrder.items) {
        if (item.productId && item.productId !== "unknown") {
          Product.findById(item.productId).then(async (product) => {
            if (product) {
              const newStock = Math.max(0, (product.totalStock || 0) - item.quantity);
              await Product.updateOne(
                { _id: item.productId },
                { $set: { totalStock: newStock, availability: newStock === 0 ? "Out Of Stock" : product.availability } }
              );
            }
          }).catch(() => {});
        }
      }

      sendOrderConfirmation(newOrder as any).catch(() => {});
      sendAdminOrderAlert(newOrder as any).catch(() => {});

      // Push notifications: admin (navbar bell + push) + customer confirmation
      notifyOrderPlaced(newOrder as any).catch(() => {});

      return Response.json({ success: true, isUpi: true, url: returnUrl });
    }

    // ── PhonePe Flow ──────────────────────────────────────────────────────────
    if (!PHONEPE_READY) {
      return Response.json({
        success: false,
        message: "Online payment is not configured yet. Please select Cash on Delivery.",
      }, { status: 503 });
    }

    const tokenParams = new URLSearchParams({
      client_id:      CLIENT_ID,
      client_version: "1",
      client_secret:  CLIENT_SECRET,
      grant_type:     "client_credentials",
    });

    const tokenRes = await axios.post(
      "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token",
      tokenParams.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 10000 }
    );

    const accessToken = tokenRes.data?.access_token;
    if (!accessToken)
      return Response.json({ success: false, message: "Failed to get payment token" }, { status: 500 });

    const payRes = await axios.post(
      "https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay",
      {
        merchantId:      MERCHANT_ID,
        merchantOrderId,
        amount:          Math.round(Number(amount) * 100),
        expireAfter:     1800,
        metaInfo:        { udf1: "Website Order" },
        paymentFlow: {
          type:         "PG_CHECKOUT",
          message:      "Order Payment",
          merchantUrls: { redirectUrl: returnUrl, cancelUrl: returnUrl },
        },
      },
      {
        headers: { "Content-Type": "application/json", Authorization: `O-Bearer ${accessToken}` },
        timeout: 15000,
      }
    );

    const payUrl = payRes.data?.redirectUrl || payRes.data?.data?.redirectUrl;
    if (!payUrl)
      return Response.json({ success: false, message: "Payment URL not received" }, { status: 500 });

    return Response.json({ success: true, url: payUrl });

  } catch (err: any) {
    const status  = err?.response?.status;
    const msg =
      status === 401 ? "Payment gateway credentials are invalid. Please use Cash on Delivery." :
      status === 503 ? "Payment gateway is unavailable. Please use Cash on Delivery."          :
      err?.response?.data?.message || err?.message || "Payment initiation failed";
    console.error("Payment initiate error:", status, msg);
    return Response.json({ success: false, message: msg }, { status: 500 });
  }
}
