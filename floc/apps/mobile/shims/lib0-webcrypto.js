const fill = (array) => {
  for (let i = 0; i < array.length; i += 1) array[i] = Math.floor(Math.random() * 2 ** (array.BYTES_PER_ELEMENT * 8)); // NOSONAR
  return array;
};

const native = globalThis.crypto;

exports.getRandomValues = native?.getRandomValues ? native.getRandomValues.bind(native) : fill;
exports.subtle = native?.subtle;
