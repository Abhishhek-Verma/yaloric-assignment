import client from './client';

export const getProfile = async () => {
  const response = await client.get('/users/profile');
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await client.patch('/users/profile', profileData);
  return response.data;
};

export const getUsers = async () => {
  const response = await client.get('/users');
  return response.data;
};

export const getUserById = async (id) => {
  const response = await client.get(`/users/${id}`);
  return response.data;
};

export const updateUser = async (id, userData) => {
  const response = await client.put(`/users/${id}`, userData);
  return response.data;
};

export const patchUser = async (id, userData) => {
  const response = await client.patch(`/users/${id}`, userData);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await client.delete(`/users/${id}`);
  return response.data;
};
