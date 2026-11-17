export interface Client {
     user_id: number;
     username: string;
     name: string;
     last_name: string;
     email: string;
     phone: string;
     address: string;
     document_type: string;
     document_number: string;
     razon_social?: string;
     status: 'A' | 'I';
     created_at?: string;
     updated_at?: string;
}

export interface ClientRequest {
     username: string;
     password: string;
     name: string;
     last_name: string;
     email: string;
     phone: string;
     address: string;
     document_type: string;
     document_number: string;
     razon_social?: string;
}

export interface ClientUpdateRequest {
     user_id: number;
     username?: string;
     name?: string;
     last_name?: string;
     email?: string;
     phone?: string;
     address?: string;
     document_type?: string;
     document_number?: string;
     razon_social?: string;
}
