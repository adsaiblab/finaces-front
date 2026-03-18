export interface BidderSearchOut {
    id: string;
    name: string;
    country: string;
    primary_sector?: string;
    email?: string;
    legal_form?: string;
}

export interface BidderCreateSchema {
    name: string;
    legal_form: string;
    registration_number?: string;
    email?: string;
    phone?: string;
    country: string;
}

export interface BidderOut {
    id: string;
    name: string;
    country: string;
    legal_form: string;
    created_at: string;
}