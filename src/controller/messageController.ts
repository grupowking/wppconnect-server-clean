// controller/messageController.ts
import { Request, Response } from 'express';

// Tipo para o objeto de sessão do WPPConnect (ajuste conforme sua implementação)
interface WPPSession {
  sendText: (to: string, message: string) => Promise<any>;
  sendVoice: (to: string, path: string) => Promise<any>;
  sendImage: (to: string, path: string, filename?: string, caption?: string) => Promise<any>;
  sendFile: (to: string, path: string, filename?: string, caption?: string) => Promise<any>;
  sendVideo: (to: string, path: string, filename?: string, caption?: string) => Promise<any>;
  sendContact: (to: string, contactId: string) => Promise<any>;
  sendLocation: (to: string, lat: number, lng: number, title?: string) => Promise<any>;
  sendLinkPreview: (to: string, url: string, title?: string) => Promise<any>;
  sendButtons: (to: string, title: string, buttons: any[]) => Promise<any>;
  sendList: (to: string, title: string, description: string, buttonText: string, sections: any[]) => Promise<any>;
  reply: (messageId: string, message: string) => Promise<any>;
  editMessage: (messageId: string, newMessage: string) => Promise<any>;
  deleteMessage: (messageId: string) => Promise<any>;
  getMessages: (chatId: string) => Promise<any>;
  getChats: () => Promise<any>;
  getContacts: () => Promise<any>;
  getConnectionState: () => Promise<any>;
  setMyStatus: (status: string) => Promise<any>;
  getMyStatus: () => Promise<any>;
}

// Simulação de como você obtém a sessão - ajuste conforme sua implementação
declare const sessions: { [key: string]: WPPSession };

// Helper para obter sessão
function getSession(sessionName: string): WPPSession | null {
  return sessions[sessionName] || null;
}

// Helper para resposta de erro padrão - COM VERIFICAÇÃO DE HEADERS
function sendError(res: Response, message: string, statusCode: number = 400): Response | void {
  if (res.headersSent) {
    console.warn('⚠️ Attempted to send error response but headers already sent:', message);
    return;
  }
  
  return res.status(statusCode).json({
    success: false,
    error: message
  });
}

// Helper para resposta de sucesso padrão - COM VERIFICAÇÃO DE HEADERS
function sendSuccess(res: Response, data: any = null, message: string = 'Success'): Response | void {
  if (res.headersSent) {
    console.warn('⚠️ Attempted to send success response but headers already sent:', message);
    return;
  }
  
  return res.json({
    success: true,
    message,
    data
  });
}

// Wrapper para tratamento de erro global
function handleControllerError(error: any, res: Response, operation: string): Response | void {
  console.error(`❌ Error in ${operation}:`, error);
  
  if (res.headersSent) {
    console.warn(`⚠️ Headers already sent for ${operation}, cannot send error response`);
    return;
  }
  
  return res.status(500).json({
    success: false,
    error: `Failed to ${operation}`,
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}

// =================== MAIN FUNCTIONS ===================

export async function sendMessage(req: Request, res: Response): Promise<Response | void> {
  try {
    console.log('🚀 sendMessage started for session:', req.params.session);
    
    const { session } = req.params;
    const { phone, message } = req.body;

    if (!phone || !message) {
      return sendError(res, 'Phone and message are required');
    }

    const client = getSession(session);
    if (!client) {
      return sendError(res, 'Session not found');
    }

    console.log('📱 Sending message to:', phone);
    const result = await client.sendText(phone, message);
    
    console.log('✅ Message sent successfully');
    return sendSuccess(res, result, 'Message sent successfully');

  } catch (error) {
    return handleControllerError(error, res, 'send message');
  }
}

export async function sendVoice(req: Request, res: Response): Promise<Response | void> {
  try {
    const { session } = req.params;
    const { phone, path } = req.body;

    if (!phone || !path) {
      return sendError(res, 'Phone and path are required');
    }

    const client = getSession(session);
    if (!client) {
      return sendError(res, 'Session not found');
    }

    const result = await client.sendVoice(phone, path);
    return sendSuccess(res, result, 'Voice message sent successfully');

  } catch (error) {
    return handleControllerError(error, res, 'send voice');
  }
}

export async function replyMessage(req: Request, res: Response): Promise<Response | void> {
  try {
    const { session } = req.params;
    const { messageId, message } = req.body;

    if (!messageId || !message) {
      return sendError(res, 'MessageId and message are required');
    }

    const client = getSession(session);
    if (!client) {
      return sendError(res, 'Session not found');
    }

    const result = await client.reply(messageId, message);
    return sendSuccess(res, result, 'Reply sent successfully');

  } catch (error) {
    return handleControllerError(error, res, 'reply message');
  }
}

export async function editMessage(req: Request, res: Response): Promise<Response | void> {
  try {
    const { session } = req.params;
    const { messageId, newMessage } = req.body;

    if (!messageId || !newMessage) {
      return sendError(res, 'MessageId and newMessage are required');
    }

    const client = getSession(session);
    if (!client) {
      return sendError(res, 'Session not found');
    }

    const result = await client.editMessage(messageId, newMessage);
    return sendSuccess(res, result, 'Message edited successfully');

  } catch (error) {
    return handleControllerError(error, res, 'edit message');
  }
}

export async function sendStatusText(req: Request, res: Response): Promise<Response | void> {
  try {
    const { session } = req.params;
    const { status } = req.body;

    if (!status) {
      return sendError(res, 'Status text is required');
    }

    const client = getSession(session);
    if (!client) {
      return sendError(res, 'Session not found');
    }

    const result = await client.setMyStatus(status);
    return sendSuccess(res, result, 'Status updated successfully');

  } catch (error) {
    return handleControllerError(error, res, 'update status');
  }
}

export async function sendLinkPreview(req: Request, res: Response): Promise<Response | void> {
  try {
    const { session } = req.params;
    const { phone, url, title } = req.body;

    if (!phone || !url) {
      return sendError(res, 'Phone and url are required');
    }

    const client = getSession(session);
    if (!client) {
      return sendError(res, 'Session not found');
    }

    const result = await client.sendLinkPreview(phone, url, title);
    return sendSuccess(res, result, 'Link preview sent successfully');

  } catch (error) {
    return handleControllerError(error, res, 'send link preview');
  }
}

export async function sendLocation(req: Request, res: Response): Promise<Response | void> {
  try {
    const { session } = req.params;
    const { phone, lat, lng, title } = req.body;

    if (!phone || !lat || !lng) {
      return sendError(res, 'Phone, lat and lng are required');
    }

    const client = getSession(session);
    if (!client) {
      return sendError(res, 'Session not found');
    }

    const result = await client.sendLocation(phone, lat, lng, title);
    return sendSuccess(res, result, 'Location sent successfully');

  } catch (error) {
    return handleControllerError(error, res, 'send location');
  }
}

export async function sendMentioned(req: Request, res: Response): Promise<Response | void> {
  try {
    const { session } = req.params;
    const { phone, message, mentions } = req.body;

    if (!phone || !message) {
      return sendError(res, 'Phone and message are required');
    }

    const client = getSession(session);
    if (!client) {
      return sendError(res, 'Session not found');
    }

    // Para mensões, normalmente você precisa modificar a mensagem para incluir as menções
    // Implementação específica pode variar dependendo da versão do WPPConnect
    const result = await client.sendText(phone, message);
    return sendSuccess(res, result, 'Message with mentions sent successfully');

  } catch (error) {
    return handleControllerError(error, res, 'send mentioned message');
  }
}

export async function sendFile(req: Request, res: Response): Promise<Response | void> {
  try {
    const { session } = req.params;
    const { phone, path, filename, caption } = req.body;

    if (!phone || !path) {
      return sendError(res, 'Phone and path are required');
    }

    const client = getSession(session);
    if (!client) {
      return sendError(res, 'Session not found');
    }

    const result = await client.sendFile(phone, path, filename, caption);
    return sendSuccess(res, result, 'File sent successfully');

  } catch (error) {
    return handleControllerError(error, res, 'send file');
  }
}

export async function sendImage(req: Request, res: Response): Promise<Response | void> {
  try {
    const { session } = req.params;
    const { phone, path, filename, caption } = req.body;

    if (!phone || !path) {
      return sendError(res, 'Phone and path are required');
    }

    const client = getSession(session);
    if (!client) {
      return sendError(res, 'Session not found');
    }

    const result = await client.sendImage(phone, path, filename, caption);
    return sendSuccess(res, result, 'Image sent successfully');

  } catch (error) {
    return handleControllerError(error, res, 'send image');
  }
}

export async function sendVideo(req: Request, res: Response): Promise<Response | void> {
  try {
    const { session } = req.params;
    const { phone, path, filename, caption } = req.body;

    if (!phone || !path) {
      return sendError(res, 'Phone and path are required');
    }

    const client = getSession(session);
    if (!client) {
      return sendError(res, 'Session not found');
    }

    const result = await client.sendVideo(phone, path, filename, caption);
    return sendSuccess(res, result, 'Video sent successfully');

  } catch (error) {
    return handleControllerError(error, res, 'send video');
  }
}

export async function sendContact(req: Request, res: Response): Promise<Response | void> {
  try {
    const { session } = req.params;
    const { phone, contactId } = req.body;

    if (!phone || !contactId) {
      return sendError(res, 'Phone and contactId are required');
    }

    const client = getSession(session);
    if (!client) {
      return sendError(res, 'Session not found');
    }

    const result = await client.sendContact(phone, contactId);
    return sendSuccess(res, result, 'Contact sent successfully');

  } catch (error) {
    return handleControllerError(error, res, 'send contact');
  }
}

export async function sendButtons(req: Request, res: Response): Promise<Response | void> {
  try {
    const { session } = req.params;
    const { phone, title, buttons } = req.body;

    if (!phone || !title || !buttons) {
      return sendError(res, 'Phone, title and buttons are required');
    }

    const client = getSession(session);
    if (!client) {
      return sendError(res, 'Session not found');
    }

    const result = await client.sendButtons(phone, title, buttons);
    return sendSuccess(res, result, 'Buttons sent successfully');

  } catch (error) {
    return handleControllerError(error, res, 'send buttons');
  }
}

export async function sendList(req: Request, res: Response): Promise<Response | void> {
  try {
    const { session } = req.params;
    const { phone, title, description, buttonText, sections } = req.body;

    if (!phone || !title || !sections) {
      return sendError(res, 'Phone, title and sections are required');
    }

    const client = getSession(session);
    if (!client) {
      return sendError(res, 'Session not found');
    }

    const result = await client.sendList(phone, title, description, buttonText, sections);
    return sendSuccess(res, result, 'List sent successfully');

  } catch (error) {
    return handleControllerError(error, res, 'send list');
  }
}

export async function deleteMessage(req: Request, res: Response): Promise<Response | void> {
  try {
    const { session } = req.params;
    const { messageId } = req.body;

    if (!messageId) {
      return sendError(res, 'MessageId is required');
    }

    const client = getSession(session);
    if (!client) {
      return sendError(res, 'Session not found');
    }

    const result = await client.deleteMessage(messageId);
    return sendSuccess(res, result, 'Message deleted successfully');

  } catch (error) {
    return handleControllerError(error, res, 'delete message');
  }
}

export async function getMessages(req: Request, res: Response): Promise<Response | void> {
  try {
    const { session } = req.params;
    const { chatId } = req.query;

    if (!chatId) {
      return sendError(res, 'ChatId is required');
    }

    const client = getSession(session);
    if (!client) {
      return sendError(res, 'Session not found');
    }

    const result = await client.getMessages(chatId as string);
    return sendSuccess(res, result, 'Messages retrieved successfully');

  } catch (error) {
    return handleControllerError(error, res, 'get messages');
  }
}

export async function getChats(req: Request, res: Response): Promise<Response | void> {
  try {
    const { session } = req.params;

    const client = getSession(session);
    if (!client) {
      return sendError(res, 'Session not found');
    }

    const result = await client.getChats();
    return sendSuccess(res, result, 'Chats retrieved successfully');

  } catch (error) {
    return handleControllerError(error, res, 'get chats');
  }
}

export async function getContacts(req: Request, res: Response): Promise<Response | void> {
  try {
    const { session } = req.params;

    const client = getSession(session);
    if (!client) {
      return sendError(res, 'Session not found');
    }

    const result = await client.getContacts();
    return sendSuccess(res, result, 'Contacts retrieved successfully');

  } catch (error) {
    return handleControllerError(error, res, 'get contacts');
  }
}

export async function isConnected(req: Request, res: Response): Promise<Response | void> {
  try {
    const { session } = req.params;

    const client = getSession(session);
    if (!client) {
      return sendError(res, 'Session not found');
    }

    const result = await client.getConnectionState();
    return sendSuccess(res, result, 'Connection status retrieved successfully');

  } catch (error) {
    return handleControllerError(error, res, 'check connection');
  }
}

export async function getStatus(req: Request, res: Response): Promise<Response | void> {
  try {
    const { session } = req.params;

    const client = getSession(session);
    if (!client) {
      return sendError(res, 'Session not found');
    }

    const result = await client.getMyStatus();
    return sendSuccess(res, result, 'Status retrieved successfully');

  } catch (error) {
    return handleControllerError(error, res, 'get status');
  }
}

export async function setStatus(req: Request, res: Response): Promise<Response | void> {
  try {
    const { session } = req.params;
    const { status } = req.body;

    if (!status) {
      return sendError(res, 'Status is required');
    }

    const client = getSession(session);
    if (!client) {
      return sendError(res, 'Session not found');
    }

    const result = await client.setMyStatus(status);
    return sendSuccess(res, result, 'Status set successfully');

  } catch (error) {
    return handleControllerError(error, res, 'set status');
  }
}
