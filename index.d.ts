declare module '@filipeai/client' {
  export interface ClientOptions {
    baseUrl?: string;
    timeout?: number;
  }

  export interface NotificationData {
    source_service: string;
    sender_id: string;
    content: string;
    metadata?: Record<string, any>;
  }

  export interface NotificationParams {
    source_service?: string;
    sender_id?: string;
    limit?: number;
    offset?: number;
  }

  export interface Notification {
    id: string;
    source_service: string;
    sender_id: string;
    content: string;
    metadata?: Record<string, any>;
    created_at: string;
    updated_at: string;
    identity?: Identity;
  }

  export interface NotificationList {
    notifications: Notification[];
    total: number;
    offset: number;
    limit: number;
  }

  export interface NotificationHandlerData {
    source_service: string;
    metadata_filter?: Record<string, any>;
    prompt: string;
  }

  export interface NotificationHandler {
    id: string;
    source_service: string;
    metadata_filter?: Record<string, any>;
    prompt: string;
    created_at: string;
    updated_at: string;
  }

  export interface NotificationHandlerList {
    handlers: NotificationHandler[];
    total: number;
    offset: number;
    limit: number;
  }

  export interface NotificationHandlerParams {
    source_service?: string;
    limit?: number;
    offset?: number;
  }

  export interface IdentityData {
    source_service: string;
    source_id: string;
    name: string;
    metadata?: Record<string, any>;
  }

  export interface Identity {
    id: string;
    source_service: string;
    source_id: string;
    name: string;
    metadata?: Record<string, any>;
    created_at: string;
    updated_at: string;
  }

  export interface IdentityList {
    identities: Identity[];
    total: number;
    offset: number;
    limit: number;
  }

  export interface IdentityParams {
    name?: string;
    source_service?: string;
    limit?: number;
    offset?: number;
  }

  export interface WebSocketOptions {
    autoReconnect?: boolean;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
  }

  export interface StatusResponse {
    status: string;
    version: string;
    timestamp: string;
  }

  export class Status {
    constructor(client: FilipeApiClient);
    getStatus(): Promise<StatusResponse>;
  }

  export class Notifications {
    constructor(client: FilipeApiClient);
    createNotification(data: NotificationData): Promise<Notification>;
    getNotifications(params?: NotificationParams): Promise<NotificationList>;
    getNotification(notificationId: string): Promise<Notification>;
    acknowledgeNotification(notificationId: string, socket: WebSocket): void;
  }

  export class NotificationHandlers {
    constructor(client: FilipeApiClient);
    createHandler(data: NotificationHandlerData): Promise<NotificationHandler>;
    getHandlers(params?: NotificationHandlerParams): Promise<NotificationHandlerList>;
    getHandler(handlerId: string): Promise<NotificationHandler>;
    updateHandler(handlerId: string, data: NotificationHandlerData): Promise<NotificationHandler>;
    deleteHandler(handlerId: string): Promise<void>;
  }

  export class Identities {
    constructor(client: FilipeApiClient);
    createOrUpdateIdentity(data: IdentityData): Promise<Identity>;
    getIdentityBySource(sourceService: string, sourceId: string): Promise<Identity>;
    getIdentity(identityId: string): Promise<Identity>;
    getIdentities(params?: IdentityParams): Promise<IdentityList>;
    deleteIdentity(identityId: string): Promise<void>;
  }

  export class WebSocketClient {
    constructor(client: FilipeApiClient);
    connect(options?: WebSocketOptions): Promise<WebSocket>;
    subscribe(sourceService: string): void;
    unsubscribe(sourceService: string): void;
    disconnect(): void;
    on(event: 'message' | 'open' | 'close' | 'error', handler: Function): WebSocketClient;
    off(event: 'message' | 'open' | 'close' | 'error', handler: Function): WebSocketClient;
  }

  export default class FilipeApiClient {
    constructor(apiKey: string, options?: ClientOptions);
    
    readonly apiKey: string;
    readonly baseUrl: string;
    readonly http: any;
    
    status: Status;
    notifications: Notifications;
    notificationHandlers: NotificationHandlers;
    identities: Identities;
    websocket: WebSocketClient;
    
    request(config: any): Promise<any>;
  }
} 