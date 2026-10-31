import {test,expect,devices} from '@playwright/test';
const camera=async page=>JSON.parse(await page.locator('.game-viewport canvas').getAttribute('data-position'));
async function ready(page){await page.goto('/');await expect(page.locator('.loading-store')).toHaveCount(0,{timeout:45000});await expect(page.locator('.game-viewport canvas')).toHaveAttribute('data-position',/.+/);await page.getByRole('button',{name:'Dismiss welcome'}).click();}
async function walkUntil(page,key,check){await page.keyboard.down(key);try{await page.waitForFunction(check,null,{timeout:30000});}finally{await page.keyboard.up(key);}await page.waitForTimeout(350);}
test('desktop world: WASD, real mouse-look, collision, pickup and overlay pause',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await ready(page);
 const canvas=page.locator('.game-viewport canvas');await canvas.click({position:{x:720,y:450}});
 await expect.poll(()=>page.evaluate(()=>!!document.pointerLockElement)).toBe(true);
 const before=await camera(page);
 await walkUntil(page,'w',()=>JSON.parse(document.querySelector('canvas').dataset.position)[2]<3.2);
 const after=await camera(page);expect(after[2]).toBeLessThan(before[2]-8);expect(after[1]).toBe(1.68);
 await walkUntil(page,'s',()=>JSON.parse(document.querySelector('canvas').dataset.position)[2]>3.8);
 await walkUntil(page,'w',()=>JSON.parse(document.querySelector('canvas').dataset.position)[2]<3.1);
 await walkUntil(page,'a',()=>JSON.parse(document.querySelector('canvas').dataset.position)[0]<-.4);
 await walkUntil(page,'d',()=>JSON.parse(document.querySelector('canvas').dataset.position)[0]>1.6);
 await page.keyboard.down('d');await page.waitForTimeout(1500);await page.keyboard.up('d');
 const blocked=await camera(page);expect(blocked[0]).toBeLessThan(1.91);
 const rotation=JSON.parse(await canvas.getAttribute('data-rotation'));
 await page.mouse.move(900,530);await page.mouse.move(1220,570,{steps:8});
 await expect.poll(async()=>JSON.parse(await canvas.getAttribute('data-rotation'))[1]).not.toBe(rotation[1]);
 // Look at the lower/middle products on the shelf to the right.
 await page.keyboard.press('Escape');await expect.poll(()=>page.evaluate(()=>document.pointerLockElement===null)).toBe(true);
 // Drag-look also works when pointer lock is unavailable, including HTTP LAN URLs.
 const rect=await canvas.boundingBox();
 const [pitch,yaw]=JSON.parse(await canvas.getAttribute('data-rotation'));
 const position=await camera(page);const dx=2.21-position[0],dz=3-position[2];
 const desired=Math.atan2(-dx,-dz),desiredPitch=Math.atan2(1.4-position[1],Math.hypot(dx,dz));
 const delta=(yaw-desired)/.004,deltaY=(pitch-desiredPitch)/.004;
 await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.down();await page.mouse.move(rect.x+rect.width/2+delta,rect.y+rect.height/2+deltaY,{steps:10});await page.mouse.up();
 await expect.poll(()=>canvas.getAttribute('data-target'),{timeout:10000}).not.toBe('');
 const id=await canvas.getAttribute('data-target');
 await page.keyboard.press('e');await expect(page.getByRole('dialog',{name:'Product details'})).toBeVisible();
 const inventory=await (await page.request.get('/api/products')).json();const record=inventory.find(p=>p._id===id);expect(record).toBeTruthy();await expect(page.getByRole('heading',{name:record.name,exact:true})).toBeVisible();
 const paused=await camera(page);await page.keyboard.down('w');await page.waitForTimeout(700);await page.keyboard.up('w');expect(await camera(page)).toEqual(paused);
 await page.screenshot({path:'artifacts/product-inspection.png'});
 await page.getByRole('button',{name:'Close Product details'}).click();
 await canvas.click({position:{x:rect.width/2,y:rect.height/2}});
 await expect(page.getByRole('dialog',{name:'Product details'})).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>document.pointerLockElement===null)).toBe(true);
 await page.getByRole('button',{name:'Add to cart',exact:true}).click();await expect(page.locator('.cart-trigger b')).toHaveText('1');
 await page.keyboard.press('c');await expect(page.getByRole('dialog',{name:'Your cart'})).toBeVisible();await page.keyboard.press('Escape');
 await page.screenshot({path:'artifacts/store-desktop.png'});expect(errors).toEqual([]);
});
test('cart persistence, quantity, checkout receipt and manual-payment state',async({page})=>{
 await ready(page);await page.getByRole('button',{name:'Open product list'}).click();
 await page.getByRole('button',{name:/Bottled Water/}).click();await page.getByRole('button',{name:'Increase Quantity',exact:true}).click();await page.getByRole('button',{name:'Add to cart',exact:true}).click();await expect(page.locator('.cart-trigger b')).toHaveText('2');
 await page.reload();await expect(page.locator('.cart-trigger b')).toHaveText('2');await page.locator('.cart-trigger').click();
 await expect(page.getByRole('dialog',{name:'Your cart'})).toBeVisible();await page.getByRole('button',{name:'Increase Bottled Water',exact:true}).click();await expect(page.locator('.quantity output')).toHaveText('3');await page.getByRole('button',{name:'Continue to checkout'}).click();
 await page.getByLabel('Your name').fill('Aamina Browser');await page.getByLabel('Phone number').fill('0612345678');await page.getByLabel('Delivery address').fill('Test address, Mogadishu');await page.getByLabel('Payment method').selectOption('evc');await expect(page.getByText('Payment remains pending',{exact:false})).toBeVisible();await page.getByLabel('Transaction reference').fill('BROWSER-TEST');await page.getByRole('button',{name:/Place order/}).click();
 await expect(page.getByRole('dialog',{name:'Order received'})).toBeVisible();await expect(page.getByText('pending (not yet verified)',{exact:true})).toBeVisible();await expect(page.locator('.cart-trigger b')).toHaveText('0');
});
test('admin login, image upload, inventory changes reflected in world and deletion',async({page})=>{
 await ready(page);await page.getByRole('button',{name:'Admin',exact:true}).click();await page.getByLabel('Admin password').fill('browser-test-password');await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.getByRole('heading',{name:'Inventory & shelf placement'})).toBeVisible();
 await page.getByLabel('Name',{exact:true}).fill('Browser Test Cleaner');await page.getByLabel('Category',{exact:true}).selectOption('Cleaning');await page.getByLabel('Price (USD)').fill('3.75');await page.getByLabel('Stock',{exact:true}).fill('12');await page.getByLabel('Product shape').selectOption('pump');await page.getByLabel('Description',{exact:true}).fill('Created in an isolated browser test');
 await page.getByLabel('Product image (PNG').setInputFiles({name:'test.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a30sAAAAASUVORK5CYII=','base64')});
 await expect(page.locator('.upload-field img')).toBeVisible();await page.getByRole('button',{name:'Add product',exact:true}).click();await expect(page.getByText('Product created.',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Edit Browser Test Cleaner',exact:true}).click();await page.getByLabel('Price (USD)').fill('4.25');await page.getByRole('button',{name:'Save changes'}).click();await expect(page.getByText('Product updated.',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Return to store',exact:true}).click();await page.getByRole('button',{name:'Open product list'}).click();await page.getByRole('button',{name:/Browser Test Cleaner/}).click();await expect(page.getByRole('heading',{name:'Browser Test Cleaner'})).toBeVisible();await expect(page.getByText('$4.25',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Close Product details'}).click();await page.getByRole('button',{name:'Admin',exact:true}).click();page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Remove Browser Test Cleaner',exact:true}).click();await expect(page.getByRole('button',{name:'Edit Browser Test Cleaner'})).toHaveCount(0);
 await page.getByRole('button',{name:'Orders',exact:true}).click();await expect(page.getByText('Aamina Browser',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Log out',exact:true}).click();await expect(page.getByRole('button',{name:'Sign in',exact:true})).toBeVisible();
});
test('API failure remains recoverable and does not blank the scene',async({page})=>{
 await page.route('**/api/products',route=>route.fulfill({status:503,body:JSON.stringify({error:'Store offline for test'}),contentType:'application/json'}));await page.goto('/');await expect(page.getByRole('alert')).toContainText('Store offline for test');await expect(page.locator('.game-viewport canvas')).toBeVisible();await page.unroute('**/api/products');await page.getByRole('button',{name:'Retry',exact:true}).click();await expect(page.getByRole('alert')).toHaveCount(0);await expect(page.getByText('24 products to discover',{exact:false})).toBeVisible();
});
test('mobile joystick and drag-look drive the actual camera; panels fit',async({browser})=>{
 const context=await browser.newContext({...devices['iPhone 13'],isMobile:true,hasTouch:true});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await ready(page);await expect(page.locator('.joystick')).toBeVisible();
 const initial=await camera(page);const stick=await page.locator('.joystick').boundingBox();const x=stick.x+stick.width/2,y=stick.y+20;
 const touch=await context.newCDPSession(page);
 await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
 await expect.poll(async()=> (await camera(page))[2],{timeout:10000}).toBeLessThan(initial[2]-.5);
 await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 const canvas=page.locator('.game-viewport canvas');const rotation=JSON.parse(await canvas.getAttribute('data-rotation'));
 await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:250,y:300,id:2}]});await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:330,y:330,id:2}]});await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect.poll(async()=>JSON.parse(await canvas.getAttribute('data-rotation'))[1]).not.toBe(rotation[1]);
 await page.screenshot({path:'artifacts/store-mobile.png'});await page.getByRole('button',{name:'Open product list'}).click();await page.getByRole('button',{name:/Bottled Water/}).click();await page.getByRole('button',{name:'Add to cart',exact:true}).click();await page.locator('.cart-trigger').click();const panel=await page.getByRole('dialog',{name:'Your cart'}).boundingBox();expect(panel.x).toBeGreaterThanOrEqual(0);expect(panel.width).toBeLessThanOrEqual(390);expect(errors).toEqual([]);await context.close();
});
