import express from 'express';
import { notifierFactory } from './lib/notifierFactory';

const app = express();
const port = 3000;

const notifier = notifierFactory();

app.get('/', (req, res) => {
  res.send('The sedulous aaa dd hyena ate the antelope!');
});

app.listen(port);
