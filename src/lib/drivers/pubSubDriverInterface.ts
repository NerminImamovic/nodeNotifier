interface PubSubDriverInterface {
  connect();
  createChannel(channel:string);
  publish(channel:string, message:any);
  subscribe(channel:string, handler:any);
}

export { PubSubDriverInterface };
