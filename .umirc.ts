import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {
    title: '金仕达到飞马费率转换',
  },
  routes: [
    {
      path: '/',
      redirect: '/exchangeFee',
    },
    {
      name: '交易所手续费率',
      path: '/exchangeFee',
      component: './ExchangeFee',
    },
    {
      name: ' CRUD 示例',
      path: '/table',
      component: './Table',
    },
  ],
  npmClient: 'pnpm',
});
