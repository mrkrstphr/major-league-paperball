import express from 'express';
import { engine } from 'express-handlebars';
import fs from 'fs';
import handlebars from 'handlebars';
import path from 'path';
import { clone } from 'ramda';
import { getState } from './state';

const partialsDir = 'app/views/partials';

handlebars.registerHelper('gt', function (this: object, a, b) {
  var next = arguments[arguments.length - 1];
  return a > b ? next.fn(this) : next.inverse(this);
});
handlebars.registerHelper('gte', function (this: object, a, b) {
  var next = arguments[arguments.length - 1];
  return a >= b ? next.fn(this) : next.inverse(this);
});
handlebars.registerHelper('includes', function (this: object, a, b) {
  var next = arguments[arguments.length - 1];
  return a.includes(b) ? next.fn(this) : next.inverse(this);
});
handlebars.registerHelper('repeat', function repeatHelper(this: object) {
  const { hash, fn } = arguments[0];
  const { count, start = 0 } = hash;

  let result = '';

  for (let i = 0; i < count; i++) {
    const index = i + start;
    const data = { index };

    result += fn(this, {
      data,
      blockParams: [index, data],
    });
  }

  return result;
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
