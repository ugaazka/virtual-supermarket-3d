import {SHELVES} from '../shared/store.js';
const rows = [
 ['Red Apples','Produce',3.8,60,'apple','#bb4540','Crisp red apples, 1 kg'],
 ['Fresh Bananas','Produce',2.5,80,'banana','#e2bf41','Naturally sweet bananas, 1 kg'],
 ['Sweet Oranges','Produce',3.2,48,'orange','#d88a35','Fresh oranges, 1 kg'],
 ['Bottled Water','Drinks',.7,120,'bottle','#65a1b5','Mineral water, 500 ml'],
 ['Orange Juice','Drinks',2.2,65,'bottle','#d88739','Orange fruit juice, 1 L'],
 ['Sparkling Soda','Drinks',1.1,75,'can','#b54b43','Refreshing sparkling drink, 330 ml'],
 ['Fresh Milk','Dairy',1.7,55,'carton','#6598a7','Fresh dairy milk, 1 L'],
 ['Natural Yogurt','Dairy',2.4,35,'can','#778d60','Plain natural yogurt, 400 g'],
 ['Farm Eggs','Dairy',3.2,45,'box','#b5a080','Six fresh farm eggs'],
 ['Butter Biscuits','Snacks',2.6,42,'box','#bf8c43','Golden butter biscuits, 250 g'],
 ['Potato Crisps','Snacks',1.8,64,'bag','#b96043','Sea salt potato crisps, 150 g'],
 ['Fresh Bread','Snacks',1.5,44,'bag','#b99664','Freshly baked bread loaf'],
 ['Basmati Rice','Pantry',9.9,38,'bag','#a79b60','Premium basmati rice, 5 kg'],
 ['Wheat Flour','Pantry',3.6,42,'bag','#b5a483','All-purpose wheat flour, 2 kg'],
 ['Pasta Penne','Pantry',2.1,56,'box','#b98c47','Durum wheat penne, 500 g'],
 ['Olive Oil','Pantry',6.5,31,'bottle','#637c44','Extra virgin olive oil, 500 ml'],
 ['Laundry Detergent','Cleaning',4.4,28,'bottle','#648c91','Laundry liquid, 1 L'],
 ['Dishwashing Liquid','Cleaning',2.3,37,'pump','#6b996c','Lemon dishwashing liquid, 500 ml'],
 ['Surface Cleaner','Cleaning',3.1,22,'bottle','#7a96a2','Everyday surface cleaner, 750 ml'],
 ['Hand Wash','Personal care',2.8,42,'pump','#b49891','Gentle hand wash, 300 ml'],
 ['Daily Shampoo','Personal care',4.8,30,'bottle','#687c9a','Daily care shampoo, 400 ml'],
 ['Bar Soap','Personal care',1.2,73,'box','#86a58c','Mild cleansing bar, 100 g'],
 ['Paper Towels','Household',2.8,42,'roll','#c1c4ad','Absorbent kitchen paper, one roll'],
 ['Storage Bags','Household',2.5,35,'box','#809078','Reusable food storage bags, pack of 20'],
];
const counts={};
export const seedProducts=rows.map(([name,category,price,stock,shape,color,description],i)=>({name,category,price,stock,shape,color,description,image:`/products/product-${i+1}.svg`,shelfId:SHELVES.find(s=>s.category===category).id,shelfSlot:counts[category]=(counts[category]??-1)+1,active:true}));
