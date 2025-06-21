// controller/messageController.ts
import { Request, Response } from 'express';
import * as MimeType from 'mime-types'; // CORREÇÃO: 'require' movido para um 'import' no topo

import { clientsArray } from '../util/sessionUtil';

// Tipo para o objeto de sessão do WPPConnect (ajuste conforme sua implementação)
interface WPPSession {
  sendText: (to: string, message: string) => Promise<any>;
  sendVoice: (to: string, path: string) => Promise<any>;
  sendImage: (
    to: string,
    path: string,
    filename?: string,
    caption?: string
  ) => Promise<any>;
  sendFile: (
    to: string,
    path: string,
    filename?: string,
    caption?: string
  ) => Promise<any>;
  sendVideo: (
    to: string,
    path: string,
    filename?: string,
    caption?: string
  ) => Promise<any>;
  sendContact: (to: string, contactId: string) => Promise<any>;
  sendLocation: (
    to: string,
    lat: number,
    lng: number,
    title?: string
  ) => Promise<any>;
  sendLinkPreview: (to: string, url: string, title?: string) => Promise<any>;
  sendButtons: (to: string, title: string, buttons: any[]) => Promise<any>;
  sendList: (
    to: string,
    title: string,
    description: string,
    buttonText: string,
    sections: any[]
  ) => Promise<any>;
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

// Helper para obter sessão
function getSession(sessionName: string): WPPSession | null {
  return clientsArray[sessionName] || null;
}

// Helper para resposta de erro padrão - COM VERIFICAÇÃO DE HEADERS
function sendError(
  res: Response,
  message: string,
  statusCode: number = 400
): Response | void {
  if (res.headersSent) {
    console.warn(
      '⚠️ Attempted to send error response but headers already sent:',
      message
    );
    return;
  }

  return res.status(statusCode).json({
    success: false,
    error: message,
  });
}

// Helper para resposta de sucesso padrão - COM VERIFICAÇÃO DE HEADERS
function sendSuccess(
  res: Response,
  data: any = null,
  message: string = 'Success'
): Response | void {
  if (res.headersSent) {
    console.warn(
      '⚠️ Attempted to send success response but headers already sent:',
      message
    );
    return;
  }

  return res.json({
    success: true,
    message,
    data,
  });
}

// Wrapper para tratamento de erro global
function handleControllerError(
  error: any,
  res: Response,
  operation: string
): Response | void {
  console.error(`❌ Error in ${operation}:`, error);

  if (res.headersSent) {
    console.warn(
      `⚠️ Headers already sent for ${operation}, cannot send error response`
    );
    return;
  }

  return res.status(500).json({
    success: false,
    error: `Failed to ${operation}`,
    details: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
}

// =================== MAIN FUNCTIONS ===================

export async function sendMessage(
  req: Request,
  res: Response
): Promise<Response | void> {
  try {
    console.log('🚀 sendMessage started for session:', req.params.session);

    // CORREÇÃO: 'message' agora é 'const'
    let { phone } = req.body;
    const { message } = req.body;

    if (!phone || !message) {
      return sendError(res, 'Phone and message are required');
    }

    if (Array.isArray(phone)) {
      phone = phone[0];
    }

    const client = getSession(req.params.session);
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

export async function sendFile(
  req: Request,
  res: Response
): Promise<Response | void> {
  try {
    const { session } = req.params;
    // CORREÇÃO: Apenas 'phone' precisa ser 'let', o resto pode ser 'const'
    let { phone } = req.body;
    const { path, base64, filename, caption } = req.body;

    if (!phone || (!path && !base64)) {
      return sendError(res, 'Phone and either path or base64 are required');
    }

    if (Array.isArray(phone)) {
      phone = phone[0];
    }

    const client = getSession(session);
    if (!client) {
      return sendError(res, 'Session not found');
    }

    let result;
    if (base64) {
      console.log('📱 Sending file from base64...');
      // CORREÇÃO: 'require' removido daqui
      const mimeType = MimeType.lookup(filename) || 'application/octet-stream';

      const buffer = Buffer.from(base64, 'base64');
      const base64Data = buffer.toString('base64');

      const dataUrl = `data:${mimeType};base64,${base64Data}`;

      console.log(
        `📤 Montando Data URL (início): ${dataUrl.substring(0, 100)}...`
      );
      result = await client.sendFile(phone, dataUrl, filename, caption);
    } else {
      console.log('📱 Sending file from path:', path);
      result = await client.sendFile(phone, path, filename, caption);
    }

    console.log('✅ File sent successfully');
    return sendSuccess(res, result, 'File sent successfully');
  } catch (error) {
    return handleControllerError(error, res, 'send file');
  }
}

export async function sendMentioned(
  req: Request,
  res: Response
): Promise<Response | void> {
  try {
    const { session } = req.params;
    // CORREÇÃO: Removido 'mentions' que não estava sendo usado
    const { phone, message } = req.body;

    if (!phone || !message) {
      return sendError(res, 'Phone and message are required');
    }

    const client = getSession(session);
    if (!client) {
      return sendError(res, 'Session not found');
    }

    const result = await client.sendText(phone, message);
    return sendSuccess(res, result, 'Message with mentions sent successfully');
  } catch (error) {
    return handleControllerError(error, res, 'send mentioned message');
  }
}

// O resto do arquivo pode continuar como está, desde que não tenha mais erros de lint apontados.
// Se houver outras funções que você modificou e que estão dando erro, a lógica de correção será a mesma.

// ... (cole o resto das suas funções aqui, como sendVoice, replyMessage, etc.)
