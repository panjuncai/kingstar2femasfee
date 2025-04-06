import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {
    title: '金仕达到飞马费率转换',
    LogoIcon:
      'http://www.cffexdt.com.cn/r/cms/www/cffexdt/images/software/%E9%A3%9E%E9%A9%AC%E5%BC%80%E6%94%BE%E6%9F%9C%E5%8F%B0_logo@1x.png',
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
      name: '飞马客户手续费率',
      path: '/femasClientFee',
      component: './FemasClientFee',
    },
    {
      name: '金仕达客户手续费率',
      path: '/kingStarClientFee',
      component: './KingStarClientFee',
    },
  ],
  npmClient: 'pnpm',
});
