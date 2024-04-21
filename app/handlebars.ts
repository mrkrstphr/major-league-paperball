import fs from 'fs';
import handlebars from 'handlebars';
import path from 'path';

export default function configureHandlebars() {
  const partialsDir = `${__dirname}/views/partials`;
  const helpersDir = `${__dirname}/views/helpers`;

  fs.readdirSync(partialsDir).forEach((filename) => {
    if (filename.endsWith('.hbs')) {
      const name = path.parse(filename).name;

      handlebars.registerPartial(
        name,
        fs.readFileSync(path.join(partialsDir, filename), 'utf-8'),
      );
    }
  });

  fs.readdirSync(helpersDir).forEach(async (filename) => {
    if (filename.endsWith('.ts') || filename.endsWith('.js')) {
      const name = path.parse(filename).name;
      const func = await import(`./views/helpers/${filename}`);

      handlebars.registerHelper(name, func.default);
    }
  });
}
