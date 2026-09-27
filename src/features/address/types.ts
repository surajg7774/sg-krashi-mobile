// Ported from sg-krashi-client/src/features/customer-portal/types.ts — note
// there is NO name/phone field on this entity server-side, despite that
// being a common assumption for an "address" form. Built against the real
// schema, not the assumed one.
export interface Address {
  id: number;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface AddressPayload {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
}
