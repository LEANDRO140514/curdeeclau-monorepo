export interface ISender {
  sendMessage(to: string, message: string): Promise<void>;
}
