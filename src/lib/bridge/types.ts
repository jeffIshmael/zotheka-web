export type BridgeCustomer = {
  id: string;
  email?: string;
  kyc_status?: string;
  status?: string;
  endorsements?: Array<{
    name: string;
    status: string;
    additional_requirements?: string[];
  }>;
};

export type BridgeDepositInstructions = {
  currency: string;
  bank_name?: string;
  bank_address?: string;
  bank_routing_number?: string;
  bank_account_number?: string;
  bank_beneficiary_name?: string;
  bank_beneficiary_address?: string;
  iban?: string;
  bic?: string;
  account_holder_name?: string;
  payment_rail?: string;
  payment_rails?: string[];
};

export type BridgeVirtualAccount = {
  id: string;
  status: string;
  customer_id: string;
  source_deposit_instructions?: BridgeDepositInstructions;
  destination?: {
    currency: string;
    payment_rail: string;
    address?: string;
  };
};

export type BridgeUserState = {
  email: string;
  customerId: string;
  kycStatus?: string;
  walletAddress?: string;
  virtualAccounts: {
    usd?: BridgeVirtualAccount;
    eur?: BridgeVirtualAccount;
  };
};

export class BridgeRequestError extends Error {
  constructor(
    message: string,
    readonly statusCode: number
  ) {
    super(message);
    this.name = "BridgeRequestError";
  }
}
