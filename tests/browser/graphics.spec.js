import {test,expect} from '@playwright/test';

test('disabled WebGL explains Chrome settings and keeps shopping available',async({page})=>{
 await page.addInitScript(()=>{
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type,...args){
   if(['webgl','webgl2','experimental-webgl'].includes(type))return null;
   return original.call(this,type,...args);
  };
 });
 await page.goto('/');
 await expect(page.getByRole('heading',{name:'3D graphics could not start'})).toBeVisible();
 await expect(page.getByText('chrome://settings/system',{exact:true})).toBeVisible();
 await expect(page.locator('.game-controls')).toHaveCount(0);
 await page.getByRole('button',{name:'Shop product list'}).click();
 await expect(page.getByRole('dialog',{name:'Product list'})).toBeVisible();
});

test('supported WebGL renders the world without triggering the hidden canvas fallback',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');
 await expect(page.locator('.game-viewport canvas')).toHaveAttribute('data-position',/.+/);
 await expect(page.locator('.game-controls')).toBeVisible();
 await expect(page.getByRole('heading',{name:'3D graphics could not start'})).toHaveCount(0);
 expect(errors).toEqual([]);
});
