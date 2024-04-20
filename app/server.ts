import express from 'express';
import { engine } from 'express-handlebars';
import { clone } from 'ramda';
import configureHandlebars from './handlebars';
import { getState } from './state';

const app = express();

configureHandlebars();

app.engine('.hbs', engine({ extname: '.hbs' }));
app.set('view engine', '.hbs');
app.set('views', './app/views');

app.get('/', (_, res) => {
  const state = getState();

  res.render(state.mode, clone(state.data));
});

export default app;
