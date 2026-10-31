export const DEPARTMENTS = ['Produce', 'Drinks', 'Dairy', 'Snacks', 'Pantry', 'Cleaning', 'Personal care', 'Household'];
export const SHAPES = ['bottle', 'carton', 'can', 'bag', 'box', 'apple', 'banana', 'orange', 'pump', 'roll'];
export const SHELVES = DEPARTMENTS.map((category, id) => ({ id: `aisle-${id + 1}`, category, x: [-9, -3, 3, 9][id % 4], z: id < 4 ? -7 : 3, width: 1.6, length: 6 }));
export const COUNTERS = [{ x: -6, z: 12, width: 3.4, length: 2 }, { x: 6, z: 12, width: 3.4, length: 2 }];
export const OBSTACLES = [...SHELVES, ...COUNTERS, {x:-11,z:12,width:1.6,length:2.4}, {x:-11.7,z:-14,width:1.3,length:1.3}, {x:11.7,z:-14,width:1.3,length:1.3}];
export const EYE_HEIGHT = 1.68;
export const REACH = 2.8;
export function blocked(x, z, obstacles = OBSTACLES, radius = .3) {
  if (Math.abs(x) > 12.7 - radius || Math.abs(z) > 16 - radius) return true;
  return obstacles.some(o => Math.abs(x - o.x) < o.width / 2 + radius && Math.abs(z - o.z) < o.length / 2 + radius);
}
// Small substeps prevent tunnelling; separate axes allow sliding along fixtures.
export function movePlayer(position, dx, dz, obstacles = OBSTACLES) {
  let {x, z} = position;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / .12));
  for (let i = 0; i < steps; i++) {
    if (!blocked(x + dx / steps, z, obstacles)) x += dx / steps;
    if (!blocked(x, z + dz / steps, obstacles)) z += dz / steps;
  }
  return {x, z};
}
export function lookAngles(yaw, pitch, dx, dy, sensitivity = .0022) {
  return {yaw: yaw - dx * sensitivity, pitch: Math.max(-1.25, Math.min(1.25, pitch - dy * sensitivity))};
}
export function placement(shelfId, slot) {
  const shelf = SHELVES.find(s => s.id === shelfId) || SHELVES[0];
  const side = slot < 9 ? 1 : -1;
  return {position: [shelf.x + side * .65, .47 + Math.floor((slot % 9) / 3) * .65, shelf.z - 2 + (slot % 3) * 2], rotation: side * Math.PI / 2};
}
export function assignPlacements(products) {
  const used = new Set();
  const result = [];
  const unplaced = [];
  for (const p of products) {
    const preferred = p.shelfId || SHELVES.find(s => s.category === p.category)?.id || 'aisle-1';
    const candidates = [preferred, ...SHELVES.map(s => s.id).filter(id => id !== preferred)];
    let assigned;
    for (const shelfId of candidates) {
      const slots = Number.isInteger(p.shelfSlot) ? [p.shelfSlot, ...Array.from({length:18},(_,i)=>i).filter(i=>i!==p.shelfSlot)] : Array.from({length:18},(_,i)=>i);
      const slot = slots.find(i => i >= 0 && i < 18 && !used.has(`${shelfId}:${i}`));
      if (slot !== undefined) { used.add(`${shelfId}:${slot}`); assigned = {product:p,shelfId,slot,...placement(shelfId,slot)}; break; }
    }
    if (assigned) result.push(assigned); else unplaced.push(p);
  }
  return {placed:result,unplaced};
}
export function sanitizeCart(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([id,q]) => id.length < 100 && Number.isSafeInteger(q) && q > 0 && q <= 100));
}
