export interface User {
  user_id?: number;
  username: string;
  password?: string;
  role: string;
  name: string;
  last_name: string;
  document_type: string;
  document_number: string;
  phone: string;
  email: string;
  address: string;
  registration_date?: Date;
  update_date?: Date;
  razon_social?: string;
  hire_date?: Date;
  office_id?: number;
  status: string;
}

export interface UserResponse {
  data: User[];
  message?: string;
  status?: string;
}
