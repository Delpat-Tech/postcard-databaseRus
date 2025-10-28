// src/stores/types.ts

export const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ===== Design Variables =====
export interface DesignVariable {
    key: string;
    value: string;
}

// ===== Recipient & Addressing =====
export interface Address {
    firstName: string;
    lastName: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
    phone?: string;
    email?: string;
}

export interface AddressingConfig {
    font?:
    | "Bradley Hand"
    | "Blackjack"
    | "FG Cathies Hand"
    | "Crappy Dan"
    | "Dakota"
    | "Jenna Sue"
    | "Reenie Beanie";
    fontColor?: "Black" | "Green" | "Blue";
    exceptionalAddressingType?: "resident" | "occupant" | "business";
    extRefNbr?: string;
}

// ===== Recipient =====
export interface Recipient {
    id: string;
    firstName: string;
    lastName: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
    externalReferenceNumber?: string;
    variables?: DesignVariable[];
}

// ===== Order =====
export interface Order {
    _id: string;
    productType: "postcard" | "letter";
    templateId?: string;
    designType: "single" | "split" | "drip";
    designId?: number | string;
    designName?: string;
    designSize?: string;
    isCustomDesign: boolean;
    mailClass: "FirstClass" | "Standard";
    externalReference?: string;
    mailDate: string;
    brochureFold?: "Tri-Fold" | "Bi-Fold";
    returnAddress?: Address;
    userDet?: Pick<Address, "phone" | "email">;
    recipients: Recipient[];
    addons?: { addon: "UV" | "Livestamping" }[] | null;
    front?: string | null;
    back?: string | null;
    frontPdf?: File;
    backPdf?: File;
    frontproof?: string | null;
    backproof?: string | null;
    addressing?: AddressingConfig;
    globalDesignVariables?: DesignVariable[];
    qrCodeID?: number;
    fileUrl?: string | null;
    color?: boolean;
    printOnBothSides?: boolean;
    insertAddressingPage?: boolean;
    envelopeType?: "fullWindow" | "doubleWindow" | "Regular" | "BiFold";
    envelopeID?: number | null;
    font?: AddressingConfig["font"];
    fontColor?: AddressingConfig["fontColor"];
    exceptionalAddressingType?: AddressingConfig["exceptionalAddressingType"];
    status: "draft" | "pending_admin_approval" | "submitted_to_pcm" | "approved" | "rejected";
    pcmOrderId?: string;
    pcmResponse?: any;
    createdAt: Date;
    updatedAt: Date;
    totalPrice: number;
}

// ===== Template =====
export interface Template {
    _id: string;
    pcmDesignId: string;
    name: string;
    size: string;
    previewUrl: string;
    url?: string;
    type?: string;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
    rawData: any;
}
