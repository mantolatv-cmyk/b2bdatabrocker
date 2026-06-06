import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { phone, message, title, recommendedAction } = await request.json();

    if (!phone || !message) {
      return NextResponse.json(
        { error: "Phone and message are required parameters" },
        { status: 400 }
      );
    }

    // Clean phone number (keep only numbers)
    const cleanPhone = phone.replace(/\D/g, "");

    // Format Twilio Credentials from Environment
    const twilioSid = process.env.WHATSAPP_TWILIO_SID;
    const twilioToken = process.env.WHATSAPP_TWILIO_TOKEN;
    const twilioFrom = process.env.WHATSAPP_TWILIO_FROM;

    const isTwilioConfigured = !!(twilioSid && twilioToken && twilioFrom);

    const formattedMessage = `📢 *Predict Intelligence — Alerta Preditivo*\n\n📌 *${title || "Nova Previsão"}*\n\n💡 *Previsão:* ${message}\n\n👉 *Ação Recomendada:* ${recommendedAction || "Acessar o terminal para detalhes."}\n\n_Enviado pelo seu Terminal Predict de Supermercados._`;

    // 1. Twilio API Integration (If credentials exist)
    if (isTwilioConfigured) {
      try {
        const authString = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
        
        // Ensure phone has country code (e.g. +55)
        const formattedTo = cleanPhone.startsWith("55") ? `+${cleanPhone}` : `+55${cleanPhone}`;
        const formattedFrom = twilioFrom!.startsWith("whatsapp:") ? twilioFrom! : `whatsapp:${twilioFrom}`;

        const twilioRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              "Authorization": `Basic ${authString}`,
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
              To: `whatsapp:${formattedTo}`,
              From: formattedFrom,
              Body: formattedMessage
            })
          }
        );

        if (twilioRes.ok) {
          const resData = await twilioRes.json();
          return NextResponse.json({
            success: true,
            provider: "twilio",
            messageId: resData.sid,
            status: "sent"
          });
        } else {
          const errorText = await twilioRes.text();
          console.warn("[Twilio WhatsApp API Error]:", errorText);
          // Fall back to link if Twilio fails
        }
      } catch (err: any) {
        console.warn("[Twilio connection error]:", err.message);
        // Fall back to link if Twilio connection fails
      }
    }

    // 2. Fallback to Direct API Link (WhatsApp Web / Mobile redirect)
    // Ensures small PMEs can send messages instantly from their own device without api cost
    const encodedText = encodeURIComponent(formattedMessage);
    const apiLink = `https://api.whatsapp.com/send?phone=${cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`}&text=${encodedText}`;

    return NextResponse.json({
      success: true,
      provider: "link_fallback",
      status: "ready_to_redirect",
      redirectUrl: apiLink
    });

  } catch (error: any) {
    console.error("[WhatsApp API Error]:", error);
    return NextResponse.json(
      { error: "Internal Server Error during WhatsApp dispatch", details: error.message },
      { status: 500 }
    );
  }
}
