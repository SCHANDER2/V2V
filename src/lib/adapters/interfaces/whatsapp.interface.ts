/**
 * WhatsApp Cloud API Integration Adapter Interface
 * 
 * Models Meta WhatsApp Business Cloud API for emergency wave notifications,
 * interactive CTA buttons (Accept SOS / Decline), and incoming donor reply webhooks.
 */

export interface WhatsAppInteractiveButton {
  id: string; // e.g. "ACCEPT_SOS", "DECLINE_SOS"
  title: string; // e.g. "Accept SOS & Unlock Slot"
}

export interface WhatsAppTemplateParameter {
  type: "text" | "currency" | "date_time" | "image" | "document";
  text?: string;
  [key: string]: any;
}

export interface WhatsAppTemplateComponent {
  type: "header" | "body" | "button";
  sub_type?: "url" | "quick_reply";
  index?: number;
  parameters?: WhatsAppTemplateParameter[];
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId: string;
  recipientPhone: string;
  type: "template" | "interactive";
  templateName?: string;
  content: string;
  status: "SENT" | "QUEUED" | "DELIVERED";
  timestamp: Date;
}

export interface WhatsAppMessageRecord {
  messageId: string;
  recipientPhone: string;
  type: "template" | "interactive";
  templateName?: string;
  bodyText?: string;
  components?: any;
  buttons?: WhatsAppInteractiveButton[];
  sentAt: Date;
  status: "SENT" | "DELIVERED" | "READ";
}

export interface WhatsAppIncomingWebhookPayload {
  object: "whatsapp_business_account";
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: "whatsapp";
        metadata: { display_phone_number: string; phone_number_id: string };
        contacts?: Array<{ profile: { name: string }; wa_id: string }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: "text" | "button" | "interactive";
          text?: { body: string };
          interactive?: {
            type: "button_reply";
            button_reply: { id: string; title: string };
          };
          button?: { payload: string; text: string };
        }>;
      };
      field: "messages";
    }>;
  }>;
}

export interface WhatsAppWebhookProcessingResult {
  processed: boolean;
  fromPhone: string;
  messageType: string;
  actionTaken?: string;
  buttonId?: string;
  text?: string;
}

export interface WhatsAppCloudAdapter {
  /**
   * Dispatches a pre-approved Meta WhatsApp template message (e.g. SOS alert, ETA reminder).
   */
  sendTemplate(
    toPhone: string,
    templateName: string,
    components?: WhatsAppTemplateComponent[] | any
  ): Promise<WhatsAppSendResult>;

  /**
   * Dispatches interactive messages with quick reply action buttons.
   */
  sendInteractiveButtons(
    toPhone: string,
    bodyText: string,
    buttons: WhatsAppInteractiveButton[],
    headerText?: string
  ): Promise<WhatsAppSendResult>;

  /**
   * Retrieves all messages dispatched to the outbox (useful for unit testing).
   */
  getOutbox(): WhatsAppMessageRecord[];

  /**
   * Clears the in-memory outbox.
   */
  clearOutbox(): void;

  /**
   * Retrieves messages sent to a specific phone number.
   */
  getMessagesForRecipient(phone: string): WhatsAppMessageRecord[];

  /**
   * Retrieves the most recent dispatched message.
   */
  getLastMessage(): WhatsAppMessageRecord | undefined;

  /**
   * Simulates receiving an incoming Meta webhook event (e.g. donor tapping button).
   */
  simulateIncomingWebhook(
    payload: WhatsAppIncomingWebhookPayload
  ): Promise<WhatsAppWebhookProcessingResult>;

  /**
   * Convenience simulation for donor tapping an interactive button.
   */
  simulateDonorButtonReply(
    fromPhone: string,
    buttonId: string,
    buttonTitle: string
  ): Promise<WhatsAppWebhookProcessingResult>;
}
