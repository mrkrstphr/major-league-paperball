import fs from 'fs';
import handlebars from 'handlebars';
import path from 'path';

export default async function configureHandlebars() {
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

  await Promise.all(
    fs
      .readdirSync(helpersDir)
      .filter((filename) => filename.endsWith('.ts') || filename.endsWith('.js'))
      .map(async (filename) => {
        const name = path.parse(filename).name;
        const func = await import(`./views/helpers/${filename}`);

        handlebars.registerHelper(name, func.default);
      }),
  );
}
