import template from './bases.hbs';

export default {
  title: 'Partials/Bases',
  argTypes: {
    runners: {
      control: {
        type: 'array',
      },
    },
  },
  render: (args) => template(args),
};

export const Default = { args: { runners: [1, 3] } };
