import client from './client';

export const loginUser = async (email, password) => {
  const response = await client.post('/auth/login', { email, password });
  return response.data;
};

export const registerUser = async (data) => {
  const response = await client.post('/auth/register', data);
  return response.data;
};
