// Combined input check
export function isKeyPressed(gThis, key) {
  return gThis.spriteGarden?.keys[key] || gThis.spriteGarden?.touchKeys[key];
}
