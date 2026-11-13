import { http, HttpResponse } from 'msw';
import { API_URL } from '../api.js';

// Только учебные данные MSW, не реальные учётные записи или JWT.
export const product = { id: 1, name: 'Яблоки', price: 450, category: 'Фрукты', unit: 'кг', image: '/apple.jpg' };
export const buyer = { id: 5, name: 'Анна', email: 'anna@example.test', role: 'user' };
export const token = 'msw-test-token';
export const endpoint = path => `${API_URL}${path}`;
export const handlers = [
  http.get(endpoint('/products'), () => HttpResponse.json([product])),
  http.get(endpoint('/auth/me'), () => HttpResponse.json(buyer)),
  http.post(endpoint('/auth/login'), () => HttpResponse.json({ user: buyer, token })),
  http.post(endpoint('/auth/register'), async ({ request }) => {
    const { name, email } = await request.json();
    return HttpResponse.json({ user: { ...buyer, name, email, role: 'user' }, token }, { status: 201 });
  }),
  http.post(endpoint('/products'), async ({ request }) => HttpResponse.json({ ...await request.json(), id: 99 }, { status: 201 })),
  http.post(endpoint('/orders'), () => HttpResponse.json({ id: 42 }, { status: 201 })),
];
