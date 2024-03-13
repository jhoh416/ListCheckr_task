function isNotNullOrUndefined(value) {
  return value !== null && value !== undefined;
}

function isNotBlank(value) {
  return value.trim() !== '';
}

function isNotDuplicated(value, existingValues) {
  return isNotNullOrUndefined(value) && !existingValues.includes(value);
}

module.exports = { isNotNullOrUndefined, isNotBlank, isNotDuplicated};