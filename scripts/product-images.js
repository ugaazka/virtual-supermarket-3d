import {writeFileSync,mkdirSync} from 'node:fs';
import {seedProducts} from '../server/seed.js';
import {productSvg} from '../shared/artwork.js';
mkdirSync(new URL('../public/products/',import.meta.url),{recursive:true});
seedProducts.forEach((p,i)=>writeFileSync(new URL(`../public/products/product-${i+1}.svg`,import.meta.url),productSvg(p)));
