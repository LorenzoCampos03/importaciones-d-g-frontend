export interface Customer {
  id: number;
  name: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  phone?: string;
  email?: string;
  address?: string;
  registrationDate: string;
  updateDate?: string;
  razonSocial?: string;
  status: string;
}

export interface CreateCustomerRequest {
  name: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  phone?: string;
  email?: string;
  address?: string;
  razonSocial?: string;
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {
  id: number;
}
