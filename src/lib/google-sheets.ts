export async function appendToSheet(order: {
  userEmail: string;
  targetEmail: string;
  service: string;
  package: string;
  amountMwk: number;
  txHash: string;
}) {
  const scriptUrl = process.env.GOOGLE_SCRIPT_URL;

  if (!scriptUrl) {
    console.error("Missing GOOGLE_SCRIPT_URL in .env");
    return;
  }

  try {
    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // We pass action: "manual_order" so your Apps Script knows which sheet tab to write to
      body: JSON.stringify({
        action: "manual_order",
        userEmail: order.userEmail,
        targetEmail: order.targetEmail,
        service: order.service,
        package: order.package,
        amountMwk: order.amountMwk,
        txHash: order.txHash,
        status: "Pending"
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Google Apps Script error:", err);
    }
  } catch (error) {
    console.error("Failed to append to Google Sheet via Apps Script", error);
  }
}
