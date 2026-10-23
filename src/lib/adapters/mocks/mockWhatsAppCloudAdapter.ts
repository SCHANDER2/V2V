/**
 * Mock WhatsApp Cloud Adapter
 * 
 * Provides an in-memory outbox, deterministic message ID generation,
 * simulated template and interactive message sending, and incoming webhook simulation.
 */

import {
  WhatsAppCloudAdapter,
  WhatsAppInteractiveButton,
  WhatsAppTemplateComponent,
  WhatsAppSendResult,
  WhatsAppMessageRecord,
  WhatsAppIncomingWebhookPayload,
  WhatsAppWebhookProcessingResult,
} from "../interfaces/whatsapp.interface";

export class MockWhatsAppCloudAdapter implements WhatsAppCloudAdapter {
  private outbox: WhatsAppMessageRecord[] = [];
  private messageCounter = 1;

  private generateMessageId(): string {
    const timestamp = Date.now().toString(36);
    const counter = (this.messageCounter++).toString().padStart(4, "0");
    return `wamid.HBgL${timestamp}${counter}`;
  }

  public async sendTemplate(
    toPhone: string,
    templateName: string,
    components?: WhatsAppTemplateComponent[] | any
  ): Promise<WhatsAppSendResult> {
    const messageId = this.generateMessageId();
    const sentAt = new Date();

    const record: WhatsAppMessageRecord = {
      messageId,
      recipientPhone: toPhone,
      type: "template",
      templateName,
      components,
      sentAt,
      status: "SENT",
    };

    this.outbox.push(record);

    return {
      success: true,
      messageId,
      recipientPhone: toPhone,
      type: "template",
      templateName,
      content: `Template: ${templateName}`,
      status: "SENT",
      timestamp: sentAt,
    };
  }

  public async sendInteractiveButtons(
    toPhone: string,
    bodyText: string,
    buttons: WhatsAppInteractiveButton[],
    headerText?: string
  ): Promise<WhatsAppSendResult> {
    const messageId = this.generateMessageId();
    const sentAt = new Date();

    const record: WhatsAppMessageRecord = {
      messageId,
      recipientPhone: toPhone,
      type: "interactive",
      bodyText,
      buttons,
      sentAt,
      status: "SENT",
    };

    this.outbox.push(record);

    return {
      success: true,
      messageId,
      recipientPhone: toPhone,
      type: "interactive",
      content: bodyText,
      status: "SENT",
      timestamp: sentAt,
    };
  }

  public getOutbox(): WhatsAppMessageRecord[] {
    return [...this.outbox];
  }

  public clearOutbox(): void {
    this.outbox = [];
  }

  public getMessagesForRecipient(phone: string): WhatsAppMessageRecord[] {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    return this.outbox.filter((m) => m.recipientPhone.replace(/[^0-9]/g, "") === cleanPhone);
  }

  public getLastMessage(): WhatsAppMessageRecord | undefined {
    return this.outbox[this.outbox.length - 1];
  }

  public async simulateIncomingWebhook(
    payload: WhatsAppIncomingWebhookPayload
  ): Promise<WhatsAppWebhookProcessingResult> {
    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const message = change?.messages?.[0];

    if (!message) {
      return {
        processed: false,
        fromPhone: "",
        messageType: "unknown",
      };
    }

    const fromPhone = message.from;
    const messageType = message.type;
    let buttonId: string | undefined;
    let text: string | undefined;

    if (messageType === "interactive" && message.interactive?.button_reply) {
      buttonId = message.interactive.button_reply.id;
      text = message.interactive.button_reply.title;
    } else if (messageType === "button" && message.button) {
      buttonId = message.button.payload;
      text = message.button.text;
    } else if (messageType === "text" && message.text) {
      text = message.text.body;
    }

    return {
      processed: true,
      fromPhone,
      messageType,
      buttonId,
      text,
      actionTaken: buttonId ? `BUTTON_ACTION_${buttonId}` : "TEXT_RECEIVED",
    };
  }

  public async simulateDonorButtonReply(
    fromPhone: string,
    buttonId: string,
    buttonTitle: string
  ): Promise<WhatsAppWebhookProcessingResult> {
    const payload: WhatsAppIncomingWebhookPayload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "WHATSAPP_ENTRY_001",
          changes: [
            {
              value: {
                messaging_product: "whatsapp",
                metadata: {
                  display_phone_number: "+911145678900",
                  phone_number_id: "PHONE_ID_001",
                },
                contacts: [{ profile: { name: "Donor" }, wa_id: fromPhone }],
                messages: [
                  {
                    from: fromPhone,
                    id: this.generateMessageId(),
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    type: "interactive",
                    interactive: {
                      type: "button_reply",
                      button_reply: { id: buttonId, title: buttonTitle },
                    },
                  },
                ],
              },
              field: "messages",
            },
          ],
        },
      ],
    };

    return this.simulateIncomingWebhook(payload);
  }
}

export const mockWhatsAppCloudAdapter = new MockWhatsAppCloudAdapter();
