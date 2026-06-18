export interface IWhatsappProvider {
  send(params: { to: string; message: string }): Promise<void>;
}

