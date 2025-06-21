// VERSÃO FINAL E LIMPA
import { Router } from 'express';
// import multer from 'multer'; // Removido pois não há mais rotas de upload
import swaggerUi from 'swagger-ui-express';

// import uploadConfig from '../config/upload'; // Removido
// Apenas os controllers que SÃO REALMENTE USADOS são importados
import { encryptSession } from '../controller/encryptController';
import * as MessageController from '../controller/messageController';
import * as SessionController from '../controller/sessionController';
import verifyToken from '../middleware/auth';
import * as HealthCheck from '../middleware/healthCheck';
import * as prometheusRegister from '../middleware/instrumentation';
import statusConnection from '../middleware/statusConnection';
import swaggerDocument from '../swagger.json';

// const upload = multer(uploadConfig as any) as any; // Removido
const routes: Router = Router();

// Generate Token
routes.post('/api/:session/:secretkey/generate-token', encryptSession);

// All Sessions
routes.get(
  '/api/:secretkey/show-all-sessions',
  SessionController.showAllSessions
);
routes.post('/api/:secretkey/start-all', SessionController.startAllSessions);

// Sessions
routes.get(
  '/api/:session/check-connection-session',
  verifyToken,
  SessionController.checkConnectionSession
);
routes.get(
  '/api/:session/qrcode-session',
  verifyToken,
  SessionController.getQrCode
);
routes.post(
  '/api/:session/start-session',
  verifyToken,
  SessionController.startSession
);
routes.post(
  '/api/:session/logout-session',
  verifyToken,
  statusConnection,
  SessionController.logOutSession
);
routes.post(
  '/api/:session/close-session',
  verifyToken,
  SessionController.closeSession
);

// Messages
routes.post(
  '/api/:session/send-message',
  verifyToken,
  statusConnection,
  MessageController.sendMessage
);
routes.post(
  '/api/:session/send-file-base64',
  verifyToken,
  statusConnection,
  MessageController.sendFile
);

// Api Doc
routes.use('/api-docs', swaggerUi.serve as any);
routes.get('/api-docs', swaggerUi.setup(swaggerDocument) as any);

//k8s
routes.get('/healthz', HealthCheck.healthz);

//Metrics Prometheus
routes.get('/metrics', prometheusRegister.metrics);

export default routes;
