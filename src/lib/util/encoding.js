export function bufToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.byteLength; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

export function bufToHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function bufToHexGroups(buf, group = 2, max = 32) {
  const hex = bufToHex(buf).slice(0, max * 2);
  const out = [];
  for (let i = 0; i < hex.length; i += group) out.push(hex.slice(i, i + group));
  return out.join(':').toUpperCase();
}

export function textToBuf(text) {
  return new TextEncoder().encode(text);
}

export function bufToText(buf) {
  return new TextDecoder().decode(buf);
}

export function truncate(text, head = 24, tail = 8) {
  if (text.length <= head + tail + 1) return text;
  return `${text.slice(0, head)}…${text.slice(-tail)}`;
}
