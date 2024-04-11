import express from 'express';
import { engine } from 'express-handlebars';
import fs from 'fs';
import handlebars from 'handlebars';
import handlebarsRepeat from 'handlebars-helper-repeat';
import path from 'path';
import { clone } from 'ramda';
import { getState } from './state.js';

const partialsDir = 'app/views/partials';

handlebars.registerHelper('repeat', handlebarsRepeat);
handlebars.registerHelper('gte', function (a, b) {
  var next = arguments[arguments.length - 1];
  return a >= b ? next.fn(this) : next.inverse(this);
});
handlebars.registerHelper('includes', function (a, b) {
  var next = arguments[arguments.length - 1];
  return a.includes(b) ? next.fn(this) : next.inverse(this);
});

fs.readdirSync(partialsDir).forEach((filename) => {
  if (filename.endsWith('.hbs')) {
    const name = path.parse(filename).name;

    handlebars.registerPartial(
      name,
      fs.readFileSync(path.join(partialsDir, filename), 'utf-8')
    );
  }
});

const app = express();

app.engine('.hbs', engine({ extname: '.hbs' }));
app.set('view engine', '.hbs');
app.set('views', './app/views');

app.get('/', (_, res) => {
  const state = getState();

  res.render(state.mode, clone(state.data));
});

export default app;
