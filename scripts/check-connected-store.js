import 'dotenv/config';
import assert from 'node:assert/strict';
import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({baseURL:'http://localhost:5174',viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!(m.location().url.endsWith('/api/auth/me')&&m.text().includes('401')))errors.push(m.text());});
 await page.goto('http://localhost:5174/');
 await page.waitForFunction(()=>!document.querySelector('.loading-store')&&document.querySelector('canvas')?.dataset.position);
 const health=await (await page.request.get('/api/health')).json();assert.equal(health.persistent,true);
 const products=await (await page.request.get('/api/products')).json();assert.ok(products.length>0);assert.ok(products.every(p=>/^[a-f0-9]{24}$/.test(p._id)));
 assert.equal(await page.locator('.demo-note').count(),0);
 await page.screenshot({path:'artifacts/store-connected-atlas.png'});
 await page.getByRole('button',{name:'Admin',exact:true}).click();await page.getByLabel('Admin password').fill(process.env.ADMIN_PASSWORD);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('heading',{name:'Inventory & shelf placement'}).waitFor();
 await expect(page.locator('tbody tr')).toHaveCount(products.length);
 await page.getByRole('button',{name:'Log out',exact:true}).click();
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({liveStore:'passed',persistent:true,databaseProductIDs:'passed',adminLogin:'passed',inventoryRows:products.length,criticalBrowserErrors:errors.length}));
}finally{await browser.close();}
