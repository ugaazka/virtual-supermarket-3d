import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser',timeout:90000,expect:{timeout:15000},fullyParallel:false,workers:1,
 reporter:[['list'],['html',{open:'never'}]],
 use:{baseURL:'http://127.0.0.1:5180',viewport:{width:1440,height:1000},launchOptions:{channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']},trace:'retain-on-failure',screenshot:'only-on-failure'},
 webServer:[
  {command:'node server/index.js',url:'http://127.0.0.1:3107/api/health',reuseExistingServer:false,env:{PORT:'3107',NODE_ENV:'test',MONGODB_URI:'',JWT_SECRET:'test-secret-for-isolated-browser-tests-only-123456',ADMIN_PASSWORD:'browser-test-password'},timeout:20000},
  {command:'npm run build -- --mode test --outDir .browser-dist && npm exec -- vite preview --outDir .browser-dist --host 127.0.0.1 --port 5180 --strictPort',url:'http://127.0.0.1:5180',reuseExistingServer:false,env:{API_PROXY_TARGET:'http://127.0.0.1:3107'},timeout:60000}
 ]
});
