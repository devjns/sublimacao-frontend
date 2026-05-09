import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
});

export async function uploadPhoto(formData: FormData) {
  const res = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function getGallery(token: string) {
  const res = await api.get(`/gallery/${token}`);
  return res.data;
}

export async function createOrder(payload: {
  user_id: string;
  items: {
    product_id: string;
    product_name: string;
    size: string;
    price: number;
    image_url: string;
    quantity: number;
  }[];
}) {
  const res = await api.post('/orders', payload);
  return res.data;
}

export async function getProductionQueue() {
  const res = await api.get('/admin/queue');
  return res.data;
}

export async function updateOrderStatus(orderId: string, status: string) {
  const res = await api.patch(`/admin/orders/${orderId}/status`, { status });
  return res.data;
}
