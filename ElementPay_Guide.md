# Element Pay: Comprehensive Guide & Pricing Strategy

This guide breaks down what Element Pay offers, how the integration works, and strategies for Zotheka to monetize both OnRamp and OffRamp flows.

## What is Element Pay?

Element Pay is a payment rail provider that bridges local African fiat currencies (like Malawian Kwacha - MWK) with cryptocurrency (like USDC on the Base network). 

They offer two main directions of value transfer:
1. **OnRamp (Fiat → Crypto)**: A user pays local fiat via Mobile Money or Bank, and USDC is deposited directly into a designated crypto wallet.
2. **OffRamp (Crypto → Fiat)**: A user sends USDC to a unique deposit address, and Element Pay pays out local fiat to the user's Mobile Money or Bank account.

## Understanding "Corridors"

In Element Pay terminology, a **Corridor** simply refers to a combination of a Country and a Payment Network. 

Think of corridors as the **networks** that are supported. For example:
- **Malawi Corridor 1**: MWK via **Airtel** (Mobile Money)
- **Malawi Corridor 2**: MWK via **TNM** (Mobile Money)

Element Pay exposes a `/partner/catalog` API endpoint. You must always query this endpoint to "discover" which corridors (networks) are currently active and to get the exact `network_id` for your API requests, rather than hardcoding them.

## The Integration Flow

Element Pay's implementation follows a strict, predictable 3-step lifecycle:

### 1. Discovery (Catalog & Rates)
Before a transaction begins, you can check what networks are available and fetch an **Indicative Rate** (`GET /partner/rates/indicative`). This rate is non-binding and is simply used to show the user a preview of the exchange rate (e.g., `1 USD = 1,734 MWK`) on your UI before they actually start the transaction.

### 2. Quote (`POST /partner/orders/quote`)
When the user is ready, you request a Quote. You pass the user's phone number, the chosen network, the MWK amount, and the destination USDC wallet address.
Element Pay responds with a `quote_id`, a locked exchange rate, and a short time-to-live (TTL) expiration timer.

### 3. Accept (`POST /partner/orders/{quote_id}/accept`)
Once the quote is generated, you must immediately call the `accept` endpoint. Accepting the quote tells Element Pay to proceed with the transaction. For an OnRamp, this means Element Pay will instantly trigger the Mobile Money prompt (USSD push) to the user's phone.

### 4. Webhooks (The Source of Truth)
Element Pay will send events to Zotheka's backend (`/api/elementpay/webhook`). 
You must **never** assume a payment is complete just because the quote was accepted. You must listen for the `order.settled` webhook event, verify its HMAC-SHA256 signature to prevent hacking, and only then credit the user on Zotheka or confirm the transaction.

---

## Zotheka Pricing & Monetization Strategy

Deciding how to charge users is critical to ensuring they don't feel "stolen from" while still allowing Zotheka to make a profit. We recommend a hybrid approach: **Spread for Deposits** and **Explicit Fees for Withdrawals**.

### 1. OnRamp (Deposits): The Spread
Users hate paying explicit fees just to load money into an app. For OnRamping, **do not charge a deposit fee**. Instead, tamper with the rate (the Spread).
- **How it works**: Element Pay quotes an exchange rate of 1 USD = 1,750 MWK. You show the user a rate of **1,800 MWK per USD**.
- **The Profit**: The user deposits 18,000 MWK expecting 10 USDC. Element Pay processes the 18,000 MWK at their 1,750 rate, yielding ~10.28 USDC. Zotheka credits the user 10 USDC and pockets the 0.28 USDC difference.
- **Why**: Deposits feel "free", and the user gets exactly the USDC they calculated based on the rate you showed them.

### 2. OffRamp (Withdrawals): Explicit Platform Fee
If you use a spread on deposits (1 USD = 1,800 MWK) and also a spread on withdrawals (1 USD = 1,700 MWK), users will notice the massive gap and feel cheated when trying to withdraw their own money. 

Instead, for OffRamping, **pass the true Element Pay exchange rate to the user** and charge an explicit percentage fee.
- **How it works**: Element Pay's OffRamp rate is 1 USD = 1,740 MWK. Show the user exactly 1,740 MWK per USD.
- **The Fee**: Charge an explicit **1% to 2% withdrawal fee** (Platform Fee). 
- **The Profit**: If a user withdraws 100 USDC, you deduct a 2 USDC fee. You send 98 USDC through Element Pay, yielding 170,520 MWK to their Mobile Money. Zotheka pockets the 2 USDC.
- **Why**: This is extremely transparent. Users are accustomed to "Withdrawal Fees" on almost all fintech apps (Binance, PayPal, local banks). Because the exchange rate itself is fair and close to what they deposited at, they won't feel robbed by hidden exchange rate manipulation.

### Summary of the Hybrid Strategy
* **Deposit (OnRamp)**: Show a slightly higher rate (Spread). `0%` explicit fee.
* **Withdraw (OffRamp)**: Show the true Element Pay rate. `1% - 2%` explicit fee.
