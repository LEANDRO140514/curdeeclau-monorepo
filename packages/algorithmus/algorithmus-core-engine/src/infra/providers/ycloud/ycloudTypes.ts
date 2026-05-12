/**
 * Tipos sueltos para payloads YCloud (tolerantes; sin aserciones de forma única).
 * @see https://docs.ycloud.com
 */

export type YCloudSendDirectlyTextBody = {
  from: string;
  to: string;
  type: "text";
  text: {
    body: string;
  };
};
